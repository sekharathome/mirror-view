const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

// Create the WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`Server started on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('A new client (Mobile or Web) connected.');

    ws.on('message', (message) => {
        const messageString = message.toString();

        // LOGIC: Broadcast the message to EVERYONE ELSE connected
        // This ensures the App sees the "START" command and Web sees the "FRAME"
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });
});
