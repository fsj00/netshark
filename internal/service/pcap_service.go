// Package service 提供PCAP文件服务
package service

import (
	"fmt"
	"io"
	"netshark/internal/model"
	"netshark/internal/repository"
	"time"
)

// PCAPService PCAP服务接口
type PCAPService interface {
	// Upload 上传文件
	Upload(filename string, reader io.Reader) (*model.UploadResponse, error)
	// GetFile 获取文件信息
	GetFile(fileID string) (*model.PCAPFile, bool)
	// ListFiles 获取文件列表
	ListFiles() []*model.PCAPFile
	// DeleteFile 删除文件
	DeleteFile(fileID string) error
	// CleanupExpiredFiles 清理过期文件
	CleanupExpiredFiles() error
}

// pcapService PCAP服务实现
type pcapService struct {
	fileRepo      repository.FileRepository
	expireDays    int
	maxFileSize   int64
}

// NewPCAPService 创建新的PCAP服务
func NewPCAPService(fileRepo repository.FileRepository, expireDays int, maxFileSize int64) PCAPService {
	return &pcapService{
		fileRepo:    fileRepo,
		expireDays:  expireDays,
		maxFileSize: maxFileSize,
	}
}

// Upload 上传文件
func (s *pcapService) Upload(filename string, reader io.Reader) (*model.UploadResponse, error) {
	// 保存文件
	file, err := s.fileRepo.Save(filename, reader)
	if err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// 检查文件是否已存在（通过对比创建时间和最后访问时间）
	exists := file.CreatedAt.Before(file.LastAccessed.Add(-time.Second))

	return &model.UploadResponse{
		FileID:   file.FileID,
		SHA256:   file.SHA256,
		Filename: file.Filename,
		Size:     file.Size,
		Exists:   exists,
	}, nil
}

// GetFile 获取文件信息
func (s *pcapService) GetFile(fileID string) (*model.PCAPFile, bool) {
	return s.fileRepo.GetByID(fileID)
}

// ListFiles 获取文件列表
func (s *pcapService) ListFiles() []*model.PCAPFile {
	return s.fileRepo.List()
}

// DeleteFile 删除文件
func (s *pcapService) DeleteFile(fileID string) error {
	return s.fileRepo.Delete(fileID)
}

// CleanupExpiredFiles 清理过期文件
func (s *pcapService) CleanupExpiredFiles() error {
	maxAge := time.Duration(s.expireDays) * 24 * time.Hour
	return s.fileRepo.CleanupExpired(maxAge)
}
