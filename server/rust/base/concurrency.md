# 并发与异步

## 概要

Rust 的类型系统和所有权机制让并发 bug（数据竞争）在**编译期**被消灭——这被称为=="无畏并发"==。本页从线程和 Channel 起步，介绍 `Send` / `Sync` 如何从类型层面保证线程安全，最后进入 `async` / `await` 异步世界。

::: tip 前置知识
阅读前请先熟悉 [所有权与生命周期](./ownership) 中的 `Arc`、`Rc` 和借用规则——这些是理解并发安全的基础。
:::

## 一、线程基础

`thread::spawn` 创建新线程，返回 `JoinHandle`。调用 `join()` 等待线程结束并获取结果：

```rust{6,13}
use std::thread;
use std::time::Duration;

fn main() {
  let handle = thread::spawn(|| {
    for i in 1..=3 {
      println!("子线程: {i}");
      thread::sleep(Duration::from_millis(10));
    }
    "done" // 线程返回值
  });

  // 主线程继续执行
  println!("主线程工作中...");
  let result = handle.join().unwrap();
  println!("子线程返回: {result}");
}
```

`spawn` 的闭包默认捕获引用，如果需要把数据的所有权转移到新线程中，使用 `move` 闭包：

```rust{4,5}
use std::thread;

fn main() {
  let msg = String::from("来自主线程");
  let handle = thread::spawn(move || {        // move 转移所有权
    println!("子线程收到: {msg}"); // msg 所有权移入子线程
  });
  handle.join().unwrap();
}
```

## 二、线程安全: Send 与 Sync

Rust 如何做到"编译期发现数据竞争"？答案在于两个**自动 Trait**。你可能不需要自己实现它们，但理解 Send/Sync 能帮你读懂编译器错误——当看到 `Rc<T> cannot be sent between threads` 时就知道该换 `Arc<T>`。

| Trait | 含义 | 标注了此 Trait 的类型可以... |
| --- | --- | --- |
| `Send` | 可在线程间转移所有权 | `thread::spawn(move || ...)` |
| `Sync` | 可在多线程间共享引用 | `&T` 可被多个线程同时访问 |

绝大多数 Rust 标准库类型都实现了 `Send` 和 `Sync`，编译器自动推导。关键是**不实现**的情况：

- **`Rc<T>` 不实现 `Send` 和 `Sync`**：它的引用计数操作不是原子操作，跨线程会导致计数错误。需要跨线程共享时用 `Arc<T>`（Atomic Reference Count）。
- **`RefCell<T>` 不实现 `Sync`**：它的运行时借用检查不是线程安全的。多线程共享可变数据用 `Mutex<T>` 或 `RwLock<T>`。
- **裸指针（`*const T`、`*mut T`）不实现两者**：需要在 `unsafe` 块中手动保证安全。

::: warning 编译期检查
如果尝试把 `Rc<T>` 传给 `thread::spawn(move || ...)`，编译器会直接报错。这意味着你**不可能**在运行时意外遇到 `Rc` 的跨线程数据竞争——错误提前到编译期。
:::

## 三、消息传递: Channel

**"不要通过共享内存来通信，而要通过通信来共享内存。"** Rust 提供 `mpsc`（multiple producer, single consumer）channel：

```rust{1,6,9,12,16}
use std::thread;
use std::sync::mpsc;

fn main() {
  let (tx, rx) = mpsc::channel();

  // 多个生产者
  for id in 0..3 {
    let tx = tx.clone();
    thread::spawn(move || {
      tx.send(format!("线程 {id} 的消息")).unwrap();
    });
  }
  drop(tx); // 关闭原始发送端，rx 迭代才能结束

  // 单个消费者
  for msg in rx {
    println!("收到: {msg}");
  }
}
```

注意 `drop(tx)` 这行——如果不丢弃原始发送端，接收端的 `for` 循环会永远等待新消息。`drop(tx)` 告诉 channel 不会再有新消息了。

## 四、共享状态: Mutex

`Mutex<T>` 提供互斥访问，配合 `Arc` 在多线程间共享。`lock()` 返回 `MutexGuard`，离开作用域自动解锁：

```rust{1,6,12-13}
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
  let counter = Arc::new(Mutex::new(0));
  let mut handles = vec![];

  for _ in 0..5 {
    let counter = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
      let mut n = counter.lock().unwrap();
      *n += 1;
    }));
  }
  for h in handles { h.join().unwrap(); }

  println!("counter = {}", *counter.lock().unwrap()); // 5
}
```

::: tip 选择建议
优先使用 Channel 传递消息——它强制清晰的所有权边界，更不容易出错。Mutex 适合多个线程需要同时读写同一块数据的场景。
:::

