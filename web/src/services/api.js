import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    const message = error.response?.data?.message || error.message || '请求失败'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

/**
 * 上传 PCAP 文件
 * @param {File} file - PCAP 文件
 * @param {string} filter - 可选的 BPF 过滤器
 */
export const uploadPcap = async (file, filter = '') => {
  const formData = new FormData()
  formData.append('file', file)
  if (filter) {
    formData.append('filter', filter)
  }

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}

/**
 * 获取数据包列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @param {string} params.filter - 过滤条件
 * @param {string} params.sort - 排序字段
 * @param {string} params.order - 排序方向
 */
export const getPackets = async (params = {}) => {
  const response = await api.get('/packets', { params })
  return response
}

/**
 * 获取单个数据包详情
 * @param {string} id - 数据包 ID
 */
export const getPacketDetail = async (id) => {
  const response = await api.get(`/packets/${id}`)
  return response
}

/**
 * 应用 BPF 过滤器
 * @param {string} filter - BPF 过滤表达式
 */
export const applyFilter = async (filter) => {
  const response = await api.post('/filter', { filter })
  return response
}

/**
 * 获取协议统计
 */
export const getProtocolStats = async () => {
  const response = await api.get('/stats/protocols')
  return response
}

/**
 * 获取流量统计
 */
export const getTrafficStats = async () => {
  const response = await api.get('/stats/traffic')
  return response
}

/**
 * 获取 IP 统计
 */
export const getIPStats = async () => {
  const response = await api.get('/stats/ips')
  return response
}

/**
 * 获取端口统计
 */
export const getPortStats = async () => {
  const response = await api.get('/stats/ports')
  return response
}

/**
 * 导出数据包
 * @param {string} format - 导出格式 (pcap, json, csv)
 * @param {string} filter - 可选的过滤条件
 */
export const exportPackets = async (format = 'pcap', filter = '') => {
  const response = await api.get('/export', {
    params: { format, filter },
    responseType: 'blob'
  })
  
  // 创建下载链接
  const blob = new Blob([response])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `packets.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  return response
}

/**
 * 开始实时捕获
 * @param {Object} options - 捕获选项
 * @param {string} options.interface - 网卡接口
 * @param {string} options.filter - BPF 过滤器
 */
export const startCapture = async (options = {}) => {
  const response = await api.post('/capture/start', options)
  return response
}

/**
 * 停止实时捕获
 */
export const stopCapture = async () => {
  const response = await api.post('/capture/stop')
  return response
}

/**
 * 获取网卡列表
 */
export const getInterfaces = async () => {
  const response = await api.get('/interfaces')
  return response
}

/**
 * 验证 BPF 表达式
 * @param {string} filter - BPF 表达式
 */
export const validateFilter = async (filter) => {
  const response = await api.post('/filter/validate', { filter })
  return response
}

export default api
