# NetShark 项目代码审查报告

## 审查摘要

**审查结果: 需修改**

本次审查发现了若干需要修复的问题，主要集中在并发安全、错误处理、资源管理和代码一致性方面。修复后项目质量将有显著提升。

---

## 发现的问题列表

### 1. 代码一致性问题 (高优先级)

**问题描述**: 
- `main.go` 中创建服务时使用了 `NewPCAPService(cfg.Upload.UploadDir)` 单参数版本
- 但 `pcap_service.go` 中定义的是 `NewPCAPService(fileRepo, expireDays, maxFileSize)` 三参数版本
- 这会导致编译错误

**影响文件**:
- `/root/.openclaw/workspace/netshark/cmd/server/main.go`
- `/root/.openclaw/workspace/netshark/internal/service/pcap_service.go`

### 2. 服务初始化不匹配 (高优先级)

**问题描述**:
- `main.go` 中创建 `SessionService` 使用了 `NewSessionService(cfg.Session.Timeout, sharkdSvc, pcapSvc)` 三参数
- 但 `session_service.go` 定义的是 `NewSessionService(repo, fileRepo, timeout, sharkdPath)` 四参数
- 缺少 SessionRepository 的创建和传递

**影响文件**:
- `/root/.openclaw/workspace/netshark/cmd/server/main.go`
- `/root/.openclaw/workspace/netshark/internal/service/session_service.go`

### 3. 缺少 SessionRepository 实现 (高优先级)

**问题描述**:
- `session_service.go` 依赖 `repository.SessionRepository`
- 但审查的文件列表中没有找到 `session_repository.go` 文件

**影响文件**:
- `/root/.openclaw/workspace/netshark/internal/repository/` (缺失文件)

### 4. 并发安全问题 (中优先级)

**问题描述**:
- `file_repository.go` 中的 `GetByID` 和 `GetByHash` 方法在返回文件对象后，调用者可以直接修改文件对象
- 虽然设置了 `LastAccessed`，但返回的指针可能被外部修改，导致数据竞争

**代码位置**:
```go
func (r *fileRepository) GetByID(fileID string) (*model.PCAPFile, bool) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    file, exists := r.files[fileID]
    if exists {
        file.LastAccessed = time.Now()  // 在RLock内修改，不安全
    }
    return file, exists  // 返回内部指针，外部可修改
}
```

### 5. 错误处理不完整 (中优先级)

**问题描述**:
- `sharkd/client.go` 中的 `readResponses` 方法在读取错误时可能无限循环
- `Close` 方法没有处理 `cmd.Wait()` 的错误返回值
- 多个地方使用了 `_ = sessionID` 来避免未使用变量警告，应该使用更优雅的方式

### 6. 资源泄漏风险 (中优先级)

**问题描述**:
- `pcap_handler.go` 中的 `Upload` 方法虽然调用了 `defer file.Close()`，但如果 `h.service.UploadFile` 耗时较长，文件句柄保持打开时间也较长
- `sharkd/client.go` 的 `stderr` 管道创建后没有读取，可能导致缓冲区满阻塞

### 7. 前端 API 路径不一致 (中优先级)

**问题描述**:
- 前端 `app.js` 定义了 `const API_BASE = '/api/v1'`
- 但 `upload.js` 和 `files.js` 中有些地方直接使用 `/api/v1`，有些使用 `${API_BASE}`
- 且后端路由注册在 `/api/v1` 组下，但前端有些请求路径缺少 `/api/v1` 前缀

### 8. 缺少输入验证 (中优先级)

**问题描述**:
- `packet_handler.go` 中的 `GetPacket` 方法没有验证 `num` 是否为正数
- `packet_handler.go` 中的 `ListPackets` 方法没有验证 `offset` 是否为非负数
- `pcap_handler.go` 中的 `GetFile` 没有验证 fileID 格式

### 9. 竞态条件 (低优先级)

