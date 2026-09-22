# K8S 基础

## 概要

[Kubernetes](https://kubernetes.io/zh-cn/)（简称 K8s）是一个开源的容器编排平台，用于自动化管理容器化应用。你可以把它理解为容器的调度与管理中心，让应用更高效、可扩展、可靠运行。

## 一、快速开始（本地学习环境）

如果你只是想**快速搭一套可用的 K8s** 来练习 YAML 与 `kubectl`，优先选下面任意一种：

- **kind**：最轻量、适合 CI/本地（K8s 跑在 Docker 容器里）
- **minikube**：适合需要更“像真实集群”的本地体验（支持多种驱动）
- **k3d**：基于 k3s 的轻量集群（同样跑在 Docker 里，上手快）

::::tip 建议
初学阶段不要纠结“生产怎么装集群”。先把 `kubectl apply/get/describe/logs/exec` 练熟，进阶再学 Helm、Ingress Controller、CNI/CSI 等。
::::

## 二、核心概念

### 1. 集群架构组件

- **Master 节点（控制平面）**
  - **API Server**：集群的统一入口，接收和处理所有 REST 请求
  - **etcd**：分布式键值存储，保存集群的所有配置信息
  - **Controller Manager**：运行控制器进程，管理集群状态
  - **Scheduler**：负责将 Pod 调度到合适的 Node 上

- **Worker 节点**
  - **kubelet**：在每个节点上运行的代理，管理容器的生命周期
  - **kube-proxy**：维护网络规则，实现服务的网络代理
  - **Container Runtime**：容器运行时（如 Docker、containerd）

### 2. 核心资源对象

- **Pod**：K8s 中最小的部署单元，包含一个或多个紧密相关的容器
- **Service**：为 Pod 提供稳定的网络访问入口
- **Deployment**：管理 Pod 的部署和更新
- **ConfigMap**：存储非敏感的配置数据
- **Secret**：存储敏感数据如密码、token
- **Namespace**：提供资源隔离的虚拟集群

## 三、基本操作

### 1. kubectl 命令行工具

kubectl 是 K8s 的命令行客户端，用于与集群交互。

#### 常用命令

:::: code-group
```bash [集群与上下文]
# 查看集群信息
kubectl cluster-info

# 查看 kubeconfig 当前上下文
kubectl config current-context

# 切换上下文
kubectl config use-context <context-name>

# 常用：设置默认命名空间（仅影响当前上下文）
kubectl config set-context --current --namespace=<ns>
```

```bash [查询（get/describe）]
# 查看节点
kubectl get nodes

# 查看命名空间
kubectl get ns

# 查看资源（带命名空间）
kubectl get pods -n kube-system
kubectl get deploy,svc -n default

# 查看更详细信息（事件/调度/探针等）
kubectl describe pod <pod-name> -n <ns>
```

```bash [变更（apply/delete/rollout）]
# 创建/更新资源（推荐写法）
kubectl apply -f deployment.yaml

# 删除资源
kubectl delete -f deployment.yaml

# 发布/回滚（Deployment）
kubectl rollout status deploy/<deploy-name> -n <ns>
kubectl rollout history deploy/<deploy-name> -n <ns>
kubectl rollout undo deploy/<deploy-name> -n <ns>
```

```bash [调试（logs/exec/port-forward）]
# 查看日志（单容器）
kubectl logs <pod-name> -n <ns>

# 多容器 Pod：指定容器
kubectl logs <pod-name> -c <container-name> -n <ns>

# 进入容器（镜像不一定有 /bin/bash，常用 /bin/sh）
kubectl exec -it <pod-name> -n <ns> -- /bin/sh

# 端口转发（调试服务很常用）
kubectl port-forward pod/<pod-name> 8080:80 -n <ns>
kubectl port-forward svc/<svc-name> 8080:80 -n <ns>
```
::::

::::warning 小坑
`kubectl get pods --all-namespaces` 已逐步不推荐使用（更建议 `-A`），同时很多团队会要求命令显式 `-n <ns>`，避免误操作默认命名空间。
::::

## 四、实践示例

### 1. 创建一个简单的 Nginx 部署

```yaml
# nginx-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.20
        ports:
        - containerPort: 80
```

### 2. 创建 Service 暴露应用

```yaml
# nginx-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

::::tip 说明
本地集群（kind/minikube）不一定有云厂商的 LoadBalancer。你可以改用 `NodePort`，或者保留 `ClusterIP` 再用 `kubectl port-forward` 访问。
::::

### 3. 部署步骤

```bash
# 1. 创建部署
kubectl apply -f nginx-deployment.yaml

# 2. 创建服务
kubectl apply -f nginx-service.yaml

# 3. 查看部署状态
kubectl get deployments
kubectl get pods
kubectl get services

# 4. 测试访问
kubectl get service nginx-service
```

## 五、网络模型

### 1. Pod 网络
- 每个 Pod 都有唯一的 IP 地址
- Pod 内的容器共享网络命名空间
- Pod 之间可以直接通信

### 2. Service 网络
- **ClusterIP**：集群内部访问（默认）
- **NodePort**：通过节点端口访问
- **LoadBalancer**：通过云提供商的负载均衡器访问
- **ExternalName**：将服务映射到外部域名

### 3. Ingress
- 提供从集群外部到集群内服务的 HTTP 和 HTTPS 路由
- 可以提供负载均衡、SSL 终止和基于名称的虚拟主机

::::info 记忆方式
- **Service** 解决“Pod IP 会变，怎么稳定访问”的问题
- **Ingress** 解决“多个 HTTP(S) 服务怎么统一入口、按域名/路径路由”的问题
::::

## 六、存储管理

### 1. Volume 类型
- **emptyDir**：Pod 生命周期内的临时存储
- **hostPath**：挂载宿主机目录
- **persistentVolume**：持久化存储
- **configMap**：挂载配置文件
- **secret**：挂载敏感数据

### 2. 持久化存储

```yaml
# PersistentVolume 示例
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-example
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /data/pv-example
```

## 七、配置管理

### 1. ConfigMap 示例

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.properties: |
    database.host=localhost
    database.port=5432
  log-level: "INFO"
```

### 2. Secret 示例

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  username: YWRtaW4=  # base64 编码的 'admin'
  password: MWYyZDFlMmU2N2Rm  # base64 编码的密码
```

::::warning 注意
`Secret.data` 需要 **base64**；如果你想直接写明文，用 `stringData` 更友好（apiserver 会自动转成 `data`）。
::::

## 八、最佳实践

### 1. 资源限制
- 为容器设置 CPU 和内存的 requests 和 limits
- 使用 ResourceQuota 限制命名空间资源使用

### 2. 健康检查
- 配置 livenessProbe 检测容器是否正常运行
- 配置 readinessProbe 检测容器是否准备好接收流量

### 3. 安全性
- 使用非 root 用户运行容器
- 设置 Pod Security Standards
- 使用 RBAC 控制访问权限

### 4. 监控和日志
- 使用 Prometheus 进行监控
- 集中化日志收集（如 ELK Stack）
- 设置告警规则

## 九、常见问题排查

### 1. Pod 无法启动

:::: code-group
```bash [看事件与状态]
# 最常用：状态 + 事件（拉镜像失败、调度失败、探针失败等）
kubectl describe pod <pod-name> -n <ns>
```

```bash [看日志]
# 只看当前容器日志
kubectl logs <pod-name> -n <ns>

# 容器重启过：看上一次崩溃的日志
kubectl logs <pod-name> -n <ns> --previous

# 多容器 Pod：指定容器
kubectl logs <pod-name> -c <container-name> -n <ns>
```

```bash [看资源]
# 需要 metrics-server 才能用 top
kubectl top nodes
kubectl top pods -A
```
::::

### 2. 网络连通性问题
```bash
# 测试 Pod 间网络
kubectl exec -it pod1 -- ping pod2-ip

# 测试服务访问
kubectl exec -it pod-name -- nslookup service-name

# 查看 Service 端点
kubectl get endpoints service-name
```

### 3. 存储问题
```bash
# 查看 PV 和 PVC 状态
kubectl get pv
kubectl get pvc

# 查看存储类
kubectl get storageclass
```

## 小结

::::info 📖 学习资源
- [Kubernetes 官方文档](https://kubernetes.io/zh-cn/docs/)
- [kubectl 命令参考](https://kubernetes.io/docs/reference/kubectl/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)
- [Killercoda Kubernetes](https://killercoda.com/kubernetes)
- 《Kubernetes in Action》
- 《Kubernetes 权威指南》
::::