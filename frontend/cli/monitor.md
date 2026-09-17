# 前端日志与监控

## 概要

前端监控是保障线上质量的关键环节——用户遇到 JS 报错、接口超时、白屏等问题时，不能依赖用户主动反馈。本文聚焦 Sentry 接入和自建监控方案。

## 一、前端监控体系

```
前端监控
├── 错误监控    → JS 异常、Promise 异常、资源加载错误
├── 性能监控    → Core Web Vitals、接口耗时
├── 用户行为    → 页面访问、点击流、留存
└── 告警通知    → 钉钉/企业微信/邮件/短信
```

## 二、Sentry 接入

[Sentry](https://sentry.io/) 是最主流的前端错误监控平台，有免费额度，支持 Source Map 回溯。

### 1. 安装

```bash
npm i @sentry/vue    # Vue
npm i @sentry/react  # React
npm i @sentry/browser # 通用
```

### 2. Vue 3 集成

```ts
// main.ts
import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'

const app = createApp(App)

Sentry.init({
  app,
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx', // 从 Sentry 后台获取
  environment: import.meta.env.MODE,            // 'development' | 'production'
  release: 'webpedia@1.0.0',                    // 版本号，配合 Source Map
  
  // 采样率（生产环境建议调低以控制用量）
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: import.meta.env.PROD ? 0.05 : 1.0,
  replaysOnErrorSampleRate: 1.0,  // 错误时始终录制
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
})

app.mount('#app')
```

### 3. React 集成

```tsx
// main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.reactRouterV6BrowserTracingIntegration({ // React Router 路由追踪
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
})
```

### 4. 错误边界（React）

```tsx
import * as Sentry from '@sentry/react'

// Sentry 内置 ErrorBoundary
function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={<div className="error-page">页面出错了，请刷新重试</div>}
      beforeCapture={(scope) => {
        scope.setTag('component', 'App')
        scope.setLevel('error')
      }}
    >
      <Routes>
        {/* ... */}
      </Routes>
    </Sentry.ErrorBoundary>
  )
}
```

### 5. 手动上报

```ts
import * as Sentry from '@sentry/browser'

// 1. 上报自定义错误
Sentry.captureException(new Error('自定义错误'))

// 2. 上报消息
Sentry.captureMessage('用户触发了某个关键操作', 'info')

// 3. 设置用户上下文
Sentry.setUser({
  id: 'user-123',
  email: 'user@example.com',
})

// 4. 设置标签（方便搜索过滤）
Sentry.setTag('page', 'dashboard')
Sentry.setTag('feature', 'export')

// 5. 设置额外数据
Sentry.setContext('payment', {
  orderId: 'xxx',
  amount: 99.9,
})

// 6. 接口错误上报
async function fetchData(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${url}`)
    }
    return res.json()
  } catch (error) {
    Sentry.captureException(error, {
      tags: { type: 'api_error' },
      extra: { url, timestamp: Date.now() },
    })
    throw error
  }
}
```

## 三、Source Map 上传

生产环境的 JS 是压缩混淆的，Sentry 需要通过 Source Map 还原真实报错位置。

```bash
npm i -D @sentry/vite-plugin
```

```ts
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: true,  // 生成 source map
  },
  plugins: [
    sentryVitePlugin({
      org: 'your-org-slug',
      project: 'webpedia',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: `webpedia@${process.env.npm_package_version}`,
      },
    }),
  ],
})
```

::: warning 安全
`.map` 文件包含源码，不要暴露在公网。上传到 Sentry 后，可以通过 `sentryVitePlugin` 的 `sourcemaps.filesToDeleteAfterUpload` 选项自动删除，或在 CDN 层配置拒绝 `.map` 访问。
:::

## 四、性能监控

### 1. Web Vitals 上报

```ts
import { onLCP, onINP, onCLS } from 'web-vitals'

function sendToAnalytics(metric: { name: string; value: number; rating: string }) {
  // 1. 上报到 Sentry
  Sentry.metrics.distribution(`webvitals.${metric.name}`, metric.value, {
    unit: 'millisecond',
    tags: { rating: metric.rating },
  })

  // 2. 或上报到自建服务
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', JSON.stringify(metric))
  }
}

onLCP(sendToAnalytics)
onINP(sendToAnalytics)
onCLS(sendToAnalytics)
```

### 2. 接口耗时监控

```ts
// 包装 fetch，自动上报慢请求
const originalFetch = window.fetch

