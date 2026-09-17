# TypeScript 从基础到高级

## 概要

[TypeScript](https://www.typescriptlang.org/zh/) 是 JavaScript 的超集，通过**静态类型系统**在编译阶段捕获错误，提供更强的代码提示与自动补全。本篇从基础类型注解开始，逐步深入到泛型、工具类型、条件类型、模板字符串类型等高级特性，覆盖日常开发与架构设计中的常见场景。

## 一、基础类型系统

### 1. 类型注解与基本类型

TypeScript 最核心的能力是类型标注，为变量、参数、返回值明确指定类型：

| 类型 | 例子 | 描述 |
| --- | --- | --- |
| number | `1, -33, 2.5` | 任意数字 |
| string | `'hi'` | 任意字符串 |
| boolean | `true、false` | 布尔值 |
| 字面量 | 其本身 | 限制变量的值就是该字面量的值 |
| any | `*` | 任意类型（关闭类型检查） |
| unknown | `*` | 类型安全的 any |
| void | 空值（undefined） | 没有值 |
| never | 没有值 | 不能是任何值 |
| object | `{name:'xx'}` | 任意的 JS 对象 |
| array | `[1,2,3]` | 任意 JS 数组 |
| tuple | `[4,5]` | TS 新增类型，固定长度数组 |
| enum | `enum {A,B}` | TS 新增类型，枚举 |

:::code-group
```ts [基础类型]
// 基本类型注解
let count: number = 10
let message: string = "Hello TypeScript"
let isDone: boolean = false
let u: undefined = undefined
let n: null = null

// 数组类型
let numbers: number[] = [1, 2, 3]
let strings: Array<string> = ["a", "b", "c"]

// 元组类型（固定长度和类型的数组）
let tuple: [string, number] = ["age", 25]
```

```ts [unknown 类型处理]
let a: unknown
a = 99
a = '123'

let b: string
// 方式一：类型收窄
if (typeof a === 'string') {
  b = a
}
// 方式二：类型断言
b = a as string
// 或 b = <string>a
```

```ts [object 类型与索引签名]
let a: {
  name: string
  [key: string]: any // 索引签名：允许任意额外属性
}
a = {
  name: 'sd',
  age: 88,
}
```
:::

### 2. 枚举（Enum）

枚举用于定义命名常量集合，让相关常量更具可读性。

:::code-group
```ts [数字枚举]
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

const walk = (data: Direction) => {
  if (data === Direction.Up) { /* ... */ }
}
walk(Direction.Up)
```

```ts [手动设置枚举值]
enum Status {
  Pending = 1,
  Approved,     // 自动为 2
  Rejected = 5,
  Cancelled     // 自动为 6
}
```

```ts [字符串枚举]
enum MessageType {
  Success = "SUCCESS",
  Error = "ERROR",
  Warning = "WARNING",
}

function handleResponse(type: MessageType) {
  switch(type) {
    case MessageType.Success:
      console.log("操作成功")
      break
    case MessageType.Error:
      console.log("操作失败")
      break
  }
}
```

```ts [常量枚举]
// 编译时被移除，成员直接替换为值，减少代码体积
const enum Weekday {
  Monday,
  Tuesday,
  Wednesday
}
const today = Weekday.Monday // 编译后：const today = 0;

/** 反向映射：数字枚举支持通过值获取键名，字符串枚举不支持 */
enum Role {
  Admin,
  User,
  Guest
}
console.log(Role.User) // 正向映射：1
console.log(Role[1])   // 反向映射："User"
```
:::

### 3. 类型别名（type）

type 为类型创建别名，可简化复杂类型，提高复用性。

:::code-group
```ts [联合与交叉类型]
// 联合类型
type Status = number | string
type Gender = '男' | '女'

// 交叉类型
type Area = { width: number; height: number }
type Address = { room: string; cell: number }
type House = Area & Address
```

```ts [函数类型 + 泛型]
/** 函数类型别名 */
type AddFunc = (a: number, b: number) => number
const add: AddFunc = (x, y) => x + y // 使用别名定义函数
console.log(add(2, 3)) // 5

/** 泛型容器 */
type Container<T> = {
  value: T
  getValue: () => T
}

const numberContainer: Container<number> = {
  value: 10,
  getValue: () => 10,
}
```
:::

### 4. 函数类型

```ts
// 函数声明
function add(x: number, y: number): number {
  return x + y
}

// 函数表达式
const multiply: (x: number, y: number) => number = (x, y) => x * y

// 可选参数（必须放在必选参数后面）
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}`
}

