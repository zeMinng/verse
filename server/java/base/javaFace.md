# Java 面向对象

## 一、核心修饰符

Java修饰符主要分为 **访问修饰符** 和 **非访问修饰符**，用于限定类、属性、方法的特性和访问范围。

##### 1. 访问修饰符（控制访问权限）
| 修饰符 | 作用 | 可修饰目标 | 核心说明 |
|--------|------|------------|----------|
| public | 全局访问 | 类、属性、方法、接口 | 所有包、所有类均可访问 |
| protected | 受保护访问 | 属性、方法（不可修饰顶层类） | 本类、同包类、子类可访问 |
| default | 同包访问 | 类、属性、方法、接口 | 仅同一包下的类可访问 |
| private | 私有访问 | 属性、方法（不可修饰顶层类） | 仅当前类内部可访问 |

##### 2. 非访问修饰符（赋予特殊特性）
| 修饰符 | 作用 | 可修饰目标 | 核心说明 |
|--------|------|------------|----------|
| static | 静态修饰 | 属性、方法、代码块、内部类 | 属于「类」而非「对象」，全局共享，可通过类名直接调用 |
| final | 最终修饰 | 类、属性、方法 | 修饰类：不可继承；修饰方法：不可重写；修饰变量：不可修改（常量） |
| abstract | 抽象修饰 | 类、方法 | 修饰类：抽象类，不可实例化；修饰方法：抽象方法，无实现体，子类必须重写 |
| final | 最终修饰 | 类、属性、方法 | 修饰类不可继承，修饰方法不可重写，修饰变量不可修改（赋值后不能变更） |
| transient | 瞬态修饰 | 属性 | 序列化时忽略该属性，不参与对象的序列化过程 |
| synchronized | 同步修饰 | 方法、代码块 | 保证多线程环境下的线程安全，防止资源竞争 |

## 二、类与对象

### 1. 类的定义与使用
类是对象的模板，包含属性（成员变量）和方法（行为）：

:::code-group
```java [定义]
// 类的基本结构
public class Person {
  // 属性（成员变量）
  String name;
  int age;
  private String idCard; // 私有属性，仅类内部访问

  // 方法（行为）
  public void eat() {
    System.out.println(name + "在吃饭");
  }

  // 带参数的方法
  public void sayHello(String friendName) {
    System.out.println(name + "向" + friendName + "问好");
  }
}
```

```java [使用]
public class Test {
  public static void main(String[] args) {
    // 创建对象（实例化）
    Person person = new Person();
    
    // 访问对象属性
    person.name = "张三";
    person.age = 25;
    
    // 调用对象方法
    person.eat(); // 输出：张三在吃饭
    person.sayHello("李四"); // 输出：张三向李四问好
  }
}
```
:::

### 2. 构造方法

- 方法名与类名完全一致，无返回值类型（连 `void` 都没有）
- 用于对象初始化，创建对象时自动调用
- 若未自定义构造方法，系统会提供默认无参构造方法
- 可重载（多个构造方法参数列表不同）

::: info 快捷生成 Javabean
快捷键：alt + insert / alt + fn + insert

插件：PTG 1秒生成标准 Javabean
:::

```java
public class Person {
  String name;
  int age;

  // 无参构造方法（默认构造）
  public Person() {
    this.name = "未知姓名";
    this.age = 0;
  }

  // 带参构造方法（重载）
  public Person(String name, int age) {
    this.name = name; // this 区分成员变量和局部变量
    this.age = age;
  }

  // 构造方法调用其他构造方法（通过 this()，必须在第一行）
  public Person(String name) {
    this(name, 18); // 调用带两个参数的构造方法
  }
}

// 使用构造方法创建对象
Person p1 = new Person(); // 无参构造，name=未知姓名，age=0
Person p2 = new Person("张三", 25); // 带参构造
Person p3 = new Person("李四"); // 调用单参构造，age=18
```

::: details 练习
::: code-group
``` java [声明Student类]
public class Student {
  private int id;
  private String name;
  private int age;

  public Student() {}

  public Student(int id, String name, int age) {
    this.id = id;
    this.name = name;
    this.age = age;
  }

  public int getId() {
    return id;
  }
}
```

``` java [使用]
public class StudentTest {
  public static void main(String[] args) {
    Student[] arr = new Student[4];

    Student stu1 = new Student(1, "张三", 18);
    Student stu2 = new Student(2, "小米", 18);
    Student stu3 = new Student(3, "阿萨", 18);

    arr[0] = stu1;
    arr[1] = stu2;
    arr[2] = stu3;
    System.out.println(contains(arr, new Student(3, "阿萨", 18)));
  }

  public static boolean contains(Student[] arr, Student stu) {
    for (int i = 0; i < arr.length; i++) {
      if (arr[i].getId() == stu.getId()) {
        System.out.println("已经存在");
        return false;
      }
    }
    return true;
  }
}
```
:::

