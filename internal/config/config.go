// Package config 提供应用程序配置管理
package config

import (
	"os"
	"strconv"
	"time"
)

// Config 应用程序配置
type Config struct {
	// Server 服务器配置
	Server ServerConfig
	// Upload 上传配置
	Upload UploadConfig
	// Session 会话配置
	Session SessionConfig
	// Sharkd sharkd配置
	Sharkd SharkdConfig
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host string
	Port int
}

// UploadConfig 上传配置
type UploadConfig struct {
	UploadDir      string
	MaxFileSize    int64
	FileExpireDays int
}

// SessionConfig 会话配置
type SessionConfig struct {
	Timeout time.Duration
}

// SharkdConfig sharkd配置
type SharkdConfig struct {
	BinaryPath string
}

// NewConfig 创建默认配置
func NewConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
			Port: getEnvInt("SERVER_PORT", 8080),
		},
		Upload: UploadConfig{
			UploadDir:      getEnv("UPLOAD_DIR", "./uploads"),
			MaxFileSize:    getEnvInt64("MAX_FILE_SIZE", 100*1024*1024), // 100MB
			FileExpireDays: getEnvInt("FILE_EXPIRE_DAYS", 7),
		},
		Session: SessionConfig{
			Timeout: time.Duration(getEnvInt("SESSION_TIMEOUT_MINUTES", 30)) * time.Minute,
		},
		Sharkd: SharkdConfig{
			BinaryPath: getEnv("SHARKD_PATH", "sharkd"),
		},
	}
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt 获取整数环境变量
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

// getEnvInt64 获取int64环境变量
func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.ParseInt(value, 10, 64); err == nil {
			return i
		}
	}
	return defaultValue
}
