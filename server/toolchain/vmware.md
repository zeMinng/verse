# VMware 虚拟机

## 概要
[VMware](https://www.vmware.com/) 是一款功能强大的虚拟化软件，可在同一物理计算机上运行多个操作系统，轻松实现 Windows、Linux、macOS 等环境的并行运行，广泛应用于开发测试、学习实验和生产部署场景。

::: info 什么是虚拟化
- **物理机 (Host)**：实际运行 VMware 的电脑  
- **虚拟机 (VM)**：在物理机上虚拟出的操作系统环境  
- **虚拟硬件**：CPU、内存、硬盘、网卡等资源由 VMware 分配  
:::

## 一、VMware 安装与配置
### 1. 安装 VMware Workstation
建议从官方渠道获取安装包，按照向导完成安装并激活，确保软件稳定运行。

### 2. 创建虚拟机
① 打开 VMware，点击**创建新的虚拟机**；② 选择安装来源（推荐 ISO 镜像文件）；③ 设置虚拟机名称与存放路径；④ 配置 CPU、内存、硬盘等硬件；⑤ 启动虚拟机并安装系统。

### 3. 性能优化
- **资源分配**：内存与 CPU 分配不超过物理机一半  
- **硬盘选择**：优先 SSD 或 NVMe 提升读写速度  
- **硬件加速**：在 BIOS 中启用 Intel VT-x / AMD-V  
- **系统精简**：关闭虚拟机中不必要的服务  

## 二、常用功能与技巧

### 1. 快照与克隆
- **快照(Snapshot)**：保存当前虚拟机状态，便于随时恢复，适合测试场景  
- **克隆(Clone)**：复制虚拟机，省去重复安装系统的麻烦  

### 2. 文件交互
- **共享文件夹**：在设置中指定宿主机路径，虚拟机可直接访问  
- **拖拽与粘贴**：安装 **VMware Tools** 后，实现宿主机与虚拟机间的文件交互  

### 3. 网络模式
- **桥接 (Bridged)**：虚拟机与宿主机处于同一局域网，可直接访问外部网络。
- **NAT**：通过宿主机访问外部网络，最常用。
- **仅主机 (Host-Only)**：虚拟机与宿主机互通，但无法访问外网。
- **自定义 (Custom)**：手动选择虚拟网卡。

## 三、常见问题与解决方案
### 1. ubuntu虚拟机安装图形化界面
```bash
# ‌安装Ubuntu桌面环境
sudo apt-get install ubuntu-desktop
# 重启虚拟机
sudo reboot
```
### 2. 解决虚拟机与主机间复制粘贴问题
:::code-group
```bash [open-vm-tools]
sudo apt-get autoremove open-vm-tools
sudo apt-get install open-vm-tools
sudo apt-get install open-vm-tools-desktop
# 重启虚拟机
```
```bash [virtualbox-guest-x11]
sudo apt-get install virtualbox-guest-x11
sudo VBoxClient --clipboard
```
:::
