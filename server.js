const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// ── Multi-device state ─────────────────────────────────────────────────────
// devices: Map<deviceId, { ws, info, lastSeen }>
// webClients: Set<ws>
const devices = new Map();
const webClients = new Set();

// ── Optional simple auth token ─────────────────────────────────────────────
// Set AUTH_TOKEN env var on Render to protect the relay.
// Web panel must send: { type: "AUTH", token: "yourtoken" }
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

// ── Heartbeat / stale detection ────────────────────────────────────────────
setInterval(() => {
    const now = Date.now();
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log('Terminating stale client');
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });

    // Remove devices not seen in 60s
    devices.forEach((device, id) => {
        if (now - device.lastSeen > 60000) {
            console.log(`Device ${id} timed out`);
            devices.delete(id);
            broadcastToWeb({ type: 'DEVICE_OFFLINE', deviceId: id });
        }
    });
}, 30000);

// ── Connection handler ─────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.role = null;       // 'device' | 'web'
    ws.deviceId = null;
    ws.authenticated = AUTH_TOKEN === null; // auto-auth if no token set

    ws.on('pong', () => { ws.isAlive = true; });

    console.log('🔌 New connection from', req.socket.remoteAddress);

    ws.on('message', (raw) => {
        const msg = raw.toString();

        // ── Plain identity messages ──────────────────────────────────────
        if (msg === 'I_AM_DEVICE') {
            ws.role = 'device';
            console.log('📱 Device identified (waiting for DEVICE_REGISTRATION)');
            return;
        }

        if (msg === 'I_AM_WEB') {
            ws.role = 'web';
            ws.authenticated = AUTH_TOKEN === null; // reset; must re-auth if token set
            webClients.add(ws);
            console.log('🌐 Web panel connected');
            // Send current device list
            sendDeviceList(ws);
            return;
        }

        // ── Parse JSON ───────────────────────────────────────────────────
        let json;
        try {
            json = JSON.parse(msg);
        } catch (e) {
            // Plain-text command relay (legacy dl/hideApp etc.)
            if (ws.role === 'web') {
                const targetId = json && json.deviceId;
                relayToDevice(targetId, msg);
            }
            return;
        }

        // ── Auth check ───────────────────────────────────────────────────
        if (json.type === 'AUTH') {
            if (AUTH_TOKEN && json.token === AUTH_TOKEN) {
                ws.authenticated = true;
                safeSend(ws, JSON.stringify({ type: 'AUTH_OK' }));
            } else {
                safeSend(ws, JSON.stringify({ type: 'AUTH_FAIL' }));
            }
            return;
        }

        if (!ws.authenticated && ws.role === 'web') {
            safeSend(ws, JSON.stringify({ type: 'ERROR', error: 'Not authenticated' }));
            return;
        }

        // ── Device messages ──────────────────────────────────────────────
        if (ws.role === 'device') {
            console.log(`📱 From device [${ws.deviceId || 'unregistered'}]: ${json.type}`);
            if (json.type === 'DEVICE_REGISTRATION') {
                const deviceId = json.deviceId;
                if (!deviceId) {
                    console.warn('DEVICE_REGISTRATION missing deviceId:', JSON.stringify(json).substring(0, 100));
                    return;
                }
                ws.deviceId = deviceId;
                devices.set(deviceId, { ws, info: json, lastSeen: Date.now() });
                console.log(`📱 Device registered: ${deviceId} (${json.name || 'unknown'}) — total: ${devices.size}`);
                broadcastToWeb({ type: 'DEVICE_REGISTRATION', ...json });
                return;
            }

            if (json.type === 'HEARTBEAT') {
                const dev = devices.get(json.deviceId);
                if (dev) dev.lastSeen = Date.now();
                return;  // Do NOT forward heartbeats to web
            }

            // Update battery/network info from DEVICE_INFO messages
            if (json.type === 'DEVICE_INFO') {
                const dev = devices.get(json.deviceId);
                if (dev) {
                    dev.lastSeen = Date.now();
                    if (json.batteryLevel !== undefined) dev.info.batteryLevel = json.batteryLevel;
                    if (json.batteryCharging !== undefined) dev.info.batteryCharging = json.batteryCharging;
                    if (json.networkType) dev.info.networkType = json.networkType;
                }
            }

            // Device → Web (response / data / signaling)
            const deviceId = json.deviceId || ws.deviceId;
            if (deviceId) {
                const dev = devices.get(deviceId);
                if (dev) dev.lastSeen = Date.now();
            }
            broadcastToWeb(json);
            return;
        }

        // ── Web messages ─────────────────────────────────────────────────
        if (ws.role === 'web') {
            const targetDeviceId = json.deviceId;

            // Handle both names — HTML sends GET_DEVICES, some clients send GET_DEVICE_LIST
            if (json.type === 'GET_DEVICE_LIST' || json.type === 'GET_DEVICES') {
                sendDeviceList(ws);
                return;
            }

            if (json.type === 'SWITCH_DEVICE') {
                // Just acknowledgement — actual routing uses deviceId per-message
                safeSend(ws, JSON.stringify({ type: 'DEVICE_SWITCHED', deviceId: targetDeviceId }));
                return;
            }

            // Route to target device
            if (targetDeviceId) {
                relayToDevice(targetDeviceId, msg);
            } else {
                // No deviceId — relay to ALL device-role connections.
                // This covers both registered devices (in Map) and devices
                // that connected but haven't sent DEVICE_REGISTRATION yet.
                let sent = 0;
                wss.clients.forEach(client => {
                    if (client.role === 'device' && client.readyState === WebSocket.OPEN) {
                        safeSend(client, msg);
                        sent++;
                    }
                });
                if (sent === 0) {
                    console.warn('No device connected to receive command');
                    safeSend(ws, JSON.stringify({ type: 'ERROR', error: 'No device connected' }));
                }
            }
        }
    });

    ws.on('close', () => {
        if (ws.role === 'web') {
            webClients.delete(ws);
            console.log('🌐 Web panel disconnected');
        } else if (ws.role === 'device' && ws.deviceId) {
            devices.delete(ws.deviceId);
            console.log(`📱 Device ${ws.deviceId} disconnected`);
            broadcastToWeb({ type: 'DEVICE_OFFLINE', deviceId: ws.deviceId });
        }
    });

    ws.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

