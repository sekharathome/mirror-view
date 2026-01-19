const http = require('http');
const WebSocket = require('ws');

// 1. Use the PORT environment variable provided by Render, defaulting to 10000
const port = process.env.PORT || 10000;

// 2. Create a standard HTTP server to satisfy Render's health check
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Screen Mirror Relay is Running'); // This line fixes the Render error
});

// 3. Attach the WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        // Broadcast video data to all other connected clients (Website)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('Client disconnected'));
});

// 4. Bind to '0.0.0.0' specifically to allow external connections
server.listen(port, '0.0.0.0', () => {
    console.log(`Relay server listening on port ${port}`);
});
