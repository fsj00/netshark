/**
 * 格式化工具函数
 * 提供各种数据格式化功能
 */

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小（如：1.5 MB）
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === undefined || bytes === null) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i === 0) return `${bytes} B`;
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化比特率
 * @param {number} bps - 比特每秒
 * @returns {string} 格式化后的比特率（如：100 Mbps）
 */
export const formatBitrate = (bps) => {
  if (!bps || bps === 0) return '0 bps';
  
  const k = 1000;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  
  return parseFloat((bps / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期时间
 * @param {string|number|Date} date - 日期对象或时间戳
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date, options = {}) => {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const {
    includeTime = true,
    includeSeconds = false,
    locale = 'zh-CN',
  } = options;
  
  const dateOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  };
  
  const dateStr = d.toLocaleDateString(locale, dateOptions);
  
  if (!includeTime) return dateStr;
  
  const timeStr = d.toLocaleTimeString(locale, timeOptions);
  return `${dateStr} ${timeStr}`;
};

/**
 * 格式化时间戳（相对时间）
 * @param {number} timestamp - 时间戳（秒或毫秒）
 * @returns {string} 相对时间描述
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '-';
  
  // 自动检测秒或毫秒
  const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diff = now - ts;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  
  return formatDateTime(ts, { includeTime: false });
};

/**
 * 格式化持续时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的持续时间
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(2)} ms`;
  }
  
  if (seconds < 60) {
    return `${seconds.toFixed(3)} s`;
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins < 60) {
    return `${mins}m ${secs.toFixed(0)}s`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  return `${hours}h ${remainingMins}m`;
};

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('zh-CN');
};

/**
 * 格式化协议名称（大写）
 * @param {string} protocol - 协议名称
 * @returns {string} 格式化后的协议名
 */
export const formatProtocol = (protocol) => {
  if (!protocol) return 'UNKNOWN';
  return protocol.toUpperCase();
};

/**
 * 格式化 IP 地址（处理 IPv6）
 * @param {string} ip - IP 地址
 * @returns {string} 格式化后的 IP 地址
 */
export const formatIPAddress = (ip) => {
  if (!ip) return '-';
  
  // 如果是 IPv6 的 IPv4 映射地址，提取 IPv4 部分
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
};

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀（默认...）
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * HTML 转义
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * 格式化十六进制字符串（添加空格）
 * @param {string} hex - 十六进制字符串
 * @param {number} groupSize - 每组字节数
 * @returns {string} 格式化后的十六进制字符串
 */
export const formatHexString = (hex, groupSize = 2) => {
  if (!hex) return '';
  
  const cleanHex = hex.replace(/\s/g, '');
  const groups = [];
  
  for (let i = 0; i < cleanHex.length; i += groupSize * 2) {
    groups.push(cleanHex.substring(i, i + groupSize * 2));
  }
  
  return groups.join(' ');
};
