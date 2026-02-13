const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store connected clients
let deviceSocket = null;
let webSocket = null;

// Simple in‑memory authentication (replace with real tokens in production)
const DEVICE_SECRET = "your-device-secret-here";
const WEB_TOKEN = "your-web-token-here";

// Heartbeat ping-pong
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.authenticated = false;
    ws.role = null;

    ws.on('pong', () => { ws.isAlive = true; });

    console.log('🔌 New connection');

    ws.on('message', (data) => {
        try {
            const msg = data.toString();
            let json;
            try {
                json = JSON.parse(msg);
            } catch (e) {
                // If not JSON, fallback to old protocol (for backward compatibility)
                handleLegacyMessage(ws, msg);
                return;
            }

            // --- AUTHENTICATION ---
            if (json.type === 'AUTH_DEVICE') {
                if (json.token === DEVICE_SECRET) {
                    ws.authenticated = true;
                    ws.role = 'device';
                    ws.deviceId = json.deviceId || 'unknown';
                    deviceSocket = ws;
                    console.log(`📱 Device linked: ${ws.deviceId}`);
                    
                    // Notify web if connected
                    if (webSocket && webSocket.authenticated) {
                        webSocket.send(JSON.stringify({
                            type: 'DEVICE_STATUS',
                            status: 'ONLINE',
                            deviceId: ws.deviceId
                        }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'ERROR', error: 'Invalid device token' }));
                    ws.close();
                }
                return;
            }

            if (json.type === 'AUTH_WEB') {
                if (json.token === WEB_TOKEN) {
                    ws.authenticated = true;
                    ws.role = 'web';
                    webSocket = ws;
                    console.log('🌐 Web panel linked');
                    
                    // Send initial status
                    const status = (deviceSocket && deviceSocket.authenticated) ? 'ONLINE' : 'OFFLINE';
                    ws.send(JSON.stringify({
                        type: 'DEVICE_STATUS',
                        status: status
                    }));
                } else {
                    ws.send(JSON.stringify({ type: 'ERROR', error: 'Invalid web token' }));
                    ws.close();
                }
                return;
            }

            // --- ONLY AUTHENTICATED CLIENTS BEYOND THIS POINT ---
            if (!ws.authenticated) {
                ws.send(JSON.stringify({ type: 'ERROR', error: 'Not authenticated' }));
                return;
            }

            // --- HEARTBEAT (just ignore, no response needed) ---
            if (json.type === 'HEARTBEAT') {
                return;
            }

            // --- ROUTING LOGIC ---
            // Messages from DEVICE → forward to WEB
            if (ws.role === 'device') {
                if (webSocket && webSocket.authenticated && webSocket.readyState === WebSocket.OPEN) {
                    webSocket.send(JSON.stringify(json));
                }
            }
            // Messages from WEB → forward to DEVICE
            else if (ws.role === 'web') {
                if (deviceSocket && deviceSocket.authenticated && deviceSocket.readyState === WebSocket.OPEN) {
                    deviceSocket.send(JSON.stringify(json));
                } else {
                    ws.send(JSON.stringify({ type: 'ERROR', error: 'Device offline' }));
                }
            }

        } catch (err) {
            console.error('❌ Error processing message:', err);
        }
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            console.log('📱 Device disconnected');
            deviceSocket = null;
            if (webSocket && webSocket.authenticated) {
                webSocket.send(JSON.stringify({ type: 'DEVICE_STATUS', status: 'OFFLINE' }));
            }
        } else if (ws === webSocket) {
            console.log('🌐 Web panel disconnected');
            webSocket = null;
        }
        ws.authenticated = false;
    });

    ws.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

// Legacy support for plain-text commands (optional)
function handleLegacyMessage(ws, msg) {
    console.log('⚠️ Received legacy message:', msg);
    if (msg === 'I_AM_DEVICE') {
        // Auto‑authenticate for backward compatibility (INSECURE – remove later)
        ws.authenticated = true;
        ws.role = 'device';
        deviceSocket = ws;
        console.log('📱 Device linked (legacy)');
        if (webSocket && webSocket.authenticated) {
            webSocket.send(JSON.stringify({ type: 'DEVICE_STATUS', status: 'ONLINE' }));
        }
    } else if (msg === 'I_AM_WEB') {
        ws.authenticated = true;
        ws.role = 'web';
        webSocket = ws;
        console.log('🌐 Web panel linked (legacy)');
        const status = (deviceSocket && deviceSocket.authenticated) ? 'ONLINE' : 'OFFLINE';
        ws.send(JSON.stringify({ type: 'DEVICE_STATUS', status: status }));
    } else {
        // Simple relay (old behavior)
        if (ws === webSocket && deviceSocket && deviceSocket.authenticated) {
            deviceSocket.send(msg);
        } else if (ws === deviceSocket && webSocket && webSocket.authenticated) {
            webSocket.send(msg);
        }
    }
}

console.log(`🚀 Server running on port ${PORT}`);
