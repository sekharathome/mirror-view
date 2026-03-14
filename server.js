const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Create HTTP server to serve the HTML file
const server = http.createServer((req, res) => {
    // Serve index.html for any GET request (you can extend to serve other static files if needed)
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// WebSocket server attached to the same HTTP server
const wss = new WebSocket.Server({ server });

// Store clients
const webClients = new Set();      // all web connections
const devices = new Map();         // deviceId -> { ws, info }

wss.on('connection', (ws) => {
    console.log('New client connected');
    let clientType = null;          // 'web' or 'device'
    let deviceId = null;

    ws.on('message', (message) => {
        console.log('Received:', message.toString());

        // 1. Identify client type from plain text
        if (message === 'I_AM_WEB') {
            clientType = 'web';
            webClients.add(ws);
            console.log('Client identified as WEB');
            return;
        }
        if (message === 'I_AM_DEVICE') {
            clientType = 'device';
            console.log('Client identified as DEVICE');
            return;
        }

        // 2. Try to parse as JSON
        let json;
        try {
            json = JSON.parse(message);
        } catch (e) {
            console.log('Non-JSON message, ignoring:', message);
            return;
        }

        // 3. Handle different JSON types
        switch (json.type) {
            case 'DEVICE_REGISTRATION': {
                if (clientType !== 'device') return;
                deviceId = json.deviceId;
                devices.set(deviceId, { ws, info: json });
                console.log(`Device registered: ${deviceId}`);

                // Broadcast to all web clients
                const regMsg = JSON.stringify(json);
                webClients.forEach(web => {
                    if (web.readyState === WebSocket.OPEN) {
                        web.send(regMsg);
                    }
                });
                break;
            }

            case 'GET_DEVICES': {
                if (clientType !== 'web') return;
                const deviceList = Array.from(devices.values()).map(d => d.info);
                ws.send(JSON.stringify({
                    type: 'DEVICE_LIST',
                    devices: deviceList
                }));
                break;
            }

            case 'COMMAND': {
                // Web client sending a command to a specific device
                const targetDeviceId = json.deviceId;
                if (!targetDeviceId) return;
                const device = devices.get(targetDeviceId);
                if (device && device.ws.readyState === WebSocket.OPEN) {
                    // Forward the whole command message
                    device.ws.send(JSON.stringify(json));
                } else {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        error: 'Device not connected'
                    }));
                }
                break;
            }

            case 'SIGNALING': {
                // Signaling between web and device
                const targetDeviceId = json.deviceId;
                if (!targetDeviceId) return;
                const device = devices.get(targetDeviceId);
                if (device && device.ws.readyState === WebSocket.OPEN) {
                    // Forward the signaling message to the device
                    device.ws.send(JSON.stringify(json));
                } else {
                    // If signaling comes from a device, broadcast to all web clients
                    // (simpler approach – the correct web client will pick it up)
                    if (clientType === 'device') {
                        webClients.forEach(web => {
                            if (web.readyState === WebSocket.OPEN) {
                                web.send(JSON.stringify(json));
                            }
                        });
                    }
                }
                break;
            }

            default:
                console.log('Unknown message type:', json.type);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        webClients.delete(ws);
        if (deviceId) {
            devices.delete(deviceId);
            // Notify web clients that device went offline
            const offlineMsg = JSON.stringify({
                type: 'DEVICE_OFFLINE',
                deviceId: deviceId
            });
            webClients.forEach(web => {
                if (web.readyState === WebSocket.OPEN) {
                    web.send(offlineMsg);
                }
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
