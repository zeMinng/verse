# Dockerfile

## 概要

Dockerfile 是一个文本文件，其中包含了一系列指令，用于定义如何构建 Docker 镜像。通过 Dockerfile，我们可以自动化地创建镜像，确保在不同环境中的一致性部署。

::: tip 💡 为什么使用 Dockerfile
- **自动化构建** - 通过指令自动构建镜像，减少手动操作
- **版本控制** - Dockerfile 可以纳入版本控制，追踪镜像变更历史
- **可重复性** - 在任何支持 Docker 的环境中都能构建出相同的镜像
- **透明性** - 清晰地展示镜像的构建过程和依赖关系
:::

## 一、Dockerfile 基础概念

### 1. 基本语法

Dockerfile 由一系列指令组成，每条指令都以大写字母的命令开头，后面跟随参数。指令按照从上到下的顺序执行。

```dockerfile
# 注释以 # 开头
FROM ubuntu:20.04
LABEL maintainer="your-email@example.com"
RUN apt-get update && apt-get install -y nginx
COPY . /app
WORKDIR /app
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 常用指令详解

::: code-group
```dockerfile [基础指令]
# FROM - 指定基础镜像（必须是第一条指令）
FROM ubuntu:20.04
FROM node:14-alpine
FROM python:3.9-slim

# LABEL - 为镜像添加元数据
LABEL version="1.0"
LABEL description="This is a sample application"
LABEL maintainer="developer@example.com"

# WORKDIR - 设置工作目录
WORKDIR /app
WORKDIR /usr/src/app

# COPY - 复制文件或目录到镜像中
COPY package.json .
COPY . .
COPY ./src /app/src

# ADD - 复制文件，支持 URL 和解压（推荐使用 COPY）
ADD https://example.com/file.tar.gz /app/
ADD archive.tar.gz /app/
```

```dockerfile [运行指令]
# RUN - 在构建时执行命令
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

RUN npm install
RUN pip install -r requirements.txt

# CMD - 容器启动时执行的命令（可被 docker run 覆盖）
CMD ["nginx", "-g", "daemon off;"]
CMD ["python", "app.py"]
CMD echo "Hello World"

# ENTRYPOINT - 容器启动时执行的命令（不会被 docker run 覆盖）
ENTRYPOINT ["python", "app.py"]
ENTRYPOINT ["/docker-entrypoint.sh"]

# EXPOSE - 声明端口（仅文档作用，不实际开放端口）
EXPOSE 80
EXPOSE 3000
EXPOSE 8080
```

```dockerfile [环境指令]
# ENV - 设置环境变量
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
ENV PORT=3000

# ARG - 定义构建时变量（可在 docker build 时传入）
ARG NODE_VERSION=14
ARG APP_VERSION=1.0.0

# VOLUME - 创建挂载点
VOLUME ["/data"]
VOLUME ["/var/log", "/var/db"]
```
:::

## 二、Dockerfile 最佳实践

### 1. 镜像优化技巧

::: code-group
```dockerfile [✅ 正确用法]
# ✅ 合并 RUN 指令减少层数
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# ✅ 使用 .dockerignore 文件
# .dockerignore 内容示例：
# node_modules
# .git
# *.log
# .env

# ✅ 合理安排指令顺序（利用缓存）
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
```

```dockerfile [❌ 错误用法]
# ❌ 每个包单独安装（增加层数）
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y curl
RUN apt-get install -y vim

# ❌ 将 COPY 放在 RUN 之前（破坏缓存）
FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install  # 每次代码变更都会重新安装依赖
```
:::

### 2. 安全性考虑

::: code-group
```dockerfile [✅ 安全实践]
# ✅ 使用非 root 用户运行应用
FROM node:14-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
WORKDIR /app

# ✅ 使用特定版本的基础镜像
FROM node:14.17.0-alpine3.13
FROM python:3.9.6-slim-buster

# ✅ 清理安装缓存
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

