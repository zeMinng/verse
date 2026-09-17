# Docker 概述

## 概述

[Docker](https://www.docker.com/) 是一个开源的[容器化平台](https://hub.docker.com/)，允许开发者将应用程序及其依赖环境打包成轻量级、可移植的容器。核心优势：环境一致性、资源高效、快速部署、跨平台支持。

::: info 基本概念
镜像（Image）：只读模板，包含应用代码、运行时和配置

容器（Container）：镜像的运行实例，具有隔离的文件系统和进程空间

Dockerfile：文本文件，定义如何构建镜像

Docker Compose：用于管理多容器应用的编排工具
:::

## 一、Docker 下载
Docker 支持多种操作系统环境，在 [docker 官网](https://docs.docker.com/engine/install/ubuntu/)进行不同系统的下载安装。

## 二、Docker 实战命令
:::details 设置国内镜像
```bash
# 这部分是测试镜像源是否成功
curl -I https://docker.m.daocloud.io
# 设置docker国内镜像
sudo nano /etc/docker/daemon.json
cat /etc/docker/daemon.json

# {
#   "registry-mirrors": [
#     "https://docker.m.daocloud.io",
#     "https://docker-0.unsee.tech"
#   ]
# }
```
:::

### 1. 镜像相关命令
| 命令用途 | 基础命令 | 示例 |
| --- | --- | --- |
| 搜索镜像 | docker search [镜像名称] | docker search nginx |
| 拉取镜像 | docker pull [镜像名称]:[标签] | docker pull nginx:latest<br/>docker pull ubuntu:22.04 |
| 查看本地镜像 | docker images | docker images |
| 删除镜像 | docker rmi [镜像ID/名称:标签] | docker rmi nginx:latest<br/>docker rmi -f $(docker images -q)（强制删除所有） |
| 镜像打标签 | docker tag [原镜像] [新镜像:标签] | docker tag nginx:latest my-nginx:v1.0 |
| 推送镜像 | docker push [镜像:标签] | docker push username/my-nginx:v1.0 |
| 保存镜像为文件 | docker save -o [文件路径] [镜像] | docker save -o ./nginx.tar nginx:latest |
| 从文件加载镜像 | docker load -i [文件路径] | docker load -i ./nginx.tar |

### 2. 容器相关命令

| 命令用途 | 基础命令 | 示例 |
| --- | --- | --- |
| 创建并启动容器 | docker run [选项] [镜像] [命令] | docker run -it --name my-ubuntu ubuntu:22.04 /bin/bash<br/>docker run -d -p 8080:80 --name my-nginx nginx |
| 查看容器 | docker ps [选项] | docker ps（运行中）<br/>docker ps -a（所有）<br/>docker ps -aq（仅 ID） |
| 启动 / 停止容器 | docker start [容器]<br/>docker stop [容器] | docker start my-nginx<br/>docker stop my-nginx |
| 强制停止容器 | docker kill [容器] | docker kill my-nginx |
| 重启容器 | docker restart [容器] | docker restart my-nginx |
| 进入容器 | docker exec -it [容器] /bin/bash | docker exec -it my-nginx /bin/bash |
| 查看容器日志 | docker logs [选项] [容器] | docker logs -f my-nginx<br/>docker logs --tail 100 my-nginx |
| 查看容器详情 | docker inspect [容器] | docker inspect my-nginx |
| 删除容器 | docker rm [容器] | docker rm my-nginx<br/>docker rm -f my-nginx（强制删除）<br/>docker rm $(docker ps -aqf "status=exited")（删除所有停止的） |
| 文件传输 | docker cp [源路径] [目标路径] | docker cp ./local.txt my-nginx:/app/<br/>docker cp my-nginx:/app/logs ./ |

### 3. 系统管理命令

| 命令用途 | 基础命令 | 示例 |
| --- | --- | --- |
| 查看版本信息 | docker version<br/>docker info | docker version<br/>docker info |
| 仓库登录 / 退出 | docker login [仓库地址]<br/>docker logout | docker login<br/>docker login registry.example.com |
| 清理资源 | docker system prune [选项] | docker system prune<br/>docker system prune -a（包括未使用镜像） |
| Docker 服务管理 | systemctl [start/stop/restart/status/enable] docker | systemctl start docker<br/>systemctl enable docker |
| 重启docker | sudo systemctl daemon-reload 和 sudo systemctl restart docker |   |
### 4. 常用选项说明

| 选项 | 说明 |
| --- | --- |
| -d | 后台运行容器 |
| -p | 端口映射（主机端口：容器端口） |
| -v | 数据卷挂载（主机目录：容器目录） |
| --name | 指定容器名称 |
| -f | 强制操作 |
| --rm | 当容器退出后，自动删除该容器 |
| --restart | 设置容器重启策略，常用值包括：<br>- no：默认值，容器退出后不自动重启<br>- always：无论容器退出状态如何，总是自动重启<br>- on-failure[:max-retries]：仅在容器以非0状态退出时重启，可指定最大重试次数<br>- unless-stopped：除非手动停止容器，否则总是自动重启 |
| -e   |  设置环境变量（格式：-e "变量名 = 变量值"），可以向容器内部传递环境变量，多个环境变量可多次使用该选项 (docker inspect 容器名) |
| --tail | 查看日志时指定行数 |
| -it | 交互式终端模式 |

### 5. 镜像构建（Dockerfile 示例）
``` dockerfile
# 基于 Python 官方镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install -r requirements.txt

# 复制应用代码
COPY . .

# 容器启动命令
CMD ["python", "app.py"]
```
构建命令：bash
```
docker build -t my-python-app .
```

## 三、典型应用场景
### 1. 开发环境标准化

``` bash
# 一键启动包含 MySQL+Redis 的开发环境
docker-compose -f dev-stack.yaml up
```
`dev-stack.yaml` 示例：
``` yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456
    ports:
      - "3306:3306"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### 2. 生产部署最佳实践
多阶段构建：减少最终镜像体积

``` dockerfile
# 第一阶段：构建环境
FROM node:16 as builder
WORKDIR /build
COPY . .
RUN npm install && npm run build

# 第二阶段：生产环境
FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
```

## 四、常见问题排查
### 1. 基础命令
``` bash
# 查看容器日志
docker logs -f my_container

# 检查容器资源占用
docker stats

# 调试容器网络
docker inspect my_container | grep IPAddress
```

### 2. 数据持久化

``` bash
# 挂载主机目录到容器
docker run -v /host/path:/container/path mysql

# 使用命名卷（自动管理）
docker volume create my_volume
docker run -v my_volume:/data redis
```