# Docker 数据卷与网络

## 概要

基于 Docker 基础知识，本文将深入探讨 Docker 的高级特性和生产实践。涵盖镜像优化、网络配置、存储管理、安全策略、监控部署等核心技能，帮助开发者从入门迈向精通。

## 一、数据卷

### 1. 数据卷类型与选择

Docker 提供三种主要的数据持久化方式，每种方式适用于不同的场景：

::: code-group
```bash [绑定挂载 (Bind Mounts)]
# 绑定挂载主机目录（需要预先创建目录）
mkdir -p ./nginx-logs ./nginx-config ./nginx-html

docker run -d --name nginx-bind \
    -v $(pwd)/nginx-logs:/var/log/nginx \
    -v $(pwd)/nginx-config:/etc/nginx/conf.d \
    -v $(pwd)/nginx-html:/usr/share/nginx/html \
    -p 8082:80 \
    nginx:alpine

# Windows 路径示例
# docker run -d --name nginx-bind \
#     -v C:/docker-data/nginx-logs:/var/log/nginx \
#     -v C:/docker-data/nginx-config:/etc/nginx/conf.d \
#     -p 8082:80 \
#     nginx:alpine

# 绑定挂载特点：
# ✓ 直接访问主机文件系统
# ✓ 实时同步，适合开发环境
# ✓ 可以设置只读权限
# ✗ 路径依赖主机文件系统
# ✗ 移植性差
```

```bash [命名卷 (Named Volumes)]
# 第一次运行时直接创建并使用命名卷
docker run -d --name nginx-named \
    -v nginx-logs:/var/log/nginx \
    -v nginx-config:/etc/nginx/conf.d \
    -p 8081:80 \
    nginx:alpine

# Docker会自动创建不存在的命名卷
docker volume ls | grep nginx

# 查看卷详情
docker volume inspect nginx-logs

# 命名卷特点：
# ✓ 易于识别和管理
# ✓ 可以在多个容器间共享
# ✓ 支持卷驱动程序
# ✓ 推荐用于生产环境数据持久化
```

```bash [匿名卷 (Anonymous Volumes)]
# 创建匿名卷 - Docker自动生成卷名
docker run -d --name nginx-anonymous \
    -v /var/log/nginx \
    -v /etc/nginx/conf.d \
    -p 8080:80 \
    nginx:alpine

# 查看匿名卷
docker volume ls
docker inspect nginx-anonymous | grep Mounts -A 10

# 匿名卷特点：
# ✓ 自动管理，无需手动创建
# ✓ 数据持久化，容器删除后数据保留
# ✗ 难以识别和管理
# ✗ 适用于临时数据存储
```
:::

### 2. 数据卷高级配置

::: code-group
```bash [卷驱动与插件]
# 安装NFS卷驱动
docker plugin install --grant-all-permissions vieux/sshfs

# 创建NFS卷
docker volume create --driver vieux/sshfs \
    -o sshcmd=user@server:/path \
    -o password=secret \
    sshfs-volume

# 使用云存储卷（AWS EBS）
docker volume create --driver rexray/ebs \
    --opt size=10 \
    --opt volumetype=gp2 \
    ebs-volume

# 查看可用驱动
docker plugin ls
```

```bash [卷权限与安全]
# 设置卷权限
docker run -d --name secure-app \
    --mount type=volume,source=app-data,target=/data,readonly \
    --user 1000:1000 \
    alpine:latest

# 使用 SELinux 标签
docker run -d --name selinux-app \
    -v /host/data:/container/data:Z \
    fedora:latest

# tmpfs 挂载（内存文件系统）
docker run -d --name temp-app \
    --tmpfs /tmp:rw,noexec,nosuid,size=100m \
    alpine:latest
```

```bash [卷备份与恢复]
# 备份数据卷
docker run --rm \
    -v nginx-logs:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/nginx-backup-$(date +%Y%m%d).tar.gz -C /data .

# 恢复数据卷
docker run --rm \
    -v nginx-logs:/data \
    -v $(pwd):/backup \
    alpine tar xzf /backup/nginx-backup-20241225.tar.gz -C /data

# 迁移数据卷
docker volume create new-volume
docker run --rm \
    -v old-volume:/from \
    -v new-volume:/to \
    alpine sh -c "cp -av /from/* /to/"
```
:::

### 3. 数据卷最佳实践

