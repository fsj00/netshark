import { useState, useCallback, useMemo } from 'react'
import { getPackets, applyFilter } from '../services/api'

/**
 * 数据包管理 Hook
 * 提供数据包的加载、过滤、排序等功能
 */
function usePackets() {
  const [packets, setPackets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({
    field: 'timestamp',
    direction: 'asc'
  })

  // 加载数据包
  const loadPackets = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await getPackets(params)
      setPackets(response.packets || [])
      return response
    } catch (err) {
      setError(err.message || '加载数据包失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 应用 BPF 过滤器
  const applyBpfFilter = useCallback(async (bpfExpression) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await applyFilter(bpfExpression)
      setPackets(response.packets || [])
      setFilter(bpfExpression)
      return response
    } catch (err) {
      setError(err.message || '应用过滤器失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 设置排序
  const setSort = useCallback((field, direction) => {
    setSortConfig({ field, direction })
  }, [])

  // 排序后的数据包
  const sortedPackets = useMemo(() => {
    return [...packets].sort((a, b) => {
      let aVal = a[sortConfig.field]
      let bVal = b[sortConfig.field]
      
      // 处理 undefined/null
      if (aVal === undefined || aVal === null) aVal = ''
      if (bVal === undefined || bVal === null) bVal = ''
      
      // 字符串比较
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortConfig.direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
  }, [packets, sortConfig])

  // 统计数据
  const statistics = useMemo(() => {
    const stats = {
      total: packets.length,
      totalBytes: 0,
      protocols: {},
      srcIPs: new Set(),
      dstIPs: new Set(),
      timeRange: { start: null, end: null }
    }

    packets.forEach(packet => {
      // 字节数统计
      stats.totalBytes += packet.length || 0
      
      // 协议统计
      const protocol = packet.protocol || 'UNKNOWN'
      stats.protocols[protocol] = (stats.protocols[protocol] || 0) + 1
      
      // IP 统计
      if (packet.srcIP) stats.srcIPs.add(packet.srcIP)
      if (packet.dstIP) stats.dstIPs.add(packet.dstIP)
      
      // 时间范围
      const timestamp = new Date(packet.timestamp).getTime()
      if (!stats.timeRange.start || timestamp < stats.timeRange.start) {
        stats.timeRange.start = timestamp
      }
      if (!stats.timeRange.end || timestamp > stats.timeRange.end) {
        stats.timeRange.end = timestamp
      }
    })

    return {
      ...stats,
      uniqueSrcIPs: stats.srcIPs.size,
      uniqueDstIPs: stats.dstIPs.size,
      duration: stats.timeRange.start && stats.timeRange.end
        ? (stats.timeRange.end - stats.timeRange.start) / 1000
        : 0
    }
  }, [packets])

  // 清除数据
  const clearPackets = useCallback(() => {
    setPackets([])
    setFilter('')
    setError(null)
  }, [])

  // 添加数据包（用于实时捕获）
  const addPacket = useCallback((packet) => {
    setPackets(prev => [...prev, packet])
  }, [])

  // 批量添加数据包
  const addPackets = useCallback((newPackets) => {
    setPackets(prev => [...prev, ...newPackets])
  }, [])

  return {
    // 状态
    packets,
    sortedPackets,
    loading,
    error,
    filter,
    sortConfig,
    statistics,
    
    // 操作方法
    loadPackets,
    applyBpfFilter,
    setSort,
    setFilter,
    clearPackets,
    addPacket,
    addPackets
  }
}

export default usePackets
