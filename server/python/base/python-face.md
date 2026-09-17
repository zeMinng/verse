
# Python 面向对象

## 概要

面向对象编程（简称 OOP）是一种程序设计思想。它将数据和操作数据的方法打包在一起，共同组成一个独立的单元：**对象（Object）**。

可以这样理解：**类（Class）**：就像一张汽车的设计图纸。**对象（Object）**：根据图纸真正造出来的、可以开的汽车（也叫实例 Instance）。

## 一、类与对象

在 Python 中，我们使用 `class` 关键字来定义一个类，使用 `__init__` 方法来初始化对象的属性。

:::code-group
```python [构造方法]
class Dog:
    # 类属性（所有实例共享）
    species = "Canis lupus"

    # 构造方法（初始化实例属性）
    def __init__(self, name, age):
        self.name = name  # 实例属性
        self.age = age    # 实例属性

    # 实例方法
    def bark(self):
        return f"{self.name} 正在汪汪叫！"

# 创建对象（实例化）
my_dog = Dog("旺财", 3)

# 访问属性和方法
print(my_dog.name)    # 输出: 旺财
print(my_dog.bark())  # 输出: 旺财 正在汪汪叫！
```

```python [析构方法]
import time
class DatabaseConnection:
    def __init__(self, db_name):
        self.db_name = db_name
        print(f"🔌 成功连接到数据库: {self.db_name}")

    # 析构方法
    def __del__(self):
        print(f"🔒 正在断开与数据库 {self.db_name} 的连接，释放资源...")

# 1. 创建对象（触发 __init__）
conn = DatabaseConnection("UserDB")

# 执行一些操作
print("正在读取数据...")
time.sleep(0.5)

# 2. 手动删除唯一的引用（会立即触发 __del__）
del conn

print("程序结束")

# ⚠️ 注意事项
# 不要过分依赖 __del__：Python 的垃圾回收是基于引用计数的。
# 你很难精准控制非手动 del 情况下 __del__ 确切的执行时间。

# 更推荐的做法：对于文件和网络连接等资源的释放，
# Python 更推荐使用 with 语句（上下文管理器 __enter__ 和 __exit__），
# 这比 __del__ 更加安全和可控。
```
:::

::: info 什么是 `self`？
`self` 代表**对象实例本身**。当你调用 `my_dog.bark()` 时，Python 会自动把 `my_dog` 作为第一个参数传给 `bark` 方法的 `self`。
:::

## 二、面向对象的三大特性

Python 的面向对象核心可以概括为三个词：**封装、继承、多态**。

### 1. 封装 (Encapsulation)

封装是指隐藏对象内部的复杂实现细节，只暴露简单的接口（方法）供外部使用。同时，可以通过在属性名前加上**双下划线__** 来定义私有属性，防止外部直接修改。

:::code-group
```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.__balance = balance  # 私有属性，外部无法直接访问

    # 存款（提供安全的借口修改私有属性）
    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
            
    # 获取余额（只读接口）
    def get_balance(self):
        return self.__balance

account = BankAccount("张三", 1000)
# print(account.__balance)  # 报错！无法直接访问
account.deposit(500)
print(account.get_balance()) # 输出: 1500
```

```python [隐藏属性]
class Person:
    name = 'xiaoxiao'   # 类属性
    __age = 18          # 隐藏属性

    def intro(self):    # 实例方法
        Person.__age = 18
        print(f"{Person.name}的年龄是{Person.__age}") # 在实例方法中访问类属性和隐藏属性

    def __play(self):
        print("玩手机")

    def funa(self):
        print("实例方法")
        Person.__play(self) # 在实例方法中调用私有方法，不推荐
        self.__play() # 推荐使用

pe = Person()
print(pe.name)
# print(pe.__age)  # 报错

# 第一种方法：可以获取到__age
print(pe._Person__age)
pe._Person__age = 16
print(pe._Person__age)

# 第二种方法：推荐
print(pe.intro())

# 调用隐藏方法
pe.funa()
```

