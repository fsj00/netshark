import { useEffect, useState } from 'react'
import { X, Copy, ChevronDown, ChevronRight, Layers, FileText, Binary } from 'lucide-react'

function DetailModal({ packet, onClose }) {
  const [activeTab, setActiveTab] = useState('layers')
  const [expandedLayers, setExpandedLayers] = useState(['frame', 'ethernet'])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!packet) return null

  const toggleLayer = (layer) => {
    setExpandedLayers(prev => 
      prev.includes(layer) 
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    )
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // 模拟数据包层次结构
  const layers = [
    {
      id: 'frame',
      name: 'Frame',
      protocol: 'Frame',
      info: `Frame ${packet.number || 1}: ${packet.length || 0} bytes on wire`,
      details: [
        { label: '到达时间', value: new Date(packet.timestamp).toLocaleString('zh-CN') },
        { label: '帧长度', value: `${packet.length || 0} bytes` },
        { label: '捕获长度', value: `${packet.capturedLength || packet.length || 0} bytes` },
      ]
    },
    {
      id: 'ethernet',
      name: 'Ethernet II',
      protocol: 'Ethernet',
      info: `Src: ${packet.srcMac || '00:00:00:00:00:00'}, Dst: ${packet.dstMac || '00:00:00:00:00:00'}`,
      details: [
        { label: '目的 MAC', value: packet.dstMac || '00:00:00:00:00:00' },
        { label: '源 MAC', value: packet.srcMac || '00:00:00:00:00:00' },
        { label: '类型', value: 'IPv4 (0x0800)' },
      ]
    },
    {
      id: 'ip',
      name: 'Internet Protocol Version 4',
      protocol: 'IP',
      info: `Src: ${packet.srcIP}, Dst: ${packet.dstIP}`,
      details: [
        { label: '版本', value: '4' },
        { label: '头部长度', value: '20 bytes' },
        { label: '总长度', value: `${packet.length || 0} bytes` },
        { label: '标识', value: `0x${Math.random().toString(16).substr(2, 4).toUpperCase()}` },
        { label: 'TTL', value: packet.ttl || '64' },
        { label: '协议', value: packet.protocol || 'TCP' },
        { label: '源地址', value: packet.srcIP },
        { label: '目的地址', value: packet.dstIP },
      ]
    },
    {
      id: 'transport',
      name: packet.protocol === 'TCP' ? 'Transmission Control Protocol' : 
            packet.protocol === 'UDP' ? 'User Datagram Protocol' : 
            packet.protocol || 'Transport',
      protocol: packet.protocol || 'TCP',
      info: `Src Port: ${packet.srcPort || '-'}, Dst Port: ${packet.dstPort || '-'}`,
      details: [
        { label: '源端口', value: packet.srcPort || '-' },
        { label: '目的端口', value: packet.dstPort || '-' },
        ...(packet.protocol === 'TCP' ? [
          { label: '序列号', value: `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}` },
          { label: '确认号', value: `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}` },
          { label: '窗口大小', value: Math.floor(Math.random() * 65535).toString() },
        ] : []),
      ]
    },
  ]

  // 模拟十六进制数据
  const hexData = packet.rawData || Array(16).fill(0).map(() => 
    Array(16).fill(0).map(() => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(' ')
  ).join('\n')

  const asciiData = packet.rawData || Array(16).fill(0).map(() => 
    Array(16).fill(0).map(() => {
      const char = String.fromCharCode(Math.floor(Math.random() * 128))
      return char >= ' ' && char <= '~' ? char : '.'
    }).join('')
  ).join('\n')

  const tabs = [
    { id: 'layers', label: '协议层次', icon: Layers },
    { id: 'raw', label: '原始数据', icon: Binary },
    { id: 'json', label: 'JSON', icon: FileText },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="modal-overlay absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-dark-surface rounded-xl border border-dark-border w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div>
            <h2 className="text-lg font-semibold text-dark-text">
              数据包详情 #{packet.number || 1}
            </h2>
            <p className="text-sm text-dark-muted mt-0.5">
              {packet.protocol} · {packet.srcIP}:{packet.srcPort} → {packet.dstIP}:{packet.dstPort}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-shark-500 text-shark-400'
                    : 'border-transparent text-dark-muted hover:text-dark-text'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'layers' && (
            <div className="space-y-2">
              {layers.map((layer) => (
                <div key={layer.id} className="border border-dark-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-dark-bg hover:bg-dark-surface transition-colors text-left"
                  >
                    {expandedLayers.includes(layer.id) ? (
                      <ChevronDown className="w-4 h-4 text-dark-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-muted" />
                    )}
                    <span className="font-medium text-shark-400">{layer.name}</span>
                    <span className="text-dark-muted">{layer.info}</span>
                  </button>
                  
                  {expandedLayers.includes(layer.id) && (
                    <div className="px-4 py-3 border-t border-dark-border">
                      <table className="w-full">
                        <tbody>
                          {layer.details.map((detail, index) => (
                            <tr key={index} className="group">
                              <td className="py-1.5 pr-4 text-sm text-dark-muted w-32">
                                {detail.label}:
                              </td>
                              <td className="py-1.5 text-sm text-dark-text font-mono flex items-center gap-2">
                                {detail.value}
                                <button
                                  onClick={() => copyToClipboard(detail.value)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-bg rounded transition-all"
                                >
                                  <Copy className="w-3 h-3 text-dark-muted" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="flex gap-4">
              {/* Hex View */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark-muted">十六进制</span>
                  <button
                    onClick={() => copyToClipboard(hexData)}
                    className="p-1.5 hover:bg-dark-bg rounded text-dark-muted hover:text-dark-text transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="bg-dark-bg p-4 rounded-lg text-xs font-mono text-dark-text overflow-auto max-h-96">
                  {hexData.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-dark-muted w-12 select-none">{(i * 16).toString(16).padStart(4, '0')}</span>
                      <span className="ml-4">{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
              
              {/* ASCII View */}
              <div className="w-48">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark-muted">ASCII</span>
                </div>
                <pre className="bg-dark-bg p-4 rounded-lg text-xs font-mono text-dark-text overflow-auto max-h-96">
                  {asciiData.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-dark-muted">JSON 格式</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(packet, null, 2))}
                  className="p-1.5 hover:bg-dark-bg rounded text-dark-muted hover:text-dark-text transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <pre className="bg-dark-bg p-4 rounded-lg text-xs font-mono text-dark-text overflow-auto max-h-96">
                {JSON.stringify(packet, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-border flex items-center justify-between">
          <span className="text-sm text-dark-muted">
            长度: {packet.length || 0} bytes
          </span>
          <button
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailModal
