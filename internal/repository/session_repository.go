// Package repository 提供会话存储仓库
package repository

import (
	"sync"
	"time"

	"netshark/internal/model"
)

// SessionRepository 会话仓库
type SessionRepository struct {
	sessions map[string]*model.Session
	mu       sync.RWMutex
}

// NewSessionRepository 创建新的会话仓库
func NewSessionRepository() *SessionRepository {
	return &SessionRepository{
		sessions: make(map[string]*model.Session),
	}
}

// SaveSession 保存会话
func (r *SessionRepository) SaveSession(session *model.Session) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[session.SessionID] = session
}

// GetSession 获取会话
func (r *SessionRepository) GetSession(sessionID string) (*model.Session, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	session, exists := r.sessions[sessionID]
	return session, exists
}

// DeleteSession 删除会话
func (r *SessionRepository) DeleteSession(sessionID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, sessionID)
	return nil
}

// RefreshSession 刷新会话过期时间
func (r *SessionRepository) RefreshSession(sessionID string, timeout time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if session, exists := r.sessions[sessionID]; exists {
		session.LastAccessed = time.Now()
		session.ExpiresAt = session.LastAccessed.Add(timeout)
	}
}

// CleanupExpired 清理过期会话，返回被清理的会话ID列表
func (r *SessionRepository) CleanupExpired() []string {
	r.mu.Lock()
	defer r.mu.Unlock()

	var expired []string
	now := time.Now()
	for id, session := range r.sessions {
		if now.After(session.ExpiresAt) {
			expired = append(expired, id)
			delete(r.sessions, id)
		}
	}
	return expired
}

// GetAllSessions 获取所有会话
func (r *SessionRepository) GetAllSessions() []*model.Session {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*model.Session, 0, len(r.sessions))
	for _, session := range r.sessions {
		// 返回副本避免外部修改
		sessionCopy := *session
		result = append(result, &sessionCopy)
	}
	return result
}