// 默认参数
function log(message: string, level: string = "info"): void {
  console.log(`[${level}] ${message}`)
}

// 剩余参数
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}
```

## 二、接口与泛型

### 1. 接口（interface）

接口用于定义对象的结构契约，确保代码的类型安全。注意：**interface 只能定义格式，不能包含任何实现**。

:::code-group
```ts [定义对象]
interface UserInterface {
  readonly gender: string          // 只读属性
  name: string
  age?: number                     // 可选属性
  run: (n: number) => void
  [propName: string]: any          // 索引签名
}

const user: UserInterface = {
  name: '张三',
  gender: '男',
  age: 13,
  run(n) {},
  email: 'alice@example.com'       // 符合索引签名
}
```

```ts [定义函数结构]
interface CountInterface {
  (a: number, b: number): number
}
const count: CountInterface = (x, y) => x + y
```

```ts [定义类结构]
interface PersonInterface {
  name: string
  age: number
  speak(n: number): void
}

class Person implements PersonInterface {
  constructor(
    public name: string,
    public age: number,
  ) {}
  speak(n: number): void {
    for (let i = 0; i < n; i++) {}
  }
}
```

```ts [接口继承]
interface PersonInterface {
  name: string
  age: number
}
interface StudentInterface extends PersonInterface {
  grade: string
}
```
:::

**什么时候用 interface？**

- ==定义对象格式==：描述数据模型、API 响应、配置对象，是开发中最多的场景
- ==类的契约==：规定类需要实现哪些属性和方法
- ==自动合并==：扩展第三方库类型时可以利用声明合并特性

### 2. 泛型（Generics）

泛型允许在定义时不指定具体类型，而是在使用时指定，让同一段代码适配多种类型同时保持类型安全。

:::code-group
```ts [泛型函数]
function logData<T>(data: T): T {
  console.log(data)
  return data
}
// TSX 中推荐写法
const logData = <T extends unknown>(data: T): T => {
  console.log(data)
  return data
}

logData<number>(10)
logData<string>('hello')
```

```ts [多泛型参数]
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second]
}
pair<number, string>(10, 'hello')
```

```ts [泛型约束]
// extends 约束泛型必须有特定属性
function getLength<T extends { length: number }>(item: T): number {
  return item.length
}
getLength('hello')     // ✅
getLength([1, 2, 3])   // ✅
// getLength(123)      // ❌ number 没有 length
```

```ts [泛型接口]
interface PersonInterface<T> {
  name: string
  age: number
  extraInfo: T
  getValue: () => T
}

let p1: PersonInterface<string> = {
  name: 'zhangsan',
  age: 20,
  extraInfo: '这是个字符串',
  getValue() { return this.extraInfo }
}

// 传入复杂类型
type JobInfo = { title: string; company: string }
let p2: PersonInterface<JobInfo> = {
  name: 'zhangsan',
  age: 20,
  extraInfo: { title: '前端工程师', company: '阿里巴巴' },
  getValue() { return this.extraInfo }
}
```

```ts [泛型类]
class Person<T> {
  constructor(
    public name: string,
    public age: number,
    public sex: T,
  ) {}
  speak(): T {
    console.log(this.name, this.age, this.sex)
    return this.sex
  }
}
const p = new Person<string>('小明', 18, '男')
```
:::

### 3. interface 与 type 的区别

| 特性 | interface | type |
| --- | --- | --- |
| 核心能力 | 专注定义对象和类的结构 | 可定义类型别名、联合、交叉等复杂类型 |
| 继承支持 | 通过 `extends` 继承 | 通过交叉类型 `&` 模拟 |
| 自动合并 | 重复定义会自动合并属性 | 重复定义会报错 |
| 适用场景 | 对象 / 类的契约、需扩展的结构 | 复杂类型组合（联合、交叉）、基本类型别名 |

**选择建议：** 定义对象结构时优先用 `interface`，需要联合类型、映射类型等复杂组合时用 `type`。

## 三、类与装饰器

### 1. 类中的类型

```ts
class Animal {
  // 成员类型标注
  name: string
  private age: number
  protected readonly species: string

  constructor(name: string, age: number, species: string) {
    this.name = name
    this.age = age
    this.species = species
  }

  // 方法返回值标注
  speak(): string {
    return `${this.name} makes a sound`
  }
}

