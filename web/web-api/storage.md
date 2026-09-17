# 浏览器存储方案对比

## 概要

浏览器提供了多种存储方式，各有特性和适用场景。选择合适的存储方案对性能、安全性和用户体验至关重要。

## 一、存储方案对比

| 特性 | Cookie | localStorage | sessionStorage | IndexedDB | Cache API |
| --- | --- | --- | --- | --- | --- |
| **容量** | ~4KB | ~5-10MB | ~5-10MB | 数百MB+（按磁盘剩余） | 按磁盘剩余 |
| **过期时间** | 可设置 | 永不过期 | 关闭标签页即清除 | 永不过期 | 手动管理 |
| **作用域** | 同源+路径 | 同源 | 同标签页 | 同源 | Service Worker 域 |
| **随请求发送** | ✅ 每次 | ❌ | ❌ | ❌ | ❌ |
| **异步** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **数据类型** | 字符串 | 字符串 | 字符串 | 任意（结构化克隆） | Response |
| **Worker 可用** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **适用场景** | 服务端会话标识 | 用户偏好、主题 | 表单暂存 | 离线数据、大文件 | 离线资源缓存 |

## 二、localStorage

```js
// 基础 CRUD
localStorage.setItem('theme', 'dark')
const theme = localStorage.getItem('theme')      // 'dark'
localStorage.removeItem('theme')
localStorage.clear()

// 存储对象
const user = { name: 'zeMinng', role: 'admin' }
localStorage.setItem('user', JSON.stringify(user))
const saved = JSON.parse(localStorage.getItem('user') || '{}')

// 容量检测
function getLocalStorageSize() {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return (total / 1024).toFixed(2) + ' KB'
}

// 安全包装
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage 已满，清理旧数据')
      // 清理策略...
    }
  }
}
```

### 1. localStorage 封装

```ts
// utils/storage.ts
const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn(`localStorage.setItem failed: ${key}`, e)
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },

  // 带过期时间
  setWithExpiry(key: string, value: unknown, ttlMs: number) {
    const item = {
      value,
      expiry: Date.now() + ttlMs,
    }
    this.set(key, item)
  },

  getWithExpiry<T>(key: string, fallback: T): T {
    const item = this.get<{ value: T; expiry: number } | null>(key, null)
    if (!item) return fallback
    if (Date.now() > item.expiry) {
      this.remove(key)
      return fallback
    }
    return item.value
  },
}

export default storage
```

```ts
// 使用
storage.setWithExpiry('auth-token', 'xxx-token', 7 * 24 * 60 * 60 * 1000) // 7天
const token = storage.getWithExpiry('auth-token', null)
```

## 三、sessionStorage

与 localStorage API 完全相同，但**关闭标签页后数据清除**。

```js
// 适合：表单草稿、单次会话的敏感数据
sessionStorage.setItem('form-draft', JSON.stringify(formData))

// 页面刷新时恢复草稿
const draft = JSON.parse(sessionStorage.getItem('form-draft') || '{}')
```

| 何时使用 | 场景 |
| --- | --- |
| **localStorage** | 用户偏好、主题、登录 Token |
| **sessionStorage** | 表单暂存、多步骤向导、临时筛选条件 |

## 四、Cookie

Cookie 是**唯一会自动随 HTTP 请求发送**的存储方式，主要用于身份认证。

```js
// 设置 Cookie
document.cookie = `token=xxx; max-age=${7*24*60*60}; path=/; secure; samesite=lax`

// 读取（需要手动解析）
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

// 删除
document.cookie = 'token=; max-age=0; path=/'
```

### 1. Cookie 安全属性

```js
document.cookie = `session=xxx; Secure; HttpOnly; SameSite=Strict; path=/`

// Secure:    仅 HTTPS 发送
// HttpOnly:  JS 无法读取（服务端设置）
// SameSite:  Strict（同站请求）/ Lax（允许 GET 导航）/ None（跨站允许，需 Secure）
```

