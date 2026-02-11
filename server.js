const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let deviceSocket = null;
let webSocket = null;

wss.on('connection', (ws) => {
    console.log('New Connection Established');

    ws.on('message', (data) => {
        const msg = data.toString();

        if (msg === 'I_AM_DEVICE') {
            deviceSocket = ws;
            console.log('Android Device Linked');
            if (webSocket) webSocket.send("STATUS:ONLINE");
        } 
        else if (msg === 'I_AM_WEB') {
            webSocket = ws;
            console.log('Web Browser Linked');
            const status = (deviceSocket) ? "ONLINE" : "OFFLINE";
            ws.send("STATUS:" + status);
        } 
        else {
            // RELAY LOGIC
            if (ws === webSocket && deviceSocket) {
                // Browser -> Device (Commands)
                deviceSocket.send(msg);
            } else if (ws === deviceSocket && webSocket) {
                // Device -> Browser (Data/Photos/Logs)
                webSocket.send(msg);
            }
        }
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            deviceSocket = null;
            if (webSocket) webSocket.send("STATUS:OFFLINE");
        }
    });
});
