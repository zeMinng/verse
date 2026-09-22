# UV 极速指南

## 概要

[UV](https://docs.astral.sh/uv/) 是由 Astral 开发的新一代 Python 包和项目管理工具（用 Rust 编写）。它可以完美替代 pip、pip-tools、virtualenv 甚至 pyenv，带来成百上千倍的速度提升。还能同时管理 Python 版本、虚拟环境和项目依赖。

## 一、快速安装

请根据你的操作系统，选择对应的命令在终端中运行：

::: code-group
```powershell [Windows (PowerShell)]
# 安装完成后，请重启你的终端窗口以使环境变量生效。
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# 可能还需要设置环境变量
$env:Path = "C:\Users\24393\.local\bin;$env:Path"

uv --version
```

```bash [macOS / Linux]
curl -LsSf https://astral.sh/uv/install.sh | sh
```
:::

## 二、Python 版本管理

如果你的电脑上还没有 Python，`uv` 可以直接帮你下载并管理。

:::code-group
```powershell [安装]
# 安装最新的稳定版 Python
uv python install
# 安装指定版本的 Python
uv python install 3.11
uv python install 3.12

# 查看已安装的版本
uv python list
# 查看当前已安装版本
uv python list --only-installed
```

```powershell [创建项目]
# 初始化uv
uv init
uv init hello-python
# 创建虚拟环境
uv venv
```
:::

## 三、核心使用场景

### 1. 临时运行脚本 (单文件)

无需手动创建虚拟环境或安装依赖，`uv run` 会在后台自动处理一切。

```bash
# 自动下载 requests 库并在隔离环境中运行脚本
uv run --with requests my_script.py
```

### 2. 作为传统的 pip 替代品

如果你习惯了旧的开发工作流，可以直接使用 `uv pip`，它完全兼容 `pip` 的语法，但速度极快。

```bash
# 创建虚拟环境 (.venv)
uv venv

# 激活环境 (Windows 用户请运行 .venv\Scripts\activate)
source .venv/bin/activate

# 极速安装依赖
uv pip install requests django
uv pip install -r requirements.txt
```

### 3. 管理现代 Python 项目 (推荐)

如果你在开发一个完整的现代项目，可以使用类似 `npm` 或 `cargo` 的声明式管理方式。

```bash
# 初始化一个新项目
uv init my-project
cd my-project

# 添加依赖（会自动写入 pyproject.toml 并更新锁文件）
uv add requests

# 运行项目
uv run main.py
```

## 四、常用命令速查表

| 命令 | 说明 | 对应传统命令 |
| --- | --- | --- |
| `uv python install` | 安装 Python 解释器 | `pyenv install` |
| `uv venv` | 创建虚拟环境 | `python -m venv` |
| `uv pip install` | 极速安装包 | `pip install` |
| `uv run <file>` | 在正确环境中运行脚本 | `python <file>` |
| `uv add <package>` | 为项目添加并锁定依赖 | `pip install && pip freeze` |


## 小结

### 缓存清理

uv 采用了激进的缓存策略来加速后续的安装。如果你想清理缓存释放磁盘空间，可以运行：

```bash
uv cache clean
```

### 与 Docker 结合

在 Dockerfile 中使用 uv 可以极大地缩短镜像构建时间：

```dockerfile
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
# 接下来可以使用 uv pip install ...
```