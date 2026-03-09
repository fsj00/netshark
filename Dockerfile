# NetShark Dockerfile

FROM golang:1.21-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache git make

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o netshark cmd/server/main.go

# 运行阶段
FROM alpine:latest

# 安装Wireshark
RUN apk add --no-cache wireshark

# 创建非root用户
RUN adduser -D -u 1000 netshark

# 设置工作目录
WORKDIR /app

# 复制二进制文件
COPY --from=builder /app/netshark .

# 复制web文件
COPY --from=builder /app/web ./web

# 创建上传目录
RUN mkdir -p uploads && chown -R netshark:netshark /app

# 切换到非root用户
USER netshark

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# 启动命令
CMD ["./netshark"]
