// 文件列表功能

document.addEventListener('DOMContentLoaded', () => {
    initFilesView();
});

function initFilesView() {
    // 刷新按钮
    document.getElementById('refresh-files').addEventListener('click', loadFilesList);
}

// 加载文件列表
async function loadFilesList() {
    const container = document.getElementById('files-list');
    container.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const files = await apiRequest('/files');
        renderFilesList(files);
    } catch (error) {
        container.innerHTML = `<div class="error-message">加载失败: ${error.message}</div>`;
    }
}

// 渲染文件列表
function renderFilesList(files) {
    const container = document.getElementById('files-list');
    
    if (files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>暂无文件</p>
                <button class="btn btn-primary" onclick="switchView('upload')">上传文件</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="file-item">
            <div class="file-icon">📄</div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(file.filename)}</div>
                <div class="file-meta">
                    ${formatFileSize(file.size)} · 
                    ${formatDate(file.created_at)} · 
                    ID: ${file.file_id}
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-primary" onclick="analyzeFile('${file.file_id}', '${escapeHtml(file.filename)}')">
                    分析
                </button>
            </div>
        </div>
    `).join('');
}

// 分析文件
async function analyzeFile(fileId, filename) {
    try {
        updateStatus('正在创建分析会话...');
        
        const session = await apiRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify({ file_id: fileId })
        });
        
        showSuccess('分析会话已创建');
        showPacketsView(session.session_id, filename);
        
    } catch (error) {
        showError(`创建会话失败: ${error.message}`);
    }
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