## 三、继承与多态

### 1. 继承（extends）

- 单继承：一个类只能继承一个父类，但可多层继承
- 子类继承父类的非私有属性和方法（`private` 修饰的不可继承）
- 子类可通过 `super` 调用父类的构造方法、属性和方法

|      |   非私有  |   private |
| ----------- | :-------: |  :-------: |
|  构造方法    |  ❌ |  ❌ |
|   成员变量   |   ✔️  | ✔️|
|   成员方法   |  ✔️   | ❌ |

```java
// 父类
public class Animal {
  String type;

  public void eat() {
    System.out.println(type + "在吃东西");
  }
}

// 子类继承父类
public class Dog extends Animal {
  // 子类特有属性
  String name;

  // 子类重写父类方法（@Override 注解标识）
  @Override
  public void eat() {
    System.out.println(name + "（" + type + "）在吃骨头");
  }

  // 子类特有方法
  public void bark() {
    System.out.println(name + "在叫");
  }
}

// 使用子类
Dog dog = new Dog();
dog.type = "犬科";
dog.name = "旺财";
dog.eat(); // 输出：旺财（犬科）在吃骨头
dog.bark(); // 输出：旺财在叫
```

### 2. 多态
- 同一行为的不同表现形式，基于继承和方法重写实现
- 条件：子类继承父类、子类重写父类方法、父类引用指向子类对象

::: warning 多态调用成员的特点
:one: 变量调用：编译看左边，运行也看左边。

:two: 方法调用：编译看左边，运行看右边。 
``` java:no-line-numbers
Animal a = new Dog();
```
换句话讲

成员变量：在子类的对象中，会把父类的成员变量也继承下来的

成员方法：如果子类对方法进行了重写，那么在虚方法表中是会把父类的方法进行覆盖
:::

```java
public class Cat extends Animal {
  String name;

  @Override
  public void eat() {
    System.out.println(name + "（" + type + "）在吃鱼");
  }

  public void catchMouse() {
    System.out.println(name + "在抓老鼠");
  }
}

// 多态体现：父类引用指向子类对象
Animal animal1 = new Dog();
Animal animal2 = new Cat();

animal1.type = "犬科";
((Dog) animal1).name = "旺财"; // 向下转型才能访问子类特有属性
animal1.eat(); // 输出：旺财（犬科）在吃骨头

animal2.type = "猫科";
((Cat) animal2).name = "咪宝";
animal2.eat(); // 输出：咪宝（猫科）在吃鱼
```

## 四、权限修饰符
控制类、属性、方法的访问范围，从大到小排序：**（private < 空着不写 < protected < public）**

| 修饰符 | 说明 | 本类 | 同包 | 子类 | 其他包 |
|--------|------|------|------|------|--------|
| public | 公共的 | ✔️ | ✔️ | ✔️ | ✔️ |
| protected | 受保护的 | ✔️ | ✔️ | ✔️ | ❌ |
| 默认（无修饰符）| 只能本包使用 | ✔️ | ✔️ | ❌ | ❌ |
| private | 私房自己用 | ✔️ | ❌ | ❌ | ❌ |

:::code-group
```java [补充说明]
public class Person {
  public String publicAttr;    // 所有地方可访问
  protected String protectAttr;// 本类、同包、子类可访问
  String defaultAttr;          // 本类、同包可访问
  private String privateAttr;  // 仅本类可访问

  public void publicMethod() {}
  protected void protectMethod() {}
  void defaultMethod() {}
  private void privateMethod() {}
}
```
:::

## 五、接口（interface）
- 纯抽象的行为规范，仅包含抽象方法（JDK8+ 支持默认方法 `default` 和静态方法 `static`）
- 接口中的属性默认是 `public static final`（常量）
- 类通过 `implements` 实现接口，可多实现（弥补单继承缺陷）
- 实现类必须重写接口的所有抽象方法

```java
// 定义接口
public interface Flyable {
  // 常量（默认 public static final）
  String TYPE = "飞行生物";

  // 抽象方法（默认 public abstract）
  void fly();

  // 默认方法（带实现，可被实现类重写）
  default void showInfo() {
    System.out.println("这是" + TYPE);
  }

  // 静态方法（属于接口，通过接口名调用）
  static void staticMethod() {
    System.out.println("飞行接口的静态方法");
  }
}

// 类实现接口
public class Bird implements Flyable {
  @Override
  public void fly() {
    System.out.println("小鸟在天空飞翔");
  }
}

// 多实现接口
public class Plane implements Flyable, Runnable {
  @Override
  public void fly() {
    System.out.println("飞机在高空飞行");
  }

  @Override
  public void run() {
    System.out.println("飞机在跑道滑行");
  }
}

// 使用
Bird bird = new Bird();
bird.fly(); // 输出：小鸟在天空飞翔
bird.showInfo(); // 输出：这是飞行生物
Flyable.staticMethod(); // 输出：飞行接口的静态方法
```

