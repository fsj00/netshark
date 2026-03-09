import { useMemo } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts'
import { Activity, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'

const COLORS = {
  TCP: '#3b82f6',
  UDP: '#22c55e',
  ICMP: '#eab308',
  HTTP: '#a855f7',
  DNS: '#f97316',
  ARP: '#ef4444',
  OTHER: '#6b7280'
}

function ProtocolChart({ packets = [], type = 'pie', height = 300 }) {
  // 统计协议分布
  const protocolStats = useMemo(() => {
    const stats = {}
    packets.forEach(packet => {
      const protocol = packet.protocol?.toUpperCase() || 'OTHER'
      stats[protocol] = (stats[protocol] || 0) + 1
    })
    
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [packets])

  // 统计流量随时间变化
  const trafficOverTime = useMemo(() => {
    const timeBuckets = {}
    const bucketSize = 1000 // 1 second
    
    packets.forEach(packet => {
      const timestamp = new Date(packet.timestamp).getTime()
      const bucket = Math.floor(timestamp / bucketSize) * bucketSize
      
      if (!timeBuckets[bucket]) {
        timeBuckets[bucket] = { time: bucket, count: 0, bytes: 0 }
      }
      timeBuckets[bucket].count += 1
      timeBuckets[bucket].bytes += packet.length || 0
    })
    
    return Object.values(timeBuckets)
      .sort((a, b) => a.time - b.time)
      .map(item => ({
        ...item,
        timeLabel: new Date(item.time).toLocaleTimeString('zh-CN', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }))
  }, [packets])

  // 统计端口分布 (Top 10)
  const portStats = useMemo(() => {
    const stats = {}
    packets.forEach(packet => {
      if (packet.dstPort) {
        stats[packet.dstPort] = (stats[packet.dstPort] || 0) + 1
      }
    })
    
    return Object.entries(stats)
      .map(([port, count]) => ({ port: `Port ${port}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [packets])

  // 统计 IP 通信对
  const ipPairs = useMemo(() => {
    const stats = {}
    packets.forEach(packet => {
      const pair = `${packet.srcIP} → ${packet.dstIP}`
      stats[pair] = (stats[pair] || 0) + 1
    })
    
    return Object.entries(stats)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [packets])

  const totalPackets = packets.length
  const totalBytes = packets.reduce((sum, p) => sum + (p.length || 0), 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-dark-text">{label || payload[0].name}</p>
          <p className="text-sm text-dark-muted">
            数量: <span className="text-shark-400">{payload[0].value}</span>
          </p>
          {totalPackets > 0 && (
            <p className="text-sm text-dark-muted">
              占比: <span className="text-shark-400">
                {((payload[0].value / totalPackets) * 100).toFixed(1)}%
              </span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={protocolStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {protocolStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name] || COLORS.OTHER} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-dark-text">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'traffic':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={trafficOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="timeLabel" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', strokeWidth: 0 }}
                name="数据包数"
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'ports':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={portStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="port" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'ips':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={ipPairs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="pair" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                width={200}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getChartIcon = () => {
    switch (type) {
      case 'pie': return <PieIcon className="w-5 h-5" />
      case 'traffic': return <TrendingUp className="w-5 h-5" />
      case 'ports': return <BarChart3 className="w-5 h-5" />
      case 'ips': return <Activity className="w-5 h-5" />
      default: return <PieIcon className="w-5 h-5" />
    }
  }

  const getChartTitle = () => {
    switch (type) {
      case 'pie': return '协议分布'
      case 'traffic': return '流量趋势'
      case 'ports': return '热门端口'
      case 'ips': return '通信对'
      default: return '统计图表'
    }
  }

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-shark-500/20 rounded-lg flex items-center justify-center">
            {getChartIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-dark-text">{getChartTitle()}</h3>
            <p className="text-xs text-dark-muted">
              {totalPackets.toLocaleString()} 个数据包 · {(totalBytes / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </div>

      {packets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-dark-muted">
          <PieIcon className="w-12 h-12 mb-2 opacity-30" />
          <p>暂无数据</p>
          <p className="text-sm">上传 PCAP 文件查看统计</p>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  )
}

export default ProtocolChart
