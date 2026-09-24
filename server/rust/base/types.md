# Rust 类型系统

## 概要

类型系统是 Rust 建模数据的核心工具链。

## 一、结构体 (struct)

结构体把一组相关字段打包成一个新类型。与元组不同，每个字段都有名称，因此更自文档化，也不依赖顺序。结构体值本身的内存位置取决于它被放在哪里：作为局部变量时通常在栈上，作为 Box 或 Vec 元素时可能在堆上。字段若为 `String` / `Vec`，其堆缓冲区在堆上；纯标量字段则没有额外的堆分配。

### 1. 定义与实例化

定义结构体用 `struct` 关键字。实例化时，如果字段名与变量名相同，可省略冒号，即字段初始化简写。从一个已有实例创建新实例时，可用 .. 语法复用其余字段。

::: code-group
```rust{1-5,8} [基本定义]
struct User {
  name: String,
  age: u8,
  active: bool,
}

fn main() {
  let u1 = User {
    name: String::from("Alice"),
    age: 20,
    active: true,
  };
  println!("{} {} {}", u1.name, u1.age, u1.active);
}
```

```rust{3-4} [字段初始化简写]
fn create_user(name: String, age: u8) -> User {
  User {
    name,   // 等价 name: name
    age,    // 等价 age: age
    active: true,
  }
}

fn main() {
  let u = create_user(String::from("Bob"), 25);
  println!("{}", u.name);
}
```

```rust{4} [结构体更新语法]
fn main() {
  let u1 = User { name: "Alice".into(), age: 20, active: true };
  // 复用 u1 的 age 和 active，只改 name
  let u2 = User { name: "Bob".into(), ..u1 };
  println!("{} {}", u2.name, u2.age); // Bob 20
}
```
:::

::: warning 注意
结构体更新语法 `..u1` 会移动 u1 中未被显式指定的字段。如果这些字段都实现了 Copy，它们会被复制，u1 仍可整体使用；只要其中有非 Copy 字段（如 String、Vec）被移动，u1 就会发生部分移动，不能再作为整体使用，但未被移动的字段仍可单独访问。

具体机制：实现了 `Copy` 的字段（`i32`、`bool` 等）在 `..u1` 中自动拷贝；未实现 `Copy` 的字段（`String`、`Vec` 等）会被移走，使原变量发生部分移动，不能再整体使用。
:::

### 2. 方法与关联函数 - impl

用 `impl` 块为结构体添加行为。`&self` 参数表示**实例方法**（只读借用），`&mut self` 表示**可变方法**（修改-可变借用），而 self 表示按值获取所有权的方法。第一个参数不是 `self` 的称为**关联函数**，常用于构造器 `new` — 调用时用 `::` 而非 `.`。

::: code-group
```rust{3-4,7-9} [实例方法与可变方法]
impl User {
  // &self: 读取自身
  fn is_adult(&self) -> bool {
    self.age >= 18
  }
  // &mut self: 可修改字段
  fn birthday(&mut self) {
    self.age += 1;
  }
}

fn main() {
  let mut u = User { name: "Alice".into(), age: 17, active: true };
  println!("成年? {}", u.is_adult()); // false
  u.birthday();
  println!("成年? {}", u.is_adult()); // true
}
```

```rust{3-5} [关联函数（构造器）]
impl User {
  // 无 self 参数 → 关联函数，用 :: 调用
  fn new(name: &str, age: u8) -> Self {
    Self { name: name.to_string(), age, active: true }
  }
}

fn main() {
  let u = User::new("Alice", 20);
  println!("{}", u.name);
}
```
:::

### 3. 其他结构体形式

除具名字段的结构体外，Rust 还有两种不常用的形式：

| 形式 | 语法 | 用途 |
| --- | --- | --- |
| 具名字段 | `struct User { name: String };` | 有意义的字段名，最常用 |
| 元组结构体 | `struct Color(u8, u8, u8);` | 给元组一个类型名，字段无名 |
| 单元结构体 | `struct AlwaysValid;` | 不存数据，纯标记用途（如 trait 实现） |

元组结构体适合"需要类型安全但字段命名冗余"的场景，比如 RGB 颜色不需要叫 red、green、blue，类型名 `Color` 已经说明了含义。

### 4. 常用派生宏

