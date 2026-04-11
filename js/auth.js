// ==================== AUTHENTICATION ====================
function toggleFlashOptions() {
    const clickCam = document.querySelector('input[name="clickCameraSelect"]:checked').value;
    document.getElementById('clickFlashContainer').style.display = (clickCam === 'back') ? 'block' : 'none';
    const liveCam = document.querySelector('input[name="liveCameraSelect"]:checked').value;
    document.getElementById('liveFlashContainer').style.display = (liveCam === 'back') ? 'inline-block' : 'none';
}

function renderAuthForm() {
    const c = document.getElementById('authBox');
    if (window.isLoginMode) {
        c.innerHTML = `<h2>🔐 SystemSync Login</h2><input type="email" id="authEmail" placeholder="Email Address" /><input type="password" id="authPassword" placeholder="Password" /><input type="password" id="authConfirmPassword" placeholder="Confirm Password" style="display:none;" /><button id="authBtn">Sign In</button><div class="toggle-link" id="toggleAuthMode" tabindex="0">Don't have an account? Sign up</div><div id="authError"></div>`;
    } else {
        c.innerHTML = `<h2>✨ Create Account</h2><input type="email" id="authEmail" placeholder="Email Address" /><input type="password" id="authPassword" placeholder="Password" /><input type="password" id="authConfirmPassword" placeholder="Confirm Password" /><button id="authBtn">Sign Up</button><div class="toggle-link" id="toggleAuthMode" tabindex="0">Already have an account? Sign in</div><div id="authError"></div>`;
    }
    document.getElementById('authBtn').onclick = handleAuth;
    document.getElementById('toggleAuthMode').onclick = (e) => { e.preventDefault(); window.isLoginMode = !window.isLoginMode; renderAuthForm(); };
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const pwd = document.getElementById('authPassword').value.trim();
    const err = document.getElementById('authError');
    if (!email || !pwd) { err.innerText = 'Please fill all fields'; return; }
    const btn = document.getElementById('authBtn');
    btn.innerText = 'Processing...';
    try {
        if (!window.isLoginMode) {
            const cf = document.getElementById('authConfirmPassword').value.trim();
            if (pwd !== cf) { err.innerText = 'Passwords do not match'; btn.innerText = 'Sign Up'; return; }
            await window.auth.createUserWithEmailAndPassword(email, pwd);
        } else {
            await window.auth.signInWithEmailAndPassword(email, pwd);
        }
    } catch (e) {
        err.innerText = e.message;
        btn.innerText = window.isLoginMode ? 'Sign In' : 'Sign Up';
    }
}

function logout() {
    window.auth.signOut();
    if (window.ws) window.ws.close();
    if (window.deviceInfoRefreshInterval) clearInterval(window.deviceInfoRefreshInterval);
    window.selectedDeviceId = null;
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('main').style.display = 'none';
    document.getElementById('deviceListContainer').style.display = 'none';
    document.getElementById('authContainer').style.display = 'flex';
}

async function loadDevices() {
    if (!window.currentUser) return;
    const snap = await window.db.collection('devices').where('userId', '==', window.currentUser.uid).get();
    const list = document.getElementById('deviceList');
    list.innerHTML = '';
    if (snap.empty) {
        list.innerHTML = '<p style="color:#999; text-align:center;">No devices registered.</p>';
    } else {
        snap.forEach(doc => {
            const d = doc.data();
            const div = document.createElement('div');
            div.className = 'device-item';
            div.onclick = () => selectDevice(d.deviceId, d.name || 'Unknown');
            div.innerHTML = `<span class="device-icon">📱</span><div class="device-info"><div class="device-name">${escapeHtml(d.name || 'Unnamed device')}</div><div class="device-id">${escapeHtml(d.deviceId)}</div></div>`;
            list.appendChild(div);
        });
    }
    document.getElementById('deviceListContainer').style.display = 'flex';
}

window.leaveDevice = function() {
    window.selectedDeviceId = null;
    document.getElementById('main').style.display = 'none';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('deviceListContainer').style.display = 'flex';
    document.getElementById('headerLeaveBtn').style.display = 'none';
    if (window.ws) window.ws.close();
    if (window.deviceInfoRefreshInterval) clearInterval(window.deviceInfoRefreshInterval);
};

function selectDevice(id, name) {
    history.pushState({ view: 'device' }, '', '#device');
    document.getElementById('headerLeaveBtn').style.display = 'inline-block';
    window.selectedDeviceId = id;
    document.getElementById('deviceListContainer').style.display = 'none';
    document.getElementById('sidebar').style.display = '';
    document.getElementById('main').style.display = 'flex';
    document.getElementById('serverInfo').innerHTML = `Device: ${escapeHtml(name || id)} <span style="font-size:12px; color:#666;" id="lastSeenSpan"></span>`;
    connectWebSocket();
    loadDeviceInfoAndSchedule();
}

async function loadDeviceInfoAndSchedule() {
    if (!window.selectedDeviceId || !window.currentUser) return;
    await loadDeviceInfo();
    if (window.deviceInfoRefreshInterval) clearInterval(window.deviceInfoRefreshInterval);
    window.deviceInfoRefreshInterval = setInterval(() => loadDeviceInfo(), 30000);
}

async function loadDeviceInfo() {
    if (!window.selectedDeviceId || !window.currentUser) return;
    try {
        const doc = await window.db.collection('devices').doc(window.selectedDeviceId).get();
        if (doc.exists) {
            const data = doc.data();
            const name = data.name || 'Unnamed';
            const lastSeen = data.lastSeen ? new Date(data.lastSeen).toLocaleString() : 'Never';
            document.getElementById('serverInfo').innerHTML = `Device: ${escapeHtml(name)} <span style="font-size:12px; color:#666;">(last seen: ${escapeHtml(lastSeen)})</span>`;
        } else {
            document.getElementById('serverInfo').innerHTML = `Device: ${escapeHtml(window.selectedDeviceId)} <span style="font-size:12px; color:#666;">(no info)</span>`;
        }
    } catch (e) { console.warn('Failed to load device info:', e); }
}