**问题描述**:
- `sharkd_service.go` 中的 `GetFrames`、`GetFrame`、`GetStats`、`GetProtocols` 方法先调用 `GetClient` 获取客户端，然后使用客户端
- 如果在获取和使用之间客户端被关闭，可能导致问题
- 应该在同一个锁保护下完成操作

### 10. 魔法数字 (低优先级)

**问题描述**:
- `packet_handler.go` 中的分页限制使用了硬编码的 1000 和 100
- `session_service.go` 中的清理间隔使用了硬编码的 5 分钟
- 应该定义为常量

---

## 修复建议

### 1. 修复服务初始化问题

统一服务构造函数参数，确保 `main.go` 和服务实现一致：

```go
// pcap_service.go - 修改接口以匹配实际使用
func NewPCAPService(fileRepo repository.FileRepository) *PCAPService {
    return &pcapService{
        fileRepo: fileRepo,
    }
}
```

### 2. 实现 SessionRepository

创建 `internal/repository/session_repository.go`：

```go
package repository

import (
    "sync"
    "time"
    "netshark/internal/model"
)

type SessionRepository struct {
    sessions map[string]*model.Session
    mu       sync.RWMutex
}

func NewSessionRepository() *SessionRepository {
    return &SessionRepository{
        sessions: make(map[string]*model.Session),
    }
}

func (r *SessionRepository) SaveSession(session *model.Session) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.sessions[session.SessionID] = session
}

func (r *SessionRepository) GetSession(sessionID string) (*model.Session, bool) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    session, exists := r.sessions[sessionID]
    return session, exists
}

func (r *SessionRepository) DeleteSession(sessionID string) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    delete(r.sessions, sessionID)
    return nil
}

func (r *SessionRepository) RefreshSession(sessionID string, timeout time.Duration) {
    r.mu.Lock()
    defer r.mu.Unlock()
    if session, exists := r.sessions[sessionID]; exists {
        session.LastAccessed = time.Now()
        session.ExpiresAt = session.LastAccessed.Add(timeout)
    }
}

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

func (r *SessionRepository) GetAllSessions() []*model.Session {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    result := make([]*model.Session, 0, len(r.sessions))
    for _, session := range r.sessions {
        result = append(result, session)
    }
    return result
}

func (r *SessionRepository) GetFilePath(fileID string) (string, error) {
    // 这个方法应该在 FileRepository 中
    return "", nil
}
```

### 3. 修复并发安全问题

修改 `file_repository.go` 返回副本而不是原始指针：

```go
func (r *fileRepository) GetByID(fileID string) (*model.PCAPFile, bool) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    file, exists := r.files[fileID]
    if !exists {
        return nil, false
    }
    
    // 返回副本
    fileCopy := *file
    fileCopy.LastAccessed = time.Now()
    return &fileCopy, true
}
```

### 4. 添加输入验证

在 handler 中添加参数验证：

```go
func (h *PacketHandler) GetPacket(c *gin.Context) {
    // ...
    num, err := strconv.Atoi(numStr)
    if err != nil || num <= 0 {
        c.JSON(http.StatusBadRequest, gin.H{
            "code":    400,
            "message": "Invalid packet number",
        })
        return
    }
    // ...
}
```

### 5. 修复资源泄漏

在 `sharkd/client.go` 中添加 stderr 读取：

```go
// 在 NewClient 中启动 stderr 读取
go func() {
    io.Copy(io.Discard, stderr)
}()
```

### 6. 定义常量

```go
const (
    MaxPacketLimit = 1000
    DefaultPacketLimit = 100
    CleanupInterval = 5 * time.Minute
)
```

---

## 修复后的验证

修复完成后，应进行以下验证：

1. **编译验证**: `go build ./...` 确保无编译错误
2. **单元测试**: 运行所有单元测试（如有）
3. **集成测试**: 测试文件上传、会话创建、数据包分析完整流程
4. **并发测试**: 使用 `-race` 标志运行以检测竞态条件
5. **前端测试**: 验证所有 API 调用正常工作

---

## 审查时间

- 审查日期: 2026-03-09
- 审查人: AI Code Reviewer