// 继承
class Dog extends Animal {
  bark(): void {
    console.log('Woof!')
  }
}

// 抽象类
abstract class Shape {
  abstract getArea(): number // 子类必须实现
}
class Circle extends Shape {
  constructor(public radius: number) {
    super()
  }
  getArea(): number {
    return Math.PI * this.radius ** 2
  }
}
```

### 2. 装饰器

装饰器是一种特殊的函数，可以对**类、属性、方法、参数**进行扩展，让代码更简洁。

:::code-group
```ts [类装饰器]
function CustomString(target: Function) {
  target.prototype.toString = function () {
    return JSON.stringify(this)
  }
  Object.seal(target.prototype)
}

@CustomString
class Person {
  name: string
  age: number
  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }
}

const p1 = new Person('咋', 18)
console.log(p1.toString())
```

```ts [替换被装饰的类]
type Constructor = new (...args: any[]) => {}

interface Person {
  getTime(): void
}

function LogTime<T extends Constructor>(target: T) {
  return class extends target {
    createdTime: Date
    constructor(...args: any[]) {
      super(...args)
      this.createdTime = new Date()
    }
    getTime() {
      console.log(this.createdTime)
    }
  }
}

@LogTime
class Person {
  name: string
  age: number
  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }
}

const p1 = new Person('张三', 18)
console.log(p1.getTime()) // 输出创建时间
```
:::

:::tip 装饰器类型
TypeScript 支持 5 种装饰器：**类装饰器、属性装饰器、方法装饰器、访问器装饰器、参数装饰器**。
:::

::: details 关于构造类型
```ts
// 仅声明构造类型
type Constructor = new (...args: any[]) => {}
function test(fn: Constructor) {}
class Person {}
text(Person)

// 声明构造类型 + 指定静态属性
type Constructor = {
  new (...args: any[]): {}
  wife: string
}
function test(fn: Constructor) {}
class Person {
  static wife: string
}
text(Person)
```
:::

## 四、内置工具类型

熟练运用内置工具类型可以解决 80% 的业务场景，避免重复造轮子。

### 1. 属性修饰工具：Partial、Required、Readonly

```ts
interface User {
  name: string
  age: number
  email: string
}

// Partial<T> — 所有属性变可选
type PartialUser = Partial<User>
// { name?: string; age?: number; email?: string }

// Required<T> — 所有属性变必选
type RequiredUser = Required<PartialUser>
// { name: string; age: number; email: string }

// Readonly<T> — 所有属性变只读
type ReadonlyUser = Readonly<User>
// { readonly name: string; readonly age: number; readonly email: string }
```

### 2. 属性选取工具：Pick、Omit

```ts
interface UserModel {
  id: string
  name: string
  email: string
  createdAt: Date
}

// Pick<T, K> — 从 T 中选取指定属性
type UserPreview = Pick<UserModel, 'name' | 'email'>
// { name: string; email: string }

// Omit<T, K> — 从 T 中排除指定属性
type CreateUserPayload = Omit<UserModel, 'id' | 'createdAt'>
// { name: string; email: string }
```

**选择建议：** 排除的属性少用 `Omit`，只要少数属性用 `Pick`。

### 3. 构造工具：Record

```ts
type UserRole = 'admin' | 'editor' | 'viewer'

interface Permissions {
  canDelete: boolean
  canEdit: boolean
}

// Record<K, V> — 构造以 K 为键、V 为值的对象类型
const roleConfig: Record<UserRole, Permissions> = {
  admin: { canDelete: true, canEdit: true },
  editor: { canDelete: false, canEdit: true },
  viewer: { canDelete: false, canEdit: false },
}
```

### 4. 函数类型工具：ReturnType、Parameters

```ts
function fetchConfig() {
  return {
    timeout: 3000,
    host: 'api.example.com',
    retry: 3
  }
}

// ReturnType<T> — 提取函数返回值类型
type ApiConfig = ReturnType<typeof fetchConfig>
// { timeout: number; host: string; retry: number }

// Parameters<T> — 提取函数参数类型（元组）
function createUser(name: string, age: number, isAdmin: boolean): void {}
type CreateUserParams = Parameters<typeof createUser>
// [name: string, age: number, isAdmin: boolean]
```

### 5. 联合类型工具：Exclude、Extract、NonNullable

```ts
type All = 'a' | 'b' | 'c' | 'd'

