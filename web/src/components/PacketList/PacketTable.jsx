import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react'
import useVirtualList from '../../hooks/useVirtualList'

// 协议颜色映射
const protocolColors = {
  TCP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  UDP: 'bg-green-500/20 text-green-400 border-green-500/30',
  ICMP: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HTTP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DNS: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ARP: 'bg-red-500/20 text-red-400 border-red-500/30',
  DEFAULT: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

function PacketTable({ 
  packets = [], 
  onPacketSelect, 
  selectedPacketId = null,
  loading = false,
  onFilterChange,
  filter = ''
}) {
  const containerRef = useRef(null)
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('asc')
  const [localFilter, setLocalFilter] = useState(filter)

  const itemHeight = 48
  const headerHeight = 40

  // 排序和过滤数据
  const processedPackets = packets
    .filter(packet => {
      if (!localFilter) return true
      const searchTerm = localFilter.toLowerCase()
      return (
        packet.protocol?.toLowerCase().includes(searchTerm) ||
        packet.srcIP?.toLowerCase().includes(searchTerm) ||
        packet.dstIP?.toLowerCase().includes(searchTerm) ||
        packet.srcPort?.toString().includes(searchTerm) ||
        packet.dstPort?.toString().includes(searchTerm) ||
        packet.info?.toLowerCase().includes(searchTerm)
      )
    })
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

  const {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex
  } = useVirtualList({
    items: processedPackets,
    itemHeight,
    containerRef,
    overscan: 5
  })

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    onFilterChange?.(localFilter)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const formatSize = (bytes) => {
    if (bytes === undefined || bytes === null) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const getProtocolClass = (protocol) => {
    return protocolColors[protocol?.toUpperCase()] || protocolColors.DEFAULT
  }

  const columns = [
    { key: 'number', label: '编号', width: 'w-16' },
    { key: 'timestamp', label: '时间', width: 'w-24' },
    { key: 'srcIP', label: '源地址', width: 'w-32' },
    { key: 'dstIP', label: '目的地址', width: 'w-32' },
    { key: 'protocol', label: '协议', width: 'w-20' },
    { key: 'length', label: '长度', width: 'w-16' },
    { key: 'info', label: '信息', width: 'flex-1' },
  ]

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-xl border border-dark-border p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-shark-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-dark-muted">加载数据包...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-dark-text">
            数据包列表
          </h3>
          <span className="text-sm text-dark-muted">
            共 {processedPackets.length} 个
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Input */}
          <form onSubmit={handleFilterSubmit} className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
              placeholder="过滤数据包..."
              className="input pl-9 text-sm w-64"
            />
          </form>
          
          {/* Export Button */}
          <button className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        {/* Header */}
        <div className="flex border-b border-dark-border bg-dark-bg">
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => handleSort(col.key)}
              className={`${col.width} px-4 py-2 text-left text-sm font-medium text-dark-muted hover:text-dark-text transition-colors flex items-center gap-1`}
            >
              {col.label}
              {sortField === col.key && (
                <span className="text-shark-400">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Virtual List Container */}
        <div
          ref={containerRef}
          className="overflow-auto"
          style={{ height: '400px' }}
        >
          {processedPackets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-dark-muted">
              <p>暂无数据包</p>
              <p className="text-sm mt-1">上传 PCAP 文件开始分析</p>
            </div>
          ) : (
            <div style={{ height: totalHeight, position: 'relative' }}>
              {virtualItems.map((packet, index) => {
                const actualIndex = startIndex + index
                const isSelected = packet.id === selectedPacketId
                
                return (
                  <div
                    key={packet.id || actualIndex}
                    onClick={() => onPacketSelect?.(packet)}
                    className={`packet-row flex absolute w-full cursor-pointer border-b border-dark-border/50 ${
                      isSelected ? 'selected' : ''
                    }`}
                    style={{
                      height: itemHeight,
                      top: actualIndex * itemHeight,
                    }}
                  >
                    <div className="w-16 px-4 py-3 text-sm text-dark-muted truncate">
                      {actualIndex + 1}
                    </div>
                    <div className="w-24 px-4 py-3 text-sm text-dark-text truncate">
                      {formatTimestamp(packet.timestamp)}
                    </div>
                    <div className="w-32 px-4 py-3 text-sm text-dark-text truncate font-mono">
                      {packet.srcIP}
                    </div>
                    <div className="w-32 px-4 py-3 text-sm text-dark-text truncate font-mono">
                      {packet.dstIP}
                    </div>
                    <div className="w-20 px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getProtocolClass(packet.protocol)}`}>
                        {packet.protocol}
                      </span>
                    </div>
                    <div className="w-16 px-4 py-3 text-sm text-dark-muted">
                      {packet.length}
                    </div>
                    <div className="flex-1 px-4 py-3 text-sm text-dark-muted truncate">
                      {packet.info}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination Info */}
        <div className="px-4 py-2 border-t border-dark-border bg-dark-bg flex items-center justify-between text-sm">
          <span className="text-dark-muted">
            显示 {startIndex + 1} - {Math.min(endIndex, processedPackets.length)} / {processedPackets.length}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToIndex(0)}
              disabled={startIndex === 0}
              className="p-1 hover:bg-dark-surface rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToIndex(processedPackets.length - 1)}
              disabled={endIndex >= processedPackets.length}
              className="p-1 hover:bg-dark-surface rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PacketTable
