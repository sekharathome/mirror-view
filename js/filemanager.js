// ==================== FILE MANAGER ====================
function renderFileTreeNodes(data, path) {
    const folders = data.filter(i => i.isDir).sort((a, b) => a.name.localeCompare(b.name));
    const files = data.filter(i => !i.isDir).sort((a, b) => a.name.localeCompare(b.name));
    let html = '';
    folders.forEach(f => {
        const encPath = btoa(encodeURIComponent(f.path)).replace(/=/g, '');
        html += `<li><div class="folder-header" data-path="${escapeHtml(f.path)}"><span class="chevron">▶</span><span class="folder-icon">📁</span><span class="item-name">${escapeHtml(f.name)}</span></div><div class="tree-children" id="tree-container-${encPath}"><ul class="tree-children-inner" id="tree-inner-${encPath}"></ul></div></li>`;
    });
    files.forEach(f => {
        html += `<li><div class="file-row"><input type="checkbox" class="file-checkbox" data-path="${escapeHtml(f.path)}" onchange="updateSelected(this)"><span class="file-icon">📄</span><span class="item-name">${escapeHtml(f.name)}</span><span class="file-size">${formatBytes(f.size)}</span><div class="file-actions"><button class="file-action-btn dl" data-path="${escapeHtml(f.path)}">⬇️</button><button class="file-action-btn del" data-path="${escapeHtml(f.path)}">🗑️</button></div></div></li>`;
    });
    if (folders.length === 0 && files.length === 0) html += `<li style="padding:10px 20px; color:#999; font-size:12px;">Empty folder</li>`;
    return html;
}

function renderFiles() {
    let html = `<div class="file-manager"><div class="file-toolbar-sticky"><div class="file-toolbar"><button onclick="navigateUp()">⬆ Up</button><div style="display: flex; gap: 8px; margin-left: auto;"><button onclick="downloadSelected()" style="flex:1; display: flex; align-items: center; justify-content: center; gap: 4px;">⬇️ <span id="downloadCount">${window.selectedFiles.length}</span></button><button onclick="deleteSelected()" style="flex:1; background: #d32f2f; color: white; display: flex; align-items: center; justify-content: center; gap: 4px;">🗑️ <span id="deleteCount">${window.selectedFiles.length}</span></button></div></div></div><div class="tree-content"><ul class="tree-root" id="tree-root-container">`;
    if (window.currentData && window.currentData.length) {
        const sortedData = [...window.currentData];
        const folders = sortedData.filter(i => i.isDir).sort((a, b) => a.name.localeCompare(b.name));
        const files = sortedData.filter(i => !i.isDir).sort((a, b) => a.name.localeCompare(b.name));
        const allSorted = [...folders, ...files];
        html += renderFileTreeNodes(allSorted, 'root');
    } else {
        html += '<li style="padding:10px; color:#999;">No files or root not loaded yet.</li>';
    }
    html += `</ul></div></div>`;
    window.panel.innerHTML = html;
    attachFileEventListeners();
}

function attachFileEventListeners(container = document) {
    container.querySelectorAll('.folder-header').forEach(header => {
        header.onclick = (e) => folderClickHandler(e);
    });
    container.querySelectorAll('.file-action-btn.dl').forEach(btn => {
        btn.onclick = (e) => downloadClickHandler(e);
    });
    container.querySelectorAll('.file-action-btn.del').forEach(btn => {
        btn.onclick = (e) => deleteClickHandler(e);
    });
    container.querySelectorAll('.file-checkbox').forEach(cb => {
        cb.onchange = (e) => updateSelected(e.target);
    });
}

function folderClickHandler(e) {
    e.stopPropagation();
    const header = e.currentTarget;
    const path = header.getAttribute('data-path');
    const encPath = btoa(encodeURIComponent(path)).replace(/=/g, '');
    const container = document.getElementById('tree-container-' + encPath);
    const inner = document.getElementById('tree-inner-' + encPath);
    const chevron = header.querySelector('.chevron');
    if (!container) return;
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        if (chevron) chevron.classList.remove('down');
    } else {
        container.classList.add('expanded');
        if (chevron) chevron.classList.add('down');
        if (inner.innerHTML.trim() === '' || inner.querySelector('li[data-loading]')) {
            inner.innerHTML = '<li data-loading="1" style="padding:10px 20px; color:#999; font-size:12px;">⏳ Loading...</li>';
            window.currentPath = path;
            window.pendingFolderLoad = { path, encPath, inner };
            sendCommand('LIST_FILES', { path: path });
        }
    }
}

function downloadClickHandler(e) {
    e.stopPropagation();
    const path = e.currentTarget.getAttribute('data-path');
    if (path) { sendPlainText('dl ' + path); showNotification(`Download requested: ${path.split('/').pop()}`); }
}

function deleteClickHandler(e) {
    e.stopPropagation();
    const path = e.currentTarget.getAttribute('data-path');
    if (path && confirm(`Delete file: ${path.split('/').pop()}?`)) sendCommand('DELETE_FILE', { path: path });
}

window.refreshFileRoot = function() { sendCommand('LIST_FILES', { path: 'root' }); window.panel.innerHTML = '<p style="color:var(--text-sec); padding:16px;">⏳ Fetching files from device...</p>'; };
function navigateUp() { if (window.currentPath === 'root' || window.currentPath === '') return; let parts = window.currentPath.split('/'); parts.pop(); let parent = parts.join('/'); if (parent === '') parent = 'root'; window.currentPath = parent; sendCommand('LIST_FILES', { path: parent }); }
function downloadSelected() { if (window.selectedFiles.length === 0) { alert('No files selected'); return; } window.selectedFiles.forEach(path => sendPlainText('dl ' + path)); }
function deleteSelected() { if (window.selectedFiles.length === 0) { alert('No files selected'); return; } if (!confirm(`Delete ${window.selectedFiles.length} file(s)?`)) return; window.selectedFiles.forEach(path => sendCommand('DELETE_FILE', { path: path })); window.selectedFiles = []; updateCounters(); }
function updateSelected(checkbox) { const path = checkbox.dataset.path; if (checkbox.checked) { if (!window.selectedFiles.includes(path)) window.selectedFiles.push(path); } else { window.selectedFiles = window.selectedFiles.filter(p => p !== path); } updateCounters(); }
function updateCounters() { const count = window.selectedFiles.length; const downloadSpan = document.getElementById('downloadCount'); const deleteSpan = document.getElementById('deleteCount'); if (downloadSpan) downloadSpan.innerText = count; if (deleteSpan) deleteSpan.innerText = count; }