::: code-group
```bash [生产环境配置]
# 创建具有标签的卷
docker volume create \
    --label environment=production \
    --label application=wordpress \
    --label backup=daily \
    wp-content

# 使用卷进行 Nginx 负载均衡集群
docker-compose.yml:
version: '3.8'
services:
  nginx-lb:
    image: nginx:alpine
    volumes:
      - nginx-config:/etc/nginx/conf.d
      - nginx-logs:/var/log/nginx
      - ./config/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
  
  nginx-app1:
    image: nginx:alpine
    volumes:
      - app1-content:/usr/share/nginx/html
      - nginx-app1-logs:/var/log/nginx
    depends_on:
      - nginx-lb

volumes:
  nginx-config:
    driver: local
  nginx-logs:
    driver: local
    driver_opts:
      type: ext4
      device: /dev/disk/by-label/nginx-logs
  app1-content:
    driver: local
  nginx-app1-logs:
    driver: local
```

```bash [开发环境优化]
# 开发环境热重载配置
docker run -d --name dev-frontend \
    -v $(pwd)/src:/app/src \
    -v $(pwd)/public:/app/public \
    -v node_modules:/app/node_modules \
    -p 3000:3000 \
    --env-file .env.development \
    node:16-alpine \
    sh -c "npm install && npm run dev"

# 缓存优化
docker run --name build-cache \
    -v build-cache:/app/.next/cache \
    -v node_modules-cache:/app/node_modules \
    nextjs-app:latest
```

```bash [监控与维护]
# 监控卷使用情况
docker system df -v
docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Size}}"

# 清理未使用的卷
docker volume prune
docker volume prune --filter "label!=keep"

# 定期备份脚本
#!/bin/bash
BACKUP_DIR="/backup/docker-volumes"
DATE=$(date +%Y%m%d_%H%M%S)

for volume in $(docker volume ls -q); do
    echo "Backing up volume: $volume"
    docker run --rm \
        -v $volume:/data:ro \
        -v $BACKUP_DIR:/backup \
        alpine tar czf /backup/${volume}_${DATE}.tar.gz -C /data .
done

# Nginx 专用备份脚本
#!/bin/bash
NGINX_VOLUMES=("nginx-logs" "nginx-config" "nginx-content")
for vol in "${NGINX_VOLUMES[@]}"; do
    docker run --rm \
        -v $vol:/data:ro \
        -v /backup:/backup \
        alpine tar czf /backup/${vol}_$(date +%Y%m%d).tar.gz -C /data .
done
```
:::

### 4. 常见问题与解决方案

| 问题 | 症状 | 解决方案 |
| --- | --- | --- |
| **权限问题** | 容器内无法写入挂载目录 | 使用 `--user` 参数或在 Dockerfile 中设置正确的用户ID |
| **性能问题** | I/O 操作缓慢 | 使用命名卷替代绑定挂载，考虑使用 SSD 存储 |
| **空间不足** | 卷空间已满 | 清理未使用的卷，扩展底层存储，使用卷大小限制 |
| **数据丢失** | 容器删除后数据消失 | 使用命名卷或绑定挂载，避免使用匿名卷 |
| **跨平台兼容性** | Windows/Linux 路径问题 | 使用相对路径或环境变量，统一使用 `/` 分隔符 |

::: warning ⚠️ 安全注意事项
**数据卷安全最佳实践：**
- 避免挂载敏感系统目录（如 `/etc`, `/proc`）
- 使用只读挂载限制容器对主机的修改权限
- 定期备份重要数据卷
- 在生产环境中使用加密存储
- 设置适当的文件权限和所有者
:::

## 二、网络配置管理

Docker 网络是容器间通信的核心机制，支持多种网络模式和驱动，满足不同场景需求。

### 1. Docker 原生网络类型

Docker 提供五种原生网络驱动，每种适用于不同场景：

::: code-group
```bash [bridge 网络（默认）]
# 查看默认网络
docker network ls

# 创建自定义 bridge 网络
docker network create --driver bridge my-bridge-network

# 指定子网和网关创建自定义网络
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --gateway=172.20.0.1 \
  --ip-range=172.20.240.0/20 \
  custom-network

# 使用自定义 bridge 网络运行容器
docker run -d --name nginx1 \
    --network my-bridge-network \
    -p 8080:80 \
    nginx:alpine

docker run -d --name nginx2 \
    --network my-bridge-network \
    nginx:alpine

# 容器间通信（同一网络内可通过容器名访问）
docker exec nginx1 ping nginx2

docker network inspect my-bridge-network

# bridge 网络特点：
# ✓ 隔离性好，容器间默认隔离
# ✓ 支持端口映射
# ✓ 适用于单主机多容器通信
# ✗ 需要端口映射才能访问主机网络
```

```bash [host 网络]
# 使用主机网络（无网络隔离）
docker run -d --name nginx-host \
    --network host \
    nginx:alpine

# 注意：
# ✓ 性能最佳，无网络地址转换开销
# ✓ 端口直接绑定到主机
# ✗ 无隔离，端口冲突风险
# ✗ 安全性较低
# ✗ 不支持端口映射 (-p 参数无效)
```

