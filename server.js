const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log("SystemSync Server Started on port " + (process.env.PORT || 8080));

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.type = "unknown"; // Initially unknown until identification message

    console.log("\n[CONNECT] New client connected.");

    ws.on('message', (message) => {
        let msgString = message.toString();

        // 1. Identification Logic (Critical for "Online" status)
        if (msgString === "I_AM_DEVICE") {
            ws.type = "DEVICE";
            console.log("[STATUS] Device (Phone) Registered.");
            broadcast("STATUS:ONLINE"); 
            return;
        }
        if (msgString === "I_AM_WEB") {
            ws.type = "WEB_PANEL";
            console.log("[STATUS] Web Control Panel Registered.");
            return;
        }

        // 2. Command Logging
        if (msgString.startsWith("START_SCREEN")) {
            console.log(`[COMMAND] Web Panel -> Device: START STREAM (${msgString.split(':')[1]} audio)`);
        }
        if (msgString === "STOP_SCREEN") {
            console.log("[COMMAND] Web Panel -> Device: STOP STREAM");
        }

        // 3. Keep-Alive Heartbeat
        if (msgString === "PONG") {
            ws.isAlive = true;
            return;
        }

        // 4. Data Relaying (Frames and Audio)
        // We send data from the Device to the Web Panel and vice-versa
        broadcast(message, ws);
    });

    ws.on('close', (code, reason) => {
        console.log(`[DISCONNECT] A ${ws.type} disconnected. Code: ${code}`);
        if (ws.type === "DEVICE") {
            broadcast("STATUS:OFFLINE");
            console.log("[ALERT] Device connection lost.");
        }
    });

    ws.on('error', (err) => {
        console.error(`[ERROR] WebSocket error: ${err.message}`);
    });

    // Send initial ping to check if client is still there
    ws.send("PING");
});

// Broadcast function: Sends data to everyone EXCEPT the sender
function broadcast(data, sender) {
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Heartbeat Interval (Prevents Render.com or Heroku from killing the connection)
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log("[CLEANUP] Terminating inactive connection.");
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.send("PING"); // Expecting "PONG" back
    });
}, 30000);
