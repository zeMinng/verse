# Web API / 浏览器能力

## 概要

现代浏览器提供了大量内置 API，许多以前需要第三方库的能力现在可以原生实现。本文系统梳理前端开发中最实用的 Web API，帮助你用更少的依赖实现更多功能。

## API 分类总览

```
浏览器能力全景
├── DOM 观察者
│   ├── IntersectionObserver  → 可见性检测（懒加载、曝光埋点）
│   ├── MutationObserver      → DOM 变化监听
│   └── ResizeObserver        → 元素尺寸监听
│
├── 多线程与离线
│   ├── Web Worker            → 后台计算线程
│   └── Service Worker        → 离线缓存、PWA
│
├── 存储方案
│   ├── localStorage / sessionStorage
│   ├── IndexedDB             → 结构化大数据存储
│   └── Cache API             → 请求缓存
│
├── 用户交互
│   ├── Clipboard API         → 剪贴板读写
│   ├── Notification API      → 桌面通知
│   └── Fullscreen API        → 全屏控制
│
└── 设备能力
    ├── Geolocation API       → 地理位置
    ├── Battery Status API    → 电池状态
    └── Screen Wake Lock      → 屏幕常亮
```

## 内容导航

| 文档 | 内容 |
| --- | --- |
| [Intersection Observer](./intersection-observer) | 元素可见性检测、懒加载、曝光埋点 |
| [Resize Observer](./resize-observer) | 元素尺寸监听、响应式组件 |
| [Web Worker](./web-worker) | 后台线程、CPU 密集型计算 |
| [Service Worker](./service-worker) | 离线缓存、PWA 渐进式应用 |
| [Clipboard API](./clipboard) | 剪贴板读写、一键复制 |
| [Notification API](./notification) | 桌面通知推送 |
| [存储方案对比](./storage) | localStorage / IndexedDB / Cache API 选型 |

## 小结

本文梳理了浏览器提供的核心 Web API 能力，涵盖 DOM 观察者、多线程、存储方案和用户交互四大类。这些 API 均无需安装第三方依赖，使用前注意检查 `'apiName' in window` 做兼容降级，大部分需要 HTTPS 或 localhost 环境。

::: tip 使用建议
- 这些 API 均无需安装任何 npm 包
- 大部分 API 需要 HTTPS 或 localhost 环境下使用
- 始终检查 `if ('apiName' in window)` 再做兼容降级
:::
