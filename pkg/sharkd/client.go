package sharkd

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"sync"
	"sync/atomic"
)

// Client sharkd JSON-RPC客户端
type Client struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout *bufio.Reader
	stderr io.ReadCloser
	
	// 请求ID生成器
	idCounter int64
	
	// 响应等待映射
	pending map[int]chan *JSONRPCResponse
	mu      sync.RWMutex
	
	// 关闭信号
	closed chan struct{}
	done   chan struct{}
}

// NewClient 创建新的sharkd客户端
func NewClient(binaryPath string) (*Client, error) {
	// 启动sharkd进程
	cmd := exec.Command(binaryPath, "-")
	
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdin pipe: %w", err)
	}
	
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}
	
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}
	
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start sharkd: %w", err)
	}
	
	client := &Client{
		cmd:       cmd,
		stdin:     stdin,
		stdout:    bufio.NewReader(stdout),
		stderr:    stderr,
		idCounter: 0,
		pending:   make(map[int]chan *JSONRPCResponse),
		closed:    make(chan struct{}),
		done:      make(chan struct{}),
	}
	
	// 启动响应读取goroutine
	go client.readResponses()
	
	return client, nil
}

// readResponses 读取sharkd响应
func (c *Client) readResponses() {
	defer close(c.done)
	
	for {
		select {
		case <-c.closed:
			return
		default:
		}
		
		// 读取一行响应
		line, err := c.stdout.ReadString('\n')
		if err != nil {
			if err != io.EOF {
				// 记录错误但不退出，等待关闭信号
				select {
				case <-c.closed:
					return
				case <-c.done:
					return
				}
			}
			return
		}
		
		// 解析响应
		var resp JSONRPCResponse
		if err := json.Unmarshal([]byte(line), &resp); err != nil {
			continue
		}
		
		// 分发给等待的调用者
		c.mu.RLock()
		ch, ok := c.pending[resp.ID]
		c.mu.RUnlock()
		
		if ok {
			select {
			case ch <- &resp:
			case <-c.closed:
				return
			}
		}
	}
}

// call 发送JSON-RPC调用
func (c *Client) call(method string, params interface{}) (*JSONRPCResponse, error) {
	select {
	case <-c.closed:
		return nil, fmt.Errorf("client is closed")
	default:
	}
	
	// 生成请求ID
	id := int(atomic.AddInt64(&c.idCounter, 1))
	
	// 创建响应通道
	respChan := make(chan *JSONRPCResponse, 1)
	
	c.mu.Lock()
	c.pending[id] = respChan
	c.mu.Unlock()
	
	defer func() {
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
	}()
	
	// 构建请求
	req := JSONRPCRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      id,
	}
	
	data, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}
	
	// 发送请求
	if _, err := c.stdin.Write(append(data, '\n')); err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	
	// 等待响应
	select {
	case resp := <-respChan:
		return resp, nil
	case <-c.closed:
		return nil, fmt.Errorf("client is closed")
	}
}

// Load 加载PCAP文件
func (c *Client) Load(filePath string) error {
	resp, err := c.call("load", LoadParams{File: filePath})
	if err != nil {
		return err
	}
	
	if resp.Error != nil {
		return resp.Error
	}
	
	var result LoadResult
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return fmt.Errorf("failed to unmarshal result: %w", err)
	}
	
	if result.Status != "OK" {
		return fmt.Errorf("load failed: %s", result.Status)
	}
	
	return nil
}

// Frames 获取数据包列表
func (c *Client) Frames(start, end int, filter string) ([]FrameInfo, error) {
	params := FramesParams{
		Range: []int{start, end},
	}
	if filter != "" {
		params.Filter = filter
	}
	
	resp, err := c.call("frames", params)
	if err != nil {
		return nil, err
	}
	
	if resp.Error != nil {
		return nil, resp.Error
	}
	
	var result FramesResult
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}
	
	return result.Frames, nil
}

// Frame 获取单个数据包详情
func (c *Client) Frame(num int) (*FrameResult, error) {
	resp, err := c.call("frame", FrameParams{Frame: num})
	if err != nil {
		return nil, err
	}
	
	if resp.Error != nil {
		return nil, resp.Error
	}
	
	var result FrameResult
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}
	
	return &result, nil
}

// Stats 获取统计信息
func (c *Client) Stats() (*StatsResult, error) {
	resp, err := c.call("stats", struct{}{})
	if err != nil {
		return nil, err
	}
	
	if resp.Error != nil {
		return nil, resp.Error
	}
	
	var result StatsResult
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}
	
	return &result, nil
}

// Protocols 获取协议统计
func (c *Client) Protocols() ([]ProtocolInfo, error) {
	resp, err := c.call("protocols", struct{}{})
	if err != nil {
		return nil, err
	}
	
	if resp.Error != nil {
		return nil, resp.Error
	}
	
	var result ProtocolResult
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}
	
	return result.Protocols, nil
}

// Close 关闭客户端
func (c *Client) Close() error {
	close(c.closed)
	
	// 关闭stdin以通知sharkd退出
	c.stdin.Close()
	
	// 等待响应读取goroutine退出
	<-c.done
	
	// 等待进程退出
	return c.cmd.Wait()
}