// Exclude<T, U> — 从 T 中排除可赋值给 U 的类型
type WithoutAB = Exclude<All, 'a' | 'b'>
// 'c' | 'd'

// Extract<T, U> — 从 T 中提取可赋值给 U 的类型
type OnlyAOrB = Extract<All, 'a' | 'b' | 'e'>
// 'a' | 'b'

// NonNullable<T> — 排除 null 和 undefined
type MaybeString = string | null | undefined
type DefinitelyString = NonNullable<MaybeString>
// string
```

## 五、高级类型技巧

### 1. 条件类型与 infer

条件类型根据类型关系做分支判断，`infer` 可在其中声明待推断的类型变量。

```ts
// 条件类型基础
type IsString<T> = T extends string ? 'yes' : 'no'
type A = IsString<string>  // 'yes'
type B = IsString<number>  // 'no'

// ReturnType 底层实现
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any

const getUser = () => ({ name: 'Alex', age: 18 })
type User = MyReturnType<typeof getUser>
// { name: string; age: number }
```

:::code-group
```ts [提取 Promise 泛型]
type UnpackPromise<T> = T extends Promise<infer U> ? U : T

type ResponsePromise = Promise<{ code: number; data: string[] }>
type ResponseData = UnpackPromise<ResponsePromise>
// { code: number; data: string[] }
```

```ts [提取数组元素类型]
type ArrayItem<T> = T extends (infer U)[] ? U : T
type Item = ArrayItem<string[]>
// string
```

```ts [递归提取深层 Promise]
type UnpackDeep<T> = T extends Promise<infer U>
  ? UnpackDeep<U>
  : T

type Deep = Promise<Promise<Promise<number>>>
type Result = UnpackDeep<Deep>
// number
```
:::

### 2. 模板字符串类型

Template Literal Types（TS 4.1+）使用模板字符串语法组装字符串字面量类型。

:::code-group
```ts [基础拼接]
type Direction = 'top' | 'right' | 'bottom' | 'left'
type PaddingProperty = `padding-${Direction}`
// "padding-top" | "padding-right" | "padding-bottom" | "padding-left"
```

```ts [内置字符串工具]
// Uppercase / Lowercase / Capitalize / Uncapitalize
type EventName = 'click' | 'hover'
type EventHandler = `on${Capitalize<EventName>}`
// "onClick" | "onHover"
```

```ts [as 重映射对象键名]
type GetterName<T extends string> = `get${Capitalize<T>}`

type MakeGetters<T> = {
  [K in keyof T as GetterName<K & string>]: () => T[K]
}

interface UserInfo {
  name: string
  age: number
}

type UserGetters = MakeGetters<UserInfo>
// { getName: () => string; getAge: () => number }
```
:::

### 3. satisfies 运算符

`satisfies`（TS 4.9+）既校验变量符合类型契约，又保留最精确的字面量推导。

:::code-group
```ts [传统声明的痛点]
type Colors = 'primary' | 'secondary' | 'success'
type RGB = [number, number, number]

// 传统：丢失精确类型
const palette1: Record<Colors, string | RGB> = {
  primary: '#007bff',
  secondary: [108, 117, 125],
  success: 'green'
}
// ❌ palette1.primary.toUpperCase() — 报错，TS 认为可能是 string | RGB
```

```ts [satisfies 解决]
const palette2 = {
  primary: '#007bff',
  secondary: [108, 117, 125],
  success: 'green'
} satisfies Record<Colors, string | RGB>

palette2.primary.toUpperCase()     // ✅ 精确知道是 string
palette2.secondary.map(x => x.toFixed()) // ✅ 精确知道是 RGB
```
:::

### 4. keyof 与索引访问类型

```ts
interface EventPayloads {
  click: { x: number; y: number }
  hover: { element: HTMLElement }
  blur: undefined
}

// keyof — 获取所有键的联合类型
type EventType = keyof EventPayloads
// 'click' | 'hover' | 'blur'

// 索引访问类型：根据键获取对应值类型
type ClickPayload = EventPayloads['click']
// { x: number; y: number }
```

:::code-group
```ts [动态联动约束]
function triggerEvent<T extends keyof EventPayloads>(
  event: T,
  payload: EventPayloads[T]
) {
  // event 和 payload 类型自动联动
}

