# Dockerfile 指令详解

## 概要

Dockerfile 是一个文本文件，其中包含了一系列指令，用于定义如何构建 Docker 镜像。通过 Dockerfile，我们可以自动化地创建镜像，确保在不同环境中的一致性部署。

::: tip 💡 为什么使用 Dockerfile
- **自动化构建** - 通过指令自动构建镜像，减少手动操作
- **版本控制** - Dockerfile 可以纳入版本控制，追踪镜像变更历史
- **可重复性** - 在任何支持 Docker 的环境中都能构建出相同的镜像
- **透明性** - 清晰地展示镜像的构建过程和依赖关系
:::

## 一、Dockerfile 指令列表

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

### 1. FROM - 指定基础镜像

FROM 指令是 Dockerfile 中的第一条指令，用于指定构建镜像所基于的基础镜像。

::: code-group
```dockerfile [✅ 正确用法]
# 指定基础镜像
FROM ubuntu:20.04
FROM node:14-alpine
FROM python:3.9-slim

# 多阶段构建中使用别名
FROM node:14-alpine AS builder
FROM nginx:alpine AS runtime
```

```dockerfile [❌ 错误用法]
# ❌ FROM 不是第一条指令
WORKDIR /app
FROM ubuntu:20.04

# ❌ 使用 latest 标签（不稳定）
FROM node:latest
```
:::

### 2. LABEL - 为镜像添加元数据

LABEL 指令用于为镜像添加元数据，以键值对的形式存在。

```dockerfile
LABEL version="1.0"
LABEL description="This is a sample application"
LABEL maintainer="developer@example.com"
```

### 3. RUN - 在构建时执行命令

RUN 指令用于在构建过程中执行命令，每个 RUN 指令都会创建一个新的镜像层。

::: code-group
```dockerfile [✅ 正确用法]
# 合并命令减少层数
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

RUN npm install
RUN pip install -r requirements.txt
```

```dockerfile [❌ 错误用法]
# ❌ 每个包单独安装（增加层数）
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y curl
RUN apt-get install -y vim
```
:::

### 4. CMD - 容器启动时执行的命令

CMD 指令用于指定容器启动时执行的命令，可以被 docker run 命令覆盖。

::: code-group
```dockerfile [✅ 正确用法]
# 容器启动时执行的命令
CMD ["nginx", "-g", "daemon off;"]
CMD ["python", "app.py"]
CMD echo "Hello World"
```

```dockerfile [❌ 错误用法]
# ❌ 在一个 Dockerfile 中使用多个 CMD（只有最后一个生效）
CMD ["nginx", "-g", "daemon off;"]
CMD ["python", "app.py"]  # 只有这个会生效
```
:::

### 5. ENTRYPOINT - 容器启动时执行的命令

ENTRYPOINT 指令用于指定容器启动时执行的命令，不会被 docker run 命令覆盖。

::: code-group
```dockerfile [✅ 正确用法]
# 容器启动时执行的命令（不会被覆盖）
ENTRYPOINT ["python", "app.py"]
ENTRYPOINT ["/docker-entrypoint.sh"]
```

```dockerfile [❌ 错误用法]
# ❌ 与 CMD 混淆使用
ENTRYPOINT ["nginx"]
ENTRYPOINT ["python"]  # 只有这个会生效
```
:::

### 6. EXPOSE - 声明端口

EXPOSE 指令用于声明容器在运行时监听的端口，仅起文档作用，不实际开放端口。

```dockerfile
EXPOSE 80
EXPOSE 3000
EXPOSE 8080
```

### 7. ENV - 设置环境变量

ENV 指令用于设置环境变量，这些变量在构建过程和容器运行时都可用。

```dockerfile
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
ENV PORT=3000
```

### 8. COPY - 复制文件或目录

COPY 指令用于从构建上下文目录中复制文件或目录到镜像中。

::: code-group
```dockerfile [✅ 正确用法]
# 复制文件或目录到镜像中
COPY package.json .
COPY . .
COPY ./src /app/src
```

```dockerfile [❌ 错误用法]
# ❌ 复制不存在的文件
COPY nonexistent.txt /app/
```
:::

### 9. ADD - 复制文件（支持 URL 和解压）

