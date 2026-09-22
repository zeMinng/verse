# CSS & Web 动画

## 概要

动画是提升用户体验的重要手段——引导注意力、提供反馈、增强过渡感。本文涵盖 CSS 动画、Web Animations API 以及常用动画库的使用技巧。

## 一、CSS Transition（过渡）

适用于 ==两个状态之间的平滑切换==（hover、focus、class 变化）。

```css
/* 基本语法 */
.element {
  /* transition: property duration timing-function delay */
  transition: background-color 0.3s ease, transform 0.2s ease-out;
}

.element:hover {
  background-color: #3b82f6;
  transform: scale(1.05);
}
```

### 1. 常见场景

```css
/* 卡片悬浮效果 */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,.15);
}

/* 按钮涟漪 */
.button {
  position: relative;
  transition: all 0.2s;
  overflow: hidden;
}
.button:active {
  transform: scale(0.97);
}

/* 导航栏下拉 */
.dropdown-menu {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;  /* 隐藏时不可交互 */
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown:hover .dropdown-menu {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

### 2. 过渡时间参考

| 类型 | 建议时长 | 适用 |
| --- | --- | --- |
| 微交互（按钮、输入框） | 100 ~ 200ms | UI 反馈 |
| 小元素（卡片、tooltip） | 200 ~ 300ms | 展开/收起 |
| 大区域（模态框、页面切换） | 300 ~ 500ms | 注意力转移 |
| 装饰性（背景、logo） | 500ms+ | 品牌体验 |

## 二、CSS Animation（关键帧动画）

适用于 ==循环动画或多阶段动画==。

```css
/* 1. 定义关键帧 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 多阶段（百分比） */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 2. 使用动画 */
.element {
  animation: slideInUp 0.4s ease-out both;
}

.pulse-element {
  animation: pulse 2s ease-in-out infinite;
}
```

### 1. 关键动画属性

| 属性 | 含义 | 常用值 |
| --- | --- | --- |
| `animation-name` | 关键帧名称 | keyframes 名 |
| `animation-duration` | 持续时间 | `0.3s`, `500ms` |
| `animation-timing-function` | 缓动函数 | `ease`, `linear`, `cubic-bezier()` |
| `animation-delay` | 延迟播放 | `0.2s` |
| `animation-iteration-count` | 播放次数 | `1`, `infinite`, `3` |
| `animation-direction` | 播放方向 | `normal`, `alternate`, `reverse` |
| `animation-fill-mode` | 填充模式 | `both`（开始前 + 结束后的状态保持） |
| `animation-play-state` | 播放状态 | `running`, `paused` |

### 2. 实用动画片段

```css
/* 骨架屏扫光 */
@keyframes shimmer {
  100% {
    background-position: 200% 0;
  }
}
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 旋转加载 */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 24px; height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* 渐入列表项（stagger 效果） */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
.list-item {
  animation: fadeInUp 0.3s ease both;
}
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
.list-item:nth-child(4) { animation-delay: 150ms; }
/* ...依此类推，形成逐个进入的 cascade 效果 */
```

## 三、缓动函数 (Easing)

| 缓动 | CSS 值 | 感觉 | 适用场景 |
| --- | --- | --- | --- |
| **ease** | `cubic-bezier(.25,.1,.25,1)` | 慢起步，中加速，慢结束 | 默认，广泛适用 |
| **ease-in** | `cubic-bezier(.42,0,1,1)` | 慢起步，渐加速 | 元素移出屏幕 |
| **ease-out** | `cubic-bezier(0,0,.58,1)` | 快起步，渐减速 | 元素进入屏幕 |
| **ease-in-out** | `cubic-bezier(.42,0,.58,1)` | 慢起慢落 | 循环动画 |
| **linear** | `cubic-bezier(0,0,1,1)` | 匀速 | 加载动画、进度条 |
| **spring** | 自定义 | 弹性回弹 | 微交互动效 |

```css
/* 自定义贝塞尔曲线工具: https://cubic-bezier.com */
.element {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* 轻微弹性效果，不夸张 */
}
```

## 四、性能：只动画 transform 和 opacity

::: danger 性能陷阱
==只在 `transform` 和 `opacity` 上做动画==。这两个属性不会触发重排（reflow）和重绘（repaint），只走 GPU 合成层。
:::

```css
/* ✅ 高性能 — 只触发 Composite */
.element {
  transition: transform 0.3s, opacity 0.3s;
}

/* ❌ 低性能 — 触发 Layout（重排） */
.element {
  transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s;
}

