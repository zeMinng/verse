# 所有权与生命周期

## 概要

==所有权== 是 Rust 最独特的特性——没有垃圾回收器却能保证内存安全，靠的是编译器在编译期追踪每块内存的归属。如果你刚刚读完 [语法基础](./)，这里将继续深入：从基本的所有权规则出发，到 `Rc`/`Arc` 共享所有权、`RefCell` 内部可变性，最终理解生命周期标注。

## 一、所有权基础

Rust 中每个值有且仅有一个**所有者**，所有者离开作用域时值被自动释放。可以把所有权想象成**图书馆借书**：每本书一次只能一个人借走（唯一所有者），还书后自动归架（Drop 释放），其他人可以借阅但不能写字（不可变借用 `&T`），一次只有一个人借走并批注（可变借用 `&mut T`）。这三条规则构成了 Rust 内存安全的基石。

::: code-group
```rust{2} [所有权移动（move）]
fn main() {
  let s1 = String::from("hello");
  let s2 = s1; // s1 的所有权移动到 s2
  // println!("{s1}"); // ❌ s1 已失效
  println!("{s2}");
}
```

```rust{2} [克隆（clone）]
fn main() {
  let s1 = String::from("hello");
  let s2 = s1.clone(); // 深拷贝，s1 仍可用
  println!("s1 = {s1}, s2 = {s2}");
}
```

```rust{2,7} [引用与借用]
fn main() {
  let s = String::from("rust");
  let len = calc_len(&s); // &s 创建引用，不转移所有权
  println!("{s} 的长度是 {len}"); // s 仍可用
}

fn calc_len(s: &String) -> usize { s.len() }
```
:::

引用分两种：`&T`（不可变借用，可同时存在多个）和 `&mut T`（可变借用，同一时刻只能存在一个）。**可变借用与不可变借用不能在同一作用域内重叠**。

| 借用类型 | 同时存在数量 | 允许修改 | 允许读取 |
| --- | --- | --- | --- |
| `&T` | 多个 | ❌ | ✅ |
| `&mut T` | 仅 1 个 | ✅ | ✅ |
| `&T` + `&mut T` | 不能共存 | — | — |

单一所有者 + 借用能满足大多数场景：父级拥有数据，子级借用访问。但有时一个值需要被**多处同时持有**——比如多个模块共享同一份配置、多个 UI 组件引用同一个数据源。Rust 提供了引用计数类型解决这类需求。

## 二、共享所有权: Rc 与 Arc

当单一所有权不够用时——比如多个结构体需要共享同一个配置对象——Rust 提供了引用计数类型。

`Rc<T>`（Reference Counted）允许多个变量**共享**同一个值的所有权，通过引用计数在最后一个持有者释放时自动清理。`Arc<T>` 是 `Rc<T>` 的线程安全版本，适用于多线程场景。

::: code-group
```rust{1,5-7} [Rc 共享所有权]
use std::rc::Rc;

fn main() {
  let a = Rc::new(String::from("hello"));
  let b = Rc::clone(&a); // 引用计数 +1，不拷贝数据
  let c = Rc::clone(&a);
  println!("count = {}", Rc::strong_count(&a)); // 3
  println!("{a} {b} {c}");
}
```

```rust{1-2,8-12} [Arc 多线程共享]
use std::sync::Arc;
use std::thread;

fn main() {
  let data = Arc::new(vec![1, 2, 3]);
  let mut handles = vec![];

  for _ in 0..3 {
    let data = Arc::clone(&data);
    handles.push(thread::spawn(move || {
      println!("{:?}", data);
    }));
  }
  for h in handles { h.join().unwrap(); }
}
```
:::

::: warning 注意
`Rc::clone` 只增加引用计数，不深拷贝数据——开销极小。`Rc<T>` 不可跨线程：如果需要在多线程中共享，用 `Arc<T>`。
:::

## 三、内部可变性: RefCell

`RefCell<T>` 将借用检查从**编译期推迟到运行时**，允许在拥有不可变引用时修改内部数据。通常与 `Rc<T>` 配合使用（`Rc<RefCell<T>>`），实现多个持有者都能修改同一数据。

```rust{1-2,5,10-11}
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
  let data = Rc::new(RefCell::new(0));

  let a = Rc::clone(&data);
  let b = Rc::clone(&data);

  *a.borrow_mut() += 1;
  *b.borrow_mut() += 2;

  println!("data = {}", data.borrow()); // 3
}
```

::: warning 注意
`RefCell` 的借用规则在运行时检查——同时存在两个 `borrow_mut()` 会触发 **panic**，不会像编译期借用那样提前发现。仅在编译器无法验证借用、但逻辑上确实安全的场景使用。
:::

## 四、生命周期

==生命周期（lifetime）== 是 Rust 编译器验证引用有效期的机制。多数场景编译器可以自动推导，但当函数涉及多个引用、或结构体包含引用时，需要显式标注。

### 1. 生命周期标注语法

`'a` 标注表示 x、y 和返回值共享同一个生命周期——编译器据此确保返回值不会比被引用的数据活得更久：

