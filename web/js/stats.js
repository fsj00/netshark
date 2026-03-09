// 统计分析功能

document.addEventListener('DOMContentLoaded', () => {
    initStatsView();
});

function initStatsView() {
    // 返回按钮
    document.getElementById('back-to-packets').addEventListener('click', () => {
        switchView('packets');
    });
}

// 加载统计数据
async function loadStats() {
    if (!AppState.currentSession) {
        return;
    }
    
    updateStatus('加载统计数据...');
    
    try {
        // 并行加载基本统计和协议统计
        const [basicStats, protocols] = await Promise.all([
            apiRequest(`/sessions/${AppState.currentSession}/stats`),
            apiRequest(`/sessions/${AppState.currentSession}/protocols`)
        ]);
        
        renderBasicStats(basicStats);
        renderProtocolStats(protocols.protocols || []);
        
        updateStatus('统计数据已加载');
        
    } catch (error) {
        showError(`加载统计失败: ${error.message}`);
    }
}

// 渲染基本统计
function renderBasicStats(stats) {
    const container = document.getElementById('basic-stats');
    
    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">总数据包数</span>
            <span class="stat-value">${stats.total_packets.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">总字节数</span>
            <span class="stat-value">${formatFileSize(stats.total_bytes)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">捕获时长</span>
            <span class="stat-value">${stats.duration.toFixed(3)} 秒</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">平均包大小</span>
            <span class="stat-value">${stats.total_packets > 0 ? formatFileSize(Math.floor(stats.total_bytes / stats.total_packets)) : '0 B'}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">包速率</span>
            <span class="stat-value">${stats.duration > 0 ? (stats.total_packets / stats.duration).toFixed(2) : 0} pps</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">比特率</span>
            <span class="stat-value">${stats.duration > 0 ? formatBitrate((stats.total_bytes * 8) / stats.duration) : '0 bps'}</span>
        </div>
    `;
}

// 渲染协议统计
function renderProtocolStats(protocols) {
    const container = document.getElementById('protocol-stats');
    
    if (protocols.length === 0) {
        container.innerHTML = '<div class="empty-state">无协议数据</div>';
        return;
    }
    
    // 按数量排序
    protocols.sort((a, b) => b.count - a.count);
    
    // 计算总数用于百分比
    const total = protocols.reduce((sum, p) => sum + p.count, 0);
    
    container.innerHTML = protocols.map(p => {
        const percentage = total > 0 ? (p.count / total * 100).toFixed(1) : 0;
        return `
            <div class="protocol-bar">
                <span class="protocol-name">${escapeHtml(p.protocol)}</span>
                <div class="protocol-progress">
                    <div class="protocol-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="protocol-count">${p.count.toLocaleString()}</span>
            </div>
        `;
    }).join('');
}

// 格式化比特率
function formatBitrate(bps) {
    if (bps === 0) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bps) / Math.log(k));
    return parseFloat((bps / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