前面所有例子都基于操作系统线程——每个线程都有独立栈空间，创建和切换有固定开销。当程序大部分时间在等网络响应或文件读写时，线程大部分空闲却占着资源。Rust 的 **async/await** 提供了另一种并发模型：用更轻量的"任务"替代线程，在等待 IO 时主动让出执行权，一个线程可以驱动成千上万个异步任务。

## 五、异步编程: async / await

Rust 的异步编程基于 `async` / `await` 语法，需要运行时来驱动。生态中最常用的是 ==Tokio==。

### 1. Tokio 入门

```rust{3,6,8-9}
// Cargo.toml 添加: tokio = { version = "1", features = ["full"] }

#[tokio::main]                  // 启动 Tokio 运行时
async fn main() {
  // 并发执行多个异步任务
  let task1 = tokio::spawn(async { fetch_data(1).await });
  let task2 = tokio::spawn(async { fetch_data(2).await });

  let r1 = task1.await.unwrap();
  let r2 = task2.await.unwrap();
  println!("result: {r1}, {r2}");
}

async fn fetch_data(id: u32) -> String {
  // 模拟异步 IO
  tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
  format!("data-{id}")
}
```

`#[tokio::main]` 将 `async fn main` 转换为普通 `main` 并启动 Tokio 运行时。`tokio::spawn` 类似 `thread::spawn`，但运行在异步任务而非操作系统线程上。

### 2. 异步 Channel

`tokio::sync::mpsc` 提供异步版本的消息传递：

```rust{1,5,7,12}
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
  let (tx, mut rx) = mpsc::channel(32);  // 创建异步 channel

  tokio::spawn(async move {
    for i in 0..3 {
      tx.send(format!("msg-{i}")).await.unwrap();
    }
  });

  while let Some(msg) = rx.recv().await {  // 异步接收
    println!("收到: {msg}");
  }
}
```

### 3. 常用异步生态

| 库 | 用途 |
| --- | --- |
| `tokio` | 异步运行时，网络 IO、定时器、文件 IO |
| `axum` | Web 框架，基于 Tokio |
| `sqlx` | 异步数据库驱动（PostgreSQL、MySQL、SQLite） |
| `reqwest` | HTTP 客户端 |
| `serde` | 序列化 / 反序列化 |
| `tracing` | 链路追踪与日志 |

做 Web API 选 `axum`，调外部 HTTP 接口选 `reqwest`，需要异步操作数据库选 `sqlx`，序列化几乎必装 `serde`。前三者都依赖 `tokio` 作为运行时底座。

## 六、异步 vs 线程：如何选择

| 维度 | 线程（`std::thread`） | 异步（`tokio::spawn`） |
| --- | --- | --- |
| 适用场景 | CPU 密集型（计算、编解码） | IO 密集型（网络、文件、数据库） |
| 并发模型 | 抢占式：操作系统调度 | 协作式：`.await` 主动让出 |
| 切换开销 | 较大（上下文切换） | 极小（状态机切换） |
| 可创建的并发数 | 数百到数千 | 数十万甚至百万 |
| 运行时要求 | 无，标准库提供 | 需要 Tokio 等第三方运行时 |

两者可以混合使用——如果 90% 是 IO 等待、10% 是 JSON 解析，纯异步就够了；如果单个请求要跑 500ms 的重计算，用 `tokio::task::spawn_blocking` 把计算隔离到线程池，避免阻塞异步运行时。

## 小结

- **线程**通过 `thread::spawn` + `join` 创建和管理；`move` 闭包转移数据所有权到子线程
- **`Send` / `Sync`** 是 Rust 并发安全的基石——`Rc` 不实现二者（跨线程报编译错），改用 `Arc`
- **Channel** 遵循"通信而非共享"原则，`mpsc` 支持多生产者单消费者
- **`Arc<Mutex<T>>`** 实现多线程共享可变数据，`lock()` 返回守卫自动管理锁生命周期
- **异步（Tokio）**适合 IO 密集型高并发场景，`async` / `await` + `tokio::spawn` 并发执行
- **选型**：IO 密集 → 异步，CPU 密集 → 线程，混合 → `spawn_blocking`

:::info 📖 相关资源
- [Rust 语法基础](./) - 前置知识：变量、类型、流程控制
- [模块系统](./modules) - Package/Crate、模块树、路径体系与可见性控制
- [所有权与生命周期](./ownership) - `Arc`/`Rc`/借用规则
- [类型系统](./types) - `Result`/`Option` 错误处理
- [Rust 程序设计语言 - 并发](https://doc.rust-lang.org/book/ch16-00-concurrency.html) - 第 16 章
- [Rust 程序设计语言 - 异步](https://doc.rust-lang.org/book/ch17-00-async-await.html) - 第 17 章
- [Tokio 官方教程](https://tokio.rs/tokio/tutorial) - 异步运行时入门
- [Rust 工程实践](./engineering) - 项目结构、测试、依赖管理
:::
