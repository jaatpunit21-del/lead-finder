const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const whatsapp = require('./whatsapp');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

/**
 * Extract unique Google Place ID or CID from URL
 */
function getGoogleMapsId(url) {
    if (!url) return '';
    const placeIdMatch = url.match(/19s([A-Za-z0-9_-]{27})/);
    if (placeIdMatch) return placeIdMatch[1];
    const cidMatch = url.match(/0x[a-f0-9]+:0x([a-f0-9]+)/i);
    if (cidMatch) return cidMatch[1];
    const pathMatch = url.match(/\/maps\/place\/.*?(ChIJ[A-Za-z0-9_-]{23})/);
    if (pathMatch) return pathMatch[1];
    return url.split('?')[0].split('#')[0].replace(/\/@.*?\//, '/').trim();
}

let activeBrowser = null;
let stopScrapingRequested = false;
let pauseScrapingRequested = false;

function stopScraping() {
    stopScrapingRequested = true;
    pauseScrapingRequested = false;
    if (activeBrowser) {
        activeBrowser.close().catch(() => {});
        activeBrowser = null;
    }
}

function pauseScraping() {
    pauseScrapingRequested = true;
}

function resumeScraping() {
    pauseScrapingRequested = false;
}

/**
 * Configures Puppeteer page request interception to block images, fonts, media, and trackers
 */
async function configurePage(page, isDetailWorker = true) {
    try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.setRequestInterception(true);
        
        page.on('request', (req) => {
            try {
                if (page.isClosed()) return;
                const resourceType = req.resourceType();
                const url = req.url().toLowerCase();
                
                const blockDomains = [
                    'google-analytics.com',
                    'doubleclick.net',
                    'googleadservices.com',
                    'googlesyndication.com',
                    'analytics',
                    'telemetry'
                ];
                
                const isTracker = blockDomains.some(domain => url.includes(domain));
                if (isTracker) {
                    req.abort().catch(() => {});
                    return;
                }

                if (['image', 'font', 'media'].includes(resourceType)) {
                    req.abort().catch(() => {});
                } else {
                    req.continue().catch(() => {});
                }
            } catch (err) {
                // Ignore errors from closed pages
            }
        });
    } catch (e) {
        console.warn('Failed to configure page request interception:', e.message);
    }
}

/**
 * Scrapes Google Maps for a given query, filters results, and yields them
 */
