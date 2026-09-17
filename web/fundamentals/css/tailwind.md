# Tailwind CSS

## 概要

[Tailwind CSS](https://tailwindcss.com/) 是当前最流行的**实用优先（Utility-First）** CSS 框架。与 Bootstrap 等组件框架不同，Tailwind 提供大量原子化 class，让你直接在 HTML 中组合出任意设计，而不是写自定义 CSS。

## 一、核心概念

### 1. Utility-First 思维

```html
<!-- ✅ Tailwind：直接用工具体类组合 -->
<div class="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <img class="w-12 h-12 rounded-full" src="avatar.jpg" />
  <div>
    <h3 class="text-lg font-semibold text-gray-900">用户名</h3>
    <p class="text-sm text-gray-500">描述信息</p>
  </div>
</div>

<!-- ❌ 传统方式：需要写自定义 CSS -->
<div class="user-card">
  <img class="user-avatar" src="avatar.jpg" />
  <div>
    <h3 class="user-name">用户名</h3>
    <p class="user-desc">描述信息</p>
  </div>
</div>
```

### 2. 设计约束

Tailwind 默认使用一套**有约束的设计系统**：

```
间距: 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 8(32px)...
颜色: slate, gray, zinc, red, orange, blue, green...  (50 ~ 950)
字号: xs(12px), sm(14px), base(16px), lg(18px), xl(20px)...
圆角: sm(2px), md(6px), lg(8px), xl(12px), 2xl(16px), full(9999px)
```

好处：团队不再争论 "padding 用 13px 还是 14px"，统一使用设计系统。

## 二、安装与配置

### 1. Vite + Tailwind CSS

```bash
npm i -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

```css
/* 主 CSS 文件只一行 */
@import "tailwindcss";
```

### 2. 自定义主题

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --font-display: "Geist", sans-serif;
  --breakpoint-3xl: 1920px;
}
```

```html
<!-- 使用自定义值 -->
<button class="bg-primary font-display">按钮</button>
<div class="max-w-3xl">内容</div>
```

## 三、常用模式速查

### 1. 布局

```html
<!-- Flex 居中 -->
<div class="flex items-center justify-center h-screen">
  <div>居中内容</div>
</div>

<!-- Grid 响应式卡片 -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="p-4 bg-white rounded-lg">卡片1</div>
  <div class="p-4 bg-white rounded-lg">卡片2</div>
  <div class="p-4 bg-white rounded-lg">卡片3</div>
</div>

<!-- 固定侧边栏 + 自适应内容 -->
<div class="flex h-screen">
  <aside class="w-64 bg-gray-800 text-white">侧边栏</aside>
  <main class="flex-1 overflow-auto">内容区</main>
</div>

<!-- Container 居中 -->
<div class="container mx-auto px-4">
  内容（响应式最大宽度 + 居中 + 水平内边距）
</div>
```

### 2. 响应式

```html
<!-- 响应式断点：sm(640) md(768) lg(1024) xl(1280) 2xl(1536) -->
<div class="
  text-sm          /* 手机 */
  md:text-base     /* 平板 */
  lg:text-lg       /* 桌面 */
">
  响应式文字
</div>

<!-- 响应式显示/隐藏 -->
<div class="hidden md:block">平板上才显示</div>
<div class="block md:hidden">手机上才显示</div>

<!-- 响应式网格 -->
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
```

### 3. 状态变体

```html
<!-- hover / focus / active / disabled -->
<button class="
  bg-blue-500
  hover:bg-blue-600      /* 悬停变色 */
  focus:ring-2            /* 聚焦时出现环形边框 */
  active:scale-95         /* 点击时缩小 */
  disabled:opacity-50      /* 禁用时半透明 */
  transition-all duration-200
">
  提交
</button>

<!-- group — 父元素悬停时改变子元素 -->
<div class="group p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
  <h3 class="group-hover:text-blue-600 transition-colors">标题</h3>
  <p class="text-gray-500">描述</p>
</div>

<!-- peer — 兄弟元素状态联动 -->
<label>
  <input type="checkbox" class="peer sr-only" />
  <span class="peer-checked:text-blue-500">选中时变蓝</span>
</label>
```

### 4. 深色模式

```html
<!-- class 策略（手动切换） -->
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-gray-900 dark:text-white">标题</h1>
</div>
```

```ts
// tailwind.config 需设置
// (v4 默认使用 media 策略，class 策略需要手动切换)
```

## 四、处理重复样式

当 class 组合过多次出现时，有几种处理方式：

### 1. 提取为组件（推荐）

```tsx
// React/Vue 组件化天然解决重复
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
      {children}
    </div>
  )
}
```

### 2. 使用 @apply（慎用）

```css
/* input.css */
.btn-primary {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg
         hover:bg-blue-600 focus:ring-2 focus:ring-blue-300
         transition-all duration-200;
}
```

::: warning
`@apply` 违背了 Tailwind "样式就近维护"的理念。优先用组件化，只在确实无法组件化（如重复的 Markdown 内容样式）时才用 `@apply`。
:::

### 3. 使用 clsx / cn 工具函数

```ts
// utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```tsx
// 动态合并 class，自动解决冲突
<button className={cn(
  'px-4 py-2 rounded-lg',
  variant === 'primary' && 'bg-blue-500 text-white',
  variant === 'secondary' && 'bg-gray-200 text-gray-800',
  disabled && 'opacity-50 pointer-events-none',
)}>
```

## 五、常用 Tailwind 插件

| 插件 | 用途 |
| --- | --- |
| **@tailwindcss/typography** | Markdown 内容样式（`prose` class） |
| **@tailwindcss/forms** | 美化表单元素默认样式 |
| **@tailwindcss/container-queries** | Container Queries 支持 |
| **tailwindcss-animate** | 提供丰富的动画预设 |
| **prettier-plugin-tailwindcss** | 自动排序 class 名称 |

```bash
npm i -D @tailwindcss/typography @tailwindcss/forms prettier-plugin-tailwindcss
```

### 1. Typography 插件（文档/博客必备）

```html
<!-- 对 Markdown 渲染的内容自动排版 -->
<article class="prose prose-slate lg:prose-lg max-w-none
  prose-headings:font-semibold
  prose-a:text-blue-600
  prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
  prose-pre:bg-gray-900">
  <!-- 你的 Markdown 内容 -->
</article>
```

## 六、与 VitePress 的协作

VitePress 默认不带 Tailwind，但可以集成：

```bash
npm i -D tailwindcss @tailwindcss/vite
```

```ts
// .vitepress/config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
})
```

```css
/* .vitepress/theme/custom.css */
@import "tailwindcss";

