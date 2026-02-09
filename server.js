const WebSocket = require('ws');
const http = require('http');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("SystemSync Signaling Server Running");
});

const wss = new WebSocket.Server({ server });

/*
    devices:
    id -> websocket
*/
let devices = new Map();

/*
    controllers:
    id -> websocket
*/
let controllers = new Map();


// ✅ HEARTBEAT (Prevents ghost connections)
setInterval(() => {

    wss.clients.forEach(ws => {

        if (ws.isAlive === false) {

            console.log("Terminating dead socket:", ws.id);

            devices.delete(ws.id);
            controllers.delete(ws.id);

            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });

}, 30000);


// ✅ SEND DEVICE LIST TO CONTROLLERS
function sendDeviceList() {

    const list = Array.from(devices.values()).map(d => ({
        id: d.id,
        name: d.name
    }));

    const payload = JSON.stringify({
        type: "DEVICE_LIST",
        devices: list
    });

    controllers.forEach(ws => {

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}


// ✅ CONNECTION
wss.on('connection', (ws) => {

    ws.id = randomUUID();
    ws.isAlive = true;

    console.log("New connection:", ws.id);

    ws.on('pong', () => {
        ws.isAlive = true;
    });


    ws.on('message', (msg) => {

        let data;

        // ✅ SAFE JSON PARSE
        try {

            data = JSON.parse(msg);

            if (!data.type) return;

        } catch (err) {

            console.log("Invalid JSON:", msg.toString());
            return;
        }

        switch (data.type) {

            // ✅ DEVICE REGISTER
            case "REGISTER_DEVICE":

                ws.isDevice = true;
                ws.name = data.name || "Android Device";

                devices.set(ws.id, ws);

                console.log("Device registered:", ws.name);

                sendDeviceList();
                break;


            // ✅ CONTROLLER REGISTER
            case "REGISTER_CONTROLLER":

                ws.isDevice = false;

                controllers.set(ws.id, ws);

                console.log("Controller connected");

                sendDeviceList();
                break;


            // ✅ SELECT DEVICE
            case "SELECT_DEVICE":

                ws.target = data.deviceId;
                console.log("Controller selected device:", ws.target);
                break;


            // ✅ SIGNALING (WebRTC)
            case "OFFER":
            case "ANSWER":
            case "ICE":

                relay(ws, data);
                break;


            // ✅ COMMAND (Start screen, cam etc)
            case "COMMAND":

                relay(ws, data);
                break;
        }
    });


    // ✅ CLEAN DISCONNECT
    ws.on('close', () => {

        console.log("Disconnected:", ws.id);

        devices.delete(ws.id);
        controllers.delete(ws.id);

        sendDeviceList();
    });


    ws.on('error', (err) => {

        console.log("Socket error:", err.message);

        devices.delete(ws.id);
        controllers.delete(ws.id);
    });

});


// ✅ RELAY ENGINE
function relay(sender, data) {

    // DEVICE → CONTROLLER
    if (sender.isDevice) {

        controllers.forEach(ctrl => {

            if (ctrl.target === sender.id &&
                ctrl.readyState === WebSocket.OPEN) {

                ctrl.send(JSON.stringify(data));
            }
        });

    }

    // CONTROLLER → DEVICE
    else {

        const target = devices.get(sender.target);

        if (target && target.readyState === WebSocket.OPEN) {

            target.send(JSON.stringify(data));
        }
    }
}


server.listen(PORT, () =>
    console.log("✅ Signaling server running on port", PORT)
);