```bash [none 网络]
# 禁用网络
docker run -d --name nginx-none \
    --network none \
    nginx:alpine

# 适用于：
# ✓ 完全隔离的容器
# ✓ 离线处理任务
# ✓ 安全敏感应用
```
:::

### 2. 自定义网络配置与服务发现

Docker 提供多种网络模式，自定义网络是生产环境的最佳选择：

::: code-group
```bash [网络操作命令]
# 创建自定义网络
docker network create --driver bridge my-app-network
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --gateway=172.20.0.1 \
  --ip-range=172.20.240.0/20 \
  custom-network

# 创建可附加的 overlay 网络（用于 Swarm 模式）
docker network create --driver overlay --attachable my-swarm-network

# 查看网络详情
docker network ls
docker network inspect my-app-network

# 连接容器到网络
docker run -d --name web --network my-app-network nginx:alpine
docker network connect my-app-network existing-container

# 为容器在新网络中指定别名
docker network connect \
  --alias webapp-alias \
  my-app-network existing-container

# 断开网络连接
docker network disconnect my-app-network container-name

# 删除网络
docker network rm my-app-network
```

```yaml [Compose 网络配置]
version: '3.8'

services:
  web:
    image: nginx:alpine
    networks:
      - frontend
      - backend
    ports:
      - "80:80"

  app:
    image: node:alpine
    networks:
      - backend
      - database
    depends_on:
      - db

  db:
    image: postgres:13
    networks:
      - database
    environment:
      POSTGRES_PASSWORD: secret

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
  database:
    driver: bridge
    internal: true  # 内部网络，不允许外部访问
```
:::

::: code-group
```bash [overlay 网络（跨主机）]
# 创建 overlay 网络（需 Swarm 模式）
docker swarm init  # 初始化 Swarm

docker network create \
    --driver overlay \
    --subnet=10.0.9.0/24 \
    --opt encrypted \
    multi-host-net

# 在 Swarm 服务中使用
docker service create \
    --name nginx-service \
    --network multi-host-net \
    --replicas 3 \
    nginx:alpine

# overlay 网络特点：
# ✓ 跨主机容器通信
# ✓ 自动服务发现
# ✓ 内置加密支持
# ✓ 适用于集群环境
```

```bash [macvlan 网络（容器直连物理网络）]
# 创建 macvlan 网络
docker network create -d macvlan \
    --subnet=172.20.0.0/16 \
    --gateway=172.20.0.1 \
    -o parent=eth0 \
    macvlan-net

# 使用 macvlan 网络
docker run -d --name nginx-macvlan \
    --network macvlan-net \
    --ip 172.20.0.10 \
    nginx:alpine

# macvlan 特点：
# ✓ 容器直接接入物理网络
# ✓ 拥有独立 IP 地址
# ✓ 性能接近物理机
# ✗ 需要网络接口支持
```

```bash [ipvlan 网络（L2/L3 模式）]
# 创建 ipvlan L2 网络
docker network create -d ipvlan \
    --subnet=192.168.10.0/24 \
    --gateway=192.168.10.1 \
    -o ipvlan_mode=l2 \
    -o parent=eth0 \
    ipvlan-net

# ipvlan 特点：
# ✓ 更高的网络性能
# ✓ 更低的资源消耗
# ✓ 支持 L2/L3 模式
# ✗ 配置复杂
```
:::

### 3. 网络驱动与配置选项

自定义网络提供了更灵活的网络管理能力，支持细粒度的配置选项：

::: code-group
```bash [网络驱动与配置选项]
# 创建带标签的自定义网络
docker network create \
  --driver bridge \
  --label environment=production \
  --label project=webapp \
  labeled-network

# 创建带 MTU 设置的网络
docker network create \
  --driver bridge \
  --opt com.docker.network.driver.mtu=1200 \
  mtu-network

# 创建带自定义选项的网络
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.name=my-bridge \
  --opt com.docker.network.bridge.enable_icc=true \
  --opt com.docker.network.bridge.enable_ip_masquerade=true \
  advanced-network

# 查看网络配置
docker network inspect advanced-network
```

```bash [IPAM 配置（IP 地址管理）]
# 创建带自定义 IPAM 配置的网络
docker network create \
  --driver bridge \
  --ipam-driver default \
  --subnet 192.168.100.0/24 \
  --ip-range 192.168.100.128/25 \
  --gateway 192.168.100.1 \
  ipam-network

# 为容器指定固定 IP
docker run -d --name nginx-fixed-ip \
  --network ipam-network \
  --ip 192.168.100.200 \
  nginx:alpine

# 验证 IP 分配
docker inspect nginx-fixed-ip | grep IPAddress
```
:::

