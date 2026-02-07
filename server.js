const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("SystemSync Server is Running...");
});

const wss = new WebSocket.Server({ server });

// Store active connections
// devices: { socketId: ws, name: "Samsung S21" }
// controllers: { socketId: ws, targetDeviceId: "device_socket_id" }
let devices = new Map();
let controllers = new Map();

wss.on('connection', (ws) => {
    // Assign a unique ID to every connection
    const socketId = Math.random().toString(36).substr(2, 9);
    ws.id = socketId;

    console.log(`New connection: ${socketId}`);

    ws.on('message', (message) => {
        const data = message.toString();

        // --- DEVICE REGISTRATION ---
        if (data.startsWith("REGISTER_DEVICE:")) {
            const deviceName = data.split(":")[1];
            ws.isDevice = true;
            ws.deviceName = deviceName;
            devices.set(socketId, ws);
            console.log(`Device registered: ${deviceName} (${socketId})`);
            broadcastDeviceList();
        }

        // --- CONTROLLER INITIALIZATION ---
        else if (data === "I_AM_CONTROLLER") {
            ws.isDevice = false;
            controllers.set(socketId, ws);
            // Send current devices to the new controller
            sendDeviceList(ws);
        }

        // --- DEVICE SELECTION ---
        else if (data.startsWith("SELECT_DEVICE:")) {
            const targetId = data.split(":")[1];
            ws.targetDeviceId = targetId;
            console.log(`Controller ${socketId} selected device ${targetId}`);
        }

        // --- DATA ROUTING (THE SWITCHBOARD) ---
        else {
            if (ws.isDevice) {
                // If message comes from PHONE, send to all controllers watching it
                controllers.forEach(ctrl => {
                    if (ctrl.targetDeviceId === ws.id) {
                        ctrl.send(data);
                    }
                });
            } else {
                // If message comes from WEB, send ONLY to the selected device
                if (ws.targetDeviceId) {
                    const targetDevice = devices.get(ws.targetDeviceId);
                    if (targetDevice) {
                        targetDevice.send(data);
                    }
                }
            }
        }
    });

    ws.on('close', () => {
        if (ws.isDevice) {
            devices.delete(ws.id);
            console.log(`Device disconnected: ${ws.deviceName}`);
            broadcastDeviceList();
        } else {
            controllers.delete(ws.id);
        }
    });
});

// Helper: Send list of devices to one controller
function sendDeviceList(targetSocket) {
    const list = Array.from(devices.values()).map(d => ({
        id: d.id,
        name: d.deviceName
    }));
    targetSocket.send("DEVICE_LIST:" + JSON.stringify(list));
}

// Helper: Notify all web apps when a phone joins/leaves
function broadcastDeviceList() {
    const list = Array.from(devices.values()).map(d => ({
        id: d.id,
        name: d.deviceName
    }));
    const payload = "DEVICE_LIST:" + JSON.stringify(list);
    
    controllers.forEach(ctrl => {
        ctrl.send(payload);
    });
}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
