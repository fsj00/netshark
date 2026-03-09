// Package service 提供sharkd客户端管理服务
package service

import (
	"fmt"
	"netshark/internal/model"
	"netshark/pkg/sharkd"
	"sync"
)

// SharkdService sharkd服务接口
type SharkdService interface {
	// StartClient 启动sharkd客户端
	StartClient(sessionID, filePath string) error
	// StopClient 停止sharkd客户端
	StopClient(sessionID string) error
	// GetClient 获取客户端
	GetClient(sessionID string) (*sharkd.Client, bool)
	// Execute 执行命令
	Execute(sessionID string, fn func(*sharkd.Client) error) error
	// GetFrames 获取数据包列表
	GetFrames(sessionID string, start, end int, filter string) (*model.PacketsResponse, error)
	// GetFrame 获取单个数据包详情
	GetFrame(sessionID string, num int) (*model.PacketDetail, error)
	// GetStats 获取统计信息
	GetStats(sessionID string) (*model.Stats, error)
	// GetProtocols 获取协议统计
	GetProtocols(sessionID string) (*model.ProtocolsResponse, error)
	// CheckHealth 检查客户端健康状态
	CheckHealth(sessionID string) bool
	// StopAll 停止所有客户端
	StopAll()
}

// sharkdService sharkd服务实现
type sharkdService struct {
	clients    map[string]*sharkd.Client
	binaryPath string
	mu         sync.RWMutex
}

// NewSharkdService 创建新的sharkd服务
func NewSharkdService(binaryPath string) SharkdService {
	return &sharkdService{
		clients:    make(map[string]*sharkd.Client),
		binaryPath: binaryPath,
	}
}

// StartClient 启动sharkd客户端
func (s *sharkdService) StartClient(sessionID, filePath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 检查是否已存在
	if _, exists := s.clients[sessionID]; exists {
		return fmt.Errorf("client already exists for session: %s", sessionID)
	}

	// 创建新客户端
	client, err := sharkd.NewClient(s.binaryPath)
	if err != nil {
		return fmt.Errorf("failed to create sharkd client: %w", err)
	}

	// 加载PCAP文件
	if err := client.Load(filePath); err != nil {
		client.Close()
		return fmt.Errorf("failed to load pcap file: %w", err)
	}

	s.clients[sessionID] = client
	return nil
}

// StopClient 停止sharkd客户端
func (s *sharkdService) StopClient(sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	client, exists := s.clients[sessionID]
	if !exists {
		return nil // 客户端不存在，视为已停止
	}

	// 关闭客户端
	if err := client.Close(); err != nil {
		// 记录错误但继续清理
		// logger.Warnf("failed to close sharkd client: %v", err)
	}

	delete(s.clients, sessionID)
	return nil
}

// GetClient 获取客户端
func (s *sharkdService) GetClient(sessionID string) (*sharkd.Client, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	client, exists := s.clients[sessionID]
	return client, exists
}

// Execute 执行命令
func (s *sharkdService) Execute(sessionID string, fn func(*sharkd.Client) error) error {
	s.mu.RLock()
	client, exists := s.clients[sessionID]
	s.mu.RUnlock()

	if !exists {
		return fmt.Errorf("client not found for session: %s", sessionID)
	}

	return fn(client)
}

// GetFrames 获取数据包列表
func (s *sharkdService) GetFrames(sessionID string, start, end int, filter string) (*model.PacketsResponse, error) {
	client, exists := s.GetClient(sessionID)
	if !exists {
		return nil, fmt.Errorf("session not found or expired")
	}

	frames, err := client.Frames(start, end, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get frames: %w", err)
	}

	// 转换为模型
	packets := make([]model.Packet, len(frames))
	for i, frame := range frames {
		packets[i] = model.Packet{
			Num:      frame.Num,
			Time:     frame.Time,
			Src:      frame.Src,
			Dst:      frame.Dst,
			Protocol: frame.Protocol,
			Length:   frame.Length,
			Info:     frame.Info,
		}
	}

	// 获取总数
	stats, err := client.Stats()
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	return &model.PacketsResponse{
		Total:   stats.Frames,
		Offset:  start,
		Limit:   end - start,
		Packets: packets,
	}, nil
}

// GetFrame 获取单个数据包详情
func (s *sharkdService) GetFrame(sessionID string, num int) (*model.PacketDetail, error) {
	client, exists := s.GetClient(sessionID)
	if !exists {
		return nil, fmt.Errorf("session not found or expired")
	}

	frame, err := client.Frame(num)
	if err != nil {
		return nil, fmt.Errorf("failed to get frame: %w", err)
	}

	// 转换协议树
	tree := make([]model.ProtoNode, len(frame.Tree))
	for i, node := range frame.Tree {
		tree[i] = convertTreeNode(node)
	}

	return &model.PacketDetail{
		Packet: model.Packet{
			Num:      frame.Num,
			Time:     frame.Time,
			Src:      frame.Src,
			Dst:      frame.Dst,
			Protocol: frame.Protocol,
			Length:   frame.Length,
			Info:     frame.Info,
		},
		HexData: frame.Hex,
		Tree:    tree,
	}, nil
}

// convertTreeNode 转换协议树节点
func convertTreeNode(node sharkd.TreeNode) model.ProtoNode {
	children := make([]model.ProtoNode, len(node.Children))
	for i, child := range node.Children {
		children[i] = convertTreeNode(child)
	}

	return model.ProtoNode{
		Label:    node.Label,
		Value:    node.Value,
		Children: children,
		Start:    node.Start,
		Length:   node.Length,
	}
}

// GetStats 获取统计信息
func (s *sharkdService) GetStats(sessionID string) (*model.Stats, error) {
	client, exists := s.GetClient(sessionID)
	if !exists {
		return nil, fmt.Errorf("session not found or expired")
	}

	stats, err := client.Stats()
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	return &model.Stats{
		TotalPackets: stats.Frames,
		TotalBytes:   stats.Bytes,
		Duration:     stats.Duration,
	}, nil
}

// GetProtocols 获取协议统计
func (s *sharkdService) GetProtocols(sessionID string) (*model.ProtocolsResponse, error) {
	client, exists := s.GetClient(sessionID)
	if !exists {
		return nil, fmt.Errorf("session not found or expired")
	}

	protocols, err := client.Protocols()
	if err != nil {
		return nil, fmt.Errorf("failed to get protocols: %w", err)
	}

	// 计算总数
	var total int
	for _, p := range protocols {
		total += p.Count
	}

	// 转换为模型
	stats := make([]model.ProtocolStats, len(protocols))
	for i, p := range protocols {
		percentage := 0.0
		if total > 0 {
			percentage = float64(p.Count) * 100 / float64(total)
		}
		stats[i] = model.ProtocolStats{
			Protocol:   p.Name,
			Count:      p.Count,
			Bytes:      p.Bytes,
			Percentage: percentage,
		}
	}

	return &model.ProtocolsResponse{
		Total:     total,
		Protocols: stats,
	}, nil
}

// CheckHealth 检查客户端健康状态
func (s *sharkdService) CheckHealth(sessionID string) bool {
	s.mu.RLock()
	client, exists := s.clients[sessionID]
	s.mu.RUnlock()

	if !exists {
		return false
	}

	// 尝试获取统计信息来检查健康状态
	_, err := client.Stats()
	return err == nil
}

// StopAll 停止所有客户端
func (s *sharkdService) StopAll() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for sessionID, client := range s.clients {
		if err := client.Close(); err != nil {
			// 记录错误
			_ = sessionID // 避免未使用变量警告
		}
		delete(s.clients, sessionID)
	}
}
