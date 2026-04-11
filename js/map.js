// ==================== MAP ====================
function renderLiveMap(lat, lon, acc) {
    if (!window.liveMap) {
        window.panel.innerHTML = `<div style="position:relative;"><div id="liveMapContainer" style="height:400px; border-radius:12px;"></div><div class="map-info" id="liveMapInfo"><div><strong>📍 Live Location</strong></div><div id="liveCoord">${lat.toFixed(6)}, ${lon.toFixed(6)}</div><div id="liveAccuracy">🎯 Accuracy: ${acc.toFixed(1)} m</div><div id="liveAddress">🌍 Loading address...</div></div><div class="map-type-toggle" id="liveMapTypeToggle">🗺️ Switch to Satellite</div><label class="follow-checkbox" id="followCheckbox"><input type="checkbox" id="followLocationCheck"> Follow location</label></div>`;
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' });
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' });
        window.liveMap = L.map('liveMapContainer').setView([lat, lon], 18);
        streetLayer.addTo(window.liveMap);
        window.liveMap.currentTileLayer = streetLayer;
        window.liveMap.satelliteLayer = satelliteLayer;
        window.liveMap.streetLayer = streetLayer;
        window.liveMarker = L.marker([lat, lon], { icon: L.divIcon({ className: 'current-location-marker', iconSize: [12, 12] }) }).addTo(window.liveMap).bindPopup('Device Location');
        window.liveCircle = L.circle([lat, lon], { radius: acc, color: '#1976ff', fillColor: '#1976ff', fillOpacity: 0.2 }).addTo(window.liveMap);
        document.getElementById('liveMapTypeToggle').addEventListener('click', () => {
            if (window.currentMapType === 'street') {
                window.liveMap.removeLayer(window.liveMap.currentTileLayer);
                window.liveMap.satelliteLayer.addTo(window.liveMap);
                window.liveMap.currentTileLayer = window.liveMap.satelliteLayer;
                window.currentMapType = 'satellite';
                document.getElementById('liveMapTypeToggle').innerHTML = '🗺️ Switch to Street';
            } else {
                window.liveMap.removeLayer(window.liveMap.currentTileLayer);
                window.liveMap.streetLayer.addTo(window.liveMap);
                window.liveMap.currentTileLayer = window.liveMap.streetLayer;
                window.currentMapType = 'street';
                document.getElementById('liveMapTypeToggle').innerHTML = '🗺️ Switch to Satellite';
            }
        });
        document.getElementById('followLocationCheck').addEventListener('change', (e) => { window.followLocation = e.target.checked; });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'SystemSync-Console/1.0' } })
            .then(response => response.json())
            .then(data => { document.getElementById('liveAddress').innerHTML = `🌍 ${escapeHtml(data.display_name || 'Address not found')}`; })
            .catch(err => { console.error('Geocoding error:', err); document.getElementById('liveAddress').innerHTML = '🌍 Address unavailable'; });
    } else {
        window.liveMarker.setLatLng([lat, lon]);
        window.liveCircle.setLatLng([lat, lon]);
        window.liveCircle.setRadius(acc);
        document.getElementById('liveCoord').innerHTML = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        document.getElementById('liveAccuracy').innerHTML = `🎯 Accuracy: ${acc.toFixed(1)} m`;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'SystemSync-Console/1.0' } })
            .then(response => response.json())
            .then(data => { document.getElementById('liveAddress').innerHTML = `🌍 ${escapeHtml(data.display_name || 'Address not found')}`; })
            .catch(err => { console.error('Geocoding error:', err); document.getElementById('liveAddress').innerHTML = '🌍 Address unavailable'; });
        if (window.followLocation) window.liveMap.setView([lat, lon]);
    }
}