/* 只在特定区域使用 Tailwind，避免与 VitePress 默认样式冲突 */
.tailwind-container {
  @apply p-4;
  /* 在这里使用 Tailwind class */
}
```

```md
<!-- 在 Markdown 中使用 -->
<div class="tailwind-container">
  <div class="grid grid-cols-3 gap-4">
    <div class="p-4 bg-blue-50 rounded-lg">卡片 1</div>
    <div class="p-4 bg-blue-50 rounded-lg">卡片 2</div>
    <div class="p-4 bg-blue-50 rounded-lg">卡片 3</div>
  </div>
</div>
```

## 七、Tailwind v4 新变化

Tailwind CSS v4（2025 年初发布）带来了重大改进：

| 变化 | v3 | v4 |
| --- | --- | --- |
| 配置方式 | `tailwind.config.js` | CSS-first 配置 (`@theme`) |
| 安装方式 | PostCSS 插件 | Vite 插件（`@tailwindcss/vite`） |
| 性能 | OK | 大幅提升（Rust 引擎） |
| CSS 层级 | 手动 `@layer` | 自动处理 |
| 暗色模式 | 手动配置 | 自动支持 |

## 小结

Tailwind CSS 的 ==Utility-First== 理念通过原子化 class 组合出任意设计，避免了传统"命名→写 CSS"的上下文切换。核心优势：设计系统约束（间距、颜色、字号的一致性）、响应式前缀（`sm:`/`lg:` 等）、状态变体（`hover:`/`focus:` 等）。处理重复样式时优先使用组件化而非 `@apply`，配合 `clsx` + `tailwind-merge` 优雅处理动态 class。v4 版本转向 CSS-first 配置和 Vite 插件，性能大幅提升。

::: info 📖 参考
- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Tailwind CSS 中文文档](https://tailwind.nodejs.cn/)
- [Tailwind v4 升级指南](https://tailwindcss.com/docs/v4-beta)
:::
