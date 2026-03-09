// Package handler 提供HTTP请求处理
package handler

import (
	"net/http"
	"netshark/internal/model"
	"netshark/internal/service"

	"github.com/gin-gonic/gin"
)

// PCAPHandler PCAP文件处理器
type PCAPHandler struct {
	service *service.PCAPService
}

// NewPCAPHandler 创建PCAP处理器
func NewPCAPHandler(service *service.PCAPService) *PCAPHandler {
	return &PCAPHandler{service: service}
}

// Upload 处理文件上传
func (h *PCAPHandler) Upload(c *gin.Context) {
	// 获取上传文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Failed to get upload file: " + err.Error(),
		})
		return
	}
	defer file.Close()

	// 保存文件
	resp, err := h.service.UploadFile(header.Filename, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to upload file: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": resp,
	})
}

// ListFiles 列出所有文件
func (h *PCAPHandler) ListFiles(c *gin.Context) {
	files := h.service.ListFiles()
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": files,
	})
}

// GetFile 获取文件信息
func (h *PCAPHandler) GetFile(c *gin.Context) {
	fileID := c.Param("id")
	file, err := h.service.GetFile(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": file,
	})
}

// RegisterRoutes 注册路由
func (h *PCAPHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/upload", h.Upload)
	r.GET("/files", h.ListFiles)
	r.GET("/files/:id", h.GetFile)
}
