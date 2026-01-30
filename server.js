const WebSocket = require('ws');

// Use the PORT environment variable (required for Render) or default to 8080
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        // Convert the incoming data (buffer) to a string
        const message = data.toString();

        // Broadcast the message to every OTHER connected client
        // This sends the "FRAME:" data from the phone to the web browser
        // and "START_SCREEN" commands from the browser to the phone.
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });
});

console.log(`Server is running on port ${port}`);
