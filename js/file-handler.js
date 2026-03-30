// ==================== TREE-VIEW FILE MANAGER MODULE ====================

/**
 * Renders the file manager using a recursive tree-view structure.
 * This replaces the previous folder-pane/file-pane split.
 */
function renderFiles() {
    const panel = document.getElementById('main-panel'); // Assuming this is your target container
    
    let html = `
        <div class="file-manager tree-view-container">
            <div class="file-toolbar-sticky">
                <div class="file-toolbar">
                    <button onclick="navigateUp()">⬆ Back to Root</button>
                    <span class="file-path">${escapeHtml(currentPath)}</span>
                    <div class="toolbar-actions">
                        <button onclick="downloadSelected()" class="btn-download">
                            ⬇️ <span id="downloadCount">${selectedFiles.length}</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="tree-content">
    `;

    if (!currentData || currentData.length === 0) {
        html += '<p class="empty-msg">No files or folders found in this directory.</p>';
    } else {
        // Reset selection on re-render
        selectedFiles = [];
        
        // Start the root list
        html += '<ul class="tree-root">';
        
        // 1. Render Folders first (Collapsible)
        const folders = currentData.filter(item => item.isDir);
        folders.forEach(f => {
            html += `
                <li class="tree-item folder-item">
                    <div class="folder-header" onclick="handleFolderClick('${escapeHtml(f.path)}', this)">
                        <span class="folder-icon">📁</span>
                        <span class="item-name">${escapeHtml(f.name)}</span>
                    </div>
                    <ul class="nested-tree" id="nested-${btoa(f.path).replace(/=/g, '')}"></ul>
                </li>
            `;
        });

        // 2. Render Files
        const files = currentData.filter(item => !item.isDir);
        files.forEach(f => {
            const extension = f.name.split('.').pop().toLowerCase();
            const icon = getFileIcon(extension);
            
            html += `
                <li class="tree-item file-item">
                    <div class="file-row">
                        <input type="checkbox" class="file-checkbox" data-path="${escapeHtml(f.path)}" onchange="updateSelected(this)">
                        <span class="file-icon">${icon}</span>
                        <span class="item-name">${escapeHtml(f.name)}</span>
                        <span class="file-size">${formatBytes(f.size)}</span>
                    </div>
                </li>
            `;
        });

        html += '</ul>';
    }

    html += '</div></div>';
    panel.innerHTML = html;
}

/**
 * Helper to get icons based on file type
 */
function getFileIcon(ext) {
    switch(ext) {
        case 'pdf': return '📕';
        case 'kml': return '🌍';
        case 'xlsx': case 'xls': return '📊';
        case 'jpg': case 'png': return '🖼️';
        case 'mp4': return '🎬';
        default: return '📄';
    }
}

/**
 * Updated Folder Click: Toggles the "Open" state and triggers your data fetch
 */
function handleFolderClick(path, element) {
    // Toggle the visual "Open" folder icon
    const icon = element.querySelector('.folder-icon');
    if (icon.innerText === '📁') {
        icon.innerText = '📂';
    } else {
        icon.innerText = '📁';
    }

    // Call your existing navigation logic to fetch new data for this path
    // In your existing setup, this likely triggers a WebSocket 'LIST_FILES' command
    if (typeof navigateToPath === "function") {
        navigateToPath(path); 
    } else {
        // Fallback to your global path update
        currentPath = path;
        sendCommand('LIST_FILES', { path: path });
    }
}
