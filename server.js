const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        // Broadcast all messages (SDP Offers, Answers, ICE Candidates)
        // to every other connected client.
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
});
