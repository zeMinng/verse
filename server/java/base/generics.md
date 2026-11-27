# 泛型和比较器

## 概要

泛型（Generics，JDK 5 起）把类型当作参数传给类、接口或方法，让编译器在编译期完成类型检查。两个特征要记住：**编译期做检查，运行期被擦除**，后面所有的坑都从这里长出来。

比较器（Comparable / Comparator）是泛型最典型的落地场景：两者都是泛型接口，决定了 TreeSet、TreeMap 和 sort 的排序规则。

## 一、为什么需要泛型

```java{8}
/** 没有泛型：什么都能放 */
List list = new ArrayList();
list.add("abc");
list.add(123);  // 也能放进去，没人拦
String s = (String) list.get(1);  // 强转，运行到这一行才抛 ClassCastException

/** 使用泛型：编译期就拦住 */
List<String> safe = new ArrayList<>();
safe.add("abc");
// safe.add(123);                   // 编译报错
String t = safe.get(0);            // 不用强转
```

收益三条：编译期类型检查、免强制转换、一套代码适配多种类型。

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

占位符有约定：T 任意类型、E 元素、K 键、V 值、N 数字、R 返回值、? 通配符。

### 2. 泛型接口

```java
public interface Converter<T, R> {
  R convert(T source);
}

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

`<T>` 写在返回值之前，和所在类是不是泛型类无关。

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

边界写法：单个上界用 extends；多边界用 & 连接，第一个可以是类，其余必须是接口。泛型类里的静态成员不能借用类的类型参数，必须自己声明一遍。

## 三、类型擦除

编译后类型参数被替换成它的上界（没有上界就是 Object），需要的地方插入强制转换。所以 `List<String>` 和 `List<Integer>` 在运行时是同一个类。

由此有一串不能做的事：new T()、new T[]、instanceof T、catch 捕获泛型、拿 T.class、静态成员用 T、靠泛型参数重载方法——擦除后签名完全一样。

想拿到类型就把 `Class<T>` 传进来：

```java
public <T> T create(Class<T> type) throws Exception {
  return type.getDeclaredConstructor().newInstance();
}

// 调用
User user = create(User.class);
```

## 四、通配符与 PECS

泛型不支持协变：`List<Object>` 接不住 `List<String>`，但 `List<?>` 可以。

| 写法                     | 能读成 | 能写入           |
| ------------------------ | ------ | ---------------- |
| `List<? extends Number>` | Number | 否（只能 null）  |
| `List<? super Integer>`  | Object | Integer 及其子类 |
| `List<?>`                | Object | 否（只能 null）  |

PECS 原则：Producer Extends, Consumer Super——只读取就用 extends，只写入就用 super。JDK 的 Collections.copy 就是范本：

```java
public static <T> void copy(List<? super T> dest, List<? extends T> src)
```

为什么 extends 不能写：编译器只知道它是“某个 Number 的子类”，不知道具体是 Integer 还是 Long，塞进去就可能破坏类型安全。

## 五、比较器

Comparable 和 Comparator 都是泛型接口，区别只在谁来定规则：

|        | `Comparable<T>`            | `Comparator<T>`             |
| ------ | -------------------------- | --------------------------- |
| 位置   | 类自己实现，compareTo(T o) | 外部传入，compare(T a, T b) |
| 排序数 | 只能有一种自然顺序         | 可以造多个，互不干扰        |
| 典型   | TreeSet / TreeMap 默认使用 | List.sort、Collections.sort |

返回值约定：负数排前面、0 表示相等、正数排后面，只保证符号，不保证是 −1 和 1。

```java
// 自然排序：类自己实现 Comparable
public class Person implements Comparable<Person> {
  private final String name;
  private final int age;

  @Override
  public int compareTo(Person other) {
    return Integer.compare(age, other.age);
  }
}

// 外部规则：Comparator 的三种常见写法
list.sort((a, b) -> Integer.compare(a.getAge(), b.getAge()));
list.sort(Comparator.comparingInt(Person::getAge).thenComparing(Person::getName));
list.sort(Comparator.comparing(Person::getName).reversed());
```

::: warning ⚠️ 两个坑
1. 减法当返回值会溢出：a.getAge() - b.getAge() 在 int 极值下会翻符号，一律用 Integer.compare 或 comparingInt。
2. 比较器要满足一致性：compare 返回 0 而 equals 为 false 时，TreeSet 会把两个不同对象当成重复元素丢掉。
:::

## 六、常见坑

1. **泛型数组不能创建**：`new List<String>[10]` 编译不过。数组在运行时记得元素类型，泛型被擦除了，二者矛盾。
2. **可变长参数会堆污染**：T... 本质是 Object[]，方法本身安全时加 @SafeVarargs 消警告。
3. **通配符别用作返回值**：`List<? extends Foo>` 当返回值会把“未知”甩给调用方，调用方什么也干不了。
4. **基本类型不能当类型参数**：`List<int>` 非法，必须 `List<Integer>`，装箱不发生在类型参数上。

## 小结

::: info 📖 相关资源
- [Oracle 泛型教程](https://docs.oracle.com/javase/tutorial/java/generics/) - 官方 Generics 章节
- [Java 全栈知识体系 · 泛型](https://pdai.tech/md/java/basic/java-basic-x-generic.html) - 擦除与通配符的深入推导
:::
