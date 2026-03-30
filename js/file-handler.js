// ==================== FILE MANAGER MODULE ====================
function renderFiles() {
    let html = `
        <div class="file-manager">
            <div class="file-toolbar-sticky">
                <div class="file-toolbar">
                    <button onclick="navigateUp()">⬆ Up</button>
                    <span class="file-path">${escapeHtml(currentPath)}</span>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="downloadSelected()" style="flex:1; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            ⬇️ <span id="downloadCount">${selectedFiles.length}</span>
                        </button>
                        <button onclick="deleteSelected()" style="flex:1; background: #d32f2f; color: white; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            🗑️ <span id="deleteCount">${selectedFiles.length}</span>
                        </button>
                    </div>
                </div>
            </div>
    `;

    if (!currentData || currentData.length === 0) {
        html += '<p style="padding:20px;">No files found.</p>';
    } else {
        const folders = currentData.filter(item => item.isDir);
        const files = currentData.filter(item => !item.isDir);
        selectedFiles = [];

        html += `
            <div class="file-panes">
                <div class="folder-pane">
                    <div class="pane-title">Folders</div>
                    <div id="folderList">
        `;

        folders.forEach(f => {
            html += `
                <div class="folder-item" onclick="handleFolderClick('${escapeHtml(f.path)}')">
                    <span class="folder-icon">📁</span>
                    <span class="folder-name">${escapeHtml(f.name)}</span>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                <div class="file-pane">
                    <div class="pane-title">Files</div>
                    <div id="fileList">
        `;

        files.forEach(f => {
            const path = f.path;
            const name = f.name;
            const size = formatBytes(f.size);
            html += `
                <div class="file-item">
                    <input type="checkbox" class="file-checkbox" data-path="${escapeHtml(path)}" onchange="updateSelected(this)">
                    <span class="file-icon">📄</span>
                    <span class="file-name">${escapeHtml(name)}</span>
                    <span class="file-size">${size}</span>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    panel.innerHTML = html;
}
