# SystemSync Console

A remote monitoring and control panel for Android devices.

## Features

- **Authentication**: Firebase Email/Password login and registration
- **Multi-device support**: Manage multiple devices under one account
- **Surveillance**: Screen sharing, camera capture, live camera streaming, audio streaming
- **Data retrieval**: SMS, call logs, contacts, installed apps, browser history, Wi-Fi networks
- **Monitoring**: Screen time, social messages, keylogger, clipboard, geofencing, location history
- **Controls**: Lock device, hide/show app icon, vibrate, flash toggle, send SMS

## Setup

1. **Firebase Configuration**:
   - Create a Firebase project
   - Enable Email/Password authentication
   - Create Firestore database
   - Update `CONFIG.FIREBASE_CONFIG` in `js/config.js`

2. **Deployment**:
   - Upload all files to any web server
   - Open `index.html` in a browser

## File Structure
SystemSync-Console/
├── index.html # Main entry point
├── css/
│ └── styles.css # All styles
├── js/
│ ├── config.js # Configuration
│ ├── auth.js # Authentication
│ ├── websocket.js # WebSocket connection
│ ├── webrtc.js # WebRTC handling
│ ├── ui.js # UI rendering
│ ├── file-handler.js # File management
│ └── main.js # Initialization
└── README.md


## Usage

1. Sign up or log in with your email
2. Select a device from the list
3. Use the sidebar buttons to send commands
4. View results in the main panel

## Dependencies

- Leaflet (maps)
- Firebase (authentication and Firestore)
- WebRTC (screen share, camera, audio)
- Java-WebSocket (WebSocket communication)
