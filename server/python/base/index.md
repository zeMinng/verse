# Python 语法基础

## 概要

[Python](https://docs.python.org/zh-cn/3/) 是一门强调可读性与开发效率的通用编程语言，常用于脚本自动化、Web 开发、数据分析与 AI 等场景。它是动态类型语言，写起来更灵活，但也更需要良好的命名、结构与测试来保证可维护性。

## 一、数据类型

Python 的常用内置类型可以按“数值 / 序列 / 映射 / 集合 / 布尔 / 二进制 / 特殊值”来理解。

| 类型 | 名称 | 说明 | 示例 | 是否可变 | 是否有序 |
| --- | --- | --- | --- | --- | --- |
| int | 整数 | 不带小数的数字 | `10` | ❌ | - |
| float | 浮点数 | 带小数的数字 | `3.14` | ❌ | - |
| bool | 布尔值 | 真或假 | `True` | ❌ | - |
| complex | 复数 | 复数类型 | `1+2j` | ❌ | - |
| str | 字符串 | 文本数据 | `"hello"` | ❌ | ✅ |
| list | 列表 | 有序可修改集合 | `[1, 2, 3]` | ✅ | ✅ |
| tuple | 元组 | 有序不可修改集合 | `(1, 2, 3)` | ❌ | ✅ |
| set | 集合 | 无序且元素唯一 | `{1, 2, 3}` | ✅ | ❌ |
| dict | 字典 | 键值对数据结构 | `{"name": "Tom"}` | ✅ | ✅ |
| NoneType | 空类型 | 表示空值 | `None` | ❌ | - |


:::: code-group
```python [数字类型]
# 1. int（整数）
a = 100
b = -50
print(type(a))

# 2. float（浮点数）
pi = 3.14159
print(type(pi))

# 3. complex（复数）
c = 1 + 2j
print(type(c))

# 4. bool（布尔值）
flag = True
print(type(flag))
```

```python [字符串（str）]
name = "Python"

# 1. 重复
print("Hi" * 3)

# 2. 索引
s = "Python"
print(s[0])   # P
print(s[-1])  # n

# 3. 切片
print(s[0:3])  # Pyt

# 常用方法
s = "hello"
print(s.upper())
print(s.capitalize())
print(s.replace("h", "H"))
```

```python [列表（list）]
# 特点：有序、可修改、可重复、支持不同类型
nums = [1, 2, 3]
names = ["Tom", "Jack"]
mixed = [1, "Hello", True]

# 1. 添加元素
nums.append(4)
# 2. 插入元素
nums.insert(1, 100)
# 3. 删除元素
nums.remove(2)
# 4. 访问元素
print(nums[0])
# 5. 遍历列表
for item in nums:
    print(item)
```

```python [元组（tuple）]
# 特点：有序、不可修改、可重复
t = (1, 2, 3)
t = (10,)

print(t[0])
```

```python [集合（set）]
# 集合是无序、不重复的数据类型。
s = {1, 2, 3}

# 1. 添加元素
s.add(4)
# 2. 删除元素
s.remove(2)
# 3. 集合运算
a = {1, 2, 3}
b = {3, 4, 5}

print(a & b)  # 交集
print(a | b)  # 并集
print(a - b)  # 差集
```

```python [字典（dict）]
# 特点：键值对结构、键不能重复、可修改
user = {
  "name": "Tom",
  "age": 18
}

# 1. 获取值
print(user["name"])
# 2. 添加/修改
user["gender"] = "male"
# 3. 删除
del user["age"]
# 4. 遍历字典
for k, v in user.items():
    print(k, v)
```
::::

## 二、变量声明与类型转换

Python 通过赋值来绑定变量名，不需要显式声明类型；“常量”通常用全大写命名来表达约定（语言层面不会强制禁止修改）。

:::: code-group
```python [变量声明]
x = 10         # int
y = 3.14       # float
is_active = True  # bool
name = "xiaoxiao"
age = 18
print(f'name is {name}, age is {age}')

# 常量（命名约定）
PI = 3.14159     # 常量：圆周率
MAX_USERS = 100  # 常量：最大用户数
```

```python [类型转换]
int()  # 转换为一个整数
float() # 转化为一个浮点数
str()  # 转换为一个字符串
eval(str) # 用来计算在字符串中的有效python表达式，并返回一个对象
tuple(s) # 将序列s转换为一个元组
list(s)  # 将序列s转换为一个列表
chr(x)   # 将一个整数转换为一个字符
```
::::

## 三、流程控制

流程控制用于决定代码执行顺序，常见结构包括条件分支、循环、循环控制语句，以及异常处理。

### 1. 条件语句（if / elif / else）

```python
if condition:
    # 如果 condition 为 True，执行这里的代码
elif another_condition:
    # 如果另一条件为 True，执行这里的代码
else:
    # 如果以上条件都不满足，执行这里的代码
```

### 2. 循环语句（for / while）

::: code-group
```python [for 遍历 range]
for i in range(5):  # 0, 1, 2, 3, 4
    print(i)
```

```python [for 遍历列表]
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
```

```python [while 循环]
count = 0
while count < 5:
    print(count)
    count += 1
```
:::

### 3. 循环控制语句（break / continue / pass）

::: code-group
```python [break]
for i in range(5):
    if i == 3:
        break
    print(i)
```

```python [continue]
for i in range(5):
    if i == 3:
        continue
    print(i)
```

```python [pass]
if 3 > 2:
    pass  # 占位符
```
:::

### 4. 嵌套控制结构

::: code-group
```python [嵌套 if]
age = 25
if age > 18:
    if age < 30:
        print("成年人且年龄在 18 到 30 之间")
    else:
        print("成年人但超过 30 岁")
else:
    print("未成年")
```

```python [嵌套循环]
for i in range(3):
    for j in range(2):
        print(f"i = {i}, j = {j}")
```
:::

### 5. 条件表达式（三元表达式）

```python
# 基础语法
x if condition else y

age = 18
status = "成年人" if age >= 18 else "未成年"
print(status)
```

### 6. 异常处理（try / except / else / finally）

:::code-group
```python [基础语法]
try:
    # 可能引发异常的代码
except ExceptionType as e:
    # 异常处理代码
else:
    # 如果没有异常发生，执行此块代码
finally:
    # 无论是否发生异常，最终都会执行这块代码
```

```python [举例]
try:
    x = 10 / 0
except ZeroDivisionError:
    print("不能除以零")
else:
    print("没有错误发生")
finally:
    print("此代码总会执行")
```
:::

## 四、函数

函数用于复用逻辑与组织代码。Python 用 `def` 定义函数，参数支持位置参数、默认参数、可变参数（`*args` / `**kwargs`）与关键字参数；也支持 `lambda` 匿名函数。

### 1. 定义函数与返回值

:::: code-group
```python [定义函数]
def function_name(parameters):
    # 函数体
    return value  # 可选返回值
```

```python [示例：问候]
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")
greet("Bob")
```

```python [示例：返回值]
def add(a, b):
    return a + b

result = add(3, 5)
print(result)  # 8
```
::::

### 2. 参数

:::code-group
```python [位置参数]
def subtract(a, b):
    return a - b

print(subtract(10, 3))  # 7
```

```python [默认参数]
def greet2(name, greeting = "Hello"):
    print(f"{greeting}, {name}!")

greet2("Alice")
greet2("Bob", "Hi")
```

```python [可变参数]
# 可变数量的参数 *args
def sum_numbers(*args):
    type(args) # 以元组形式接收
    return sum(args)

print(sum_numbers(1, 2, 3))         # 6
print(sum_numbers(1, 2, 3, 4, 5))   # 15

# 关键字参数 **kwargs
def greet_person(**kwargs):
    type(kwargs) # 以字典形式接收
    print(f"Hello {kwargs['name']}! Your age is {kwargs['age']}.")

greet_person(name="Alice", age=30)
```

```python [关键字参数]
def person_info(name, age):
    print(f"Name: {name}, Age: {age}")

person_info(name="Alice", age=25)
```
:::

### 3. 匿名函数（lambda）

```python
# 基础语法 函数名 = lambda 形参: 返回值
add2 = lambda x, y: x + y
print(add2(3, 5))  # 8

points = [(2, 3), (1, 1), (4, 5)]
points.sort(key=lambda x: x[1])
print(points)  # [(1, 1), (2, 3), (4, 5)]
```

### 4. 函数作用域（局部 / 全局）

:::: code-group
```python [局部变量与全局变量]
x = 10  # 全局变量

def foo():
    x = 5  # 局部变量
    print(x)

foo()     # 5
print(x)  # 10
```

```python [修改全局变量：global]
x = 10

def modify_global():
    global x
    x = 20

modify_global()
print(x)  # 20
```
::::

### 5. 函数文档字符串（docstring）

```python
def greet3(name):
    """
    该函数接受一个名字作为参数，并打印问候语。
    参数:
        name: 字符串，表示被问候的人的名字
    """
    print(f"Hello, {name}!")

help(greet3)
```

### 6. 递归函数

```python
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n - 1)

print(factorial(5))  # 120
```

### 7. 异常模块与包

:::code-group
```python [抛出异常]
def func():
    raise Exception("抛出了一个问题")
func()
```

```python [模块]
# 1. 内置模块

# 2. 第三方模块
import 模块名
from 模块名 import 功能名
from 模块名 import *

调用：模块名.功能名

# 3. 自定义模块
```
:::

## 五、列表与序列进阶

### 1. 列表切片

切片语法 `[start:stop:step]` 适用于 list、tuple、str 等序列类型，左闭右开。

```python
nums = [0, 1, 2, 3, 4, 5]

print(nums[1:4])    # [1, 2, 3] — 索引 1 到 3
print(nums[:3])     # [0, 1, 2] — 省略 start 从 0 开始
print(nums[3:])     # [3, 4, 5] — 省略 stop 到末尾
print(nums[::2])    # [0, 2, 4] — 步长为 2，隔一个取一个
print(nums[::-1])   # [5, 4, 3, 2, 1, 0] — 负步长倒序

# 浅拷贝（等价于 nums.copy()）
copy = nums[:]
```

### 2. 推导式

Python 提供三种推导式，用简洁的表达式构造集合。

::: code-group
```python [列表推导式]
# 基础：[表达式 for 变量 in 可迭代对象]
squares = [x**2 for x in range(6)]     # [0, 1, 4, 9, 16, 25]

# 带 if 过滤
evens = [x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]

# 带 if-else 三元
labels = ["偶数" if x % 2 == 0 else "奇数" for x in range(4)]

# 嵌套循环
pairs = [(x, y) for x in "AB" for y in "12"]
```

```python [字典推导式]
# {键表达式: 值表达式 for ...}
squares_dict = {x: x**2 for x in range(4)}
# {0: 0, 1: 1, 2: 4, 3: 9}

# 反转键值
d = {"a": 1, "b": 2}
reversed_d = {v: k for k, v in d.items()}
# {1: 'a', 2: 'b'}
```

```python [集合推导式]
# {表达式 for ...}
unique_lengths = {len(w) for w in ["a", "bb", "ccc", "bb"]}
# {1, 2, 3}
```
:::

### 3. 解包（unpacking）

将序列中的元素一次性赋值给多个变量，或用 `*` 收集剩余元素。

```python
# 元组/列表解包
a, b, c = (1, 2, 3)         # a=1, b=2, c=3
first, *rest = [1, 2, 3, 4] # first=1, rest=[2, 3, 4]
*head, last = [1, 2, 3, 4]  # head=[1, 2, 3], last=4

# * 合并列表
a, b = [1, 2], [3, 4]
merged = [*a, *b]           # [1, 2, 3, 4]
```

## 六、常用内置函数

Python 内置了大量开箱即用的函数，无需 import 即可使用。以下按用途分组列出最常用的：

:::: code-group
```python [聚合类]
nums = [3, 7, 2, 9, 4]

len(nums)      # 5 — 序列长度
max(nums)      # 9 — 最大值
min(nums)      # 2 — 最小值
sum(nums)      # 25 — 求和
any(nums)      # True — 任一为真？
all(nums)      # True — 全部为真？
```

```python [排序与反转]
nums = [3, 7, 2, 9, 4]

sorted(nums)              # [2, 3, 4, 7, 9] — 返回新列表
sorted(nums, reverse=True) # [9, 7, 4, 3, 2] — 降序
list(reversed(nums))       # [4, 9, 2, 7, 3] — 反转

# key 参数：按自定义规则排序
words = ["apple", "kiwi", "banana"]
sorted(words, key=len)    # ['kiwi', 'apple', 'banana'] — 按长度
```

```python [映射与过滤]
nums = [1, 2, 3, 4, 5]

# map：对每个元素执行同一操作
list(map(str, nums))       # ['1', '2', '3', '4', '5']

# filter：保留满足条件的元素
list(filter(lambda x: x > 2, nums))  # [3, 4, 5]

# 注意：map/filter 返回迭代器，需用 list() 转换
```

```python [类型判断与转换]
type(42)          # <class 'int'>
isinstance(42, int)  # True
isinstance(42, (int, float))  # True — 支持多类型

# 进制转换
bin(10)   # '0b1010' — 转二进制
hex(255)  # '0xff'   — 转十六进制
oct(8)    # '0o10'   — 转八进制

# 字符与编码
ord('A')   # 65
chr(65)    # 'A'
```

```python [迭代与枚举]
# range：生成整数序列
list(range(5))       # [0, 1, 2, 3, 4]
list(range(2, 7))    # [2, 3, 4, 5, 6]
list(range(0, 10, 2)) # [0, 2, 4, 6, 8] — 步长为 2

# enumerate：带索引遍历
for i, v in enumerate(['a', 'b', 'c']):
    print(i, v)

# zip：并行迭代
for a, b in zip([1, 2], ['x', 'y']):
    print(a, b)
```
::::

## 七、文件操作

Python 通过内置的 `open()` 函数读写文件，配合 `with` 语句可自动关闭文件，避免资源泄漏。

### 1. 文件打开模式

| 模式 | 说明 |
|------|------|
| `'r'` | 只读（默认），文件不存在则报错 |
| `'w'` | 写入（覆盖），文件不存在则创建 |
| `'a'` | 追加写入，文件不存在则创建 |
| `'r+'` | 读写，文件必须存在 |
| `'b'` | 二进制模式，如 `'rb'`、`'wb'` |

### 2. 读文件

```python
# with 语句：离开代码块自动关闭文件
with open("example.txt", "r", encoding="utf-8") as f:
    content = f.read()       # 一次性读取全部
    # line = f.readline()    # 读取一行
    # lines = f.readlines()  # 读取所有行，返回列表

# 逐行读取（推荐：大文件不会撑爆内存）
with open("example.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
```

### 3. 写文件

```python
# 覆盖写入
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("Hello\n")
    f.write("World\n")

# 追加写入
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("追加的一行\n")
```

## 小结

::::info 📖 相关资源
- [Python 官方文档](https://docs.python.org/zh-cn/3/) - Python 3 文档
- [Python 教程](https://docs.python.org/zh-cn/3/tutorial/) - 官方入门教程
- [B站教程](https://www.bilibili.com/video/BV1rpWjevEip?spm_id_from=333.788.player.switch&vd_source=636e79898d369bbe2acb20cb13cd6463&p=25) - B站教程
::::
