// Package repository 提供文件存储仓库
package repository

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"netshark/internal/model"
)

// FileRepository 文件仓库接口
type FileRepository interface {
	// Save 保存上传的文件，返回文件信息
	Save(filename string, reader io.Reader) (*model.PCAPFile, error)
	// GetByID 通过文件ID获取文件信息
	GetByID(fileID string) (*model.PCAPFile, bool)
	// GetByHash 通过SHA256哈希获取文件信息
	GetByHash(hash string) (*model.PCAPFile, bool)
	// GetFilePath 通过文件ID获取文件路径
	GetFilePath(fileID string) (string, error)
	// Delete 删除文件
	Delete(fileID string) error
	// List 获取文件列表
	List() []*model.PCAPFile
	// CleanupExpired 清理过期文件
	CleanupExpired(maxAge time.Duration) error
}

// fileRepository 文件仓库实现
type fileRepository struct {
	uploadDir string
	files     map[string]*model.PCAPFile // key: fileID
	hashIndex map[string]string          // key: sha256, value: fileID
	mu        sync.RWMutex
}

// NewFileRepository 创建新的文件仓库
func NewFileRepository(uploadDir string) (FileRepository, error) {
	// 确保上传目录存在
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	repo := &fileRepository{
		uploadDir: uploadDir,
		files:     make(map[string]*model.PCAPFile),
		hashIndex: make(map[string]string),
	}

	// 加载已存在的文件
	if err := repo.loadExistingFiles(); err != nil {
		return nil, fmt.Errorf("failed to load existing files: %w", err)
	}

	return repo, nil
}

// loadExistingFiles 加载已存在的文件到内存索引
func (r *fileRepository) loadExistingFiles() error {
	entries, err := os.ReadDir(r.uploadDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		fileID := entry.Name()
		path := filepath.Join(r.uploadDir, fileID)

		// 计算文件SHA256
		hash, err := r.calculateFileHash(path)
		if err != nil {
			continue
		}

		file := &model.PCAPFile{
			FileID:       fileID,
			SHA256:       hash,
			Filename:     fileID, // 使用fileID作为文件名
			Size:         info.Size(),
			Path:         path,
			CreatedAt:    info.ModTime(),
			LastAccessed: info.ModTime(),
		}

		r.files[fileID] = file
		r.hashIndex[hash] = fileID
	}

	return nil
}

// calculateFileHash 计算文件的SHA256哈希
func (r *fileRepository) calculateFileHash(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// calculateReaderHash 计算reader的SHA256哈希
func (r *fileRepository) calculateReaderHash(reader io.Reader) (string, error) {
	hash := sha256.New()
	if _, err := io.Copy(hash, reader); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

// Save 保存上传的文件
func (r *fileRepository) Save(filename string, reader io.Reader) (*model.PCAPFile, error) {
	// 首先将数据读取到内存中以计算哈希
	data, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read upload data: %w", err)
	}

	// 计算SHA256哈希
	hash := sha256.Sum256(data)
	hashStr := hex.EncodeToString(hash[:])

	// 检查文件是否已存在
	r.mu.Lock()
	if existingID, exists := r.hashIndex[hashStr]; exists {
		existingFile := r.files[existingID]
		existingFile.LastAccessed = time.Now()
		// 返回副本
		fileCopy := *existingFile
		r.mu.Unlock()
		return &fileCopy, nil
	}

	// 生成文件ID (使用哈希前16位)
	fileID := hashStr[:16]

	// 检查文件ID是否冲突
	if _, exists := r.files[fileID]; exists {
		// 如果ID冲突但哈希不同，添加时间戳后缀
		fileID = fmt.Sprintf("%s_%d", fileID, time.Now().UnixNano())
	}

	defer r.mu.Unlock()

	// 保存文件
	path := filepath.Join(r.uploadDir, fileID)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	now := time.Now()
	file := &model.PCAPFile{
		FileID:       fileID,
		SHA256:       hashStr,
		Filename:     filename,
		Size:         int64(len(data)),
		Path:         path,
		CreatedAt:    now,
		LastAccessed: now,
	}

	r.files[fileID] = file
	r.hashIndex[hashStr] = fileID

	return file, nil
}

// GetByID 通过文件ID获取文件信息
func (r *fileRepository) GetByID(fileID string) (*model.PCAPFile, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	file, exists := r.files[fileID]
	if !exists {
		return nil, false
	}
	// 更新访问时间
	file.LastAccessed = time.Now()
	// 返回副本避免外部修改
	fileCopy := *file
	return &fileCopy, true
}

// GetByHash 通过SHA256哈希获取文件信息
func (r *fileRepository) GetByHash(hash string) (*model.PCAPFile, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	fileID, exists := r.hashIndex[hash]
	if !exists {
		return nil, false
	}

	file := r.files[fileID]
	file.LastAccessed = time.Now()
	// 返回副本避免外部修改
	fileCopy := *file
	return &fileCopy, true
}

// Delete 删除文件
func (r *fileRepository) Delete(fileID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	file, exists := r.files[fileID]
	if !exists {
		return fmt.Errorf("file not found: %s", fileID)
	}

	// 删除物理文件
	if err := os.Remove(file.Path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	// 从索引中移除
	delete(r.hashIndex, file.SHA256)
	delete(r.files, fileID)

	return nil
}

// List 获取文件列表
func (r *fileRepository) List() []*model.PCAPFile {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*model.PCAPFile, 0, len(r.files))
	for _, file := range r.files {
		// 返回副本
		fileCopy := *file
		result = append(result, &fileCopy)
	}

	return result
}

// CleanupExpired 清理过期文件
func (r *fileRepository) CleanupExpired(maxAge time.Duration) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	var toDelete []string

	for fileID, file := range r.files {
		if now.Sub(file.LastAccessed) > maxAge {
			toDelete = append(toDelete, fileID)
		}
	}

	for _, fileID := range toDelete {
		file := r.files[fileID]
		if err := os.Remove(file.Path); err != nil && !os.IsNotExist(err) {
			continue // 继续删除其他文件
		}
		delete(r.hashIndex, file.SHA256)
		delete(r.files, fileID)
	}

	return nil
}

// GetFilePath 通过文件ID获取文件路径
func (r *fileRepository) GetFilePath(fileID string) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	file, exists := r.files[fileID]
	if !exists {
		return "", fmt.Errorf("file not found: %s", fileID)
	}
	return file.Path, nil
}

// DetectContentType 检测文件内容类型
func DetectContentType(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	// 读取前512字节用于检测
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", err
	}

	return http.DetectContentType(buffer[:n]), nil
}
