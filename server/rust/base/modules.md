# Rust 模块系统

## 概要

[Rust 模块系统](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html) 解决三个问题：**代码组织**（把相关定义归到一组）、**封装边界**（控制哪些内容对外可见）、**命名空间**（避免名称冲突）。它的设计和其他语言差异很大——不是文件系统驱动（不像 Java 那样目录即包），也无需手动维护头文件（不像 C++ 的 `#include`）。

阅读前请先熟悉 [语法基础](./) 中的 `mod`/`use`/`pub` 基本写法。全文按从大到小的递进路线展开：

```text
Package（Cargo.toml 管理的项目）
  └── Crate（编译单元：lib.rs 或 main.rs）
        └── Module（mod 声明的子模块，可嵌套）
              ├── 子模块
              │     └── use / pub use 控制外部如何访问
              └── 可见性边界（默认私有 → pub → pub(crate) → pub(super)）
```

::: tip 前置知识
如果你已经能写出 `mod garden;` 和 `use crate::garden::vegetables::Asparagus;`，但对 `crate::`、`super::`、`pub(crate)` 的含义模糊，直接跳到 [三、模块树与路径](#三模块树与路径) 和 [四、可见性控制-pub](#四可见性控制-pub)。
:::

## 一、Package 与 Crate

==Package== 是 Cargo.toml 管理的**项目单元**——你运行 `cargo new my-app` 创建的就是一个 Package。==Crate== 是 Rust 的**编译单元**——编译器一次处理一个 crate，生成一个二进制文件或一个库。

一个 Package 可以包含：
- **最多 1 个** library crate（根文件 `src/lib.rs`）
- **0 到 N 个** binary crate（根文件 `src/main.rs` 或 `src/bin/*.rs`）

`cargo new my-app` 默认创建的是 binary crate 的 Package。如果要创建一个给别人用的库，用 `cargo new my-lib --lib`，这会生成 `src/lib.rs` 而不是 `src/main.rs`。

### 1. Crate Root

==crate root== 是编译器开始编译的**入口源文件**。对于 library crate 是 `src/lib.rs`，对于 binary crate 是 `src/main.rs`。你用 `mod` 声明子模块时，编译器从 crate root 开始搜索文件。

```text
my-app/
├── Cargo.toml          # 定义 Package
└── src/
    ├── main.rs          # binary crate root（入口）
    └── lib.rs           # library crate root（可复用代码）
```

**一个 Package 同时有 `main.rs` 和 `lib.rs` 是很常见的架构**：`lib.rs` 承载核心逻辑和对外 API，`main.rs` 只做依赖注入和启动——这样你的代码既能作为二进制运行，也能被外部项目作为库引用。项目结构细节见 [工程实践](./engineering)。

## 二、定义模块: mod

`mod` 关键字用来声明一个模块。Rust 支持三种写法：

### 1. 内联模块

模块体直接写在大括号内，适合**嵌套定义小模块**或示例代码：

```rust
mod network {
    pub fn connect(addr: &str) {
        println!("连接到 {addr}");
    }

    fn internal_handshake() {
        // 默认私有，仅 network 内部可调用
    }
}

fn main() {
    network::connect("127.0.0.1:8080");
}
```

### 2. 文件模块

`mod garden;` 告诉编译器："去 `garden.rs` 文件里找这个模块的内容"。

```rust
// src/main.rs
mod garden;  // 编译器会查找 src/garden.rs

fn main() {
    garden::water();
}
```

```rust
// src/garden.rs（与 main.rs 同目录）
pub fn water() {
    println!("浇水...");
}
```

### 3. 目录模块

当模块太大需要进一步拆分时，用**目录 + `mod.rs`** 的形式：

```rust
// src/main.rs
mod garden;  // 编译器查找 src/garden/mod.rs
```

```text
src/
├── main.rs
└── garden/
    ├── mod.rs        # garden 模块的入口，声明子模块
    ├── vegetables.rs # garden 的子模块
    └── flowers.rs    # garden 的子模块
```

```rust
// src/garden/mod.rs
pub mod vegetables;  // 声明子模块 → garden/vegetables.rs
pub mod flowers;      // 声明子模块 → garden/flowers.rs

pub fn water() {
    println!("浇水...");
}
```

`mod.rs` 是模块的入口文件，相当于 Node.js 的 `index.js`。子模块在 `mod.rs` 中用 `pub mod xxx;` 声明后才对外可见——即使文件存在于目录中，没有 `mod` 声明就不会被编译。

::: warning 注意
`mod` 声明的是**逻辑树**而非文件树。只创建 `src/garden/vegetables.rs` 文件、不在 `mod.rs` 中写 `pub mod vegetables;`，这个文件不会被编译——这是新手最容易踩的坑。
:::

## 三、模块树与路径

理解路径导航是攻克模块系统的关键。==Rust 的模块树不是由文件系统自动生成的==——你需要通过 `mod` 声明在 crate root 中显式地把子模块"挂"到树上。

### 1. 模块树示例

以下目录结构：

```text
src/
├── main.rs           # crate root
├── garden/
│   └── mod.rs
│   └── vegetables.rs
└── house/
    ├── mod.rs
    └── kitchen.rs
```

对应的模块树：

```text
crate（根）
├── garden              ← mod garden;
│   └── vegetables      ← pub mod vegetables;（在 garden/mod.rs 中声明）
└── house               ← mod house;
    └── kitchen         ← pub mod kitchen;（在 house/mod.rs 中声明）
```

**关键规则**：`mod garden;` 只在 crate root（`main.rs`）中出现一次。`mod vegetables;` 只出现在 `garden/mod.rs` 中。子模块的路径前缀是从 crate root 到自身的完整路径——`kitchen` 的全路径是 `crate::house::kitchen`。

### 2. 绝对路径: `crate::`

从 crate root 开始导航，类似文件系统中的 `/`：

```rust
// src/main.rs
mod garden;  // crate root 声明 garden 模块

fn main() {
    // 绝对路径：从 crate root 出发
    crate::garden::vegetables::plant("番茄");
}
```

```rust
// src/garden/mod.rs
pub mod vegetables;
```

```rust
// src/garden/vegetables.rs
pub fn plant(name: &str) {
    println!("种植 {name}");
}
```

`crate::` 前缀在整个 crate 内部都有效——无论你在多深的子模块中，`crate::garden::vegetables::plant()` 指向的都是同一个函数。

### 3. 相对路径: `self::` 与 `super::`

在同一模块内可以直接访问兄弟项，也可以用 `self::` 显式标注当前模块，用 `super::` 访问父模块：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() { println!("加入等位"); }
    }

    pub mod serving {
        pub fn take_order() {
            // super:: 回到父模块 front_of_house
            super::hosting::add_to_waitlist();

            // self:: 显式标注当前模块（不写也行，这里仅作示意）
            self::serve_order();
        }

        fn serve_order() { println!("上菜"); }
    }
}
```

| 路径前缀 | 含义 | 类比 |
| --- | --- | --- |
| `crate::` | 从 crate root 开始 | 绝对路径 `/` |
| `self::` | 从当前模块开始 | 当前目录 `./` |
| `super::` | 从父模块开始 | 上级目录 `../` |
| 无前缀（如 `hosting::`） | 从当前模块开始，同 `self::` | 相对路径 |

::: tip 选择建议
调同一个模块内的项用相对路径（短）；跨多层调用用 `crate::`（移动代码时路径不会断裂）。无前缀的相对路径在代码重构时有隐患——如果你把一个函数移到别的模块，所有相对路径都要改，而 `crate::` 始终有效。
:::

## 四、可见性控制: pub

Rust 的可见性规则是 ==**默认私有，显式公开**==——这与所有权的思想一脉相承：不让你访问的东西，编译器在编译期就拦住了。

### 1. 默认私有

模块内的所有项（函数、结构体、枚举、常量等）默认**仅模块内部可见**。即使子模块也看不到父模块的私有项——除非用 `pub` 或更细粒度的修饰符显式公开。

### 2. `pub` — 完全公开

```rust
mod house {
    pub fn open_door() { println!("门开了"); }     // 所有人都能调用
    fn private_secret() { println!("秘密"); }        // 仅 house 内部可调用
}

