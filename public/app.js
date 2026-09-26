// State management
let ws = null;
let scrapedLeads = [];
let isScraping = false;
let sessionLeadsCount = 0;
let currentScrapeMode = 'maps';
let waActiveEditUrl = null;
let waActiveItemTemplate = null;
let waEditingQueueUrls = {};
let lastQueueData = null;

function setScrapeMode(mode) {
    currentScrapeMode = mode || 'maps';
}

// DOM Elements
const searchForm = document.getElementById('search-form');
const inputNiche = document.getElementById('input-niche');
const inputLocation = document.getElementById('input-location');
const inputMaxResults = document.getElementById('input-max-results');
const inputMinReviews = document.getElementById('input-min-reviews');
const inputMaxReviews = document.getElementById('input-max-reviews');
const inputHeadless = document.getElementById('input-headless');
const inputSkipScanned = document.getElementById('input-skip-scanned');
const inputWebsiteFilter = document.getElementById('input-website-filter');

function getWhatsAppMode() {
    const checked = document.querySelector('input[name="wa-mode"]:checked');
    return checked ? checked.value : 'off';
}

const inputSendMessage = {
    get checked() {
        return getWhatsAppMode() === 'text';
    },
    set checked(val) {
        const mode = val ? 'text' : 'check';
        const radio = document.getElementById(`mode-${mode}`);
        if (radio) radio.checked = true;
    },
    disabled: false
};

const waMessagingSection = document.getElementById('wa-messaging-section');
const waMessageInputs = document.getElementById('wa-message-inputs');
const inputMessageDelay = document.getElementById('input-message-delay');
const inputMessageTemplate = document.getElementById('input-message-template');

const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const btnDownload = document.getElementById('btn-download');
const btnDownloadCsv = document.getElementById('btn-download-csv');
const btnRecheckWa = document.getElementById('btn-recheck-wa');
const btnClearDb = document.getElementById('btn-clear-db');

const groupMinReviews = document.getElementById('group-min-reviews');
const groupMaxReviews = document.getElementById('group-max-reviews');

// WhatsApp elements
const btnWaInit = document.getElementById('btn-wa-init');
const btnWaLogout = document.getElementById('btn-wa-logout');
const waStatusDot = document.getElementById('wa-status-dot');
const waStatusText = document.getElementById('wa-status-text');
const waBodyDisconnected = document.getElementById('wa-body-disconnected');
const waBodyInitializing = document.getElementById('wa-body-initializing');
const waBodyQr = document.getElementById('wa-body-qr');
const waBodyConnected = document.getElementById('wa-body-connected');
const waQrImg = document.getElementById('wa-qr-img');

// WhatsApp HUD elements
const waHudContainer = document.getElementById('wa-hud-container');
const waHudHeader = document.getElementById('wa-hud-header');
const waHudToggleBtn = document.getElementById('wa-hud-toggle-btn');
const waHudStatus = document.getElementById('wa-hud-status');
const waHudActiveDispatch = document.getElementById('wa-hud-active-dispatch');
const waHudActiveName = document.getElementById('wa-hud-active-name');
const waHudActivePhone = document.getElementById('wa-hud-active-phone');
const waHudActiveCountdown = document.getElementById('wa-hud-active-countdown');
const waHudProgressBarFill = document.getElementById('wa-hud-progress-bar-fill');
const waHudHistoryList = document.getElementById('wa-hud-history-list');

// Add new queue list elements
const waHudQueueSection = document.getElementById('wa-hud-queue-section');
const waHudQueueList = document.getElementById('wa-hud-queue-list');
const btnHudActiveEdit = document.getElementById('btn-hud-active-edit');
const btnHudActiveSkip = document.getElementById('btn-hud-active-skip');
const waHudActiveEditPanel = document.getElementById('wa-hud-active-edit-panel');
const waHudActiveEditText = document.getElementById('wa-hud-active-edit-text');
const btnHudActiveSave = document.getElementById('btn-hud-active-save');
const btnHudActiveCancel = document.getElementById('btn-hud-active-cancel');

const btnHudToggleQueue = document.getElementById('btn-hud-toggle-queue');

// Add multi-device selectors
const waDeviceSelect = document.getElementById('wa-device-select');
const btnWaAddDevice = document.getElementById('btn-wa-add-device');
const btnWaDeleteDevice = document.getElementById('btn-wa-delete-device');

// Log & table elements
const terminalLogs = document.getElementById('terminal-logs');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const resultsCount = document.getElementById('results-count');
const resultsTbody = document.getElementById('results-tbody');

// Location checklist DOM elements
const toggleLocationMode = document.getElementById('toggle-location-mode');
const locationManualGroup = document.getElementById('location-manual-group');
const locationChecklistGroup = document.getElementById('location-checklist-group');
const selectedStatesCount = document.getElementById('selected-states-count');
const btnTabUsa = document.getElementById('btn-tab-usa');
const btnTabCanada = document.getElementById('btn-tab-canada');
const btnTabEurope = document.getElementById('btn-tab-europe');
const btnTabGlobal = document.getElementById('btn-tab-global');

const panelUsaChecklist = document.getElementById('panel-usa-checklist');
const panelCanadaChecklist = document.getElementById('panel-canada-checklist');
const panelEuropeChecklist = document.getElementById('panel-europe-checklist');
const panelGlobalChecklist = document.getElementById('panel-global-checklist');

const usaStatesList = document.getElementById('usa-states-list');
const canadaProvincesList = document.getElementById('canada-provinces-list');
const europeCountriesList = document.getElementById('europe-countries-list');
const globalRegionsList = document.getElementById('global-regions-list');

const btnUsaSelectAll = document.getElementById('btn-usa-select-all');
const btnUsaClearAll = document.getElementById('btn-usa-clear-all');
const btnCanadaSelectAll = document.getElementById('btn-canada-select-all');
const btnCanadaClearAll = document.getElementById('btn-canada-clear-all');
const btnEuropeSelectAll = document.getElementById('btn-europe-select-all');
const btnEuropeClearAll = document.getElementById('btn-europe-clear-all');
const btnGlobalSelectAll = document.getElementById('btn-global-select-all');
const btnGlobalClearAll = document.getElementById('btn-global-clear-all');

let locationsDatabase = [];

let isConnectingWs = false;
let wsReconnectTimer = null;