手工实现 `Debug`、`Clone`、`PartialEq` 非常机械，Rust 提供 `#[derive]` 让编译器自动生成这些 trait 的实现。**开发阶段通常先派生这三个 trait：**`Debug` 用于 `println!("{:?}")` 调试，`Clone` 用于显式拷贝，`PartialEq` 让 `==` 比较字段值而非地址。

```rust{1}
#[derive(Debug, Clone, PartialEq)]
struct User {
  name: String,
  age: u8,
}

fn main() {
  let u1 = User { name: "Alice".into(), age: 20 };
  let u2 = u1.clone(); // Clone 提供的方法
  println!("{:?}", u1); // Debug 提供的格式化
  println!("相等? {}", u1 == u2); // PartialEq 让 == 可用 → true
}
```

::: tip 何时不加 Copy
`String` / `Vec` 默认不支持 `Copy`（因为涉及堆内存），所以 `#[derive]` 列表中**不要随意加 Copy**——编译器只有在所有字段都是栈上类型时才允许。`Clone` 是显式的、允许堆分配的拷贝，可以放心加。
:::

## 二、枚举与模式匹配 (enums)

**枚举**用来表达**多选一**：一个枚举值只能是定义里列出的其中一个变体（variant）。

Rust 枚举最核心的特色：**每个变体可以携带不同类型的数据**。`Option<T>`、`Result<T, E>` 就是基于这个语言特性实现。搭配 `match` 模式匹配，编译器会强制要求覆盖全部变体，杜绝遗漏分支。

### 1. 枚举定义

枚举变体有三种携带数据的形式：无数据（纯标记）、携带元组、携带匿名结构体。

::: code-group
```rust [定义枚举]
enum WebEvent {
  Click,                              // 无数据：纯标记
  KeyPress(char),                     // 元组变体：携带按键字符
  Resize { width: u32, height: u32 }, // 结构体变体：携带尺寸
  Paste(String),                      // 元组变体：携带剪贴板内容
}
```

```rust{2-7} [match 模式匹配]
fn handle(event: &WebEvent) {
  match event {
    WebEvent::Click => println!("点击事件"),
    WebEvent::KeyPress(c) => println!("按键: {c}"),
    WebEvent::Resize { width, height } => {
      println!("窗口调整为 {width}x{height}");
    }
    WebEvent::Paste(text) => println!("粘贴: {text}"),
  }
}

fn main() {
  handle(&WebEvent::KeyPress('R'));
  handle(&WebEvent::Paste(String::from("hello")));
}
```
:::

### 2. 枚举上的方法 - impl

和结构体一样，用 `impl` 块为枚举定义方法：

```rust{5-13}
enum Message {
  Quit, Write(String), Move { x: i32, y: i32 },
}

impl Message {
  fn describe(&self) -> String {
    match self {
      Message::Quit => "退出".into(),
      Message::Write(s) => format!("写入: {s}"),
      Message::Move { x, y } => format!("移动到 ({x},{y})"),
    }
  }
}

fn main() {
  let m = Message::Move { x: 3, y: 5 };
  println!("{}", m.describe()); // 移动到 (3,5)
}
```

### 3. Option 枚举与空值

Rust 没有 `null`。可能“有值”或“无值”的场景用 `Option<T>` 枚举表达——它只有两个变体：`Some(T)` 和 `None`。编译器强制你处理 `None` 分支，从根源上消除空指针异常。

```rust {2-5,15-16}
// 标准库中的定义（概念示意）
enum Option<T> {
  Some(T),
  None,
}

// 示例
fn find_user(id: u32) -> Option<String> {
  if id == 0 { None } else { Some(format!("user_{id}")) }
}

fn main() {
  // match：必须处理 Some 和 None
  match find_user(42) {
    Some(name) => println!("found: {name}"),
    None => println!("not found"),
  }

  // if let：只关心 Some 分支
  if let Some(name) = find_user(42) {
    println!("found: {name}");
  }

  // 给 None 一个默认值
  let name = find_user(0).unwrap_or_else(|| "anonymous".to_string());
  println!("{name}"); // anonymous
}
```

