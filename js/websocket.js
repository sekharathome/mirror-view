// ==================== WEBSOCKET MODULE ====================
function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log('already connecting/open');
        return;
    }
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    setStatus('CONNECTING');
    if (wsDebug) wsDebug.innerText = '🌐 WebSocket: connecting...';
    panel.innerHTML = '⏳ Connecting to server...';

    ws = new WebSocket(CONFIG.WS_URL);
    ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        ws.send('I_AM_WEB');
        setStatus('ONLINE');
        panel.innerHTML = '✅ Connected to server. Ready.';
        if (wsDebug) wsDebug.innerText = '🌐 WebSocket: ONLINE';
    };
    ws.onmessage = (e) => {
        console.log('RAW message:', e.data.substring(0, 100));
        handleIncomingMessage(e.data);
    };
    ws.onclose = (ev) => {
        console.log('WebSocket closed', ev.reason);
        setStatus('OFFLINE');
        if (wsDebug) wsDebug.innerText = `🌐 WebSocket: closed (${ev.reason})`;
        panel.innerHTML = '🔌 WebSocket disconnected. <a href="#" onclick="manualReconnect()">Reconnect</a>.';
        ws = null;

        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), CONFIG.MAX_RECONNECT_DELAY);
        reconnectAttempts++;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
            console.log('Reconnecting...');
            connectWebSocket();
        }, delay);
    };
    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setStatus('ERROR');
        if (wsDebug) wsDebug.innerText = '🌐 WebSocket: error';
    };
}

function manualReconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
    reconnectAttempts = 0;
    connectWebSocket();
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

function sendCommand(command, params = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        panel.innerHTML = `<div style="color:#d32f2f;">⚠ WebSocket not connected. <a href="#" onclick="manualReconnect()">Reconnect</a>.</div>`;
        return;
    }
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const payload = {
        type: 'COMMAND',
        command: command,
        requestId: requestId,
        params: params,
        deviceId: selectedDeviceId,
        timestamp: Date.now()
    };
    ws.send(JSON.stringify(payload));
    panel.innerHTML = `<div style="color:#1976ff;">📤 Command sent: ${command}</div>`;
    pendingCommand = command;
    console.log('Sent command:', command, params);
    setTimeout(() => { if (pendingCommand === command) pendingCommand = null; }, 10000);
}

function sendPlainText(msg) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        panel.innerHTML = `<div style="color:#d32f2f;">⚠ WebSocket not connected.</div>`;
        return;
    }
    ws.send(msg);
    panel.innerHTML = `<div style="color:#1976ff;">📤 Plain text sent: ${msg}</div>`;
}

function sendSignalingMessage(msg) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not open');
        return;
    }
    const payload = {
        type: 'SIGNALING',
        deviceId: selectedDeviceId,
        data: msg
    };
    ws.send(JSON.stringify(payload));
    console.log('📤 Signaling sent:', msg.type);
}
