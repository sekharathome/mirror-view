const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve the index.html file to the browser
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

console.log(`Server is running on port ${port}`);

wss.on('connection', (ws) => {
    console.log("Client connected (Phone or Browser)");

    ws.on('message', (message) => {
        // Relay messages to all OTHER clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => console.log("Client disconnected"));
});

server.listen(port);
