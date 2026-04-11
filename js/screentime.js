// ==================== SCREEN TIME ====================
async function showAppUsagePanel() {
    if (!window.selectedDeviceId) {
        window.panel.innerHTML = '<p>No device selected.</p>';
        return;
    }
    if (!window.currentUser) {
        window.panel.innerHTML = '<p>You must be logged in.</p>';
        return;
    }
    window.panel.innerHTML = `<h3>📊 Screen Time (from Firebase)</h3><div class="date-selector"><button class="btn-ui primary" data-days="1">Today</button><button class="btn-ui primary" data-days="7">Last 7 Days</button><button class="btn-ui primary" data-days="30">Last 30 Days</button></div><div id="screenTimeData"></div>`;
    window.panel.querySelectorAll('button[data-days]').forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.dataset.days);
            loadAppUsageFromFirebase(days);
        });
    });
    loadAppUsageFromFirebase(1);
}

async function loadAppUsageFromFirebase(days) {
    const container = document.getElementById('screenTimeData');
    if (!container) return;
    container.innerHTML = '<p>Loading...</p>';
    try {
        const now = new Date();
        const cutoff = new Date(now.getTime() - days * 86400000);
        const snapshot = await window.db.collection('devices').doc(window.selectedDeviceId).collection('app_usage')
            .where('timestamp', '>=', cutoff)
            .orderBy('timestamp', 'desc')
            .get();
        if (snapshot.empty) {
            container.innerHTML = '<p>No screen time data found in Firebase. The device app will upload usage stats every hour.</p>';
            return;
        }
        const appTotals = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            const apps = JSON.parse(data.apps);
            if (Array.isArray(apps)) {
                apps.forEach(app => {
                    const name = app.appName || app.packageName || 'Unknown';
                    const timeMs = app.totalTimeMs || 0;
                    if (appTotals.has(name)) appTotals.set(name, appTotals.get(name) + timeMs);
                    else appTotals.set(name, timeMs);
                });
            }
        });
        if (appTotals.size === 0) {
            container.innerHTML = '<p>No usage data for the selected period.</p>';
            return;
        }
        const sorted = Array.from(appTotals.entries()).sort((a, b) => b[1] - a[1]);
        const max = sorted[0][1];
        let html = `<p>Showing aggregated usage for the last ${days} day(s).</p><div style="margin-top:16px;">`;
        for (let [name, timeMs] of sorted) {
            const pct = max ? Math.round((timeMs / max) * 100) : 0;
            const color = getColorForDuration(timeMs);
            html += `<div class="app-usage-item"><div class="app-usage-name">${escapeHtml(name)}</div><div class="usage-bar-container"><div class="usage-bar" style="width:${pct}%; background-color:${color};"></div></div><div class="app-usage-time">${formatDuration(timeMs)}</div></div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:red;">Error loading screen time data: ' + err.message + '</p>';
    }
}
