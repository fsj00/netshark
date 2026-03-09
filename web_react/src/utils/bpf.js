/**
 * BPF (Berkeley Packet Filter) 过滤器工具
 * 提供 BPF 过滤表达式的验证和辅助功能
 */

// 支持的协议列表
const SUPPORTED_PROTOCOLS = [
  'ether', 'fddi', 'tr', 'wlan', 'ppp', 'slip', 'arcnet',
  'ip', 'ip6', 'arp', 'rarp', 'tcp', 'udp', 'icmp', 'icmp6',
  'igmp', 'igrp', 'pim', 'ah', 'esp', 'vrrp', 'sctp',
  'http', 'https', 'ftp', 'ssh', 'telnet', 'smtp', 'pop3', 'imap',
  'dns', 'ntp', 'snmp', 'ldap', 'mysql', 'postgres',
];

// 支持的运算符
const OPERATORS = [
  'and', '&&', 'or', '||', 'not', '!',
  '==', '!=', '<', '<=', '>', '>=',
  '+', '-', '*', '/', '&', '|', '^', '~', '<<', '>>',
];

// 支持的修饰符
const MODIFIERS = [
  'host', 'net', 'port', 'portrange',
  'src', 'dst', 'src or dst', 'src and dst',
  'gateway', 'broadcast', 'multicast',
  'proto', 'protochain', 'arp', 'rarp',
  'ip', 'ip6', 'tcp', 'udp', 'icmp',
  'type', 'code', 'id', 'seq',
];

/**
 * 验证 BPF 过滤表达式
 * @param {string} filter - 过滤表达式
 * @returns {Object} 验证结果 { valid: boolean, error?: string }
 */
export const validateFilter = (filter) => {
  if (!filter || filter.trim() === '') {
    return { valid: true };
  }

  const trimmed = filter.trim();
  
  // 检查括号匹配
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, error: '括号不匹配' };
  }

  // 检查引号匹配
  const quotes = (trimmed.match(/"/g) || []).length;
  if (quotes % 2 !== 0) {
    return { valid: false, error: '引号不匹配' };
  }

  // 基本语法检查
  const tokens = tokenize(trimmed);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

    // 检查连续运算符
    if (isOperator(token) && nextToken && isOperator(nextToken)) {
      // 允许 not 后面跟运算符
      if (token.toLowerCase() !== 'not' && token !== '!') {
        return { valid: false, error: `无效的运算符组合: ${token} ${nextToken}` };
      }
    }

    // 检查协议名称
    if (isProtocol(token) && prevToken && isProtocol(prevToken)) {
      return { valid: false, error: `重复的协议: ${token}` };
    }
  }

  return { valid: true };
};

/**
 * 将过滤表达式分割为 token
 * @param {string} filter - 过滤表达式
 * @returns {string[]} token 数组
 */
const tokenize = (filter) => {
  // 保留括号，但分割其他空白
  return filter
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .split(/\s+/)
    .filter(t => t.length > 0);
};

/**
 * 检查是否为运算符
 * @param {string} token - token
 * @returns {boolean}
 */
const isOperator = (token) => {
  return OPERATORS.includes(token.toLowerCase());
};

/**
 * 检查是否为协议
 * @param {string} token - token
 * @returns {boolean}
 */
const isProtocol = (token) => {
  return SUPPORTED_PROTOCOLS.includes(token.toLowerCase());
};

/**
 * 检查是否为修饰符
 * @param {string} token - token
 * @returns {boolean}
 */
const isModifier = (token) => {
  return MODIFIERS.includes(token.toLowerCase());
};

/**
 * 获取常用过滤器建议
 * @returns {Array<{name: string, filter: string, description: string}>}
 */
