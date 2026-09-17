# Web Worker

## 概要

[Web Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API) 允许在**独立的后台线程**中运行 JavaScript，不阻塞主线程（UI 线程）。适用于 CPU 密集型计算、大数据处理等场景。

## 一、基本用法

### 1. 创建 Worker

::: code-group
```js [main.js — 主线程]
const worker = new Worker('/workers/heavy-task.js')

// 向 Worker 发送消息
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] })

// 接收 Worker 返回的结果
worker.onmessage = (event) => {
  console.log('计算结果:', event.data)
}

// 错误处理
worker.onerror = (error) => {
  console.error('Worker 错误:', error.message)
}

// 使用完毕立即终止
worker.terminate()
```

```js [workers/heavy-task.js — Worker 线程]
self.onmessage = (event) => {
  const { type, data } = event.data

  if (type === 'calculate') {
    // 耗时的计算任务
    const result = heavyComputation(data)
    
    // 返回结果给主线程
    self.postMessage({ type: 'result', data: result })
  }
}

function heavyComputation(numbers) {
  // 模拟 CPU 密集型操作
  let sum = 0
  for (const n of numbers) {
    for (let i = 0; i < 1e7; i++) {
      sum += n * Math.random()
    }
  }
  return sum
}
```
:::

## 二、Vite 中创建 Worker

```ts
// ✅ Vite 原生支持 Worker import
const worker = new Worker(
  new URL('./workers/heavy-task.ts', import.meta.url),
  { type: 'module' }
)

// ✅ 带 ?worker 后缀的 import — 直接得到 Worker 构造函数
import MyWorker from './workers/heavy-task?worker'
const worker = new MyWorker()

// ✅ ?sharedworker — Shared Worker
import MySharedWorker from './workers/shared?sharedworker'
const sharedWorker = new MySharedWorker()
```

## 三、实战场景

### 1. CSV/Excel 大数据解析

::: code-group
```ts [main.ts — 主线程]
const worker = new Worker(
  new URL('./workers/csv-parser.ts', import.meta.url),
  { type: 'module' }
)

function parseLargeCSV(file: File) {
  return new Promise((resolve, reject) => {
    worker.postMessage({ file })
    worker.onmessage = (e) => {
      if (e.data.error) reject(e.data.error)
      else resolve(e.data.result)
    }
  })
}
```

```ts [workers/csv-parser.ts — Worker 线程]
import Papa from 'papaparse'

self.onmessage = (e) => {
  const { file } = e.data
  Papa.parse(file, {
    complete: (results) => {
      self.postMessage({ result: results.data })
    },
    error: (error) => {
      self.postMessage({ error: error.message })
    },
  })
}
```
:::

### 2. 图片压缩

```ts
// workers/image-compress.ts
self.onmessage = async (e) => {
  const { imageData, quality } = e.data
  
  // 使用 OffscreenCanvas 在 Worker 中处理图片
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')!
  
  ctx.putImageData(imageData, 0, 0)
  
  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: quality || 0.8,
  })
  
  self.postMessage({ blob })
}
```

### 3. 加密/哈希计算

```ts
// workers/crypto.ts
self.onmessage = async (e) => {
  const { text, algorithm } = e.data
  
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hash = await crypto.subtle.digest(algorithm || 'SHA-256', data)
  
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  self.postMessage({ hash: hashHex })
}
```

## 四、Worker 类型对比

| 类型 | 特点 | 使用场景 |
| --- | --- | --- |
| **Dedicated Worker** | 单一页面专用，页面关闭即销毁 | 页面级计算任务 |
| **Shared Worker** | 同源多页面共享，独立生命周期 | 跨 Tab 通信、共享状态 |
| **Service Worker** | 网络代理、离线缓存 | PWA、推送通知 |

### 1. Shared Worker 示例

::: code-group
```js [shared-worker.js — Worker 端]
const connections = []
self.onconnect = (e) => {
  const port = e.ports[0]
  connections.push(port)
  
  port.onmessage = (event) => {
    // 广播消息给所有连接的页面
    connections.forEach(c => c.postMessage(event.data))
  }
  
  port.start()
}
```

```js [页面中使用]
const worker = new SharedWorker('/shared-worker.js')
worker.port.onmessage = (e) => console.log('收到广播:', e.data)
worker.port.postMessage('来自页面A的消息')
```
:::

## 五、Worker 的限制

| 限制 | 说明 | 替代方案 |
| --- | --- | --- |
| **无法访问 DOM** | 不能操作 document、window | 通过 postMessage 传递数据 |
| **无法访问 localStorage** | 不能操作存储 | 用 IndexedDB（支持）或通过 postMessage 让主线程操作 |
| **同源限制** | Worker 脚本必须同源 | 可用 `importScripts` 跨域加载脚本 |
| **模块支持** | 需要 `{ type: 'module' }` | Vite 已默认处理 |
| **通信开销** | 传递大对象时需要结构化克隆 | 使用 Transferable Objects 传输所有权 |

### 1. 使用 Transferable Objects 优化大数据传输

```js
// ❌ 普通方式：数据被 clone（内存翻倍）
worker.postMessage(largeArrayBuffer)

// ✅ Transferable：转移所有权（零拷贝！）
worker.postMessage(largeArrayBuffer, [largeArrayBuffer])
// ↑ 主线程不再持有该数据，Worker 独占
// 传输后主线程访问 largeArrayBuffer.byteLength === 0
```

## 六、React Hook 封装

```tsx
import { useEffect, useRef, useCallback } from 'react'

export function useWorker(fn: (...args: any[]) => any) {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    // 将函数转为 Blob URL → Worker
    const blob = new Blob([
      `self.onmessage = (e) => {
        const fn = ${fn.toString()}
        self.postMessage(fn(...e.data))
      }`
    ], { type: 'application/javascript' })
    
    workerRef.current = new Worker(URL.createObjectURL(blob))

    return () => {
      workerRef.current?.terminate()
      URL.revokeObjectURL(blob)
    }
  }, [fn])

  const run = useCallback((...args: any[]) => {
    return new Promise((resolve) => {
      if (!workerRef.current) return
      workerRef.current.onmessage = (e) => resolve(e.data)
      workerRef.current.postMessage(args)
    })
  }, [])

  return { run }
}

// 使用
function App() {
  const { run } = useWorker((n: number) => {
    let sum = 0
    for (let i = 0; i < n; i++) sum += i
    return sum
  })

  const handleClick = async () => {
    const result = await run(1e8)
    console.log('结果:', result)
  }

  return <button onClick={handleClick}>计算</button>
}
```

::: warning 注意
Web Worker 适合 **CPU 密集型**任务（计算、编解码、解析）。对于 **I/O 密集型**任务（网络请求），浏览器已经做了异步处理，不需要 Worker。
:::

## 小结

`Web Worker` 是处理 ==CPU 密集型计算==的标准方案，通过 `postMessage` 与主线程通信。Worker 线程无法访问 DOM，但支持 IndexedDB 和网络请求。对于大数据传输，使用 `Transferable Objects` 可以实现零拷贝优化。Vite 原生支持 Worker import，结合 React/Vue Hook 封装可以方便地在组件中使用后台线程。

::: info 📖 参考
- [Web Workers - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
- [Vite Web Worker 文档](https://cn.vitejs.dev/guide/features.html#web-workers)
:::