fn main() {
    house::open_door();         // ✅ 公开，可访问
    // house::private_secret(); // ❌ 私有，编译错误
}
```

### 3. 分级可见性

`pub` 不是唯一选项——Rust 提供了**三个层级的可见性修饰符**，让你精确控制暴露范围：

| 修饰符 | 可见范围 | 典型场景 |
| --- | --- | --- |
| `pub` | 所有人 | 对外 API |
| `pub(crate)` | 当前 crate 内 | 内部工具函数，不暴露给外部使用者 |
| `pub(super)` | 父模块 | 子模块向上级暴露，同级模块不可见 |
| `pub(in path)` | 指定路径内 | 精确控制（极少用） |

```rust
// src/lib.rs —— 一个 library crate
pub mod db {
    // 对外暴露的公共 API
    pub fn connect(url: &str) -> Connection { /* ... */ }

    // crate 内部共享，外部使用者看不到
    pub(crate) fn connection_pool() -> Pool { /* ... */ }

    // 仅 db 模块内部使用
    fn parse_url(url: &str) -> Config { /* ... */ }
}

pub mod models {
    use super::db;

    pub fn list_users() {
        let pool = db::connection_pool(); // ✅ pub(crate)，同一 crate 内可访问
        // db::parse_url("...");           // ❌ 私有，编译错误
    }
}
```

`pub(crate)` 是实际项目中最常用的分级可见性——把"内部共享但不想对外承诺兼容"的 API 收敛在 crate 边界内，后续重构时不用顾虑外部调用方。

### 4. 子模块可以访问父模块的私有项

这是 Rust 模块系统与其他语言最大的差异之一：==子模块默认可以访问父模块的私有项==。Java/C++ 的 `private` 是"只有本类能访问"，而 Rust 的私有边界是模块级别——同一父模块下的子模块之间不能互通，但每个子模块都能看到父模块的私有内容。

```rust
mod parent {
    fn private_util() -> String { String::from("辅助信息") } // 父模块私有

