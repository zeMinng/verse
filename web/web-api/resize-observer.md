# Resize Observer

## 概要

[ResizeObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver) 用于**监听元素尺寸变化**。不同于 `window.resize` 只监听视口变化，ResizeObserver 可以监听任意 DOM 元素的宽高变化。

## 一、基本用法

```js
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect
    console.log(`元素:`, entry.target)
    console.log(`新尺寸: ${width}px × ${height}px`)
    
    // contentBoxSize 更精确（支持 sub-pixel）
    const boxSize = entry.contentBoxSize[0]
    console.log(`精确: ${boxSize.inlineSize}px × ${boxSize.blockSize}px`)
  })
})

observer.observe(document.querySelector('.resizable'))
```

## 二、实战场景

### 1. 响应式组件（替代 Container Queries 的降级方案）

```js
const cardObserver = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const width = entry.contentRect.width
    const card = entry.target
    
    if (width < 300) {
      card.classList.add('card--compact')
    } else if (width > 600) {
      card.classList.add('card--wide')
    } else {
      card.classList.remove('card--compact', 'card--wide')
    }
  })
})

document.querySelectorAll('.card-wrapper').forEach(el => {
  cardObserver.observe(el)
})
```

### 2. 自适应文本截断

```js
function autoTruncate(element: HTMLElement) {
  const fullText = element.dataset.fullText || element.textContent
  element.dataset.fullText = fullText!

  const observer = new ResizeObserver(() => {
    const availableHeight = element.clientHeight
    element.textContent = fullText
    
    // 逐字减少直到适合容器
    while (element.scrollHeight > availableHeight && element.textContent!.length > 3) {
      element.textContent = element.textContent!.slice(0, -4) + '...'
    }
  })

  observer.observe(element)
}
```

### 3. 保持 iframe 高度自适应

```js
// 嵌入的 iframe 内容高度变化时自动调整
const iframe = document.querySelector('iframe')

const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // iframe 内 body 高度变化 → 调整 iframe 高度
    iframe.style.height = entry.contentRect.height + 'px'
  }
})

// 注意：需要 iframe 同源才能访问内部 DOM
iframe.onload = () => {
  ro.observe(iframe.contentDocument!.body)
}
```

### 4. 图表自适应重绘

```ts
import * as echarts from 'echarts'

function useResponsiveChart(container: HTMLElement) {
  const chart = echarts.init(container)

  const observer = new ResizeObserver(() => {
    chart.resize()  // 容器尺寸变化时图表自动适配
  })
  observer.observe(container)

  return () => {
    observer.disconnect()
    chart.dispose()
  }
}
```

### 5. 检测滚动条出现/消失

```js
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const hasScrollbar = entry.target.scrollHeight > entry.target.clientHeight
    // 滚动条出现 → 调整 padding 避免内容跳动
    entry.target.style.paddingRight = hasScrollbar ? '17px' : '0'
  })
})

observer.observe(document.body)
```

## 三、与 window.resize 对比

| 特性 | ResizeObserver | window.resize |
| --- | --- | --- |
| 监听对象 | 任意 DOM 元素 | 仅浏览器视口 |
| 触发时机 | 元素尺寸变化 | 视口变化 |
| 精度 | sub-pixel (contentBoxSize) | 整数像素 |
| 性能 | ✅ 浏览器原生优化 | ✅ 但也有节流 |
| 常用场景 | 组件级响应、图表适配 | 全局布局切换 |

## 四、注意点

::: warning 循环限制
如果回调中修改了被观察元素的尺寸，会触发**无限循环**。ResizeObserver 会抛出 `ResizeObserver loop limit exceeded` 错误并停止。应避免在回调中改变同一元素的尺寸。
:::

```js
// ❌ 危险：回调节器中修改同一元素尺寸
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    entry.target.style.width = '100px'  // 会触发新的回调！
  })
})

// ✅ 正确：用条件判断避免循环
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const currentWidth = entry.contentRect.width
    if (Math.abs(currentWidth - targetWidth) > 1) {
      // 只在差异超过 1px 时才调整
      entry.target.style.width = targetWidth + 'px'
    }
  })
})
```

## 小结

`ResizeObserver` 是监听任意 DOM 元素尺寸变化的标准 API，常用于 ==响应式组件==、==图表自适应==、==文本截断== 等场景。使用时需注意**避免在回调中修改同一元素尺寸**，防止触发无限循环。与 `window.resize` 相比，ResizeObserver 支持精确到 sub-pixel 级别的尺寸监听，适用于组件级响应式设计。

::: info 📖 参考
- [ResizeObserver - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver)
:::