```dockerfile [❌ 不安全做法]
# ❌ 使用 latest 标签（不稳定）
FROM node:latest
FROM python:latest

# ❌ 以 root 用户运行（安全风险）
FROM ubuntu:20.04
# 默认以 root 用户运行

# ❌ 保留安装缓存（增加镜像大小）
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y git curl vim
# 没有清理 /var/lib/apt/lists/*
```
:::

### 3. 多阶段构建

多阶段构建允许在单个 Dockerfile 中使用多个 FROM 指令，可以显著减小最终镜像的大小。

::: code-group
```dockerfile [Node.js 多阶段构建]
# 第一阶段：构建阶段
FROM node:14-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 第二阶段：运行阶段
FROM node:14-alpine AS runtime
WORKDIR /app
# 从构建阶段复制依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```dockerfile [Go 多阶段构建]
# 第一阶段：构建阶段
FROM golang:1.16-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 第二阶段：运行阶段
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
# 从构建阶段复制二进制文件
COPY --from=builder /app/main .
CMD ["./main"]
```
:::

## 三、实用示例

### 1. Web 应用示例

::: code-group
```dockerfile [Node.js 应用]
FROM node:14-alpine
LABEL maintainer="developer@example.com"
LABEL version="1.0.0"

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖（利用缓存）
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 更改文件所有者
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["npm", "start"]
```

```dockerfile [Python Flask 应用]
FROM python:3.9-slim
LABEL maintainer="developer@example.com"
LABEL version="1.0.0"

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非特权用户
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```
:::

### 2. 数据库服务示例

::: code-group
```dockerfile [PostgreSQL 自定义镜像]
FROM postgres:13-alpine
LABEL maintainer="dba@example.com"
LABEL version="1.0.0"

# 复制初始化脚本
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# 设置环境变量
ENV POSTGRES_DB=myapp
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword

# 暴露端口
EXPOSE 5432

# 使用父镜像的 ENTRYPOINT 和 CMD
```

```dockerfile [Redis 自定义配置]
FROM redis:6-alpine
LABEL maintainer="admin@example.com"
LABEL version="1.0.0"

# 复制自定义配置文件
COPY redis.conf /usr/local/etc/redis/redis.conf

# 设置权限
RUN chmod 644 /usr/local/etc/redis/redis.conf

# 暴露端口
EXPOSE 6379

# 使用自定义配置启动
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
```
:::

## 四、高级技巧

### 1. 构建参数与环境变量

::: code-group
```dockerfile [构建参数使用]
# 定义构建参数
ARG NODE_VERSION=14
ARG APP_ENV=development

# 使用构建参数
FROM node:${NODE_VERSION}-alpine

# 将构建参数设置为环境变量
ENV NODE_ENV=${APP_ENV}

WORKDIR /app

# 根据环境安装不同依赖
RUN if [ "$NODE_ENV" = "production" ]; then \
        npm ci --only=production; \
    else \
        npm install; \
    fi

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```bash [构建命令]
# 构建生产环境镜像
docker build \
  --build-arg NODE_VERSION=16 \
  --build-arg APP_ENV=production \
  -t myapp:prod .

# 构建开发环境镜像
docker build \
  --build-arg NODE_VERSION=14 \
  --build-arg APP_ENV=development \
  -t myapp:dev .
```
:::

### 2. 健康检查与资源限制

::: code-group
```dockerfile [健康检查配置]
FROM nginx:alpine
LABEL maintainer="ops@example.com"

# 复制配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 健康检查
HEALTHCHECK --interval=30s \
            --timeout=3s \
            --start-period=5s \
            --retries=3 \
            CMD curl -f http://localhost/ || exit 1

EXPOSE 80

# 使用父镜像的 ENTRYPOINT
```

```dockerfile [资源优化]
FROM node:14-alpine
LABEL maintainer="developer@example.com"

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 优化 npm 安装
RUN npm ci --only=production && \
    npm cache clean --force

COPY . .

# 设置内存限制（在运行时通过 --memory 参数控制）
# 设置 CPU 限制（在运行时通过 --cpus 参数控制）

EXPOSE 3000

# 启动时设置 Node.js 内存限制
CMD ["node", "--max-old-space-size=512", "index.js"]
```
:::

