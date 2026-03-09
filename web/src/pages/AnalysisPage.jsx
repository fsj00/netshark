import { useState } from 'react'
import { BarChart3, PieChart, Activity, Globe, Clock, Shield } from 'lucide-react'
import ProtocolChart from '../components/Stats/ProtocolChart'

function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // 模拟统计数据
  const stats = {
    totalPackets: 15432,
    totalBytes: 15728640,
    duration: 3600,
    protocols: {
      TCP: 8500,
      UDP: 4200,
      HTTP: 2100,
      DNS: 450,
      ICMP: 182
    },
    topSrcIPs: [
      { ip: '192.168.1.100', count: 3200 },
      { ip: '192.168.1.101', count: 2100 },
      { ip: '10.0.0.50', count: 1800 },
      { ip: '172.16.0.25', count: 1200 },
      { ip: '192.168.1.105', count: 950 }
    ],
    topDstIPs: [
      { ip: '8.8.8.8', count: 2800 },
      { ip: '192.168.1.1', count: 2400 },
      { ip: '1.1.1.1', count: 1500 },
      { ip: '93.184.216.34', count: 1200 },
      { ip: '142.250.185.78', count: 980 }
    ],
    topPorts: [
      { port: 443, count: 5200 },
      { port: 80, count: 3800 },
      { port: 53, count: 2100 },
      { port: 22, count: 850 },
      { port: 3389, count: 420 }
    ]
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3 },
    { id: 'protocols', label: '协议分析', icon: PieChart },
    { id: 'traffic', label: '流量分析', icon: Activity },
    { id: 'security', label: '安全分析', icon: Shield }
  ]

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'shark' }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-muted">{title}</p>
          <p className="text-2xl font-bold text-dark-text mt-1">{value}</p>
          {subtitle && <p className="text-xs text-dark-muted mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  )

  const ListCard = ({ title, icon: Icon, items, valueKey, labelKey }) => (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-shark-500/20 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-shark-400" />
        </div>
        <h3 className="font-semibold text-dark-text">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-dark-bg rounded text-xs flex items-center justify-center text-dark-muted">
                {index + 1}
              </span>
              <span className="text-sm text-dark-text font-mono">{item[labelKey]}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-dark-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-shark-500 rounded-full"
                  style={{ width: `${(item[valueKey] / items[0][valueKey]) * 100}%` }}
                />
              </div>
              <span className="text-sm text-dark-muted w-12 text-right">
                {item[valueKey].toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">流量分析</h1>
          <p className="text-dark-muted mt-1">深入分析网络流量模式和协议分布</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-border">
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={BarChart3} 
              title="总数据包数" 
              value={stats.totalPackets.toLocaleString()}
              subtitle="个数据包"
            />
            <StatCard 
              icon={Activity} 
              title="总流量" 
              value={formatBytes(stats.totalBytes)}
              subtitle="数据量"
            />
            <StatCard 
              icon={Clock} 
              title="捕获时长" 
              value={formatDuration(stats.duration)}
              subtitle="持续时间"
            />
            <StatCard 
              icon={Globe} 
              title="协议种类" 
              value={Object.keys(stats.protocols).length}
              subtitle="种协议"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProtocolChart 
              packets={Object.entries(stats.protocols).map(([protocol, count]) => ({
                protocol,
                length: count
              }))}
              type="pie"
              height={350}
            />
            <ProtocolChart 
              packets={Object.entries(stats.protocols).map(([protocol, count]) => ({
                protocol,
                length: count
              }))}
              type="traffic"
              height={350}
            />
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ListCard 
              title="活跃源 IP"
              icon={Globe}
              items={stats.topSrcIPs}
              valueKey="count"
              labelKey="ip"
            />
            <ListCard 
              title="热门目的 IP"
              icon={Globe}
              items={stats.topDstIPs}
              valueKey="count"
              labelKey="ip"
            />
            <ListCard 
              title="热门端口"
              icon={Activity}
              items={stats.topPorts}
              valueKey="count"
              labelKey="port"
            />
          </div>
        </div>
      )}

      {/* Protocols Tab */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProtocolChart 
              packets={Object.entries(stats.protocols).map(([protocol, count]) => ({
                protocol,
                length: count
              }))}
              type="pie"
              height={400}
            />
            <div className="card">
              <h3 className="font-semibold text-dark-text mb-4">协议详情</h3>
              <div className="space-y-4">
                {Object.entries(stats.protocols).map(([protocol, count]) => (
                  <div key={protocol} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        protocol === 'TCP' ? 'bg-blue-500/20 text-blue-400' :
                        protocol === 'UDP' ? 'bg-green-500/20 text-green-400' :
                        protocol === 'HTTP' ? 'bg-purple-500/20 text-purple-400' :
                        protocol === 'DNS' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {protocol}
                      </span>
                      <span className="text-sm text-dark-muted">
                        {((count / stats.totalPackets) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-sm font-medium text-dark-text">
                      {count.toLocaleString()} 包
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Tab */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <ProtocolChart 
              packets={Object.entries(stats.protocols).map(([protocol, count]) => ({
                protocol,
                length: count
              }))}
              type="traffic"
              height={400}
            />
            <ProtocolChart 
              packets={stats.topPorts.map(p => ({
                dstPort: p.port,
                length: p.count
              }))}
              type="ports"
              height={400}
            />
            <ProtocolChart 
              packets={stats.topSrcIPs.map(ip => ({
                srcIP: ip.ip,
                dstIP: ip.ip,
                length: ip.count
              }))}
              type="ips"
              height={400}
            />
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={Shield} 
              title="可疑连接" 
              value="12"
              subtitle="检测到"
              color="red"
            />
            <StatCard 
              icon={Shield} 
              title="异常流量" 
              value="3"
              subtitle="IP 地址"
              color="yellow"
            />
            <StatCard 
              icon={Shield} 
              title="安全评分" 
              value="85"
              subtitle="/ 100"
              color="green"
            />
          </div>
          
          <div className="card">
            <h3 className="font-semibold text-dark-text mb-4">安全事件</h3>
            <div className="space-y-3">
              {[
                { type: 'warning', message: '检测到大量 DNS 查询', time: '2 分钟前' },
                { type: 'error', message: '发现可疑端口扫描行为', time: '5 分钟前' },
                { type: 'warning', message: '异常大的数据包传输', time: '10 分钟前' },
                { type: 'info', message: 'SSL/TLS 证书验证通过', time: '15 分钟前' }
              ].map((event, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  event.type === 'error' ? 'bg-red-500/10' :
                  event.type === 'warning' ? 'bg-yellow-500/10' :
                  'bg-shark-500/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'warning' ? 'bg-yellow-500' :
                      'bg-shark-500'
                    }`} />
                    <span className={`text-sm ${
                      event.type === 'error' ? 'text-red-400' :
                      event.type === 'warning' ? 'text-yellow-400' :
                      'text-shark-400'
                    }`}>
                      {event.message}
                    </span>
                  </div>
                  <span className="text-xs text-dark-muted">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalysisPage
