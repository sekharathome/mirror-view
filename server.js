const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log("Signaling Server started on port 8080...");

wss.on('connection', (ws) => {
    console.log("New connection established.");

    ws.on('message', (message) => {
        // Broadcast the message to all other connected clients
        // This allows the Phone to send data to the Browser and vice versa
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log("Connection closed.");
    });
});