| 方法 | 作用 | 说明 |
| --- | --- | --- |
| `unwrap()` | 取出 `Some` 中的值 | `None` 会 panic，仅用于确定不会为 None 的场景 |
| `unwrap_or(default)` | 取出值或返回默认值 | `opt.unwrap_or("默认".to_string())` |
| `unwrap_or_else(f)` |	取出值或调用闭包生成默认值 | 适合默认值构造代价高的场景 |
| `is_some()` / `is_none()` | 判断是 Some 还是 None | `if opt.is_some() { ... }` |
| `map(f)` | `Some(v)` → `Some(f(v))` | `None` 不变 |
| `as_ref()` | `&Option<T>` → `Option<&T>` | 借用内部值，避免移动所有权 |


### 4. match 控制流结构

:::code-group
```rust [match例子]
enum Coin {
  Penny,
  Nickel,
  Dime,
  Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
  match coin {
    Coin::Penny => 1,
    Coin::Nickel => 5,
    Coin::Dime => 10,
    Coin::Quarter => 25,
  }
}
```

```rust{18-21} [绑定值的模式]
// 定义枚举 Coin
enum Coin {
  Penny,
  Nickel,
  Dime,
  Quarter(UsState), // Quarter变体，携带一个UsState数据
}

// 一个枚举：美国的州，随便定义
#[derive(Debug)]
enum UsState { Alabama, Alaska }

fn value_in_cents(coin: Coin) -> u8 {
  match coin {
    Coin::Penny => 1,
    Coin::Nickel => 5,
    Coin::Dime => 10,
    Coin::Quarter(state) => {
      println!("State quarter from {state:?}!");
      25
    }
  }
}

fn main() {
  let c = Coin::Quarter(UsState::Alaska);
  println!("{}", value_in_cents(c));
}
```

```rust [匹配 Option&lt;T&gt;]
fn plus_one(x: Option<i32>) -> Option<i32> {
  match x {
    None => None,
    Some(i) => Some(i + 1),
  }
}

let five = Some(5);
let six = plus_one(five);
let none = plus_one(None);
```

```rust{3-6} [match if]
// 用 `if` 条件进一步过滤匹配分支：
fn describe(n: i32) -> &'static str {
  match n {
    n if n < 0 => "负数",
    n if n == 0 => "零",
    n if n % 2 == 0 => "正偶数",
    _ => "正奇数",
  }
}

fn main() {
  println!("{}", describe(6)); // 正偶数
}
```
:::

### 5. @ 绑定与嵌套解构

::: tip 初学建议
`@` 绑定和嵌套解构属于"锦上添花"——先掌握 `match` 和 `if let`，这两个特性在项目中自然就会用了，无需刻意练习。
:::

`@` 运算符在模式匹配时**同时绑定变量和测试模式**；嵌套解构可以深入提取字段：

::: code-group
```rust{4,5} [@ 绑定]
fn main() {
  let range = 1..=5;
  match 3 {
    n @ 1..=3 => println!("1-3 之间: {n}"),
    n @ 4..=5 => println!("4-5 之间: {n}"),
    _ => println!("超出范围"),
  }
}
```

```rust{11,14} [嵌套解构]
struct Point { x: i32, y: i32 }
enum Shape {
  Circle { center: Point, radius: u32 },
  Rect(Point, Point),
}

fn main() {
  let s = Shape::Circle { center: Point { x: 0, y: 0 }, radius: 10 };

  match &s {
    Shape::Circle { center: Point { x, y }, radius: r } => {
      println!("圆心 ({x},{y})，半径 {r}");
    }
    Shape::Rect(Point { x: x1, y: y1 }, Point { x: x2, y: y2 }) => {
      println!("矩形 ({x1},{y1}) -> ({x2},{y2})");
    }
  }
}
```
:::

### 6. matches! 宏

`matches!` 返回 bool，适合在 `if` 条件或断言中快速判断：

```rust
fn main() {
  let value = Some(42);
  if matches!(value, Some(v) if v > 40) {
    println!("大于 40");
  }

  assert!(matches!('A', 'A'..='Z'));
}
```

::: tip 结构体 vs 枚举判断
数据项之间 **"与"关系**（一个实体有多项属性）→ 用结构体；数据项之间 **"或"关系**（同一类型的不同变体）→ 用枚举。不确定时先写结构体——等发现字段需要"多选一"时再重构为枚举。
:::

## 三、泛型: 消除重复代码

==泛型== 让你编写==类型无关==的代码——声明时用占位符 `<T>`，编译器在调用处自动生成对应具体类型的版本。这个过程叫**单态化（monomorphization）**，运行时无额外开销，因为编译后和手写具体类型的代码完全等价。