/* ❌ 低性能 — 触发 Paint（重绘） */
.element {
  transition: background-color 0.3s, box-shadow 0.3s;
}
```

### 1. 浏览器渲染流水线

```
JavaScript → Style → Layout → Paint → Composite
                             ↑        ↑         ↑
                           width   background  transform
                           height  box-shadow  opacity
                           top     border-color
                           left
```

::: tip 实际权衡
`background-color` 等 Paint-only 属性在短动画中也可以接受，但若同时动画多个元素，还是优先用 `transform` + `opacity`。
:::

## 五、Web Animations API（JS 动画）

原生 JS 动画 API，比 CSS animation 更灵活，比 `requestAnimationFrame` 更简洁。

```js
// 基本用法
const element = document.querySelector('.box')

const animation = element.animate(
  [
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(100px)', opacity: 0.5 },
  ],
  {
    duration: 1000,
    easing: 'ease-in-out',
    iterations: 1,
    fill: 'both',
    direction: 'alternate',
  }
)

// 动画控制
animation.pause()
animation.play()
animation.reverse()
animation.finish()  // 跳到结束状态
animation.cancel()  // 取消并清除效果

// 事件监听
animation.onfinish = () => { console.log('动画完成') }
animation.oncancel = () => { console.log('动画取消') }
```

### 1. 与 CSS 对比

| 特性 | CSS Animation | Web Animations API |
| --- | --- | --- |
| 声明式 | ✅ 简洁 | ❌ 需要写 JS |
| 动态参数 | ❌ 困难（需 CSS 变量） | ✅ 简单（JS 变量） |
| 暂停/恢复/反转 | 有限（`animation-play-state`） | ✅ 完整 API |
| 组合动画 | 需嵌套 `<div>` | ✅ 原生支持 |
| SSR 友好 | ✅ | 需要 `useEffect` 中调用 |

## 六、常用动画库

### 1. GSAP（专业级）

```bash
npm i gsap
```

```tsx
import { useRef, useEffect } from 'react'
import gsap from 'gsap'

function AnimatedBox() {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(boxRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  return <div ref={boxRef}>内容</div>
}
```

### 2. Framer Motion（React 首选）

```bash
npm i framer-motion
```

```tsx
import { motion, AnimatePresence } from 'framer-motion'

function AnimatedList({ items }: { items: string[] }) {
  return (
    <AnimatePresence>
      {items.map((item, i) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          {item}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

// 布局动画 — 自动平滑变形
<motion.div layout className="card">
  {/* 内容变化时自动做 Layout 过渡 */}
</motion.div>

// 手势动画
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag
  dragConstraints={{ left: 0, right: 200 }}
>
  可拖拽元素
</motion.div>
```

### 3. AutoAnimate（零配置，适合列表动画）

```bash
npm i @formkit/auto-animate
```

```tsx
import { useAutoAnimate } from '@formkit/auto-animate/react'

function TodoList() {
  const [parent] = useAutoAnimate()

  return (
    <ul ref={parent}>
      {/* 增删改列表项自动做动画 */}
      {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  )
}
```

### 4. VueUse Motion（Vue 动画）

```bash
npm i @vueuse/motion
```

```vue
<script setup>
import { vMotions } from '@vueuse/motion'

const list = ['项目1', '项目2', '项目3']
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 100 }"
    :enter="{ opacity: 1, y: 0, transition: { delay: 200 } }"
  >
    渐入内容
  </div>
</template>
```

## 七、动画原则（UX 视角）

| 原则 | 说明 |
| --- | --- |
| **快速** | UI 动画 200~300ms 为宜，不要让人"等动画" |
| **有意义** | 动画应传达信息（从哪里来、到哪里去） |
| **可跳过** | 尊重 `prefers-reduced-motion` 用户偏好 |
| **不打断** | 动画期间允许用户继续交互 |

```css
/* 尊重用户"减少动画"偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```js
// JS 中检测
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (prefersReducedMotion) {
  // 跳过动画，直接到最终状态
} else {
  // 正常动画
}
```

## 小结

动画的核心原则是 ==只在 `transform` 和 `opacity` 上做动画==——这两个属性走 GPU 合成层，不触发重排重绘。CSS Transition 适合简单的两态切换，CSS Animation 适合循环或多阶段动画，Web Animations API 适合需要动态控制的 JS 动画。生产项目中推荐使用 GSAP（专业级）或 Framer Motion（React 首选）等动画库提升开发效率。务必尊重 `prefers-reduced-motion` 用户偏好。

::: info 📖 参考
- [Web Animations API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API)
- [cubic-bezier.com](https://cubic-bezier.com/) — 贝塞尔曲线可视化
- [Easings.net](https://easings.net/) — 缓动函数速查
- [GSAP 文档](https://gsap.com/docs/v3/)
- [Framer Motion 文档](https://www.framer.com/motion/)
:::