function renderMap(data) {
    const loc = data && data.latitude ? { lat: data.latitude, lon: data.longitude, acc: data.accuracy || 10 } : (data && data.lat ? data : null);
    if (!loc) return;
    window.currentLocation = loc;
    window.panel.innerHTML = `<h3>📍 Device Location</h3><div id="gpsMap" style="height:450px; border-radius:12px; border:1px solid var(--border);"></div><div class="map-info" style="position:relative; top:12px; left:0; max-width:100%; box-shadow:none; border:1px solid var(--border);"><div><strong>📍 GPS Fix</strong></div><div>Coordinates: ${loc.lat.toFixed(6)}, ${loc.lon.toFixed(6)}</div><div>Accuracy: ${loc.acc.toFixed(1)}m</div></div>`;
    setTimeout(() => {
        const map = L.map('gpsMap').setView([loc.lat, loc.lon], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([loc.lat, loc.lon]).addTo(map).bindPopup('Last Known Location').openPopup();
        L.circle([loc.lat, loc.lon], { radius: loc.acc, color: '#0f62fe', fillColor: '#0f62fe', fillOpacity: 0.15 }).addTo(map);
    }, 100);
}

function showGeofencePanel() {
    if (!window.currentLocation) {
        sendCommand('GET_LOCATION');
        window.panel.innerHTML = '<h3>🗺️ Geofence</h3><p>Fetching current location...</p>';
        setTimeout(() => { if (window.currentLocation) showGeofencePanelWithLocation(); else window.panel.innerHTML = '<h3>🗺️ Geofence</h3><p>Unable to get location. Please try GPS Location first.</p><button onclick="sendCommand(\'GET_LOCATION\')">Get Location</button>'; }, 2000);
        return;
    }
    showGeofencePanelWithLocation();
}

function showGeofencePanelWithLocation() {
    const lat = window.currentLocation.lat, lon = window.currentLocation.lon;
    window.panel.innerHTML = `<h3>🗺️ Geofence — Safety Zone</h3><p>Current device location: ${lat.toFixed(6)}, ${lon.toFixed(6)}</p><div id="geofenceMap" style="height:320px;margin-bottom:12px;"></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><input id="gfLat" placeholder="Latitude" value="${lat.toFixed(6)}"><input id="gfLon" placeholder="Longitude" value="${lon.toFixed(6)}"><input id="gfRadius" placeholder="Radius (m)" value="500"></div><div class="geofence-controls"><button id="setFenceBtn" style="background:#1976ff;">📍 Set Fence Here</button><button id="useCurrentBtn" style="background:#4caf50;">📍 Use Current Location</button><button id="clearFenceBtn" style="background:#ff9800;">🗑️ Clear Fence</button><button id="getFenceStatusBtn" style="background:#2196f3;">📊 Status</button></div><div id="fenceStatus"></div>`;
    setTimeout(() => {
        const map = L.map('geofenceMap').setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        let marker = L.marker([lat, lon]).addTo(map).bindPopup('Current Location');
        let circle;
        map.on('click', e => {
            document.getElementById('gfLat').value = e.latlng.lat.toFixed(6);
            document.getElementById('gfLon').value = e.latlng.lng.toFixed(6);
            if (marker) map.removeLayer(marker);
            marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map).bindPopup('Selected Fence Center');
            if (circle) map.removeLayer(circle);
            const r = parseFloat(document.getElementById('gfRadius').value) || 500;
            circle = L.circle([e.latlng.lat, e.latlng.lng], { radius: r, color: '#d32f2f', fillColor: '#d32f2f', fillOpacity: 0.15 }).addTo(map);
        });
        document.getElementById('setFenceBtn').onclick = () => { const lat2 = parseFloat(document.getElementById('gfLat').value); const lon2 = parseFloat(document.getElementById('gfLon').value); const rad = parseFloat(document.getElementById('gfRadius').value) || 500; if (isNaN(lat2) || isNaN(lon2)) return showNotification('Enter valid coordinates'); sendCommand('SET_GEOFENCE', { lat: lat2, lon: lon2, radius: rad }); showNotification('Geofence sent to device'); };
        document.getElementById('useCurrentBtn').onclick = () => { document.getElementById('gfLat').value = lat.toFixed(6); document.getElementById('gfLon').value = lon.toFixed(6); if (marker) map.removeLayer(marker); marker = L.marker([lat, lon]).addTo(map).bindPopup('Current Location'); if (circle) map.removeLayer(circle); circle = L.circle([lat, lon], { radius: parseFloat(document.getElementById('gfRadius').value) || 500, color: '#d32f2f', fillColor: '#d32f2f', fillOpacity: 0.15 }).addTo(map); };
        document.getElementById('clearFenceBtn').onclick = () => sendCommand('CLEAR_GEOFENCE');
        document.getElementById('getFenceStatusBtn').onclick = () => sendCommand('GET_GEOFENCE');
    }, 100);
}

function displayGeofenceInfo(data) {
    const statusDiv = document.getElementById('fenceStatus');
    if (statusDiv && data && data.active) {
        statusDiv.innerHTML = `<div style="margin-top:12px;padding:12px;background:#e8f5e9;border-radius:8px;"><strong>✅ Active Geofence</strong><br>📍 ${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}<br>📏 Radius: ${data.radius}m</div>`;
    } else if (statusDiv) {
        statusDiv.innerHTML = `<div style="margin-top:12px;padding:12px;background:#fff3e0;border-radius:8px;">⚠️ No active geofence</div>`;
    }
}

function showLocationHistoryPanel() {
    window.panel.innerHTML = `<h3>📍 Location History</h3><p>GPS fixes are logged automatically here. Select a timeframe to fetch data.</p><div style="display:flex; gap: 8px; margin-bottom: 24px;"><button class="btn-ui primary" data-days="1">Today</button><button class="btn-ui primary" data-days="3">Last 3 Days</button><button class="btn-ui primary" data-days="5">Last 5 Days</button></div><div id="historyMap" style="height:400px; border-radius:12px; border:1px solid var(--border); display:none; margin-bottom: 24px;"></div><div id="historyMainList"></div>`;
    window.panel.querySelectorAll('button[data-days]').forEach(btn => { btn.onclick = () => { window.panel.querySelector('#historyMainList').innerHTML = '<p>Loading data...</p>'; document.getElementById('historyMap').style.display = 'none'; sendCommand('GET_LOCATION_HISTORY', { days: parseInt(btn.dataset.days) }); }; });
    setTimeout(() => { window._historyMap = L.map('historyMap').setView([20.0, 0.0], 2); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window._historyMap); }, 100);
    sendCommand('GET_LOCATION_HISTORY', { days: 3 });
}

function displayLocationHistory(data) { window.panel.innerHTML = '<p>History loaded (simplified)</p>'; }
