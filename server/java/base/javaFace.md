# Java 面向对象

## 概要

面向对象有三大特征：封装、继承、多态。

## 一、核心修饰符

Java修饰符主要分为 **访问修饰符** 和 **非访问修饰符**，用于限定类、属性、方法的特性和访问范围。

### 1. 访问修饰符（控制访问权限）

| 修饰符      | 作用       | 可修饰目标                   | 核心说明                 |
| ----------- | ---------- | ---------------------------- | ------------------------ |
| public      | 全局访问   | 类、属性、方法、接口         | 任意位置均可访问         |
| protected   | 受保护访问 | 属性、方法（不可修饰顶层类） | 本类、同包、子类可以访问 |
| **缺省** | 同包访问   | 类、属性、方法、接口         | 仅同一包下的类可访问     |
| private     | 私有访问   | 属性、方法（不可修饰顶层类） | 仅当前类内部可访问       |

### 2. 非访问修饰符（赋予特殊特性）

| 修饰符       | 作用     | 可修饰目标                 | 核心说明                                                               |
| ------------ | -------- | -------------------------- | ---------------------------------------------------------------------- |
| static       | 静态修饰 | 属性、方法、代码块、内部类 | 属于「类」而非「对象」，全局共享，可通过类名直接调用                   |
| final        | 最终修饰 | 类、属性、方法             | 修饰类：不可继承；修饰方法：不可重写；修饰变量：不可修改（常量）       |
| abstract     | 抽象修饰 | 类、方法                   | 修饰类：抽象类，不可实例化；修饰方法：抽象方法，无实现体，子类必须重写 |
| final        | 最终修饰 | 类、属性、方法             | 修饰类不可继承，修饰方法不可重写，修饰变量不可修改（赋值后不能变更）   |
| transient    | 瞬态修饰 | 属性                       | 序列化时忽略该属性，不参与对象的序列化过程                             |
| synchronized | 同步修饰 | 方法、代码块               | 保证多线程环境下的线程安全，防止资源竞争                               |

### 3. 权限修饰符

控制类、属性、方法的访问范围，从大到小排序:**（private < 空着不写 < protected < public）**

| 修饰符           | 说明         | 本类 | 同包 | 子类 | 其他包 |
| ---------------- | ------------ | ---- | ---- | ---- | ------ |
| public           | 公共的       | ✔️   | ✔️   | ✔️   | ✔️     |
| protected        | 受保护的     | ✔️   | ✔️   | ✔️   | ❌     |
| 默认（无修饰符） | 只能本包使用 | ✔️   | ✔️   | ❌   | ❌     |
| private          | 私房自己用   | ✔️   | ❌   | ❌   | ❌     |

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

## 二、类与对象

### 1. 类的创建与使用

类是对象的模板，包含属性（成员变量）和方法（行为）：

:::code-group
```java [创建]
public class Person {
  // 属性（成员变量）
  String name;
  int age;
  private String idCard; // 私有属性，仅类内部访问

  // 没有添加static关键字的方法叫实例方法（行为）
  public void eat() {
    System.out.println(name + "在吃饭");
  }

  // 带参数的方法
  public void sayHello(String friendName) {
    System.out.println(name + "向" + friendName + "问好");
  }
}
```

```java{4} [使用]
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

```java{9-12,15,17,22,28,48,55} [演示]
package demo;

/**
 * 演示修饰符：
 * public / protected / 默认 / private / static / final
 */
public class ModifierDemo {
  // === 【成员变量：4种访问修饰符 + static + final】 ===
  public String publicVar = "谁都能看";
  protected String protectedVar = "同包 + 子类能访问";
  String defaultVar = "默认：同包能访问"; // 啥都不写，包访问
  private String privateVar = "只有本类里面看得到";

  // static：属于类，不属于对象，不用new就能访问
  public static String staticVar = "static静态变量。物业大厅的东西，不属于某一个人";
  // final：值一旦赋值不能修改（常量）
  public final String finalVar = "final变量，不能改";


  // === 【构造方法，new的时候调用】 ===
  // new ModifierDemo() 就是调用这个构造器
  public ModifierDemo() {
      System.out.println("===== new 对象，执行构造方法 =====");
  }


