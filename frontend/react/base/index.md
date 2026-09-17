# React 函数式组件语法

## 概要

[React](https://zh-hans.react.dev/learn) 函数式组件是用 JavaScript 函数定义的 React 组件，接收 props 传递数据，返回 JSX 描述 UI。它语法简洁无 this 困扰，配合 useState、useEffect 等 Hooks 就能实现状态管理和副作用处理，是 React 16.8 后推荐的主流组件写法，易读易维护且性能更优。

## 一、JSX 语法规则

以下为 JSX 基础语法的详细演示，涵盖了日常开发中常用的核心语法规则及使用场景，包括标签属性处理、JavaScript 表达式嵌入、样式设置、组件使用、状态更新、动态类名、列表与条件渲染、事件绑定等关键内容。

函数中的 `this` 指向 `undefined` ，因为 babel 编译后开启了严格模式

:::code-group
```sh [npm]
npm i classnames  # 如果需要动态className
```
:::

:::code-group
```tsx [基础语法]
import { Fragment } from 'react'
const Page: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null) // 获取DOM
  console.log(inputRef.current)

  // 一个组件只能返回一个元素，使用 Fragment 或简写语法 <>...</> 将多个元素组合在一起
  return <>...</> 
  return <Fragment key={id}></Fragment>

  return (
    // 标签 class 类名不能用 class，要用 className
    <div className="uploadPage">
      {/* 标签中混入 JavaScript 表达式要用 {} */}
      <input type="text" ref={inputRef} />
      {/* 标签内联样式要用 {{}} */}
      <div style={{color: 'red', fontSize: '20px'}}></div>
      {/* 点击事件 */}
      <button onClick={handleClick}>oh</button>
      {/* 自定义组件 */}
      <MyComponent />
    </div>
  )
}

// 以大写字母开头的标签会被当成一个自定义组件。
const MyComponent = () => <div></div>
```

``` tsx [动态className]
// 如果需要动态className，那么也需要这么做
<div className={classNames('item', { active: typeId === item.id })}></div> // npm i classnames
<div className={`item ${typeId === item.id && 'active'}`}></div>
```

```jsx [条件渲染]
/** 列表渲染  */
const vdom = (
  <ul>
    {data.map((item, index) => {
      return <li key={index}>{item}</li>
    })}
  </ul>
)

/** 条件渲染 */
<div>
  { isFlag && <div>状态为真</div> }
  { !isFlag ? <div>状态为假</div> : <div>状态为真</div> }
  { /** 复杂条件渲染 */ }
  { getArticleTem() }
</div>

/** 事件绑定 */
<div>
  { /** 事件对象e和自定义形参传递 */ }
  <button onClick={ (e)=> handleClick('zeMing', e) }>点击</button>
</div>
```
:::

## 二、Props

props可以传递任意的数据：数字、字符串、布尔值、数组、对象、函数、JSX。子组件只能读取props中的数据，不能直接修改，父组件的数据只能由父组件修改。

三大属性中，只有 `props` 可以用于函数组件，因为函数可以接收参数，`state` 和 `refs` 都不能用于函数组件。

::: code-group

```jsx [父传子]
/** 父组件 */
function App() {
  return (
    <div>
      {/* 1、定义 */}
      <Person {...form} />
      <Person name={name} age={age} isTrue />

      {/* 2、插槽 - children */}
      <Person
        footer={<p>这是footer</p>} {/* 具名插槽 */}
      >
        <div>this is children</div> {/* 默认插槽 */}
      </Person>
    </div>
  )
}

/** 子组件 */
function Person({ name, age, isTrue, children, footer }) {
  return (
    <ul>
      <li>姓名：{name}</li>
      <li>年龄：{age}</li>
      {children}
      {footer}
    </ul>
  )
}
```

```jsx [子传父]
// 父组件
function App() {
  const [msg, setMsg] = useState('')
  const getMsg = (msgdata) => { setMsg(msgdata) }

  return (
    <div>
      <Son onGetSonMsg={getMsg} />
      {msg}
    </div>
  )
}

// 子组件
function Son({ onGetSonMsg }) {
  const msg = '子组件数据'
  return <button onClick={() => onGetSonMsg(msg)}>点击传递参数</button>
}
```

```jsx [兄弟组件通信]
// 父组件
function App() {
  const [name, setName] = useState('')
  const getAName = (namedata: string) => {
    setName(namedata)
  }
  return (
    <>
      this is app
      <A onGetAName={getAName} />
      <B name={name} />
    </>
  )
}

// 子组件
function A({ onGetAName }) {
  const name = 'this is A name'
  return (
    <div>
      this is A
      <button onClick={() => onGetAName(name)}>send</button>
    </div>
  )
}
function B({ name }) {
  return (
    <div>this is B {name}</div>
  )
}
```

```jsx [Context 跨层级组件通信]
const MsgContext = createContext(null)
// 父组件
function App() {
  const msg = 'this is appMsg'
  return (
    <>
      <MsgContext.Provider value={msg}>
        this is app
        <A />
      </MsgContext.Provider>
    </>
  )
}

// 子组件
function A() {
  return (
    <div> this is A
      <B />  {/* 使用B组件 */}
    </div>
  )
}
function B() {
  const msg = useContext(MsgContext)
  return <div>this is B, {msg}</div>
}
```
:::

## 三、Hooks

为了解决函数组件缺失类组件中的 state 、refs 和生命周期这些能力的问题，引入的一些特殊函数。

### 1. useState()

[useState](https://zh-hans.react.dev/reference/react/useState) 是一个 React Hook，允许向组件添加一个状态变量。

:::code-group
```jsx [useState 介绍]
/**
 * 参数：接受一个参数，这个参数是状态的初始值。这个初始值可以是任意类型，例如数字、字符串、数组、对象等。
 * 返回值：返回一个数组，数组包含两个元素
 * 
 * @params state：当前状态的值
 * @params setState：状态更新函数，接受一个新状态值作为参数，或一个返回新状态值的函数
 */
const [state, setState] = useState(initialState)
```

```jsx [使用示例]
import { useState } from 'react'

function App() {
  /** 基本类型 */
  const [count, setCount] = useState(0)
  const add = () => {setCount(count + 1)}

  /** 对象 */
  const [data, setData] = useState({ title: '默认', content: '默认' })
  const add = () => {setData({ ...data, content: '新con' })}

  /** 数组 */
  const [list, setList] = useState([
    { id: 1, name: '1'},
    { id: 2, name: '2'},
  ])
  const add = () => {setList(list.filter(i => i.id === 2))}

  /** 获取上次值 */
  const [info, setInfo] = useState({ age: 18 })
  setInfo((prevInfo) => ({
    ...prevInfo,
    age: prevInfo.age + 1 
  }))

  return (
    <div>
      <h2>当前和为：{count}</h2>
      <button onClick={add}>点击加1</button>
    </div>
  )
}
```

:::

### 2. useEffect()

[useEffect](https://zh-hans.react.dev/reference/react/useEffect) 是 React 用于处理副作用的 Hook，**能在组件渲染完成后执行异步操作、订阅事件、操作 DOM 等**（如==数据请求==、==定时器设置==、==事件监听等==）。

通过它，开发者可在函数组件中优雅地管理那些与渲染无关的“副作用”逻辑，实现类似类组件中 componentDidMount、componentDidUpdate、componentWillUnmount 的生命周期效果。

:::info useEffect 接受两个参数

- 副作用函数：一个在组件渲染后执行的函数。可返回清理函数，用于组件卸载或依赖变化时清除副作用。

- 依赖项数组（可选）：一个数组，包含影响副作用的变量。指定哪些值变化时重新执行副作用，若为空数组则仅在组件挂载和卸载时执行。
:::


**副作用函数执行的时机：**

- 不传第二个参数时：无论是组件初次挂载还是更新时，副作用函数都会执行。这个行为类似于类组件中的 `componentDidMount` 和 `componentDidUpdate` 生命周期方法的组合。

- 第二个参数为空数组时：只会在组件挂载时执行一次，并且不会在组件更新时重新执行。

- 传第二个参数且参数不为空数组时：数组中的变量发生变化时执行。

::: code-group

```jsx [不传第二个参数]
/**
 * 在这个示例中，每次 Counter 组件渲染时，useEffect 中的副作用函数都会执行一次。
 * 也就是说，每当 count 状态更新并导致组件重新渲染时，console.log 都会被调用
 */
import { useState, useEffect } from 'react'
function Counter() {
  const [count, setCount] = useState(0)
  // 没有依赖项数组
  useEffect(() => {
    console.log('副作用函数执行了')
  })

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

```jsx [第二个参数为空数组]
/**
 * 在这个示例中，数据获取操作只会在组件首次挂载时执行一次。
 * 由于依赖项数组为空，数据获取操作不会在组件更新时重新执行
 */
import { useState, useEffect } from 'react'
function DataFetcher() {
  const [data, setData] = useState(null)
  useEffect(() => {
    // 模拟数据获取
    fetch('https://api.example.com/data')
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error('Error fetching data:', error))
  }, []) // 空数组作为依赖项

  return <div>
    {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : 'Loading...'}
  </div>
}
```

```jsx [传第二个参数且参数不为空数组]
import { useState, useEffect } from 'react'
function Counter() {
  const [count, setCount] = useState(0)
  // 传递参数
  useEffect(() => {
    console.log(`Count changed: ${count}`)
  }, [count])

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

:::

**副作用函数的返回值：**

如果返回一个匿名函数，则这个函数将会在**组件卸载或在下一次副作用函数执行前执行**，相当于类组件中的 componentWillUnmount 生命周期方法。

```jsx
import { useEffect } from 'react'
function Timer() {
  useEffect(() => {
    const timerId = setInterval(() => {
      console.log('Tick')
    }, 1000)

    // 返回一个匿名函数
    return () => {
      clearInterval(timerId)
      console.log('Timer cleared') // 组件卸载时执行
    }
  }, [])

  return <div>Check the console for timer updates</div>
}
```

### 3. useRef()

[useRef](https://zh-hans.react.dev/reference/react/useRef) 是 React 提供的一个 Hook，主要用于在组件多次渲染之间保存一个可变值，其核心特点是该值的变化不会触发组件重新渲染。

它的适用场景包括：==直接访问 DOM 元素==（如获取输入框引用以调用聚焦方法）、==保存跨渲染周期的变量==（如计时器 ID、前一次状态值等），这些场景下的值变化无需引发 UI 更新，因此非常适合用 useRef 来处理。

:::code-group
```jsx [useRef 介绍]
/**
 * 其核心特点是：保存的值变化不会触发组件重新渲染，且在组件多次渲染间保持不变
 * 
 * 参数：接受一个参数，这个参数是引用的初始值。通常情况下，如果用于访问 DOM 元素，初始值可以是 null
 * 返回值：返回一个包含 current 属性的对象，初始值为 initialValue，可通过 ref.current 访问或修改存储的值
 * 
 * 注意：修改 ref.current 不会引发重渲染，这是与 useState 的核心区别
 */
const ref = useRef(initialValue)
```

```jsx [获取 DOM 元素]
import { useRef } from 'react'

export default function App() {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current.focus()
  }

  return (
    <div>
      <input type="text" ref={inputRef} />
      <button onClick={handleClick}>按钮</button>
    </div>
  )
}
```

```jsx [前一次状态值]
import { useState, useRef } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  const prevCount = useRef()

  function handleClick() {
    prevCount.current = count
    setCount(count + 1)
  }

  return (
    <div>
      <p>最新的count：{count}</p>
      <p>上次的count：{prevCount.current}</p>
      <button onClick={handleClick}>增大count</button>
    </div>
  )
}
```

```jsx [父组件调用子组件方法]
import { useRef, forwardRef, useImperativeHandle } from 'react'

const Child = forwardRef(function (props, ref) {
  useImperativeHandle(ref, () => ({
    // 暴露给父组件的方法
    myFn: () => {
      console.log('子组件myFn方法')
    }
  }))

  return ( <div>子组件</div> )
})

export default function App() {
  const childRef = useRef()

  function handleClick() {
    // 这里可以通过 childRef.current 访问 Child 组件的相关内容
    childRef.current.myFn()
  }

  return (
    <div>
      <Child ref={childRef} />
      <button onClick={handleClick}>按钮</button>
    </div>
  )
}
```
:::

### 4. useReducer()

[useReducer](https://zh-hans.react.dev/reference/react/useReducer) 是 React 中用于**状态管理的 Hook**，适用于处理复杂状态逻辑，其核心是通过一个 reducer 纯函数统一管理状态更新逻辑。

它的适用场景包括：==状态逻辑复杂==（如多个状态间存在依赖）、==状态更新操作较多==（需统一管理增删改查等行为），或是需要==通过 action 类型清晰追踪状态变化==以方便调试维护，相比 useState 更适合复杂状态逻辑的集中管理。

可以在 [这里](https://www.bilibili.com/list/watchlater?oid=577161016&bvid=BV1ZB4y1Z7o8&spm_id_from=333.1007.top_right_bar_window_view_later.content.click&p=133) 学习到 useReducer。

::: details 使用方法
```tsx
const reducer = (state, action) => {
  switch (action.type) {
    case 'INC':
      return state + 1
    case 'DEC':
      return state - 1
    case 'SET':
      return action.payload
    default:
      return state
  }
}
function App() {
  const [state, dispatch] = useReducer(reducer, 0)
  return (
    <div>
      this is app
      <button onClick={() => dispatch({ type: 'DEC' })}>-</button>
      {state}
      <button onClick={() => dispatch({ type: 'INC' })}>+</button>
      <button onClick={() => dispatch({ type: 'SET', payload: 10 })}>update</button>
    </div>
  )
}

export default App
```

:::

### 5. useMemo()
[useMemo](https://zh-hans.react.dev/reference/react/useMemo) 是 React 提供的用于**性能优化的 Hook**，主要用于缓存计算结果，避免在组件重新渲染时重复执行耗时的计算逻辑。**React组件默认的渲染机制：只要父组件重新渲染子组件就会重新渲染。**

它的适用场景包括：useMemo 可以有效减少不必要的计算开销，提升组件性能，尤其适合==处理大数据过滤==、==复杂数据转换==等场景。

:::code-group
```tsx [useMemo 介绍]
/**
 * 参数:
 * 第一个是需要缓存结果的计算函数（返回计算结果）
 * 第二个是依赖数组（指定哪些值变化时重新执行计算函数）
 * 
 * 当依赖数组中的值未发生变化时，useMemo 会直接返回之前缓存的结果，
 * 只有当依赖项发生改变时，才会重新执行计算函数并更新缓存。
 */

const cachedValue = useMemo(calculateValue, dependencies)
```

```tsx [useMemo 缓存计算结果]
import { useMemo, useState } from 'react'
function DoSomeMath({ value }) {
  // 使用 useMemo 缓存计算结果
  const result = useMemo(() => {
    console.log('DoSomeMath执行了')
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += value * 2
    }
    return result
  }, [value])  // 只有 value 变化时才重新计算

  return (
    <div>
      <p>输入内容：{value}</p>
      <p>经过复杂计算的数据：{result}</p>
    </div>
  )
}

function App() {
  const [count, setCount] = useState(0)
  const [inputValue, setInputValue] = useState('')

  return (
    <div >
      <button onClick={() => setCount(count + 1)}>
        点击次数: {count}
      </button>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="输入数字进行计算"
      />
      
      <DoSomeMath value={inputValue} />
    </div>
  )
}

export default App
```

```tsx [memo 缓存组件渲染结果]
// memo 进行缓存，只有props发生变化的时候才会重新渲染
const MemoSon = memo(function Son() {
  return <div>this is Son</div>
})

function App() {
  const [count, setCount] = useState(0)
  return (
    <div>
      this is app
      <button onClick={() => setCount(count + 1)}>+{count}</button>
      <MemoSon />
    </div>
  )
}
export default App
```

```tsx [props比较机制说明]
// 机制：在使用memo缓存组件之后，React会对每一个prop使用Object.is比较新值和老值，返回true，表示没有变化

// 如果prop是简单类型
// Object.is(3,3) true 没有变化

// 如果prop是引用类型（对象/数组）
// Object.is([],[]) false 有变化，React只关心引用是否变化

// 如果想实现被缓存效果，可以使用useMemo
const list = useMemo(() => {
  return [1, 2, 3]
}, [])
```
:::

**memo：**

[memo](https://zh-hans.react.dev/reference/react/memo) 是 React 提供的一个高阶组件（HOC），用于性能优化，主要作用是缓存组件渲染结果，避免不必要的重新渲染。当使用 memo 包装组件时，React 会对组件的 props 进行浅比较： 如果 props 没有变化，就直接使用缓存的组件渲染结果；如果 props 发生变化，才会重新渲染组件。**简单说，memo 可以让组件在 props 不变的情况下跳过重新渲染，从而提升应用性能。**


它的适用场景包括：==组件接收的 props 变化不频繁==、==组件渲染开销较大==（如复杂计算、大量 DOM 元素）、==列表渲染中的子组件==（避免因父组件重新渲染而全部重新渲染）

:::tip useMemo 与 memo 区别
- memo 缓存的是整个组件的渲染结果
- useMemo 缓存的是计算结果
:::

### 6. useCallback()

[useCallback](https://zh-hans.react.dev/reference/react/useCallback) 是 React 提供的用于**性能优化**的 Hook，主要用于**缓存函数引用**，避免在组件重新渲染时创建新的函数实例。可以在 [这里](https://www.bilibili.com/video/BV1ZB4y1Z7o8?spm_id_from=333.788.player.switch&vd_source=636e79898d369bbe2acb20cb13cd6463&p=137) 学习到。

它接收两个参数：第一个是需要缓存的函数，第二个是依赖数组（指定哪些值变化时重新创建函数）。当依赖数组中的值未发生变化时，useCallback 会返回之前缓存的函数引用，只有当依赖项发生改变时，才会创建新的函数并更新缓存。

它的适用场景包括：useCallback 可以配合 memo 等高阶组件使用，避免因函数引用变化导致的不必要组件重新渲染，尤其适合==向子组件传递回调函数的场景==。useCallback。

:::code-group
```tsx [useCallback 使用]
import { useState, useCallback, memo } from 'react'
// 使用 memo 包装子组件，避免不必要的重渲染
const ChildComponent = memo(function ChildComponent({ onClick, name }) {
  console.log('ChildComponent 渲染了')
  return (
    <div>
      <p>子组件: {name}</p>
      <button onClick={onClick}>点击我</button>
    </div>
  )
})

function ParentComponent() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('张三')

  // 使用 useCallback 缓存函数引用
  const handleClick = useCallback(() => {
    console.log('点击了子组件按钮', name)
  }, [name]) // 只有 name 变化时才会重新创建函数

  return (
    <div>
      <p>父组件计数: {count}</p>
      <button onClick={() => setCount(count+1)}>增加计数 (不影响子组件)</button>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="修改子组件名称"
      />
      
      {/* 传递缓存的函数给子组件 */}
      <ChildComponent onClick={handleClick} name={name} />
    </div>
  )
}

export default ParentComponent
```
:::

### 7. forwardRef()

[forwardRef](https://zh-hans.react.dev/reference/react/forwardRef) 允许组件使用 ref 将 DOM 节点暴露给父组件。

::: details forwardRef使用方法

```tsx
// 子组件
const MyInput = forwardRef((props, ref) => {
  return <input type="text" ref={ref} />
})

// 父组件
const App() {
  const inputRef = useRef(null)
  return (
    <>
      <MyInput ref={inputRef} />
    </>
  )
}
```

:::

### 8. useImperativeHandle()
[useImperativeHandle](https://zh-hans.react.dev/reference/react/useImperativeHandle) 是 React 中的一个 Hook，它能让你自定义由 ref 暴露出来的句柄。


## 小结

函数式组件是 React 16.8+ 推荐的主流写法，核心优势在于：==无 this 困扰==、==语法简洁==、==Hooks 能力强大==。JSX 语法规则（`className`、`style={{}}`、Fragment）、Props 组件通信（父传子、子传父、兄弟通信、Context 跨层级）、以及 useState/useEffect/useRef/useMemo/useCallback/useReducer 等 Hooks 构成了日常开发的核心工具链。`memo` + `useCallback` + `useMemo` 组合是性能优化的标准模式。

::: info 📖 相关资源
- [React 官方文档](https://zh-hans.react.dev/learn) - React 入门与进阶
- [B站视频教程](https://www.bilibili.com/video/BV1kc411D7F9) - 吴悠讲编程
- [React 教程文档](https://message163.github.io/react-docs/) - 小满的 React 教程
:::