# React 类组件语法

## 概要

React 类组件是通过 ES6 类定义的组件，需继承 React.Component，通过 this.props 接收数据，this.state 管理状态，依赖生命周期方法（如 componentDidMount）处理副作用，返回 JSX 描述 UI。它有明确的实例化过程，需处理 this 绑定问题，在 Hooks 出现前是实现复杂逻辑的主要方式，目前逐渐被函数式组件替代。

## 一、定义

```jsx
class MyComponent extends React.Component {
  render() {
    return <h2>我是用类定义的组件</h2>
  }
}
```

- 类组件必须继承 React 内置的 `React.Component` 类。
- 在类组件中，JSX 代码必须写在 `render` 方法中，并且 `render` 方法必须有返回值。
- `render` 方法被定义在类的原型对象上，因此可以供实例使用。
- `render` 方法中的 this 指向由类(new)创建的实例。

通过这些规则，可以正确地定义和使用类组件，提高组件的可维护性和可读性。

## 二、实例的三大属性

- **state**

组件的状态，类似于 vue 中的响应式数据。

```jsx
class MyComponent extends React.Component {
  // 通常，在 React 中构造函数仅用于两个目的：
  // 1、通过将对象分配给来初始化本地状态this.state。
  // 2、将事件处理程序方法绑定到实例。
  constructor(props) {
    super(props)
    // 初始化 state
    this.state = { isHot: false, wind:'微风'}
    // 改变事件处理函数中的this指向
    // this.click = this.handleClick.bind(this)
  }

  render() {
    // 读取state 中的值
    const { isHot，wind} = this.state
    // 原生JS中的 onclick 事件，在 react 中要写成 onClick，其他同理
    return (
      <div>
        <h2>今天天气很{ isHot ? '炎热': '凉爽'}</h2>
        <h2>{ wind }</h2>
        <button onClick={this.handleClick}>更改</button>
      </div>
    )
  }

  // ！！！注意：此处必须要用箭头函数，否则会改变this的指向
  handleClick = () => {
    // 状态必须通过 setState 以对象的形式进行更新，且更新是一种合并，不是替换
    const { wind } = this.state
    // setState 是同步的，但数据更新是异步的，只能在回调中拿到更新后的数据
    this.setState({ wind: '斜阳'}, ()=> {
      console.log(this.state.wind)
    })
    // 函数式的 setState，新的数据依赖于原数据
    this.setState(state => ({ count: state.wind + '斜阳'}))
  }

  // 若不使用箭头函数，可以在 constructor 中用 bind 重新指回 this
  handleClick() => {
    // 更新state中的值
    const { wind } = this.state
    this.setState({ wind: '斜阳'})
  }
}
```

- **props**

通过标签属性从组件外向组件内传递变化的数据

```jsx
// 直接传值
<Person name="李华" age={18} sex="男" />

// 或批量传值
const obj = { name: "李华", age: 18, sex: "男"}
<Person {...obj} />

class Person extends React.Component {
  // 可省略
  constructor(props) {
    super(props)
  }

  render() {
    const { name, age, sex } = this.props
    return(
      <ul>
        <li>{ name }</li>
      </ul>
    )
  }
}
```

- 组件标签的所有属性都以 { key: value } 的形式保存在`props`中

- 单向数据流，组件内部不要修改`props`数据

- 限制 props（需要引入 prop-types 库）

::: code-group

```jsx [写在类外面]
// 指定数据类型
Person.propTypes = {
  name: PropTypes.string.isRequired, //限制name必传，且为字符串
  sex: PropTypes.string, //限制sex为字符串
  age: PropTypes.number, //限制age为数值
  speak: PropTypes.func, //限制speak为函数
}
// 指定默认值
Person.defaultProps = {
  sex: '男', //sex默认值为男
  age: 18, //age默认值为18
}

class Person extends React.Component {
  // 可省略
  constructor(props) {
    super(props)
  }

  render() {
    const { name, age, sex } = this.props
    return (
      <ul>
        <li>{name}</li>
        <li>{age}</li>
      </ul>
    )
  }
}
```

```jsx [写在类里面]
class Person extends React.Component {
  // 可省略
  constructor(props) {
    super(props)
  }

  // 指定数据类型
  static propTypes = {
    name: PropTypes.string.isRequired, //限制name必传，且为字符串
    sex: PropTypes.string, //限制sex为字符串
    age: PropTypes.number, //限制age为数值
  }

  // 指定默认值
  static defaultProps = {
    sex: '男', //sex默认值为男
    age: 18, //age默认值为18
  }

  render() {
    const { name, age, sex } = this.props
    return (
      <ul>
        <li>{name}</li>
        <li>{age}</li>
      </ul>
    )
  }
}
```

:::

- **refs**

组件内的标签可以定义`ref`属性来标识自己（类似于 id）

::: code-group

```jsx [推荐使用 createRef]
class Demo extends React.Component {
  myRef1 = React.createRef()
  myRef2 = React.createRef()

  render() {
    return (
      <div>
        <input ref={myRef1} type="text" />
        <input ref={myRef2} type="text" />
        <button onClick={this.handleClick}>点击</button>
      </div>
    )
  }

  handleClick = () => {
    console.log(this.myRef1.current.value)
  }
}
```

