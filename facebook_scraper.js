const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

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

function isPaused() {
    return pauseScrapingRequested;
}

function isScrapingActive() {
    return activeBrowser !== null;
}

/**
 * Configure Puppeteer page (blocks images/fonts to keep scraping fast)
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
                if (blockDomains.some(domain => url.includes(domain))) {
                    req.abort().catch(() => {});
                    return;
                }
                if (['image', 'font', 'media'].includes(resourceType)) {
                    req.abort().catch(() => {});
                } else {
                    req.continue().catch(() => {});
                }
            } catch (err) {
                // Ignore
            }
        });
    } catch (e) {
        console.warn('Failed to configure page request interception:', e.message);
    }
}

/**
 * Normalise Facebook Page URL to extract username/ID for duplicate checks
 */
function getFacebookUsername(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            if (pathParts[0] === 'pages' && pathParts.length > 2) {
                return pathParts[2];
            }
            return pathParts[0];
        }
    } catch (e) {}
    return url;
}

/**
 * Main Facebook Scraper entry point
 */
async function scrapeFacebook({
    niche,
    location, // Array of location strings
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
                '--disable-extensions'
            ]
        });

        activeBrowser = browser;
        
        let leadsScrapedCount = 0;
        const sessionGatheredUsernames = new Set();
        
        // Populate with existing database URLs
        existingUrls.forEach(url => {
            const username = getFacebookUsername(url);
            if (username) sessionGatheredUsernames.add(username);
        });

        const locationsList = Array.isArray(location) ? location : [location];
        onProgress(`Resolved ${locationsList.length} target locations to scan...`, 8);

        for (let lIndex = 0; lIndex < locationsList.length; lIndex++) {
            if (stopScrapingRequested) break;
            if (leadsScrapedCount >= maxResults) break;

            const currentLocation = locationsList[lIndex];
            const cityProgressBase = 10 + (lIndex / locationsList.length) * 80;

            onProgress(`[${lIndex + 1}/${locationsList.length}] Starting Facebook scan in ${currentLocation}...`, cityProgressBase);

            // Create temporary search page
            const searchPage = await browser.newPage();
            await configurePage(searchPage);

            const searchQuery = `site:facebook.com ${niche} ${currentLocation}`;
            const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
            
            onProgress(`[${currentLocation}] Querying DuckDuckGo search...`, cityProgressBase + 2);
            await searchPage.goto(ddgUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await new Promise(r => setTimeout(r, 2000));

            // Extract links from DuckDuckGo search
            const rawLinks = await searchPage.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                const list = [];
                for (const a of anchors) {
                    const href = a.href;
                    if (!href) continue;
                    
                    if (href.includes('facebook.com') && !href.includes('duckduckgo.com') && !href.includes('duckduckgo.html')) {
                        list.push(href);
                    } 
                    else if (href.includes('duckduckgo.com') && href.includes('facebook.com')) {
                        const match = href.match(/[?&]uddg=([^&]+)/);
                        if (match) {
                            const decoded = decodeURIComponent(match[1]);
                            if (decoded.includes('facebook.com')) {
                                list.push(decoded);
                            }
                        }
                    }
                }
                return list;
            });

            await searchPage.close().catch(() => {});

            // Filter out duplicates and post links (we only want profile/page links)
            const targetUrls = Array.from(new Set(rawLinks))
                .filter(url => {
                    const lower = url.toLowerCase();
                    const isJunk = ['/posts/', '/photos/', '/groups/', '/events/', '/share/', '/r.php', '/login', '/signup', '/help'].some(p => lower.includes(p));
                    if (isJunk) return false;

                    const username = getFacebookUsername(url);
                    if (!username || sessionGatheredUsernames.has(username)) {
                        return false;
                    }
                    return true;
                });

            onProgress(`[${currentLocation}] Found ${targetUrls.length} new Facebook profiles to crawl...`, cityProgressBase + 10);

            if (targetUrls.length === 0) {
                continue;
            }

            // Crawl Page Details
            const detailsWorkerPage = await browser.newPage();
            await configurePage(detailsWorkerPage);

            for (let tIndex = 0; tIndex < targetUrls.length; tIndex++) {
                if (stopScrapingRequested) break;
                if (leadsScrapedCount >= maxResults) break;

                // Handle Pause
                while (pauseScrapingRequested && !stopScrapingRequested) {
                    onProgress('Scraping paused. Waiting to resume...', cityProgressBase + 10 + (tIndex / targetUrls.length) * 70);
                    await new Promise(r => setTimeout(r, 1000));
                }

                const targetUrl = targetUrls[tIndex];
                const detailProgress = cityProgressBase + 10 + (tIndex / targetUrls.length) * 70;
                
                const username = getFacebookUsername(targetUrl);
                if (username) sessionGatheredUsernames.add(username);

                onProgress(`[Facebook] Extracting page details ${tIndex + 1}/${targetUrls.length}: ${targetUrl}`, detailProgress);

                try {
                    const targetMobileUrl = targetUrl.replace('://www.facebook.com', '://m.facebook.com').replace('://facebook.com', '://m.facebook.com');
                    
                    await detailsWorkerPage.goto(targetMobileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
                    await new Promise(r => setTimeout(r, 4000));

                    // Dismiss the login overlay if present
                    await detailsWorkerPage.evaluate(() => {
                        const closeSelectors = [
                            'div[role="button"][aria-label="Close"]',
                            'a[role="button"][aria-label="Close"]',
                            'div[aria-label="Close"]',
                            'button[aria-label="Close"]',
                            '[class*="close"i]',
                            '[aria-label*="close"i]'
                        ];
                        for (const selector of closeSelectors) {
                            const el = document.querySelector(selector);
                            if (el) {
                                el.click();
                                return;
                            }
                        }
                        const elements = Array.from(document.querySelectorAll('div, button, a, span'));
                        const closeBtn = elements.find(el => {
                            const label = (el.getAttribute('aria-label') || '').toLowerCase();
                            const text = el.textContent.trim();
                            return label === 'close' || text === '✕' || text === 'Close';
                        });
                        if (closeBtn) closeBtn.click();
                    }).catch(() => {});

                    await new Promise(r => setTimeout(r, 1000));

                    // Scroll down to load details
                    await detailsWorkerPage.evaluate(() => window.scrollBy(0, 700)).catch(() => {});
                    await new Promise(r => setTimeout(r, 2000));

                    const details = await detailsWorkerPage.evaluate(() => {
                        const html = document.documentElement.outerHTML;

                        // Try to find Page ID from meta tags first
                        let extractedPageId = null;
                        const androidMeta = document.querySelector('meta[property="al:android:url"]');
                        if (androidMeta) {
                            const content = androidMeta.getAttribute('content');
                            const match = content.match(/fb:\/\/profile\/(\d+)/) || content.match(/fb:\/\/page\/(\d+)/);
                            if (match) extractedPageId = match[1];
                        }
                        if (!extractedPageId) {
                            const iosMeta = document.querySelector('meta[property="al:ios:url"]');
                            if (iosMeta) {
                                const content = iosMeta.getAttribute('content');
                                const match = content.match(/fb:\/\/profile\/(\d+)/) || content.match(/fb:\/\/page\/(\d+)/);
                                if (match) extractedPageId = match[1];
                            }
                        }

                        // Try regex matches fallbacks (must be 8+ digits)
                        if (!extractedPageId) {
                            const pageIdMatches = [
                                html.match(/"pageID":"(\d{8,18})"/),
                                html.match(/"page_id":"(\d{8,18})"/),
                                html.match(/delegate_page_id=(\d{8,18})/),
                                html.match(/"owning_profile_id":"(\d{8,18})"/),
                                html.match(/"owning_profile":\s*\{\s*"__typename":\s*"Page",\s*"id":\s*"(\d{8,18})"/),
                                html.match(/"pageID":\s*"(\d{8,18})"/),
                                html.match(/"profile_id":\s*"(\d{8,18})"/),
                                html.match(/\/ads\/library\/\?view_all_page_id=(\d{8,18})/),
                                html.match(/page_id=(\d{8,18})/),
                                html.match(/&quot;page_id&quot;:\s*&quot;(\d{8,18})&quot;/)
                            ];
                            for (const match of pageIdMatches) {
                                if (match && match[1]) {
                                    extractedPageId = match[1];
                                    break;
                                }
                            }
                        }

                        // Extract business name
                        let name = 'Unknown Facebook Business';
                        const h1 = document.querySelector('h1');
                        if (h1 && h1.textContent.trim().length > 0) {
                            name = h1.textContent.trim();
                        } else {
                            const title = document.title;
                            if (title && title.length > 0) {
                                name = title.split(' | ')[0].split(' - ')[0].trim();
                            }
                        }

                        // Extract phone number from text content
                        const text = document.body.innerText;
                        const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
                        const phoneMatches = text.match(phoneRegex) || [];
                        let phone = phoneMatches.length > 0 ? phoneMatches[0] : null;

                        // Extract website link
                        const anchors = Array.from(document.querySelectorAll('a'));
                        let website = null;
                        for (const a of anchors) {
                            const href = a.href;
                            if (!href) continue;

                            if (href.includes('/l.php?u=')) {
                                const match = href.match(/[?&]u=([^&]+)/);
                                if (match) {
                                    const decoded = decodeURIComponent(match[1]);
                                    website = decoded;
                                    break;
                                }
                            } else {
                                const lower = href.toLowerCase();
                                const isCommon = lower.startsWith('http') || lower.startsWith('www');
                                const isSocial = ['facebook.com', 'instagram.com', 'twitter.com', 'youtube.com', 'linkedin.com', 'pinterest.com', 'tiktok.com', 'messenger.com', 'whatsapp.com'].some(s => lower.includes(s));
                                if (isCommon && !isSocial) {
                                    website = href;
                                    break;
                                }
                            }
                        }

                        return {
                            name,
                            phone,
                            website,
                            pageId: extractedPageId
                        };
                    });

                    // Format URL and build ad link
                    details.url = targetUrl;
                    details.facebookAdLink = details.pageId 
                        ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${details.pageId}`
                        : `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(details.name)}`;
                    details.locationScraped = currentLocation;
                    details.reviewsCount = 0;

                    // Apply filters
                    let passesFilter = true;
                    if (!details.phone) {
                        passesFilter = false;
                    }
                    if (passesFilter) {
                        if (websiteFilter === 'none' && details.website) {
                            passesFilter = false;
                        } else if (websiteFilter === 'must' && !details.website) {
                            passesFilter = false;
                        }
                    }

                    if (passesFilter) {
                        leadsScrapedCount++;
                        onData(details);
                    }

                } catch (err) {
                    console.error(`Error scraping Facebook details for ${targetUrl}:`, err.message);
                }
            }

            await detailsWorkerPage.close().catch(() => {});
        }

        onProgress(`Facebook scan finished. Found ${leadsScrapedCount} valid leads.`, 100);

    } catch (err) {
        console.error('scrapeFacebook process failed:', err);
        onProgress(`Scrape process encountered an error: ${err.message}`, 100);
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
        activeBrowser = null;
    }
}

module.exports = {
    scrapeFacebook,
    stopScraping,
    pauseScraping,
    resumeScraping,
    isPaused,
    isScrapingActive,
    getFacebookUsername
};
