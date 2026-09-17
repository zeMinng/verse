# Docker 基础命令

## 概要

[Docker](https://www.docker.com/) 是一个开源的 [容器化平台](https://hub.docker.com/)，革命性地改变了应用程序的开发、部署和运行方式。通过将应用程序及其依赖环境打包成轻量级、可移植的容器，实现了「一次构建，到处运行」的理想。

Docker 的核心优势包括：**环境一致性**、**资源高效**、**快速部署**、**跨平台支持**、**微服务架构**。

## 一、Docker 核心概念

**镜像（Image）**
- **定义**：只读模板，包含应用代码、运行时、系统工具、库和配置
- **特点**：分层存储、可版本控制、可重用、不可变
- **类比**：就像软件安装包，包含了运行应用所需的一切

**容器（Container）**
- **定义**：镜像的运行实例，具有独立的文件系统和进程空间
- **特点**：轻量级、可启停、相互隔离、可扩展
- **类比**：就像运行中的应用程序，基于镜像创建

**Dockerfile**
- **定义**：文本文件，定义如何从基础镜像构建新镜像的指令集
- **作用**：自动化构建、版本控制、可重复构建
- **类比**：就像制作食谱，详细描述如何制作一道菜

**Docker Compose**
- **定义**：用于定义和管理多容器 Docker 应用程序的工具
- **功能**：服务编排、网络管理、数据卷管理
- **类比**：就像交响乐指挥，协调多个容器协同工作

## 二、Docker 安装配置

### 1. 系统要求与安装

Docker 支持主流操作系统，推荐使用最新稳定版本：[在 Ubuntu 上安装 Docker 引擎](https://docs.docker.com/engine/install/ubuntu/)

::: code-group
```bash [Ubuntu/Debian 安装]
# docker Ubuntu官网下载：
# https://docs.docker.com/engine/install/ubuntu/
```

```bash [CentOS/RHEL 安装]
# 安装 yum-utils
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker Engine
sudo yum install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
sudo docker run hello-world
```

```powershell [Windows 安装]
# 下载 Docker Desktop for Windows
# 访问：https://www.docker.com/products/docker-desktop

# 使用 Chocolatey 安装（可选）
choco install docker-desktop

# 使用 Winget 安装（可选）
winget install Docker.DockerDesktop

# 验证安装
docker --version
docker run hello-world
```

```bash [macOS 安装]
# 下载 Docker Desktop for Mac
# 访问：https://www.docker.com/products/docker-desktop

# 使用 Homebrew 安装（可选）
brew install --cask docker

# 验证安装
docker --version
docker run hello-world
```
:::

### 2. 配置国内镜像源

为了加速镜像下载，配置国内镜像源非常重要：

::: code-group
```bash [配置镜像源]
# 1. 测试镜像源连通性
curl -I https://docker.m.daocloud.io
curl -I https://registry.docker-cn.com

# 2. 设置docker国内镜像
sudo nano /etc/docker/daemon.json # 编辑JSON，按Ctrl+O保存，按Ctrl+X退出nano编辑器
cat /etc/docker/daemon.json # 查看JSON文件

# 当你的操作系统没有nano时候：
open /etc/docker/daemon.json

# 或者这样操作也行：创建或编辑 daemon.json
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker-0.unsee.tech",
    "https://registry.docker-cn.com",
    "https://mirror.ccs.tencentyun.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# 3. 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 4. 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

```json [daemon.json 完整配置]
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker-0.unsee.tech",
    "https://registry.docker-cn.com",
    "https://mirror.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-runtime": "runc",
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
:::

### 3. 用户权限配置

为了避免每次使用 `sudo`，将用户添加到 docker 组：

```bash
# 创建 docker 组（通常已存在）
sudo groupadd docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或使用以下命令立即生效
newgrp docker

# 验证权限
docker run hello-world
```

::: warning ⚠️ 安全注意事项
将用户添加到 docker 组等同于给予 root 权限。在生产环境中，请谨慎考虑安全影响。

**安全建议：**
- 只将可信用户添加到 docker 组
- 考虑使用 rootless Docker
- 定期审查用户权限
- 使用 Docker 安全扫描工具
:::

## 三、Docker 基础命令

### 1. 镜像管理命令

Docker 镜像是容器的基础，掌握镜像管理是使用 Docker 的第一步：

::: code-group
```bash [镜像基础操作]
# 搜索镜像
docker search nginx
docker search --limit 5 ubuntu

# 拉取镜像
docker pull nginx
docker pull nginx:alpine
docker pull ubuntu:20.04

# 查看本地镜像
docker images
docker image ls
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 查看镜像详细信息
docker inspect nginx
docker history nginx

# 删除镜像
docker rmi nginx:alpine
docker rmi -f $(docker images -q)（强制删除所有）
docker image rm ubuntu:20.04

# 清理未使用的镜像
docker image prune
docker image prune -a  # 删除所有未使用的镜像
```

```bash [镜像标签与推送]
# 为镜像打标签
docker tag nginx:latest myregistry.com/nginx:v1.0
docker tag app:latest username/app:latest

# 登录到镜像仓库
docker login
docker login myregistry.com

# 推送镜像到仓库
docker push username/app:latest
docker push myregistry.com/nginx:v1.0

# 导出和导入镜像
docker save -o ./nginx.tar nginx:latest  # 保存镜像为文件
docker load -i ./nginx.tar               # 从文件加载镜像

# 从容器创建镜像
docker commit container_name new_image:tag
```
:::

### 2. 容器生命周期管理

容器是 Docker 的运行单位，了解容器生命周期管理至关重要：

::: code-group
```bash [容器基础操作]
# 运行容器
docker run hello-world
docker run -it ubuntu:20.04 /bin/bash
docker run -d --name web-server nginx
docker run -d -p 8080:80 --name my-nginx nginx

# 查看容器
docker ps                    # 查看运行中的容器
docker ps -a                 # 查看所有容器
docker ps -aq                # 仅 ID
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 容器操作
docker start container_name   # 启动容器
docker stop container_name    # 停止容器
docker kill my-nginx          # 强制停止容器
docker restart container_name # 重启容器
docker pause container_name   # 暂停容器
docker unpause container_name # 恢复容器

# 删除容器
docker rm container_name
docker rm -f running_container  # 强制删除运行中的容器
docker container prune          # 清理停止的容器
```

```bash [容器交互与调试]
# 进入运行中的容器
docker exec -it container_name /bin/bash
docker exec -it container_name sh

# 查看容器日志
docker logs container_name
docker logs -f container_name           # 实时查看日志
docker logs --tail 50 container_name    # 查看最后50行日志
docker logs --since 1h container_name   # 查看1小时内的日志

# 查看容器详细信息
docker inspect container_name
docker stats container_name             # 查看资源使用情况
docker top container_name               # 查看容器内进程

# 文件复制
docker cp container_name:/path/to/file ./
docker cp ./file container_name:/path/to/destination
```

```bash [容器网络与存储]
# 端口映射
docker run -d -p 8080:80 nginx              # 主机8080映射到容器80
docker run -d -p 127.0.0.1:8080:80 nginx    # 绑定到本地接口
docker run -d -P nginx                      # 随机端口映射

# 数据卷挂载
docker run -d -v /host/path:/container/path nginx
docker run -d -v my-volume:/var/lib/mysql mysql
docker run -d --mount type=bind,source=/host/path,target=/container/path nginx

# 环境变量
docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql
docker run -d --env-file .env app

# 网络配置
docker run -d --network host nginx
docker run -d --network none nginx
docker run -d --network my-network nginx
```
:::

### 3. 实用管理命令

::: code-group
```bash [系统管理]
# 查看 Docker 系统信息
docker --version
docker version
docker info
docker system df            # 查看存储使用情况

# Docker 服务管理（Linux系统）
sudo systemctl daemon-reload    # 重新加载 systemd 配置文件
sudo systemctl start docker     # 启动 Docker 服务
sudo systemctl stop docker      # 停止 Docker 服务
sudo systemctl restart docker   # 重启 Docker 服务
sudo systemctl status docker    # 查看 Docker 服务状态
sudo systemctl enable docker    # 设置 Docker 开机自启
sudo systemctl disable docker   # 禁用 Docker 开机自启

# 清理系统
docker system prune         # 清理未使用的数据
docker system prune -a      # 清理所有未使用的数据
docker system prune --volumes  # 包括数据卷清理

# 事件监控
docker events
docker events --since 1h
docker events --filter container=my-container
```

```bash [网络管理]
# 网络操作
docker network ls
docker network create my-network
docker network inspect my-network
docker network connect my-network container_name
docker network disconnect my-network container_name
docker network rm my-network
```

```bash [数据卷管理]
# 数据卷操作
docker volume ls
docker volume create my-volume
docker volume inspect my-volume
docker volume rm my-volume
docker volume prune         # 清理未使用的数据卷
```
:::

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

## 四、总结

Docker 通过容器化技术实现了应用的快速部署和环境一致性。掌握以下要点即可高效使用：

**核心概念**：镜像（模板）→ 容器（运行实例）→ Dockerfile（构建脚本）→ Compose（多容器编排）

**常用命令**：
```bash
# 镜像：pull, images, rmi
# 容器：run, ps, logs, exec, start/stop
# 系统：system prune, systemctl restart docker
```

**最佳实践**：
- 配置国内镜像源加速下载
- 使用 `--restart=unless-stopped` 自动重启
- 为容器指定有意义的名称
- 合理使用数据卷持久化数据

::: info 📖 相关资源
- [Docker 官方文档](https://docs.docker.com/) - Docker 官方文档
- [Docker 官方镜像](https://hub.docker.com/) - Docker 官方镜像
- [Docker 官方仓库](https://github.com/docker-library/official-images) - Docker 官方仓库
:::
