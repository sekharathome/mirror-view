const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let deviceSocket = null;

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const msg = message.toString();

        // 1. Device identification
        if (msg === 'I_AM_DEVICE') {
            deviceSocket = ws;
            broadcastStatus("ONLINE");
            broadcastLog("SYSTEM: Mobile device has connected.");
        }

        // 2. Handle Status Requests
        if (msg === 'GET_STATUS') {
            const status = (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) ? "ONLINE" : "OFFLINE";
            ws.send("STATUS:" + status);
        }

        // 3. Command Forwarding with Web Notification
        if (msg.startsWith('START_SCREEN') || msg === 'STOP_SCREEN') {
            if (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) {
                // Forward the actual action to the mobile
                deviceSocket.send(msg);
                
                // Throw a message back to the web client to confirm the action
                const actionDetail = msg.includes("AUDIO") ? "Screen Stream with Audio" : "Screen Stream";
                broadcastLog(`ACTION: Sending '${msg}' to mobile. Action: ${actionDetail}`);
            } else {
                broadcastLog("ERROR: Cannot send action. Device is OFFLINE.");
            }
        }

        // Forward battery/status info
        if (msg.startsWith('STATUS_DATA:')) {
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

// Sends logs to the Web Panel only
function broadcastLog(logText) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send("LOG:" + logText);
        }
    });
}

function broadcastStatus(status) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send("STATUS:" + status);
        }
    });
}

function broadcastToWeb(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}
