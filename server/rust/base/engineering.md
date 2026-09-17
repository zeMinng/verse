# Rust 工程实践

## 概要

本页聚焦 ==Rust 项目从开发到交付的完整链路==：项目结构、Cargo 工具链、依赖管理、错误处理策略、测试分层、性能观测和 CI/CD。适合已有 [语法基础](./) 的读者，在开始真实项目前建立工程化的肌肉记忆。

## 一、推荐项目结构

单 crate 项目足够覆盖大多数中小型服务：

```text
my-rust-app/
├─ Cargo.toml
├─ src/
│  ├─ main.rs          # 程序入口
│  ├─ lib.rs           # 可复用模块与对外导出
│  ├─ config.rs        # 配置管理
│  ├─ error.rs         # 错误类型定义
│  └─ service/
│     └─ user.rs       # 业务逻辑模块
└─ tests/
   └─ api_test.rs      # 集成测试
```

多 crate 场景使用 workspace，共享编译缓存和依赖：

```toml
# 根目录 Cargo.toml
[workspace]
members = ["core", "web", "cli"]
resolver = "2"
```

`main.rs` 是二进制入口，只做启动和依赖注入，不写业务逻辑；`lib.rs` 是库根节点，承载**所有可复用的核心代码**并对外暴露 API；`tests/` 存放集成测试，每个 `.rs` 文件作为独立 crate 编译。这个分层让代码既可以作为二进制运行，也能被其他项目作为库引用——两者不冲突。

## 二、Cargo 常用命令

```bash
### 1. 项目创建

```bash
cargo new my-rust-app     # 创建项目
```

### 2. 日常开发

```bash
cargo check               # 快速检查语法（不生成二进制，秒级反馈）
cargo run                 # 编译并运行
cargo test                # 运行所有测试
cargo doc --open          # 生成并打开文档
```

### 3. 质量检查

```bash
cargo clippy -- -D warnings  # 静态检查，CI 必装
cargo fmt --all --check   # 格式化检查
cargo audit               # 安全漏洞扫描（需安装 cargo-audit）
```

### 4. 依赖管理

```bash
cargo add serde           # 添加依赖（等价于手动编辑 Cargo.toml）
cargo remove serde        # 移除依赖
cargo update              # 更新 Cargo.lock 中的依赖版本
```

### 5. 生产构建

```bash
cargo build --release     # 优化编译，用于生产
```
```

::: tip 开发流程建议
修改代码后先用 `cargo check` 看有无语法错误（秒级反馈），确认无误再 `cargo run` 或 `cargo test`。`clippy` 和 `fmt` 建议接入 CI——它们保证代码风格和质量的一致性。
:::

## 三、依赖管理

在 `Cargo.toml` 中区分运行时依赖和开发依赖：

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1"

[dev-dependencies]
pretty_assertions = "1"

[features]
default = []
database = ["sqlx", "tokio/postgres"]  # 用 feature flag 控制可选功能
```

**版本锁定策略**：二进制项目（如 CLI 工具、微服务）应把 `Cargo.lock` 提交到 Git，确保所有开发者使用完全相同的依赖。库项目通常在 `.gitignore` 中忽略 `Cargo.lock`。

Feature flags 配合条件编译可按需引入功能：

```rust
#[cfg(feature = "database")]
pub async fn connect_db(url: &str) -> Result<DbPool> {
  // 仅在启用 "database" feature 时编译
}
```

## 四、错误处理策略

基础错误处理语法（`Result`、`Option`、`?` 运算符）见 [类型系统](./types)，本段聚焦**工程化分层策略**：

- **应用边界层**（main、HTTP handler）：使用 `anyhow::Result` 聚合上下文，链式附加错误信息
- **库 / 领域层**：使用 `thiserror` 定义明确、可匹配的错误类型

::: code-group
```rust [anyhow：应用层]
use anyhow::{Context, Result};
use std::fs;

fn read_config(path: &str) -> Result<String> {
  let text = fs::read_to_string(path)
    .with_context(|| format!("failed to read config: {path}"))?;
  Ok(text)
}
```

```rust [thiserror：领域层]
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
  #[error("connection timeout after {0}ms")]
  Timeout(u64),
  #[error("query failed: {sql}")]
  QueryFailed { sql: String },
}
```
:::

## 五、测试分层

测试体系由浅到深分三层：

```rust
// 单元测试：模块内验证函数逻辑
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_add() {
    assert_eq!(add(1, 2), 3);
  }
  #[test]
  #[should_panic(expected = "divide by zero")]
  fn test_divide_by_zero() {
    divide(1, 0);
  }
}
```

集成测试放在 `tests/` 目录，每个 `.rs` 文件作为独立 crate 编译：

```rust
// tests/api_test.rs
use my_app::create_router;

