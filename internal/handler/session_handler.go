package handler

import (
	"net/http"
	"netshark/internal/model"
	"netshark/internal/service"

	"github.com/gin-gonic/gin"
)

// SessionHandler 会话处理器
type SessionHandler struct {
	service *service.SessionService
}

// NewSessionHandler 创建会话处理器
func NewSessionHandler(service *service.SessionService) *SessionHandler {
	return &SessionHandler{service: service}
}

// CreateSession 创建会话
func (h *SessionHandler) CreateSession(c *gin.Context) {
	var req model.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	session, err := h.service.CreateSession(req.FileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create session: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": session,
	})
}

// GetSession 获取会话信息
func (h *SessionHandler) GetSession(c *gin.Context) {
	sessionID := c.Param("id")
	session, err := h.service.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": model.SessionResponse{
			SessionID: session.SessionID,
			FileID:    session.FileID,
			CreatedAt: session.CreatedAt,
			ExpiresAt: session.ExpiresAt,
		},
	})
}

// CloseSession 关闭会话
func (h *SessionHandler) CloseSession(c *gin.Context) {
	sessionID := c.Param("id")
	if err := h.service.CloseSession(sessionID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "Session closed successfully",
	})
}

// RegisterRoutes 注册路由
func (h *SessionHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/sessions", h.CreateSession)
	r.GET("/sessions/:id", h.GetSession)
	r.DELETE("/sessions/:id", h.CloseSession)
}
