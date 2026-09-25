// Prevent unexpected exceptions inside third-party libraries from crashing the server
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const scraper = require('./scraper');
const whatsapp = require('./whatsapp');

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

// Load locations database for population-based search
const locationsDbPath = path.join(__dirname, 'public', 'locations_db.json');
let locationsDb = [];
if (fs.existsSync(locationsDbPath)) {
    try {
        locationsDb = JSON.parse(fs.readFileSync(locationsDbPath, 'utf8'));
    } catch (err) {
        console.error('Error loading locations database in server.js:', err);
    }
}

// Daily Cap Logic (Hardcoded or environment-configured per tier)
const DAILY_CAP = parseInt(process.env.DAILY_CAP || '40000', 10);
const usageStatsPath = path.join(process.cwd(), 'usage_stats.json');

function getDailyUsage() {
    const now = Date.now();
    let stats = { date: new Date().toDateString(), count: 0, resetTimestamp: now + 86400000 };
    if (fs.existsSync(usageStatsPath)) {
        try {
            const saved = JSON.parse(fs.readFileSync(usageStatsPath, 'utf8'));
            if (now >= saved.resetTimestamp || new Date().toDateString() !== saved.date) {
                stats = { date: new Date().toDateString(), count: 0, resetTimestamp: now + 86400000 };
            } else {
                stats = saved;
            }
        } catch (e) {}
    }
    return stats;
}

function incrementDailyUsage(amount = 1) {
    const stats = getDailyUsage();
    stats.count += amount;
    try {
        fs.writeFileSync(usageStatsPath, JSON.stringify(stats, null, 2), 'utf8');
    } catch (e) {}
    return stats.count;
}

// Load scraped leads database (persistence in executable working directory)
const leadsDbPath = path.join(process.cwd(), 'scraped_leads.json');
let scrapedLeadsDb = [];
if (fs.existsSync(leadsDbPath)) {
    try {
        scrapedLeadsDb = JSON.parse(fs.readFileSync(leadsDbPath, 'utf8'));
    } catch (err) {
        console.error('Error loading scraped_leads.json in server.js:', err);
    }
}