    pub mod child_a {
        pub fn call_parent() {
            let info = super::private_util(); // ✅ 子模块通过 super:: 访问父私有函数
            println!("child_a 获取: {info}");
        }
    }

    pub mod child_b {
        pub fn call_parent() {
            // super::super::private_util() 也可以，但没必要——super:: 就是 parent
            let info = super::private_util();
            println!("child_b 获取: {info}");
        }
    }
}

fn main() {
    parent::child_a::call_parent();
    // parent::private_util(); // ❌ 外部 crate 或父模块之外不可访问
}
```

这一设计允许你把紧密协作的子模块放在同一父模块下，共享父模块的私有辅助代码，同时对外统一暴露精选的公开 API。

## 五、use 与路径导入

如果不用 `use`，每次调用都要写完整路径：`std::collections::HashMap::new()`。==`use` 把路径缩短为可直接使用的短名==。

### 1. 基本用法

```rust
use std::collections::HashMap;   // 导入 HashMap 本身
use std::io::{self, Read};       // 批量导入：io 模块本身 + Read trait

fn main() {
    let mut map = HashMap::new();
    map.insert("rust", 2024);
}
```

`use std::io::{self, Read}` 等价于分别写 `use std::io;` 和 `use std::io::Read`——`self` 在花括号中表示"导入模块本身"。

### 2. 嵌套路径与 as 重命名

相同前缀的路径用花括号合并，减少重复。名称冲突时用 `as` 重命名：

::: code-group
```rust [嵌套路径]
use std::collections::{HashMap, HashSet};        // 两个类型同属 collections
use std::io::{self, Read, Write};                // 模块本身 + 两个 trait

fn main() {
    let mut word_count: HashMap<&str, i32> = HashMap::new();
    let mut visited: HashSet<&str> = HashSet::new();
    word_count.insert("hello", 1);
    visited.insert("hello");
    println!("{:?} {:?}", word_count, visited);
}
```

```rust [as 重命名]
use std::io::Result as IoResult;   // 避免与 crate 内自定义 Result 冲突
use std::fmt::Result as FmtResult;

fn read_config() -> IoResult<String> {
    Ok(String::from("config loaded"))
}

fn format_config() -> FmtResult {
    use std::fmt::Write;
    let mut s = String::new();
    write!(&mut s, "key=value")?; // write! 宏返回 FmtResult
    Ok(())
}
```
:::

### 3. pub use — 重导出

==`pub use`== 把导入的路径同时公开给外部使用者——你在内部用 `use` 引入了某类型，外部通过你的 crate 也能直接用。这是构建干净公开 API 的核心工具。

```rust
// src/lib.rs
pub mod db {
    mod connection;     // 私有子模块，内部实现细节
    pub use connection::Connection; // 重导出：外部通过 db::Connection 使用
}

mod db {
    pub mod connection {
        pub struct Connection { url: String }
        impl Connection {
            pub fn open(url: &str) -> Self { Connection { url: url.to_string() } }
        }
    }
    // 如果不写 pub use，外部需写 db::connection::Connection
    pub use connection::Connection;
}

// 外部使用者：
// use my_crate::db::Connection;  ← 路径干净，不用关心 connection 子模块
```

**重导出的核心价值**：你的内部模块结构可以随意重构（合并、拆分、重命名），只要 `pub use` 的公开路径不变，外部代码就不受影响。

### 4. use 的习惯用法

| 导入类型 | 习惯做法 | 原因 |
| --- | --- | --- |
| 函数 | `use parent::function_name` 导入到父模块层级 | 调用时带模块名前缀，一眼看出归属 |
| 结构体/枚举 | `use full::Path::to::Struct` 导入到当前模块 | 写全路径太啰嗦，直接用短名 |
| Trait | `use TraitName` 导入，或用 `as _` 匿名导入 | trait 方法需要对当前类型生效 |
| 同名项 | `as` 重命名，或保留父模块前缀 | 避免歧义 |

```rust
// 函数的习惯用法：use 到函数所在模块，调用时带模块前缀
use std::fs;

