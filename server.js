const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        const message = data.toString();

        // DEBUG LOG: This will show you if the web button is working
        if (!message.startsWith("FRAME:")) {
            console.log("Command received from Web:", message);
        }

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('Client disconnected'));
    ws.on('error', (error) => console.error('WebSocket Error:', error));
});

console.log(`Server is running on port ${port}`);
