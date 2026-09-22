# React 18/19 新特性

## 概要

React 18 引入了并发渲染（Concurrent Features），React 19 进一步简化了开发体验。本文梳理从 React 18 到 19 的关键新特性和迁移要点。

## 一、React 18 核心特性

### 1. Concurrent Rendering（并发渲染）

并发渲染是 React 18 的底层架构升级，使 React 可以**中断**和**恢复**渲染任务：

```tsx
// React 18 以前的同步渲染
// ──[紧急更新]────────────────────[非紧急更新]──→ 卡顿！
//   ↑ 用户点击               ↑ 被阻塞，用户感知延迟

// React 18 并发渲染
// ──[紧急更新]──[紧急]──[紧急]────────[非紧急更新完成]──→ 流畅！
//   ↑ 用户点击  ↑ React 随时中断非紧急渲染来处理交互
```

### 2. createRoot API

```tsx
// ❌ React 17
import ReactDOM from 'react-dom'
ReactDOM.render(<App />, document.getElementById('root'))

// ✅ React 18
import { createRoot } from 'react-dom/client'
const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

### 3. Automatic Batching（自动批处理）

React 18 中所有状态更新**自动批处理**（包括 setTimeout、Promise、原生事件中的更新）。

```tsx
// React 17: 只在 React 事件处理器中批处理
setTimeout(() => {
  setCount(c => c + 1)  // 触发重渲染
  setFlag(f => !f)      // 再次触发重渲染 → 两次渲染！
}, 1000)

// React 18: 处处自动批处理
setTimeout(() => {
  setCount(c => c + 1)  // } 一次重渲染
  setFlag(f => !f)      // }
}, 1000)

// 如果确实需要同步更新（退出批处理）
import { flushSync } from 'react-dom'

flushSync(() => {
  setCount(c => c + 1)  // 立即渲染
})
// DOM 此时已更新
```

### 4. Suspense 增强

```tsx
// 数据获取 + Suspense（配合 React Query / SWR）
import { Suspense } from 'react'

function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileDetails />
      <Suspense fallback={<PostsSkeleton />}>
        <ProfilePosts />
      </Suspense>
    </Suspense>
  )
}

// Transition + Suspense：避免路由切换时出现 fallback
function App() {
  const [tab, setTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const switchTab = (nextTab: string) => {
    startTransition(() => setTab(nextTab))
  }

  return (
    <div>
      <TabBar onSwitch={switchTab} />
      {/* isPending 为 true 时保留旧内容，避免闪烁 */}
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <Suspense fallback={<Spinner />}>
          <TabContent tab={tab} />
        </Suspense>
      </div>
    </div>
  )
}
```

## 二、React 19 新特性

React 19 (2024.12 发布) 聚焦于**简化开发体验**。

### 1. Actions（表单处理革命）

React 19 将表单处理提升为**一等公民**，引入 `useActionState`、`useFormStatus`、`useOptimistic`。

```tsx
'use client'
import { useActionState } from 'react'
import { updateProfile } from './actions'

function EditProfile() {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    { error: null, success: false }
  )

  return (
    <form action={formAction}>
      <input name="name" defaultValue={state.name} />
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">更新成功</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
    </form>
  )
}
```

### 2. useOptimistic（乐观更新）

```tsx
import { useOptimistic } from 'react'

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  async function handleAdd(formData: FormData) {
    const title = formData.get('title') as string
    // 1. 立即更新 UI（乐观更新）
    addOptimistic({ id: Date.now(), title, completed: false })
    // 2. 发送请求
    await addTodo(title)
    // 如果失败，React 会自动回滚到 todos 的值
  }

  return (
    <>
      <form action={handleAdd}>
        <input name="title" />
      </form>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}
```

### 3. Server Components（稳定）

React 19 中 Server Components 正式稳定，可以直接在 React 服务端渲染中使用：

```tsx
// UserList.tsx — Server Component（默认）
// ✅ 可以直接访问数据库、文件系统
// ✅ 不会有 JS 发送到客户端
async function UserList() {
  const users = await db.user.findMany()

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          {/* 客户端交互组件 */}
          <FollowButton userId={user.id} />
        </li>
      ))}
    </ul>
  )
}
```

### 4. use() API — 在渲染中读取异步数据

```tsx
import { use, Suspense } from 'react'

