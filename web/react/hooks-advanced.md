# React Hooks 深入

## 概要

React 18+ 引入了一批新的 Hooks，用于解决并发渲染、性能优化、外部状态订阅等场景。本文覆盖 useTransition、useDeferredValue、useSyncExternalStore、useId 等进阶 Hook 的用法和场景。

## 一、useTransition — 非紧急更新

`useTransition` 将状态更新标记为**非紧急**，让 React 优先处理用户交互，延迟渲染耗时更新。

```tsx
import { useState, useTransition } from 'react'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // 紧急更新：输入框立即响应
    setQuery(value)
    
    // 非紧急更新：搜索结果可以被中断
    startTransition(() => {
      // 模拟耗时搜索
      const filtered = heavyFilter(largeList, value)
      setResults(filtered)
    })
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {/* 搜索过程中显示旧结果 + 淡出效果 */}
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        {results.map(r => <div key={r}>{r}</div>)}
      </div>
    </div>
  )
}
```

### 1. 使用场景

| 场景 | 说明 |
| --- | --- |
| **搜索过滤** | 输入保持流畅，过滤结果延迟更新 |
| **Tab 切换** | Tab 标签立即切换，内容面板允许延迟 |
| **路由导航** | 菜单高亮立即响应，页面内容异步渲染 |
| **大数据列表渲染** | 用户操作不被列表更新阻塞 |

### 2. useTransition vs 普通防抖

```tsx
// ❌ 防抖：用户始终要等 300ms，无论设备多快
const debouncedSearch = useMemo(
  () => debounce((v) => setResults(filter(v)), 300),
  []
)

// ✅ useTransition：快设备立即响应，慢设备自动让步
const [isPending, startTransition] = useTransition()
const handleChange = (v) => {
  setQuery(v)  // 立即
  startTransition(() => setResults(filter(v)))
}
```

## 二、useDeferredValue — 延迟值

`useDeferredValue` 类似 `useTransition`，但它不是标记更新函数，而是标记一个**值**为低优先级。

```tsx
import { useState, useDeferredValue, useMemo } from 'react'

function ProductList() {
  const [keyword, setKeyword] = useState('')
  // 延迟 keyword，让输入先响应
  const deferredKeyword = useDeferredValue(keyword)

  // 这个列表只在 deferredKeyword 变化时重新计算
  const filtered = useMemo(() => {
    return heavyFilter(allProducts, deferredKeyword)
  }, [deferredKeyword])

  return (
    <>
      <input
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
      />
      {/* 延迟渲染列表，保持输入响应 */}
      <SlowList data={filtered} />
    </>
  )
}
```

### 1. useTransition vs useDeferredValue

| 特性 | useTransition | useDeferredValue |
| --- | --- | --- |
| 控制对象 | 状态**更新函数** | 状态**值** |
| 适用场景 | 你能控制 setState 的地方 | props/值来自外部（如父组件或第三方库） |
| 返回值 | `[isPending, startTransition]` | 延迟后的值 |
| 使用时机 | 你在组件内触发更新 | 你接收一个值，想让它的变化降级 |

## 三、useSyncExternalStore — 订阅外部状态

从 React 18 开始，这是**订阅外部可变数据源的官方方式**。常用于集成 Redux、Zustand 等外部状态库。

```tsx
import { useSyncExternalStore } from 'react'

// 1. 定义外部 store
const store = {
  state: { count: 0 },
  listeners: new Set<() => void>(),
  
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  },
  
  setState(newState: typeof store.state) {
    this.state = newState
    this.listeners.forEach(l => l())
  },
  
  getSnapshot() {
    return this.state
  },
}

// 2. 封装 Hook
function useStore<T>(selector: (state: typeof store.state) => T): T {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    () => selector(store.getSnapshot()),
  )
}

// 3. 组件中使用
function Counter() {
  const count = useStore(state => state.count)
  return <button onClick={() => {
    store.setState({ count: store.state.count + 1 })
  }}>Count: {count}</button>
}
```

### 1. 与第三方库的关系

```tsx
// Zustand 内部就是用 useSyncExternalStore 实现的
import { create } from 'zustand'

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}))
// ↑ zustand 的 create 内部调用了 useSyncExternalStore
```

## 四、useId — 生成唯一 ID

React 18 引入的 `useId` 用于在客户端和服务端生成**稳定且唯一**的 ID，避免 SSR 水合不匹配。

```tsx
import { useId } from 'react'

function FormField({ label }: { label: string }) {
  const id = useId()
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  )
}

// 多个实例渲染：
// <FormField label="姓名" />
// <FormField label="邮箱" />
// → 生成 id: ":r1:", ":r2:" (稳定且递增)
```

```tsx
// ❌ 不要用 Math.random() 生成 ID
const id = `input-${Math.random()}` // SSR 水合时客户端和服务端不一致

// ✅ 用 useId
const id = useId()  // SSR 安全

// ✅ 手动指定前缀仍然安全
const id = useId() + '-error'
```

## 五、useDebugValue — 调试标签

在 React DevTools 中为自定义 Hook 添加标签。