```python [隐藏属性/方法]
class SmartPhone:
    def __init__(self, brand, price):
        self.brand = brand          # 公有属性：任何人都可以访问和修改
        self.__price = price        # 私有属性：外部无法直接通过 .__price 访问
        self.__battery_level = 100  # 私有属性：电量

    # 公有方法：提供给外部的接口
    def charge(self):
        self.__optimize_battery()  # 内部调用私有方法
        self.__battery_level = 100
        print(f"充电完成，当前电量：{self.__battery_level}%")

    def check_price(self, identity):
        if identity == "admin":
            return f"内部进货价为：{self.__price}"
        return "权限不足，无法查看价格"

    # 私有方法：不希望被外部直接调用的底层逻辑
    def __optimize_battery(self):
        print("正在进行电池健康优化和电压调整...")


# --- 测试私有属性与方法 ---
phone = SmartPhone("华为", 5999)

# 1. 外部直接访问公有属性和方法
print(phone.brand)            # 输出: 华为
phone.charge()                # 正常调用公有方法

# 2. 外部直接访问私有属性和方法 -> 都会报错
# print(phone.__price)        # AttributeError
# phone.__optimize_battery()  # AttributeError

# 3. 通过公有接口间接访问私有属性
print(phone.check_price("guest"))  # 输出: 权限不足，无法查看价格
print(phone.check_price("admin"))  # 输出: 内部进货价为：5999

# 4. 【底层原理】Python 的私有属性其实是“伪私有”
# Python 会自动将 `__属性名` 改名为 `_类名__属性名` (称为 Name Mangling)
# 虽然可以通过这种方式强行访问，但强烈不建议在生产代码中使用！
print(phone._SmartPhone__price)   # 输出: 5999
```

```python [私有属性/方法]
class Phone:
    def _optimize_battery(self):  # 单下划线
        print("优化电池")

p = Phone()
p._optimize_battery()  # 能正常运行！不会报错
```
:::

### 2. 继承 (Inheritance)

继承允许我们创建新类（子类）来继承现有类（父类）的属性和方法，从而实现代码复用。

当子类想要扩展而非完全覆盖父类的某个方法时，可以使用 **super()**。它就像一个“接力棒”，能够让我们先触发父类的原有逻辑，再在此基础上追加子类特有的功能，从而避免重复编写相同的代码。

:::code-group
```python [单继承]
# 父类
class Animal:
    def __init__(self, name):
        self.name = name
        
    def make_sound(self):
        return f"{self.name} 发出了声音"

# 子类继承 Animal
class Cat(Animal):
    def make_sound(self):
        # 1. 用 super() 先调用父类的原有逻辑
        base_sound = super().make_sound() 
        
        # 2. 在父类的基础上，加上子类自己的特色
        return f"{base_sound}：喵喵叫~"

# 测试一下
my_cat = Cat("咪咪")
print(my_cat.make_sound()) 
# 输出 -> 咪咪 发出了声音：喵喵叫~
```

```python [多继承]
# 父类 1：代表生物属性
class Animal:
    def __init__(self, name):
        self.name = name
        
    def show_info(self):
        return f"名字叫【{self.name}】"

# 父类 2：代表宠物属性
class Pet:
    def show_info(self):
        return "是一只可爱的宠物"

# 子类：同时继承 Animal 和 Pet
class Cat(Animal, Pet):
    def show_info(self):
        # 1. 💡 用 super() 开始沿着继承链条调用
        # 它会先去调用 Animal 的 show_info，而 Animal 内部还会神奇地传递给 Pet
        base_info = super().show_info()
        
        # 2. 叠加上子类自己的特色
        return f"{base_info} -> 它的品种是：英国短毛猫~"

# 测试一下
my_cat = Cat("咪咪")
print(my_cat.show_info())
# 输出 -> 名字叫【咪咪】 -> 是一只可爱的宠物 -> 它的品种是：英国短毛猫~
```
:::

