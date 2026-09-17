# Web 性能优化

## 概要

Web 性能优化是前端开发的核心竞争力之一。页面加载速度直接影响用户体验、转化率和搜索引擎排名。本文档系统梳理 Web 性能优化的核心知识和实战技巧。

## 一、性能指标体系

### 1. Core Web Vitals（核心网页指标）

| 指标 | 含义 | 良好标准 |
| --- | --- | --- |
| **LCP** (Largest Contentful Paint) | 最大内容绘制 | ≤ 2.5s |
| **INP** (Interaction to Next Paint) | 交互到下次绘制（替代 FID） | ≤ 200ms |
| **CLS** (Cumulative Layout Shift) | 累积布局偏移 | ≤ 0.1 |

### 2. 其他重要指标

| 指标 | 含义 |
| --- | --- |
| **FCP** (First Contentful Paint) | 首次内容绘制 |
| **TTFB** (Time to First Byte) | 首字节时间 |
| **TTI** (Time to Interactive) | 可交互时间 |
| **TBT** (Total Blocking Time) | 总阻塞时间 |
| **Speed Index** | 速度指数 |

## 二、优化策略总览

```
首屏加载优化
├── 资源体积优化 → 代码分割、Tree Shaking、压缩
├── 网络传输优化 → CDN、HTTP2/3、预加载
├── 资源加载策略 → 懒加载、预加载、优先级
└── 渲染优化 → SSR/SSG、骨架屏、关键CSS

运行时性能优化
├── 渲染性能 → 减少重排重绘、虚拟列表
├── 交互性能 → 防抖节流、Web Worker
└── 内存管理 → 避免内存泄漏、及时清理
```

## 三、快速检查清单

- [ ] 生产环境启用 gzip/Brotli 压缩
- [ ] 图片使用 WebP/AVIF 格式，并做懒加载
- [ ] JS/CSS 文件经过 minify + Tree Shaking
- [ ] 关键资源使用 preload/prefetch
- [ ] 静态资源部署到 CDN
- [ ] 启用 HTTP/2 或 HTTP/3
- [ ] 非首屏组件使用代码分割 + 懒加载
- [ ] 避免强制同步布局（layout thrashing）
- [ ] 使用 Lighthouse / PageSpeed Insights 定期审计

## 小结

Web 性能优化围绕 ==首屏加载== 和 ==运行时交互== 两条主线展开。首屏优化从资源体积、网络传输、加载策略和渲染四个维度入手；运行时优化聚焦于渲染性能、交互响应和内存管理。Core Web Vitals（LCP、INP、CLS）是衡量优化效果的核心指标，建议使用 Lighthouse 定期审计并结合 CI 持续监控。

::: info 📖 相关资源
- [web.dev](https://web.dev/) - Google Web 性能官方指南
- [PageSpeed Insights](https://pagespeed.web.dev/) - 在线性能检测
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome 性能审计工具
:::