### 4. 网络管理与优化

在生产环境中使用自定义网络的最佳实践：

::: code-group
```bash [多环境网络隔离]
# 为不同环境创建独立网络
docker network create frontend-dev
docker network create backend-dev
docker network create database-dev

docker network create frontend-prod
docker network create backend-prod
docker network create database-prod

# 开发环境部署
docker run -d --name web-dev \
  --network frontend-dev \
  nginx:alpine

docker run -d --name api-dev \
  --network frontend-dev \
  --network backend-dev \
  node:alpine

docker run -d --name db-dev \
  --network database-dev \
  --network-alias database \
  postgres:13
```

```bash [网络安全配置]
# 创建启用加密的网络
docker network create \
  --driver bridge \
  --opt encrypted \
  secure-network

# 创建禁用 IP 转发的网络
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.enable_ip_masquerade=false \
  isolated-network

# 限制主机绑定 IP
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 \
  localhost-network
```

```bash [网络监控与维护]
# 查看网络使用情况
docker network ls
docker network inspect my-app-network

# 查看容器网络连接
docker ps --format "table {{.Names}}\t{{.Networks}}"

# 清理未使用的网络
docker network prune

# 删除特定网络
docker network rm my-app-network
```
:::

### 5. 生产环境网络最佳实践

::: code-group
```bash [微服务网络架构]
# 创建多个网络隔离不同服务层
docker network create frontend-net
docker network create backend-net

# 前端服务
docker run -d --name frontend \
    --network frontend-net \
    -p 80:80 \
    nginx:alpine

# 后端服务（连接多个网络）
docker run -d --name api-server \
    --network frontend-net \
    --network backend-net \
    node:alpine

docker run -d --name database \
    --network backend-net \
    --network-alias db \
    postgres:13

# 网络策略：前端无法直接访问数据库
```

```bash [安全网络配置]
# 创建受限网络
docker network create \
    --driver bridge \
    --opt com.docker.network.bridge.enable_ip_masquerade=false \
    --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 \
    secure-net

# 使用只读根文件系统
docker run -d --name secure-nginx \
    --network secure-net \
    --read-only \
    --tmpfs /tmp \
    --tmpfs /var/cache/nginx \
    nginx:alpine
```

```bash [网络故障排查]
# 网络连通性测试
docker run -it --rm \
    --network my-bridge-network \
    alpine ping -c 3 nginx2

docker run -it --rm \
    --network my-bridge-network \
    busybox nslookup nginx2

# 查看容器网络命名空间
docker inspect nginx1 | grep -A 10 NetworkSettings

# 网络流量监控
docker exec nginx1 netstat -tuln
docker exec nginx1 ss -tuln
```
:::

### 6. 常见网络问题与解决方案

| 问题 | 症状 | 解决方案 |
| --- | --- | --- |
| **DNS 解析失败** | 容器内无法解析域名 | 检查 DNS 配置，添加 `--dns` 参数 |
| **端口冲突** | 容器启动失败，提示端口被占用 | 修改端口映射或使用 host 网络 |
| **跨主机通信失败** | 不同主机容器无法通信 | 使用 overlay 网络或配置外部网络 |
| **网络性能差** | 容器间通信延迟高 | 使用 host 网络或优化 bridge 配置 |
| **IP 地址耗尽** | 无法创建新容器 | 扩大子网范围或清理未使用网络 |
| **自定义网络创建失败** | network create 命令报错 | 检查子网配置是否冲突，确保网关在子网内 |

::: warning ⚠️ 网络安全注意事项
**Docker 网络安全最佳实践：**
- 避免在生产环境使用 `--network host`
- 使用用户自定义网络替代默认 bridge 网络
- 限制容器间不必要的通信
- 启用网络加密（overlay 网络）
- 定期清理未使用的网络
- 使用防火墙规则限制容器网络访问
- 为不同应用创建独立网络实现隔离
:::


## 三、总结

Docker 的数据卷和网络配置是容器化应用的核心基础设施。通过合理选择和配置数据持久化方案以及网络通信机制，可以构建出既安全又高效的容器化应用环境。

**数据卷使用建议：**
- 生产环境优先使用命名卷，便于管理和备份
- 开发环境可使用绑定挂载实现代码热重载
- 敏感数据应使用只读挂载和适当的权限控制

**网络配置建议：**
- 使用自定义网络替代默认 bridge 网络
- 根据应用架构合理规划网络隔离策略
- 生产环境启用网络加密和安全配置

掌握这些高级特性后，可以进一步学习 Kubernetes 等容器编排平台，实现更大规模的容器化应用部署和管理。
