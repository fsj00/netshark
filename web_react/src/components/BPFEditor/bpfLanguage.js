/**
 * BPF Language Definition
 * 定义 BPF 过滤器的语法结构
 */

import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { LRParser } from '@lezer/lr';

/**
 * BPF 语法定义
 * 基于 Lezer 解析器生成器语法
 */
const bpfGrammar = `
@precedence {
  not @right
  and @left
  or @left
  compare @left
}

@top FilterExpression { expression }

expression {
  Primitive |
  NotExpression |
  AndExpression |
  OrExpression |
  Parenthesized
}

Primitive {
  Protocol |
  ModifierExpression |
  Comparison
}

NotExpression {
  not expression
}

AndExpression {
  expression and expression
}

OrExpression {
  expression or expression
}

Parenthesized {
  "(" expression ")"
}

ModifierExpression {
  Modifier Primitive
}

Comparison {
  Field CompareOp Value
}

Protocol {
  "ether" | "fddi" | "tr" | "wlan" | "ppp" | "slip" |
  "ip" | "ip6" | "arp" | "rarp" |
  "tcp" | "udp" | "icmp" | "icmp6" | "igmp" | "igrp" | "pim" |
  "ah" | "esp" | "vrrp" | "sctp" |
  "http" | "https" | "ftp" | "ssh" | "telnet" |
  "smtp" | "pop3" | "imap" | "dns" | "ntp" | "snmp" | "ldap"
}

Modifier {
  "host" | "net" | "port" | "portrange" |
  "src" | "dst" | "gateway" | "broadcast" | "multicast"
}

Field {
  Protocol "." ("src" | "dst" | "host" | "port" | "addr")
}

CompareOp {
  "==" | "!=" | "<" | "<=" | ">" | ">="
}

Value {
  number | string | ipAddress
}

@tokens {
  not { "not" | "!" }
  and { "and" | "&&" }
  or { "or" | "||" }
  
  number { @digit+ }
  
  string { '"' (!["\\] | "\\" _)* '"' }
  
  ipAddress { @digit+ "." @digit+ "." @digit+ "." @digit+ }
  
  whitespace { @whitespace+ }
  
  @precedence {
    ipAddress,
    number
  }
}

@skip { whitespace }
`;

/**
 * 简化的词法分析器
 * 用于 BPF 过滤器的语法高亮
 */
export const bpfTokens = {
  // 协议关键字
  protocols: [
    'ether', 'fddi', 'tr', 'wlan', 'ppp', 'slip', 'arcnet',
    'ip', 'ip6', 'arp', 'rarp',
    'tcp', 'udp', 'icmp', 'icmp6', 'igmp', 'igrp', 'pim',
    'ah', 'esp', 'vrrp', 'sctp',
    'http', 'https', 'ftp', 'ssh', 'telnet',
    'smtp', 'pop3', 'imap', 'dns', 'ntp', 'snmp', 'ldap',
    'mysql', 'postgres', 'mongodb', 'redis'
  ],
  
  // 修饰符
  modifiers: [
    'host', 'net', 'port', 'portrange',
    'src', 'dst', 'src host', 'dst host', 'src net', 'dst net',
    'src port', 'dst port', 'src portrange', 'dst portrange',
    'gateway', 'broadcast', 'multicast',
  ],
  
  // 逻辑运算符
  operators: [
    'and', '&&', 'or', '||', 'not', '!'
  ],
  
  // 比较运算符
  comparators: [
    '==', '!=', '<', '<=', '>', '>='
  ],
  
  // 字段访问
  fields: [
    'addr', 'host', 'port', 'proto', 'type', 'code'
  ]
};

/**
 * 创建简单的词法分析器
 * @returns {Object} 词法分析器配置
 */
export const createBPFLexer = () => {
  const allKeywords = [
    ...bpfTokens.protocols,
    ...bpfTokens.modifiers,
    ...bpfTokens.operators,
  ];
  
  // 创建正则表达式匹配模式
  const keywordPattern = new RegExp(
    '^(' + allKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
    'i'
  );
  
  const operatorPattern = /^(&&|\|\||==|!=|<=|>=|<|>|[!()])/;
  const numberPattern = /^\d+/;
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  const stringPattern = /^"[^"]*"/;
  const fieldPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*/;
  const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*/;
  const whitespacePattern = /^\s+/;
  
  return {
    keywordPattern,
    operatorPattern,
    numberPattern,
    ipPattern,
    stringPattern,
    fieldPattern,
    identifierPattern,
    whitespacePattern,
  };
};

/**
 * BPF 语言支持
 * @returns {LanguageSupport}
 */
export const bpfLanguage = () => {
  // 由于 Lezer 语法编译复杂，我们使用简化的语言支持
  // 实际项目中可以使用 @lezer/generator 生成解析器
  
  return new LanguageSupport(
    LRLanguage.define({
      name: 'bpf',
      parser: LRParser.deserialize({
        // 简化的解析器配置
        // 实际使用时应该使用完整的语法定义
      }),
    })
  );
};

export default bpfTokens;
