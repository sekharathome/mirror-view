// ==================== AUTHENTICATION MODULE ====================
function renderAuthForm() {
    const container = document.getElementById('authBox');
    if (isLoginMode) {
        container.innerHTML = `
            <h2>🔐 SystemSync Login</h2>
            <input type="email" id="authEmail" placeholder="Email" />
            <input type="password" id="authPassword" placeholder="Password" />
            <input type="password" id="authConfirmPassword" placeholder="Confirm Password" style="display: none;" />
            <button id="authBtn">Sign In</button>
            <div class="toggle-link" id="toggleAuthMode">Don't have an account? Sign up</div>
            <div id="authError"></div>
        `;
    } else {
        container.innerHTML = `
            <h2>📝 Create Account</h2>
            <input type="email" id="authEmail" placeholder="Email" />
            <input type="password" id="authPassword" placeholder="Password" />
            <input type="password" id="authConfirmPassword" placeholder="Confirm Password" />
            <button id="authBtn">Sign Up</button>
            <div class="toggle-link" id="toggleAuthMode">Already have an account? Sign in</div>
            <div id="authError"></div>
        `;
    }
    
    document.getElementById('authBtn').addEventListener('click', handleAuth);
    document.getElementById('toggleAuthMode').addEventListener('click', toggleAuthMode);
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    renderAuthForm();
}

function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const errorDiv = document.getElementById('authError');
    errorDiv.innerText = '';

    if (!email || !password) {
        errorDiv.innerText = 'Please fill all fields';
        return;
    }

    if (!isLoginMode) {
        const confirm = document.getElementById('authConfirmPassword').value.trim();
        if (password !== confirm) {
            errorDiv.innerText = 'Passwords do not match';
            return;
        }
        // Sign up
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                currentUser = userCredential.user;
                document.getElementById('authContainer').style.display = 'none';
                loadDevices();
            })
            .catch(error => {
                errorDiv.innerText = error.message;
            });
    } else {
        // Login
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                currentUser = userCredential.user;
                document.getElementById('authContainer').style.display = 'none';
                loadDevices();
            })
            .catch(error => {
                errorDiv.innerText = error.message;
            });
    }
}

function logout() {
    auth.signOut().then(() => {
        document.getElementById('deviceListContainer').style.display = 'none';
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('main').style.display = 'none';
        document.getElementById('authContainer').style.display = 'flex';
        if (ws) ws.close();
        selectedDeviceId = null;
        isLoginMode = true;
        renderAuthForm();
    });
}

function loadDevices() {
    if (!currentUser) return;
    db.collection('devices').where('userId', '==', currentUser.uid).get()
        .then(snapshot => {
            const deviceList = document.getElementById('deviceList');
            deviceList.innerHTML = '';
            if (snapshot.empty) {
                deviceList.innerHTML = '<p style="color:#999; text-align:center;">No devices registered.</p>';
            } else {
                snapshot.forEach(doc => {
                    const device = doc.data();
                    const div = document.createElement('div');
                    div.className = 'device-item';
                    div.onclick = () => selectDevice(device.deviceId, device.name || 'Unknown');
                    div.innerHTML = `
                        <span class="device-icon">📱</span>
                        <div class="device-info">
                            <div class="device-name">${escapeHtml(device.name || 'Unnamed device')}</div>
                            <div class="device-id">${escapeHtml(device.deviceId)}</div>
                        </div>
                    `;
                    deviceList.appendChild(div);
                });
            }
            document.getElementById('deviceListContainer').style.display = 'flex';
        })
        .catch(error => {
            console.error('Error loading devices:', error);
            alert('Failed to load devices: ' + error.message);
        });
}

function selectDevice(deviceId, deviceName) {
    selectedDeviceId = deviceId;
    document.getElementById('deviceListContainer').style.display = 'none';
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('main').style.display = 'flex';
    document.getElementById('serverInfo').innerText = `Device: ${deviceName || deviceId}`;
    connectWebSocket();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
