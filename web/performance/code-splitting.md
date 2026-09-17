# 代码分割与懒加载

## 概要

代码分割（Code Splitting）是将应用代码拆分成多个较小的包（chunk），按需加载，而不是一次性将所有 JS 加载到浏览器中。这是优化首屏加载速度最有效的手段之一。

## 一、为什么要代码分割

```
不做分割：        bundle.js (2MB)  →  用户等 3 秒
                ↓
做分割后：        main.js (200KB) →  首屏 0.5 秒
                page-a.js (600KB) → 切换到页面A时加载
                page-b.js (800KB) → 切换到页面B时加载
                lib.js (400KB)    → 按需加载
```

### 1. 核心收益

| 收益 | 说明 |
| --- | --- |
| **更快的首屏** | 初始只加载必需代码 |
| **更低的带宽消耗** | 用户不需要的代码不会被下载 |
| **更好的缓存利用率** | vendor chunk 变化频率低，缓存命中率高 |

## 二、Vite / Webpack 自动分割

### 1. Vite（基于 Rollup）

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 手动控制 chunk 分割
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['antd', '@ant-design/icons'],
          'utils': ['lodash', 'dayjs'],
        },
      },
    },
    // 设置 chunk 大小警告阈值（默认 500KB）
    chunkSizeWarningLimit: 500,
  },
})
```

### 2. 路由级别的自然分割

Vite 默认会对动态 import 自动分割：

```ts
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    // Vite 会自动将此页面打包为独立 chunk
    component: () => import('@/pages/Dashboard.vue'),
  },
  {
    path: '/settings',
    component: () => import('@/pages/Settings.vue'),
  },
]
```

## 三、React 中的代码分割

### 1. React.lazy + Suspense

```tsx
import { lazy, Suspense } from 'react'

// 懒加载组件
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const HeavyChart = lazy(() => import('./components/HeavyChart'))

function App() {
  return (
    <Suspense fallback={<div className="skeleton">加载中...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      
      {/* 非首屏的重组件也用 Suspense 包裹 */}
      <Suspense fallback={<Spin />}>
        <HeavyChart data={data} />
      </Suspense>
    </Suspense>
  )
}
```

### 2. 配合错误边界

```tsx
import { Component, lazy, Suspense } from 'react'

// 错误边界：chunk 加载失败时的回退
class ChunkErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>页面加载失败，请刷新重试</p>
          <button onClick={() => location.reload()}>刷新页面</button>
        </div>
      )
    }
    return this.props.children
  }
}

// 使用
function SafeLazyPage({ component: Component, ...props }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Component {...props} />
      </Suspense>
    </ChunkErrorBoundary>
  )
}
```

## 四、Vue 中的代码分割

### 1. defineAsyncComponent

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// 基础用法
const Dashboard = defineAsyncComponent(() =>
  import('./components/Dashboard.vue')
)

// 高级用法：带加载状态和错误处理
const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: () => <div class="loading">图表加载中...</div>,
  errorComponent: () => <div class="error">图表加载失败</div>,
  delay: 200,        // 延迟显示 loading（避免闪烁）
  timeout: 10000,    // 10s 超时
})
</script>

<template>
  <Suspense>
    <template #default>
      <Dashboard />
    </template>
    <template #fallback>
      <PageSkeleton />
    </template>
  </Suspense>
</template>
```

## 五、组件级别的懒加载

并非只有路由页面才需要懒加载。以下类型的组件非常适合懒加载：

| 场景 | 示例 |
| --- | --- |
| **重型图表** | Echarts、Three.js、地图组件 |
| **富文本编辑器** | Tiptap、Quill、Monaco Editor |
| **视频/音频播放器** | Video.js、Plyr |
| **模态框/抽屉** | 用户触发后才需要渲染的弹窗 |
| **评论组件** | 通常在页面底部，非首屏可见 |

```tsx
// ❌ 直接导入 — 所有用户都会下载代码编辑器
import MonacoEditor from '@monaco-editor/react'

// ✅ 懒加载 — 仅当用户进入编辑页时才加载
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

// ✅ 条件加载 — 只在需要时加载
function CodeEditor({ show }: { show: boolean }) {
  const [Editor, setEditor] = useState(null)

  useEffect(() => {
    if (show) {
      import('@monaco-editor/react').then(mod => {
        setEditor(() => mod.default)
      })
    }
  }, [show])

  if (!show || !Editor) return null
  return <Editor />
}
```

## 六、第三方库的按需加载

```ts
// ❌ 打包整个 lodash（~70KB gzipped）
import { debounce } from 'lodash'

// ✅ 只引入需要的函数（~2KB gzipped）
import debounce from 'lodash/debounce'

// ❌ 打包整个 dayjs + 所有 locale
import dayjs from 'dayjs'

// ✅ 只加载需要的 locale
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
```

```ts
// ✅ 使用 tree-shakable 的替代品
// lodash → lodash-es（ES Module 版本，支持 tree shaking）
import { debounce, throttle, cloneDeep } from 'lodash-es'

// moment → dayjs（体积小 97%）
import dayjs from 'dayjs'
```

## 七、预加载策略

利用浏览器 hint 优化关键资源的加载时机：

```html
<!-- 预加载：当前页面必定需要的资源（优先加载） -->
<link rel="preload" as="script" href="/js/app.js" />
<link rel="preload" as="style" href="/css/critical.css" />
<link rel="preload" as="font" href="/fonts/main.woff2" crossorigin />

<!-- 预获取：可能需要的资源（低优先级） -->
<link rel="prefetch" as="script" href="/js/next-page.js" />

<!-- 预连接：提前建立连接（用于第三方域名） -->
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

### 1. 在 Vite 中配置预加载

```ts
// vite.config.ts
export default defineConfig({
  build: {
    modulePreload: {
      // 使用 polyfill 兼容老浏览器
      polyfill: true,
    },
  },
})
```

### 2. 在 Webpack 中的 magic comment

```ts
// 自定义 chunk 名称
const About = lazy(() => import(
  /* webpackChunkName: "page-about" */
  /* webpackPrefetch: true */        // 预获取
  /* webpackPreload: true */         // 预加载（仅用于关键资源）
  './pages/About'
))
```

## 八、分析打包结果

```bash
# Vite / Rollup
npm run build
# → 查看 dist/ 目录下的文件大小

# 使用 rollup-plugin-visualizer
npm i -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,           // 构建后自动打开
      gzipSize: true,       // 显示 gzip 后大小
      brotliSize: true,     // 显示 brotli 后大小
      filename: 'stats.html',
    }),
  ],
})
```

## 小结

==代码分割== 是优化首屏加载速度最有效的手段。路由级别的 `lazy()` 动态 import 由 Vite/Webpack 自动处理，重型组件（图表、编辑器、播放器）也应采用懒加载。第三方库的按需引入（如 `lodash-es`、echarts 按需）同样属于"代码分割"的范畴。配合 `preload`/`prefetch` 资源提示可以进一步优化加载时机，平衡首屏速度和后续页面切换体验。

::: tip 分割粒度建议
- **vendors chunk**：200KB ~ 500KB 为宜
- **页面 chunk**：控制在 100KB 以内较好
- **公共模块**：被 3 个以上页面使用才提取
- 不要过度分割 → 太多小文件反而增加请求开销（HTTP/2 下有所缓解）
:::
