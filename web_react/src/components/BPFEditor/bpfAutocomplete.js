/**
 * BPF Autocomplete
 * BPF 过滤器自动补全配置
 */

import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { bpfTokens } from './bpfLanguage';

/**
 * 创建自动补全源
 * @returns {Function} 自动补全函数
 */
export const createBPFAutocomplete = () => {
  const { protocols, modifiers, operators, comparators, fields } = bpfTokens;
  
  // 构建补全项
  const completions = [
    // 协议
    ...protocols.map(p => ({
      label: p,
      type: 'keyword',
      detail: '协议',
      info: `过滤 ${p.toUpperCase()} 协议的数据包`,
    })),
    
    // 修饰符
    ...modifiers.map(m => ({
      label: m,
      type: 'modifier',
      detail: '修饰符',
      info: `指定 ${m} 条件`,
    })),
    
    // 运算符
    ...operators.map(o => ({
      label: o,
      type: 'operator',
      detail: '逻辑运算符',
      info: o === '&&' || o === 'and' ? '逻辑与' : 
            o === '||' || o === 'or' ? '逻辑或' : '逻辑非',
    })),
    
    // 比较运算符
    ...comparators.map(c => ({
      label: c,
      type: 'operator',
      detail: '比较运算符',
      info: getComparatorDescription(c),
    })),
    
    // 常用组合
    { label: 'host', type: 'function', detail: '主机', info: '过滤特定主机的流量' },
    { label: 'port', type: 'function', detail: '端口', info: '过滤特定端口的流量' },
    { label: 'net', type: 'function', detail: '网络', info: '过滤特定网络的流量' },
    { label: 'src host', type: 'function', detail: '源主机', info: '过滤来自特定主机的流量' },
    { label: 'dst host', type: 'function', detail: '目标主机', info: '过滤发往特定主机的流量' },
    { label: 'src port', type: 'function', detail: '源端口', info: '过滤来自特定端口的流量' },
    { label: 'dst port', type: 'function', detail: '目标端口', info: '过滤发往特定端口的流量' },
    
    // 协议字段
    { label: 'ip.addr', type: 'property', detail: 'IP地址', info: '匹配源或目标IP地址' },
    { label: 'ip.src', type: 'property', detail: '源IP', info: '匹配源IP地址' },
    { label: 'ip.dst', type: 'property', detail: '目标IP', info: '匹配目标IP地址' },
    { label: 'tcp.port', type: 'property', detail: 'TCP端口', info: '匹配TCP端口' },
    { label: 'tcp.srcport', type: 'property', detail: 'TCP源端口', info: '匹配TCP源端口' },
    { label: 'tcp.dstport', type: 'property', detail: 'TCP目标端口', info: '匹配TCP目标端口' },
    { label: 'udp.port', type: 'property', detail: 'UDP端口', info: '匹配UDP端口' },
    { label: 'udp.srcport', type: 'property', detail: 'UDP源端口', info: '匹配UDP源端口' },
    { label: 'udp.dstport', type: 'property', detail: 'UDP目标端口', info: '匹配UDP目标端口' },
  ];
  
  /**
   * 获取比较运算符描述
   */
  function getComparatorDescription(c) {
    const descriptions = {
      '==': '等于',
      '!=': '不等于',
      '<': '小于',
      '<=': '小于等于',
      '>': '大于',
      '>=': '大于等于',
    };
    return descriptions[c] || c;
  }
  
  /**
   * 自动补全函数
   */
  return (context) => {
    const word = context.matchBefore(/[\w.]*/);
    
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }
    
    const text = word.text.toLowerCase();
    
    // 过滤匹配的补全项
    const filtered = completions.filter(item => {
      const label = item.label.toLowerCase();
      return label.includes(text) || text.includes(label);
    });
    
    // 按相关性排序
    filtered.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aStartsWith = aLabel.startsWith(text);
      const bStartsWith = bLabel.startsWith(text);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return aLabel.localeCompare(bLabel);
    });
    
    return {
      from: word.from,
      options: filtered.slice(0, 20), // 限制显示数量
      validFor: /[\w.]*$/,
    };
  };
};

/**
 * 创建 BPF 自动补全扩展
 * @returns {Extension}
 */
export const bpfAutocomplete = () => {
  return autocompletion({
    override: [createBPFAutocomplete()],
    defaultKeymap: true,
    maxRenderedOptions: 20,
    optionClass: (option) => `cm-completion-${option.type}`,
    icons: false,
    addToOptions: [
      {
        render: (completion) => {
          const el = document.createElement('span');
          el.className = 'cm-completion-detail';
          el.textContent = completion.detail || '';
          el.style.cssText = `
            margin-left: 8px;
            color: #888;
            font-size: 0.85em;
          `;
          return el;
        },
        position: 20,
      },
    ],
  });
};

/**
 * 常用过滤器片段
 */
export const bpfSnippets = [
  {
    label: 'tcp-only',
    displayLabel: '仅 TCP',
    template: 'tcp',
    description: '仅显示 TCP 数据包',
  },
  {
    label: 'udp-only',
    displayLabel: '仅 UDP',
    template: 'udp',
    description: '仅显示 UDP 数据包',
  },
  {
    label: 'http-only',
    displayLabel: '仅 HTTP',
    template: 'http',
    description: '仅显示 HTTP 流量',
  },
  {
    label: 'host-filter',
    displayLabel: '特定主机',
    template: 'host ${ip}',
    description: '过滤特定主机的流量',
    placeholders: { ip: '192.168.1.1' },
  },
  {
    label: 'port-filter',
    displayLabel: '特定端口',
    template: 'port ${port}',
    description: '过滤特定端口的流量',
    placeholders: { port: '80' },
  },
  {
    label: 'src-host',
    displayLabel: '源主机',
    template: 'src host ${ip}',
    description: '过滤来自特定主机的流量',
    placeholders: { ip: '192.168.1.1' },
  },
  {
    label: 'dst-host',
    displayLabel: '目标主机',
    template: 'dst host ${ip}',
    description: '过滤发往特定主机的流量',
    placeholders: { ip: '192.168.1.1' },
  },
  {
    label: 'tcp-port',
    displayLabel: 'TCP 端口',
    template: 'tcp port ${port}',
    description: '过滤特定 TCP 端口的流量',
    placeholders: { port: '443' },
  },
  {
    label: 'exclude-arp',
    displayLabel: '排除 ARP',
    template: '!arp',
    description: '排除 ARP 数据包',
  },
  {
    label: 'complex-filter',
    displayLabel: '组合过滤',
    template: 'tcp and host ${ip} and port ${port}',
    description: '组合多个条件',
    placeholders: { ip: '192.168.1.1', port: '80' },
  },
];

export default bpfAutocomplete;
