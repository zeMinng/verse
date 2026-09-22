# Service Worker & PWA

## 概要

[Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) 是运行在浏览器后台的脚本，充当**网络代理**——拦截请求、缓存资源、推送通知。它是 PWA（渐进式 Web 应用）的核心技术。

## 一、生命周期

```
注册 → 安装(install) → 激活(activate) → 控制页面(fetch)
```

```js
// 1. 注册 Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',  // 控制范围
  }).then(reg => {
    console.log('SW 注册成功:', reg.scope)
  }).catch(err => {
    console.error('SW 注册失败:', err)
  })
}
```

```js
// sw.js — Service Worker 脚本
const CACHE_NAME = 'my-cache-v1'
const CACHE_URLS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
]

// 2. 安装 — 预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS)
    })
  )
})

// 3. 激活 — 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME)
             .map(name => caches.delete(name))
      )
    })
  )
})

// 4. 拦截请求 — 缓存策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
    })
  )
})
```

## 二、缓存策略

### 1. Cache First（适合不变资源）

```
有缓存 → 返回缓存；无缓存 → 请求网络 → 缓存
```

```js
// 适合：CSS/JS/字体/图片（带 hash 的资源）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  )
})
```

### 2. Network First（适合 API 数据）

```
先请求网络 → 成功则返回；失败 → 返回缓存
```

```js
// 适合：需要最新数据但也可离线降级的 API
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open('api-cache')
    cache.put(request, response.clone())
    return response
  } catch {
    return caches.match(request)
  }
}
```

### 3. Stale While Revalidate（适合平衡体验）

```
先返回缓存（快）→ 同时发起网络请求更新缓存（下次快）
```

```js
// 适合：列表页、博客文章（即时展示 + 后台更新）
async function staleWhileRevalidate(request) {
  const cache = await caches.open('content-cache')
  const cached = await cache.match(request)
  
  const networkPromise = fetch(request).then(response => {
    cache.put(request, response.clone())
    return response
  })

  return cached || networkPromise
}
```

### 4. 策略选择指南

| 策略 | 适合场景 | 用户体验 |
| --- | --- | --- |
| **Cache First** | 不变的静态资源（带 hash） | 极快 |
| **Network First** | API 数据、需要实时性 | 有网时最新 |
| **Stale While Revalidate** | 文章、图片、列表 | 即时加载 + 后台更新 |
| **Network Only** | 支付、登录（敏感操作） | 仅在线 |
| **Cache Only** | 预缓存的离线内容 | 仅离线 |

## 三、PWA — 渐进式 Web 应用

PWA 的核心三要素：**Service Worker + manifest.json + HTTPS**。

### 1. manifest.json

```json
{
  "name": "小棱镜 - 前端文档",
  "short_name": "小棱镜",
  "start_url": "/",
  "display": "standalone",       // 独立窗口（无浏览器地址栏）
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "description": "前端技术知识库",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"   // 自适应图标（Android）
    }
  ]
}
```

```html
<!-- index.html -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
```

### 2. 安装提示

```js
// 监听 PWA 安装事件
let deferredPrompt

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e

  // 显示自定义安装按钮
  document.getElementById('install-btn').style.display = 'block'
})

document.getElementById('install-btn').addEventListener('click', async () => {
  if (!deferredPrompt) return
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  console.log('用户选择:', outcome) // 'accepted' | 'dismissed'
  deferredPrompt = null
})
```

## 四、Workbox — 简化 Service Worker

Google 的 [Workbox](https://developer.chrome.com/docs/workbox/) 封装了常见的 SW 模式：

```bash
npm i workbox-precaching workbox-routing workbox-strategies
```

```ts
// sw.ts
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'

// 预缓存构建产物
precacheAndRoute(self.__WB_MANIFEST)

// 图片：Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
)

// API：Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api', networkTimeoutSeconds: 3 })
)

// 静态资源：Stale While Revalidate
registerRoute(
  ({ request }) => ['script', 'style', 'font'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'static' })
)
```

### 1. Vite + Workbox

```bash
npm i -D vite-plugin-pwa
```

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '小棱镜',
        short_name: '小棱镜',
        theme_color: '#3b82f6',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\./,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-cache' },
          },
        ],
      },
    }),
  ],
})
```

## 五、Service Worker 更新流程

```js
// SW 有更新时自动提示用户
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing!
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // 新 SW 已就绪，提示用户刷新
        const confirmed = window.confirm('新版本已就绪，是否刷新？')
        if (confirmed) {
          newWorker.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      }
    })
  })
})
```

## 六、调试

```
Chrome DevTools → Application → Service Workers
  - Update: 强制更新 SW
  - Unregister: 注销 SW
  - Bypass for network: 跳过 SW 直接请求网络
  - Update on reload: 每次刷新检查 SW 更新

Chrome DevTools → Application → Cache Storage
  - 查看缓存内容
```

```bash
# 直接访问 SW 调试页面
chrome://serviceworker-internals/
chrome://inspect/#service-workers
```

::: tip 开发注意事项
- Service Worker **只在 HTTPS 或 localhost 下可用**
- SW 脚本不能与页面共享作用域，需要独立文件
- SW 有独立的生命周期，`console.log` 在对应的上下文查看
- 开发时建议勾选 "Update on reload" 避免缓存旧 SW
:::

## 小结

`Service Worker` 是构建 ==PWA== 和实现 ==离线缓存== 的核心技术，通过拦截网络请求实现灵活的缓存策略。四种缓存模式（Cache First、Network First、Stale While Revalidate、Network Only）覆盖不同的业务场景。生产环境中推荐使用 `Workbox` 简化 SW 开发，通过 `vite-plugin-pwa` 可以零配置集成到 Vite 项目中。

::: info 📖 参考
- [Service Worker — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox 文档](https://developer.chrome.com/docs/workbox/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
:::
