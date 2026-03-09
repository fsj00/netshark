package handler

import (
	"net/http"
	"netshark/internal/model"
	"netshark/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PacketHandler 数据包处理器
type PacketHandler struct {
	sessionSvc *service.SessionService
	sharkdSvc  *service.SharkdService
}

// NewPacketHandler 创建数据包处理器
func NewPacketHandler(sessionSvc *service.SessionService, sharkdSvc *service.SharkdService) *PacketHandler {
	return &PacketHandler{
		sessionSvc: sessionSvc,
		sharkdSvc:  sharkdSvc,
	}
}

// ListPackets 获取数据包列表
func (h *PacketHandler) ListPackets(c *gin.Context) {
	sessionID := c.Param("id")

	// 验证会话
	if _, err := h.sessionSvc.GetSession(sessionID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	// 解析参数
	var params model.PacketListParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid params: " + err.Error(),
		})
		return
	}

	// 限制最大返回数量
	if params.Limit > 1000 {
		params.Limit = 1000
	}
	if params.Limit <= 0 {
		params.Limit = 100
	}

	// 获取数据包
	start := params.Offset
	end := params.Offset + params.Limit - 1
	packets, err := h.sharkdSvc.GetFrames(sessionID, start, end, params.Filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get packets: " + err.Error(),
		})
		return
	}

	// 获取总数
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
		"data": model.PacketsResponse{
			Total:   stats.TotalPackets,
			Offset:  params.Offset,
			Limit:   params.Limit,
			Packets: packets,
		},
	})
}

// GetPacket 获取单个数据包详情
func (h *PacketHandler) GetPacket(c *gin.Context) {
	sessionID := c.Param("id")
	numStr := c.Param("num")

	// 验证会话
	if _, err := h.sessionSvc.GetSession(sessionID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	// 解析数据包序号
	num, err := strconv.Atoi(numStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid packet number",
		})
		return
	}

	// 获取数据包详情
	detail, err := h.sharkdSvc.GetFrame(sessionID, num)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get packet: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": detail,
	})
}

// RegisterRoutes 注册路由
func (h *PacketHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/sessions/:id/packets", h.ListPackets)
	r.GET("/sessions/:id/packets/:num", h.GetPacket)
}