ADD 指令类似于 COPY，但还支持从 URL 下载文件和自动解压功能，推荐使用 COPY。

```dockerfile
# 复制文件，支持 URL 和解压
ADD https://example.com/file.tar.gz /app/
ADD archive.tar.gz /app/
```

### 10. WORKDIR - 设置工作目录

WORKDIR 指令用于设置工作目录，后续的 RUN、CMD、ENTRYPOINT、COPY 和 ADD 指令都会在这个目录下执行。

::: code-group
```dockerfile [✅ 正确用法]
# 设置工作目录
WORKDIR /app
WORKDIR /usr/src/app
```

```dockerfile [❌ 错误用法]
# ❌ 使用相对路径可能导致混淆
WORKDIR /app
WORKDIR subdirectory  # 实际是 /app/subdirectory
WORKDIR ../other      # 实际是 /other
```
:::

### 11. ARG - 定义构建时变量

ARG 指令用于定义构建时变量，可以在 docker build 时通过 --build-arg 参数传入。

```dockerfile
# 定义构建时变量
ARG NODE_VERSION=14
ARG APP_VERSION=1.0.0
```

### 12. VOLUME - 创建挂载点

VOLUME 指令用于创建挂载点，可以挂载主机目录或 Docker 卷。

```dockerfile
# 创建挂载点
VOLUME ["/data"]
VOLUME ["/var/log", "/var/db"]
```

### 13. USER - 设置运行用户

USER 指令用于设置运行容器时的用户或 UID。

::: code-group
```dockerfile [✅ 正确用法]
# 使用非 root 用户运行应用（安全实践）
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

```dockerfile [❌ 错误用法]
# ❌ 以 root 用户运行（安全风险）
FROM ubuntu:20.04
# 默认以 root 用户运行
```
:::

### 14. HEALTHCHECK - 健康检查

HEALTHCHECK 指令用于定义容器的健康检查机制。

```dockerfile
# 健康检查
HEALTHCHECK --interval=30s \
            --timeout=3s \
            --start-period=5s \
            --retries=3 \
            CMD curl -f http://localhost/ || exit 1
```

### 15. ONBUILD - 触发器指令

ONBUILD 指令用于为镜像添加触发器，当该镜像被用作其他镜像的基础镜像时执行。

```dockerfile
# 当镜像被用作基础镜像时执行的指令
ONBUILD COPY . /app/src
ONBUILD RUN /usr/local/bin/python-build --dir /app/src
```

### 16. STOPSIGNAL - 设置停止信号

STOPSIGNAL 指令用于设置停止容器时发送的系统调用信号。

```dockerfile
# 设置停止信号
STOPSIGNAL SIGTERM
STOPSIGNAL SIGKILL
```

### 17. SHELL - 设置执行命令的 shell

SHELL 指令用于设置执行 RUN、CMD 和 ENTRYPOINT 指令的 shell。

```dockerfile
# 设置执行命令的 shell
SHELL ["/bin/bash", "-c"]
SHELL ["powershell", "-command"]
```

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

## 三、总结

Dockerfile 指令是构建 Docker 镜像的基础，掌握这些指令的正确用法对于创建高效、安全的 Docker 镜像至关重要。

::: tip 关键要点
- **FROM** - 始终是第一条指令，选择合适的基础镜像
- **RUN** - 合并命令以减少镜像层数
- **COPY/ADD** - 优先使用 COPY，合理安排文件复制顺序
- **CMD/ENTRYPOINT** - 理解两者的区别和使用场景
- **WORKDIR** - 使用绝对路径设置工作目录
- **USER** - 使用非 root 用户提高安全性
:::

::: warning 注意事项
- 避免在镜像中包含敏感信息（如密码、密钥）
- 定期更新基础镜像以获取安全补丁
- 使用 .dockerignore 文件排除不必要的文件
- 遵循单一职责原则，一个容器一个进程
:::

::: info 📖 相关资源
- [Docker 官方文档](https://docs.docker.com/engine/reference/builder/) - Dockerfile 官方参考
- [Docker 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) - 官方最佳实践指南
- [Hadolint](https://github.com/hadolint/hadolint) - Dockerfile Linter
:::