## 六、抽象类（abstract class）
- 用 `abstract` 修饰，不能直接实例化（需通过子类继承并实例化）
- 可包含抽象方法（无实现）和普通方法（有实现）
- 子类必须重写抽象类的所有抽象方法（除非子类也是抽象类）
- 抽象类是"模板"，接口是"规范"，抽象类可实现接口

```java
// 抽象类
public abstract class Vehicle {
  String brand;

  // 普通方法（有实现）
  public void start() {
    System.out.println(brand + "启动了");
  }

  // 抽象方法（无实现，子类必须重写）
  public abstract void run();
}

// 子类继承抽象类
public class Car extends Vehicle {
  @Override
  public void run() {
    System.out.println(brand + "汽车在公路上行驶");
  }
}

// 使用
Car car = new Car();
car.brand = "特斯拉";
car.start(); // 输出：特斯拉启动了
car.run(); // 输出：特斯拉汽车在公路上行驶
```

## 七、内部类
定义在另一个类内部的类，根据位置和修饰符分为：

### 1. 成员内部类
- 定义在类的成员位置，可访问外部类的所有属性和方法
- 创建方式：`外部类.内部类 变量名 = new 外部类().new 内部类()`

```java
public class Outer {
  private String outerAttr = "外部类属性";

  // 成员内部类
  public class Inner {
    public void show() {
      System.out.println("访问外部类属性：" + outerAttr);
    }
  }
}

// 创建和使用内部类
Outer.Inner inner = new Outer().new Inner();
inner.show(); // 输出：访问外部类属性：外部类属性
```

### 2. 静态内部类
- 用 `static` 修饰的成员内部类，不能访问外部类的非静态资源
- 创建方式：`外部类.内部类 变量名 = new 外部类.内部类()`

```java
public class Outer {
  private static String staticAttr = "外部类静态属性";

  // 静态内部类
  public static class StaticInner {
    public void show() {
      System.out.println("访问外部类静态属性：" + staticAttr);
    }
  }
}

// 创建和使用静态内部类
Outer.StaticInner staticInner = new Outer.StaticInner();
staticInner.show(); // 输出：访问外部类静态属性：外部类静态属性
```

### 3. 局部内部类
- 定义在方法内部，作用域仅限于当前方法
- 不能用访问修饰符修饰，可访问方法的局部变量（需是 `final` 或effectively final）

```java
public class Outer {
  public void method() {
    String localVar = "方法局部变量";

    // 局部内部类
    class LocalInner {
      public void show() {
        System.out.println("访问方法局部变量：" + localVar);
      }
    }

    // 方法内部创建并使用
    LocalInner localInner = new LocalInner();
    localInner.show();
  }
}

// 调用
new Outer().method(); // 输出：访问方法局部变量：方法局部变量
```

### 4. 匿名内部类（常用）
- 没有类名的局部内部类，常用于快速实现接口或抽象类
- 一次性使用，不能重复创建对象

```java
// 接口
public interface Greet {
  void sayHello();
}

// 使用匿名内部类实现接口
public class Test {
  public static void main(String[] args) {
    // 匿名内部类（直接实现 Greet 接口）
    Greet greet = new Greet() {
      @Override
      public void sayHello() {
        System.out.println("你好，匿名内部类！");
      }
    };

    greet.sayHello(); // 输出：你好，匿名内部类！
  }
}
```

## 小结
| 知识点 | 重点强调 | 常见误区 |
|--------|----------|----------|
| 类与对象 | 类是模板，对象是实例，`new` 关键字创建对象 | 混淆成员变量和局部变量的作用域 |
| 构造方法 | 方法名与类名一致，无返回值，支持重载 | 忘记调用 `super()` 导致父类初始化失败 |
| 继承多态 | 单继承、方法重写是多态的基础 | 父类引用不能直接访问子类特有方法（需转型） |
| 权限修饰符 | `private` 仅本类访问，`public` 全局访问 | 误将 `protected` 当作全局访问修饰符 |
| 接口与抽象类 | 接口是规范（多实现），抽象类是模板（单继承） | 抽象类不能实例化，接口不能有普通方法（JDK8+ 除外） |
| 内部类 | 匿名内部类常用于快速实现接口 | 局部内部类访问局部变量需满足 final 要求 |
| 核心修饰符 | `static` 属于类，`final` 不可修改/继承/重写，`abstract` 不可实例化 | 混淆 `static` 修饰的成员与对象成员的调用方式 |

1.  修饰符分为访问修饰符（4种）和非访问修饰符（核心为`static`、`final`、`abstract`），用于限定类和成员的特性与访问范围。
2.  面向对象核心三大特性是封装（权限修饰符实现）、继承（`extends`）、多态（父类引用指向子类对象+方法重写）。
3.  接口是纯规范（多实现），抽象类是模板（单继承），内部类中匿名内部类最常用，用于快速实现接口/抽象类。