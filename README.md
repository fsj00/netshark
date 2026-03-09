# NetShark - 在线PCAP文件解析分析工具

基于Web的PCAP文件分析工具，使用sharkd提供数据包解析功能，支持文件上传、会话管理、数据包分析和统计。

## 功能特性

- 📁 **文件上传** - 支持拖拽上传PCAP/PCAPNG/CAP文件
- 🔍 **数据包分析** - 查看数据包列表和详细信息
- 📊 **统计分析** - 协议分布、流量趋势等统计信息
- 🔎 **BPF过滤** - 支持BPF语法过滤数据包
- 🌲 **协议解析** - 树形结构展示协议层次
- 🔢 **十六进制** - 原始数据十六进制查看
- 🚀 **高性能** - 虚拟滚动优化大数据量展示

## 技术栈

- **后端**: Go + Gin框架
- **前端**: HTML + JavaScript (原生，无框架)
- **解析引擎**: sharkd (Wireshark JSON-RPC)
- **存储**: 本地文件系统 (SHA256命名去重)

## 安装要求

- Go 1.21+
- Wireshark (包含sharkd)
- Linux/macOS/Windows

### 安装Wireshark/sharkd

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install wireshark
```

**macOS:**
```bash
brew install wireshark
```

**CentOS/RHEL:**
```bash
sudo yum install wireshark
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repository>
cd netshark
```

### 2. 安装依赖

```bash
go mod download
```

### 3. 运行服务

```bash
go run cmd/server/main.go
```

或使用Makefile:

```bash
make run
```

### 4. 访问Web界面

打开浏览器访问: http://localhost:8080

## 项目结构

```
netshark/
├── cmd/
│   └── server/
│       └── main.go              # 程序入口
├── internal/
│   ├── config/
│   │   └── config.go            # 配置管理
│   ├── handler/
│   │   ├── pcap_handler.go      # PCAP文件处理
│   │   ├── session_handler.go   # 会话管理
│   │   ├── packet_handler.go    # 数据包查询
│   │   └── stats_handler.go     # 统计分析
│   ├── service/
│   │   ├── pcap_service.go      # PCAP服务
│   │   ├── sharkd_service.go    # sharkd进程管理
│   │   └── session_service.go   # 会话管理服务
│   ├── model/
│   │   ├── pcap_file.go         # PCAP文件模型
│   │   ├── session.go           # 会话模型
│   │   └── packet.go            # 数据包模型
│   ├── repository/
│   │   └── file_repository.go   # 文件存储
│   └── middleware/
│       └── cors.go              # CORS中间件
├── web/
│   ├── index.html               # 主页面
│   ├── css/
│   │   └── style.css            # 样式
│   └── js/
│       ├── app.js               # 主应用逻辑
│       ├── upload.js            # 文件上传
│       ├── packets.js           # 数据包列表
│       ├── detail.js            # 数据包详情
│       └── stats.js             # 统计分析
├── pkg/
│   └── sharkd/
│       ├── client.go            # sharkd JSON-RPC客户端
│       └── types.go             # sharkd类型定义
├── uploads/                     # PCAP文件存储目录
├── go.mod
├── go.sum
├── README.md
└── Makefile
```

## API文档

### 上传文件

```
POST /api/v1/upload
Content-Type: multipart/form-data

Response:
{
  "code": 0,
  "data": {
    "file_id": "abc123...",
    "sha256": "full_sha256_hash",
    "filename": "test.pcap",
    "size": 1234567,
    "exists": false
  }
}
```

### 创建会话

```
POST /api/v1/sessions
{
  "file_id": "abc123..."
}

Response:
{
  "code": 0,
  "data": {
    "session_id": "sess_xyz789",
    "file_id": "abc123...",
    "created_at": "2024-01-01T12:00:00Z",
    "expires_at": "2024-01-01T12:30:00Z"
  }
}
```

### 获取数据包列表

```
GET /api/v1/sessions/:id/packets?offset=0&limit=100&filter=tcp

Response:
{
  "code": 0,
  "data": {
    "total": 10000,
    "offset": 0,
    "limit": 100,
    "packets": [
      {
        "num": 1,
        "time": "0.000000",
        "src": "192.168.1.1",
        "dst": "192.168.1.2",
        "protocol": "TCP",
        "length": 64,
        "info": "SYN Seq=0"
      }
    ]
  }
}
```

### 获取数据包详情

```
GET /api/v1/sessions/:id/packets/:num

Response:
{
  "code": 0,
  "data": {
    "num": 1,
    "time": "0.000000",
    "src": "192.168.1.1",
    "dst": "192.168.1.2",
    "protocol": "TCP",
    "length": 64,
    "info": "SYN Seq=0",
    "hex_data": "...",
    "tree": [...]
  }
}
```

### 获取统计信息

```
GET /api/v1/sessions/:id/stats

Response:
{
  "code": 0,
  "data": {
    "total_packets": 10000,
    "total_bytes": 1234567,
    "duration": 10.5
  }
}
```

### 获取协议分布

```
GET /api/v1/sessions/:id/protocols

Response:
{
  "code": 0,
  "data": {
    "total": 10000,
    "protocols": [
      {
        "protocol": "TCP",
        "count": 5000,
        "bytes": 1000000,
        "percentage": 50.0
      }
    ]
  }
}
```

## 配置

通过环境变量配置:

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| SERVER_HOST | 0.0.0.0 | 服务器监听地址 |
| SERVER_PORT | 8080 | 服务器端口 |
| UPLOAD_DIR | ./uploads | 上传文件存储目录 |
| MAX_FILE_SIZE | 104857600 | 最大文件大小(字节) |
| FILE_EXPIRE_DAYS | 7 | 文件过期天数 |
| SESSION_TIMEOUT_MINUTES | 30 | 会话超时时间(分钟) |
| SHARKD_PATH | sharkd | sharkd可执行文件路径 |

## 构建

### 本地构建

```bash
make build
```

### 交叉编译

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o netshark-linux cmd/server/main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o netshark-darwin cmd/server/main.go

# Windows
GOOS=windows GOARCH=amd64 go build -o netshark.exe cmd/server/main.go
```

## 运行

### 直接运行

```bash
./netshark
```

### 指定配置

```bash
SERVER_PORT=3000 SHARKD_PATH=/usr/bin/sharkd ./netshark
```

## 开发

### 运行测试

```bash
go test ./...
```

### 代码格式化

```bash
go fmt ./...
```

## BPF过滤语法

支持标准BPF过滤语法:

- `ip` - 仅显示IP数据包
- `tcp` - 仅显示TCP数据包
- `udp` - 仅显示UDP数据包
- `port 80` - 仅显示端口80的数据包
- `host 192.168.1.1` - 仅显示特定主机的数据包
- `tcp port 80` - 仅显示TCP端口80的数据包
- `ip.src == 192.168.1.1` - 仅显示来自特定IP的数据包

## 注意事项

1. 确保sharkd在系统PATH中或正确配置SHARKD_PATH
2. 上传的PCAP文件会被计算SHA256并去重存储
3. 会话默认30分钟无操作后自动过期
4. 上传文件默认7天后自动清理
5. 大文件分析可能需要较长时间，请耐心等待

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request!

## 致谢

- [Wireshark](https://www.wireshark.org/) - 提供sharkd解析引擎
- [Gin](https://gin-gonic.com/) - Web框架