// 直接 use promise，无需 useEffect + useState
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)  // 读取 promise 的值

  return <div>{user.name}</div>
}

// 也支持 Context
function ThemeText() {
  const theme = use(ThemeContext)  // 替代 useContext
  return <div className={theme}>文本</div>
}
```

### 5. ref 作为 prop

React 19 中，`ref` 可以直接作为 prop 传递，不再需要 `forwardRef`。

```tsx
// ✅ React 19 — ref 就是普通 prop
function MyInput({ ref, placeholder }: { ref: React.Ref<HTMLInputElement>, placeholder: string }) {
  return <input ref={ref} placeholder={placeholder} />
}

// 父组件直接传 ref
function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)
  return <MyInput ref={inputRef} placeholder="输入内容" />
}

// ❌ React 18 — 必须用 forwardRef
const MyInput = forwardRef<HTMLInputElement, { placeholder: string }>(
  (props, ref) => <input ref={ref} {...props} />
)
```

### 6. 服务端渲染增强

```tsx
// ❌ 不再需要这些 API
import { renderToStaticMarkup } from 'react-dom/server'

// ✅ React 19 新增
import { renderToPipeableStream, renderToReadableStream } from 'react-dom/server'
```

### 7. Context 简化

```tsx
// React 19: <Context> 直接替代 <Context.Provider>
const ThemeContext = createContext('light')

// ✅ 新写法
function App() {
  return (
    <ThemeContext value="dark">
      <Content />
    </ThemeContext>
  )
}

// ❌ 旧写法仍兼容
<ThemeContext.Provider value="dark">
```

### 8. Document Metadata 内置支持

```tsx
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      {/* React 19 原生支持 title/meta/link 标签 */}
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <link rel="canonical" href={`https://mysite.com/posts/${post.slug}`} />
      
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

## 三、迁移清单

### 1. React 17 → 18

- [ ] 将 `ReactDOM.render` 替换为 `createRoot().render()`
- [ ] 移除旧的生命周期 (`componentWillMount`、`componentWillReceiveProps`、`componentWillUpdate`)
- [ ] 检查依赖库是否兼容 React 18（如 antd 4.x → 5.x）
- [ ] 启用 StrictMode 检查并发问题

### 2. React 18 → 19

- [ ] 移除 `forwardRef`（改为普通的 `ref` prop）
- [ ] `<Context.Provider>` → `<Context>`
- [ ] 升级 `@types/react` 和 `@types/react-dom`
- [ ] 尝试 `useActionState` / `useOptimistic` 替代手写的表单状态管理
- [ ] 移除废弃的 API（`unstable_` 前缀的方法）

## 四、快速升级命令

```bash
# React 18
npm i react@18 react-dom@18 @types/react@18 @types/react-dom@18

# React 19
npm i react@latest react-dom@latest @types/react@latest @types/react-dom@latest
```

::: warning 版本兼容注意
- React 19 要求 TypeScript 5.x+
- Next.js 15+ 已内置 React 19
- 部分第三方库可能需要等待更新才能兼容 React 19
:::

## 小结

React 18 的核心升级是 ==并发渲染==（Concurrent Rendering），让 React 可以中断和恢复渲染任务，配合 `useTransition`、`Suspense` 实现流畅的用户体验。React 19 聚焦于**简化开发**：`Actions` 系列 Hook 革命性简化表单处理，`ref` 作为普通 prop 传递告别 `forwardRef`，Server Components 正式稳定，`use()` API 让异步数据读取更加直观。升级时注意 TypeScript 版本和第三方库兼容性。

::: info 📖 参考
- [React 18 更新日志](https://zh-hans.react.dev/blog/2022/03/29/react-v18)
- [React 19 更新日志](https://zh-hans.react.dev/blog/2024/12/05/react-19)
- [React 19 升级指南](https://zh-hans.react.dev/blog/2024/04/25/react-19-upgrade-guide)
:::
