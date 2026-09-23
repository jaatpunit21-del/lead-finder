const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

try {
    puppeteerExtra.use(StealthPlugin());
} catch (e) {
    // Already registered
}

const DEVICES_FILE = path.join(__dirname, 'devices.json');
const ACTIVE_DEVICE_FILE = path.join(__dirname, 'active_device.txt');

function readActiveDeviceId() {
    if (fs.existsSync(ACTIVE_DEVICE_FILE)) {
        try {
            return fs.readFileSync(ACTIVE_DEVICE_FILE, 'utf8').trim();
        } catch (e) {
            console.error('Error reading active device file:', e);
        }
    }
    return 'default';
}

function writeActiveDeviceId(id) {
    try {
        fs.writeFileSync(ACTIVE_DEVICE_FILE, id, 'utf8');
    } catch (e) {
        console.error('Error writing active device file:', e);
    }
}

let client = null;
let currentDeviceId = readActiveDeviceId();
let clientStatus = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
let qrCodeDataUrl = null;

/**
 * Read device history from local file
 */
function readDevices() {
    if (!fs.existsSync(DEVICES_FILE)) {
        const defaultList = [{ id: 'default', name: 'Default Account' }];
        fs.writeFileSync(DEVICES_FILE, JSON.stringify(defaultList, null, 2));
        return defaultList;
    }
    try {
        return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
    } catch (e) {
        return [{ id: 'default', name: 'Default Account' }];
    }
}

/**
 * Write device list to file
 */
function writeDevices(devices) {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
}

function getDevices() {
    return {
        devices: readDevices(),
        activeId: currentDeviceId
    };
}

function addDevice(name) {
    const devices = readDevices();
    const id = 'device_' + Date.now();
    devices.push({ id, name });
    writeDevices(devices);
    return getDevices();
}

async function deleteDevice(id, onStatusChange) {
    // If we delete the currently active device, logout/destroy it first
    if (id === currentDeviceId) {
        await logout(onStatusChange);
    }

    const devices = readDevices();
    const filtered = devices.filter(d => d.id !== id);
    writeDevices(filtered);

    // Delete session files on disk
    const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${id}`);
    if (fs.existsSync(sessionDir)) {
        try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(`Deleted session folder: ${sessionDir}`);
        } catch (err) {
            console.error(`Error deleting session folder ${sessionDir}:`, err);
        }
    }

    // If active device was deleted, fallback to default or first available
    if (id === currentDeviceId) {
        currentDeviceId = filtered.length > 0 ? filtered[0].id : 'default';
        if (filtered.length === 0) {
            writeDevices([{ id: 'default', name: 'Default Account' }]);
            currentDeviceId = 'default';
        }
        writeActiveDeviceId(currentDeviceId);
    }

    return getDevices();
}

function getStatus() {
    return {
        status: clientStatus,
        qr: qrCodeDataUrl,
        activeId: currentDeviceId
    };
}

/**
 * Select active device and trigger status change callback
 */
async function selectDevice(id, onStatusChange) {
    if (id === currentDeviceId && client) {
        return getStatus();
    }
    
    // Shut down previous active client
    await logout(onStatusChange);
    
    currentDeviceId = id;
    writeActiveDeviceId(id);
    onStatusChange(getStatus());
    return getStatus();
}

/**
 * Initializes the WhatsApp Web client for the active session
 * @param {Function} onStatusChange Callback when the status or QR code changes
 */
function initialize(onStatusChange) {
    if (client) {
        if (clientStatus === 'CONNECTED' || clientStatus === 'INITIALIZING') {
            return;
        }
        try {
            client.destroy();
        } catch (e) {
            console.error('Error destroying old WhatsApp client:', e);
        }
    }

    clientStatus = 'INITIALIZING';
    qrCodeDataUrl = null;
    onStatusChange(getStatus());

    // LocalAuth saves session data in a folder (.wwebjs_auth) in the project root
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: currentDeviceId,
            dataPath: './.wwebjs_auth'
        }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
            strict: false
        },
        deviceName: 'Windows 11',
        browserName: 'Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        puppeteer: {
            headless: true,
            puppeteer: puppeteerExtra,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', async (qr) => {
        try {
            clientStatus = 'QR_READY';
            qrCodeDataUrl = await QRCode.toDataURL(qr, {
                errorCorrectionLevel: 'L',
                margin: 2,
                width: 300
            });
            onStatusChange(getStatus());
        } catch (err) {
            console.error('Error generating QR Code:', err);
        }
    });

    client.on('ready', () => {
        clientStatus = 'CONNECTED';
        qrCodeDataUrl = null;
        console.log(`WhatsApp client [${currentDeviceId}] is ready!`);
        onStatusChange(getStatus());
    });

    client.on('authenticated', () => {
        console.log(`WhatsApp client [${currentDeviceId}] authenticated successfully.`);
    });

    client.on('auth_failure', async (msg) => {
        console.error(`WhatsApp [${currentDeviceId}] authentication failure:`, msg);
        clientStatus = 'DISCONNECTED';
        qrCodeDataUrl = null;

        const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${currentDeviceId}`);
        if (fs.existsSync(sessionDir)) {
            try {
                await new Promise(r => setTimeout(r, 1000));
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log(`Cleaned up session folder on authentication failure: ${sessionDir}`);
            } catch (cleanupErr) {
                console.warn(`Failed to clean session folder on auth failure: ${cleanupErr.message}`);
            }
        }

        onStatusChange(getStatus());
    });

    client.on('disconnected', (reason) => {
        console.log(`WhatsApp [${currentDeviceId}] disconnected:`, reason);
        clientStatus = 'DISCONNECTED';
        qrCodeDataUrl = null;
        onStatusChange(getStatus());
    });

    client.initialize().catch(async (err) => {
        console.error(`Failed to initialize WhatsApp client [${currentDeviceId}]:`, err);
        clientStatus = 'DISCONNECTED';
        qrCodeDataUrl = null;

        // Clean up session folder to resolve corruption and allow fresh scan on next init
        const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${currentDeviceId}`);
        if (fs.existsSync(sessionDir)) {
            try {
                await new Promise(r => setTimeout(r, 1000));
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log(`Cleaned up corrupted session folder: ${sessionDir}`);
            } catch (cleanupErr) {
                console.warn(`Failed to clean session folder: ${cleanupErr.message}`);
            }
        }

        onStatusChange(getStatus());
    });
}

/**
 * Disconnects the WhatsApp Web client and logs out
 * @param {Function} onStatusChange Callback to update frontend
 */
async function logout(onStatusChange) {
    const deviceId = currentDeviceId;
    if (client) {
        try {
            clientStatus = 'DISCONNECTED';
            qrCodeDataUrl = null;
            
            // Do NOT call client.logout() because it has a bug in LocalAuth.js that crashes the Node process if files are locked.
            // Instead, just destroy the client (closes browser cleanly) and manually delete the session folder.
            await client.destroy();
            client = null;
        } catch (err) {
            console.error('Error during WhatsApp destroy:', err);
        }
    }

    // Wait 1 second to ensure the OS fully releases file locks after Chrome closes
    await new Promise(r => setTimeout(r, 1000));

    // Clean up session folder on disk to guarantee it must relink with a fresh QR code next time
    const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${deviceId}`);
    if (fs.existsSync(sessionDir)) {
        try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(`Force cleaned session folder for logout: ${sessionDir}`);
        } catch (err) {
            console.warn(`Warning force cleaning session folder ${sessionDir}:`, err.message);
        }
    }

    onStatusChange(getStatus());
}

