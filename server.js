const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('WebRTC Signaling Server Running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Peer connected to signaling server');

    ws.on('message', (message) => {
        // Relay signaling data (SDP and ICE candidates) to other connected peers
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => console.log('Peer disconnected'));
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Signaling server listening on port ${port}`);
});
