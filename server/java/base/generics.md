# 泛型和比较器

## 概要

泛型 (Generics，JDK5 引入) 本质上是把类型当作参数传给类、接口或方法，让编译器在编译期完成类型检查。要先记住两个特征：编译期做检查，运行期被擦除，后面所有的"坑"都从这里长出来。

<!-- 比较器（`Comparable` / `Comparator`）是泛型最典型的落地场景：两个接口都是泛型接口，且决定了 `TreeSet`、`TreeMap` 和 `sort` 的排序规则。 -->

## 一、定义泛型

```java{9}
/** 没有泛型 */
// 集合只能装 Object，放进去是什么类型编译器并不知道
List list = new ArrayList();
list.add("abc");
list.add(123);  // 也能放进去，没人拦
String s = (String) list.get(1);  // 强转，运行到这一行才抛 ClassCastException

/** 使用泛型 */
List<String> list = new ArrayList<>();
list.add("abc");
// list.add(123);  // 编译期直接报错，不用等到运行时
String s = list.get(0);  // ！！不需要强转
```

收益只有三条，但都很实在：**编译期类型检查、免强制转换、一套代码适配多种类型**（顺带让方法签名自带文档性）。

## 二、三种用法

### 1. 泛型类

在类名后面声明类型参数，类内部就把它当成一个已知类型使用。

```java{1,2,4,6,8,12}
public class Box<T> {
  private T value;

  public Box(T value) { this.value = value; }

  public T get() { return value; }

  public void set(T value) { this.value = value; }
}

// 实例化时才确定 T，右边的类型可以省略（菱形语法）
Box<String> box = new Box<>("hello");
String s = box.get();
```

`T` 只是占位符，不是真实存在的类型。命名有约定，别随手都用 `T`：

| 占位符 | 含义                    |
| ------ | ----------------------- |
| `T`    | 任意类型（Type）        |
| `E`    | 集合中的元素（Element） |
| `K`    | 键（Key）               |
| `V`    | 值（Value）             |
| `N`    | 数字（Number）          |
| `R`    | 返回值（Result）        |
| `?`    | 通配符，表示未知类型    |

### 2. 泛型接口

```java
public interface Converter<T, R> {
  R convert(T source);
}
```

实现时有两种选择——**把类型定死**，或者**继续往下透传**：

```java
// 定死类型：这个实现只能处理 String → Integer
class StringToInt implements Converter<String, Integer> {
  @Override
  public Integer convert(String source) {
    return Integer.parseInt(source);
  }
}

// 继续透传：实现类自己也是泛型，T 从外部进来
class ToList<T> implements Converter<T, List<T>> {
  @Override
  public List<T> convert(T source) {
    return List.of(source);
  }
}
```

### 3. 泛型方法

`<T>` 写在**返回值之前**，跟所在类是不是泛型类无关。

```java{3,7,14}
public class Util {
  // 类型由实参推断，调用时不用写 <String>
  public static <T> T first(List<T> list) {
    return list.isEmpty() ? null : list.get(0);
  }

  public static <T> List<T> swap(List<T> list, int i, int j) {
    T tmp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, tmp);
    return list;
  }

  public <T, E> T m(T a, E b) {
    return a;
  }
}

String s = Util.first(List.of("a", "b"));  // 推断出 T = String

Util u = new Util();
Integer number = u.m(100, "as");
```

::: warning ⚠️ 静态成员不能用类的类型参数
泛型类的 `T` 属于**实例**，而 `static` 成员不依附任何实例，所以 `static T value;` 编译不过。泛型类里的静态方法必须自己声明一遍：`static <T> T foo()`。
:::

## 三、类型边界（bounds）

无边界时 `T` 什么都能装；需要调用具体方法时，就得告诉编译器"它至少是个什么"。

```java
// 上界：T 必须是 Number 的子类，这样才能调用 doubleValue()
public static <T extends Number> double half(T num) {
  return num.doubleValue() / 2;
}

// 多边界：第一个可以是类，后面的必须全是接口，用 & 连接
public static <T extends Comparable<T> & Serializable> T max(List<T> list) {
  T max = list.get(0);
  for (T item : list) {
    if (item.compareTo(max) > 0) max = item;
  }
  return max;
}
```

注意 `Comparable<T>` 这种**自引用边界**：`T` 的边界里又出现了 `T`，读起来别扭但合法，含义是"T 必须能和自己比较"。

## 四、类型擦除（Type Erasure）