export const getFilterSuggestions = () => {
  return [
    { name: 'TCP', filter: 'tcp', description: '仅显示 TCP 数据包' },
    { name: 'UDP', filter: 'udp', description: '仅显示 UDP 数据包' },
    { name: 'ICMP', filter: 'icmp', description: '仅显示 ICMP 数据包' },
    { name: 'HTTP', filter: 'http', description: '仅显示 HTTP 流量' },
    { name: 'HTTPS', filter: 'tls', description: '仅显示 HTTPS/TLS 流量' },
    { name: 'DNS', filter: 'dns', description: '仅显示 DNS 查询' },
    { name: 'ARP', filter: 'arp', description: '仅显示 ARP 数据包' },
    { name: '特定 IP', filter: 'ip.addr==192.168.1.1', description: '显示特定 IP 的流量' },
    { name: '源 IP', filter: 'ip.src==192.168.1.1', description: '显示来自特定源的流量' },
    { name: '目标 IP', filter: 'ip.dst==192.168.1.1', description: '显示发往特定目标的流量' },
    { name: '特定端口', filter: 'tcp.port==80', description: '显示特定端口的流量' },
    { name: '端口范围', filter: 'tcp.port>=1000 and tcp.port<=2000', description: '显示端口范围内的流量' },
    { name: '排除协议', filter: '!arp', description: '排除 ARP 数据包' },
    { name: '组合条件', filter: 'tcp and ip.addr==192.168.1.1', description: 'TCP 且特定 IP' },
  ];
};

/**
 * 格式化过滤表达式（添加高亮标记）
 * @param {string} filter - 过滤表达式
 * @returns {Array<{type: string, value: string}>} 带类型的 token 数组
 */
export const highlightFilter = (filter) => {
  if (!filter) return [];
  
  const tokens = tokenize(filter);
  
  return tokens.map(token => {
    const lowerToken = token.toLowerCase();
    
    if (isProtocol(lowerToken)) {
      return { type: 'protocol', value: token };
    }
    if (isModifier(lowerToken)) {
      return { type: 'modifier', value: token };
    }
    if (isOperator(lowerToken)) {
      return { type: 'operator', value: token };
    }
    if (token === '(' || token === ')') {
      return { type: 'paren', value: token };
    }
    if (/^\d/.test(token) || /^[0-9a-fA-F:]+$/.test(token)) {
      return { type: 'value', value: token };
    }
    
    return { type: 'text', value: token };
  });
};

/**
 * 构建简单的过滤表达式
 * @param {Object} criteria - 过滤条件
 * @param {string} criteria.protocol - 协议
 * @param {string} criteria.srcHost - 源主机
 * @param {string} criteria.dstHost - 目标主机
 * @param {number} criteria.port - 端口
 * @returns {string} 过滤表达式
 */
export const buildFilter = (criteria) => {
  const parts = [];
  
  if (criteria.protocol) {
    parts.push(criteria.protocol.toLowerCase());
  }
  
  if (criteria.srcHost) {
    parts.push(`ip.src==${criteria.srcHost}`);
  }
  
  if (criteria.dstHost) {
    parts.push(`ip.dst==${criteria.dstHost}`);
  }
  
  if (criteria.port) {
    parts.push(`tcp.port==${criteria.port}`);
  }
  
  return parts.join(' and ');
};

/**
 * 解析过滤表达式为条件对象
 * @param {string} filter - 过滤表达式
 * @returns {Object} 过滤条件
 */
export const parseFilter = (filter) => {
  const criteria = {
    protocol: null,
    srcHost: null,
    dstHost: null,
    port: null,
  };
  
  if (!filter) return criteria;
  
  // 简单的正则匹配
  const protocolMatch = filter.match(/\b(tcp|udp|icmp|http|dns|arp)\b/i);
  if (protocolMatch) {
    criteria.protocol = protocolMatch[1].toLowerCase();
  }
  
  const srcMatch = filter.match(/ip\.src==([^\s]+)/i);
  if (srcMatch) {
    criteria.srcHost = srcMatch[1];
  }
  
  const dstMatch = filter.match(/ip\.dst==([^\s]+)/i);
  if (dstMatch) {
    criteria.dstHost = dstMatch[1];
  }
  
  const portMatch = filter.match(/(?:tcp|udp)\.port==(\d+)/i);
  if (portMatch) {
    criteria.port = parseInt(portMatch[1], 10);
  }
  
  return criteria;
};
