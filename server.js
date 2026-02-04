const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let deviceSocket = null;

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const msg = message.toString();

        // 1. Device Identification
        if (msg === 'I_AM_DEVICE') {
            deviceSocket = ws;
            broadcastToWeb("STATUS:ONLINE");
            broadcastLog("SYSTEM: Mobile device is now ONLINE.");
        }

        // 2. Handle Web Status Request
        if (msg === 'GET_STATUS') {
            const status = (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) ? "ONLINE" : "OFFLINE";
            ws.send("STATUS:" + status);
        }

        // 3. Command Forwarding (Web -> Device) with Action Logs
        if (msg.startsWith('START_SCREEN') || msg === 'STOP_SCREEN') {
            if (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) {
                deviceSocket.send(msg);
                const desc = msg.includes("AUDIO") ? "Screen with Audio" : "Screen only";
                broadcastLog(`ACTION: Web clicked ${msg}. Command sent to mobile (${desc}).`);
            } else {
                broadcastLog("ERROR: Device is OFFLINE. Cannot send " + msg);
            }
        }

        // 4. Data Forwarding (Device -> Web)
        // Forward Frames, Battery (STATUS_DATA), or Confirmation Logs
        if (msg.startsWith('FRAME:') || msg.startsWith('STATUS_DATA:') || msg.startsWith('LOG:')) {
            broadcastToWeb(msg);
        }
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            deviceSocket = null;
            broadcastStatus("OFFLINE");
            broadcastLog("SYSTEM: Mobile device disconnected.");
        }
    });
});

function broadcastLog(logText) {
    broadcastToWeb("LOG:" + logText);
}

function broadcastToWeb(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}
