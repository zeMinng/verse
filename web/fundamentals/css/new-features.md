# CSS 新特性

## 概要

CSS 近年来的发展速度远超预期，许多以前需要 JavaScript 才能实现的功能，现在用纯 CSS 就能完成。本文聚焦于已获得良好浏览器支持的现代 CSS 特性。

## 一、`:has()` 选择器 — 父选择器

`:has()` 被称为"CSS 的父选择器"，可以根据**子元素状态**选择父元素。

```css
/* 1. 当卡片包含图片时，改变布局 */
.card:has(img) {
  grid-template-columns: 200px 1fr;
}

/* 2. 当 input 聚焦时，改变其父容器样式 */
.form-group:has(input:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 3. 当包含空状态时显示不同样式 */
.list:has(:empty) {
  display: none; /* 列表为空则隐藏 */
}
.list:has(:empty) + .empty-state {
  display: block; /* 显示空状态提示 */
}

/* 4. 当相邻元素是特定类型时 */
h2:has(+ p) {
  margin-bottom: 4px; /* h2 后面紧跟 p 时，减小间距 */
}
```

### 1. 实战：星级评分组件

```html
<div class="rating">
  <input type="radio" name="star" value="5" />
  <input type="radio" name="star" value="4" />
  <input type="radio" name="star" value="3" />
  <input type="radio" name="star" value="2" />
  <input type="radio" name="star" value="1" />
</div>
```

```css
.rating:has(input:checked) {
  /* 有选中项时改变容器状态 */
}

.rating:has(input[value="5"]:checked) {
  --rating-color: gold;
}
```

## 二、Container Queries — 容器查询

传统 `@media` 查询的是**视口宽度**，Container Queries 查询的是**父容器宽度**，真正实现组件级响应式。

```css
/* 1. 声明容器 */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 2. 根据容器宽度调整样式（而非视口！） */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 150px 1fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
  .card-image {
    width: 100%;
  }
}
```

### 1. 实际效果

```
同一个 .card 组件：
├── 放在侧边栏 (250px) → 竖排布局（@container max-width: 399px）
├── 放在主内容区 (600px) → 横排布局（@container min-width: 400px）
└── 放在全宽区域 (1200px) → 三列布局（@container min-width: 800px）...（自行扩展）
```

### 2. 使用 Container Query 长度单位

```css
/* cqw = 容器宽度的 1% */
.card-title {
  font-size: clamp(1rem, 5cqw, 2rem);
}

/* cqi = 容器内联尺寸的 1%（与书写模式无关） */
.sidebar {
  width: 30cqi;
}
```

## 三、`@layer` — 样式层级

`@layer` 让你**显式控制**样式声明的优先级，告别 `!important` 和选择器权重战争。

```css
/* 定义层级（越后优先级越高） */
@layer reset, base, components, utilities;

/* reset 层 — 最低优先级 */
@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

/* base 层 */
@layer base {
  body { font-family: system-ui; }
  a { color: blue; }
}

/* components 层 */
@layer components {
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
  }
}

/* utilities 层 — 最高优先级，但无需 !important */
@layer utilities {
  .mt-0 { margin-top: 0; }  /* 即使在 components 之后定义其他类，这里也能覆盖 */
}
```

::: tip `@layer` 的核心优势
在 @layer 中，==层级本身== 决定优先级，而**不是选择器的具体权重**。低层级中的 `#id` 选择器也覆盖不了高层级中的 `.class` 选择器。这让样式的优先级变得可预测。
:::

## 四、CSS Nesting — 原生嵌套

CSS 现在原生支持类似 Sass 的嵌套语法。

```css
/* ✅ 原生 CSS 嵌套 */
.card {
  background: white;
  border-radius: 8px;

  /* 直接嵌套子元素（等同于 .card .title） */
  & .title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* & 代表父选择器（等同于 .card:hover） */
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.1);
  }

  /* 嵌套媒体查询 */
  @media (width >= 768px) {
    padding: 24px;
  }

  /* 复杂嵌套 */
  .header & {
    /* 等同于 .header .card */
    margin-top: 0;
  }
}
```

::: warning 注意
- 嵌套不能以**元素选择器/标签名**开头（如 `p { }` 直接嵌套），需要用 `& p`
- 嵌套层级不建议超过 3 层，否则可读性下降
:::

