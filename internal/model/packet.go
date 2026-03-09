package model

// Packet 数据包概要信息
type Packet struct {
	// Num 数据包序号
	Num int `json:"num"`
	// Time 时间戳(相对于捕获开始)
	Time string `json:"time"`
	// Src 源地址
	Src string `json:"src"`
	// Dst 目标地址
	Dst string `json:"dst"`
	// Protocol 协议类型
	Protocol string `json:"protocol"`
	// Length 数据包长度
	Length int `json:"length"`
	// Info 概要信息
	Info string `json:"info"`
}

// PacketDetail 数据包详细信息
type PacketDetail struct {
	Packet
	// HexData 十六进制数据
	HexData string `json:"hex_data,omitempty"`
	// Tree 协议解析树
	Tree []ProtoNode `json:"tree,omitempty"`
}

// ProtoNode 协议树节点
type ProtoNode struct {
	// Label 节点标签
	Label string `json:"label"`
	// Value 节点值
	Value string `json:"value,omitempty"`
	// Children 子节点
	Children []ProtoNode `json:"children,omitempty"`
	// Start 数据起始位置
	Start int `json:"start,omitempty"`
	// Length 数据长度
	Length int `json:"length,omitempty"`
}

// PacketsResponse 数据包列表响应
type PacketsResponse struct {
	Total   int      `json:"total"`
	Offset  int      `json:"offset"`
	Limit   int      `json:"limit"`
	Packets []Packet `json:"packets"`
}

// PacketListParams 数据包列表查询参数
type PacketListParams struct {
	Offset int    `form:"offset,default=0"`
	Limit  int    `form:"limit,default=100"`
	Filter string `form:"filter"`
}

// Stats 统计信息
type Stats struct {
	// TotalPackets 总数据包数
	TotalPackets int `json:"total_packets"`
	// TotalBytes 总字节数
	TotalBytes int64 `json:"total_bytes"`
	// Duration 捕获时长(秒)
	Duration float64 `json:"duration"`
	// StartTime 开始时间
	StartTime string `json:"start_time"`
	// EndTime 结束时间
	EndTime string `json:"end_time"`
}

// ProtocolStats 协议统计
type ProtocolStats struct {
	// Protocol 协议名称
	Protocol string `json:"protocol"`
	// Count 数据包数量
	Count int `json:"count"`
	// Bytes 字节数
	Bytes int64 `json:"bytes"`
	// Percentage 百分比
	Percentage float64 `json:"percentage"`
}

// ProtocolsResponse 协议分布响应
type ProtocolsResponse struct {
	Total     int             `json:"total"`
	Protocols []ProtocolStats `json:"protocols"`
}
