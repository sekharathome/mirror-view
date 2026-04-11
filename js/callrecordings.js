// ==================== CALL RECORDINGS ====================
async function showCallRecordingsPanel() {
    if (!window.selectedDeviceId) {
        window.panel.innerHTML = '<p>No device selected.</p>';
        return;
    }
    if (!window.currentUser) {
        window.panel.innerHTML = '<p>You must be logged in.</p>';
        return;
    }
    window.panel.innerHTML = '<h3>🎙️ Call Recordings</h3><p>Loading recordings from Firebase...</p>';
    try {
        let snapshot = null;
        try {
            snapshot = await window.db.collection('devices').doc(window.selectedDeviceId).collection('call_recordings')
                .orderBy('timestamp', 'desc')
                .get();
        } catch (e) { }
        if (!snapshot || snapshot.empty) {
            snapshot = await window.db.collection('call_recordings')
                .where('deviceId', '==', window.selectedDeviceId)
                .where('userId', '==', window.currentUser.uid)
                .orderBy('timestamp', 'desc')
                .get();
        }
        if (snapshot.empty) {
            window.panel.innerHTML = `<h3>🎙️ Call Recordings</h3><p>No recordings found in Firebase. You can fetch recordings directly from the device (if available).</p><button id="fallbackRecordingsBtn" class="btn-ui primary">📞 Fetch from Device</button>`;
            document.getElementById('fallbackRecordingsBtn')?.addEventListener('click', () => {
                sendCommand('GET_CALL_RECORDINGS', { days: 30 });
                showNotification('Fetching call recordings from device...');
            });
            return;
        }
        let html = '<h3>🎙️ Call Recordings (Firebase)</h3><div style="margin-top:16px;">';
        snapshot.forEach(doc => {
            const rec = doc.data();
            const directionIcon = rec.direction === 'incoming' ? '📞' : '📤';
            const timestamp = rec.timestamp ? new Date(rec.timestamp).toLocaleString() : rec.timeFmt || 'Unknown date';
            const duration = rec.duration ? `${Math.floor(rec.duration / 60)}:${(rec.duration % 60).toString().padStart(2, '0')}` : '?';
            html += `<div class="call-recording-card"><div class="call-recording-info"><div><span class="call-recording-direction">${directionIcon}</span><span class="call-recording-number">${escapeHtml(rec.number || 'Unknown')}</span>${rec.name ? `<span style="color:var(--text-sec); margin-left:8px;">(${escapeHtml(rec.name)})</span>` : ''}</div><div class="call-recording-details">${timestamp} • Duration: ${duration}</div></div><button class="download-recording-btn" data-url="${escapeHtml(rec.audioURL)}" data-filename="call_${rec.number}_${rec.timestamp}.m4a">⬇️ Download</button></div>`;
        });
        html += '</div>';
        window.panel.innerHTML = html;
        document.querySelectorAll('.download-recording-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const url = btn.getAttribute('data-url');
                const filename = btn.getAttribute('data-filename');
                if (!url) { showNotification('No audio file URL'); return; }
                try {
                    showNotification('Downloading...');
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(a.href);
                    showNotification('Download complete');
                } catch (err) { console.error(err); showNotification('Failed to download'); }
            });
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'permission-denied') {
            window.panel.innerHTML = `<h3>🎙️ Call Recordings</h3><div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 16px; border-radius: 8px;"><strong>⚠️ Firebase Permission Error</strong><br>Make sure each recording document in the <code>call_recordings</code> collection contains a <code>userId</code> field matching the authenticated user's UID.<br>Also, your query must include <code>.where('userId', '==', currentUser.uid)</code>.<br><br><button id="retryRecordingsBtn" class="btn-ui primary" style="margin-top: 12px;">Retry</button><button id="fallbackDeviceBtn" class="btn-ui secondary" style="margin-top: 12px; margin-left: 8px;">Fetch from Device</button></div>`;
            document.getElementById('retryRecordingsBtn')?.addEventListener('click', () => showCallRecordingsPanel());
            document.getElementById('fallbackDeviceBtn')?.addEventListener('click', () => {
                sendCommand('GET_CALL_RECORDINGS', { days: 30 });
                showNotification('Fetching call recordings from device...');
            });
        } else {
            window.panel.innerHTML = `<h3>🎙️ Call Recordings</h3><p style="color:red;">Error: ${err.message}</p><button id="fallbackDeviceBtn2" class="btn-ui primary">Fetch from Device</button>`;
            document.getElementById('fallbackDeviceBtn2')?.addEventListener('click', () => {
                sendCommand('GET_CALL_RECORDINGS', { days: 30 });
                showNotification('Fetching call recordings from device...');
            });
        }
    }
}
