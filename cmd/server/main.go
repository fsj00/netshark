// NetShark - 在线PCAP文件解析分析工具
package main

import (
	"context"
	"log"
	"net/http"
	"netshark/internal/config"
	"netshark/internal/handler"
	"netshark/internal/middleware"
	"netshark/internal/repository"
	"netshark/internal/service"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.NewConfig()

	// 设置日志
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// 创建文件仓库
	fileRepo, err := repository.NewFileRepository(cfg.Upload.UploadDir)
	if err != nil {
		log.Fatalf("Failed to create file repository: %v", err)
	}

	// 创建服务
	pcapSvc := service.NewPCAPService(fileRepo)
	sharkdSvc := service.NewSharkdService(cfg.Sharkd.BinaryPath)
	sessionSvc := service.NewSessionService(cfg.Session.Timeout, sharkdSvc, pcapSvc)

	// 创建处理器
	pcapHandler := handler.NewPCAPHandler(pcapSvc)
	sessionHandler := handler.NewSessionHandler(sessionSvc)
	packetHandler := handler.NewPacketHandler(sessionSvc, sharkdSvc)
	statsHandler := handler.NewStatsHandler(sessionSvc, sharkdSvc)

	// 创建Gin引擎
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// 静态文件服务
	r.Static("/static", "./web")
	r.StaticFile("/", "./web/index.html")

	// API路由
	api := r.Group("/api/v1")
	{
		pcapHandler.RegisterRoutes(api)
		sessionHandler.RegisterRoutes(api)
		packetHandler.RegisterRoutes(api)
		statsHandler.RegisterRoutes(api)
	}

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	// 启动服务器
	go func() {
		log.Printf("NetShark server starting on http://localhost%s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// 优雅关闭
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	// 关闭所有sharkd会话
	sharkdSvc.CloseAll()

	log.Println("Server exited")
}