// Connect to WebSocket Server
function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    appendLog('System', `Connecting to server at ${wsUrl}...`);
    
    try {
        ws = new WebSocket(wsUrl);
    } catch (err) {
        console.error('WebSocket creation error:', err);
        scheduleReconnect();
        return;
    }

    ws.onopen = () => {
        appendLog('System', 'Connected to backend server successfully!');
        if (wsReconnectTimer) {
            clearTimeout(wsReconnectTimer);
            wsReconnectTimer = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            const { type, data } = msg;

            switch (type) {
                case 'log-history':
                    terminalLogs.innerHTML = '';
                    if (data && data.length > 0) {
                        data.forEach(item => appendLog(item.timestamp, item.message));
                    }
                    break;
                case 'log':
                    appendLog(data.timestamp, data.message);
                    break;
                case 'progress':
                    updateProgressBar(data.percent, data.msg);
                    break;
                case 'result':
                    addScrapedLead(data);
                    break;
                case 'initial-leads':
                    scrapedLeads = data.filter(l => !l.discarded);
                    if (resultsCount) resultsCount.textContent = scrapedLeads.length;
                    const headerLeadsCount = document.getElementById('header-leads-count');
                    if (headerLeadsCount) headerLeadsCount.textContent = scrapedLeads.length;

                    resultsTbody.innerHTML = '';
                    if (scrapedLeads.length === 0) {
                        resultsTbody.innerHTML = `
                            <tr class="empty-row">
                                <td colspan="6">
                                    <div class="empty-state">
                                        <span class="empty-icon">📍</span>
                                        <p>No business leads collected yet. Launch scanner to populate results.</p>
                                    </div>
                                </td>
                            </tr>
                        `;
                        btnDownload.disabled = true;
                        btnDownloadCsv.disabled = true;
                        
                        // Hide session count badge on clear
                        const sessionCountBadge = document.getElementById('session-count');
                        if (sessionCountBadge) {
                            sessionCountBadge.style.display = 'none';
                        }

                        // Clear terminal logs when there's nothing in history
                        terminalLogs.innerHTML = '';
                    } else {
                        scrapedLeads.forEach(lead => addLeadToTable(lead));
                        btnDownload.disabled = false;
                        btnDownloadCsv.disabled = false;
                    }
                    break;
                case 'result-update':
                    updateScrapedLead(data);
                    break;
                case 'scrape-finished':
                    handleScrapeFinished(data);
                    break;
                case 'scrape-paused':
                    handleScrapePaused(data);
                    break;
                case 'scrape-state':
                    handleScrapeState(data);
                    break;
                case 'whatsapp-status':
                    handleWhatsAppStatus(data);
                    break;
                case 'wa-send-status':
                    handleWaSendStatus(data);
                    break;
                case 'wa-queue-update':
                    handleWaQueueUpdate(data);
                    break;
                case 'whatsapp-devices-list':
                    handleWhatsAppDevicesList(data);
                    break;
                case 'ping':
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'pong' }));
                    }
                    break;
                default:
                    console.warn('Unknown message type received:', type);
            }
        } catch (err) {
            console.error('Error parsing WebSocket message:', err);
        }
    };

    ws.onclose = () => {
        appendLog('System', 'Connection to server lost. Retrying in 3 seconds...');
        scheduleReconnect();
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
    };
}

function scheduleReconnect() {
    if (!wsReconnectTimer) {
        wsReconnectTimer = setTimeout(() => {
            wsReconnectTimer = null;
            connectWebSocket();
        }, 3000);
    }
}

// UI Status Sync
function updateAppStatus(status) {
    const badge = document.getElementById('app-status-badge');
    const dot = document.getElementById('app-status-dot');
    const text = document.getElementById('app-status-text');

    if (!badge || !text) return;

    badge.className = 'scanner-status-pill';

    if (status === 'RUNNING') {
        badge.classList.add('running');
        text.textContent = 'RUNNING';
    } else if (status === 'PAUSED') {
        badge.classList.add('paused');
        text.textContent = 'PAUSED';
    } else {
        badge.classList.add('stopped');
        text.textContent = 'STOPPED';
    }
}

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Append logs to our terminal widget with color coding
function appendLog(timestamp, message) {
    const isSystem = timestamp === 'System';
    const logLine = document.createElement('div');
    
    let typeClass = 'log-info';
    const lower = (message || '').toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('aborted') || lower.includes('exception')) {
        typeClass = 'log-error';
    } else if (lower.includes('warn') || lower.includes('pause') || lower.includes('stopped') || lower.includes('cap limit')) {
        typeClass = 'log-warning';
    } else if (lower.includes('found new') || lower.includes('connected') || lower.includes('success') || lower.includes('completed') || lower.includes('ready')) {
        typeClass = 'log-success';
    } else if (isSystem || lower.includes('[system]')) {
        typeClass = 'log-system';
    }

    logLine.className = `log-line ${typeClass}`;
    logLine.textContent = isSystem ? `[${timestamp}] ${message}` : `[${timestamp}] ${message}`;
    
    if (terminalLogs) {
        terminalLogs.appendChild(logLine);
        const toggleAutoScroll = document.getElementById('toggle-autoscroll');
        if (!toggleAutoScroll || toggleAutoScroll.checked) {
            terminalLogs.scrollTop = terminalLogs.scrollHeight;
        }
    }
}

