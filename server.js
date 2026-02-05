const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log("SystemSync Server Started on port " + (process.env.PORT || 8080));

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.type = "unknown"; 

    console.log("\n[CONNECT] New client connected.");

    ws.on('message', (message) => {
        let msgString = message.toString();

        // 1. Identification Logic
        if (msgString === "I_AM_DEVICE") {
            ws.type = "DEVICE";
            ws.isAlive = true; // Mark as active immediately
            console.log("[STATUS] Device (Phone) Registered.");
            broadcast("STATUS:ONLINE", ws); 
            return;
        }
        if (msgString === "I_AM_WEB") {
            ws.type = "WEB_PANEL";
            ws.isAlive = true;
            console.log("[STATUS] Web Control Panel Registered.");
            return;
        }

        // 2. Heartbeat Response
        if (msgString === "PONG") {
            ws.isAlive = true;
            return;
        }

        // 3. Command & Data Relaying
        broadcast(message, ws);
    });

    ws.on('close', (code, reason) => {
        console.log(`[DISCONNECT] A ${ws.type} disconnected. Code: ${code}`);
        if (ws.type === "DEVICE") {
            broadcast("STATUS:OFFLINE", ws);
        }
    });

    ws.on('error', (err) => {
        console.error(`[ERROR] WebSocket error: ${err.message}`);
    });
});

function broadcast(data, sender) {
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Heartbeat Interval: Terminates dead connections every 30 seconds
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`[CLEANUP] Terminating inactive ${ws.type} connection.`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.send("PING");
    });
}, 30000);

wss.on('close', () => clearInterval(interval));