### 1. 泛型函数

在函数名后加 `<T>` 声明类型参数。编译器根据调用时的实参类型自动推断 `T` 的具体类型——多数场景无需显式标注。

::: code-group
```rust{1,6-7} [单个泛型参数]
fn first<T>(list: &[T]) -> Option<&T> {
  list.first()
}

fn main() {
  let nums = vec![1, 2, 3];
  let chars = vec!['a', 'b', 'c'];
  println!("{:?}", first(&nums));  // T 推断为 i32
  println!("{:?}", first(&chars)); // T 推断为 char
}
```

```rust{1,7} [多个泛型参数]
fn pair<A, B>(a: A, b: B) -> (A, B) {
  (a, b)
}

fn main() {
  let p = pair(42, "hello");
  println!("{:?}", p); // (42, "hello")
}
```
:::

### 2. 泛型结构体与枚举

`<T>` 跟在类型名后，让字段持有任意类型的数据：

```rust{1,9}
struct Point<T> {
  x: T,
  y: T,
}

// 标准库中的 Option 和 Result 本身就是泛型枚举
// enum Option<T> { Some(T), None }
// enum Result<T, E> { Ok(T), Err(E) }

fn main() {
  let p1 = Point { x: 1, y: 2 };     // T = i32
  let p2 = Point { x: 1.5, y: 3.2 };  // T = f64
  println!("({}, {})", p1.x, p1.y);
}
```

`Point<T>` 的 `x` 和 `y` 类型必须相同。如果需要不同类型，声明两个参数：`struct Point<T, U> { x: T, y: U }`。

### 3. 为泛型类型实现方法

`impl` 后也必须加 `<T>`，告诉编译器"这个 impl 对所有 T 都有效"：

```rust{1,8-9}
impl<T> Point<T> {
  fn x(&self) -> &T {
    &self.x
  }
}

// 只对特定类型实现方法——比如只给 Point<f64> 加 distance 方法
impl Point<f64> {
  fn distance_from_origin(&self) -> f64 {
    (self.x.powi(2) + self.y.powi(2)).sqrt()
  }
}

fn main() {
  let p = Point { x: 3.0, y: 4.0 };
  println!("x = {}, distance = {}", p.x(), p.distance_from_origin());
}
```

### 4. Trait 约束

前面定义的 `first<T>` 对 T 没有任何要求——不比较、不拷贝，所以对所有类型都适用。但如果你想在函数里比较两个值的大小（`if item > max`），编译器会报错：它不知道 T 是否支持 `>`。**Trait bound 就是告诉编译器"这个 T 必须有能力做某些事"**。`<T: Trait1 + Trait2>` 称为 trait bound，多个约束时可改用 `where` 语法提升可读性：

```rust{1-4,13-15}
// trait bound：要求 T 可比较 + 可拷贝
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
  let mut max = list[0];
  for &item in list {
    if item > max { max = item; }
  }
  max
}

fn main() {
  assert_eq!(largest(&[3, 7, 2, 9, 1]), 9);
  assert_eq!(largest(&['a', 'z', 'm', 'b']), 'z');
}

// where 语法：复杂约束时更清晰
fn complex<T, U>(t: &T, u: &U) -> String
where
  T: Clone + std::fmt::Display,
  U: PartialEq,
{
  format!("{t}")
}
```

| 常用约束 | 含义 | 场景 |
| --- | --- | --- |
| `PartialOrd` | 可比较大小（`>` / `<`） | 排序、找最值 |
| `Copy` | 按位拷贝，赋值后原变量仍可用 | 简单数值类型 |
| `Clone` | 显式深拷贝 | 含堆数据的类型 |
| `Display` | 用户友好格式化 `{}` | 打印输出 |
| `Debug` | 调试格式化 `{:?}` | 调试打印 |

## 四、Trait 进阶

==Trait== 定义共享行为，类似其他语言中的接口。上一节的 trait bound 是"使用" trait，本节介绍"定义" trait、默认实现和动态分发。

### 1. 自定义 Trait 与默认实现