function saveLeadsDb() {
    try {
        fs.writeFileSync(leadsDbPath, JSON.stringify(scrapedLeadsDb, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving scraped_leads.json:', err);
    }
}

// Normalize database URLs to be clean (strip query parameters and hashes)
let dbModified = false;
scrapedLeadsDb.forEach(lead => {
    if (lead.url) {
        const cleaned = lead.url.split('?')[0].split('#')[0].trim();
        if (lead.url !== cleaned) {
            lead.url = cleaned;
            dbModified = true;
        }
    }
});
if (dbModified) {
    console.log('[System] Normalized existing leads database URLs (stripped query parameters). Saving...');
    saveLeadsDb();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend files from "public" folder
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});
app.get('/locations_db.json', (req, res) => {
    res.sendFile(path.join(publicDir, 'locations_db.json'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track active scraper and active WebSocket connections
let activeScrapingPromise = null;
let isStoppedByUser = false;

let activeScrapeState = {
    isScraping: false,
    isPaused: false,
    niche: '',
    locationText: '',
    selectedStates: [],
    maxResults: 50,
    minReviews: 0,
    maxReviews: Infinity,
    websiteFilter: 'none',
    sessionLeadsCount: 0
};

const serverLogBuffer = [];
const MAX_LOG_BUFFER = 150;

function addServerLog(timestamp, message) {
    serverLogBuffer.push({ timestamp, message });
    if (serverLogBuffer.length > MAX_LOG_BUFFER) {
        serverLogBuffer.shift();
    }
}

// Queue for sending messages
let messageQueue = [];
let isProcessingQueue = false;
let messageQueueDelayTimer = null;
let isMessagingPaused = false;
let recentDispatches = [];
let isAutoMessagingEnabled = false;
let activeWhatsAppMode = 'off';
let lastProgress = { msg: 'Idle', percent: 0 };

function handleWhatsAppStatusChange(status) {
    broadcast({
        type: 'whatsapp-status',
        data: status
    });

    // Auto-pause if WhatsApp gets disconnected while scraping is active or messages are in queue
    if (status.status === 'DISCONNECTED') {
        if (activeScrapingPromise || messageQueue.length > 0) {
            console.log('[WhatsApp] Connection lost. Auto-pausing scanner and messaging queue...');
            
            // Trigger pause
            scraper.pauseScraping();
            isMessagingPaused = true;
            
            broadcast({
                type: 'log',
                data: {
                    timestamp: new Date().toLocaleTimeString(),
                    message: '[System/WhatsApp] WARNING: WhatsApp device disconnected! Auto-pausing scanner and messaging queue. Please reconnect/link your device and click Resume.'
                }
            });
            
            broadcast({
                type: 'scrape-paused',
                data: { paused: true }
            });
            
            broadcastQueueUpdate();
        }
    }
}

function broadcastQueueUpdate(remainingSeconds = null) {
    broadcast({
        type: 'wa-queue-update',
        data: {
            queueLength: messageQueue.length,
            isPaused: isMessagingPaused,
            activeItem: messageQueue.length > 0 ? {
                url: messageQueue[0].business.url,
                name: messageQueue[0].business.name,
                phone: messageQueue[0].business.phone,
                remainingSeconds: remainingSeconds !== null ? remainingSeconds : messageQueue[0].delaySeconds,
                totalDelay: messageQueue[0].delaySeconds,
                messageTemplate: messageQueue[0].messageTemplate
            } : null,
            queue: messageQueue.map(item => ({
                url: item.business.url,
                name: item.business.name,
                phone: item.business.phone,
                messageTemplate: item.messageTemplate
            })),
            recentDispatches
        }
    });
}

function addToMessageQueue(business, messageTemplate, delaySeconds, ws) {
    messageQueue.push({ business, messageTemplate, delaySeconds, ws });
    broadcastQueueUpdate();
    if (!isProcessingQueue) {
        processMessageQueue();
    }
}

async function processMessageQueue() {
    isProcessingQueue = true;
    while (messageQueue.length > 0) {
        // Check WhatsApp connection status before processing
        if (whatsapp.getStatus().status !== 'CONNECTED') {
            console.log('[WhatsApp] Cannot process queue: WhatsApp is disconnected. Auto-pausing messaging queue...');
            isMessagingPaused = true;
            broadcast({
                type: 'scrape-paused',
                data: { paused: true }
            });
            broadcastQueueUpdate();
            isProcessingQueue = false;
            return;
        }

        const { business, delaySeconds, ws } = messageQueue[0];
        
        broadcast({
            type: 'wa-send-status',
            data: { url: business.url, status: 'Queued' }
        });
        broadcastQueueUpdate(delaySeconds);

        // Wait for the specified delay before sending
        sendAppLog(ws, `[Queue] Waiting ${delaySeconds}s before sending WhatsApp message to ${business.name}...`);
        
        // Wait loop supporting delay counting and pause checks
        let remainingSeconds = delaySeconds;
        let skipped = false;
        while (remainingSeconds > 0) {
            // Check if our active item is still at the front of the queue
            if (messageQueue.length === 0 || messageQueue[0].business.url !== business.url) {
                skipped = true;
                break;
            }
            
            // Check if WhatsApp disconnected while waiting
            if (whatsapp.getStatus().status !== 'CONNECTED') {
                console.log('[WhatsApp] Connection lost during queue wait. Auto-pausing...');
                isMessagingPaused = true;
                broadcast({
                    type: 'scrape-paused',
                    data: { paused: true }
                });
                broadcastQueueUpdate();
            }

            // Check for messaging paused state
            while (isMessagingPaused && messageQueue.length > 0) {
                if (messageQueue.length === 0 || messageQueue[0].business.url !== business.url) {
                    skipped = true;
                    break;
                }
                broadcast({
                    type: 'wa-send-status',
                    data: { url: business.url, status: 'Paused ⏳' }
                });
                broadcastQueueUpdate(remainingSeconds);
                await new Promise(r => setTimeout(r, 1000));
            }
            
            if (skipped || messageQueue.length === 0 || messageQueue[0].business.url !== business.url) {
                skipped = true;
                break;
            }
            
            broadcastQueueUpdate(remainingSeconds);
            await new Promise(r => setTimeout(r, 1000));
            remainingSeconds--;
        }

        if (skipped || messageQueue.length === 0 || messageQueue[0].business.url !== business.url) {
            // It was deleted/skipped from the queue, so don't send!
            sendAppLog(ws, `[Queue] Skipped sending to ${business.name}.`);
            continue;
        }
        
        try {
            sendAppLog(ws, `[WhatsApp] Sending message to ${business.name} (${business.phone})...`);
            
            // Format message template (replace {name} with business name)
            // Use the updated messageTemplate from the queue in case it was edited!
            let text = messageQueue[0].messageTemplate;
            text = text.replace(/{name}/gi, business.name);
            
            // Double check WhatsApp connectivity right before calling sendMessage
            if (whatsapp.getStatus().status !== 'CONNECTED') {
                throw new Error('WhatsApp client is not connected');
            }

            await whatsapp.sendMessage(business.phone, text);
            
            sendAppLog(ws, `[WhatsApp] Message successfully sent to ${business.name}!`);
            broadcast({
                type: 'wa-send-status',
                data: { url: business.url, status: 'Sent' }
            });
            
            recentDispatches.push({
                name: business.name,
                phone: business.phone,
                status: 'Sent ✅',
                timestamp: new Date().toLocaleTimeString()
            });

            if (recentDispatches.length > 5) {
                recentDispatches.shift();
            }
            
            messageQueue.shift();
            broadcastQueueUpdate();

        } catch (err) {
            console.error(`Failed to send WhatsApp message to ${business.name}:`, err.message);
            
            const isConnectionError = err.message.includes('not connected') || 
                                      err.message.includes('Session') || 
                                      err.message.includes('closed') || 
                                      err.message.includes('destroyed') ||
                                      whatsapp.getStatus().status !== 'CONNECTED';

            if (isConnectionError) {
                sendAppLog(ws, `[WhatsApp] Connection lost. Message to ${business.name} kept in queue. Auto-pausing...`);
                isMessagingPaused = true;
                broadcast({
                    type: 'scrape-paused',
                    data: { paused: true }
                });
                broadcastQueueUpdate();
                isProcessingQueue = false;
                return; // exit processMessageQueue without shifting the item
            } else {
                sendAppLog(ws, `[WhatsApp] Failed to send message to ${business.name}: ${err.message}`);
                broadcast({
                    type: 'wa-send-status',
                    data: { url: business.url, status: 'Failed', error: err.message }
                });
                
                recentDispatches.push({
                    name: business.name,
                    phone: business.phone,
                    status: `Failed ❌ (${err.message.substring(0, 25)})`,
                    timestamp: new Date().toLocaleTimeString()
                });

                if (recentDispatches.length > 5) {
                    recentDispatches.shift();
                }
                
                messageQueue.shift();
                broadcastQueueUpdate();
            }
        }
    }
    isProcessingQueue = false;
    broadcastQueueUpdate();
    
    // If scraping is finished and queue is empty, log it but keep WhatsApp active
    if (!activeScrapingPromise && messageQueue.length === 0) {
        broadcast({
            type: 'log',
            data: {
                timestamp: new Date().toLocaleTimeString(),
                message: '[WhatsApp] Message queue is empty and scraping is finished. WhatsApp client remains active.'
            }
        });
    }
}

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket. Wiping all scraping session data for a clean start...');

    // Stop active scraping if running
    if (scraper.isScrapingActive()) {
        scraper.stopScraping();
    }

    // Clear persistent leads database
    scrapedLeadsDb = [];
    saveLeadsDb();

    // Clear messaging queue
    messageQueue = [];
    isMessagingPaused = false;

    // Clear server log buffer
    serverLogBuffer.length = 0;

    // Send empty log history on connection
    ws.send(JSON.stringify({
        type: 'log-history',
        data: []
    }));

    // Send current WhatsApp status and devices list on connection (WhatsApp stays active)
    ws.send(JSON.stringify({
        type: 'whatsapp-status',
        data: whatsapp.getStatus()
    }));
    ws.send(JSON.stringify({
        type: 'whatsapp-devices-list',
        data: whatsapp.getDevices()
    }));
    // Send empty scraped leads on connection
    ws.send(JSON.stringify({
        type: 'initial-leads',
        data: []
    }));
    // Send reset active scraping status and last progress on connection
    activeScrapeState = {
        isScraping: false,
        isPaused: false,
        niche: '',
        locationText: '',
        selectedStates: [],
        maxResults: 50,
        minReviews: 0,
        maxReviews: Infinity,
        websiteFilter: 'none',
        sessionLeadsCount: 0
    };
    ws.send(JSON.stringify({
        type: 'scrape-state',
        data: activeScrapeState
    }));
    lastProgress = { msg: 'Idle', percent: 0 };
    ws.send(JSON.stringify({
        type: 'progress',
        data: lastProgress
    }));
    // Broadcast queue update to sync empty queue to client HUD
    broadcastQueueUpdate();
    // Send current queue status on connection
    ws.send(JSON.stringify({
        type: 'wa-queue-update',
        data: {
            queueLength: messageQueue.length,
            isPaused: isMessagingPaused,
            activeItem: messageQueue.length > 0 ? {
                url: messageQueue[0].business.url,
                name: messageQueue[0].business.name,
                phone: messageQueue[0].business.phone,
                remainingSeconds: messageQueue[0].delaySeconds,
                totalDelay: messageQueue[0].delaySeconds,
                messageTemplate: messageQueue[0].messageTemplate
            } : null,
            queue: messageQueue.map(item => ({
                url: item.business.url,
                name: item.business.name,
                phone: item.business.phone,
                messageTemplate: item.messageTemplate
            })),
            recentDispatches
        }
    }));

    ws.on('message', async (message) => {
        try {
            const parsed = JSON.parse(message);
            const { type, data } = parsed;

            switch (type) {
                case 'whatsapp-get-devices':
                    ws.send(JSON.stringify({
                        type: 'whatsapp-devices-list',
                        data: whatsapp.getDevices()
                    }));
                    break;

                case 'whatsapp-add-device':
                    const addedList = whatsapp.addDevice(data.name);
                    broadcast({
                        type: 'whatsapp-devices-list',
                        data: addedList
                    });
                    sendAppLog(ws, `Added new WhatsApp account: "${data.name}"`);
                    break;

                case 'whatsapp-delete-device':
                    const deletedList = await whatsapp.deleteDevice(data.id, handleWhatsAppStatusChange);
                    broadcast({
                        type: 'whatsapp-devices-list',
                        data: deletedList
                    });
                    sendAppLog(ws, `Deleted WhatsApp account.`);
                    break;

                case 'whatsapp-select-device':
                    sendAppLog(ws, `Switching active WhatsApp account...`);
                    const selectStatus = await whatsapp.selectDevice(data.id, handleWhatsAppStatusChange);
                    broadcast({
                        type: 'whatsapp-devices-list',
                        data: whatsapp.getDevices()
                    });
                    broadcast({
                        type: 'whatsapp-status',
                        data: selectStatus
                    });
                    sendAppLog(ws, `Switched WhatsApp account.`);
                    break;

                case 'whatsapp-init':
                    sendAppLog(ws, 'Initializing WhatsApp Client...');
                    whatsapp.initialize(handleWhatsAppStatusChange);
                    break;

                case 'whatsapp-logout':
                    sendAppLog(ws, 'Logging out of WhatsApp...');
                    await whatsapp.logout(handleWhatsAppStatusChange);
                    sendAppLog(ws, 'Logged out from WhatsApp.');
                    break;

                case 'start-scrape':
                    if (activeScrapingPromise) {
                        sendAppLog(ws, 'A scraping process is already running!');
                        break;
                    }

                    const currentUsage = getDailyUsage();
                    if (currentUsage.count >= DAILY_CAP) {
                        const hoursLeft = Math.max(1, Math.ceil((currentUsage.resetTimestamp - Date.now()) / (1000 * 60 * 60)));
                        sendAppLog(ws, `[Daily Cap Error] Daily scraping limit of ${DAILY_CAP.toLocaleString()} leads reached for today! Resets in ~${hoursLeft} hours.`);
                        ws.send(JSON.stringify({
                            type: 'scrape-finished',
                            data: { success: false, error: `Daily cap of ${DAILY_CAP.toLocaleString()} leads reached for today. Resets in ~${hoursLeft} hours.` }
                        }));
                        break;
                    }

                    const { niche, location, selectedStates, minReviews, maxReviews, maxResults, headless, sendAutoMessage, waMode, messageTemplate, messageDelay, websiteFilter, skipScanned } = data;

                    activeWhatsAppMode = waMode || (sendAutoMessage ? 'text' : 'off');
                    const needWhatsApp = (activeWhatsAppMode !== 'off');

                    // Ensure WhatsApp is connected if auto-messaging or verification is enabled
                    if (needWhatsApp && whatsapp.getStatus().status !== 'CONNECTED') {
                        // If it's not connected, and not initializing/QR ready, initialize it
                        if (whatsapp.getStatus().status !== 'INITIALIZING' && whatsapp.getStatus().status !== 'QR_READY') {
                            sendAppLog(ws, `[WhatsApp] WhatsApp functionality (${activeWhatsAppMode}) enabled. Initializing WhatsApp...`);
                            whatsapp.initialize(handleWhatsAppStatusChange);
                        }
                        
                        // Notify user and abort start-scrape if not connected yet
                        if (whatsapp.getStatus().status === 'QR_READY') {
                            sendAppLog(ws, '[WhatsApp] WhatsApp requires linking. Please scan the QR code on the dashboard first.');
                            ws.send(JSON.stringify({
                                type: 'scrape-finished',
                                data: { success: false, error: 'WhatsApp is not linked. Please scan the QR code first.' }
                            }));
                        } else {
                            sendAppLog(ws, '[WhatsApp] WhatsApp is connecting. Please wait until connected to start scraping.');
                            ws.send(JSON.stringify({
                                type: 'scrape-finished',
                                data: { success: false, error: 'WhatsApp is initializing. Please wait a few seconds and try again.' }
                            }));
                        }
                        break;
                    }
                    
                    isAutoMessagingEnabled = (activeWhatsAppMode === 'text');
                    isMessagingPaused = !isAutoMessagingEnabled;

                    let locations = [];
                    if (selectedStates && selectedStates.length > 0) {
                        let allCities = [];
                        selectedStates.forEach(stateName => {
                            const stateObj = locationsDb.find(s => s.name === stateName);
                            if (stateObj) {
                                stateObj.cities.forEach(city => {
                                    allCities.push({
                                        name: city.name,
                                        stateCode: stateObj.code,
                                        country: stateObj.country || 'USA',
                                        population: city.population
                                    });
                                });
                            }
                        });

                        // Sort all cities from selected states by population descending
                        allCities.sort((a, b) => b.population - a.population);

                        // Generate location queries
                        locations = allCities.map(c => `${c.name}, ${c.stateCode}, ${c.country}`);
                        sendAppLog(ws, `Generated ${locations.length} cities from ${selectedStates.length} selected states/provinces, prioritized by population.`);
                    } else {
                        // Manual text list fallback with Canada province detection
                        locations = location.split(/[\n;]+/).map(l => l.trim()).filter(Boolean).map(loc => {
                            const canadaProvinces = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NL', 'NB', 'PE', 'YT', 'NT', 'NU'];
                            const uppercaseLoc = loc.toUpperCase();
                            const endsWithCanadaProv = canadaProvinces.some(prov => {
                                return uppercaseLoc.endsWith(`, ${prov}`) || uppercaseLoc.endsWith(`,${prov}`) || uppercaseLoc.endsWith(` ${prov}`);
                            });
                            if (endsWithCanadaProv && !uppercaseLoc.includes('CANADA')) {
                                return `${loc}, Canada`;
                            }
                            return loc;
                        });
                        sendAppLog(ws, `Loaded ${locations.length} manual locations to scan.`);
                    }

                    if (locations.length === 0) {
                        sendAppLog(ws, 'Error: No valid target locations found to scan.');
                        ws.send(JSON.stringify({
                            type: 'scrape-finished',
                            data: { success: false, error: 'No valid target locations found to scan.' }
                        }));
                        break;
                    }

                    if (skipScanned && locations.length > 1) {
                        const existingLocations = new Set(scrapedLeadsDb.map(l => l.locationScraped).filter(Boolean));
                        const filteredLocations = locations.filter(loc => !existingLocations.has(loc));
                        if (filteredLocations.length > 0 && filteredLocations.length < locations.length) {
                            sendAppLog(ws, `[System] Skipped ${locations.length - filteredLocations.length} locations already scanned in the past.`);
                            locations = filteredLocations;
                        } else if (filteredLocations.length === 0) {
                            sendAppLog(ws, `[System] Note: All ${locations.length} target locations have already been scanned. Re-scanning them to find more leads.`);
                        }
                    }

                    sendAppLog(ws, `Filters: Min Reviews: ${minReviews}, Max Reviews: ${maxReviews}`);
                    if (sendAutoMessage) {
                        sendAppLog(ws, `Auto Message is enabled. Delay: ${messageDelay}s`);
                    }

                    activeScrapeState = {
                        isScraping: true,
                        isPaused: false,
                        niche,
                        locationText: location,
                        selectedStates: selectedStates || [],
                        maxResults: parseInt(maxResults, 10) || 50,
                        minReviews: parseInt(minReviews, 10) || 0,
                        maxReviews: parseInt(maxReviews, 10) || Infinity,
                        websiteFilter: websiteFilter || 'none',
                        sessionLeadsCount: 0
                    };

                    let totalScrapedLeadsCount = 0;
                    const sessionProcessedUrls = new Set();
                    isStoppedByUser = false;
                    activeScrapingPromise = (async () => {
                        const targetLimit = parseInt(maxResults, 10) || 50;
                        
                        sendAppLog(ws, `[Multi-Search] Starting scan for niche: [${niche}] across ${locations.length} locations (Target limit: ${targetLimit} leads)`);

                        const existingUrls = new Set(scrapedLeadsDb.map(l => {
                            if (!l.url) return '';
                            return getGoogleMapsId(l.url);
                        }).filter(Boolean));

                        const onProgressCallback = (msg, percent) => {
                            lastProgress = { msg, percent };
                            sendAppLog(ws, msg);
                            broadcast({
                                type: 'progress',
                                data: lastProgress
                            });
                        };

                        const onDataCallback = (business) => {
                            if (business.url) {
                                business.url = business.url.split('?')[0].split('#')[0].trim();
                            }

                            if (totalScrapedLeadsCount >= targetLimit) {
                                return;
                            }
                            
                            if (sessionProcessedUrls.has(business.url)) {
                                return;
                            }
                            sessionProcessedUrls.add(business.url);

                            // Check if duplicate and update in-place, or append
                            const existsIndex = scrapedLeadsDb.findIndex(l => {
                                if (l.url && business.url) {
                                    return getGoogleMapsId(l.url) === getGoogleMapsId(business.url);
                                }
                                return l.url === business.url;
                            });
                            if (existsIndex === -1) {
                                scrapedLeadsDb.push(business);
                                if (!business.discarded) {
                                    totalScrapedLeadsCount++;
                                    activeScrapeState.sessionLeadsCount++;
                                    const updatedCount = incrementDailyUsage(1);
                                    if (updatedCount >= DAILY_CAP) {
                                        sendAppLog(ws, `[Daily Cap] Daily scraping limit of ${DAILY_CAP.toLocaleString()} leads reached for today! Stopping scraper.`);
                                        scraper.stopScraping();
                                    }
                                }
                                sendAppLog(ws, `[Scraper] Found NEW business: "${business.name}" (Phone: ${business.phone || 'N/A'}, Reviews: ${business.reviewsCount || 0})`);
                            } else {
                                // Update existing business details
                                scrapedLeadsDb[existsIndex] = { ...scrapedLeadsDb[existsIndex], ...business };
                                if (!business.discarded && scrapedLeadsDb[existsIndex].discarded) {
                                    delete scrapedLeadsDb[existsIndex].discarded;
                                    delete scrapedLeadsDb[existsIndex].discardReason;
                                    totalScrapedLeadsCount++;
                                    activeScrapeState.sessionLeadsCount++;
                                }
                                sendAppLog(ws, `[Scraper] Found business (Duplicate updated): "${business.name}" (Phone: ${business.phone || 'N/A'}, Reviews: ${business.reviewsCount || 0})`);
                            }
                            saveLeadsDb();

                            // Send result to client
                            broadcast({
                                type: 'result',
                                data: business
                            });

                            if (business.whatsappRegistered === null && business.phone) {
                                sendAppLog(ws, `[WhatsApp] Warning: Verification failed for ${business.name}. The WhatsApp session may have crashed or is disconnected.`);
                            }

                            // If auto-message is enabled and WhatsApp verified it is registered
                            if (isAutoMessagingEnabled && business.phone && business.whatsappRegistered === true) {
                                addToMessageQueue(business, messageTemplate, parseInt(messageDelay, 10) || 45, ws);
                            }
                        };

                        await scraper.scrapeGoogleMaps({
                            niche,
                            location: locations,
                            minReviews: parseInt(minReviews, 10) || 0,
                            maxReviews: parseInt(maxReviews, 10) || Infinity,
                            maxResults: targetLimit,
                            headless: !!headless,
                            websiteFilter: websiteFilter || 'none',
                            existingUrls: existingUrls,
                            onProgress: onProgressCallback,
                            onData: onDataCallback
                        });
                    })().then(async () => {
                        activeScrapingPromise = null;
                        activeScrapeState.isScraping = false;
                        activeScrapeState.isPaused = false;
                        lastProgress = { msg: isStoppedByUser ? 'Stopped' : 'Finished', percent: isStoppedByUser ? 0 : 100 };
                        sendAppLog(ws, '[WhatsApp] Scraper finished. WhatsApp client remains active.');
                        broadcast({
                            type: 'scrape-finished',
                            data: isStoppedByUser ? { success: false, stopped: true } : { success: true }
                        });
                    }).catch(async (err) => {
                        console.error('Scraping error:', err);
                        sendAppLog(ws, `Scraping error: ${err.message}`);
                        activeScrapingPromise = null;
                        activeScrapeState.isScraping = false;
                        activeScrapeState.isPaused = false;
                        lastProgress = { msg: isStoppedByUser ? 'Stopped' : `Error: ${err.message}`, percent: isStoppedByUser ? 0 : 100 };
                        sendAppLog(ws, '[WhatsApp] Scraper finished with error. WhatsApp client remains active.');
                        broadcast({
                            type: 'scrape-finished',
                            data: isStoppedByUser ? { success: false, stopped: true } : { success: false, error: err.message }
                        });
                    });
                    break;

                case 'pause-scrape':
                    sendAppLog(ws, 'Pausing scanner and messaging queue...');
                    scraper.pauseScraping();
                    isMessagingPaused = true;
                    activeScrapeState.isPaused = true;
                    broadcast({
                        type: 'scrape-paused',
                        data: { paused: true }
                    });
                    broadcastQueueUpdate();
                    break;

                case 'resume-scrape':
                    if (activeWhatsAppMode !== 'off' && whatsapp.getStatus().status !== 'CONNECTED') {
                        sendAppLog(ws, '[System/WhatsApp] Cannot resume: WhatsApp client is not connected! Please link/connect your WhatsApp device first.');
                        break;
                    }
                    sendAppLog(ws, 'Resuming scanner and messaging queue...');
                    scraper.resumeScraping();
                    isMessagingPaused = false;
                    activeScrapeState.isPaused = false;
                    if (messageQueue.length > 0 && !isProcessingQueue) {
                        processMessageQueue();
                    }
                    broadcast({
                        type: 'scrape-paused',
                        data: { paused: false }
                    });
                    broadcastQueueUpdate();
                    break;

                case 'stop-scrape':
                    sendAppLog(ws, 'Stopping scraper and clearing messaging queue...');
                    isStoppedByUser = true;
                    scraper.stopScraping();
                    messageQueue = [];
                    isMessagingPaused = false;
                    lastProgress = { msg: 'Stopped', percent: 0 };
                    activeScrapeState.isScraping = false;
                    activeScrapeState.isPaused = false;
                    broadcastQueueUpdate();
                    break;

                case 'wa-queue-delete':
                    const deleteUrl = data.url;
                    const indexToDelete = messageQueue.findIndex(item => item.business.url === deleteUrl);
                    if (indexToDelete !== -1) {
                        const deletedBusiness = messageQueue[indexToDelete].business;
                        sendAppLog(ws, `[Queue] Removed ${deletedBusiness.name} from the queue.`);
                        
                        broadcast({
                            type: 'wa-send-status',
                            data: { url: deleteUrl, status: 'Cancelled ❌' }
                        });
                        
                        messageQueue.splice(indexToDelete, 1);
                        broadcastQueueUpdate();
                    }
                    break;

                case 'wa-queue-edit':
                    const editUrl = data.url;
                    const newText = data.text;
                    const itemToEdit = messageQueue.find(item => item.business.url === editUrl);
                    if (itemToEdit) {
                        itemToEdit.messageTemplate = newText;
                        sendAppLog(ws, `[Queue] Edited message text for ${itemToEdit.business.name}.`);
                        broadcastQueueUpdate();
                    }
                    break;

                case 'whatsapp-disconnect':
                    sendAppLog(ws, 'Disconnecting WhatsApp (preserving session)...');
                    activeWhatsAppMode = 'off';
                    await whatsapp.disconnect(handleWhatsAppStatusChange);
                    sendAppLog(ws, 'WhatsApp disconnected.');
                    break;

                case 'whatsapp-toggle-queue':
                    let targetEnabled;
                    if (data && typeof data.enabled === 'boolean') {
                        targetEnabled = data.enabled;
                    } else {
                        targetEnabled = !isAutoMessagingEnabled;
                    }

                    if (targetEnabled && whatsapp.getStatus().status !== 'CONNECTED') {
                        sendAppLog(ws, '[WhatsApp] Cannot resume/enable messaging queue: WhatsApp client is not connected!');
                        break;
                    }

                    isAutoMessagingEnabled = targetEnabled;
                    if (data && data.mode) {
                        activeWhatsAppMode = data.mode;
                    } else {
                        activeWhatsAppMode = isAutoMessagingEnabled ? 'text' : 'check';
                    }
                    isMessagingPaused = !isAutoMessagingEnabled;

                    sendAppLog(ws, `[WhatsApp] Auto-messaging queue has been ${isAutoMessagingEnabled ? 'RESUMED ▶️' : 'PAUSED ⏸️'}.`);
                    if (isAutoMessagingEnabled && messageQueue.length > 0 && !isProcessingQueue) {
                        processMessageQueue();
                    }
                    broadcastQueueUpdate();
                    break;

                case 'whatsapp-recheck-all':
                    if (whatsapp.getStatus().status !== 'CONNECTED') {
                        sendAppLog(ws, '[WhatsApp] Cannot recheck WhatsApp: WhatsApp client is not connected!');
                        break;
                    }
                    sendAppLog(ws, `[WhatsApp] Starting verification check on ${scrapedLeadsDb.length} stored leads...`);
                    (async () => {
                        let aborted = false;
                        for (let i = 0; i < scrapedLeadsDb.length; i++) {
                            const lead = scrapedLeadsDb[i];
                            if (lead.phone) {
                                sendAppLog(ws, `[WhatsApp] (${i + 1}/${scrapedLeadsDb.length}) Checking ${lead.name}...`);
                                const verifyResult = await whatsapp.verifyNumber(lead.phone);
                                
                                if (verifyResult.registered === null) {
                                    sendAppLog(ws, '[WhatsApp] Recheck aborted: WhatsApp client disconnected during verification!');
                                    aborted = true;
                                    break;
                                }

                                lead.whatsappRegistered = verifyResult.registered;
                                lead.whatsappFormatted = verifyResult.formatted;
                                lead.whatsappLink = `https://wa.me/${verifyResult.formatted}`;
                                
                                saveLeadsDb();
                                
                                // Broadcast result update
                                broadcast({
                                    type: 'result-update',
                                    data: lead
                                });
                            }
                            // Small delay to protect WhatsApp account from rate limit
                            await new Promise(r => setTimeout(r, 600));
                        }
                        if (!aborted) {
                            sendAppLog(ws, '[WhatsApp] Verification recheck completed for all leads.');
                        }
                    })().catch(err => {
                        console.error('Error during WhatsApp verification recheck:', err);
                        sendAppLog(ws, `Error during WhatsApp verification recheck: ${err.message}`);
                    });
                    break;

                case 'clear-leads-db':
                    scrapedLeadsDb = [];
                    saveLeadsDb();
                    sendAppLog(ws, '[System] Persistent leads database cleared.');
                    broadcast({
                        type: 'initial-leads',
                        data: []
                    });
                    break;

                default:
                    console.log('Unknown WebSocket message type:', type);
            }
        } catch (err) {
            console.error('Error handling WebSocket message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket.');
    });
});

/**
 * Send log message and broadcast to all connected WebSocket clients
 */
function sendAppLog(ws, message) {
    let msg = message;
    if (msg === undefined) {
        msg = ws;
    }
    const timestamp = new Date().toLocaleTimeString();
    addServerLog(timestamp, msg);
    broadcast({
        type: 'log',
        data: {
            timestamp,
            message: msg
        }
    });
}

/**
 * Broadcast message to all connected clients
 */
function broadcast(messageObj) {
    const payload = JSON.stringify(messageObj);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Auto-initialize WhatsApp client if an active session exists on disk
if (whatsapp.sessionExists && whatsapp.sessionExists()) {
    console.log(`[WhatsApp] Auto-reconnecting active device [${whatsapp.getStatus().activeId}] using existing session...`);
    whatsapp.initialize(handleWhatsAppStatusChange);
}

// Start Web Server with automatic open port detection & robust browser launch
function startServerOnPort(targetPort) {
    server.listen(targetPort, () => {
        const actualPort = server.address().port;
        const startUrl = `http://localhost:${actualPort}`;
        console.log(`=========================================`);
        console.log(`Lead Finder Pro running on: ${startUrl}`);
        console.log(`Daily Scraping Cap: ${DAILY_CAP.toLocaleString()} leads/day`);
        console.log(`=========================================`);

        // Open browser automatically using OS-native commands
        const { exec } = require('child_process');
        if (process.platform === 'win32') {
            exec(`cmd.exe /c start ${startUrl}`, (err) => {
                if (err) exec(`powershell -Command "Start-Process '${startUrl}'"`);
            });
        } else if (process.platform === 'darwin') {
            exec(`open ${startUrl}`);
        } else {
            exec(`xdg-open ${startUrl}`);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${targetPort} is in use. Trying port ${targetPort + 1}...`);
            setTimeout(() => {
                server.close();
                startServerOnPort(targetPort + 1);
            }, 300);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServerOnPort(PORT);
