// Package model 定义数据模型
package model

import (
	"time"
)

// PCAPFile PCAP文件信息
type PCAPFile struct {
	// FileID 文件唯一标识 (SHA256前16位)
	FileID string `json:"file_id"`
	// SHA256 完整SHA256哈希
	SHA256 string `json:"sha256"`
	// Filename 原始文件名
	Filename string `json:"filename"`
	// Size 文件大小(字节)
	Size int64 `json:"size"`
	// Path 文件存储路径
	Path string `json:"-"`
	// CreatedAt 创建时间
	CreatedAt time.Time `json:"created_at"`
	// LastAccessed 最后访问时间
	LastAccessed time.Time `json:"last_accessed"`
}

// UploadResponse 上传响应
type UploadResponse struct {
	FileID   string `json:"file_id"`
	SHA256   string `json:"sha256"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	Exists   bool   `json:"exists"`
}
