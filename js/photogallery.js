// ==================== PHOTO GALLERY ====================
async function showPhotoGalleryPanel() {
    if (!window.selectedDeviceId) {
        window.panel.innerHTML = '<p>No device selected.</p>';
        return;
    }
    if (!window.currentUser) {
        window.panel.innerHTML = '<p>You must be logged in.</p>';
        return;
    }
    window.panel.innerHTML = '<h3>🖼️ Photo Gallery</h3><p>Loading photos from Firebase...</p>';
    try {
        const snapshot = await window.db.collection('images_meta')
            .where('deviceId', '==', window.selectedDeviceId)
            .get();
        if (snapshot.empty) {
            window.panel.innerHTML = `<h3>🖼️ Photo Gallery</h3><p>No photos found in Firebase. You can fetch recent images directly from the device (if available).</p><button id="fallbackGalleryBtn" class="btn-ui primary">📸 Fetch from Device</button>`;
            document.getElementById('fallbackGalleryBtn')?.addEventListener('click', () => {
                sendCommand('GET_RECENT_IMAGES', { days: 5 });
                showNotification('Fetching recent images from device...');
            });
            return;
        }
        const docs = [];
        snapshot.forEach(doc => { docs.push({ id: doc.id, ...doc.data() }); });
        docs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        let html = '<h3>🖼️ Photo Gallery (Firebase)</h3><div class="photo-grid" id="photoGrid"></div>';
        window.panel.innerHTML = html;
        const grid = document.getElementById('photoGrid');
        docs.forEach(photo => {
            const thumbBase64 = photo.thumb ? `data:image/jpeg;base64,${photo.thumb}` : null;
            const timestamp = photo.dateAdded ? new Date(photo.dateAdded * 1000).toLocaleString() : '';
            const tile = document.createElement('div');
            tile.className = 'photo-tile';
            if (thumbBase64) {
                tile.innerHTML = `<img src="${thumbBase64}" loading="lazy"><div class="photo-overlay">${escapeHtml(timestamp)}</div>`;
            } else {
                tile.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; background:#f0f0f0;">📷</div><div class="photo-overlay">${escapeHtml(timestamp)}</div>`;
            }
            tile.addEventListener('click', () => {
                if (photo.mediaId) {
                    sendCommand('GET_IMAGE', { mediaId: photo.mediaId, maxDim: 1200 });
                    showNotification('Requesting full image from device...');
                } else {
                    showNotification('No image data available');
                }
            });
            grid.appendChild(tile);
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'permission-denied') {
            window.panel.innerHTML = `<h3>🖼️ Photo Gallery</h3><div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 16px; border-radius: 8px;"><strong>⚠️ Firebase Permission Error</strong><br>Your security rules are blocking access to the <code>images_meta</code> collection.<br><br><button id="retryGalleryBtn" class="btn-ui primary" style="margin-top: 12px;">Retry</button><button id="fallbackDeviceBtn" class="btn-ui secondary" style="margin-top: 12px; margin-left: 8px;">Fetch from Device</button></div>`;
            document.getElementById('retryGalleryBtn')?.addEventListener('click', () => showPhotoGalleryPanel());
            document.getElementById('fallbackDeviceBtn')?.addEventListener('click', () => {
                sendCommand('GET_RECENT_IMAGES', { days: 5 });
                showNotification('Fetching recent images from device...');
            });
        } else {
            window.panel.innerHTML = `<h3>🖼️ Photo Gallery</h3><p style="color:red;">Error: ${err.message}</p><button id="fallbackGalleryBtn2" class="btn-ui primary">Fetch from Device</button>`;
            document.getElementById('fallbackGalleryBtn2')?.addEventListener('click', () => {
                sendCommand('GET_RECENT_IMAGES', { days: 5 });
                showNotification('Fetching recent images from device...');
            });
        }
    }
}
