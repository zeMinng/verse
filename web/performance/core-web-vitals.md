# Core Web Vitals 详解

## 概要

[Core Web Vitals](https://web.dev/vitals/) 是 Google 提出的核心网页体验指标，直接影响 SEO 排名和用户体验。理解并优化这三个指标是前端性能优化的重中之重。

## 一、LCP — 最大内容绘制

LCP 测量页面**主要内容**加载完成的时间，反映用户感知的加载速度。

### 1. 触发条件

以下元素会被视为 LCP 候选：
- `<img>` 元素
- `<image>` 内的 `<svg>` 元素
- `<video>` 的封面图
- 通过 `url()` 加载背景图的元素
- 包含文本节点的块级元素

### 2. 优化策略

| 策略 | 操作 | 预期收益 |
| --- | --- | --- |
| **优化关键资源** | 内联关键 CSS、延迟非关键 CSS/JS | 高 |
| **预加载 LCP 资源** | `<link rel="preload" as="image" href="hero.jpg">` | 高 |
| **使用 CDN** | 静态资源部署到 CDN 边缘节点 | 高 |
| **优化图片格式** | WebP / AVIF 替代 PNG/JPG | 中 |
| **服务端渲染 (SSR)** | 减少客户端渲染时间 | 中 |
| **减少 TTFB** | 优化服务器响应、使用缓存 | 中 |

### 3. 测量 LCP

```js
// 使用 web-vitals 库
import { onLCP } from 'web-vitals'

onLCP((metric) => {
  console.log('LCP:', metric.value)
  // 上报到分析平台
})
```

::: tip LCP 优化目标
将 LCP 控制在 **2.5 秒以内** 可被评为"良好 (Good)"。
:::

## 二、INP — 交互到下次绘制

INP 是 2024 年 3 月正式替代 FID 的新指标，衡量页面**整个生命周期的交互延迟**。

### 1. FID vs INP 的区别

| 维度 | FID（旧） | INP（新） |
| --- | --- | --- |
| 测量范围 | 仅首次交互 | 整个页面的所有交互 |
| 取值方式 | 只取单次延迟 | 取接近最差的值（第 75 百分位附近） |
| 代表意义 | 首次印象 | 整体响应性 |

### 2. 导致高 INP 的常见原因

1. **长任务 (Long Tasks)** — JS 任务阻塞主线程超过 50ms
2. **大量 DOM 操作** — 交互触发大规模 DOM 更新
3. **未优化的第三方脚本** — 分析、广告脚本阻塞

### 3. 优化策略

```js
// ❌ 同步处理大量数据 — 阻塞主线程
function handleClick() {
  const result = heavyComputation(data)  // 可能需要 200ms
  updateUI(result)
}

// ✅ 拆分为小任务 — 让出主线程
async function handleClick() {
  const result = await chunkedComputation(data)
  updateUI(result)
}

// 利用 requestIdleCallback 或 scheduler.yield()
async function chunkedComputation(items) {
  const results = []
  for (const item of items) {
    results.push(process(item))
    // 每处理一批就让出主线程
    if (results.length % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  return results
}
```

### 4. 使用 scheduler.yield()（现代方式）

```js
// Chrome 115+ 支持
async function handleClick() {
  // 标记任务点，让浏览器有机会处理其他工作
  await scheduler.yield()
  updateUI()
}
```

### 5. 测量 INP

```js
import { onINP } from 'web-vitals'

onINP((metric) => {
  console.log('INP:', metric.value)
})
```

::: tip INP 优化目标
INP ≤ **200ms** 为良好；200ms ~ 500ms 需要改进；> 500ms 为差。
:::

## 三、CLS — 累积布局偏移

CLS 测量页面生命周期内**意外的布局偏移**，反映视觉稳定性。

### 1. 计算方式

```
CLS = 影响比例 × 距离比例
```

每次意外的布局偏移都会累积到总分中。分数越低越好。

### 2. 导致 CLS 的常见原因

| 原因 | 场景 | 解决方案 |
| --- | --- | --- |
| **无尺寸的图片** | `<img>` 未设宽高 | 始终设置 `width` / `height` 或 `aspect-ratio` |
| **动态注入内容** | 广告、弹窗插入 | 预留占位空间 |
| **Web Font** | 字体加载后文本跳动 | `font-display: swap` + 预加载 |
| **异步加载的 DOM** | AJAX 列表渲染 | 使用骨架屏，预留容器尺寸 |

### 3. 实战修复

::: code-group
```html [图片预留尺寸]
<!-- ❌ 无尺寸 - 图片加载后可能造成偏移 -->
<img src="banner.jpg" />

<!-- ✅ 显式设置宽高 - 浏览器可以预先计算比例 -->
<img src="banner.jpg" width="800" height="400" />

<!-- ✅ 或使用 CSS aspect-ratio -->
<img src="banner.jpg" style="aspect-ratio: 16/9; width: 100%;" />
```

```css [字体加载优化]
/* ✅ 字体加载优化 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* 先用系统字体，加载完再替换 */
  /* 或使用 optional：字体不重要时不替换 */
  /* font-display: optional; */
}
```

```js [动态内容预留空间]
// ✅ 为动态内容预留空间
function AdSlot() {
  return (
    <div style={{ minHeight: '250px' }}>
      {/* 广告脚本动态填充 */}
      <div id="ad-container" />
    </div>
  )
}
```
:::

### 4. 测量 CLS

```js
import { onCLS } from 'web-vitals'

onCLS((metric) => {
  console.log('CLS:', metric.value)
})
```

::: tip CLS 优化目标
CLS ≤ **0.1** 为良好；0.1 ~ 0.25 需要改进；> 0.25 为差。
:::

## 四、使用 Web Vitals 库统一上报

```bash
npm i web-vitals
```

```js
// analytics.js — 统一性能上报
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'

function sendToAnalytics({ name, value, id, rating }) {
  // 发送到你的分析平台（如百度统计、Google Analytics、自建平台）
  const body = JSON.stringify({
    name,           // 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
    value: Math.round(value),  // 取整毫秒值
    id,             // 唯一标识
    rating,         // 'good' | 'needs-improvement' | 'poor'
    page: location.pathname,
  })

  // 使用 sendBeacon 确保页面关闭时也能上报
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body)
  } else {
    fetch('/api/vitals', { body, method: 'POST', keepalive: true })
  }
}

onCLS(sendToAnalytics)
onINP(sendToAnalytics)
onLCP(sendToAnalytics)
onFCP(sendToAnalytics)
onTTFB(sendToAnalytics)
```

## 五、Lighthouse 本地审计

```bash
# Chrome DevTools → Lighthouse 面板
# 或使用 CLI
npm i -g lighthouse
lighthouse https://your-site.com --view

# 在 CI 中使用
lighthouse https://your-site.com --output=json --output-path=./report.json
```

## 小结

Core Web Vitals 是 Google 评估页面体验的核心指标：==LCP== 衡量加载速度（≤ 2.5s），==INP== 衡量交互响应（≤ 200ms），==CLS== 衡量视觉稳定性（≤ 0.1）。三者的优化策略各不相同——LCP 重在资源加载优化，INP 重在避免长任务阻塞主线程，CLS 重在预留空间防止布局偏移。使用 `web-vitals` 库可以统一上报真实用户数据，帮助持续追踪优化效果。

::: info 📖 相关资源
- [web.dev/vitals](https://web.dev/vitals/) — Core Web Vitals 官方文档
- [web-vitals npm](https://www.npmjs.com/package/web-vitals) — 官方测量库
- [Chrome UX Report](https://developer.chrome.com/docs/crux/) — 真实用户数据
:::