::: warning
现代 SPA 中，**Token 存储首选 HttpOnly Cookie**（服务端设置，防 XSS），其次内存变量，==最后才考虑 localStorage==（有 XSS 泄露风险）。
:::

## 五、IndexedDB

适合**大量结构化数据**的离线存储。

```js
// 打开数据库
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDatabase', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      // 创建对象仓库（类似 SQL 表）
      if (!db.objectStoreNames.contains('posts')) {
        const store = db.createObjectStore('posts', { keyPath: 'id' })
        store.createIndex('title', 'title', { unique: false })
        store.createIndex('createdAt', 'createdAt')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// CRUD 操作
async function addPost(post: { id: string; title: string; content: string }) {
  const db = await openDB()
  const tx = db.transaction('posts', 'readwrite')
  tx.objectStore('posts').add(post)
}

async function getPost(id: string) {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction('posts', 'readonly')
    const request = tx.objectStore('posts').get(id)
    request.onsuccess = () => resolve(request.result)
  })
}

async function getAllPosts() {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction('posts', 'readonly')
    const request = tx.objectStore('posts').getAll()
    request.onsuccess = () => resolve(request.result)
  })
}

async function deletePost(id: string) {
  const db = await openDB()
  const tx = db.transaction('posts', 'readwrite')
  tx.objectStore('posts').delete(id)
}
```

### 1. 推荐使用封装库

原生 IndexedDB API 较底层，推荐封装：

```bash
npm i idb          # 轻量 Promise 封装（Jake Archibald 开发）
npm i dexie        # 更完整的封装，类 SQL 语法
```

```ts
// 使用 Dexie
import Dexie from 'dexie'

const db = new Dexie('MyDatabase')
db.version(1).stores({
  posts: 'id, title, createdAt',
})

// 类 SQL 查询
const recentPosts = await db.posts
  .where('createdAt')
  .above(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toArray()
```

## 六、Cache API

主要配合 Service Worker 使用，用于缓存网络请求。

```js
// 缓存单个请求
const cache = await caches.open('api-cache-v1')
await cache.put('/api/users', new Response(JSON.stringify(users)))

// 读取缓存
const cached = await cache.match('/api/users')
if (cached) {
  const data = await cached.json()
}
```

## 七、选型决策图

```
数据需要随 HTTP 请求发送？
├── 是 → Cookie（HttpOnly 安全）
└── 否
    ├── 数据 > 10MB？
    │   ├── 是 → IndexedDB
    │   └── 否
    │       ├── 关闭标签页后需要保留？
    │       │   ├── 是 → localStorage
    │       │   └── 否 → sessionStorage / 内存
    │       └── 缓存网络请求？
    │           └── Cache API（配合 Service Worker）
    └── 结构化查询需求？
        └── IndexedDB
```

## 八、存储容量检测

```js
// 估算可用空间
async function estimateStorage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      usage: (estimate.usage! / 1024 / 1024).toFixed(2) + ' MB',
      quota: (estimate.quota! / 1024 / 1024).toFixed(2) + ' MB',
      percent: ((estimate.usage! / estimate.quota!) * 100).toFixed(1) + '%',
    }
  }
  return null
}

// 请求持久化存储（防止浏览器自动清理）
async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist()
    console.log('持久化存储:', granted ? '已授权' : '未授权')
  }
}
```

## 小结

浏览器提供了多种存储方案，选型的关键在于 ==数据容量==、==是否随请求发送== 和 ==是否需要结构化查询==。**Cookie** 适合服务端会话标识（注意 HttpOnly 安全），**localStorage** 适合用户偏好等小数据，**IndexedDB** 适合大量结构化离线数据，**Cache API** 配合 Service Worker 缓存网络请求。对于 Token 存储，应优先使用 HttpOnly Cookie 而非 localStorage 以防止 XSS 泄露。

::: info 📖 参考
- [Web Storage API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Storage_API)
- [IndexedDB - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)
- [Dexie.js](https://dexie.org/)
- [idb (tiny IndexedDB wrapper)](https://github.com/jakearchibald/idb)
:::
