package handler

import (
	"net/http"
	"netshark/internal/service"

	"github.com/gin-gonic/gin"
)

// StatsHandler 统计处理器
type StatsHandler struct {
	sessionSvc *service.SessionService
	sharkdSvc  *service.SharkdService
}

// NewStatsHandler 创建统计处理器
func NewStatsHandler(sessionSvc *service.SessionService, sharkdSvc *service.SharkdService) *StatsHandler {
	return &StatsHandler{
		sessionSvc: sessionSvc,
		sharkdSvc:  sharkdSvc,
	}
}

// GetStats 获取统计信息
func (h *StatsHandler) GetStats(c *gin.Context) {
	sessionID := c.Param("id")

	// 验证会话
	if _, err := h.sessionSvc.GetSession(sessionID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	// 获取统计
	stats, err := h.sharkdSvc.GetStats(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get stats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": stats,
	})
}

// GetProtocols 获取协议分布
func (h *StatsHandler) GetProtocols(c *gin.Context) {
	sessionID := c.Param("id")

	// 验证会话
	if _, err := h.sessionSvc.GetSession(sessionID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	// 获取协议统计
	protocols, err := h.sharkdSvc.GetProtocols(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get protocols: " + err.Error(),
		})
		return
	}

	// 计算总数
	total := 0
	for _, p := range protocols {
		total += p.Count
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"total":     total,
			"protocols": protocols,
		},
	})
}

// RegisterRoutes 注册路由
func (h *StatsHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/sessions/:id/stats", h.GetStats)
	r.GET("/sessions/:id/protocols", h.GetProtocols)
}