triggerEvent('click', { x: 10, y: 20 })  // ✅
// triggerEvent('hover', { x: 10 })      // ❌ 缺少 element
```

```ts [遍历对象键值]
type Mapped<T> = {
  [K in keyof T]: T[K] | null  // 每个属性可空
}
type NullablePayloads = Mapped<EventPayloads>
// { click: {x:number;y:number} | null; hover: {element:HTMLElement} | null; ... }
```
:::

### 5. 映射类型与 as 重映射

映射类型用于从已有类型生成新类型，`as` 子句可过滤或重命名键：

```ts
// 基础映射：所有属性变为可选
type MyPartial<T> = {
  [K in keyof T]?: T[K]
}

// as 过滤键：只要字符串类型的属性
type StringKeysOnly<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

interface Mixed {
  id: number
  name: string
  age: number
  email: string
}
type StringFields = StringKeysOnly<Mixed>
// { name: string; email: string }

// as 重命名键：全部加上前缀
type Prefixed<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}${Capitalize<K & string>}`]: T[K]
}
type PrefixedUser = Prefixed<Mixed, 'user'>
// { userId: number; userName: string; userAge: number; userEmail: string }
```

### 6. 类型谓词（is）

类型谓词用于自定义类型守卫，在条件判断后收窄类型：

```ts
interface Cat {
  meow(): void
}
interface Dog {
  bark(): void
}

// is 类型谓词 — 告诉 TS 当返回 true 时，参数是什么类型
function isCat(animal: Cat | Dog): animal is Cat {
  return (animal as Cat).meow !== undefined
}

function handleAnimal(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow() // TS 知道这里是 Cat
  } else {
    animal.bark() // TS 知道这里是 Dog
  }
}

// 常见用法：过滤数组中的空值
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
const arr = [1, null, 2, undefined, 3]
const filtered = arr.filter(isNonNullable)
// 类型为 number[]，而非 (number | null | undefined)[]
```

### 7. 辨识联合类型（Discriminated Unions）

为联合类型的每个成员添加共同的**字面量字段**，让 TS 能精确收窄类型：

```ts
// 使用 kind 字段作为辨识依据
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number }

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'rectangle':
      return shape.width * shape.height
    case 'triangle':
      return (shape.base * shape.height) / 2
  }
}

// 穷举性检查 — 如果遗漏分支，TS 会报错
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`)
}
```

### 8. as const 断言

`as const` 将值收窄为最精确的字面量类型（深层只读）：

:::code-group
```ts [数组变只读元组]
// 没有 as const：类型为 string[]
const roles1 = ['admin', 'editor', 'viewer']
// 有 as const：类型为 readonly ["admin", "editor", "viewer"]
const roles2 = ['admin', 'editor', 'viewer'] as const

// 从 as const 数组提取联合类型
type Role = (typeof roles2)[number]
// 'admin' | 'editor' | 'viewer'
```

```ts [对象变深度只读]
const config = {
  server: { host: 'localhost', port: 3000 },
  database: { name: 'mydb' }
} as const

// 类型变为：
// {
//   readonly server: { readonly host: "localhost"; readonly port: 3000 };
//   readonly database: { readonly name: "mydb" };
// }
```
:::

## 六、声明文件

声明文件（`.d.ts`）为 JavaScript 代码提供类型信息，告诉 TS 编译器已有 JS 代码的类型，而无需修改源码。

```ts
// types/global.d.ts
declare function add(a: number, b: number): number

// 声明模块
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

// 扩展全局变量
declare global {
  interface Window {
    __APP_VERSION__: string
  }
}

export { add }
```

## 小结

从基础类型标注到高级类型体操，TypeScript 的类型系统层层递进。日常开发中：

1. **基础优先**：类型注解、interface、泛型解决大部分场景
2. **善用工具**：`Partial/Pick/Omit/Record/ReturnType` 覆盖 80% 的类型操作
3. **按需深入**：`infer`、模板字符串、映射类型在组件库封装或架构设计中发力
4. **可读性第一**：过于复杂的泛型套娃（3 层以上 `infer`）建议拆解或加注释

:::info 📖 相关资源
- [TypeScript 官方文档](https://www.typescriptlang.org/zh/) - TypeScript 官方中文文档
- [TypeScript Book](https://gibbok.github.io/typescript-book/zh-cn/book/the-concise-typescript-book/) - 教程
- [B站视频教程](https://www.bilibili.com/video/BV1gX4y177Kf/) - 吴悠讲编程 TS 教程
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习
- [utility-types](https://github.com/piotrwitek/utility-types) - 社区补充的工具类型库
:::