```tsx
import { useDebugValue, useState } from 'react'

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // DevTools 中会显示: "Online: true" 或 "Online: false"
  useDebugValue(isOnline ? 'Online' : 'Offline')
  
  return isOnline
}

// 格式化标签（仅在 DevTools 打开时调用，不影响性能）
function useUser(userId: string) {
  const user = fetchUser(userId)
  useDebugValue(user, (u) => u?.name ?? 'Loading...')
  return user
}
```

## 六、useImperativeHandle — 命令式暴露句柄

`useImperativeHandle` 让你自定义父组件通过 ref 能访问到的方法和属性，而不是暴露整个 DOM 节点。

```tsx
import { forwardRef, useRef, useImperativeHandle } from 'react'

// 定义暴露的接口
interface InputHandle {
  focus: () => void
  clear: () => void
  getValue: () => string
}

const CustomInput = forwardRef<InputHandle, { placeholder?: string }>(
  (props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus() {
        inputRef.current?.focus()
      },
      clear() {
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      },
      getValue() {
        return inputRef.current?.value ?? ''
      },
    }))

    return <input ref={inputRef} placeholder={props.placeholder} />
  }
)

// 父组件使用
function Parent() {
  const inputRef = useRef<InputHandle>(null)

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="输入内容" />
      <button onClick={() => inputRef.current?.focus()}>聚焦</button>
      <button onClick={() => inputRef.current?.clear()}>清空</button>
      <button onClick={() => console.log(inputRef.current?.getValue())}>
        获取值
      </button>
    </div>
  )
}
```

### 1. 常见使用场景

| 场景 | 说明 |
| --- | --- |
| **表单组件封装** | 暴露 `focus`、`clear`、`validate` 等方法 |
| **模态框** | 暴露 `open`、`close`、`toggle` |
| **音频/视频播放器** | 暴露 `play`、`pause`、`seek` |
| **滚动容器** | 暴露 `scrollToTop`、`scrollToBottom` |

## 七、useLayoutEffect — 同步副作用

`useLayoutEffect` 与 `useEffect` 签名相同，但它在 **DOM 变更后、浏览器绘制前**同步执行。用于需要读取/修改 DOM 布局，且不希望用户看到闪烁的场景。

```tsx
import { useState, useLayoutEffect, useRef } from 'react'

function Tooltip({ text }: { text: string }) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    // 在浏览器绘制前计算并调整位置
    const rect = tooltipRef.current!.getBoundingClientRect()
    
    if (rect.right > window.innerWidth) {
      setPosition(prev => ({
        ...prev,
        x: prev.x - (rect.right - window.innerWidth) - 10
      }))
    }
    // ✅ 用户永远不会看到 tooltip 在错误位置闪烁
  }, [text])

  return (
    <div ref={tooltipRef} style={{
      position: 'fixed',
      left: position.x,
      top: position.y,
    }}>
      {text}
    </div>
  )
}
```

### 1. useEffect vs useLayoutEffect 对比

| | useEffect | useLayoutEffect |
| --- | --- | --- |
| 执行时机 | 浏览器**绘制之后** | DOM 更新**之后**、浏览器**绘制之前** |
| 是否阻塞渲染 | ❌ 不阻塞 | ✅ 阻塞 |
| 默认选择 | ✅ **首选** | 仅在需要测量/修改 DOM 时用 |
| 适用场景 | 数据请求、订阅、日志 | 计算布局位置、滚动位置、动画初始状态 |

::: warning 使用准则
**99% 的场景用 `useEffect`**，只有当用户能看到视觉闪烁时才用 `useLayoutEffect`。`useLayoutEffect` 会阻塞浏览器绘制，过度使用会降低性能。
:::

## 八、Hooks 使用规则总结

```tsx
// ✅ 只在组件顶层调用（不在条件/循环/return 之后）
function MyComponent() {
  const [a, setA] = useState(0)     // ✅ 顶层
  useEffect(() => {}, [])            // ✅ 顶层
  
  if (a > 0) {
    // const [b, setB] = useState(0)   // ❌ 条件内
  }
}

// ✅ 只在 React 函数组件或自定义 Hook 中调用
function useMyHook() {
  const [state, setState] = useState(0)  // ✅ 自定义 Hook 中
  return state
}

// ✅ 自定义 Hook 以 use 开头
// ✅ ESLint 插件: eslint-plugin-react-hooks
```

```bash
npm i -D eslint-plugin-react-hooks
```

```json
// .eslintrc.json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## 小结

React 18+ 的进阶 Hooks 围绕 ==并发渲染== 展开：`useTransition` 和 `useDeferredValue` 区分紧急/非紧急更新以保持交互流畅，`useSyncExternalStore` 提供官方的外部状态订阅方式，`useId` 保证 SSR 安全的唯一 ID。`useLayoutEffect` 仅在需要避免视觉闪烁时使用（99% 场景用 `useEffect` 即可），`useImperativeHandle` 用于精细化控制子组件的 ref 暴露。记住 Hooks 的铁律：**只在组件顶层调用，只在 React 函数中调用**。

::: info 📖 相关资源
- [React 官方文档 - Hooks](https://zh-hans.react.dev/reference/react/hooks)
- [useTransition](https://zh-hans.react.dev/reference/react/useTransition)
- [useSyncExternalStore](https://zh-hans.react.dev/reference/react/useSyncExternalStore)
:::
