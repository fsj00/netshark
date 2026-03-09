/**
 * BPF Syntax Highlighting
 * BPF 过滤器语法高亮配置
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { bpfTokens } from './bpfLanguage';

/**
 * 深色主题高亮样式
 */
export const bpfDarkHighlightStyle = HighlightStyle.define([
  // 协议 - 绿色
  {
    tag: t.keyword,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  // 修饰符 - 青色
  {
    tag: t.modifier,
    color: '#00bcd4',
  },
  // 运算符 - 紫色
  {
    tag: t.operator,
    color: '#9c27b0',
  },
  // 比较运算符 - 橙色
  {
    tag: t.compareOperator,
    color: '#ff9800',
  },
  // 数字 - 蓝色
  {
    tag: t.number,
    color: '#4a9eff',
  },
  // 字符串 - 黄色
  {
    tag: t.string,
    color: '#ffeb3b',
  },
  // 字段 - 粉色
  {
    tag: t.propertyName,
    color: '#e91e63',
  },
  // 标识符 - 默认
  {
    tag: t.name,
    color: '#e0e0e0',
  },
  // 注释 - 灰色
  {
    tag: t.comment,
    color: '#666666',
    fontStyle: 'italic',
  },
  // 无效/错误 - 红色
  {
    tag: t.invalid,
    color: '#f44336',
    textDecoration: 'underline',
  },
]);

/**
 * 浅色主题高亮样式
 */
export const bpfLightHighlightStyle = HighlightStyle.define([
  {
    tag: t.keyword,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  {
    tag: t.modifier,
    color: '#00838f',
  },
  {
    tag: t.operator,
    color: '#7b1fa2',
  },
  {
    tag: t.compareOperator,
    color: '#ef6c00',
  },
  {
    tag: t.number,
    color: '#1565c0',
  },
  {
    tag: t.string,
    color: '#f9a825',
  },
  {
    tag: t.propertyName,
    color: '#c2185b',
  },
  {
    tag: t.name,
    color: '#212121',
  },
  {
    tag: t.comment,
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
  {
    tag: t.invalid,
    color: '#d32f2f',
    textDecoration: 'underline',
  },
]);

/**
 * 自定义高亮扩展
 * 使用 StreamParser 进行简单的词法分析
 */
export const bpfHighlighting = (isDark = true) => {
  const { 
    protocols, 
    modifiers, 
    operators, 
    comparators 
  } = bpfTokens;
  
  // 创建匹配正则
  const protocolPattern = new RegExp(
    '^(?:' + protocols.join('|') + ')\\b',
    'i'
  );
  const modifierPattern = new RegExp(
    '^(?:' + modifiers.join('|').replace(/\s+/g, '\\s+') + ')\\b',
    'i'
  );
  const operatorPattern = /^(?:and|or|not|&&|\|\||!)/i;
  const comparatorPattern = /^(?:==|!=|<=|>=|<|>)/;
  const fieldPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*/;
  const numberPattern = /^\d+(?:\.\d+)?/;
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  const stringPattern = /^"[^"]*"/;
  const parenPattern = /^[()]/;
  const whitespacePattern = /^\s+/;
  
  const styles = isDark ? {
    protocol: '#4caf50',
    modifier: '#00bcd4',
    operator: '#9c27b0',
    comparator: '#ff9800',
    number: '#4a9eff',
    string: '#ffeb3b',
    field: '#e91e63',
    paren: '#a0a0a0',
    default: '#e0e0e0',
  } : {
    protocol: '#2e7d32',
    modifier: '#00838f',
    operator: '#7b1fa2',
    comparator: '#ef6c00',
    number: '#1565c0',
    string: '#f9a825',
    field: '#c2185b',
    paren: '#616161',
    default: '#212121',
  };
  
  return {
    token: (stream) => {
      // 跳过空白
      if (stream.eatSpace()) return null;
      
      const ch = stream.peek();
      
      // 字符串
      if (ch === '"') {
        stream.match(stringPattern);
        return 'string';
      }
      
      // 括号
      if (ch === '(' || ch === ')') {
        stream.next();
        return 'bracket';
      }
      
      // IP 地址
      if (stream.match(ipPattern)) {
        return 'number';
      }
      
      // 字段访问 (如 tcp.port)
      if (stream.match(fieldPattern)) {
        return 'propertyName';
      }
      
      // 协议
      if (stream.match(protocolPattern)) {
        return 'keyword';
      }
      
      // 修饰符
      if (stream.match(modifierPattern)) {
        return 'modifier';
      }
      
      // 比较运算符
      if (stream.match(comparatorPattern)) {
        return 'compareOperator';
      }
      
      // 逻辑运算符
      if (stream.match(operatorPattern)) {
        return 'operator';
      }
      
      // 数字
      if (stream.match(numberPattern)) {
        return 'number';
      }
      
      // 其他字符
      stream.next();
      return null;
    },
    
    startState: () => ({}),
    
    copyState: (state) => ({ ...state }),
  };
};

/**
 * 获取语法高亮扩展
 * @param {boolean} isDark - 是否为深色主题
 * @returns {Extension}
 */
export const getBPFHighlighting = (isDark = true) => {
  const style = isDark ? bpfDarkHighlightStyle : bpfLightHighlightStyle;
  return syntaxHighlighting(style);
};

export default getBPFHighlighting;
