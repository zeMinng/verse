# 语法基础

## 概要

[Java](https://docs.oracle.com/en/java/) 是跨平台、面向对象的编程语言，依靠 JVM 实现跨平台运行。这里梳理 Java 语法底层规则、边界行为与隐性陷阱。

## 一、数据类型

Java 中的数据类型可分为 2 种： 基本数据类型、引用数据类型。

### 1. 基本数据类型

基本数据类型包括 **boolean、char、byte、short、int、long、float 和 double 共 8 种**。不同的数据类型有着不同的取值范围和内存占用大小。这些[类型](https://javabetter.cn/basic-grammar/basic-data-type.html)由 JVM 直接管理，存储在栈（Stack）内存中，效率极高。

整数和小数取值范围大小关系：`double > float > long > int > short > byte`

| 分类 | 关键字     | 位数 (bit) | 字节 (Byte) | 取值范围                  | 默认值   | 快速记忆        |
| ---- | ---------- | ---------- | ----------- | ------------------------- | -------- | --------------- |
| 整数 | byte       | 8          | 1           | -128 ~ 127                | 0        | 极小整数        |
|      | short      | 16         | 2           | -32,768 ~ 32,767          | 0        | 短整数          |
|      | **int**    | 32         | 4           | 约 ±21亿 (2³¹−1)          | 0        | 默认整数类型    |
|      | long       | 64         | 8           | 约 ±9×10¹⁸ (2⁶³−1)        | 0L       | 大数据 / 时间戳 |
| 浮点 | float      | 32         | 4           | ±3.4E38 (有效位数 6~7 位) | 0.0f     | 单精度          |
|      | **double** | 64         | 8           | ±1.7E308 (有效位数 15 位) | 0.0d     | 默认浮点类型    |
| 字符 | char       | 16         | 2           | 0 ~ 65,535 (Unicode)      | '\u0000' | 单个文字 / 符号 |
| 布尔 | boolean    | JVM 依赖   | JVM 依赖    | true / false              | false    | 逻辑判断        |

::: tip 💡 核心要点补充
**后缀要求：**

- long：赋值时必须加 L（如 `long num = 100L;`）。
- float：赋值时必须加 F（如 `float f = 3.14F;`），否则会被当作 double 处理导致编译报错。

**Boolean 占用空间：**在 JVM 规范中，单个 boolean 变量在编译后使用 int 代替（4字节），而 boolean 数组则会被编译成 byte 数组（1字节）。
:::

::: warning 精度损耗
float 和 double 采用的是 IEEE 754 标准，不能用于精确的货币计算（会出现 `0.1 + 0.2 != 0.3` 的情况）。精确计算请使用 `java.math.BigDecimal`。
:::

### 2. 引用数据类型

引用类型存储的是对象的地址（指向堆内存），而非值本身。常见的有 String、数组、类和接口。所有引用类型的默认值都是 `null`。

**判等方式：** `==` 比较内存地址，`equals()` 比较字符串内容。

::: code-group
```java{2,4,10} [String 创建与判等]
// 字面量：检查串池，存在则复用
String name = "java";
// new：在堆中创建新对象
String a = new String("java");
char[] chs = {'j', 'a', 'v', 'a'};
String b = new String(chs);

// 内容比较用 equals()，== 比较的是地址
String s1 = "abc", s2 = "Abc";
System.out.println(s1.equals(s2));             // false
System.out.println(s1.equalsIgnoreCase(s2));   // true
```

```java{2-4} [StringBuilder]
StringBuilder sb = new StringBuilder("Zm");
sb.append("zzzzz");          // 拼接
sb.reverse();                // 反转
String str = sb.toString();  // 转回 String
```

```java{3-5,7-9} [StringJoiner]
import java.util.StringJoiner;

StringJoiner sj = new StringJoiner("---");
sj.add("aa").add("bb").add("cc");
System.out.println(sj);  // aa---bb---cc

StringJoiner sj2 = new StringJoiner(", ", "[", "]");
sj2.add("x").add("y");
System.out.println(sj2); // [x, y]
```
:::

| 场景                              | 推荐工具      |
| --------------------------------- | ------------- |
| 固定字符串                        | String        |
| 循环中大量拼接或反转              | StringBuilder |
| 拼接列表并加前后缀（如 `[x, y]`） | StringJoiner  |

## 二、运算符与转换

在 Java 中，运算不仅仅是算结果，还涉及类型转换。

- **隐式转换**：取值范围小的和大的运算，**小会自动提升为大**的再计算。
- **特殊规则**：byte、short、char 运算时，**一律先提升为 int**。
- **强制转换**：大容量转小容量必须手动强转：`(目标类型) 值`。

::: code-group
```java{3,6-7,10} [类型转换]
byte a = 10;
int b = 20;
int c = a + b;      // byte 自动提升为 int

byte x = 5, y = 10;
int z = x + y;       // byte/short/char 运算 → int
byte sum = (byte)(x + y);  // 强制转换

// int + double → 自动提升为 double
double d = 10 + 3.14;
```
:::

## 三、判断和循环

条件判断和循环是程序的基本控制结构。

| 循环类型   | 最佳使用场景  | 核心特点                                       |
| ---------- | ------------- | ---------------------------------------------- |
| for        | 已知循环次数  | 初始化、条件、迭代集中在一起，结构紧凑         |
| while      | 未知循环次数  | 先判断后执行，可能一次都不执行                 |
| do...while | 至少执行一次  | 先执行一次循环体，再判断条件                   |
| 增强 for   | 遍历集合/数组 | 无需索引，语法最简洁；不能获取下标、不适合增删 |

::: code-group
```java{2,5-9,12-14} [if与switch]
/** if语句 */
if (flag) {}

/** switch语句 */
switch (flag) {
  case 'xx':
    break;
  default:
    break;
}
// JDK 14+ 箭头语法
switch (flag) {
  case 1 -> {}
  default -> {}
}
```

```java{2,4,10-14,19} [for循环]
/** 标准 for */
for (int i = 0; i < 5; i++) {
  if (i == 3) {
    continue; // 跳过本次循环
  }
  System.out.println(i);
}

/** 循环标号——跳出外层循环 */
outer:
for (int i = 0; i < 5; i++) {
  for (int j = 0; j < 5; j++) {
    if (j == 2) break outer;
  }
}

/** foreach（增强for）遍历数组 */
int[] arr = {10,20,30};
for (int num : arr) {
  System.out.println(num);
}

/** foreach 遍历List集合 */
List<String> list = List.of("A", "B", "C");
for (String s : list) {
  System.out.println(s);
}
```

```java{3-5,10-12} [while与do...while]
/** while——先判断后执行 */
int i = 0;
while (i < 3) {
  System.out.println(i);
  i++;
}

/** do...while——先执行一次再判断 */
int j = 0;
do {
  System.out.println(j);
  j++;
} while (j < 3);
```
:::

## 四、数组

数组是存储同种数据类型、固定长度的连续空间。存储时需考虑隐式转换：小类型可存入大类型数组，反之不行（如 int 数组可存 byte/short/int，不能存 double/boolean）。

| 方式       | 语法示例                  | 适用场景                   |
| ---------- | ------------------------- | -------------------------- |
| 静态初始化 | `int[] arr = {1, 2, 3};`  | 已知具体数据内容           |
| 动态初始化 | `int[] arr = new int[5];` | 只知长度，数据后续动态存入 |

::: code-group
```java{3-5,11-12,15-16} [静态初始化]
import java.util.Arrays;

int[] arr1 = {11, 12, 13};
String[] arr2 = {"张三", "李斯"};
double[] arr3 = {1.93, 1.78};

System.out.println(arr1[2]);
System.out.println(Arrays.toString(arr1));

// 标准 for：需要索引时使用
for (int i = 0; i < arr1.length; i++) {
  System.out.println("索引 " + i + ": " + arr1[i]);
}
// 增强 for：仅需取值时更简洁
for (int val : arr1) {
  System.out.println(val);
}
```

```java{1,3} [动态初始化]
String[] arr = new String[10];

arr[0] = "张三";

// 数组默认初始化值规律
// 整数类型：默认初始化值 0
// 小数类型：默认初始化值 0.0
// 字符类型：默认初始化值 '\u0000' 空格
// 布尔类型：默认初始化值 false
// 引用数据类型：默认初始化值 null
```
:::

## 五、集合

`ArrayList` 是 Java 最常用的动态集合，长度可变。集合只能存储引用类型——基本类型需用包装类（`int` → `Integer`，`char` → `Character`）。

```java{5,9,11,13,15-16}
import java.util.ArrayList;

public class Main {
  public static void main(String[] args) {
    ArrayList<String> list = new ArrayList<>();

    // 增
    list.add("zeming");
    list.add("bbb");
    // 删
    list.remove(1);
    // 改
    list.set(0, "哥哥");
    // 查
    String item = list.get(0);
    int size = list.size();

    System.out.println(list);
  }
}
```

| 操作 | 方法                                 | 说明                    |
| ---- | ------------------------------------ | ----------------------- |
| 增   | `add(E e)` / `add(int i, E e)`       | 末尾追加 / 指定位置插入 |
| 删   | `remove(int i)` / `remove(Object o)` | 按索引删除 / 按元素删除 |
| 改   | `set(int i, E e)`                    | 替换指定位置元素        |
| 查   | `get(int i)`                         | 按索引获取              |
| 长度 | `size()`                             | 返回元素个数            |

## 六、方法

方法（Method）是组织可复用代码的基本单元，定义一次，多处调用。

基本类型传值、引用类型传地址，在方法内修改引用类型(如数组)会影响原对象。

::: code-group
```java{2,8,14} [有无参方法]
/** 无参方法 */
public static void playGame() {
  System.out.println("开始游戏");
}
playGame();

/** 带参方法 */
public static void playGame(String name, int age) {
  System.out.println(name + "，年龄：" + age);
}
playGame("张三", 25);

/** 可变长参数 */
public static void m(int... arr) {
  System.out.println(arr.length); // 可变长参数可以当做数组来处理
}
```

```java{2,5,9-10} [返回值方法]
public static int getSum(int a, int b, int c) {
  return a + b + c;
}
// 调用
int sum = getSum(1, 2, 3);

// 返回数组
public static int[] copy(int[] arr, int from, int to) {
  int[] temp = new int[to - from];
  return temp;
}
```

```java{3,7,11} [方法重载]
public class OverloadDemo {
  // 1. 无参
  public void sayHello() {
    System.out.println("你好！");
  }
  // 2. 一个String参数
  public void sayHello(String name) {
    System.out.println("你好，" + name);
  }
  // 3. 两个参数
  public void sayHello(String name, int age) {
    System.out.println("你好，" + name + "，今年" + age + "岁");
  }

  public static void main(String[] args) {
    OverloadDemo demo = new OverloadDemo();
    demo.sayHello();
    demo.sayHello("小明");
    demo.sayHello("小红", 18);
  }
}
```
:::

## 七、package与import

### 1. package

`package` 就是**文件夹**，用来管理类，防止类名重名冲突，写在 java 文件**第一行**。

:::code-group
```java [定义]
// src
// └── com
//     └── study
//         ├── Animal.java
//         └── Test.java

/**
 * 意思：这个 `Animal` 类，归属包 `com.study`。
 * 重点：如果写了 package，编译运行的时候路径不能乱！
 * 不写 package：默认在【无名默认包】，默认包里的类不能被别的包导入（坑！尽量不要用默认包）
 */
package com.study;

public class Animal {
  public void run(){
    System.out.println("动物跑");
  }
}
```

```plaintext [package 规则]
规则：

- 包名全部小写，一般用公司域名倒序 + 项目名 + 模块名 + 功能名。例如：com.xx.xx.xx.service
- 对应磁盘上真实的目录结构：`com/xxx/demo/`
- 一个 `.java` 文件只能有 0 或 1 个 package
```
:::

### 2. import

`import` = 告诉 JVM：我要使用**别的包里面的类**，省去每次写完整类名。如果不写 import，调用的时候必须写**全限定名（包名 + 类名）**

:::code-group
```plaintext [目录结构]
src
├── com
│   └── study
│       └── Animal.java
└── demo
    └── Main.java
```

```java [Main.java]
package demo;

// 导入别的包的类
import com.study.Animal;

public class Main {
  public static void main(String[] args) {
    Animal a = new Animal();
    a.run();
  }
}
```

```java [Animal.java]
package com.study;

public class Animal {
  public void run() {
    System.out.println("小动物在跑");
  }
}
```
:::

## 八、枚举: enum

枚举（`enum`）用来表示**一组固定的常量**：季节、订单状态、性别、星期。它是 JDK 5 引入的**特殊类**（不是基本数据类型），所以前面几章讲的类、构造器、接口规则在这里同样生效。

### 1. 定义与使用

枚举常量默认就是 `public static final`，**不能 `new`，构造器强制为 `private`**。

```java
public enum Season {
  SPRING, SUMMER, AUTUMN, WINTER  // 常量列表：全大写、逗号分隔
}

// 使用：直接类名.常量，不需要 new
Season s = Season.SPRING;
System.out.println(s);  // SPRING
```

::: tip 💡 分号规则
常量列表**后面还有成员（字段、构造器、方法）时，必须加分号** `;`；只有常量则可以省略。这个分号是新手最常见的编译报错来源。
:::

**常用方法**（编译器自动生成，不用手写）：

| 方法                   | 作用                          | 备注                                                  |
| ---------------------- | ----------------------------- | ----------------------------------------------------- |
| `values()`             | 返回全部常量的数组            | 顺序与声明顺序一致                                    |
| `valueOf(String name)` | 按名字取常量                  | 名字不存在或大小写不符，抛 `IllegalArgumentException` |
| `name()`               | 返回常量名（字符串）          | 就是声明时的字面量                                    |
| `ordinal()`            | 返回序号，从 0 开始           | **只适合内部排序，不要存进数据库**                    |
| `compareTo(e)`         | 按 `ordinal` 比较，可用于排序 | `TreeSet` / `Arrays.sort` 天然可用                    |
| `toString()`           | 默认等于 `name()`             | 可以重写，用于展示中文名                              |

### 2. switch 与遍历

`case` 里**只能写常量名，不能写全限定名** `Season.SPRING`。

::: code-group
```java [switch 判断]
Season s = Season.SUMMER;

// 传统写法
switch (s) {
  case SPRING:
  case AUTUMN:
    System.out.println("凉快");
    break;
  default:
    System.out.println("极端天气");
    break;
}

// JDK 14+ 箭头语法，不会穿透，无需 break
switch (s) {
  case SPRING, AUTUMN -> System.out.println("凉快");
  case SUMMER, WINTER -> System.out.println("冷热两重天");
}
```

```java [遍历与查找]
// 遍历全部取值
for (Season item : Season.values()) {
  System.out.println(item.name() + " -> " + item.ordinal());
}

// 字符串转枚举（常见于前端传参）
Season spring = Season.valueOf("SPRING");

// 更健壮的解析：名字不存在时返回默认值，而不是抛异常
public static Season parse(String name) {
  for (Season item : Season.values()) {
    if (item.name().equalsIgnoreCase(name)) return item;
  }
  return Season.SPRING;
}
```
:::

### 3. 枚举是特殊的类

枚举可以像普通类一样拥有字段、构造器和方法，只是实例被限定为声明的那几个。

```java
public enum Season {
  SPRING("春天", 1, 3),
  SUMMER("夏天", 4, 6),
  AUTUMN("秋天", 7, 9),
  WINTER("冬天", 10, 12);          // 有成员，结尾必须是分号

  private final String label;
  private final int startMonth;
  private final int endMonth;

  // 构造器只能是 private（写 public 会编译报错），因此可以省略 private
  Season(String label, int startMonth, int endMonth) {
    this.label = label;
    this.startMonth = startMonth;
    this.endMonth = endMonth;
  }

  public String getLabel() { return label; }

  public boolean contains(int month) {
    return month >= startMonth && month <= endMonth;
  }

  // 重写 toString，日志和前端展示都用中文名
  @Override
  public String toString() { return label; }
}
```

```java
System.out.println(Season.SPRING.getLabel());      // 春天
System.out.println(Season.SUMMER.contains(8));     // false
```

**实现接口 + 每个常量不同行为**：枚举整体实现接口，各常量再覆盖具体逻辑，比 `switch` 分发更清晰。

```java
public interface Operation {
  int apply(int a, int b);
}

public enum Op implements Operation {
  ADD {
    @Override public int apply(int a, int b) { return a + b; }
  },
  SUB {
    @Override public int apply(int a, int b) { return a - b; }
  };

  // 也可以用抽象方法代替接口，效果一样
}

System.out.println(Op.ADD.apply(3, 5));  // 8
```

### 4. 常见坑与规范

::: warning ⚠️ 四个高频坑
1. **`values()` 每次调用都返回新数组**（是复制，不是同一个引用），别在循环条件里反复调：`for (int i = 0; i < Season.values().length; i++)` 每次都在拷贝，先存成局部变量。
2. **`ordinal()` 不要持久化**。一旦有人在中间插入一个常量，历史数据的序号全部错位。存库请存 `name()`，JPA 里写 `@Enumerated(EnumType.STRING)`。
3. **`valueOf()` 对 null 和非法名字都抛异常**，接收外部参数时要自己包一层容错（见上面的 `parse`）。
4. **枚举不能被继承**（不能 `extends`），常量实例在类加载时一次性创建，天生单例、线程安全；所以不要在枚举里放非 `final` 的可变状态。
:::

**工程约定：**

- 常量名全大写、下划线分隔：`WAIT_PAY`、`IN_PROGRESS`；不要 `WaitPay`。
- 用来替换"魔法值"，尤其是状态机：订单状态、审核状态、消息类型。
- 需要大量按键查找时配合 `EnumMap`（比 `HashMap` 更省内存、迭代有序），去重集合用 `EnumSet`。
- 用枚举实现单例天然防反射、防反序列化破坏——这就是《Effective Java》推荐的单例写法之一。
- **值会变、需要运营随时调整的字典（如商品分类、地区）不要用枚举**，那属于配置或数据库字典表，改一次要发版。

```java
// 用枚举实现单例：简单、线程安全、防反射攻击
public enum Singleton {
  INSTANCE;

  public void doSomething() {
    System.out.println("业务逻辑");
  }
}
// 调用：Singleton.INSTANCE.doSomething();
```

## 小结

::: info 📖 相关资源
- [Java 教程](https://javabetter.cn/basic-grammar/basic-data-type.html) - Java 基础语法教程
- [老杜教程](https://www.bilibili.com/video/BV1izGR6EELo) - Java 全套最新
:::
