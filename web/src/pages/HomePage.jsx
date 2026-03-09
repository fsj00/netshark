import { useState, useCallback } from 'react'
import { Upload, Play, Filter, FileCheck, AlertCircle } from 'lucide-react'
import UploadArea from '../components/Upload/UploadArea'
import BPFEditor from '../components/BPFEditor/BPFEditor'
import PacketTable from '../components/PacketList/PacketTable'
import DetailModal from '../components/PacketDetail/DetailModal'
import ProtocolChart from '../components/Stats/ProtocolChart'
import { uploadPcap, getPackets } from '../services/api'

function HomePage() {
  const [packets, setPackets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [bpfFilter, setBpfFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null)

  // 模拟数据包数据
  const mockPackets = [
    { id: 1, number: 1, timestamp: Date.now(), srcIP: '192.168.1.100', dstIP: '192.168.1.1', srcPort: 54321, dstPort: 80, protocol: 'TCP', length: 64, info: 'SYN Seq=0 Win=64240 Len=0', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:01', dstMac: 'aa:bb:cc:dd:ee:02' },
    { id: 2, number: 2, timestamp: Date.now() + 1, srcIP: '192.168.1.1', dstIP: '192.168.1.100', srcPort: 80, dstPort: 54321, protocol: 'TCP', length: 64, info: 'SYN, ACK Seq=0 Ack=1 Win=65535 Len=0', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:02', dstMac: 'aa:bb:cc:dd:ee:01' },
    { id: 3, number: 3, timestamp: Date.now() + 2, srcIP: '192.168.1.100', dstIP: '192.168.1.1', srcPort: 54321, dstPort: 80, protocol: 'TCP', length: 52, info: 'ACK Seq=1 Ack=1 Win=64240 Len=0', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:01', dstMac: 'aa:bb:cc:dd:ee:02' },
    { id: 4, number: 4, timestamp: Date.now() + 10, srcIP: '192.168.1.100', dstIP: '192.168.1.1', srcPort: 54321, dstPort: 80, protocol: 'HTTP', length: 450, info: 'GET /index.html HTTP/1.1', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:01', dstMac: 'aa:bb:cc:dd:ee:02' },
    { id: 5, number: 5, timestamp: Date.now() + 15, srcIP: '192.168.1.1', dstIP: '192.168.1.100', srcPort: 80, dstPort: 54321, protocol: 'HTTP', length: 1200, info: 'HTTP/1.1 200 OK (text/html)', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:02', dstMac: 'aa:bb:cc:dd:ee:01' },
    { id: 6, number: 6, timestamp: Date.now() + 20, srcIP: '192.168.1.100', dstIP: '8.8.8.8', srcPort: 12345, dstPort: 53, protocol: 'DNS', length: 75, info: 'Standard query A example.com', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:01', dstMac: 'aa:bb:cc:dd:ee:ff' },
    { id: 7, number: 7, timestamp: Date.now() + 25, srcIP: '8.8.8.8', dstIP: '192.168.1.100', srcPort: 53, dstPort: 12345, protocol: 'DNS', length: 120, info: 'Standard query response A 93.184.216.34', ttl: 55, srcMac: 'aa:bb:cc:dd:ee:ff', dstMac: 'aa:bb:cc:dd:ee:01' },
    { id: 8, number: 8, timestamp: Date.now() + 30, srcIP: '192.168.1.100', dstIP: '192.168.1.255', srcPort: null, dstPort: null, protocol: 'ARP', length: 42, info: 'Who has 192.168.1.1? Tell 192.168.1.100', ttl: null, srcMac: 'aa:bb:cc:dd:ee:01', dstMac: 'ff:ff:ff:ff:ff:ff' },
    { id: 9, number: 9, timestamp: Date.now() + 35, srcIP: '192.168.1.1', dstIP: '192.168.1.100', srcPort: null, dstPort: null, protocol: 'ARP', length: 42, info: '192.168.1.1 is at aa:bb:cc:dd:ee:02', ttl: null, srcMac: 'aa:bb:cc:dd:ee:02', dstMac: 'aa:bb:cc:dd:ee:01' },
    { id: 10, number: 10, timestamp: Date.now() + 40, srcIP: '192.168.1.100', dstIP: '192.168.1.1', srcPort: 12345, dstPort: 443, protocol: 'TCP', length: 64, info: 'SYN Seq=0 Win=64240 Len=0', ttl: 64, srcMac: 'aa:bb:cc:dd:ee:01', dstMac: 'aa:bb:cc:dd:ee:02' },
  ]

  // 生成更多模拟数据
  const generateMorePackets = (count) => {
    const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS']
    const newPackets = []
    for (let i = 0; i < count; i++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)]
      newPackets.push({
        id: 11 + i,
        number: 11 + i,
        timestamp: Date.now() + 50 + i * 10,
        srcIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
        dstIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
        srcPort: Math.floor(Math.random() * 65535),
        dstPort: [80, 443, 53, 22, 3389][Math.floor(Math.random() * 5)],
        protocol,
        length: Math.floor(Math.random() * 1500) + 40,
        info: `${protocol} packet`,
        ttl: 64,
        srcMac: 'aa:bb:cc:dd:ee:01',
        dstMac: 'aa:bb:cc:dd:ee:02'
      })
    }
    return newPackets
  }

  const handleUpload = useCallback(async (file) => {
    setLoading(true)
    setUploadStatus({ type: 'info', message: '正在上传...' })
    
    try {
      // 实际项目中调用 API
      // const result = await uploadPcap(file, bpfFilter)
      // setPackets(result.packets)
      
      // 模拟上传成功
      await new Promise(resolve => setTimeout(resolve, 1500))
      const allPackets = [...mockPackets, ...generateMorePackets(50)]
      setPackets(allPackets)
      setUploadStatus({ type: 'success', message: `成功加载 ${allPackets.length} 个数据包` })
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.message || '上传失败' })
    } finally {
      setLoading(false)
    }
  }, [bpfFilter])

  const handleApplyFilter = useCallback(async () => {
    if (!bpfFilter.trim()) {
      setPackets([...mockPackets, ...generateMorePackets(50)])
      return
    }

    setLoading(true)
    try {
      // 实际项目中调用 API
      // const result = await getPackets({ filter: bpfFilter })
      // setPackets(result.packets)
      
      // 模拟过滤
      await new Promise(resolve => setTimeout(resolve, 500))
      const filtered = packets.filter(p => 
        p.protocol.toLowerCase().includes(bpfFilter.toLowerCase()) ||
        p.srcIP.includes(bpfFilter) ||
        p.dstIP.includes(bpfFilter)
      )
      setPackets(filtered)
    } catch (error) {
      console.error('Filter error:', error)
    } finally {
      setLoading(false)
    }
  }, [bpfFilter, packets])

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <section className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-shark-500/20 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-shark-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-text">上传 PCAP 文件</h2>
            <p className="text-sm text-dark-muted">支持 .pcap, .pcapng, .cap 格式</p>
          </div>
        </div>
        
        <UploadArea onUpload={handleUpload} />
        
        {uploadStatus && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
            uploadStatus.type === 'success' ? 'bg-green-500/10 text-green-400' :
            uploadStatus.type === 'error' ? 'bg-red-500/10 text-red-400' :
            'bg-shark-500/10 text-shark-400'
          }`}>
            {uploadStatus.type === 'success' ? <FileCheck className="w-5 h-5" /> :
             uploadStatus.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             <Upload className="w-5 h-5" />}
            <span>{uploadStatus.message}</span>
          </div>
        )}
      </section>

      {/* BPF Filter Section */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-shark-500/20 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-shark-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-text">BPF 过滤器</h2>
              <p className="text-sm text-dark-muted">使用 Berkeley Packet Filter 语法过滤数据包</p>
            </div>
          </div>
          <button
            onClick={handleApplyFilter}
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            应用过滤
          </button>
        </div>
        
        <BPFEditor 
          value={bpfFilter} 
          onChange={setBpfFilter}
          placeholder="例如: tcp port 80 and host 192.168.1.1"
        />
      </section>

      {/* Stats Section */}
      {packets.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProtocolChart packets={packets} type="pie" />
          <ProtocolChart packets={packets} type="traffic" />
        </section>
      )}

      {/* Packet List Section */}
      <section>
        <PacketTable 
          packets={packets}
          onPacketSelect={setSelectedPacket}
          selectedPacketId={selectedPacket?.id}
          loading={loading}
          onFilterChange={setTableFilter}
          filter={tableFilter}
        />
      </section>

      {/* Detail Modal */}
      {selectedPacket && (
        <DetailModal 
          packet={selectedPacket}
          onClose={() => setSelectedPacket(null)}
        />
      )}
    </div>
  )
}

export default HomePage
