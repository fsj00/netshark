// 文件上传功能

document.addEventListener('DOMContentLoaded', () => {
    initUpload();
});

function initUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    // 点击上传
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadFile(file);
        }
    });
    
    // 拖拽上传
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    });
}

// 上传文件
async function uploadFile(file) {
    // 验证文件类型
    const validExtensions = ['.pcap', '.pcapng', '.cap'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
        showError('不支持的文件格式，请上传PCAP文件');
        return;
    }
    
    // 验证文件大小 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('文件大小超过100MB限制');
        return;
    }
    
    // 显示进度
    showUploadProgress(true);
    updateStatus(`正在上传: ${file.name}`);
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.message);
        }
        
        showUploadProgress(false);
        showSuccess(`文件上传成功: ${file.name}`);
        
        // 自动创建会话并打开分析
        await createSessionAndAnalyze(data.data.file_id, file.name);
        
    } catch (error) {
        showUploadProgress(false);
        showError(`上传失败: ${error.message}`);
    }
}

// 显示/隐藏上传进度
function showUploadProgress(show) {
    const dropZoneContent = document.querySelector('.drop-zone-content');
    const uploadProgress = document.querySelector('.upload-progress');
    
    if (show) {
        dropZoneContent.style.display = 'none';
        uploadProgress.style.display = 'block';
    } else {
        dropZoneContent.style.display = 'flex';
        uploadProgress.style.display = 'none';
    }
}

// 创建会话并开始分析
async function createSessionAndAnalyze(fileId, filename) {
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