window.fetch = async function (...args: Parameters<typeof fetch>) {
  const start = performance.now()
  try {
    const response = await originalFetch(...args)
    const duration = performance.now() - start

    if (duration > 3000) {
      // 超过 3 秒的请求
      Sentry.captureMessage(`Slow API: ${args[0]}`, {
        level: 'warning',
        extra: { duration, url: args[0] },
      })
    }
    return response
  } catch (error) {
    const duration = performance.now() - start
    Sentry.captureException(error as Error, {
      tags: { type: 'api_error' },
      extra: { duration, url: args[0] },
    })
    throw error
  }
}
```

## 五、全局错误捕获

```ts
// 兜底方案：捕获未被局部 try/catch 处理的错误
window.addEventListener('error', (event) => {
  // JS 运行时错误
  if (event.error) {
    Sentry.captureException(event.error)
  }
  // 资源加载错误
  if (event.target !== window) {
    Sentry.captureMessage(`Resource load failed: ${(event.target as any).src}`, 'error')
  }
}, true)

// 未捕获的 Promise rejections
window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason, {
    tags: { type: 'unhandled_rejection' },
  })
})
```

## 六、监控告警配置

### 1. Sentry 告警规则

```
Sentry → Alerts → Create Alert

1. 错误数量告警：
   - 条件：1 小时内新增错误 > 50 条
   - 通知：企业微信群机器人

2. 新错误告警：
   - 条件：出现之前未见过的错误
   - 通知：邮件 / Slack

3. 性能告警：
   - 条件：LCP p75 > 4s
   - 通知：邮件
```

### 2. 告警通知渠道集成

Sentry 原生支持：
- Slack、Teams、钉钉
- 邮件、短信
- Webhook（可对接企业微信）

## 七、自建轻量监控

如果不想依赖 Sentry，可以用 `navigator.sendBeacon` 自建：

```ts
// utils/errorReporter.ts
interface ErrorReport {
  message: string
  stack?: string
  url: string
  userAgent: string
  timestamp: number
}

function reportError(error: Error) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    url: location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  }

  // sendBeacon：页面关闭也能发出，不阻塞页面
  navigator.sendBeacon(
    '/api/errors',
    JSON.stringify(report)
  )
}

// 全局捕获
window.addEventListener('error', (e) => {
  if (e.error) reportError(e.error)
})
window.addEventListener('unhandledrejection', (e) => {
  reportError(new Error(String(e.reason)))
})
```

后端接收示例（Node.js + 简单存储）：

```js
// api/errors/route.ts
export async function POST(request: Request) {
  const report = await request.json()
  
  console.error(`[${new Date(report.timestamp).toISOString()}] ${report.message}
    URL: ${report.url}
    Stack: ${report.stack}
    UA: ${report.userAgent}
  `)
  
  // 可选：写入日志文件 / 数据库 / 发送通知
  // fs.appendFileSync('errors.log', JSON.stringify(report) + '\n')
  
  return Response.json({ success: true })
}
```

## 八、监控最佳实践

| 实践 | 说明 |
| --- | --- |
| **版本标记** | 每次发布标记 Sentry release，追踪错误引入版本 |
| **Source Map** | 生产构建上传 Source Map，否则报错位置无意义 |
| **去重** | 同类错误 Sentry 自动合并，注意更新 Sentry SDK 版本 |
| **采样而非全量** | 性能数据按 10%~20% 采样，节省用量 |
| **隐私脱敏** | 上传前过滤用户密码/手机号等敏感信息 |
| **告警降噪** | 避免告警风暴，设置聚合窗口和阈值 |

```ts
// Sentry 脱敏配置
Sentry.init({
  // 过滤敏感字段
  beforeSend(event) {
    // 移除请求中的密码字段
    if (event.request?.data) {
      delete event.request.data.password
      delete event.request.data.phone
    }
    return event
  },
  // 忽略某些非关键错误
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection',
  ],
})
```

## 小结

前端监控体系包含 ==错误监控==、==性能监控== 和 ==用户行为追踪== 三个维度。Sentry 是最成熟的开源方案，通过 SDK 几行代码即可集成，配合 Source Map 上传可以还原生产环境报错的真实位置。`web-vitals` 库覆盖 Core Web Vitals 测量，`navigator.sendBeacon` 可用于自建轻量监控。关键实践包括：版本标记追踪错误引入、采样控制用量、脱敏保护用户隐私、配置告警规则避免漏报。

::: info 📖 参考
- [Sentry 官方文档](https://docs.sentry.io/)
- [Sentry Vue 集成](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [Sentry React 集成](https://docs.sentry.io/platforms/javascript/guides/react/)
- [web-vitals 库](https://github.com/GoogleChrome/web-vitals)
:::
