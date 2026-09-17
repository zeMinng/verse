# Docker 高级进阶

## 概要

基于 Docker 基础知识，本文将深入探讨 Docker 的高级特性和生产实践。涵盖镜像优化、网络配置、存储管理、安全策略、监控部署等核心技能，帮助开发者从入门迈向精通。

## 一、镜像构建优化

### 1. 多阶段构建

多阶段构建是减小镜像体积的重要技术，通过在构建过程中只保留运行时必需的文件：

::: code-group
```dockerfile [Node.js 应用优化]
# 第一阶段：构建环境
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# 第二阶段：运行环境
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile [Go 应用优化]
# 构建阶段
FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 运行阶段
FROM alpine:latest AS runner
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main ./
EXPOSE 8080
CMD ["./main"]
```

```dockerfile [Python 应用优化]
# 构建阶段
FROM python:3.9-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# 运行阶段
FROM python:3.9-slim AS runner
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 5000
CMD ["python", "app.py"]
```
:::

### 2. 镜像分层优化

合理利用 Docker 的分层缓存机制可以大幅提升构建效率：

```dockerfile
# ✅ 优化的分层结构
FROM node:16-alpine

# 1. 安装系统依赖（变化频率最低）
RUN apk add --no-cache git

# 2. 复制依赖文件并安装（依赖变化时才重新构建）
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 3. 复制源代码（变化频率最高）
COPY . .

# 4. 设置启动命令
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. .dockerignore 优化

有效的 `.dockerignore` 文件可以减少构建上下文大小：

```
# 版本控制
.git
.gitignore

# 依赖目录
node_modules
__pycache__
*.pyc

# 构建产物
dist/
build/
target/

# 日志文件
*.log
logs/

# 开发工具
.vscode/
.idea/
*.swp
*.swo

# 环境配置
.env.local
.env.development

# 文档
README.md
DOCS.md
*.md
```

## 二、网络配置管理

### 1. 自定义网络

Docker 提供多种网络模式，自定义网络是生产环境的最佳选择：

::: code-group
```bash [网络操作命令]
# 创建自定义网络
docker network create --driver bridge my-app-network
docker network create --driver overlay --attachable my-swarm-network

# 查看网络详情
docker network ls
docker network inspect my-app-network

# 连接容器到网络
docker run -d --name web --network my-app-network nginx
docker network connect my-app-network existing-container

# 断开网络连接
docker network disconnect my-app-network container-name

# 删除网络
docker network rm my-app-network
```

```yaml [Compose 网络配置]
version: '3.8'

services:
  web:
    image: nginx
    networks:
      - frontend
      - backend
    ports:
      - "80:80"

  app:
    build: .
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

### 2. 服务发现与负载均衡

```yaml
# docker-compose.yml - 内置负载均衡
version: '3.8'

services:
  nginx:
    image: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

  app:
    build: .
    deploy:
      replicas: 3  # 启动3个实例
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 三、存储管理

### 1. 数据卷类型与选择

::: code-group
```bash [绑定挂载 (Bind Mounts)]
# 直接挂载主机目录到容器
docker run -d \
  -v /host/data:/container/data \
  -v /host/config:/etc/app/config:ro \
  --name my-app nginx

# 使用 --mount 语法（推荐）
docker run -d \
  --mount type=bind,source=/host/data,target=/container/data \
  --mount type=bind,source=/host/config,target=/etc/app/config,readonly \
  --name my-app nginx
```

```bash [命名卷 (Named Volumes)]
# 创建和管理命名卷
docker volume create my-app-data
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/dir \
  nfs-volume

# 使用命名卷
docker run -d \
  -v my-app-data:/var/lib/app \
  --name my-app nginx

# 查看卷信息
docker volume ls
docker volume inspect my-app-data

# 备份和恢复
docker run --rm \
  -v my-app-data:/data \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/backup.tar.gz -C /data .
```

```bash [临时文件系统 (tmpfs)]
# 内存中的临时存储
docker run -d \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --name my-app nginx

# 用于敏感数据或高速缓存
docker run -d \
  --tmpfs /var/cache:rw,noexec,nosuid,size=50m \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --name cache-app redis
```
:::

### 2. 数据备份策略

```bash
# 数据库备份脚本
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# MySQL 备份
docker exec mysql-container mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
  --all-databases > $BACKUP_DIR/mysql-backup.sql

# PostgreSQL 备份
docker exec postgres-container pg_dumpall -U postgres > \
  $BACKUP_DIR/postgres-backup.sql

# 文件系统备份
docker run --rm \
  -v app_data:/data:ro \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/app-data.tar.gz -C /data .