#[tokio::test]
async fn test_health_check() {
  let app = create_router();
  // ...发送请求、断言响应
}
```

常用 `cargo test` 参数：

```bash
cargo test                     # 所有测试
cargo test test_add            # 按名称过滤
cargo test -- --nocapture      # 显示 println 输出
cargo test -- --test-threads=1 # 单线程执行（避免并行冲突）
```

## 六、性能与可观测性

**基准测试**使用 `criterion`：

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn bench_fibonacci(c: &mut Criterion) {
  c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);
```

运行 `cargo bench` 即可获得统计报告。`black_box` 防止编译器优化掉被测试代码。

**链路追踪**使用 `tracing` + `tracing-subscriber`：

```rust
use tracing::{info, error, span, Level};

fn main() {
  tracing_subscriber::fmt()
    .with_max_level(Level::INFO)
    .init();

  let span = span!(Level::INFO, "request", id = 42);
  let _guard = span.enter();
  info!("start processing");
}

// 输出: 2024-01-01T00:00:00.000Z  INFO request{id=42}: start processing
```

建议先通过 `tracing` 埋点定位瓶颈，再用 `criterion` 做针对性对比，避免"感觉式调优"。

## 七、Web 后端栈

一套常见后端栈是 `axum + tokio + sqlx + serde`，足够覆盖大多数中小型服务：

```rust
// Cargo.toml
// [dependencies]
// axum = "0.7"
// tokio = { version = "1", features = ["full"] }
// serde = { version = "1", features = ["derive"] }

use axum::{routing::get, Router};

async fn hello() -> &'static str {
  "Hello, Rust!"
}

#[tokio::main]
async fn main() {
  let app = Router::new().route("/", get(hello));
  let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
  println!("listening on http://localhost:3000");
  axum::serve(listener, app).await.unwrap();
}
```

适合从"一个可运行 API 服务"开始，逐步引入鉴权（`tower` 中间件）、缓存、消息队列等能力。下一步优先补充：CORS 中间件（`tower-http::cors`）、请求日志（`tower-http::trace`）、健康检查端点——这三个是生产环境的基本要求。

## 八、CI / CD

GitHub Actions 基础 Rust workflow：

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo check --workspace
      - run: cargo test --workspace
      - run: cargo fmt --all --check
      - run: cargo clippy -- -D warnings
```

这个配置每次 push 和 PR 都会自动运行四个检查：`cargo check` 验证类型正确、`cargo test` 跑全部测试、`cargo fmt --check` 确保格式统一、`cargo clippy -- -D warnings` 把 lint 警告升级为错误阻断 CI。

## 小结

- **项目结构**：`main.rs` 入口 + `lib.rs` 核心 + `tests/` 集成测试；多 crate 用 workspace
- **Cargo**：`check` 快速验证、`clippy` 静态检查、`fmt` 统一风格——三者接入 CI 保证质量
- **依赖管理**：区分 `[dependencies]` 和 `[dev-dependencies]`；feature flags 按需引入可选功能
- **错误处理**：应用层 `anyhow` 聚合上下文，领域层 `thiserror` 定义可匹配错误
- **测试**：单元测试 + 集成测试 + 按需 E2E；`cargo test` 参数灵活控制执行方式
- **性能**：`tracing` 埋点定位瓶颈，`criterion` 基准对比验证，避免"感觉式调优"
- **Web 栈**：`axum + tokio + sqlx + serde` 覆盖中小型服务，从 MVP 起逐步叠加中间件

:::info 📖 相关资源
- [Cargo Book](https://doc.rust-lang.org/cargo/) - Cargo 官方文档
- [anyhow](https://docs.rs/anyhow) / [thiserror](https://docs.rs/thiserror) - 错误处理
- [criterion](https://docs.rs/criterion) - 基准测试框架
- [tracing](https://docs.rs/tracing) - 链路追踪框架
- [axum](https://docs.rs/axum) - Web 框架
- [模块系统](./modules) - Package/Crate、模块树、可见性控制与实战拆分
- [Clippy Lints](https://rust-lang.github.io/rust-clippy/) - Clippy 规则列表
- [GitHub Actions - dtolnay/rust-toolchain](https://github.com/dtolnay/rust-toolchain) - CI 官方 Action
:::
