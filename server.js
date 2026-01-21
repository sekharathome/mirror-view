const WebSocket = require('ws');
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

console.log(`Signaling server running on port ${port}`);

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        // Parse the incoming message to handle commands or signaling
        const data = JSON.parse(message);
        
        // Broadcast signaling (Offer/Answer/ICE) or Commands (Vibrate/Hide) 
        // to everyone except the sender.
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on('close', () => console.log('Client disconnected'));
});