::: warning ⚠️ 泛型在运行时并不存在
编译后所有类型参数都被替换成它的**上界**（没有上界就是 `Object`），并在需要的地方插入强制转换。所以 `List<String>` 和 `List<Integer>` 在运行时是**同一个类**，`getClass()` 结果完全相同。
:::

由此得到一串硬约束，这些都是编译期就拦下来的：

| 想做的事                         | 能否 | 原因 / 替代方案                                     |
| -------------------------------- | ---- | --------------------------------------------------- |
| `new T()`                        | ✗    | 运行时不知道 T 是什么 → 传入 `Class<T>` 用反射创建  |
| `new T[]`                        | ✗    | 同上，且数组协变会破坏类型安全 → 用 `Object[]` 再转 |
| `obj instanceof T`               | ✗    | 擦除后无法区分 → 靠 `Class.isInstance`              |
| `catch (T e)`                    | ✗    | 异常捕获需要真实类型 → 捕获父类再判断               |
| `T.class` / `List<String>.class` | ✗    | 同上 → 只能传 `Class<T>` 参数                       |
| `static T field`                 | ✗    | 静态成员不属于实例，拿不到类型参数                  |
| 靠泛型参数做方法重载             | ✗    | 擦除后签名一样，属于重复定义                        |

"想拿到类型"的标准解法就是**把 `Class<T>` 当参数传进来**：

```java
public <T> T create(Class<T> type) throws Exception {
  return type.getDeclaredConstructor().newInstance();
}

// 调用
User user = create(User.class);
```

## 五、通配符与 PECS

泛型**不支持协变**，这是它和数组最大的区别：

```java
List<Object> a = new ArrayList<String>();  // 编译报错：类型不匹配
List<?> b = new ArrayList<String>();        // 可以：? 代表未知类型
```

三种通配写法的能力边界：

| 写法                     | 能读成   | 能写入             | 典型用途       |
| ------------------------ | -------- | ------------------ | -------------- |
| `List<? extends Number>` | `Number` | ✗（只能写 `null`） | 只当数据来源看 |
| `List<? super Integer>`  | `Object` | `Integer` 及其子类 | 只当数据容器塞 |
| `List<?>`                | `Object` | ✗（只能写 `null`） | 纯遍历、打日志 |

**PECS 原则**：Producer Extends, Consumer Super。集合往外**产出**数据（只读）就用 `extends`，往里**消费**数据（只写）就用 `super`。JDK 的 `Collections.copy` 就是这个写法的范本：

```java
// 目标是消费者（要往里写）→ ? super T
// 来源是生产者（要往外读）→ ? extends T
public static <T> void copy(List<? super T> dest, List<? extends T> src)
```

::: tip 💡 为什么 `? extends` 不能写
编译器只知道它是"某个 `Number` 的子类"，但不知道具体是 `Integer` 还是 `Long`。往里塞 `Integer`，万一实际是 `List<Long>` 就类型不安全了。反过来 `? super Integer` 读不出精确类型，是同一个道理。
:::

## 六、比较器：Comparable 与 Comparator

两个都是泛型接口，区别只在**谁来定规则**：

|        | `Comparable<T>`                         | `Comparator<T>`                            |
| ------ | --------------------------------------- | ------------------------------------------ |
| 位置   | 类**自己**实现，`int compareTo(T o)`    | **外部**传入，`int compare(T a, T b)`      |
| 排序数 | 只能有一种"自然顺序"                    | 可以按需造多个，互不干扰                   |
| 典型   | `TreeSet`/`TreeMap` 默认走它            | `List.sort(cmp)`、`Collections.sort(l, c)` |
| 适用   | 值对象、`String`/`Integer` 这类天然可比 | 业务排序：按年龄、按价格、按时间倒序       |

**返回值约定**（两个接口一致）：负数表示 a 排前面，0 表示相等，正数表示 a 排后面。**只保证符号，不保证是 `-1`/`1`**，所以别写 `return a - b == -1` 这种判断。

::: code-group
```java [Comparable：自然排序]
public class Person implements Comparable<Person> {
  private final String name;
  private final int age;

  public Person(String name, int age) {
    this.name = name;
    this.age = age;
  }

  @Override
  public int compareTo(Person other) {
    return Integer.compare(this.age, other.age);  // 按年龄升序
  }
}

// TreeSet 不传比较器时，就用 compareTo 决定顺序
Set<Person> set = new TreeSet<>(List.of(new Person("张三", 25), new Person("李四", 20)));
```