```rust{1}
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
  if x.len() > y.len() { x } else { y }
}

fn main() {
  let a = String::from("abcd");
  let b = "xyz";
  println!("{}", longest(&a, b));
}
```

简单来说：**生命周期标注就是告诉编译器"返回值活多久取决于输入参数活多久"**。`longest` 的返回值使用较短的那个生命周期，确保不会返回悬垂引用。

### 2. 生命周期省略规则（Elision Rules）

编译器在以下三种情况可自动推导生命周期，90% 的场景无需手写：

1. 每个引用参数都有独立的生命周期
2. 如果只有一个输入引用参数，它的生命周期赋给所有输出引用
3. 如果有多个输入引用参数，但其中一个是 `&self` / `&mut self`，`self` 的生命周期赋给所有输出引用

```rust
// 符合规则 2：编译器自动补充，无需标注
fn first_word(s: &str) -> &str {
  &s[..s.find(' ').unwrap_or(s.len())]
}

struct User { name: String }

impl User {
  // 符合规则 3：&self 的生命周期赋给返回值
  fn name(&self) -> &str {
    &self.name
  }
}
```

初学时你几乎不需要手写生命周期——**先记住两个触发条件**：函数有多个引用参数且返回值是引用、结构体包含引用字段。其余场景编译器自动搞定。

### 3. 结构体中的生命周期

当结构体持有引用时，必须标注生命周期，确保结构体实例的生命周期不超过被引用数据：

```rust{1-3}
struct Excerpt<'a> {
  text: &'a str, // 结构体的生命周期不能超过引用的文本
}

fn main() {
  let novel = String::from("从前有座山...");
  let first = &novel[..9];
  let excerpt = Excerpt { text: first };
  println!("{}", excerpt.text);
}
```

结构体持有引用的场景在实际项目中很常见——解析器、迭代器、配置包装器都会用到。关键原则：**结构体实例不能比它引用的数据活得更久**。

### 4. `'static` 生命周期

`'static` 表示引用在**整个程序运行期间**有效。字符串字面量自动为 `'static`。**不要为了消除编译错误而滥用 `'static`**——多数场景是因为数据组织方式需要调整，而非真的需要静态生命周期。

```rust
fn main() {
  // 字符串字面量天然是 'static——编译时写入程序二进制
  let s: &'static str = "永久有效的字符串";
  println!("{s}");

  // 'static 引用可以传入任何普通函数
  print_msg("hello from static");
}

fn print_msg(msg: &'static str) {
  println!("{msg}");
}
```

::: warning 不要滥用 `'static`
为了消除编译错误而给所有引用加 `'static` 是常见新手陷阱。大多数情况下，编译器报生命周期错误说明你的**数据组织方式有问题**——比如应该让函数借用数据而非要求数据永久存活。只有在真的需要全局常量或静态配置时才用 `'static`。
:::

## 五、所有权类型速查

| 类型 | 检查时机 | 跨线程 | 用途 |
| --- | --- | --- | --- |
| `&T` | 编译期 | ✅（满足 Send） | 只读借用，首选 |
| `&mut T` | 编译期 | ✅（满足 Send） | 独占可变借用 |
| `Rc<T>` | 编译期 | ❌ | 单线程共享所有权 |
| `Arc<T>` | 编译期 | ✅ | 多线程共享所有权 |
| `RefCell<T>` | ==运行时== | ❌ | 内部可变性，绕过编译期检查 |
| `Rc<RefCell<T>>` | ==运行时== | ❌ | 多个持有者修改同一数据 |

::: tip 选择指南
编译期能验证的用 `&T` / `&mut T`，不够用时按需升级：多持有者 → `Rc`，需修改内部 → `RefCell`，跨线程 → `Arc`，多线程共享可变 → `Arc<Mutex<T>>`（见 [并发与异步](./concurrency)）。
:::

## 小结

- **所有权三条规则**在编译期保证内存安全：每个值有唯一所有者，离开作用域自动释放
- **`&T` 和 `&mut T`** 是首选借用方式，通过编译期检查杜绝悬垂指针和数据竞争
- **`Rc<T>` / `Arc<T>`** 提供共享所有权——`Rc::clone` 只增加引用计数不深拷贝；`Arc` 可安全跨线程
- **`RefCell<T>`** 将借用检查推迟到运行时，配合 `Rc` 实现多持有者可变数据模式
- **生命周期标注**连接引用之间的有效期关系——掌握省略规则后，90% 的场景无需手写；`'static` 慎用

:::info 📖 相关资源
- [Rust 程序设计语言 - 所有权](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html) - 官方入门（第 4 章）
- [Rust 程序设计语言 - 智能指针](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) - Rc/RefCell 深入（第 15 章）
- [Rust 程序设计语言 - 生命周期](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) - 生命周期标注（第 10.3 节）
- [模块系统](./modules) - Package/Crate、模块树、路径体系与可见性控制
- [类型系统](./types) - 结构体、枚举、泛型、Trait、错误处理
- [并发与异步](./concurrency) - 线程、Channel、Mutex、async/Tokio
:::