fn main() {
    let content = fs::read_to_string("config.toml").unwrap(); // 一眼看出是 fs 模块的函数
}

// 结构体的习惯用法：路径全引入，直接用短名
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new(); // 直接用 HashMap，不用加前缀
}
```

## 六、模块拆分实战

### 1. 拆分信号

不需要一开始就分模块——单文件 200~300 行以内完全够用。以下信号出现时再拆：

- **自然分组**：几个函数都跟用户有关，另几个都是数据库操作——它们已经在概念上形成了边界
- **导航困难**：在同一个文件中频繁翻找函数定义
- **需要控制可见性**：某组函数希望对外的暴露面只有 2 个，其余都是内部实现

### 2. 可见性设计原则

按照"最小可见"原则逐级放开：

1. 先全部写为**模块私有**（不加 `pub`）
2. 确认需要被其他模块调用时 → 加 `pub(crate)`
3. 确认需要被外部 crate 使用者调用时 → 加 `pub`

**为什么顺序是这样？** `pub` 是 API 承诺——你不小心改了签名，下游就会编译失败。`pub(crate)` 只影响自己的 crate，重构成本低得多。

### 3. 常见目录布局

中等规模项目的典型结构：

```text
src/
├── main.rs                # 启动入口，依赖注入
├── lib.rs                 # crate root，声明所有顶级模块
├── config.rs              # 配置加载
├── error.rs               # 统一错误类型
├── db/
│   ├── mod.rs             # pub mod models; pub use models::*;
│   ├── models.rs          # 数据模型
│   └── connection.rs      # 数据库连接与连接池
├── services/
│   ├── mod.rs
│   ├── user.rs            # 用户业务逻辑
│   └── order.rs           # 订单业务逻辑
└── handlers/
    ├── mod.rs
    ├── user_handler.rs    # HTTP 请求处理
    └── order_handler.rs
```

```rust
// src/lib.rs —— 声明所有顶级模块
pub mod config;
pub mod error;
pub mod db;
pub mod services;
pub mod handlers;
```

```rust
// src/db/mod.rs —— 数据库模块入口，声明子模块并重导出
mod models;
mod connection;

pub use models::*;         // 外部直接用 db::User，而非 db::models::User
pub use connection::*;
```

**核心规则回顾**：每个新文件都需要在它的父级 `mod.rs`（或 `lib.rs` / `main.rs`）中显式 `mod` 声明——Rust 不会因为文件存在就自动把它加入模块树。

## 小结

- ==Package== 是 Cargo.toml 管理的项目单元；==Crate== 是编译单元，分 binary（需要 main）和 library（需要 lib）；Module 用 `mod` 声明在模块树上
- **模块树不是文件系统自动生成的**——每个子模块必须在父模块中显式 `mod` 声明。文件存在但没 `mod` 声明 = 不会被编译
- **路径导航**：`crate::` 从根出发（绝对路径，推荐），`self::` 同模块（相对路径），`super::` 回父模块
- **默认私有，按需公开**：先不加 `pub` → 需要跨模块加 `pub(crate)` → 需要对外加 `pub`。`pub use` 重导出隐藏内部结构，保持公开 API 干净
- **子模块可通过 `super::` 访问父模块私有项**——这点和 Java/C++ 的 private 语义完全不同，是 Rust 模块系统特有的设计
- 拆分从单文件开始，出现自然分组、导航困难或可见性需求时再拆。**先 private、后 pub(crate)、最后 pub** 是稳妥的可见性扩放顺序

:::info 📖 相关资源
- [Rust 程序设计语言 - 包、Crate 与模块](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html) - 官方教程第 7 章
- [Rust Reference - 可见性与隐私](https://doc.rust-lang.org/reference/visibility-and-privacy.html) - 可见性规则的完整参考
- [Rust 模块系统详解](https://doc.rust-lang.org/reference/items/modules.html) - Rust Reference 模块章节
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) - 公开 API 设计最佳实践
- [语法基础](./) - 变量、类型、函数、流程控制、宏
- [所有权与生命周期](./ownership) - 所有权规则、借用、生命周期
- [工程实践](./engineering) - 项目结构、Cargo、测试、CI/CD
:::