### 3. 多态 (Polymorphism)

多态指的是“一个接口，多种实现”。同一方法在不同的对象上会有不同的表现形式。Python 是一种动态语言，天然支持 **鸭子类型（Duck Typing）**。

```python
class Dog:
    def make_sound(self): return "汪汪！"

class Cat:
    def make_sound(self): return "喵喵~"

# 一个通用的函数，接收任何有 make_sound 方法的对象
def animal_sound(animal_obj):
    print(animal_obj.make_sound())

dog = Dog()
cat = Cat()

animal_sound(dog)  # 输出: 汪汪！
animal_sound(cat)  # 输出: 喵喵~
```

## 三、高级进阶

### 1. 属性装饰器 `@property`

为了让私有属性的访问和修改更像普通属性一样自然，Python 提供了 `@property` 装饰器，把方法伪装成属性。

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def area(self):
        return self.width * self.height

rect = Rectangle(4, 5)
# 注意：这里不需要加括号 () 访问
print(rect.area)  # 输出: 20
```

### 2. 类方法与静态方法

除了普通的实例方法，类中还可以定义类方法和静态方法：

| 方法类型 | 装饰器 | 第一个参数 | 适用场景 |
| --- | --- | --- | --- |
| **实例方法** | 无 | `self` (指向实例) | 需要访问或修改实例的属性 |
| **类方法** | `@classmethod` | `cls` (指向类本身) | 常用于常量的修改或提供替代的构造函数 |
| **静态方法** | `@staticmethod` | 无 | 与类相关但不需要访问类或实例属性的工具函数 |

:::code-group
```python [类方法]
class Cat:
    # 类变量：所有猫咪共享的总数
    total_count = 0

    def __init__(self, name, breed):
        self.name = name
        self.breed = breed
        # 每诞生一只新猫，类变量总数就加 1
        Cat.total_count += 1

    # 💡 这是一个类方法（工厂函数）
    @classmethod
    def create_siamese(cls, name):
        # cls 代表 Cat 类本身，相当于调用 Cat(name, "暹罗猫")
        return cls(name, breed="暹罗猫")

    # 💡 这是一个类方法（获取类变量）
    @classmethod
    def get_total_count(cls):
        return f"当前一共创建了 {cls.total_count} 只猫咪！"


# ======= 测试类方法 =======

# 1. 使用类方法快捷创建一只暹罗猫（不需要手动传品种了）
cat1 = Cat.create_siamese("年糕")
print(f"{cat1.name} 的品种是：{cat1.breed}")  # 输出 -> 年糕 的品种是：暹罗猫

# 2. 使用普通方式创建一只猫
cat2 = Cat("大白", "波斯猫")

# 3. 通过类名直接调用类方法，查看总数
print(Cat.get_total_count())  # 输出 -> 当前一共创建了 2 只猫咪！
```

```python [静态方法]
class CatTool:
    
    # 💡 这是一个静态方法（纯工具人，只需要外部传参进来计算）
    @staticmethod
    def cat_to_human_age(cat_age):
        """将猫的年龄换算成人类的相对年龄"""
        if cat_age <= 1:
            return cat_age * 15
        else:
            return 15 + (cat_age - 1) * 4

# ======= 测试静态方法 =======

# 静态方法最爽的一点：不需要实例化（不需要写 tool = CatTool()），直接用类名调用
human_age = CatTool.cat_to_human_age(3)
print(f"3岁的猫咪，相当于人类的 {human_age} 岁。")  # 输出 -> 3岁的猫咪，相当于人类的 23 岁。
```

:::

## 总结

掌握面向对象编程可以帮助你构建结构更清晰、更易于扩展和维护的大型 Python 项目。

* 用 **类** 封装数据与逻辑。
* 用 **继承** 减少重复代码。
* 用 **多态** 提高代码的灵活性。
