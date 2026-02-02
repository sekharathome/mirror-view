const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let deviceSocket = null;

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        // 1. Device identification
        if (message === 'I_AM_DEVICE') {
            deviceSocket = ws;
            deviceSocket.isAlive = true;
            broadcastStatus("ONLINE");
            console.log("Device is now Online");
        }

        // 2. Handle Status Requests from Web Panel
        if (message === 'GET_STATUS') {
            const status = (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) ? "ONLINE" : "OFFLINE";
            ws.send("STATUS:" + status);
        }

        // ... rest of your screen frame forwarding logic ...
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            deviceSocket = null;
            broadcastStatus("OFFLINE");
            console.log("Device went Offline");
        }
    });
});

function broadcastStatus(status) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send("STATUS:" + status);
        }
    });
}