```jsx [字符串形式的 ref 不推荐使用]
class Demo extends React.Component {
  render() {
    return (
      <div>
        <input ref="input1" type="text" />
        <input ref="input2" type="text" />
        <button onClick={this.handleClick}>点击</button>
      </div>
    )
  }

  handleClick = () => {
    // refs 是一个数组，他收集了组件内的所有 ref。这里的 input1
    const { input1, input2 } = this.refs
  }
}
```

:::

**`React.createRef` 调用后可以返回一个容器，该容器可以存储被 `ref` 所标识的节点**

## 三、受控组件与非受控组件

页面中所有的输入类 DOM 有两种管理方式：

::: code-group
```jsx [非受控组件 — 通过 ref 现用现取]
class Login extends React.Component {
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        用户名：
        <input ref={(c) => (this.username = c)} type="text" name="username" />
        密码：
        <input ref={(c) => (this.password = c)} type="password" name="password" />
        <button>登录</button>
      </form>
    )
  }

  handleSubmit = (event) => {
    event.preventDefault() //阻止表单提交
    const { username, password } = this
    alert(`你输入的用户名是：${username.value},你输入的密码是：${password.value}`)
  }
}
```

```jsx [受控组件 — 通过 state 管理]
class Login extends React.Component {
  //初始化状态
  state = {
    username: '', //用户名
    password: '', //密码
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        用户名：
        <input onChange={this.saveUsername} type="text" name="username" />
        密码：
        <input onChange={this.savePassword} type="password" name="password" />
        <button>登录</button>
      </form>
    )
  }

  // 保存用户名到状态中
  saveUsername = (event) => {
    this.setState({ username: event.target.value })
  }

  // 保存密码到状态中
  savePassword = (event) => {
    this.setState({ password: event.target.value })
  }

  // 表单提交的回调
  handleSubmit = (event) => {
    event.preventDefault() //阻止表单提交
    const { username, password } = this.state
    alert(`你输入的用户名是：${username},你输入的密码是：${password}`)
  }
}
```
:::

- **使用函数柯里化优化受控组件**

函数的柯里化：通过函数调用继续返回函数的方式，实现多次接收参数最后统一处理的函数编码形式

```js
function sum(a) {
  return (b) => {
    return (c) => {
      return a + b + c
    }
  }
}
```

利用函数柯里化优化 saveUserName 和 savePassword

```jsx
class Login extends React.Component {
  //初始化状态
  state = {
    username: '', //用户名
    password: '', //密码
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        用户名：
        <input onChange={this.saveFormData('username')} type="text" name="username" />
        密码：
        <input onChange={this.saveFormData('password')} type="password" name="password" />
        <button>登录</button>
      </form>
    )
  }

  // 保存表单数据到状态中（函数的柯里化）
  saveFormData = (dataType) => {
    // onChange 接受的是 saveFormData 返回的箭头函数，刚好符合事件处理的回调函数
    return (event) => {
      this.setState({ [dataType]: event.target.value })
    }
  }

  // 表单提交的回调
  handleSubmit = (event) => {
    event.preventDefault() //阻止表单提交
    const { username, password } = this.state
    alert(`你输入的用户名是：${username},你输入的密码是：${password}`)
  }
}
```

- **不使用函数柯里化优化受控组件**

```jsx
saveFormData = (dataType,event)=>{
  this.setState({[dataType]:event.target.value})
}

用户名：<input onChange={event => this.saveFormData('username',event) } type="text" name="username"/>

```

## 四、生命周期

生命周期大致可划分为三个阶段：

**1. 挂载**：创建组件实例并将其插入到 DOM 中

**2. 更新**：props 或 state 的改变引起组件重新渲染

**3. 卸载**：组件从 DOM 中移除

```jsx
class Life extends React.component {
  // 初始化
  constructor() {
    console.log('1-1')
  }

  // 挂载
  render() {
    console.log('1-2')
  }

  // 挂载完成
  componentDidMount() {
    console.log('1-3')
  }

  // 更新前
  shouldComponentUpdate() {
    console.log('2-1')
  }

  // 更新完成
  componentDidUpdate() {
    console.log('2-2')
  }

  // 卸载前
  componentWillUnmount() {
    console.log('3-1')
  }
}
```

生命周期图

![](/img/react-lifecycle.png)

## 小结

类组件是 React 早期的核心组件形式，通过 ==state==、==props==、==refs== 三大实例属性管理数据和交互，依赖生命周期方法处理副作用。虽然 Hooks 出现后函数式组件成为主流，但理解类组件对于维护老项目和错误边界（必须用类组件实现）仍然必要。对于新项目，推荐使用函数式组件 + Hooks 的方式开发。

::: info 📖 相关资源
- [React 类组件文档](https://zh-hans.react.dev/reference/react/Component) - 官方类组件 API 参考
- [React 函数式组件](https://zh-hans.react.dev/learn) - 推荐的新组件写法
:::