## 五、常见问题与解决方案

### 1. 缓存问题

::: code-group
```dockerfile [✅ 正确处理缓存]
# ✅ 合理排序指令以最大化缓存利用
FROM node:14-alpine
WORKDIR /app

# 先复制依赖文件（较少变更）
COPY package*.json ./
RUN npm ci --only=production

# 后复制源代码（较频繁变更）
COPY . .

CMD ["npm", "start"]
```

```dockerfile [❌ 缓存问题]
# ❌ 每次都复制所有文件，破坏缓存
FROM node:14-alpine
WORKDIR /app

# 每次代码变更都会重新安装依赖
COPY . .
RUN npm install

CMD ["npm", "start"]
```
:::

### 2. 权限问题

::: code-group
```dockerfile [✅ 权限最佳实践]
FROM ubuntu:20.04

# 创建非 root 用户
RUN useradd -ms /bin/bash appuser

WORKDIR /app

# 复制文件并设置权限
COPY --chown=appuser:appuser . .

# 切换到非 root 用户
USER appuser

CMD ["./app"]
```

```bash [❌ 权限问题解决方案]
# 如果遇到权限问题，可以在运行时指定用户
docker run --user 1000:1000 myapp

# 或者在 Dockerfile 中正确设置权限
```
:::

## 六、工具与自动化

### 1. Dockerfile 验证工具

::: code-group
```bash [Hadolint - Dockerfile Linter]
# 安装 Hadolint
# macOS
brew install hadolint

# 使用 Hadolint 检查 Dockerfile
hadolint Dockerfile

# 忽略特定规则
hadolint --ignore DL3008 Dockerfile

# 以 JSON 格式输出
hadolint --format json Dockerfile
```

```yaml [.hadolint.yaml 配置示例]
ignored:
  - DL3008  # 固定 apt 版本
  - DL3018  # 固定 apk 版本

trustedRegistries:
  - docker.io
  - quay.io
  - my-registry.example.com
```
:::

### 2. 构建优化工具

::: code-group
```dockerfile [BuildKit 启用]
# 使用 BuildKit 构建（更快、更安全）
# 设置环境变量
export DOCKER_BUILDKIT=1

# 或者在构建命令中启用
docker build --progress=plain .

# 使用 BuildKit 特性
# syntax=docker/dockerfile:1
FROM node:14-alpine
RUN --mount=type=cache,target=/root/.npm \
    npm install
```

```yaml [docker-compose.yml 构建配置]
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production  # 多阶段构建的目标阶段
      args:
        - NODE_ENV=production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```
:::

## 七、总结

通过掌握 Dockerfile 的核心概念和最佳实践，你可以创建出高效、安全、可维护的 Docker 镜像。记住以下关键点：

::: tip 关键要点
- **合理利用缓存** - 正确排序指令以最大化构建缓存效果
- **减小镜像大小** - 使用多阶段构建和精简基础镜像
- **安全性考虑** - 使用非 root 用户和固定版本的基础镜像
- **可维护性** - 编写清晰的注释和使用语义化的标签
:::

::: warning 注意事项
- 避免在镜像中包含敏感信息（如密码、密钥）
- 定期更新基础镜像以获取安全补丁
- 使用 .dockerignore 文件排除不必要的文件
- 遵循单一职责原则，一个容器一个进程
:::

::: tip 🚀 下一步学习
掌握了 Dockerfile 基础后，建议学习：
- **Docker Compose** - 多容器应用编排
- **Docker Swarm** - 容器编排
- **Kubernetes** - 容器编排平台
- **CI/CD 集成** - 自动化构建和部署
:::

::: info 📖 相关资源
- [Docker 官方文档](https://docs.docker.com/engine/reference/builder/) - Dockerfile 官方参考
- [Docker 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) - 官方最佳实践指南
- [Hadolint](https://github.com/hadolint/hadolint) - Dockerfile Linter
- [Docker BuildKit](https://docs.docker.com/develop/develop-images/build_enhancements/) - 高级构建特性
:::