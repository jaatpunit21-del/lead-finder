const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
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
 * Configures Puppeteer page request interception to block heavy assets (images, fonts, media, trackers)
 */
async function configurePage(page) {
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
 * High-Speed Parallel Google Maps Scraper (30-40 leads/min target)
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
        onProgress('Launching browser engine...', 5);

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
        
        // 3. In-Memory Dedup Set: O(1) Place ID set loaded at startup
        const sessionGatheredIds = new Set(existingUrls);
        
        // Shared Atomic Queue for Parallel Tabs
        let locationQueueIndex = 0;
        function getNextLocation() {
            if (locationQueueIndex >= targetLocations.length) return null;
            const loc = targetLocations[locationQueueIndex];
            const index = locationQueueIndex;
            locationQueueIndex++;
            return { loc, index };
        }

        // 1. Parallel Tabs Setup: 3 concurrent city-worker tabs in parallel
        const NUM_PARALLEL_TABS = Math.min(3, targetLocations.length);
        onProgress(`[Parallel Engine] Initializing ${NUM_PARALLEL_TABS} parallel worker tabs for ${targetLocations.length} locations...`, 10);

        async function cityWorkerTab(tabId) {
            const page = await browser.newPage();
            await configurePage(page);

            while (!stopScrapingRequested && leadsScrapedCount < maxResults) {
                // Pause check
                while (pauseScrapingRequested && !stopScrapingRequested) {
                    await new Promise(r => setTimeout(r, 1000));
                }
                if (stopScrapingRequested) break;

                const item = getNextLocation();
                if (!item) break; // Queue exhausted

                const { loc: currentLoc, index: locIndex } = item;
                const startPercent = Math.floor((locIndex / targetLocations.length) * 100);
                const endPercent = Math.floor(((locIndex + 1) / targetLocations.length) * 100);
                const range = endPercent - startPercent;

                onProgress(`[Tab ${tabId}] Starting scan in ${currentLoc} (${locIndex + 1}/${targetLocations.length})...`, Math.min(99, startPercent + 1));

                try {
                    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(niche + ' in ' + currentLoc)}`;
                    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});

                    if (stopScrapingRequested) break;

                    // Handle single place direct redirect
                    const currentUrl = page.url();
                    if (currentUrl.includes('/maps/place/')) {
                        const business = await extractPlaceDetails(page, currentUrl);
                        if (business) {
                            business.locationScraped = currentLoc;
                            if (validateFilters(business, minReviews, maxReviews, websiteFilter)) {
                                leadsScrapedCount++;
                                onData(business);
                            } else if (!business.phone) {
                                business.discarded = true;
                                business.discardReason = "No phone number";
                                onData(business);
                            }
                        }
                        if (leadsScrapedCount >= maxResults) break;
                        continue;
                    }

                    // Wait for feed container
                    const feedSelector = 'div[role="feed"]';
                    const feedExists = await page.waitForSelector(feedSelector, { timeout: 8000 }).catch(() => null);

                    if (!feedExists) {
                        onProgress(`[Tab ${tabId}] No listings container in ${currentLoc}. Skipping.`, Math.min(99, startPercent + 5));
                        continue;
                    }

                    const remainingTarget = maxResults - leadsScrapedCount;
                    if (remainingTarget <= 0) break;

                    // 2. Smarter Scrolling: Gather links using waitForFunction count checking
                    const { newLinks, duplicatesCount } = await gatherPlaceLinks(
                        page,
                        feedSelector,
                        remainingTarget,
                        sessionGatheredIds,
                        (msg) => {
                            onProgress(`[Tab ${tabId}] [${currentLoc}] ${msg}`, Math.min(99, startPercent + 10));
                        }
                    );

                    if (duplicatesCount > 0) {
                        onProgress(`[Tab ${tabId}] Skipped ${duplicatesCount} duplicates in ${currentLoc}.`, Math.min(99, startPercent + 15));
                    }

                    if (stopScrapingRequested) break;

                    if (newLinks.length > 0) {
                        onProgress(`[Tab ${tabId}] Extracting ${newLinks.length} listings in ${currentLoc}...`, Math.min(99, startPercent + Math.floor(range * 0.3)));

                        for (let k = 0; k < newLinks.length; k++) {
                            if (stopScrapingRequested || leadsScrapedCount >= maxResults) break;

                            while (pauseScrapingRequested && !stopScrapingRequested) {
                                await new Promise(r => setTimeout(r, 1000));
                            }
                            if (stopScrapingRequested) break;

                            const url = newLinks[k];
                            const itemProgress = startPercent + Math.floor(range * 0.3) + Math.floor((k / newLinks.length) * range * 0.7);

                            try {
                                const business = await extractPlaceDetails(page, url);
                                if (business) {
                                    business.locationScraped = currentLoc;
                                    if (validateFilters(business, minReviews, maxReviews, websiteFilter)) {
                                        leadsScrapedCount++;
                                        onData(business);
                                        onProgress(`[Tab ${tabId}] Found lead (${leadsScrapedCount}/${maxResults}): "${business.name}"`, Math.min(99, itemProgress));
                                    } else {
                                        if (!business.phone) {
                                            business.discarded = true;
                                            business.discardReason = "No phone number";
                                            onData(business);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error(`[Tab ${tabId}] Error extracting detail ${url}:`, err.message);
                            }

                            // Minimal delay for max speed
                            await new Promise(r => setTimeout(r, 150));
                        }
                    }
                } catch (tabErr) {
                    console.error(`[Tab ${tabId}] Error processing ${currentLoc}:`, tabErr.message);
                }
            }

            await page.close().catch(() => {});
        }

        // Spawn parallel tab workers
        const tabPromises = [];
        for (let t = 1; t <= NUM_PARALLEL_TABS; t++) {
            tabPromises.push(cityWorkerTab(t));
        }

        await Promise.all(tabPromises);

        if (!stopScrapingRequested && leadsScrapedCount < maxResults) {
            onProgress(`Scraping finished. Total leads gathered: ${leadsScrapedCount}`, 100);
        } else if (leadsScrapedCount >= maxResults) {
            onProgress(`Target limit of ${maxResults} valid leads reached. Complete!`, 100);
        }

    } catch (error) {
        console.error('High-speed scraping error:', error);
        onProgress(`Error during scraping: ${error.message}`, 100);
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
        activeBrowser = null;
    }
}

/**
 * 2. Smarter Scrolling: Gather place links using waitForFunction element count checks
 */
async function gatherPlaceLinks(page, feedSelector, maxResults, sessionGatheredIds, onProgress) {
    let links = new Set();
    let duplicates = new Set();
    let scrollAttempts = 0;
    const maxScrollAttempts = 30;
    let lastLength = 0;

    while (links.size < maxResults && scrollAttempts < maxScrollAttempts) {
        if (stopScrapingRequested) break;

        while (pauseScrapingRequested && !stopScrapingRequested) {
            await new Promise(r => setTimeout(r, 1000));
        }
        if (stopScrapingRequested) break;

        // Extract visible links from DOM
        const visibleLinks = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
            return anchors.map(a => a.href);
        });

        visibleLinks.forEach(link => {
            const id = getGoogleMapsId(link);
            if (sessionGatheredIds.has(id)) {
                duplicates.add(id);
                return;
            }
            if (links.size < maxResults) {
                sessionGatheredIds.add(id);
                const cleaned = link.split('?')[0].split('#')[0].trim();
                links.add(cleaned);
            }
        });

        if (links.size >= maxResults) break;

        // Scroll feed down
        await page.evaluate((selector) => {
            const feed = document.querySelector(selector);
            if (feed) feed.scrollBy(0, 3500);
        }, feedSelector);

        // 2. Smarter Scrolling: waitForFunction count check instead of fixed delay
        const currentCount = links.size;
        await page.waitForFunction(
            (selector, prevCount) => {
                const feed = document.querySelector(selector);
                if (!feed) return true;
                const count = feed.querySelectorAll('a[href*="/maps/place/"]').length;
                const endLabels = ["You've reached the end of the list", "End of list", "No more results"];
                const textContent = feed.textContent || "";
                const isEnd = endLabels.some(label => textContent.includes(label));
                return count > prevCount || isEnd;
            },
            { timeout: 1200 },
            feedSelector,
            lastLength
        ).catch(() => null);

        if (links.size === lastLength) {
            scrollAttempts++;
        } else {
            scrollAttempts = 0; // reset stall counter on progress
        }

        lastLength = links.size;
        onProgress(`Gathered ${links.size} listing links...`);
    }

    return {
        newLinks: Array.from(links),
        duplicatesCount: duplicates.size
    };
}

/**
 * 4. Decoupled Extraction: Pure DOM detail extraction (No WhatsApp validation blocking calls)
 */
async function extractPlaceDetails(page, url) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        
        await page.waitForSelector('h1', { timeout: 5000 }).catch(() => null);

        // Wait up to 2.5s for phone/website elements to populate
        await page.waitForFunction(() => {
            const hasPhone = !!document.querySelector('a[href^="tel:"], [data-item-id^="phone:tel:"]');
            const hasWebsite = !!document.querySelector('[data-item-id="authority"], a[aria-label*="website"i]');
            return hasPhone || hasWebsite;
        }, { timeout: 2500 }).catch(() => null);

        const details = await page.evaluate(() => {
            // 1. Name
            const nameEl = document.querySelector('h1');
            const name = nameEl ? nameEl.textContent.trim() : 'Unknown Business';

            // 2. Reviews Count
            let reviewsCount = 0;
            const btn = document.querySelector('button[aria-label*="review"]');
            if (btn) {
                const label = btn.getAttribute('aria-label');
                const match = label.match(/([\d,]+)\s+reviews?/i);
                if (match) reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
            }

            if (!reviewsCount) {
                const f7 = document.querySelector('.F7nice');
                if (f7) {
                    const match = f7.textContent.match(/\(([\d,]+)\)/);
                    if (match) reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
                }
            }

            if (!reviewsCount) {
                const lqEl = document.querySelector('.LQ7e0d');
                if (lqEl && lqEl.textContent) {
                    let match = lqEl.textContent.match(/\(([\d,]+)\)/) || lqEl.textContent.match(/([\d,]+)\s+reviews?/i);
                    if (match) reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
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
                    if (match) phone = match[1].trim();
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

        // 4. Decoupled Pipeline: Default WhatsApp attributes (No blocking network calls during scrape)
        details.whatsappRegistered = null;
        details.whatsappFormatted = details.phone ? details.phone.replace(/[^0-9+]/g, '') : '';
        details.whatsappLink = details.whatsappFormatted ? `https://wa.me/${details.whatsappFormatted}` : '';

        return details;
    } catch (err) {
        if (err.message.includes('detached') || err.message.includes('crashed') || err.message.includes('closed') || err.message.includes('Session closed')) {
            throw err;
        }
        return null;
    }
}

/**
 * 5. Preserve Existing Filters
 */
function validateFilters(business, minReviews, maxReviews, websiteFilter = 'none') {
    if (!business.phone) {
        return false;
    }
    
    if (websiteFilter === 'none' && business.website) {
        return false;
    }
    if (websiteFilter === 'must' && !business.website) {
        return false;
    }

    if (business.reviewsCount < minReviews || business.reviewsCount > maxReviews) {
        return false;
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