// ── Helpers ────────────────────────────────────────────────────────────────

function relayToDevice(deviceId, msg) {
    const device = deviceId && devices.get(deviceId);
    if (device && device.ws.readyState === WebSocket.OPEN) {
        console.log(`📤 Relaying to device ${deviceId}`);
        safeSend(device.ws, msg);
    } else {
        console.warn(`⚠️ Device ${deviceId} not in map, trying broadcast to all devices`);
        // Fallback: send to any connected device-role client
        wss.clients.forEach(client => {
            if (client.role === 'device' && client.readyState === WebSocket.OPEN) {
                safeSend(client, msg);
            }
        });
    }
}

function broadcastToWeb(json) {
    const str = typeof json === 'string' ? json : JSON.stringify(json);
    webClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            safeSend(ws, str);
        }
    });
}

function sendDeviceList(ws) {
    const list = [];
    devices.forEach((device, id) => {
        list.push({
            deviceId: id,
            name: device.info.name,
            manufacturer: device.info.manufacturer,
            model: device.info.model,
            androidVersion: device.info.androidVersion,
            batteryLevel: device.info.batteryLevel,
            batteryCharging: device.info.batteryCharging,
            networkType: device.info.networkType,
            lastSeen: device.lastSeen,
            online: device.ws.readyState === WebSocket.OPEN
        });
    });
    safeSend(ws, JSON.stringify({ type: 'DEVICE_LIST', devices: list }));
}

function safeSend(ws, msg) {
    try {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    } catch (e) {
        console.error('Send error:', e.message);
    }
}

console.log(`🚀 Multi-device relay running on port ${PORT}`);
console.log(`🔐 Auth: ${AUTH_TOKEN ? 'ENABLED' : 'DISABLED (set AUTH_TOKEN env var)'}`);
