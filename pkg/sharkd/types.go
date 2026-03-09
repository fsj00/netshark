// Package sharkd 提供sharkd JSON-RPC客户端
package sharkd

import "encoding/json"

// JSONRPCRequest JSON-RPC请求
type JSONRPCRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
	ID      int         `json:"id"`
}

// JSONRPCResponse JSON-RPC响应
type JSONRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *JSONRPCError   `json:"error,omitempty"`
	ID      int             `json:"id"`
}

// JSONRPCError JSON-RPC错误
type JSONRPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Error 实现error接口
func (e *JSONRPCError) Error() string {
	return e.Message
}

// LoadParams 加载文件参数
type LoadParams struct {
	File string `json:"file"`
}

// LoadResult 加载结果
type LoadResult struct {
	Status string `json:"status"`
}

// FramesParams 获取数据包列表参数
type FramesParams struct {
	Range  []int  `json:"range,omitempty"`
	Filter string `json:"filter,omitempty"`
}

// FramesResult 数据包列表结果
type FramesResult struct {
	Frames []FrameInfo `json:"frames"`
}

// FrameInfo 数据包概要信息
type FrameInfo struct {
	Num      int    `json:"num"`
	Time     string `json:"time"`
	Src      string `json:"src"`
	Dst      string `json:"dst"`
	Protocol string `json:"protocol"`
	Length   int    `json:"length"`
	Info     string `json:"info"`
}

// FrameParams 获取单个数据包参数
type FrameParams struct {
	Frame int `json:"frame"`
}

// FrameResult 单个数据包结果
type FrameResult struct {
	Num      int        `json:"num"`
	Time     string     `json:"time"`
	Src      string     `json:"src"`
	Dst      string     `json:"dst"`
	Protocol string     `json:"protocol"`
	Length   int        `json:"length"`
	Info     string     `json:"info"`
	Hex      string     `json:"hex,omitempty"`
	Tree     []TreeNode `json:"tree,omitempty"`
}

// TreeNode 协议树节点
type TreeNode struct {
	Label    string     `json:"label"`
	Value    string     `json:"value,omitempty"`
	Children []TreeNode `json:"children,omitempty"`
	Start    int        `json:"start,omitempty"`
	Length   int        `json:"length,omitempty"`
}

// StatsResult 统计结果
type StatsResult struct {
	Frames   int     `json:"frames"`
	Bytes    int64   `json:"bytes"`
	Duration float64 `json:"duration"`
}

// ProtocolResult 协议统计结果
type ProtocolResult struct {
	Protocols []ProtocolInfo `json:"protocols"`
}

// ProtocolInfo 协议信息
type ProtocolInfo struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
	Bytes int64  `json:"bytes"`
}
