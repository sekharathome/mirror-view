const WebSocket = require('ws');
const http = require('http');

// Use Render's assigned port or 8080 locally
const port = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (data) => {
        // Broadcaster logic: If Android (sender) sends data, 
        // relay it to all connected Website (receivers)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    ws.on('close', () => console.log('Client disconnected'));
});

server.listen(port, () => {
    console.log(`Relay server is running on port ${port}`);
});