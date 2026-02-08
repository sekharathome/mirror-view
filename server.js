const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("SystemSync Signaling Server Running");
});

const wss = new WebSocket.Server({ server });

let devices = new Map();
let controllers = new Map();

function sendDeviceList() {

    const list = Array.from(devices.values()).map(d => ({
        id: d.id,
        name: d.name
    }));

    const payload = JSON.stringify({
        type: "DEVICE_LIST",
        devices: list
    });

    controllers.forEach(ws => ws.send(payload));
}

wss.on('connection', (ws) => {

    ws.id = cryptoRandomId();

    ws.on('message', (msg) => {

        let data;

        try {
            data = JSON.parse(msg);
        } catch {
            return;
        }

        switch (data.type) {

            // ✅ DEVICE CONNECT
            case "REGISTER_DEVICE":

                ws.isDevice = true;
                ws.name = data.name;

                devices.set(ws.id, ws);
                sendDeviceList();

                break;

            // ✅ CONTROLLER CONNECT
            case "REGISTER_CONTROLLER":

                ws.isDevice = false;
                controllers.set(ws.id, ws);

                sendDeviceList();
                break;

            // ✅ SELECT DEVICE
            case "SELECT_DEVICE":

                ws.target = data.deviceId;
                break;

            // ✅ SIGNALING RELAY
            case "OFFER":
            case "ANSWER":
            case "ICE":

                relay(ws, data);
                break;

            // ✅ COMMAND RELAY
            case "COMMAND":

                relay(ws, data);
                break;
        }
    });

    ws.on('close', () => {

        devices.delete(ws.id);
        controllers.delete(ws.id);

        sendDeviceList();
    });
});

function relay(sender, data) {

    let target;

    if (sender.isDevice) {

        controllers.forEach(ctrl => {
            if (ctrl.target === sender.id) {
                ctrl.send(JSON.stringify(data));
            }
        });

    } else {

        target = devices.get(sender.target);

        if (target) {
            target.send(JSON.stringify(data));
        }
    }
}

function cryptoRandomId() {
    return Math.random().toString(36).substring(2, 12);
}

server.listen(PORT, () =>
    console.log("Signaling server running on port", PORT)
);