```java [Comparator：外部规则]
List<Person> list = new ArrayList<>(List.of(
    new Person("张三", 25), new Person("李四", 20), new Person("王五", 25)));

// 1. 匿名类写法
list.sort(new Comparator<Person>() {
  @Override
  public int compare(Person a, Person b) {
    return Integer.compare(a.getAge(), b.getAge());
  }
});

// 2. Lambda 写法（Comparator 是函数式接口）
list.sort((a, b) -> Integer.compare(a.getAge(), b.getAge()));

// 3. 链式写法：先按年龄升序，年龄相同再按名字排序
list.sort(Comparator.comparingInt(Person::getAge)
                    .thenComparing(Person::getName));
```
:::

常用的现成工具，不用自己写比较逻辑：

| 写法                          | 效果                            |
| ----------------------------- | ------------------------------- |
| `Comparator.naturalOrder()`   | 自然顺序（要求实现 Comparable） |
| `Comparator.reverseOrder()`   | 自然顺序倒序                    |
| `Comparator.comparing(fn)`    | 按提取出的 key 升序             |
| `Comparator.comparingInt(fn)` | 按 int key 升序，免装箱         |
| `.thenComparing(fn)`          | 前一个相等时的次级规则          |
| `.reversed()`                 | 整体反转                        |
| `Comparator.nullsFirst(cmp)`  | `null` 排最前（否则会 NPE）     |

::: warning ⚠️ 比较器最经典的两个坑
1. **用减法当返回值会溢出**：`return a.getAge() - b.getAge()` 在 `int` 极值下会翻符号，排序直接乱掉。一律用 `Integer.compare(a, b)` 或 `Comparator.comparingInt`。
2. **比较器要满足"一致性"**：`compare(a, b) == 0` 与 `equals` 结果不一致时，`TreeSet` 会把两个不同对象当成重复元素丢掉。要么让两者判断一致，要么别用有序集合存它们。
:::

```java
// 排序 + 去重的组合：TreeMap 的 key 由比较器决定唯一性
Map<Person, String> map = new TreeMap<>(Comparator.comparing(Person::getName));
map.put(new Person("张三", 25), "A");
map.put(new Person("张三", 30), "B");  // key 被视为相同，B 会覆盖 A
```

## 七、常见坑

::: warning ⚠️ 五个高频坑
1. **泛型数组不能创建**：`new List<String>[10]` 编译不过。数组在运行时记得自己的元素类型，而泛型被擦除了，二者矛盾。
2. **可变长参数会堆污染**：`T...` 本质是 `Object[]`，调用方可能传入不匹配的类型。方法本身安全时加 `@SafeVarargs` 消除警告。
3. **通配符别用作返回值**：`List<? extends Foo> get()` 会把"未知"甩给调用方，调用方什么也干不了。返回值用具体类型，通配符只出现在参数上。
4. **基本类型不能当类型参数**：`List<int>` 非法，必须写 `List<Integer>`。自动装箱只发生在赋值/传参，不发生在类型参数上。
5. **擦除后无法在运行时判断泛型**：日志、序列化、`instanceof` 都只能看到原始类型。要留真实类型，就额外存一个 `Class` 或字符串标签。
:::

```java
// 可变长参数的泛型方法：堆污染风险在这里
@SafeVarargs                          // 只有 static / final / private 方法才能加
public static <T> void printAll(T... items) {
  for (T item : items) {
    System.out.println(item);
  }
}
```

## 小结

| 场景                     | 结论                                  |
| ------------------------ | ------------------------------------- |
| 让集合能装指定类型       | 泛型类，`List<String>`                |
| 复用一段逻辑处理多种类型 | 泛型方法，`<T> T foo(T t)`            |
| 参数只需读取             | `? extends T`（PECS 的 Producer）     |
| 参数只需写入             | `? super T`（PECS 的 Consumer）       |
| 运行时要知道具体类型     | 传 `Class<T>`，别指望擦除后的泛型信息 |
| 单一自然顺序             | 实现 `Comparable<T>`                  |
| 多套业务排序、临时规则   | `Comparator.comparing(...)` 链式构造  |

::: info 📖 相关资源
- [Oracle 泛型教程](https://docs.oracle.com/javase/tutorial/java/generics/) - 官方 Generics 章节
- [Java 全栈知识体系 · 泛型](https://pdai.tech/md/java/basic/java-basic-x-generic.html) - 擦除与通配符的深入推导
:::
