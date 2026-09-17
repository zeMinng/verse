# Intersection Observer

## 概要

[IntersectionObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API) 用于**异步监听目标元素与视口（或指定祖先元素）的交叉状态**。它是实现懒加载、无限滚动、曝光埋点的标准方案。

## 一、基本用法

```js
// 1. 创建观察器
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      // entry.isIntersecting → 元素是否进入视口
      // entry.intersectionRatio → 可见比例 (0~1)
      if (entry.isIntersecting) {
        console.log('元素进入视口:', entry.target)
        // 执行你的逻辑...
      }
    })
  },
  {
    root: null,           // null = 视口；可指定祖先元素
    rootMargin: '0px',    // 提前/延迟触发（类似 CSS margin）
    threshold: 0.1,       // 可见比例达到 10% 时触发
  }
)

// 2. 观察目标元素
observer.observe(document.querySelector('.target'))

// 3. 停止观察
observer.unobserve(element)   // 停止单个
observer.disconnect()         // 停止全部
```

## 二、实战场景

### 1. 图片懒加载

```html
<!-- 占位 -->
<img data-src="real-photo.jpg" src="placeholder.jpg" class="lazy" />
```

```js
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement
      img.src = img.dataset.src!        // 替换为真实图片
      img.onload = () => img.classList.add('loaded')
      imageObserver.unobserve(img)       // 加载后停止观察
    }
  })
}, {
  rootMargin: '200px',  // 提前 200px 开始加载
})

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img)
})
```

### 2. 无限滚动加载

```js
const sentinel = document.getElementById('scroll-sentinel')

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMoreItems()  // 加载下一页
    }
  })
}, {
  rootMargin: '100px',  // 距底部 100px 时触发
})

scrollObserver.observe(sentinel)
```

```html
<!-- 放在列表末尾作为"哨兵"元素 -->
<div id="scroll-sentinel" style="height: 1px;"></div>
```

### 3. 曝光埋点

```js
function trackImpression(element: Element, data: { id: string; type: string }) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 元素至少 50% 可见、持续 1 秒才计为有效曝光
        const timer = setTimeout(() => {
          sendAnalytics({
            event: 'impression',
            ...data,
            time: Date.now(),
          })
          observer.unobserve(entry.target)
        }, 1000)

        // 如果元素离开了，取消上报
        if (!entry.isIntersecting) {
          clearTimeout(timer)
        }
      }
    })
  }, {
    threshold: 0.5,  // 50% 可见
  })

  observer.observe(element)
}
```

### 4. 滚动动画（元素出现时触发动画）

```js
const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in')
      animationObserver.unobserve(entry.target)
    }
  })
}, {
  threshold: 0.15,
})

document.querySelectorAll('.reveal').forEach(el => {
  animationObserver.observe(el)
})
```

```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.animate-in {
  opacity: 1;
  transform: translateY(0);
}
```

### 5. 吸顶导航（Sticky Nav）

```js
const nav = document.querySelector('.nav')
const navSentinel = document.querySelector('.nav-sentinel')

const stickyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // sentinel 不再可见 → 导航已经滚过，需要吸顶
    nav.classList.toggle('is-sticky', !entry.isIntersecting)
  })
})

stickyObserver.observe(navSentinel)
```

### 6. 视频自动播放/暂停

```js
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target as HTMLVideoElement
    if (entry.isIntersecting) {
      video.play()
    } else {
      video.pause()
    }
  })
}, { threshold: 0.5 })

document.querySelectorAll('video').forEach(v => videoObserver.observe(v))
```

## 三、Vue 组合式函数封装

```ts
// composables/useIntersectionObserver.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useIntersectionObserver(
  target: Ref<Element | null>,
  options: IntersectionObserverInit = {},
  callback?: (entry: IntersectionObserverEntry) => void
) {
  const isIntersecting = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isIntersecting.value = entry.isIntersecting
        callback?.(entry)
      })
    }, options)

    observer.observe(target.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { isIntersecting }
}
```

```vue
<script setup>
import { ref } from 'vue'
import { useIntersectionObserver } from '@/composables/useIntersectionObserver'

const target = ref<HTMLDivElement | null>(null)
const { isIntersecting } = useIntersectionObserver(target, {
  threshold: 0.3,
})

watch(isIntersecting, (val) => {
  if (val) console.log('元素可见了')
})
</script>

<template>
  <div ref="target">被观察的元素</div>
  <span>{{ isIntersecting ? '可见' : '不可见' }}</span>
</template>
```

## 四、React Hook 封装

```tsx
// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, isIntersecting }
}
```

## 五、与 scroll 事件对比

| 对比维度 | IntersectionObserver | scroll 事件 |
| --- | --- | --- |
| 性能 | ✅ 异步，浏览器原生优化 | ❌ 必须节流/防抖，仍会触发重排 |
| 代码量 | 少，语义清晰 | 多，需手动计算位置 |
| 离屏 iframe | ✅ 仍能检测 | ❌ 无法触发 |
| 浏览器支持 | 95%+ | 100% |

```js
// ❌ 传统方式：scroll 事件监听
window.addEventListener('scroll', () => {
  const rect = element.getBoundingClientRect()
  if (rect.top < window.innerHeight) {
    // 元素可见
  }
  // ↑ 每次滚动都执行，且 getBoundingClientRect 触发重排
})

// ✅ IntersectionObserver
const observer = new IntersectionObserver(entries => {
  // 只在交叉状态变化时回调
})
```

## 小结

`IntersectionObserver` 是 ==懒加载==、==无限滚动==、==曝光埋点== 等场景的标准方案，对比传统的 `scroll` 事件具有显著的性能优势。核心配置参数 `threshold`（可见比例）和 `rootMargin`（提前量）覆盖了大多数实战场景，结合 Vue/React Hook 封装可以进一步提升开发效率。

::: info 📖 参考
- [Intersection Observer - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)
- [Intersection Observer 实战技巧](https://web.dev/articles/intersectionobserver)
:::