# 清理旧备份（保留7天）
find /backup -type d -mtime +7 -exec rm -rf {} +
```

## 四、安全最佳实践

### 1. 容器安全配置

::: code-group
```dockerfile [安全的 Dockerfile]
# 使用官方基础镜像
FROM node:16-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 安装依赖并清理
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 复制应用文件并设置权限
COPY --chown=nextjs:nodejs . .

# 切换到非 root 用户
USER nextjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]
```

```yaml [安全的 Compose 配置]
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    # 安全配置
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    user: "1001:1001"
    
  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # 网络隔离
    networks:
      - backend

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  postgres_data:

networks:
  backend:
    driver: bridge
    internal: true
```
:::

### 2. 镜像安全扫描

```bash
# 使用 Docker Scout 扫描
docker scout cves my-app:latest
docker scout recommendations my-app:latest

# 使用 Trivy 扫描
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image my-app:latest

# 使用 Snyk 扫描
docker run --rm -it \
  -v $(pwd):/project \
  -v /var/run/docker.sock:/var/run/docker.sock \
  snyk/snyk-cli:docker test my-app:latest
```

## 五、监控与日志

### 1. 容器监控

::: code-group
```yaml [Prometheus + Grafana 监控栈]
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    labels:
      - "prometheus.scrape=true"
      - "prometheus.port=3000"
      - "prometheus.path=/metrics"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:
```

```yaml [cAdvisor 资源监控]
cadvisor:
  image: gcr.io/cadvisor/cadvisor:latest
  ports:
    - "8080:8080"
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:rw
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
    - /dev/disk/:/dev/disk:ro
  privileged: true
  devices:
    - /dev/kmsg
```
:::

### 2. 日志管理

```yaml
# ELK Stack 日志管理
version: '3.8'

services:
  app:
    build: .
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## 六、生产部署策略

### 1. 滚动更新

```bash
# Docker Swarm 滚动更新
docker service create \
  --name my-web \
  --replicas 3 \
  --update-delay 10s \
  --update-parallelism 1 \
  --update-failure-action rollback \
  nginx:1.20

# 更新服务
docker service update --image nginx:1.21 my-web

# 回滚服务
docker service rollback my-web
```

### 2. 蓝绿部署

```yaml
# docker-compose.blue.yml
version: '3.8'
services:
  app:
    image: my-app:v1.0
    ports:
      - "8080:3000"
    environment:
      - COLOR=blue
    networks:
      - app-network

networks:
  app-network:
    external: true
```

```bash
# 蓝绿部署脚本
#!/bin/bash
CURRENT_COLOR=$(docker-compose -f docker-compose.current.yml ps --services)
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

echo "当前环境: $CURRENT_COLOR, 部署到: $NEW_COLOR"

# 启动新环境
docker-compose -f docker-compose.$NEW_COLOR.yml up -d

# 健康检查
for i in {1..30}; do
  if curl -f http://localhost:808$([ "$NEW_COLOR" = "blue" ] && echo "0" || echo "1")/health; then
    echo "新环境健康检查通过"
    break
  fi
  sleep 2
done

# 更新 nginx 配置切换流量
sed -i "s/$CURRENT_COLOR/$NEW_COLOR/g" nginx.conf
nginx -s reload

# 停止旧环境
docker-compose -f docker-compose.$CURRENT_COLOR.yml down

echo "蓝绿部署完成: $CURRENT_COLOR -> $NEW_COLOR"
```

## 七、性能优化

### 1. 资源限制与调优

```yaml
version: '3.8'

services:
  app:
    build: .
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    sysctls:
      - net.core.somaxconn=1024
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

### 2. 镜像缓存优化

```bash
# 使用 BuildKit 缓存
export DOCKER_BUILDKIT=1
docker build \
  --cache-from my-app:cache \
  --target production \
  -t my-app:latest .

# 多平台构建与缓存
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from type=registry,ref=my-app:cache \
  --cache-to type=registry,ref=my-app:cache,mode=max \
  -t my-app:latest \
  --push .
```

## 八、总结

Docker 高级特性的掌握需要在实践中不断积累经验。重点关注：

**核心技能**：镜像优化 → 网络配置 → 存储管理 → 安全加固 → 监控部署

**最佳实践**：
- 使用多阶段构建减小镜像体积
- 配置自定义网络隔离服务
- 合理选择存储类型持久化数据
- 遵循安全原则加固容器配置
- 建立完善的监控和日志体系

**生产建议**：
- 制定完整的 CI/CD 流水线
- 实施蓝绿或滚动部署策略
- 建立灾备和恢复机制
- 定期进行安全审计和性能调优

::: tip 🚀 进阶学习
掌握这些高级特性后，建议学习：
- **Kubernetes** - 容器编排平台
- **Istio** - 服务网格技术
- **Harbor** - 企业级镜像仓库
- **Helm** - Kubernetes 包管理器
:::