# Rust 语法基础

## 概要

[Rust](https://rust-lang.org/zh-CN/) 是一门强调内存安全和高性能的系统编程语言。它通过所有权机制在编译期解决大量运行时问题，无需垃圾回收器即可保证内存安全。

## 一、变量与可变性

`let` 声明变量时默认不可变，`let mut` 才允许修改。实际开发中建议优先保持不可变，这样能减少副作用，代码也更容易维护。

Rust 还支持**变量遮蔽（shadowing）**——用同名变量覆盖旧变量，这与 `mut` 不同：遮蔽创建全新变量，可以改变类型；而 `mut` 只能修改值，类型不可变。

::: code-group
```rust [let 与 mut]
fn main() {
  let x = 10; // 默认不可变
  let mut y = 20; // 可变
  y += 1;
  println!("x = {x}, y = {y}");
}
```

```rust [声明常量]
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

```rust [变量遮蔽]
fn main() {
  let x = 5;
  let x = x + 1; // x = 6，遮蔽旧值
  let x = x * 2; // x = 12

  let spaces = "   "; // &str
  let spaces = spaces.len(); // shadowing 可改变类型 → usize
  println!("spaces = {spaces}");
}
```

```rust [mut 不可变类型]
fn main() {
  let mut spaces = "   ";
  // spaces = spaces.len(); // ❌ 编译错误：mut 不能改变类型
  println!("{spaces}");
}
```
:::

::: tip 选择建议
变量需要多次修改值时用 `mut`；需要"转换"变量（包括改类型）或构造中间值时用 shadowing。
:::

## 二、数据类型

### 1. 标量类型

Rust 是静态类型语言——每个变量的类型在编译时就确定了。这不是为难你，而是在帮你：编译器能提前发现类型不匹配的错误，而非等到运行时才崩溃。

初学者只需关注 6 个高频类型：整数（默认 `i32`）、浮点（默认 `f64`）、布尔、字符、字符串（`String` / `&str`），其余遇到了再查表。**注意 Rust 不做隐式数值转换**——`i32` 不能直接赋值给 `i64`，必须显式 `as` 转换。

| 类型分类 | 常见类型 | 说明 |
| --- | --- | --- |
| 整数 | i8..i128、u8..u128、isize、usize | 有符号/无符号整数 |
| 浮点 | f32、f64 | 默认使用 f64 |
| 布尔 | bool | 取值为 true 或 false |
| 字符 | char | 单个 Unicode 标量值，占 4 字节 |
| 字符串 | String、&str | String 可变且拥有所有权，&str 是字符串切片 |

Rust 支持显式标注类型，也支持通过上下文自动推导。初学时建议关键变量显式标注，方便阅读和排错。

`String` 和 `&str` 的区别是初学者最容易困惑的点：`String` 是堆上的可变字符串，可以增删改内容；`&str` 是字符串切片——不拥有数据，只是指向已有字符串的"视图"。初学时写死字符串用 `&str`（`let s = "hello"`），需要修改拼接用 `String`（`String::from("hello")`）。

::: code-group
```rust [显式类型]
fn main() {
  let n: i32 = 42;
  let pi: f64 = 3.14;
  let ok: bool = true;
  let c: char = 'R';
  let s1: &str = "hello";
  let s2: String = String::from("rust");
  println!("{n} {pi} {ok} {c} {s1} {s2}");
}
```

```rust [类型推导]
fn main() {
  let n = 42; // 推导为 i32
  let pi = 3.14; // 推导为 f64
  let ok = true;
  let c = 'R';
  let s1 = "hello"; // &str
  let s2 = String::from("rust"); // String
  println!("{n} {pi} {ok} {c} {s1} {s2}");
}
```

```rust [类型转换]
fn main() {
  let a: i32 = 10;
  let b: u64 = a as u64; // as 显式转换

  let s: &str = "123";
  let n: i32 = s.parse().expect("parse i32 failed"); // 字符串转数值
  println!("{b} {n}");
}
```
:::

### 2. 复合类型

复合类型用于把多个值组织在一起：元组适合存放少量、类型可不同的数据；数组适合"同类型、固定长度"的数据；**切片（slice）** 是对连续内存的引用视图，不拥有数据所有权，`&str` 和 `&[T]` 是最常用的两种切片。

::: code-group
```rust [元组]
fn main() {
  let user = ("zeming", 18, true);
  println!("name = {}, age = {}, active = {}", user.0, user.1, user.2);

  let point = (3, 5);
  let (x, y) = point; // 解构
  println!("x = {x}, y = {y}");
}
```

```rust [数组]
fn main() {
  let nums = [10, 20, 30, 40];
  let first = nums[0];
  println!("first = {first}");

  let flags = [false; 5]; // [false, false, false, false, false]
  println!("{:?}", flags);
}
```

```rust{4-5,9,13,16} [切片]
fn main() {
  // 字符串切片
  let s = String::from("hello world");
  let hello = &s[0..5]; // "hello"
  let world = &s[6..11]; // "world"

  // 数组切片
  let arr = [1, 2, 3, 4, 5];
  let slice = &arr[1..4]; // [2, 3, 4]，类型 &[i32]
  println!("{:?}", slice);

  // 切片作函数参数，同时接受数组和 Vec
  println!("sum = {}", sum_slice(&arr[0..3]));
}

fn sum_slice(data: &[i32]) -> i32 {
  data.iter().sum()
}
```
:::

::: tip 使用建议
少量不同类型组合用元组；同类型定长集合用数组；长度需动态变化用 `Vec<T>`。

**切片作为函数参数**比写死 `&Vec<T>` 或 `&[T; N]` 更灵活，可同时接收数组和 Vec 的引用。
:::


## 三、函数与返回值

参数与返回值类型需要显式标注。Rust 强调**表达式风格**：函数体最后一行无分号即为返回值，加了分号就变成语句返回 `()`（单元类型）。多返回值用元组打包。

::: code-group
```rust [基础函数与多返回值]
fn add(a: i32, b: i32) -> i32 { a + b } // 无分号 = 返回值

fn divide(a: i32, b: i32) -> (i32, i32) {
  (a / b, a % b) // 元组返回商和余数
}

fn main() {
  println!("{}", add(1, 2));
  let (q, r) = divide(10, 3);
  println!("商 = {q}, 余数 = {r}");
}
```

```rust [表达式 vs 语句]
fn main() {
  let y = {
    let x = 3;
    x + 1 // 无分号 → 表达式返回值 4
  };
  println!("y = {y}");

  let n = 5;
  let label = if n > 0 { "正数" } else { "非正数" }; // if 也是表达式
  println!("{label}");
}
```
:::

::: warning 注意
函数声明时必须写 `->` 返回值类型（除非返回 `()`）。忘记写返回类型却用 `return` 返回值——编译器会报类型不匹配。
:::

## 四、流程控制

### 1. 分支控制

`if` / `match` 本身是表达式可以直接返回值。`if` 适合条件较少的场景，`match` 适合多模式分支。`if let` 是 match 单模式匹配的语法糖，只关心一种分支时更简洁。

::: code-group
```rust [if 返回值]
fn main() {
  let is_vip = true;
  let discount = if is_vip { 20 } else { 5 };
  println!("discount = {discount}");

  let score = 88;
  let level = if score >= 90 { "A" } else if score >= 60 { "B" } else { "C" };
  println!("level = {level}");
}
```

```rust [match 分支]
fn main() {
  let code = 2;
  let msg = match code {
    1 => "created",
    2 => "success",
    3 => "accepted",
    _ => "unknown",
  };
  println!("{msg}");
}
```

```rust [if let 简洁匹配]
fn main() {
  let value = Some(3);
  // match 写法（冗余）
  match value {
    Some(v) => println!("match: {v}"),
    _ => (),
  }
  // if let 等价写法
  if let Some(v) = value {
    println!("if let: {v}");
  }
}
```
:::

### 2. 循环控制

`for` 适合遍历集合和区间；`while` 满足条件就继续；`loop` 适合手动控制退出并可返回值；`while let` 适合循环匹配模式。循环内部 `continue` 跳过本次，`break` 直接结束。

::: code-group
```rust [for 循环]
fn main() {
  for i in 0..5 {
    if i == 2 { continue; } // 跳过 2
    if i == 4 { break; }    // 提前结束
    println!("{i}");
  }
}
```

```rust [while / while let]
fn main() {
  let mut n = 2;
  while n > 0 { println!("while: {n}"); n -= 1; }

  let mut stack = vec![1, 2, 3];
  while let Some(top) = stack.pop() {
    println!("pop: {top}"); // 3, 2, 1
  }
}
```

```rust [loop 循环]
fn main() {
  let mut x = 0;
  let result = loop {
    x += 1;
    if x == 3 { break x * 10; } // loop 可返回值
  };
  println!("result = {result}");
}
```
:::

::: tip 使用建议
真假判断用 `if`；多模式分支用 `match`；单模式匹配用 `if let` / `while let`；

遍历范围用 `for`；条件循环用 `while`；自定义退出且返回值用 `loop`。
:::

## 五、模块系统

`mod` 声明模块，`use` 引入路径，`pub` 控制可见性（默认私有）。Rust 的模块树不是由文件系统自动生成的——需要在 crate root 中用 `mod` 显式声明每个子模块。完整的 Package/Crate 概念、`crate::`/`super::` 路径体系、`pub(crate)`/`pub(super)` 分级可见性和实战拆分指南见 [模块系统](./modules)。

## 六、常用宏

以 `!` 结尾的调用是 ==宏==，在编译期展开生成代码。

::: code-group
```rust [格式化输出]
fn main() {
  let name = "小明";
  let score = 95;
  println!("{} 考了 {} 分", name, score); // 占位符
  println!("{name} 考了 {score} 分");    // 命名参数
  let msg = format!("[{name}] 成绩: {score}"); // 返回字符串不打印
  println!("{msg}");
}
```

```rust [vec! / dbg! / todo!]
fn main() {
  let nums = vec![1, 2, 3, 4, 5]; // 快速创建 Vec
  let result = dbg!(nums.iter().sum::<i32>()); // 打印变量+位置，适合调试
  println!("{result}");
  // let x = todo!("等产品确认后再写"); // 占位未完成代码
}
```
:::

| 宏 | 用途 | 典型场景 |
| --- | --- | --- |
| `println!` | 打印到标准输出 | 调试输出、CLI 交互 |
| `format!` | 拼接字符串 | 构造错误信息、日志 |
| `vec!` | 创建 Vec | 初始化集合 |
| `dbg!` | 打印变量 + 文件位置 | 快速调试 |
| `todo!` | 占位未完成代码 | 分步开发 |

## 小结

- **变量默认不可变**，用 `mut` 声明可变；shadowing 可重新绑定并改变类型
- **标量类型**中整数默认 `i32`、浮点默认 `f64`；**复合类型**按场景选元组/数组/切片——切片作参数比写死类型更灵活
- **函数**是表达式风格，最后一行无分号即返回值；多返回值用元组打包
- **流程控制**中 `if` / `match` 本身是表达式可赋值；`if let` / `while let` 是单模式匹配语法糖
- **模块系统**用 `mod`/`use`/`pub` 组织代码，默认私有、显式公开；完整详解见 [模块系统](./modules)
- **宏**以 `!` 结尾在编译期展开，`dbg!` 是快速调试利器

最后是三个高频符号速查：`::` 用于路径与关联项（`HashMap::new()`、`User::new()`）；`:` 用于类型标注与约束（`let x: i32`、`fn add(a: i32)`）；`.` 用于字段访问与方法调用（`s.len()`、`s.to_uppercase().replace(...)`）。

:::info 📖 相关资源
- [Rust 官方文档](https://rust-lang.org/zh-CN/) - Rust 语言中文官方网站
- [Rust 程序设计语言](https://doc.rust-lang.org/book/) - 官方入门教程（The Book）
- [模块系统](./modules) - Package/Crate、模块树、路径体系、可见性控制与实战拆分
- [所有权与生命周期](./ownership) - 所有权、引用借用、生命周期深入
- [类型系统](./types) - 结构体、枚举、泛型、Trait、错误处理
- [并发与异步](./concurrency) - 线程、Channel、Mutex、async/Tokio
- [Rust 工程实践](./engineering) - 项目结构、测试、依赖管理
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - 通过实例学 Rust
:::