::: code-group
```rust{1-5,9-13} [定义与实现 Trait]
trait Summary {
  fn summary(&self) -> String;
  fn default_detail(&self) -> String { // 默认实现
    format!("(详情...)")
  }
}

struct Post { title: String, author: String }

impl Summary for Post {
  fn summary(&self) -> String {
    format!("《{}》- {}", self.title, self.author)
  }
}

fn main() {
  let p = Post { title: "Rust 入门".to_string(), author: "小明".to_string() };
  println!("{}", p.summary());
  println!("{}", p.default_detail());
}
```

```rust{2-5} [where 语法]
// 复杂 trait 约束用 where 提升可读性
fn complex_fn<T, U>(t: &T, u: &U) -> String
where
  T: Summary + Clone,
  U: std::fmt::Display,
{
  format!("{}: {}", t.summary(), u)
}
```
:::

### 2. Trait Object：动态分发

当需要在运行时处理实现同一 trait 的不同类型时，使用 `dyn Trait` + `Box` 实现动态分发：

```rust{1,10-13}
trait Draw { fn draw(&self); }

struct Button { label: String }
struct TextBox { text: String }

impl Draw for Button {
  fn draw(&self) { println!("[Button] {}", self.label); }
}
impl Draw for TextBox {
  fn draw(&self) { println!("[TextBox] {}", self.text); }
}

fn main() {
  // 不同类型放进同一个 Vec
  let components: Vec<Box<dyn Draw>> = vec![
    Box::new(Button { label: "OK".to_string() }),
    Box::new(TextBox { text: "请输入".to_string() }),
  ];
  for c in &components { c.draw(); }
}
```

::: tip 静态分发 vs 动态分发
泛型（`<T: Trait>`）是**静态分发**——编译期为每个具体类型生成一份代码，零运行时开销，但会增加编译时间和二进制体积。Trait object（`dyn Trait`）是**动态分发**——运行时通过虚表查找方法，有微小开销，但可以混合不同类型。
:::

### 3. 常用标准库 Trait

| Trait | 用途 | 典型操作 |
| --- | --- | --- |
| `Display` | 用户友好的格式化 | `println!("{}", x)` |
| `Debug` | 调试输出 | `println!("{:?}", x)`，可用 `#[derive(Debug)]` |
| `Clone` | 显式深拷贝 | `x.clone()` |
| `Copy` | 隐式按位拷贝 | 简单类型自动标记，含堆数据的类型不实现 |
| `Drop` | 离开作用域时的清理逻辑 | 自定义析构行为 |
| `From` / `Into` | 类型转换 | `String::from("hello")`、`let n: i32 = 5u8.into()` |
| `PartialEq` / `Eq` | 相等比较 | `x == y`，可用 `#[derive(PartialEq, Eq)]` |

## 五、集合与迭代器

### 1. Vec 与 HashMap

**Vec** 是长度可变的同类型集合，**HashMap** 是键值映射。它们都存放在堆上，配合 `mut` 增删改。

::: code-group
```rust{5,6,9,10,13} [Vec 常用操作]
fn main() {
  let mut v = vec![1, 2, 3];
  v.push(4);

  let mut v = Vec::new();
  v.push(10);
  v.push(20);

  let first = v[0]; // 索引访问（越界会 panic）
  let maybe_second = v.get(1); // 安全访问，返回 Option<&T>
  println!("first = {first}, second = {:?}", maybe_second);

  for x in &v { println!("iter: {x}"); }
}
```

```rust{4,5,10,11,13} [HashMap 常用操作]
use std::collections::HashMap;

fn main() {
  let mut map: HashMap<String, i32> = HashMap::new();
  map.insert("a".to_string(), 1);
  map.insert("b".to_string(), 2);
  println!("a = {:?}", map.get("a")); // Option<&i32>

  // entry：不存在则插入默认值
  let count = map.entry("a".to_string()).or_insert(0);
  *count += 1;

  for (k, v) in &map { println!("{k} => {v}"); }
}
```
:::

### 2. 迭代器

==迭代器== 是处理集合数据的核心抽象。通过链式调用 `map`、`filter`、`collect` 等方法完成数据转换，**零成本抽象**——编译后展开为等价循环，无额外性能开销。

```rust
fn main() {
  let nums = vec![1, 2, 3, 4, 5, 6];

  // 过滤偶数 → 翻倍 → 收集
  let doubled: Vec<i32> = nums
    .iter()
    .filter(|&x| x % 2 == 0)
    .map(|&x| x * 2)
    .collect();
  println!("{:?}", doubled); // [4, 8, 12]

  // 常用速查
  let sum: i32 = nums.iter().sum();
  let count = nums.iter().filter(|&x| x > 3).count();
  println!("sum = {sum}, >3 count = {count}");
}
```

