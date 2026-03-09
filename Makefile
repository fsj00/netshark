# NetShark Makefile

.PHONY: build run clean test fmt lint deps

# 变量
BINARY_NAME=netshark
BUILD_DIR=./build
MAIN_FILE=cmd/server/main.go

# 默认目标
all: build

# 构建
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_FILE)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# 运行
run:
	@echo "Starting NetShark server..."
	go run $(MAIN_FILE)

# 开发模式 (带热重载)
dev:
	@echo "Starting NetShark in dev mode..."
	@which air > /dev/null || (echo "Installing air..." && go install github.com/cosmtrek/air@latest)
	air

# 清理
clean:
	@echo "Cleaning..."
	@rm -rf $(BUILD_DIR)
	@rm -rf uploads/*
	@echo "Clean complete"

# 测试
test:
	@echo "Running tests..."
	go test -v ./...

# 代码格式化
fmt:
	@echo "Formatting code..."
	go fmt ./...

# 代码检查
lint:
	@echo "Linting code..."
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run

# 安装依赖
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# 交叉编译
build-all:
	@echo "Building for all platforms..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(MAIN_FILE)
	GOOS=linux GOARCH=arm64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 $(MAIN_FILE)
	GOOS=darwin GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(MAIN_FILE)
	GOOS=darwin GOARCH=arm64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(MAIN_FILE)
	GOOS=windows GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe $(MAIN_FILE)
	@echo "Build complete for all platforms"

# Docker构建
docker-build:
	@echo "Building Docker image..."
	docker build -t netshark:latest .

# Docker运行
docker-run:
	@echo "Running Docker container..."
	docker run -p 8080:8080 -v $(PWD)/uploads:/app/uploads netshark:latest

# 安装
install: build
	@echo "Installing $(BINARY_NAME)..."
	@cp $(BUILD_DIR)/$(BINARY_NAME) /usr/local/bin/
	@echo "Installed to /usr/local/bin/$(BINARY_NAME)"

# 卸载
uninstall:
	@echo "Uninstalling $(BINARY_NAME)..."
	@rm -f /usr/local/bin/$(BINARY_NAME)
	@echo "Uninstalled"

# 帮助
help:
	@echo "Available targets:"
	@echo "  build       - Build the binary"
	@echo "  run         - Run the server"
	@echo "  dev         - Run in development mode with hot reload"
	@echo "  clean       - Clean build artifacts and uploads"
	@echo "  test        - Run tests"
	@echo "  fmt         - Format code"
	@echo "  lint        - Run linter"
	@echo "  deps        - Download and tidy dependencies"
	@echo "  build-all   - Build for all platforms"
	@echo "  docker-build- Build Docker image"
	@echo "  docker-run  - Run Docker container"
	@echo "  install     - Install binary to /usr/local/bin"
	@echo "  uninstall   - Uninstall binary"
	@echo "  help        - Show this help message"
