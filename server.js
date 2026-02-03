const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let deviceSocket = null;
let webSocket = null;

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const msg = message.toString();

        // 1. Identify the Android Device
        if (msg === 'I_AM_DEVICE') {
            deviceSocket = ws;
            console.log('DEVICE CONNECTED');
            broadcastToWeb("STATUS:ONLINE");
        }
        // 2. Identify the Web Browser
        else if (msg === 'I_AM_WEB') {
            webSocket = ws;
            // Send current status immediately upon connection
            const status = (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) ? "ONLINE" : "OFFLINE";
            ws.send("STATUS:" + status);
        }
        // 3. Handle Video Frames (Forward Device -> Web)
        else if (msg.startsWith('FRAME:')) {
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(msg);
            }
        }
        // 4. Handle Commands (Forward Web -> Device)
        else if (msg === 'START_SCREEN' || msg === 'STOP_SCREEN') {
            if (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) {
                deviceSocket.send(msg);
            }
        }
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            console.log('DEVICE DISCONNECTED');
            deviceSocket = null;
            broadcastToWeb("STATUS:OFFLINE");
        }
    });
});

function broadcastToWeb(msg) {
    wss.clients.forEach(client => {
        if (client !== deviceSocket && client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}