## 六、错误处理

Rust 的错误处理哲学与其他语言有本质不同：**没有 try-catch，错误是返回值的一部分**。`Option<T>` 和 `Result<T, E>` 的基本模式匹配在 [二.2 Option](#_2-option-t-安全的-空值) 已介绍过，本段聚焦 `?` 运算符——它是日常开发中最常用的错误传播方式。

::: code-group
```rust{3,7,8} [Result + ? 运算符]
use std::num::ParseIntError;

fn divide(a: i32, b: i32) -> Result<i32, String> {
  if b == 0 { return Err("b cannot be 0".to_string()); }
  Ok(a / b)
}

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
  let n: i32 = s.parse()?; // ? 在出错时自动 return Err
  Ok(n * 2)
}

fn main() {
  match divide(10, 2) {
    Ok(v) => println!("ok: {v}"),
    Err(e) => println!("err: {e}"),
  }
  println!("{}", parse_and_double("21").unwrap());
}
```

```rust{1,8,11,12} [Option 处理可空值]
fn get_user_name(id: u32) -> Option<String> {
  if id == 0 { None } else { Some(format!("user_{id}")) }
}

fn main() {
  let name = get_user_name(42);
  match &name {
    Some(n) => println!("found: {n}"),
    None => println!("not found"),
  }
  println!("{}", name.unwrap_or("anonymous".to_string())); // user_42
  println!("{}", get_user_name(0).unwrap_or("anonymous".to_string())); // anonymous
}
```
:::

| 场景 | 推荐方式 | 示例 |
| --- | --- | --- |
| 用户输入错误、网络超时、文件未找到 | `Result` | `File::open` |
| 逻辑不变量被破坏、不可能发生的情况 | `panic!` | 数组越界 |
| 原型开发、示例代码 | `unwrap()` / `expect()` | 快速测试 |
| 值可能为空 | `Option` + `match` / `unwrap_or` | 查询结果 |

::: tip 工程化错误处理
应用边界层使用 `anyhow::Result` 聚合上下文，库或领域层使用 `thiserror` 定义明确、可匹配的错误类型。详见 [工程实践](./engineering)。
:::

## 小结

- **结构体**把相关字段打包为自定义类型，`impl` 块添加方法，`#[derive]` 自动生成 Debug/Clone/PartialEq
- **枚举**每个变体可携带不同类型数据，配合 `match` 穷举所有分支——`Option<T>` 替代 null，`Result<T, E>` 承载错误
- **模式匹配**进阶技巧：守卫 `if` 过滤分支、`@` 绑定兼取值、嵌套解构深入提取、`matches!` 简洁断言
- **泛型**用 `<T>` 占位消除重复代码，编译期单态化无运行时开销；trait bound + `where` 语法限定类型能力
- **Trait** 定义共享行为：自定义 trait + 默认实现；`Box<dyn Trait>` 实现运行时多态（动态分发）
- **迭代器**链式调用是处理集合的推荐方式，零成本抽象，比手写索引循环更安全
- **`?` 运算符**大幅简化错误传播；`Result` 处理可恢复错误，`panic!` 处理不可恢复错误

:::info 📖 相关资源
- [Rust 程序设计语言 - 结构体](https://doc.rust-lang.org/book/ch05-00-structs.html) - 第 5 章
- [Rust 程序设计语言 - 枚举](https://doc.rust-lang.org/book/ch06-00-enums.html) - 第 6 章
- [Rust 程序设计语言 - 泛型与 Trait](https://doc.rust-lang.org/book/ch10-00-generics.html) - 第 10 章
- [Rust 程序设计语言 - 错误处理](https://doc.rust-lang.org/book/ch09-00-error-handling.html) - 第 9 章
- [模块系统](./modules) - Package/Crate、模块树、路径体系与可见性控制
- [所有权与生命周期](./ownership) - 所有权、引用借用、生命周期深入
- [并发与异步](./concurrency) - 线程、Channel、Mutex、async/Tokio
- [Rust 工程实践](./engineering) - 项目结构、测试、anyhow/thiserror
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - 通过实例学 Rust
:::