async function scrapeGoogleMaps({
    niche,
    location,
    minReviews = 0,
    maxReviews = Infinity,
    maxResults = 50,
    headless = true,
    websiteFilter = 'none',
    onProgress = () => {},
    onData = () => {},
    existingUrls = new Set()
}) {
    stopScrapingRequested = false;
    pauseScrapingRequested = false;
    let browser = null;

    try {
        onProgress('Launching browser...', 5);
        // Detect local Google Chrome installation on Windows to utilize the user's Chrome execution context
        const chromePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
        ];
        let executablePath = undefined;
        for (const p of chromePaths) {
            if (fs.existsSync(p)) {
                executablePath = p;
                break;
            }
        }

        const scraperProfilePath = path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\User Data Scraper');

        browser = await puppeteer.launch({
            headless: headless ? 'new' : false,
            executablePath: executablePath,
            userDataDir: scraperProfilePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-gpu',
                '--disable-extensions',
                '--blink-settings=imagesEnabled=false',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-translate',
                '--disable-sync',
                '--disable-notifications',
                '--mute-audio',
                '--no-first-run',
                '--hide-scrollbars'
            ]
        });

        activeBrowser = browser;
        const targetLocations = Array.isArray(location) ? location : [location];
        let leadsScrapedCount = 0;
        const sessionGatheredIds = new Set(existingUrls);
        let limitedViewLogged = false;

        for (let i = 0; i < targetLocations.length; i++) {
            if (stopScrapingRequested) break;
            if (leadsScrapedCount >= maxResults) break;
            
            // Pause check
            while (pauseScrapingRequested && !stopScrapingRequested) {
                await new Promise(r => setTimeout(r, 1000));
            }
            if (stopScrapingRequested) break;

            const currentLoc = targetLocations[i];
            
            // Calculate progress boundaries for this city
            const startPercent = Math.floor((i / targetLocations.length) * 100);
            const endPercent = Math.floor(((i + 1) / targetLocations.length) * 100);
            const range = endPercent - startPercent;

            onProgress(`[${i + 1}/${targetLocations.length}] Starting scan in ${currentLoc}...`, startPercent + 1);

            const page = await browser.newPage();
            await configurePage(page, false);

            const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(niche + ' in ' + currentLoc)}`;
            onProgress(`[${currentLoc}] Navigating to search page...`, startPercent + 2);
            
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(async (err) => {
                console.warn(`[${currentLoc}] Navigation took too long, proceeding:`, err.message);
            });

            // Check for limited view
            if (!limitedViewLogged) {
                const isLimitedView = await page.evaluate(() => {
                    return document.body.textContent.includes('limited view') || 
                           !!document.querySelector('button[aria-label*="limited view"]');
                });
                if (isLimitedView) {
                    onProgress('⚠️ Google Maps is in "Limited View" (not signed in). Reviews count is hidden by Google and will default to 0.', startPercent + 5);
                    limitedViewLogged = true;
                }
            }

            if (stopScrapingRequested) {
                await page.close().catch(() => {});
                break;
            }

            // Check if redirected to a single place page directly
            const currentUrl = page.url();
            if (currentUrl.includes('/maps/place/')) {
                onProgress(`[${currentLoc}] Redirected directly to single business page...`, startPercent + 5);
                const business = await extractPlaceDetails(page, currentUrl);
                if (business) {
                    business.locationScraped = currentLoc;
                    const passFilters = validateFilters(business, minReviews, maxReviews, websiteFilter);
                    if (passFilters) {
                        leadsScrapedCount++;
                        onData(business);
                    } else {
                        if (!business.phone) {
                            business.discarded = true;
                            business.discardReason = "No phone number";
                            onData(business);
                        }
                    }
                }
                await page.close().catch(() => {});
                
                if (leadsScrapedCount >= maxResults) {
                    onProgress(`Reached target limit of ${maxResults} valid leads. Finishing scan.`, 100);
                    break;
                }
                continue;
            }

            // Wait for results container
            const feedSelector = 'div[role="feed"]';
            const feedExists = await page.waitForSelector(feedSelector, { timeout: 10000 }).catch(() => null);

            if (!feedExists) {
                onProgress(`[${currentLoc}] No listings container found. Skipping location.`, startPercent + 10);
                await page.close().catch(() => {});
                continue;
            }

            // Scroll the results sidebar to gather place links
            onProgress(`[${currentLoc}] Scrolling search results to gather links...`, startPercent + 10);
            const remainingTarget = maxResults - leadsScrapedCount;
            if (remainingTarget <= 0) {
                await page.close().catch(() => {});
                break;
            }

            const { newLinks, duplicatesCount } = await gatherPlaceLinks(page, feedSelector, remainingTarget, sessionGatheredIds, (msg, percent) => {
                // Interpolate scroll progress: 30% of the city's range
                const stepPercent = startPercent + Math.floor((percent / 100) * range * 0.3);
                onProgress(`[${currentLoc}] ${msg}`, stepPercent);
            });

            if (duplicatesCount > 0) {
                onProgress(`[${currentLoc}] Skipped ${duplicatesCount} duplicates already in history/session.`, startPercent + 15);
            }

            await page.close().catch(() => {});

            if (stopScrapingRequested) break;

            if (newLinks.length > 0) {
                onProgress(`[${currentLoc}] Found ${newLinks.length} new listings. Extracting details...`, startPercent + Math.floor(range * 0.3));

                // Extract details in parallel for this city's links
                let processedCount = 0;
                let linkIndex = 0;
                const concurrency = Math.min(10, newLinks.length);

                async function worker(workerId, pageInstance) {
                    let page = pageInstance;
                    let navCount = 0;
                    while (linkIndex < newLinks.length && !stopScrapingRequested && leadsScrapedCount < maxResults) {
                        const url = newLinks[linkIndex++];
                        if (!url) break;

                        // Pause check
                        while (pauseScrapingRequested && !stopScrapingRequested) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                        if (stopScrapingRequested) break;

                        processedCount++;
                        // Calculate detail extraction progress: 70% of the city's range
                        const progressPercent = startPercent + Math.floor(range * 0.3) + Math.floor((processedCount / newLinks.length) * range * 0.7);
                        onProgress(`[Tab ${workerId}] Processing item ${processedCount}/${newLinks.length}: ${url.substring(0, 45)}...`, progressPercent);

                        try {
                            // Recreate page if needed (to prevent memory bloat)
                            navCount++;
                            if (navCount > 50 || page.isClosed()) {
                                try {
                                    await page.close().catch(() => {});
                                } catch (e) {}
                                page = await browser.newPage();
                                await configurePage(page, true);
                                navCount = 1;
                            }

                            const business = await extractPlaceDetails(page, url);
                            if (business) {
                                business.locationScraped = currentLoc;
                                const passFilters = validateFilters(business, minReviews, maxReviews, websiteFilter);
                                if (passFilters) {
                                    leadsScrapedCount++;
                                    onData(business);
                                } else {
                                    // If it failed because it has NO phone number, send it as discarded to save to database
                                    if (!business.phone) {
                                        business.discarded = true;
                                        business.discardReason = "No phone number";
                                        onData(business);
                                    }

                                    const reasons = [];
                                    if (!business.phone) reasons.push("No phone number");
                                    if (websiteFilter === 'none' && business.website) reasons.push("Has website");
                                    if (websiteFilter === 'must' && !business.website) reasons.push("No website");
                                    if (business.reviewsCount < minReviews || business.reviewsCount > maxReviews) {
                                        reasons.push(`Reviews count (${business.reviewsCount}) not in range [${minReviews}-${maxReviews === Infinity ? '∞' : maxReviews}]`);
                                    }
                                    onProgress(`[Tab ${workerId}] Discarded "${business.name}" (${reasons.join(', ')})`, progressPercent);
                                }
                            } else {
                                onProgress(`[Tab ${workerId}] Failed to extract details for item ${processedCount}`, progressPercent);
                            }
                        } catch (err) {
                            console.error(`[Tab ${workerId}] Error processing listing ${url}:`, err);
                            if (err.message.includes('detached') || err.message.includes('crashed') || err.message.includes('closed') || err.message.includes('Session closed')) {
                                onProgress(`[Tab ${workerId}] Tab crashed or frame detached. Recreating page...`, progressPercent);
                                try {
                                    await page.close().catch(() => {});
                                } catch (e) {}
                                try {
                                    page = await browser.newPage();
                                    await configurePage(page, true);
                                    navCount = 1;
                                } catch (recreateErr) {
                                    console.error(`[Tab ${workerId}] Failed to recreate page after crash:`, recreateErr);
                                }
                            }
                        }

                        // Delay with randomized jitter
                        const delay = 300 + Math.floor(Math.random() * 500);
                        await new Promise(r => setTimeout(r, delay));
                    }
                    if (page) {
                        await page.close().catch(() => {});
                    }
                }

                // Spawn parallel worker promises for this city
                const workerPromises = [];
                for (let j = 1; j <= concurrency; j++) {
                    if (stopScrapingRequested || leadsScrapedCount >= maxResults) break;
                    const newPage = await browser.newPage();
                    await configurePage(newPage, true);
                    workerPromises.push(worker(j, newPage));
                }

                await Promise.all(workerPromises);
            }

            if (leadsScrapedCount >= maxResults) {
                onProgress(`Reached target limit of ${maxResults} valid leads. Finishing scan.`, 100);
                break;
            }
        }

        if (!stopScrapingRequested && leadsScrapedCount < maxResults) {
            onProgress('Scraping completed successfully.', 100);
        }

    } catch (error) {
        console.error('Scraping error:', error);
        onProgress(`Error during scraping: ${error.message}`, 100);
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
        activeBrowser = null;
    }
}

/**
 * Scroll and collect place links
 */
async function gatherPlaceLinks(page, feedSelector, maxResults, existingUrls, onProgress) {
    let links = new Set();
    let duplicates = new Set();
    let gatheredIds = new Set();
    let scrollAttempts = 0;
    const maxScrollAttempts = 35; // prevent infinite loops
    let lastLength = 0;

    while (links.size < maxResults && scrollAttempts < maxScrollAttempts) {
        if (stopScrapingRequested) break;

        // Pause check
        while (pauseScrapingRequested && !stopScrapingRequested) {
            await new Promise(r => setTimeout(r, 1000));
        }

        if (stopScrapingRequested) break;

        // Extract currently visible links in the DOM
        const visibleLinks = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
            return anchors.map(a => a.href);
        });

        visibleLinks.forEach(link => {
            const id = getGoogleMapsId(link);
            if (existingUrls.has(id)) {
                duplicates.add(id);
                return;
            }
            if (gatheredIds.has(id)) {
                return;
            }
            if (links.size < maxResults) {
                gatheredIds.add(id);
                existingUrls.add(id);
                const cleaned = link.split('?')[0].split('#')[0].trim();
                links.add(cleaned);
            }
        });

        if (links.size >= maxResults) break;

        // Scroll feed down
        const isEnd = await page.evaluate((selector) => {
            const feed = document.querySelector(selector);
            if (!feed) return true;
            
            feed.scrollBy(0, 3000);
            
            // Check for end of list labels
            const endLabels = ["You've reached the end of the list", "End of list", "No more results"];
            const textContent = feed.textContent || "";
            return endLabels.some(label => textContent.includes(label));
        }, feedSelector);

        if (isEnd && links.size === lastLength) {
            // Wait extra just in case it is loading slowly
            await new Promise(r => setTimeout(r, 2000));
            scrollAttempts++;
            continue;
        }

        lastLength = links.size;
        scrollAttempts++;
        onProgress(`Gathered ${links.size} new listing links...`, 20 + Math.min(scrollAttempts * 0.5, 15));
        
        await new Promise(r => setTimeout(r, 250));
    }

    return {
        newLinks: Array.from(links),
        duplicatesCount: duplicates.size
    };
}

/**
 * Navigate to a place URL and parse details
 */
async function extractPlaceDetails(page, url) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait up to 5s for the page title to load (first confirmation details pane loaded)
        await page.waitForSelector('h1', { timeout: 6000 }).catch(() => null);

        // Wait up to 3s for details pane elements (phone/website) to populate
        await page.waitForFunction(() => {
            const hasPhone = !!document.querySelector('a[href^="tel:"], [data-item-id^="phone:tel:"]');
            const hasWebsite = !!document.querySelector('[data-item-id="authority"], a[aria-label*="website"i]');
            return hasPhone || hasWebsite;
        }, { timeout: 3000 }).catch(() => null);

        // Settle for 800ms
        await new Promise(r => setTimeout(r, 800));

        const details = await page.evaluate(() => {
            // 1. Name
            const nameEl = document.querySelector('h1');
            const name = nameEl ? nameEl.textContent.trim() : 'Unknown Business';

            // 2. Reviews Count
            let reviewsCount = 0;
            
            // Priority 1: Button with aria-label containing review/reviews
            const btn = document.querySelector('button[aria-label*="review"]');
            if (btn) {
                const label = btn.getAttribute('aria-label');
                const match = label.match(/([\d,]+)\s+reviews?/i);
                if (match) {
                    reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
                }
            }

            // Priority 2: F7nice container (reviews count in parentheses)
            if (!reviewsCount) {
                const f7 = document.querySelector('.F7nice');
                if (f7) {
                    const text = f7.textContent;
                    const match = text.match(/\(([\d,]+)\)/);
                    if (match) {
                        reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
                    }
                }
            }

            // Priority 3: Specific class (LQ7e0d), looking specifically for number in parentheses or matching "reviews"
            if (!reviewsCount) {
                const lqEl = document.querySelector('.LQ7e0d');
                if (lqEl && lqEl.textContent) {
                    let match = lqEl.textContent.match(/\(([\d,]+)\)/);
                    if (!match) {
                        match = lqEl.textContent.match(/([\d,]+)\s+reviews?/i);
                    }
                    if (match) {
                        reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
                    }
                }
            }

            // Priority 4: General DOM fallback for text matching "\d+ reviews" or "(\d+)"
            if (!reviewsCount) {
                const spans = Array.from(document.querySelectorAll('span, button, a'));
                for (const el of spans) {
                    const text = el.textContent.trim();
                    if (/^[\d,]+\s+reviews?$/i.test(text)) {
                        const match = text.match(/([\d,]+)/);
                        if (match) {
                            reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
                            break;
                        }
                    } else {
                        const match = text.match(/^\(([\d,]+)\)$/);
                        if (match) {
                            reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
                            break;
                        }
                    }
                }
            }


            // 3. Website
            let website = null;
            const authorityEl = document.querySelector('[data-item-id="authority"]');
            if (authorityEl) {
                const href = authorityEl.getAttribute('href') || authorityEl.querySelector('a')?.getAttribute('href');
                if (href) website = href.trim();
            }
            if (!website) {
                const webLink = document.querySelector('a[aria-label*="Website"], a[data-tooltip*="website"], a[aria-label*="website"]');
                if (webLink) {
                    const href = webLink.getAttribute('href');
                    if (href) website = href.trim();
                }
            }

            // 4. Phone Number
            let phone = null;
            const telLink = document.querySelector('a[href^="tel:"]');
            if (telLink) {
                phone = telLink.getAttribute('href').replace('tel:', '').trim();
            } else {
                const phoneBtn = document.querySelector('[data-item-id^="phone:tel:"]');
                if (phoneBtn) {
                    phone = phoneBtn.getAttribute('data-item-id').replace('phone:tel:', '').trim();
                }
            }
            if (!phone) {
                const phoneEl = document.querySelector('button[aria-label*="Phone:"], a[aria-label*="Phone:"]');
                if (phoneEl) {
                    const label = phoneEl.getAttribute('aria-label');
                    const match = label.match(/Phone:\s*(.+)$/i);
                    if (match) {
                        phone = match[1].trim();
                    }
                }
            }

            return {
                name,
                reviewsCount,
                website,
                phone
            };
        });

        details.url = url;

        // WhatsApp Check (Always verify WhatsApp status automatically)
        if (details.phone) {
            const verifyResult = await whatsapp.verifyNumber(details.phone);
            details.whatsappRegistered = verifyResult.registered;
            details.whatsappFormatted = verifyResult.formatted;
            details.whatsappLink = `https://wa.me/${details.whatsappFormatted}`;
        } else {
            details.whatsappRegistered = false;
            details.whatsappFormatted = '';
            details.whatsappLink = '';
        }

        return details;
    } catch (err) {
        console.error(`Error extracting place details from ${url}:`, err);
        if (err.message.includes('detached') || err.message.includes('crashed') || err.message.includes('closed') || err.message.includes('Session closed')) {
            throw err;
        }
        return null;
    }
}

/**
 * Filter out according to target rules:
 * - Must HAVE a phone number
 * - Must NOT HAVE a website
 * - Must be within review counts
 */
function validateFilters(business, minReviews, maxReviews, websiteFilter = 'none') {
    if (!business.phone) {
        return false; // MUST have phone number
    }
    
    // Website filter checks
    if (websiteFilter === 'none' && business.website) {
        return false; // MUST NOT have website
    }
    if (websiteFilter === 'must' && !business.website) {
        return false; // MUST have website
    }
    // if 'any', we bypass checking website!

    if (business.reviewsCount < minReviews || business.reviewsCount > maxReviews) {
        return false; // Must fit reviews filter
    }
    return true;
}

function isPaused() {
    return pauseScrapingRequested;
}

function isScrapingActive() {
    return activeBrowser !== null;
}

module.exports = {
    scrapeGoogleMaps,
    stopScraping,
    pauseScraping,
    resumeScraping,
    isPaused,
    isScrapingActive
};