// Update progress indicators
function updateProgressBar(percent, msg) {
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}%`;
    
    const sidebarFill = document.getElementById('sidebar-cap-fill');
    if (sidebarFill) sidebarFill.style.width = `${percent}%`;
}

// Handle WhatsApp message send status
function handleWaSendStatus(data) {
    const urlId = btoa(data.url).replace(/[^a-z0-9]/gi, '');
    const cell = document.getElementById(`msg-status-${urlId}`);
    if (cell) {
        let classBadge = 'whatsapp-maybe';
        let statusText = data.status;
        if (data.status === 'Sent') {
            classBadge = 'whatsapp-yes';
            statusText = 'Sent ✅';
        } else if (data.status === 'Failed') {
            classBadge = 'whatsapp-no';
            statusText = `Failed ❌`;
            cell.title = data.error || 'Unknown error';
        } else if (data.status === 'Queued') {
            classBadge = 'whatsapp-maybe';
            statusText = 'Queued ⏳';
        }
        cell.innerHTML = `<span class="badge ${classBadge}">${statusText}</span>`;
    }
}

// Add single lead DOM row to the table (or update if exists)
function addLeadToTable(lead) {
    // WhatsApp badge
    let waBadgeHtml = '';
    if (!lead.phone) {
        waBadgeHtml = '<span class="badge whatsapp-no">No Phone</span>';
    } else if (lead.whatsappRegistered === true) {
        waBadgeHtml = '<span class="badge whatsapp-yes">✅ Registered</span>';
    } else if (lead.whatsappRegistered === false) {
        waBadgeHtml = '<span class="badge whatsapp-no">❌ Not on WA</span>';
    } else {
        waBadgeHtml = '<span class="badge whatsapp-maybe">Not Checked</span>';
    }

    // Message sending badge
    const urlId = btoa(lead.url).replace(/[^a-z0-9]/gi, '');
    let msgBadgeHtml = '<span class="badge whatsapp-maybe">None</span>';
    if (inputSendMessage.checked && lead.whatsappRegistered === true) {
        msgBadgeHtml = '<span class="badge whatsapp-maybe">Queued ⏳</span>';
    } else if (inputSendMessage.checked && lead.whatsappRegistered !== true) {
        msgBadgeHtml = '<span class="badge whatsapp-no" title="Skipped: WhatsApp not verified or no phone">Skipped 🚫</span>';
    }

    // reviews formatting
    const reviews = lead.reviewsCount !== undefined ? lead.reviewsCount : '0';
    const column5Html = `${reviews} reviews`;
    const actionButtonsHtml = `
        <a href="${lead.url}" target="_blank" class="btn-table-action">🗺️ Maps</a>
        ${lead.whatsappLink ? `<a href="${lead.whatsappLink}" target="_blank" class="btn-table-action btn-wa-chat">💬 Chat</a>` : ''}
        ${lead.website ? `<a href="${lead.website}" target="_blank" class="btn-table-action">🌐 Web</a>` : ''}
    `;

    const urlIdSanitized = btoa(lead.url).replace(/[^a-z0-9]/gi, '');
    let tr = document.getElementById(`row-${urlIdSanitized}`);
    let isNewRow = false;
    if (!tr) {
        tr = document.createElement('tr');
        tr.id = `row-${urlIdSanitized}`;
        isNewRow = true;
    }

    tr.innerHTML = `
        <td><strong>${escapeHtml(lead.name)}</strong></td>
        <td><code>${escapeHtml(lead.phone || 'N/A')}</code></td>
        <td>${waBadgeHtml}</td>
        <td id="msg-status-${urlId}">${msgBadgeHtml}</td>
        <td>${column5Html}</td>
        <td class="action-cell">
            ${actionButtonsHtml}
        </td>
    `;

    // Prepend row to the top of the table and trigger a glowing pulse animation
    resultsTbody.insertBefore(tr, resultsTbody.firstChild);
    tr.classList.remove('row-flash');
    void tr.offsetWidth; // Trigger reflow to restart keyframe animation
    tr.classList.add('row-flash');
    setTimeout(() => {
        tr.classList.remove('row-flash');
    }, 1500);
}

// Handle Scraped Lead (Addition or Update from scraper)
function addScrapedLead(lead) {
    if (lead.discarded) return;
    const existsIndex = scrapedLeads.findIndex(l => l.url === lead.url);
    if (existsIndex === -1) {
        scrapedLeads.push(lead);
        resultsCount.textContent = scrapedLeads.length;

        // Remove empty row if this is the first result
        if (scrapedLeads.length === 1) {
            resultsTbody.innerHTML = '';
        }
    } else {
        scrapedLeads[existsIndex] = { ...scrapedLeads[existsIndex], ...lead };
    }

    if (isScraping) {
        sessionLeadsCount++;
        const sessionCountBadge = document.getElementById('session-count');
        if (sessionCountBadge) {
            sessionCountBadge.textContent = `+${sessionLeadsCount} in this scan`;
            sessionCountBadge.style.display = 'inline-block';
        }
    }

    addLeadToTable(lead);
    btnDownload.disabled = false;
    btnDownloadCsv.disabled = false;
}

// Update single lead (from WhatsApp recheck, etc.)
function updateScrapedLead(lead) {
    if (lead.discarded) return;
    const existsIndex = scrapedLeads.findIndex(l => l.url === lead.url);
    if (existsIndex !== -1) {
        scrapedLeads[existsIndex] = { ...scrapedLeads[existsIndex], ...lead };
        addLeadToTable(lead);
    }
}

// Escape HTML utility to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// Handle Scrape Finished
function handleScrapeFinished(data) {
    isScraping = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnPause.innerHTML = '<span>⏸️</span> Pause';
    btnPause.className = 'btn btn-amber-pause';
    btnStop.disabled = true;
    
    // Reset form states & status
    toggleInputs(false);
    updateAppStatus('STOPPED');

    if (data.stopped) {
        appendLog('System', 'Scraper stopped by user request.');
        showToast('Scanner stopped', 'warning');
    } else if (data.success) {
        appendLog('System', 'Scraper finished scanning all targets.');
        showToast('Scanner finished successfully!', 'success');
    } else {
        appendLog('System', `Scraper finished with error: ${data.error}`);
        showToast(`Scanner error: ${data.error}`, 'error');
    }
}

// Handle Scrape Paused
function handleScrapePaused(data) {
    const { paused } = data;
    if (paused) {
        btnPause.innerHTML = '<span>▶️</span> Resume';
        btnPause.className = 'btn btn-primary';
        appendLog('System', 'Scanner and queue paused.');
        toggleInputs(true, true);
        updateAppStatus('PAUSED');
        showToast('Scanner paused', 'warning');
    } else {
        btnPause.innerHTML = '<span>⏸️</span> Pause';
        btnPause.className = 'btn btn-amber-pause';
        appendLog('System', 'Scanner and queue resumed.');
        toggleInputs(true, false);
        updateAppStatus('RUNNING');
        showToast('Scanner resumed', 'info');
    }
}

// Handle Scrape State Sync on Connection
function handleScrapeState(data) {
    isScraping = data.isScraping;
    if (isScraping) {
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnStop.disabled = false;
        toggleInputs(true, data.isPaused);
        
        if (data.isPaused) {
            btnPause.innerHTML = '<span>▶️</span> Resume';
            btnPause.className = 'btn btn-primary';
            updateAppStatus('PAUSED');
        } else {
            btnPause.innerHTML = '<span>⏸️</span> Pause';
            btnPause.className = 'btn btn-amber-pause';
            updateAppStatus('RUNNING');
        }

        // Restore active search configuration in form fields
        if (data.niche !== undefined) inputNiche.value = data.niche;
        if (data.locationText !== undefined) inputLocation.value = data.locationText;
        if (data.maxResults !== undefined) inputMaxResults.value = data.maxResults;
        if (data.minReviews !== undefined) inputMinReviews.value = data.minReviews;
        if (data.maxReviews !== undefined) inputMaxReviews.value = (data.maxReviews === null || data.maxReviews === Infinity) ? '' : data.maxReviews;
        if (data.websiteFilter !== undefined) inputWebsiteFilter.value = data.websiteFilter;

        // Restore checklist checkboxes and toggle views
        if (data.selectedStates && data.selectedStates.length > 0) {
            toggleLocationMode.checked = true;
            locationManualGroup.style.display = 'none';
            locationChecklistGroup.style.display = 'block';

            document.querySelectorAll('input[name="selected-state"]').forEach(cb => {
                cb.checked = data.selectedStates.includes(cb.value);
            });
            updateSelectedStatesCount();
        } else {
            toggleLocationMode.checked = false;
            locationManualGroup.style.display = 'block';
            locationChecklistGroup.style.display = 'none';
            updateSelectedStatesCount();
        }

        // Restore session count badge
        sessionLeadsCount = data.sessionLeadsCount || 0;
        const sessionCountBadge = document.getElementById('session-count');
        if (sessionCountBadge) {
            sessionCountBadge.textContent = `+${sessionLeadsCount} in this scan`;
            sessionCountBadge.style.display = 'inline-block';
        }
    } else {
        btnStart.disabled = false;
        btnPause.disabled = true;
        btnPause.innerHTML = '<span>⏸️</span> Pause';
        btnPause.className = 'btn btn-amber-pause';
        btnStop.disabled = true;
        toggleInputs(false);
        updateAppStatus('STOPPED');

        // Hide session count badge
        const sessionCountBadge = document.getElementById('session-count');
        if (sessionCountBadge) {
            sessionCountBadge.style.display = 'none';
        }
    }
}

// Handle WhatsApp queue updates
function handleWaQueueUpdate(data) {
    lastQueueData = data;
    const { queueLength, isPaused, activeItem, queue, recentDispatches } = data;

    // Control HUD toggle queue button visibility and styles dynamically
    if (btnHudToggleQueue) {
        const mode = getWhatsAppMode();
        if (isScraping && mode !== 'off') {
            btnHudToggleQueue.style.display = 'inline-block';
            if (isPaused) {
                btnHudToggleQueue.textContent = 'Resume Msg';
                btnHudToggleQueue.style.borderColor = 'var(--color-success)';
                btnHudToggleQueue.style.color = 'var(--color-success)';
                
                // Select "Only Check" radio button
                const checkRadio = document.getElementById('mode-check');
                if (checkRadio) checkRadio.checked = true;
                waMessageInputs.style.display = 'none';
            } else {
                btnHudToggleQueue.textContent = 'Pause Msg';
                btnHudToggleQueue.style.borderColor = 'var(--color-warning)';
                btnHudToggleQueue.style.color = 'var(--color-warning)';
                
                // Select "Text if Have" radio button
                const textRadio = document.getElementById('mode-text');
                if (textRadio) textRadio.checked = true;
                waMessageInputs.style.display = 'flex';
            }
        } else {
            btnHudToggleQueue.style.display = 'none';
        }
    }

    // Expand HUD automatically if there is activity in the queue
    if ((queueLength > 0 || recentDispatches.length > 0) && waHudContainer.classList.contains('minimized')) {
        waHudContainer.classList.remove('minimized');
        waHudToggleBtn.textContent = '▼';
    }

    // 1. Status badge update
    if (queueLength === 0) {
        waHudStatus.textContent = 'Idle';
        waHudStatus.style.borderColor = 'var(--text-muted)';
        waHudStatus.style.color = 'var(--text-muted)';
        waHudStatus.style.boxShadow = 'none';
        waHudStatus.style.backgroundColor = 'transparent';
    } else if (isPaused) {
        waHudStatus.textContent = 'Paused ⏳';
        waHudStatus.style.borderColor = 'var(--color-warning)';
        waHudStatus.style.color = 'var(--color-warning)';
        waHudStatus.style.boxShadow = '0 0 5px var(--color-warning-glow)';
        waHudStatus.style.backgroundColor = 'rgba(255, 183, 0, 0.05)';
    } else {
        waHudStatus.textContent = `Sending (Queue: ${queueLength})`;
        waHudStatus.style.borderColor = 'var(--color-accent)';
        waHudStatus.style.color = 'var(--text-bright)';
        waHudStatus.style.boxShadow = '0 0 5px var(--color-accent-glow)';
        waHudStatus.style.backgroundColor = 'rgba(0, 255, 65, 0.05)';
    }

    // 2. Active dispatch block
    if (activeItem && queueLength > 0) {
        waHudActiveDispatch.style.display = 'block';
        waHudActiveName.textContent = activeItem.name;
        waHudActivePhone.textContent = activeItem.phone || 'N/A';
        waHudActiveCountdown.textContent = `Waiting: ${activeItem.remainingSeconds}s`;

        waActiveItemTemplate = activeItem.messageTemplate;
        
        btnHudActiveEdit.setAttribute('data-url', activeItem.url);
        btnHudActiveSkip.setAttribute('data-url', activeItem.url);

        // Fill textarea if not currently editing (prevents wiping out typing)
        if (waActiveEditUrl !== activeItem.url) {
            waHudActiveEditText.value = activeItem.messageTemplate || '';
            waHudActiveEditPanel.style.display = 'none';
        } else {
            waHudActiveEditPanel.style.display = 'block';
        }

        // Calculate progress percentage
        const total = activeItem.totalDelay || 60;
        const remaining = activeItem.remainingSeconds;
        const progressPercent = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
        waHudProgressBarFill.style.width = `${progressPercent}%`;
    } else {
        waHudActiveDispatch.style.display = 'none';
        waHudProgressBarFill.style.width = '0%';
        waActiveEditUrl = null;
        waHudActiveEditPanel.style.display = 'none';
    }

    // 3. Populate Upcoming Queue list (index 1 onwards)
    const pendingItems = queue ? queue.slice(1) : [];
    if (pendingItems.length > 0) {
        waHudQueueSection.style.display = 'block';
        waHudQueueList.innerHTML = '';
        
        pendingItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'hud-queue-item';

            const isEditing = waEditingQueueUrls[item.url] !== undefined;

            if (isEditing) {
                const cleanId = btoa(item.url).replace(/[^a-z0-9]/gi, '');
                itemDiv.innerHTML = `
                    <div class="hud-queue-item-header">
                        <span class="hud-queue-item-name">${escapeHtml(item.name)}</span>
                    </div>
                    <textarea class="hud-edit-textarea" id="edit-text-${cleanId}" rows="3" style="width: 100%; font-family: var(--font-mono); font-size: 0.75rem; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 4px; resize: vertical; margin-top: 4px;">${escapeHtml(waEditingQueueUrls[item.url])}</textarea>
                    <div style="display: flex; gap: 5px; justify-content: flex-end; margin-top: 4px;">
                        <button class="btn-hud-action success" onclick="saveQueueItem('${item.url}')">Save 💾</button>
                        <button class="btn-hud-action" onclick="cancelEditQueueItem('${item.url}')">✕</button>
                    </div>
                `;
            } else {
                itemDiv.innerHTML = `
                    <div class="hud-queue-item-header">
                        <span class="hud-queue-item-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-hud-action" onclick="startEditQueueItem('${item.url}', \`${escapeHtml(item.messageTemplate.replace(/`/g, '\\`'))}\`)">✏️</button>
                            <button class="btn-hud-action danger" onclick="deleteQueueItem('${item.url}')">❌</button>
                        </div>
                    </div>
                    <span class="hud-queue-item-phone">${escapeHtml(item.phone || 'N/A')}</span>
                `;
            }
            waHudQueueList.appendChild(itemDiv);
        });
    } else {
        waHudQueueSection.style.display = 'none';
        waHudQueueList.innerHTML = '';
    }

    // 4. Populate history
    if (recentDispatches && recentDispatches.length > 0) {
        waHudHistoryList.innerHTML = '';
        recentDispatches.forEach(dispatch => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wa-hud-history-item';
            
            let badgeClass = 'whatsapp-maybe';
            if (dispatch.status.includes('Sent')) {
                badgeClass = 'whatsapp-yes';
            } else if (dispatch.status.includes('Failed')) {
                badgeClass = 'whatsapp-no';
            }

            itemDiv.innerHTML = `
                <span class="wa-hud-history-item-name" title="${escapeHtml(dispatch.name)}">${escapeHtml(dispatch.name)}</span>
                <span class="badge ${badgeClass} wa-hud-history-item-status" title="${escapeHtml(dispatch.status)}">${escapeHtml(dispatch.status)}</span>
            `;
            waHudHistoryList.appendChild(itemDiv);
        });
    } else {
        waHudHistoryList.innerHTML = '<div class="empty-row" style="font-size: 0.7rem; text-align: center; color: var(--text-muted);">No messages dispatched yet.</div>';
    }
}

// Toggle inputs during active scrape to prevent configuration conflicts
function toggleInputs(disabled, isPaused = false) {
    inputNiche.disabled = disabled;
    inputLocation.disabled = disabled;
    inputMaxResults.disabled = disabled;
    inputMinReviews.disabled = disabled;
    inputMaxReviews.disabled = disabled;
    inputHeadless.disabled = disabled;
    if (inputSkipScanned) inputSkipScanned.disabled = disabled;
    inputWebsiteFilter.disabled = disabled;
    
    toggleLocationMode.disabled = disabled;
    document.querySelectorAll('input[name="selected-state"]').forEach(cb => cb.disabled = disabled);
    btnUsaSelectAll.disabled = disabled;
    btnUsaClearAll.disabled = disabled;
    btnCanadaSelectAll.disabled = disabled;
    btnCanadaClearAll.disabled = disabled;

    // Allow editing message delay, template, and switching WA mode while paused
    const messagingDisabled = disabled && !isPaused;
    inputMessageDelay.disabled = messagingDisabled;
    inputMessageTemplate.disabled = messagingDisabled;

    const modeOff = document.getElementById('mode-off');
    if (modeOff) modeOff.disabled = messagingDisabled;
}

// Update WhatsApp Session Card Views
function handleWhatsAppStatus(statusData) {
    const { status, qr } = statusData;

    // Reset status classes
    waStatusDot.className = 'status-dot';
    
    // Hide all bodies
    waBodyDisconnected.classList.remove('active');
    waBodyInitializing.classList.remove('active');
    waBodyQr.classList.remove('active');
    waBodyConnected.classList.remove('active');

    switch (status) {
        case 'DISCONNECTED':
            waStatusDot.classList.add('disconnected');
            waStatusText.textContent = 'Disconnected';
            waBodyDisconnected.classList.add('active');
            break;
            
        case 'INITIALIZING':
            waStatusDot.classList.add('initializing');
            waStatusText.textContent = 'Initializing';
            waBodyInitializing.classList.add('active');
            break;

        case 'QR_READY':
            waStatusDot.classList.add('qr-ready');
            waStatusText.textContent = 'Scan QR Code';
            if (qr) {
                waQrImg.src = qr;
            }
            waBodyQr.classList.add('active');
            break;

        case 'CONNECTED':
            waStatusDot.classList.add('connected');
            waStatusText.textContent = 'Connected';
            waBodyConnected.classList.add('active');
            break;
    }
}

// Event Listeners
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (isScraping) return;

    // Reset session counter and badge
    sessionLeadsCount = 0;
    const sessionCountBadge = document.getElementById('session-count');
    if (sessionCountBadge) {
        sessionCountBadge.textContent = `+${sessionLeadsCount} in this scan`;
        sessionCountBadge.style.display = 'inline-block';
    }

    // Clear terminal logs and start fresh
    terminalLogs.innerHTML = '';
    appendLog('System', 'Starting new search... New leads will be appended to the history table.');

    // Gather parameters
    const maxReviewsVal = inputMaxReviews.value ? parseInt(inputMaxReviews.value, 10) : Infinity;

    let selectedStates = [];
    if (toggleLocationMode.checked) {
        document.querySelectorAll('input[name="selected-state"]:checked').forEach(cb => {
            selectedStates.push(cb.value);
        });
        if (selectedStates.length === 0) {
            alert('Please select at least one State or Province to scan!');
            return;
        }
    }

    const data = {
        mode: currentScrapeMode,
        niche: inputNiche.value.trim(),
        location: toggleLocationMode.checked ? '' : inputLocation.value.trim(),
        selectedStates: selectedStates,
        maxResults: parseInt(inputMaxResults.value, 10) || 50,
        minReviews: parseInt(inputMinReviews.value, 10) || 0,
        maxReviews: maxReviewsVal,
        headless: inputHeadless.checked,
        skipScanned: inputSkipScanned ? inputSkipScanned.checked : true,
        websiteFilter: inputWebsiteFilter.value,
        sendAutoMessage: inputSendMessage.checked,
        waMode: getWhatsAppMode(),
        messageTemplate: inputMessageTemplate.value,
        messageDelay: parseInt(inputMessageDelay.value, 10) || 60
    };

    // Send start signal
    ws.send(JSON.stringify({
        type: 'start-scrape',
        data
    }));

    isScraping = true;
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnStop.disabled = false;
    toggleInputs(true);
    updateAppStatus('RUNNING');
    showToast('🚀 Scanner started! Fetching leads...', 'success');
});

btnPause.addEventListener('click', () => {
    if (!isScraping) return;
    
    const isCurrentlyPaused = btnPause.classList.contains('btn-primary');
    if (isCurrentlyPaused) {
        ws.send(JSON.stringify({ type: 'resume-scrape' }));
    } else {
        ws.send(JSON.stringify({ type: 'pause-scrape' }));
    }
});

btnStop.addEventListener('click', () => {
    if (!isScraping) return;
    ws.send(JSON.stringify({ type: 'stop-scrape' }));
    showToast('⏹️ Stopping scanner...', 'warning');
});

// WhatsApp Queue HUD Minimization toggler
waHudHeader.addEventListener('click', () => {
    const isMinimized = waHudContainer.classList.toggle('minimized');
    waHudToggleBtn.textContent = isMinimized ? '▲' : '▼';
});

waHudToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isMinimized = waHudContainer.classList.toggle('minimized');
    waHudToggleBtn.textContent = isMinimized ? '▲' : '▼';
});

btnWaInit.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'whatsapp-init' }));
});

btnWaLogout.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'whatsapp-logout' }));
});

// Setup messaging event listeners
document.querySelectorAll('input[name="wa-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const mode = getWhatsAppMode();
        
        // Show/hide message inputs
        if (mode === 'text') {
            waMessageInputs.style.display = 'flex';
        } else {
            waMessageInputs.style.display = 'none';
        }

        if (isScraping) {
            // During scan, switch auto-messaging queue state
            ws.send(JSON.stringify({
                type: 'whatsapp-toggle-queue',
                data: { 
                    enabled: (mode === 'text'),
                    mode: mode
                }
            }));
        } else {
            // Outside scan, disconnect if turned Off, otherwise initialize
            if (mode === 'off') {
                ws.send(JSON.stringify({ type: 'whatsapp-disconnect' }));
            } else {
                ws.send(JSON.stringify({ type: 'whatsapp-init' }));
            }
        }
    });
});

if (btnHudToggleQueue) {
    btnHudToggleQueue.addEventListener('click', () => {
        ws.send(JSON.stringify({ type: 'whatsapp-toggle-queue' }));
    });
}

// Pre-populate default messaging template
const defaultTemplate = `hi is this the owner of {name}`;

inputMessageTemplate.value = defaultTemplate;

// Bulk Recheck WhatsApp status
btnRecheckWa.addEventListener('click', () => {
    if (scrapedLeads.length === 0) {
        alert('There are no scraped leads to verify!');
        return;
    }
    const yes = confirm(`Are you sure you want to verify WhatsApp registration status for all ${scrapedLeads.length} leads? This will check them sequentially.`);
    if (yes) {
        ws.send(JSON.stringify({ type: 'whatsapp-recheck-all' }));
        showToast('🔄 Rechecking WhatsApp registration...', 'info');
    }
});

// Clear persistent database
btnClearDb.addEventListener('click', () => {
    const yes = confirm('Are you sure you want to permanently clear all scraped leads from disk and reset the dashboard? This action cannot be undone.');
    if (yes) {
        ws.send(JSON.stringify({ type: 'clear-leads-db' }));
        showToast('🗑️ Lead database cleared', 'warning');
    }
});

// Excel Export logic
btnDownload.addEventListener('click', () => {
    if (scrapedLeads.length === 0) return;

    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Leads</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    </head>
    <body>
        <table>
            <thead>
                <tr style="background-color: #10B981; color: #FFFFFF; font-weight: bold;">
                    <th>Business Name</th>
                    <th>Phone Number</th>
                    <th>WhatsApp Status</th>
                    <th>Message Status</th>
                    <th>Reviews</th>
                    <th>Facebook Ads Link</th>
                    <th>Website</th>
                    <th>WhatsApp Link</th>
                    <th>Source URL</th>
                </tr>
            </thead>
            <tbody>
    `;

    scrapedLeads.forEach(lead => {
        let waStatus = 'Unverified';
        if (lead.whatsappRegistered === true) waStatus = 'Registered';
        else if (lead.whatsappRegistered === false) waStatus = 'Not on WA';

        const urlId = btoa(lead.url).replace(/[^a-z0-9]/gi, '');
        const cell = document.getElementById(`msg-status-${urlId}`);
        const msgStatus = cell ? cell.textContent.trim() : 'None';

        html += `
            <tr>
                <td>${escapeXml(lead.name || '')}</td>
                <td style="mso-number-format:'\\@';">${escapeXml(lead.phone || '')}</td>
                <td>${waStatus}</td>
                <td>${msgStatus}</td>
                <td>${lead.reviewsCount || 0}</td>
                <td>${lead.facebookAdLink || ''}</td>
                <td>${lead.website || ''}</td>
                <td>${lead.whatsappLink || ''}</td>
                <td>${lead.url || ''}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </body>
    </html>
    `;

    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const nicheClean = inputNiche.value.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const locationClean = inputLocation.value.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    link.setAttribute('download', `leads_${nicheClean}_${locationClean}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`📊 Exported ${scrapedLeads.length} leads to Excel`, 'success');
});

// CSV Export logic
btnDownloadCsv.addEventListener('click', () => {
    if (scrapedLeads.length === 0) return;

    let csvRows = ['Business Name,Phone Number,Reviews,Facebook Ads Link,Website,WhatsApp Status,Message Status,WhatsApp Chat Link,Source URL'];

    scrapedLeads.forEach(lead => {
        const name = `"${lead.name.replace(/"/g, '""')}"`;
        const phone = `"${(lead.phone || '').replace(/"/g, '""')}"`;
        const reviews = lead.reviewsCount || 0;
        const fbAds = `"${(lead.facebookAdLink || '').replace(/"/g, '""')}"`;
        const web = `"${(lead.website || '').replace(/"/g, '""')}"`;
        
        let waStatus = 'Unverified';
        if (lead.whatsappRegistered === true) waStatus = 'Registered';
        else if (lead.whatsappRegistered === false) waStatus = 'Not on WA';

        const urlId = btoa(lead.url).replace(/[^a-z0-9]/gi, '');
        const cell = document.getElementById(`msg-status-${urlId}`);
        const msgStatus = cell ? cell.textContent.trim() : 'None';

        const waLink = lead.whatsappLink ? `"${lead.whatsappLink}"` : '""';
        const mapUrl = `"${lead.url}"`;

        csvRows.push([name, phone, reviews, fbAds, web, waStatus, `"${msgStatus}"`, waLink, mapUrl].join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const nicheClean = inputNiche.value.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const locationClean = inputLocation.value.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    link.setAttribute('download', `leads_${nicheClean}_${locationClean}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`📄 Exported ${scrapedLeads.length} leads to CSV`, 'success');
});

// Clear console log listener
const btnClearTerminal = document.getElementById('btn-clear-terminal');
if (btnClearTerminal) {
    btnClearTerminal.addEventListener('click', () => {
        if (terminalLogs) terminalLogs.innerHTML = '';
        showToast('Console logs cleared', 'info');
    });
}

// Live table search input listener
const inputTableSearch = document.getElementById('input-table-search');
if (inputTableSearch) {
    inputTableSearch.addEventListener('input', () => {
        const query = inputTableSearch.value.toLowerCase().trim();
        const rows = resultsTbody.querySelectorAll('tr:not(.empty-row)');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// Multi-device select UI handler
function handleWhatsAppDevicesList(data) {
    const { devices, activeId } = data;
    waDeviceSelect.innerHTML = '';
    devices.forEach(device => {
        const opt = document.createElement('option');
        opt.value = device.id;
        opt.textContent = device.name;
        if (device.id === activeId) {
            opt.selected = true;
        }
        waDeviceSelect.appendChild(opt);
    });
}

// Multi-device listeners
waDeviceSelect.addEventListener('change', () => {
    ws.send(JSON.stringify({
        type: 'whatsapp-select-device',
        data: { id: waDeviceSelect.value }
    }));
});

btnWaAddDevice.addEventListener('click', () => {
    const name = prompt('Enter a name for this WhatsApp account (e.g. Sales, Marketing):');
    if (name && name.trim()) {
        ws.send(JSON.stringify({
            type: 'whatsapp-add-device',
            data: { name: name.trim() }
        }));
    }
});

btnWaDeleteDevice.addEventListener('click', () => {
    const activeOption = waDeviceSelect.options[waDeviceSelect.selectedIndex];
    if (!activeOption) return;
    
    const name = activeOption.textContent;
    const id = waDeviceSelect.value;
    
    if (confirm(`Are you sure you want to delete the account "${name}"? This will log out and permanently delete its session data.`)) {
        ws.send(JSON.stringify({
            type: 'whatsapp-delete-device',
            data: { id }
        }));
    }
});

// Active HUD item control bindings
btnHudActiveEdit.addEventListener('click', () => {
    const url = btnHudActiveEdit.getAttribute('data-url');
    if (!url) return;

    if (waActiveEditUrl === url) {
        waActiveEditUrl = null;
        waHudActiveEditPanel.style.display = 'none';
    } else {
        waActiveEditUrl = url;
        waHudActiveEditText.value = waActiveItemTemplate || '';
        waHudActiveEditPanel.style.display = 'block';
    }
});

btnHudActiveCancel.addEventListener('click', () => {
    waActiveEditUrl = null;
    waHudActiveEditPanel.style.display = 'none';
});

btnHudActiveSave.addEventListener('click', () => {
    const url = btnHudActiveEdit.getAttribute('data-url');
    if (!url) return;
    
    const text = waHudActiveEditText.value;
    ws.send(JSON.stringify({
        type: 'wa-queue-edit',
        data: { url, text }
    }));
    
    waActiveEditUrl = null;
    waHudActiveEditPanel.style.display = 'none';
});

btnHudActiveSkip.addEventListener('click', () => {
    const url = btnHudActiveSkip.getAttribute('data-url');
    if (!url) return;
    
    if (confirm('Are you sure you want to skip sending to this business?')) {
        ws.send(JSON.stringify({
            type: 'wa-queue-delete',
            data: { url }
        }));
    }
});

// Pending queue inline actions
window.startEditQueueItem = function(url, text) {
    waEditingQueueUrls[url] = text;
    if (lastQueueData) {
        handleWaQueueUpdate(lastQueueData);
    }
};

window.cancelEditQueueItem = function(url) {
    delete waEditingQueueUrls[url];
    if (lastQueueData) {
        handleWaQueueUpdate(lastQueueData);
    }
};

window.saveQueueItem = function(url) {
    const id = btoa(url).replace(/[^a-z0-9]/gi, '');
    const textarea = document.getElementById(`edit-text-${id}`);
    if (textarea) {
        const text = textarea.value;
        ws.send(JSON.stringify({
            type: 'wa-queue-edit',
            data: { url, text }
        }));
    }
    delete waEditingQueueUrls[url];
};

window.deleteQueueItem = function(url) {
    if (confirm('Are you sure you want to delete this business from the messaging queue?')) {
        ws.send(JSON.stringify({
            type: 'wa-queue-delete',
            data: { url }
        }));
    }
};

// Location Checklist Logic
async function loadLocationsDatabase() {
    try {
        const response = await fetch('locations_db.json');
        locationsDatabase = await response.json();
        populateChecklists();
    } catch (err) {
        console.error('Failed to load locations database:', err);
    }
}

function populateChecklists() {
    if (usaStatesList) usaStatesList.innerHTML = '';
    if (canadaProvincesList) canadaProvincesList.innerHTML = '';
    if (europeCountriesList) europeCountriesList.innerHTML = '';
    if (globalRegionsList) globalRegionsList.innerHTML = '';

    const europeCountries = ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'];

    locationsDatabase.forEach(state => {
        const item = document.createElement('label');
        item.className = 'checklist-item';
        
        // Format population representation
        const formattedPop = (state.population / 1000000).toFixed(1) + 'M';
        
        item.innerHTML = `
            <input type="checkbox" name="selected-state" value="${state.name}" data-country="${state.country}">
            <span class="checklist-item-text"><strong>${state.name}</strong> (${state.code})</span>
            <span class="checklist-item-pop">${formattedPop}</span>
        `;
        
        item.querySelector('input').addEventListener('change', updateSelectedStatesCount);

        if (state.country === 'USA') {
            if (usaStatesList) usaStatesList.appendChild(item);
        } else if (state.country === 'Canada') {
            if (canadaProvincesList) canadaProvincesList.appendChild(item);
        } else if (europeCountries.includes(state.country)) {
            if (europeCountriesList) europeCountriesList.appendChild(item);
        } else {
            if (globalRegionsList) globalRegionsList.appendChild(item);
        }
    });
    
    updateSelectedStatesCount();
}

function updateSelectedStatesCount() {
    const checked = document.querySelectorAll('input[name="selected-state"]:checked');
    selectedStatesCount.textContent = `${checked.length} selected`;
    
    // Toggle manual text field validation rules based on current mode
    const isChecklistActive = toggleLocationMode.checked;
    if (isChecklistActive) {
        inputLocation.required = false;
    } else {
        inputLocation.required = true;
    }
}

// Tab Switching Listeners
function switchTab(activeBtn, activePanel) {
    [btnTabUsa, btnTabCanada, btnTabEurope, btnTabGlobal].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    [panelUsaChecklist, panelCanadaChecklist, panelEuropeChecklist, panelGlobalChecklist].forEach(panel => {
        if (panel) panel.style.display = 'none';
    });
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.style.display = 'block';
}

if (btnTabUsa) btnTabUsa.addEventListener('click', () => switchTab(btnTabUsa, panelUsaChecklist));
if (btnTabCanada) btnTabCanada.addEventListener('click', () => switchTab(btnTabCanada, panelCanadaChecklist));
if (btnTabEurope) btnTabEurope.addEventListener('click', () => switchTab(btnTabEurope, panelEuropeChecklist));
if (btnTabGlobal) btnTabGlobal.addEventListener('click', () => switchTab(btnTabGlobal, panelGlobalChecklist));

// Select / Clear All Listeners
if (btnUsaSelectAll) btnUsaSelectAll.addEventListener('click', () => {
    document.querySelectorAll('input[name="selected-state"][data-country="USA"]').forEach(cb => cb.checked = true);
    updateSelectedStatesCount();
});

if (btnUsaClearAll) btnUsaClearAll.addEventListener('click', () => {
    document.querySelectorAll('input[name="selected-state"][data-country="USA"]').forEach(cb => cb.checked = false);
    updateSelectedStatesCount();
});

if (btnCanadaSelectAll) btnCanadaSelectAll.addEventListener('click', () => {
    document.querySelectorAll('input[name="selected-state"][data-country="Canada"]').forEach(cb => cb.checked = true);
    updateSelectedStatesCount();
});

if (btnCanadaClearAll) btnCanadaClearAll.addEventListener('click', () => {
    document.querySelectorAll('input[name="selected-state"][data-country="Canada"]').forEach(cb => cb.checked = false);
    updateSelectedStatesCount();
});

if (btnEuropeSelectAll) btnEuropeSelectAll.addEventListener('click', () => {
    const europeCountries = ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'];
    document.querySelectorAll('input[name="selected-state"]').forEach(cb => {
        if (europeCountries.includes(cb.getAttribute('data-country'))) cb.checked = true;
    });
    updateSelectedStatesCount();
});

if (btnEuropeClearAll) btnEuropeClearAll.addEventListener('click', () => {
    const europeCountries = ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'];
    document.querySelectorAll('input[name="selected-state"]').forEach(cb => {
        if (europeCountries.includes(cb.getAttribute('data-country'))) cb.checked = false;
    });
    updateSelectedStatesCount();
});

if (btnGlobalSelectAll) btnGlobalSelectAll.addEventListener('click', () => {
    const excludedCountries = ['USA', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'];
    document.querySelectorAll('input[name="selected-state"]').forEach(cb => {
        if (!excludedCountries.includes(cb.getAttribute('data-country'))) cb.checked = true;
    });
    updateSelectedStatesCount();
});

if (btnGlobalClearAll) btnGlobalClearAll.addEventListener('click', () => {
    const excludedCountries = ['USA', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'];
    document.querySelectorAll('input[name="selected-state"]').forEach(cb => {
        if (!excludedCountries.includes(cb.getAttribute('data-country'))) cb.checked = false;
    });
    updateSelectedStatesCount();
});

// Mode Toggler Listener
toggleLocationMode.addEventListener('change', () => {
    const isChecklist = toggleLocationMode.checked;
    if (isChecklist) {
        locationManualGroup.style.display = 'none';
        locationChecklistGroup.style.display = 'block';
    } else {
        locationManualGroup.style.display = 'block';
        locationChecklistGroup.style.display = 'none';
    }
    updateSelectedStatesCount();
});

// LocalStorage Form Persistence
function saveFormState() {
    const selectedStates = [];
    document.querySelectorAll('input[name="selected-state"]:checked').forEach(cb => {
        selectedStates.push(cb.value);
    });
    
    const state = {
        niche: inputNiche.value,
        location: inputLocation.value,
        maxResults: inputMaxResults.value,
        minReviews: inputMinReviews.value,
        maxReviews: inputMaxReviews.value,
        headless: inputHeadless.checked,
        skipScanned: inputSkipScanned ? inputSkipScanned.checked : true,
        websiteFilter: inputWebsiteFilter.value,
        waMode: getWhatsAppMode(),
        messageDelay: inputMessageDelay.value,
        messageTemplate: inputMessageTemplate.value,
        toggleLocationMode: toggleLocationMode.checked,
        selectedStates: selectedStates,
        mode: currentScrapeMode
    };
    localStorage.setItem('bf_form_state', JSON.stringify(state));
}

function loadFormState() {
    const saved = localStorage.getItem('bf_form_state');
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        if (state.niche !== undefined) inputNiche.value = state.niche;
        if (state.location !== undefined) inputLocation.value = state.location;
        if (state.maxResults !== undefined) inputMaxResults.value = state.maxResults;
        if (state.minReviews !== undefined) inputMinReviews.value = state.minReviews;
        if (state.maxReviews !== undefined) inputMaxReviews.value = state.maxReviews;
        if (state.headless !== undefined) inputHeadless.checked = state.headless;
        if (state.skipScanned !== undefined && inputSkipScanned) inputSkipScanned.checked = state.skipScanned;
        if (state.websiteFilter !== undefined) inputWebsiteFilter.value = state.websiteFilter;
        
        if (state.waMode !== undefined) {
            const radio = document.getElementById(`mode-${state.waMode}`);
            if (radio) {
                radio.checked = true;
                // Update messaging section visibility
                if (state.waMode === 'text') {
                    waMessageInputs.style.display = 'flex';
                } else {
                    waMessageInputs.style.display = 'none';
                }
            }
        }
        
        if (state.messageDelay !== undefined) inputMessageDelay.value = state.messageDelay;
        if (state.messageTemplate !== undefined) inputMessageTemplate.value = state.messageTemplate;
        
        if (state.toggleLocationMode !== undefined) {
            toggleLocationMode.checked = state.toggleLocationMode;
            if (state.toggleLocationMode) {
                locationManualGroup.style.display = 'none';
                locationChecklistGroup.style.display = 'block';
            } else {
                locationManualGroup.style.display = 'block';
                locationChecklistGroup.style.display = 'none';
            }
        }
        
        if (state.selectedStates !== undefined) {
            document.querySelectorAll('input[name="selected-state"]').forEach(cb => {
                cb.checked = state.selectedStates.includes(cb.value);
            });
            updateSelectedStatesCount();
        }

        if (state.mode !== undefined) {
            setScrapeMode(state.mode);
        }
    } catch (e) {
        console.error('Error loading form state:', e);
    }
}

// Bind event listeners to auto-save form changes
function bindPersistenceListeners() {
    const inputs = [
        inputNiche, inputLocation, inputMaxResults, inputMinReviews, inputMaxReviews,
        inputHeadless, inputSkipScanned, inputWebsiteFilter, inputMessageDelay, inputMessageTemplate,
        toggleLocationMode
    ];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', saveFormState);
            input.addEventListener('change', saveFormState);
        }
    });

    document.querySelectorAll('input[name="wa-mode"]').forEach(radio => {
        radio.addEventListener('change', saveFormState);
    });

    // Select all/clear buttons
    [btnUsaSelectAll, btnUsaClearAll, btnCanadaSelectAll, btnCanadaClearAll].forEach(btn => {
        if (btn) btn.addEventListener('click', saveFormState);
    });
}

// Quick Result Count Chips Handler
function initCountChips() {
    const chips = document.querySelectorAll('.btn-count-chip');
    if (!chips || chips.length === 0) return;

    function syncChipsWithInput() {
        const val = inputMaxResults ? inputMaxResults.value.trim() : '';
        chips.forEach(chip => {
            if (chip.getAttribute('data-count') === val) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const count = chip.getAttribute('data-count');
            if (inputMaxResults && count) {
                inputMaxResults.value = count;
                syncChipsWithInput();
                saveFormState();
                if (typeof showToast === 'function') {
                    showToast(`Search limit set to ${Number(count).toLocaleString()} leads`, 'success');
                }
            }
        });
    });

    if (inputMaxResults) {
        inputMaxResults.addEventListener('input', syncChipsWithInput);
        inputMaxResults.addEventListener('change', syncChipsWithInput);
    }

    syncChipsWithInput();
}

// Initialize connection and load locations
loadLocationsDatabase().then(() => {
    loadFormState();
    bindPersistenceListeners();
    initCountChips();
});
connectWebSocket();
