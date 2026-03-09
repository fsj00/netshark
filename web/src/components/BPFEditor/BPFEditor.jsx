import { useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { autocompletion, CompletionContext } from '@codemirror/autocomplete'
import { linter, Diagnostic } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'

// BPF 关键字
const bpfKeywords = [
  'tcp', 'udp', 'icmp', 'http', 'dns', 'arp', 'ip', 'ipv6',
  'host', 'port', 'src', 'dst', 'src host', 'dst host', 'src port', 'dst port',
  'and', 'or', 'not', '&&', '||', '!',
  'net', 'mask', 'gateway', 'broadcast', 'less', 'greater',
  'ether', 'vlan', 'mpls', 'ppp', 'slip', 'fddi', 'tr', 'wlan',
  'portrange', 'proto', 'protochain', 'type'
]

// BPF 操作符
const bpfOperators = ['and', 'or', 'not', '&&', '||', '!']

// BPF 语法高亮
const bpfLanguage = StreamLanguage.define({
  token: (stream, state) => {
    // 跳过空白字符
    if (stream.eatSpace()) return null

    // 字符串
    if (stream.match(/^"[^"]*"/)) return 'string'
    if (stream.match(/^'[^']*'/)) return 'string'

    // 数字 (端口号等)
    if (stream.match(/^\d+/)) return 'number'

    // IP 地址
    if (stream.match(/^\d+\.\d+\.\d+\.\d+/)) return 'string'

    // MAC 地址
    if (stream.match(/^[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}/)) return 'string'

    // 注释
    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }

    // 关键字检测
    const word = stream.match(/^[a-zA-Z][a-zA-Z0-9_]*/)
    if (word) {
      const wordStr = word[0].toLowerCase()
      if (bpfKeywords.includes(wordStr)) {
        return 'keyword'
      }
      return 'variable'
    }

    // 操作符
    if (stream.match(/^[&|!()]/)) return 'operator'

    // 其他字符
    stream.next()
    return null
  },
  startState: () => ({}),
})

// 自动补全提供者
const bpfCompletions = (context) => {
  const word = context.matchBefore(/[\w\s]*/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  const options = [
    // 协议
    { label: 'tcp', type: 'keyword', info: 'TCP 协议' },
    { label: 'udp', type: 'keyword', info: 'UDP 协议' },
    { label: 'icmp', type: 'keyword', info: 'ICMP 协议' },
    { label: 'http', type: 'keyword', info: 'HTTP 协议' },
    { label: 'dns', type: 'keyword', info: 'DNS 协议' },
    { label: 'arp', type: 'keyword', info: 'ARP 协议' },
    { label: 'ip', type: 'keyword', info: 'IPv4 协议' },
    { label: 'ipv6', type: 'keyword', info: 'IPv6 协议' },
    // 过滤条件
    { label: 'host', type: 'function', info: '主机地址过滤' },
    { label: 'port', type: 'function', info: '端口号过滤' },
    { label: 'src', type: 'keyword', info: '源地址/端口' },
    { label: 'dst', type: 'keyword', info: '目的地址/端口' },
    { label: 'src host', type: 'function', info: '源主机地址' },
    { label: 'dst host', type: 'function', info: '目的主机地址' },
    { label: 'src port', type: 'function', info: '源端口号' },
    { label: 'dst port', type: 'function', info: '目的端口号' },
    // 逻辑操作符
    { label: 'and', type: 'operator', info: '逻辑与' },
    { label: 'or', type: 'operator', info: '逻辑或' },
    { label: 'not', type: 'operator', info: '逻辑非' },
    // 其他
    { label: 'net', type: 'function', info: '网络地址' },
    { label: 'portrange', type: 'function', info: '端口范围' },
    { label: 'gateway', type: 'function', info: '网关地址' },
    { label: 'broadcast', type: 'function', info: '广播地址' },
  ]

  return {
    from: word.from,
    options: options.filter(opt => 
      opt.label.toLowerCase().startsWith(word.text.toLowerCase().trim())
    ),
    validFor: /^[\w\s]*$/
  }
}

// BPF 语法检查
const bpfLinter = linter((view) => {
  const diagnostics = []
  const text = view.state.doc.toString()
  
  // 简单的语法检查规则
  const lines = text.split('\n')
  let pos = 0
  
  lines.forEach((line, lineIndex) => {
    // 检查括号匹配
    const openParens = (line.match(/\(/g) || []).length
    const closeParens = (line.match(/\)/g) || []).length
    
    if (openParens !== closeParens) {
      diagnostics.push({
        from: pos,
        to: pos + line.length,
        severity: 'error',
        message: '括号不匹配',
      })
    }
    
    // 检查连续的操作符
    if (/\b(and|or)\s+(and|or)\b/.test(line)) {
      const match = line.match(/\b(and|or)\s+(and|or)\b/)
      if (match) {
        diagnostics.push({
          from: pos + match.index,
          to: pos + match.index + match[0].length,
          severity: 'warning',
          message: '连续的操作符可能导致意外行为',
        })
      }
    }
    
    pos += line.length + 1
  })
  
  return diagnostics
})

function BPFEditor({ value, onChange, placeholder = '输入 BPF 过滤表达式...' }) {
  const extensions = useMemo(() => [
    bpfLanguage,
    autocompletion({
      override: [bpfCompletions],
      defaultKeymap: true,
    }),
    bpfLinter,
  ], [])

  const handleChange = useCallback((newValue) => {
    onChange?.(newValue)
  }, [onChange])

  return (
    <div className="bpf-editor">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-dark-muted">
          BPF 过滤器
        </label>
        <span className="text-xs text-dark-muted">
          支持语法高亮和自动补全
        </span>
      </div>
      <CodeMirror
        value={value}
        height="120px"
        theme={oneDark}
        extensions={extensions}
        onChange={handleChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: false,
          dropCursor: true,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: false,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="text-xs text-dark-muted">快速插入:</span>
        {['tcp', 'udp', 'icmp', 'port 80', 'host 192.168.1.1'].map((tag) => (
          <button
            key={tag}
            onClick={() => onChange?.(value ? `${value} ${tag}` : tag)}
            className="text-xs px-2 py-1 bg-dark-surface border border-dark-border rounded hover:border-shark-500 hover:text-shark-400 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

export default BPFEditor
