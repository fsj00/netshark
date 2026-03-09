// NetShark 主应用

// 全局状态
const AppState = {
    currentView: 'upload',
    currentSession: null,
    currentFile: null,
    packets: [],
    totalPackets: 0,
    currentOffset: 0,
    pageSize: 100,
    currentFilter: '',
    selectedPacket: null
};

// API 基础URL
const API_BASE = '/api/v1';

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateStatus('就绪');
});

// 初始化导航
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

// 切换视图
function switchView(viewName) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // 隐藏所有视图
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // 显示目标视图
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    AppState.currentView = viewName;
    
    // 视图特定的初始化
    if (viewName === 'files') {
        loadFilesList();
    }
}

// 显示数据包视图
function showPacketsView(sessionId, filename) {
    AppState.currentSession = sessionId;
    AppState.currentFile = filename;
    AppState.currentOffset = 0;
    AppState.packets = [];
    
    document.getElementById('current-file').textContent = filename;
    document.getElementById('nav-packets').style.display = 'inline-block';
    
    switchView('packets');
    loadPackets();
}

// 更新状态栏
function updateStatus(text) {
    document.getElementById('status-text').textContent = text;
}

// 显示错误消息
function showError(message) {
    updateStatus(`错误: ${message}`);
    console.error(message);
}

// 显示成功消息
function showSuccess(message) {
    updateStatus(message);
    setTimeout(() => updateStatus('就绪'), 3000);
}

// API 请求辅助函数
async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    });
    
    const data = await response.json();
    
    if (data.code !== 0) {
        throw new Error(data.message || '请求失败');
    }
    
    return data.data;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}
