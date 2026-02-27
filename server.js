const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let deviceSocket = null;
let webSocket = null;

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

    console.log('🔌 New connection');

    ws.on('message', (data) => {
        const msg = data.toString();
        console.log('📨 Received:', msg);

        if (msg === 'I_AM_DEVICE') {
            deviceSocket = ws;
            console.log('📱 Device linked');
            if (webSocket) {
                webSocket.send('STATUS:ONLINE');
                deviceSocket.send('getNetInfo');
            }
            return;
        }

        if (msg === 'I_AM_WEB') {
            webSocket = ws;
            console.log('🌐 Web panel linked');
            const status = (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) ? 'ONLINE' : 'OFFLINE';
            webSocket.send('STATUS:' + status);
            return;
        }

        // Relay logic
            
        if (ws === webSocket) {
    if (deviceSocket && deviceSocket.readyState === WebSocket.OPEN) {
        console.log('➡️ Forwarding to device:', msg.substring(0, 50) + '...');
        deviceSocket.send(msg);
    } else {
        ws.send('STATUS:OFFLINE');
    }
} else if (ws === deviceSocket) {
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(msg);
                console.log('📤 Forwarded to web:', msg.substring(0, 50) + '...');
            }
        }
    });

    ws.on('close', () => {
        if (ws === deviceSocket) {
            console.log('📱 Device disconnected');
            deviceSocket = null;
            if (webSocket) webSocket.send('STATUS:OFFLINE');
        } else if (ws === webSocket) {
            console.log('🌐 Web panel disconnected');
            webSocket = null;
        }
    });

    ws.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

console.log(`🚀 Server running on port ${PORT}`);


