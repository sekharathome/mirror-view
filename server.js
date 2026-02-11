const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let deviceSocket = null;
let webSocket = null;

// Keep-alive: Ping all clients every 30 seconds to prevent Render timeouts
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    console.log('New Connection Established');

    ws.on('message', (data) => {
        const msg = data.toString();

        if (msg === 'I_AM_DEVICE') {
            deviceSocket = ws;
            console.log('Android Device Linked');
            if (webSocket) {
                webSocket.send("STATUS:ONLINE");
                // Request network info immediately when device connects
                deviceSocket.send("getNetInfo"); 
            }
        } 
        else if (msg === 'I_AM_WEB') {
            webSocket = ws;
            console.log('Web Browser Linked');
            
            // Send current status immediately
            const status = (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) ? "ONLINE" : "OFFLINE";
            webSocket.send("STATUS:" + status);
        } 
        else {
            // RELAY LOGIC
            // Commands from Web Panel to Device
            if (ws === webSocket) {
                if (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) {
                    deviceSocket.send(msg);
                } else {
                    ws.send("STATUS:OFFLINE"); // Notify web if device lost meanwhile
                }
            } 
            // Data from Device to Web Panel
            else if (ws === deviceSocket) {
                if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                    webSocket.send(msg);
                }
            }
        }
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            console.log('Device Disconnected');
            deviceSocket = null;
            if (webSocket) webSocket.send("STATUS:OFFLINE");
        } else if (ws === webSocket) {
            console.log('Web Panel Disconnected');
            webSocket = null;
        }
    });

    ws.on('error', (err) => {
        console.error('Socket Error:', err.message);
    });
});

console.log(`Server is running on port ${PORT}`);
