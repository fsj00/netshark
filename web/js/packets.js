// 数据包列表功能

document.addEventListener('DOMContentLoaded', () => {
    initPacketsView();
});

function initPacketsView() {
    // 返回按钮
    document.getElementById('back-to-files').addEventListener('click', () => {
        switchView('files');
    });
    
    // 过滤器
    document.getElementById('apply-filter').addEventListener('click', applyFilter);
    document.getElementById('clear-filter').addEventListener('click', clearFilter);
    document.getElementById('filter-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    
    // 分页按钮
    document.getElementById('prev-page').addEventListener('click', () => {
        if (AppState.currentOffset >= AppState.pageSize) {
            AppState.currentOffset -= AppState.pageSize;
            loadPackets();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (AppState.currentOffset + AppState.pageSize < AppState.totalPackets) {
            AppState.currentOffset += AppState.pageSize;
            loadPackets();
        }
    });
    
    // 统计按钮
    document.getElementById('view-stats').addEventListener('click', () => {
        switchView('stats');
        loadStats();
    });
    
    // 关闭详情
    document.getElementById('close-detail').addEventListener('click', closePacketDetail);
}

// 加载数据包列表
async function loadPackets() {
    if (!AppState.currentSession) {
        return;
    }
    
    updateStatus('加载数据包...');
    
    try {
        const url = `/sessions/${AppState.currentSession}/packets?offset=${AppState.currentOffset}&limit=${AppState.pageSize}&filter=${encodeURIComponent(AppState.currentFilter)}`;
        const data = await apiRequest(url);
        
        AppState.packets = data.packets;
        AppState.totalPackets = data.total;
        
        renderPacketsList(data.packets);
        updatePagination();
        updateStatus(`已加载 ${data.packets.length} 个数据包`);
        
    } catch (error) {
        showError(`加载数据包失败: ${error.message}`);
    }
}

// 渲染数据包列表
function renderPacketsList(packets) {
    const container = document.getElementById('packets-list');
    
    if (packets.length === 0) {
        container.innerHTML = '<div class="empty-state">没有数据包</div>';
        return;
    }
    
    container.innerHTML = packets.map(packet => `
        <div class="packet-row" data-num="${packet.num}" onclick="selectPacket(${packet.num})">
            <span class="col-num">${packet.num}</span>
            <span class="col-time">${packet.time}</span>
            <span class="col-src">${escapeHtml(packet.src)}</span>
            <span class="col-dst">${escapeHtml(packet.dst)}</span>
            <span class="col-proto">${escapeHtml(packet.protocol)}</span>
            <span class="col-len">${packet.length}</span>
            <span class="col-info" title="${escapeHtml(packet.info)}">${escapeHtml(packet.info)}</span>
        </div>
    `).join('');
}

// 选择数据包
async function selectPacket(num) {
    // 更新选中状态
    document.querySelectorAll('.packet-row').forEach(row => {
        row.classList.remove('selected');
    });
    
    const selectedRow = document.querySelector(`.packet-row[data-num="${num}"]`);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
    
    AppState.selectedPacket = num;
    
    // 显示详情面板
    document.querySelector('.packets-section').classList.add('has-detail');
    document.getElementById('packet-detail').style.display = 'flex';
    
    // 加载详情
    await loadPacketDetail(num);
}

// 关闭数据包详情
function closePacketDetail() {
    document.querySelector('.packets-section').classList.remove('has-detail');
    document.getElementById('packet-detail').style.display = 'none';
    AppState.selectedPacket = null;
    
    document.querySelectorAll('.packet-row').forEach(row => {
        row.classList.remove('selected');
    });
}

// 更新分页信息
function updatePagination() {
    const currentPage = Math.floor(AppState.currentOffset / AppState.pageSize) + 1;
    const totalPages = Math.ceil(AppState.totalPackets / AppState.pageSize) || 1;
    
    document.getElementById('page-info').textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    document.getElementById('total-info').textContent = `共 ${AppState.totalPackets} 条`;
    
    document.getElementById('prev-page').disabled = AppState.currentOffset === 0;
    document.getElementById('next-page').disabled = AppState.currentOffset + AppState.pageSize >= AppState.totalPackets;
}

// 应用过滤器
function applyFilter() {
    const filter = document.getElementById('filter-input').value.trim();
    AppState.currentFilter = filter;
    AppState.currentOffset = 0;
    loadPackets();
}

// 清除过滤器
function clearFilter() {
    document.getElementById('filter-input').value = '';
    AppState.currentFilter = '';
    AppState.currentOffset = 0;
    loadPackets();
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