/**
 * Verifies if a phone number is registered on WhatsApp
 * @param {string} phone raw phone number
 * @returns {Promise<{registered: boolean, formatted: string}>}
 */
async function verifyNumber(phone) {
    if (!phone) {
        return { registered: false, formatted: '' };
    }

    // Clean phone number (keep digits only)
    let cleanNumber = phone.replace(/\D/g, '');
    
    // USA/Canada: if it has 10 digits, prepend '1'
    if (cleanNumber.length === 10) {
        cleanNumber = '1' + cleanNumber;
    }

    const formatted = cleanNumber;
    const whatsappId = cleanNumber + '@c.us';

    if (clientStatus !== 'CONNECTED' || !client) {
        // WhatsApp is not connected, return formatted number but not verified
        return { registered: null, formatted };
    }

    try {
        const isRegistered = await client.isRegisteredUser(whatsappId);
        return { registered: isRegistered, formatted };
    } catch (err) {
        console.warn(`isRegisteredUser failed for ${phone}, trying getNumberId fallback:`, err.message);
        try {
            const numberId = await client.getNumberId(whatsappId);
            return { registered: !!numberId, formatted };
        } catch (fallbackErr) {
            console.error(`Fallback getNumberId also failed for ${phone}:`, fallbackErr.message);
            
            // Check if failure is due to browser crash/detached frame
            const isBrowserError = [err, fallbackErr].some(e => 
                e && e.message && (
                    e.message.includes('detached') || 
                    e.message.includes('crashed') || 
                    e.message.includes('closed') || 
                    e.message.includes('Session')
                )
            );

            if (isBrowserError) {
                console.error('[WhatsApp] Critical: Session has crashed or frame is detached.');
                return { registered: null, formatted }; // Return null to indicate verification failure
            }

            // If it's a normal API failure, assume false to avoid texting unregistered numbers
            return { registered: false, formatted };
        }
    }
}

/**
 * Sends a WhatsApp message to a phone number
 * @param {string} phone The destination phone number
 * @param {string} message The text content of the message
 */
async function sendMessage(phone, message) {
    if (clientStatus !== 'CONNECTED' || !client) {
        throw new Error('WhatsApp client is not connected');
    }

    let cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
        cleanNumber = '1' + cleanNumber;
    }
    const whatsappId = cleanNumber + '@c.us';

    await client.sendMessage(whatsappId, message);
}

/**
 * Cleanly disconnects the WhatsApp client (shutting down Chromium)
 * but PRESERVES the session credentials directory on disk.
 * @param {Function} onStatusChange Callback to update frontend
 */
async function disconnect(onStatusChange) {
    if (client) {
        try {
            clientStatus = 'DISCONNECTED';
            qrCodeDataUrl = null;
            await client.destroy();
            client = null;
        } catch (err) {
            console.error('Error during WhatsApp disconnect:', err);
        }
    }
    onStatusChange(getStatus());
}

/**
 * Check if session credentials exist on disk for the active device
 */
function sessionExists() {
    const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${currentDeviceId}`);
    if (fs.existsSync(sessionDir)) {
        try {
            const files = fs.readdirSync(sessionDir);
            return files.length > 0;
        } catch (e) {
            return false;
        }
    }
    return false;
}

module.exports = {
    getDevices,
    addDevice,
    deleteDevice,
    selectDevice,
    initialize,
    logout,
    disconnect,
    getStatus,
    verifyNumber,
    sendMessage,
    sessionExists
};