  // === 【成员方法：四种访问修饰符】 ===
  public void publicMethod() {
    System.out.println("public方法：我哪里都能被调用");
    // 在本类内部，所有修饰的成员全都可以访问！
    System.out.println("本类里面可以访问 private：" + privateVar);
  }

  protected void protectedMethod() {
    System.out.println("protected方法：本类、子类、同包可用");
  }

  void defaultMethod() {
    System.out.println("默认方法：只有同包、本类能用");
  }

  private void privateMethod() {
    System.out.println("private方法：只能在当前类里面调用！外面调用直接报错");
  }


  // static 静态方法：属于类，没有this，不能直接访问非static成员
  public static void staticMethod() {
    System.out.println("static静态方法：不需要new对象，类名直接调用");
    // 静态方法里面，不能直接使用非static变量！
    // System.out.println(publicVar); // 这行会编译报错！
  }

  // final 方法：子类不能重写这个方法
  public final void finalMethod() {
    System.out.println("final方法：子类不能重写我");
  }


  // ========== 本类内部测试：在类里面，private也能访问 ==========
  public void testInner() {
    privateMethod(); // ✅ 本类内部调用private方法，合法
  }


  // main入口
  public static void main(String[] args) {
    // ===================== new 关键字：创建对象（实例） =====================
    // 格式：类名 变量名 = new 类名();
    ModifierDemo obj = new ModifierDemo();


    // 访问对象的非静态成员：必须用 对象.xxx
    obj.publicMethod();
    obj.protectedMethod();
    obj.defaultMethod();
    // obj.privateMethod(); // ❌ 编译报错！private外面不能访问

    System.out.println(obj.publicVar);
    System.out.println(obj.protectedVar);
    System.out.println(obj.defaultVar);
    // System.out.println(obj.privateVar); // ❌ 外部不能访问private


    // static成员：推荐【类名.xxx】，不需要new
    ModifierDemo.staticMethod();
    System.out.println(ModifierDemo.staticVar);

    // final变量不能二次赋值
    // obj.finalVar = "aaa"; // ❌ 编译报错，final不可修改

    // 调用本类里的方法，测试内部访问private
    obj.testInner();
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

```java{5-9,11-15,17-20}
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
    this(name, 18); // 调用带两个参数的构造方法，也就是第12行的带参构造
  }
}

// 使用构造方法创建对象
Person p1 = new Person(); // 无参构造，name=未知姓名，age=0
Person p2 = new Person("张三", 25); // 带参构造
Person p3 = new Person("李四"); // 调用单参构造，age=18
```

::: details 练习
::: code-group
```java [声明Student类]
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

```java [使用]
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

### 1. 继承: extends

- 单继承：一个类只能继承一个父类，但可多层继承
- 子类继承父类的非私有属性和方法（`private` 修饰的不可继承）
- 子类可通过 `super` 调用父类的构造方法、属性和方法

|          | 非私有 | private |
| -------- | :----: | :-----: |
| 构造方法 |   ❌   |   ❌    |
| 成员变量 |   ✔️   |   ✔️    |
| 成员方法 |   ✔️   |   ❌    |

```java{11,15-16}
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

```java:no-line-numbers
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

## 四、接口: interface

- 纯抽象的行为规范，仅包含抽象方法（JDK8+ 支持默认方法 `default` 和静态方法 `static`）
- 接口中的属性默认是 `public static final`（常量）
- 类通过 `implements` 实现接口，可多实现（弥补单继承缺陷）
- 实现类必须重写接口的所有抽象方法

```java{2,6-7,20-26,28-39}
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

## 五、抽象类: abstract class

- 用 `abstract` 修饰，不能直接实例化（需通过子类继承并实例化）
- 可包含抽象方法（无实现）和普通方法（有实现）
- 子类必须重写抽象类的所有抽象方法（除非子类也是抽象类）
- 抽象类是"模板"，接口是"规范"，抽象类可实现接口

```java{2,11}
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

## 六、内部类

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

**Q: 堆中主要存什么？**  
A: new 出来的对象都在堆内存当中。实例变量在对象内部。