## 五、`:focus-visible` — 智能聚焦

```css
/* ❌ :focus — 鼠标点击也会出现蓝色轮廓 */
button:focus {
  outline: 2px solid blue;
}

/* ✅ :focus-visible — 只在键盘导航时显示 */
button:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}

/* 全局使用 */
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 2px;
}
```

## 六、CSS Scroll-Driven Animations

滚动驱动的动画，无需 JavaScript 监听 scroll 事件。

```css
/* 根据滚动进度旋转元素（类似 Apple 产品页效果） */
.hero-image {
  animation: rotate-hero linear;
  animation-timeline: scroll();  /* 绑定到滚动 */
}

@keyframes rotate-hero {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 元素进入/离开视口时播放 */
.reveal {
  animation: fade-in linear;
  animation-timeline: view();
  animation-range: entry 0% entry 100%; /* 从进入视口开始到完全进入 */
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

::: tip
Chrome 115+ 已支持 Scroll-Driven Animations。对于 Firefox/Safari，需要渐进增强。
:::

## 七、View Transitions API

页面/元素间的平滑过渡动画，无需第三方库。

```js
// 1. 页面级过渡（MPA 切换）
document.startViewTransition(() => {
  // 更新 DOM
  updateTheDOMSomehow()
})

// 2. 指定过渡元素（同一个元素在不同页面中平滑变形）
// page1.html
<img src="thumb.jpg" style="view-transition-name: hero-image" />

// page2.html
<img src="full.jpg" style="view-transition-name: hero-image" />
// ↑ 相同 view-transition-name 的元素之间自动创建变形动画
```

```css
/* 自定义过渡动画 */
::view-transition-old(root) {
  animation: fade-out 0.3s ease;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease;
}
```

## 八、`color-mix()` 和 `light-dark()`

```css
/* color-mix: 混合两种颜色 */
.button {
  background: color-mix(in srgb, blue 10%, transparent);
  /* 10% 蓝色 + 90% 透明 = 浅蓝色 */
}

.button:hover {
  background: color-mix(in srgb, blue 20%, transparent);
  /* hover 时加深到 20% */
}

/* light-dark: 根据 color-scheme 自动切换 */
.card {
  background: light-dark(#fff, #1a1a1a);
  color: light-dark(#333, #eee);
  /* 亮色模式下背景白字黑，暗色模式下背景黑字白 */
}
```

## 九、`@starting-style` — 初始状态动画

```css
/* 定义元素"首次出现"时的起始状态 */
.popover {
  /* 最终状态 */
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.3s, transform 0.3s;
}

@starting-style {
  .popover {
    opacity: 0;
    transform: scale(0.9);
  }
}
/* ↓ popover 首次渲染时从 @starting-style 过渡到最终状态 */
```

## 十、浏览器兼容速查

| 特性 | Chrome | Firefox | Safari |
| --- | --- | --- | --- |
| `:has()` | 105+ | 121+ | 15.4+ |
| Container Queries | 105+ | 110+ | 16.0+ |
| `@layer` | 99+ | 97+ | 15.4+ |
| CSS Nesting | 120+ | 117+ | 17.2+ |
| `:focus-visible` | 86+ | 85+ | 15.4+ |
| Scroll-Driven Animations | 115+ | ❌ | ❌ |
| View Transitions API | 111+ | ❌ | 18.0+ |
| `color-mix()` | 111+ | 113+ | 16.2+ |

## 小结

CSS 近年来的进化远超预期：==`:has()` 选择器== 填补了"父选择器"的长期空白，==Container Queries== 让组件级响应式成为可能，==`@layer`== 彻底解决了优先级战争，==CSS Nesting== 让原生 CSS 拥有了 Sass 的便利。Scroll-Driven Animations 和 View Transitions API 则为动画体验打开了新的大门。使用前注意检查各特性的浏览器兼容性（通过 Can I Use），做好渐进增强。

::: info 📖 参考
- [Modern CSS](https://moderncss.dev/) — 现代 CSS 教程合集
- [CSS-Tricks](https://css-tricks.com/) — CSS 技巧与文章
- [Can I Use](https://caniuse.com/) — 浏览器兼容性查询
:::
