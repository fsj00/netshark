// 数据包详情功能

// 加载数据包详情
async function loadPacketDetail(num) {
    if (!AppState.currentSession) {
        return;
    }
    
    updateStatus(`加载数据包 #${num} 详情...`);
    
    try {
        const data = await apiRequest(`/sessions/${AppState.currentSession}/packets/${num}`);
        
        renderProtocolTree(data.tree || []);
        renderHexView(data.hex_data || '');
        
        updateStatus(`数据包 #${num} 详情已加载`);
        
    } catch (error) {
        showError(`加载详情失败: ${error.message}`);
    }
}

// 渲染协议树
function renderProtocolTree(tree) {
    const container = document.getElementById('proto-tree');
    
    if (tree.length === 0) {
        container.innerHTML = '<div class="empty-state">无协议信息</div>';
        return;
    }
    
    container.innerHTML = tree.map(node => renderTreeNode(node)).join('');
    
    // 添加折叠/展开事件
    container.querySelectorAll('.tree-node-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const node = header.parentElement;
            const children = node.querySelector(':scope > .tree-children');
            const toggle = header.querySelector('.tree-toggle');
            
            if (children) {
                children.classList.toggle('collapsed');
                toggle.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    });
}

// 渲染单个树节点
function renderTreeNode(node, level = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const toggleIcon = hasChildren ? '▼' : '';
    
    let html = '<div class="tree-node">';
    html += '<div class="tree-node-header">';
    html += `<span class="tree-toggle">${toggleIcon}</span>`;
    html += `<span class="tree-label">${escapeHtml(node.label)}</span>`;
    
    if (node.value) {
        html += `<span class="tree-value">${escapeHtml(node.value)}</span>`;
    }
    
    html += '</div>';
    
    if (hasChildren) {
        html += '<div class="tree-children">';
        html += node.children.map(child => renderTreeNode(child, level + 1)).join('');
        html += '</div>';
    }
    
    html += '</div>';
    
    return html;
}

// 渲染十六进制视图
function renderHexView(hexData) {
    const container = document.getElementById('hex-view');
    
    if (!hexData) {
        container.innerHTML = '<div class="empty-state">无十六进制数据</div>';
        return;
    }
    
    // 将十六进制字符串转换为字节数组
    const bytes = hexData.match(/.{1,2}/g) || [];
    
    // 每行显示16个字节
    const bytesPerLine = 16;
    const lines = [];
    
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const lineBytes = bytes.slice(i, i + bytesPerLine);
        const offset = i.toString(16).padStart(8, '0');
        
        // 十六进制部分
        const hexPart = lineBytes.map(b => b.toUpperCase()).join(' ');
        const hexPadding = ' '.repeat((bytesPerLine - lineBytes.length) * 3);
        
        // ASCII部分
        const asciiPart = lineBytes.map(b => {
            const code = parseInt(b, 16);
            return (code >= 32 && code < 127) ? String.fromCharCode(code) : '.';
        }).join('');
        
        lines.push(`
            <div class="hex-line">
                <span class="hex-offset">${offset}</span>
                <span class="hex-bytes">${hexPart}${hexPadding}</span>
                <span class="hex-ascii">${escapeHtml(asciiPart)}</span>
            </div>
        `);
    }
    
    container.innerHTML = lines.join('');
}

// 标签切换
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // 更新按钮状态
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });
});

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
