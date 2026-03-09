// Package service 提供会话管理服务
package service

import (
	"context"
	"fmt"
	"log"
	"netshark/internal/model"
	"netshark/internal/repository"
	"netshark/pkg/sharkd"
	"sync"
	"time"

	"github.com/google/uuid"
)

// SessionService 会话服务
type SessionService struct {
	repo         *repository.SessionRepository
	fileRepo     *repository.FileRepository
	timeout      time.Duration
	sharkdPath   string
	clients      map[string]*sharkd.Client
	clientsMu    sync.RWMutex
}

// NewSessionService 创建会话服务
func NewSessionService(repo *repository.SessionRepository, fileRepo *repository.FileRepository, timeout time.Duration, sharkdPath string) *SessionService {
	return &SessionService{
		repo:       repo,
		fileRepo:   fileRepo,
		timeout:    timeout,
		sharkdPath: sharkdPath,
		clients:    make(map[string]*sharkd.Client),
	}
}

// CreateSession 创建新会话
func (s *SessionService) CreateSession(fileID string) (*model.SessionResponse, error) {
	// 检查文件是否存在
	filePath, err := s.fileRepo.GetFilePath(fileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	// 创建sharkd客户端
	client, err := sharkd.NewClient(s.sharkdPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create sharkd client: %w", err)
	}

	// 加载文件
	if err := client.Load(filePath); err != nil {
		client.Close()
		return nil, fmt.Errorf("failed to load pcap file: %w", err)
	}

	// 创建会话
	now := time.Now()
	session := &model.Session{
		SessionID:    uuid.New().String(),
		FileID:       fileID,
		FilePath:     filePath,
		CreatedAt:    now,
		ExpiresAt:    now.Add(s.timeout),
		LastAccessed: now,
	}

	// 保存会话
	s.repo.SaveSession(session)

	// 保存客户端
	s.clientsMu.Lock()
	s.clients[session.SessionID] = client
	s.clientsMu.Unlock()

	log.Printf("Created session %s for file %s", session.SessionID, fileID)

	return &model.SessionResponse{
		SessionID: session.SessionID,
		FileID:    session.FileID,
		CreatedAt: session.CreatedAt,
		ExpiresAt: session.ExpiresAt,
	}, nil
}

// GetSession 获取会话
func (s *SessionService) GetSession(sessionID string) (*model.Session, error) {
	session, ok := s.repo.GetSession(sessionID)
	if !ok {
		return nil, fmt.Errorf("session not found or expired: %s", sessionID)
	}

	// 刷新过期时间
	s.repo.RefreshSession(sessionID, s.timeout)

	return session, nil
}

// GetClient 获取sharkd客户端
func (s *SessionService) GetClient(sessionID string) (*sharkd.Client, error) {
	// 先检查会话是否存在
	_, err := s.GetSession(sessionID)
	if err != nil {
		return nil, err
	}

	s.clientsMu.RLock()
	client, ok := s.clients[sessionID]
	s.clientsMu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("sharkd client not found for session: %s", sessionID)
	}

	return client, nil
}

// CloseSession 关闭会话
func (s *SessionService) CloseSession(sessionID string) error {
	// 关闭sharkd客户端
	s.clientsMu.Lock()
	if client, ok := s.clients[sessionID]; ok {
		client.Close()
		delete(s.clients, sessionID)
	}
	s.clientsMu.Unlock()

	// 删除会话
	if err := s.repo.DeleteSession(sessionID); err != nil {
		return err
	}

	log.Printf("Closed session %s", sessionID)
	return nil
}

// CleanupExpiredSessions 定期清理过期会话
func (s *SessionService) CleanupExpiredSessions(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.cleanup()
		}
	}
}

// cleanup 清理过期会话
func (s *SessionService) cleanup() {
	expiredIDs := s.repo.CleanupExpired()

	s.clientsMu.Lock()
	for _, id := range expiredIDs {
		if client, ok := s.clients[id]; ok {
			client.Close()
			delete(s.clients, id)
			log.Printf("Cleaned up expired session %s", id)
		}
	}
	s.clientsMu.Unlock()
}

// CloseAllSessions 关闭所有会话
func (s *SessionService) CloseAllSessions() {
	s.clientsMu.Lock()
	for id, client := range s.clients {
		client.Close()
		delete(s.clients, id)
		log.Printf("Closed session %s", id)
	}
	s.clientsMu.Unlock()

	// 清理所有会话记录
	sessions := s.repo.GetAllSessions()
	for _, session := range sessions {
		s.repo.DeleteSession(session.SessionID)
	}
}

// ListSessions 列出所有活跃会话
func (s *SessionService) ListSessions() []*model.Session {
	return s.repo.GetAllSessions()
}
