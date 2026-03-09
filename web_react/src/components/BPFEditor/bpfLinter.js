/**
 * BPF Linter
 * BPF 过滤器语法检查
 */

import { linter, Diagnostic } from '@codemirror/lint';
import { bpfTokens } from './bpfLanguage';

/**
 * 创建 BPF Linter
 * @returns {Function} Linter 函数
 */
export const createBPFLinter = () => {
  const { protocols, modifiers, operators, comparators } = bpfTokens;
  
  /**
   * 验证 BPF 表达式
   * @param {string} text - BPF 表达式
   * @returns {Array<Diagnostic>} 诊断信息
   */
  return (view) => {
    const text = view.state.doc.toString();
    const diagnostics = [];
    
    if (!text.trim()) {
      return diagnostics;
    }
    
    // 检查括号匹配
    const parenCheck = checkParentheses(text);
    if (!parenCheck.valid) {
      diagnostics.push({
        from: parenCheck.position,
        to: parenCheck.position + 1,
        severity: 'error',
        message: parenCheck.message,
      });
    }
    
    // 检查引号匹配
    const quoteCheck = checkQuotes(text);
    if (!quoteCheck.valid) {
      diagnostics.push({
        from: quoteCheck.position,
        to: quoteCheck.position + 1,
        severity: 'error',
        message: quoteCheck.message,
      });
    }
    
    // 检查无效关键字
    const invalidTokens = checkInvalidTokens(text, protocols, modifiers, operators);
    invalidTokens.forEach(token => {
      diagnostics.push({
        from: token.from,
        to: token.to,
        severity: 'warning',
        message: `未知关键字: "${token.text}"`,
      });
    });
    
    // 检查连续运算符
    const consecutiveOps = checkConsecutiveOperators(text, operators);
    consecutiveOps.forEach(op => {
      diagnostics.push({
        from: op.from,
        to: op.to,
        severity: 'error',
        message: '无效的运算符组合',
      });
    });
    
    // 检查 IP 地址格式
    const ipErrors = checkIPAddressFormat(text);
    ipErrors.forEach(ip => {
      diagnostics.push({
        from: ip.from,
        to: ip.to,
        severity: 'error',
        message: `无效的 IP 地址格式: "${ip.text}"`,
      });
    });
    
    // 检查端口范围
    const portErrors = checkPortRange(text);
    portErrors.forEach(port => {
      diagnostics.push({
        from: port.from,
        to: port.to,
        severity: 'error',
        message: `无效的端口号: "${port.text}" (范围: 0-65535)`,
      });
    });
    
    return diagnostics;
  };
};

/**
 * 检查括号匹配
 */
function checkParentheses(text) {
  const stack = [];
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') {
      stack.push({ char: '(', pos: i });
    } else if (text[i] === ')') {
      if (stack.length === 0) {
        return { valid: false, position: i, message: '多余的右括号' };
      }
      stack.pop();
    }
  }
  
  if (stack.length > 0) {
    const last = stack[stack.length - 1];
    return { valid: false, position: last.pos, message: '括号未闭合' };
  }
  
  return { valid: true };
}

/**
 * 检查引号匹配
 */
function checkQuotes(text) {
  let inString = false;
  let stringStart = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"' && (i === 0 || text[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringStart = i;
      } else {
        inString = false;
      }
    }
  }
  
  if (inString) {
    return { valid: false, position: stringStart, message: '字符串未闭合' };
  }
  
  return { valid: true };
}

/**
 * 检查无效关键字
 */
function checkInvalidTokens(text, protocols, modifiers, operators) {
  const invalid = [];
  const allKeywords = [...protocols, ...modifiers, ...operators];
  const tokenPattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
  let match;
  
  while ((match = tokenPattern.exec(text)) !== null) {
    const token = match[0].toLowerCase();
    
    // 检查是否是数字
    if (/^\d+$/.test(token)) continue;
    
    // 检查是否是已知关键字
    if (!allKeywords.includes(token)) {
      // 检查是否是字段访问（如 tcp.port）
      if (!token.includes('.')) {
        invalid.push({
          text: match[0],
          from: match.index,
          to: match.index + match[0].length,
        });
      }
    }
  }
  
  return invalid;
}

/**
 * 检查连续运算符
 */
function checkConsecutiveOperators(text, operators) {
  const errors = [];
  const opPattern = new RegExp(
    '(?:' + operators.map(o => o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
    'gi'
  );
  
  const matches = [];
  let match;
  while ((match = opPattern.exec(text)) !== null) {
    matches.push({ text: match[0], index: match.index });
  }
  
  for (let i = 1; i < matches.length; i++) {
    const prev = matches[i - 1];
    const curr = matches[i];
    
    // 检查是否连续（中间只有空白字符）
    const between = text.slice(prev.index + prev.text.length, curr.index);
    if (/^\s*$/.test(between)) {
      // 允许 not 后面跟运算符
      if (prev.text.toLowerCase() !== 'not' && prev.text !== '!') {
        errors.push({
          from: curr.index,
          to: curr.index + curr.text.length,
        });
      }
    }
  }
  
  return errors;
}

/**
 * 检查 IP 地址格式
 */
function checkIPAddressFormat(text) {
  const errors = [];
  const ipPattern = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;
  let match;
  
  while ((match = ipPattern.exec(text)) !== null) {
    const octets = [match[1], match[2], match[3], match[4]].map(Number);
    
    for (const octet of octets) {
      if (octet < 0 || octet > 255) {
        errors.push({
          text: match[0],
          from: match.index,
          to: match.index + match[0].length,
        });
        break;
      }
    }
  }
  
  return errors;
}

/**
 * 检查端口范围
 */
function checkPortRange(text) {
  const errors = [];
  const portPattern = /\bport\s+(\d+)\b/gi;
  let match;
  
  while ((match = portPattern.exec(text)) !== null) {
    const port = parseInt(match[1], 10);
    
    if (port < 0 || port > 65535) {
      errors.push({
        text: match[1],
        from: match.index + match[0].indexOf(match[1]),
        to: match.index + match[0].indexOf(match[1]) + match[1].length,
      });
    }
  }
  
  return errors;
}

/**
 * BPF Linter 扩展
 */
export const bpfLinter = () => {
  return linter(createBPFLinter(), {
    delay: 300, // 延迟检查，避免频繁更新
  });
};

/**
 * 验证 BPF 表达式（外部调用）
 * @param {string} expression - BPF 表达式
 * @returns {Object} 验证结果
 */
export const validateBPFExpression = (expression) => {
  const diagnostics = [];
  
  // 括号检查
  const parenCheck = checkParentheses(expression);
  if (!parenCheck.valid) {
    diagnostics.push({ type: 'error', message: parenCheck.message });
  }
  
  // 引号检查
  const quoteCheck = checkQuotes(expression);
  if (!quoteCheck.valid) {
    diagnostics.push({ type: 'error', message: quoteCheck.message });
  }
  
  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

export default bpfLinter;
