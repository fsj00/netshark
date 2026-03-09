package model

import (
	"time"
)

// Session 分析会话
type Session struct {
	// SessionID 会话ID
	SessionID string `json:"session_id"`
	// FileID 关联的文件ID
	FileID string `json:"file_id"`
	// FilePath PCAP文件路径
	FilePath string `json:"-"`
	// CreatedAt 创建时间
	CreatedAt time.Time `json:"created_at"`
	// ExpiresAt 过期时间
	ExpiresAt time.Time `json:"expires_at"`
	// LastAccessed 最后访问时间
	LastAccessed time.Time `json:"last_accessed"`
	// SharkdPID sharkd进程ID
	SharkdPID int `json:"-"`
}

// CreateSessionRequest 创建会话请求
type CreateSessionRequest struct {
	FileID string `json:"file_id" binding:"required"`
}

// SessionResponse 会话响应
type SessionResponse struct {
	SessionID string    `json:"session_id"`
	FileID    string    `json:"file_id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// IsExpired 检查会话是否已过期
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// Refresh 刷新会话过期时间
func (s *Session) Refresh(timeout time.Duration) {
	s.LastAccessed = time.Now()
	s.ExpiresAt = s.LastAccessed.Add(timeout)
}
