const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname)));

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        // Broadcast everything (Commands and Screenshot Frames)
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // Ensure message is sent as a string for Base64 compatibility
                client.send(message.toString());
            }
        });
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
