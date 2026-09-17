# 图片优化

## 概要

图片通常占据页面总下载量的 **50% ~ 75%**，是 Web 性能优化的最大杠杆点。选择合适的格式、压缩策略和加载方式可以显著改善用户体验。

## 一、图片格式选型

| 格式 | 压缩类型 | 透明度 | 动画 | 适用场景 | 浏览器兼容 |
| --- | --- | --- | --- | --- | --- |
| **JPEG** | 有损 | ❌ | ❌ | 照片 | 所有 |
| **PNG** | 无损 | ✅ | ❌ | Logo、图标 | 所有 |
| **WebP** | 有损+无损 | ✅ | ✅ | 通用（体积比 JPEG 小 25%~35%） | 97%+ |
| **AVIF** | 有损+无损 | ✅ | ✅ | 照片（体积比 WebP 更小） | 93%+ |
| **SVG** | 矢量 | ✅ | ✅ | 图标、插图 | 所有 |
| **GIF** | 有损 | ✅ | ✅ | 简单动画（已被视频取代） | 所有 |

### 1. 推荐的格式降级策略

```html
<!-- 渐进增强：优先 AVIF，回退 WebP，最终 JPEG -->
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="照片" loading="lazy" />
</picture>
```

### 2. 使用 sharp 批量转换（Node.js）

```bash
npm i sharp
```

```js
// convert.mjs — 批量转换图片格式
import sharp from 'sharp'
import { readdir } from 'fs/promises'

const INPUT = './images/raw'
const OUTPUT = './images/optimized'

const files = await readdir(INPUT)
for (const file of files) {
  const name = file.replace(/\.[^.]+$/, '')
  
  // 转 WebP
  await sharp(`${INPUT}/${file}`)
    .webp({ quality: 80 })
    .toFile(`${OUTPUT}/${name}.webp`)
  
  // 转 AVIF
  await sharp(`${INPUT}/${file}`)
    .avif({ quality: 50 })  // AVIF 默认质量更低但效果不差
    .toFile(`${OUTPUT}/${name}.avif`)
  
  console.log(`✓ ${file} → ${name}.webp + ${name}.avif`)
}
```

## 二、响应式图片

### 1. srcset + sizes

```html
<img
  src="photo-800w.jpg"
  srcset="
    photo-400w.jpg   400w,
    photo-800w.jpg   800w,
    photo-1200w.jpg 1200w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
  alt="响应式图片"
/>
```

> 浏览器会根据屏幕宽度和 DPR 自动选择最合适的图片。

### 2. 生成多尺寸图片

```js
// generate-sizes.mjs
import sharp from 'sharp'

const SIZES = [400, 800, 1200]

async function generateResponsiveImages(inputPath) {
  const name = inputPath.replace(/\.[^.]+$/, '')
  
  for (const width of SIZES) {
    await sharp(inputPath)
      .resize(width)
      .webp({ quality: 80 })
      .toFile(`${name}-${width}w.webp`)
  }
}
```

## 三、图片懒加载

### 1. 原生懒加载（推荐）

```html
<!-- loading="lazy" 兼容 92%+ 浏览器 -->
<img src="photo.jpg" loading="lazy" alt="懒加载图片" />

<!-- eager（默认）：立即加载 -->
<!-- lazy：视口接近时加载 -->
```

### 2. Intersection Observer 手动实现

```js
// 需要更精细控制的场景
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target
      img.src = img.dataset.src         // 从 data-src 替换真实 src
      img.classList.remove('lazy')
      observer.unobserve(img)           // 加载完成后停止观察
    }
  })
}, {
  rootMargin: '200px',  // 提前 200px 开始加载
})

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img)
})
```

```html
<img data-src="real-photo.jpg" src="placeholder.svg" class="lazy" />
```

### 3. Vue 图片懒加载指令

```ts
// directives/lazyLoad.ts
import type { Directive } from 'vue'

export const vLazyLoad: Directive = {
  mounted(el: HTMLImageElement, binding) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.src = binding.value
        observer.unobserve(el)
      }
    }, { rootMargin: '100px' })
    observer.observe(el)
  },
}
```

```vue
<img v-lazy-load="imageUrl" alt="懒加载" />
```

## 四、图片 CDN 服务

使用图片 CDN 可以在 URL 参数中动态指定尺寸、格式、质量：

```
# Cloudinary
https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,q_auto,f_auto/sample.jpg

# imgix
https://demo.imgix.net/photo.jpg?w=400&h=300&fit=crop&auto=format

# Cloudflare Images
https://imagedelivery.net/abc123/photo.jpg/w=400,h=300,fit=crop
```

## 五、Vite 图片处理插件

```bash
npm i -D vite-plugin-imagemin
```

```ts
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      webp: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
    }),
  ],
})
```

## 六、CSS 中的图片优化

```css
/* 使用 image-set 适配 DPR */
.hero {
  background-image: image-set(
    url("hero-1x.webp") 1x,
    url("hero-2x.webp") 2x
  );
}

/* 渐进式加载：先用模糊占位再替换高清 */
.hero {
  background-image: url("hero-thumb.jpg");   /* 小体积缩略图 */
  background-size: cover;
  filter: blur(20px);
  transition: filter 0.3s;
}
.hero.loaded {
  background-image: url("hero-full.webp");   /* 高清原图 */
  filter: blur(0);
}
```

## 七、图片优化的构建集成

```ts
// 在 VitePress 项目中处理图片
// 建议采用以下工作流：
// 1. 原始图片放入 public/raw/
// 2. 构建前运行优化脚本生成 public/img/
// 3. 在 Markdown 中引用优化后的路径

// 示例：构建脚本
// scripts/optimize-images.mjs
import sharp from 'sharp'
import { glob } from 'glob'

const images = await glob('public/raw/**/*.{jpg,png}')
for (const img of images) {
  const outPath = img.replace('raw/', 'img/').replace(/\.(jpg|png)$/, '.webp')
  await sharp(img).webp({ quality: 80 }).toFile(outPath)
}
```

::: tip 图片优化清单
- [ ] 优先使用 WebP/AVIF 格式
- [ ] 使用 `<picture>` + `<source>` 做格式降级
- [ ] 所有 `<img>` 添加 `loading="lazy"`（除首屏关键图片）
- [ ] 提供 `srcset` 适配不同屏幕
- [ ] 构建时自动压缩图片
- [ ] 首屏 hero 图使用 `preload`
- [ ] GIF 动画改用 `<video>` 标签
:::

## 小结

图片通常占页面总下载量的 50%~75%，是性能优化的最大杠杆。核心策略包括：==优先使用 WebP/AVIF 现代格式==、通过 `<picture>` 做格式降级、使用 `loading="lazy"` 延迟非首屏图片、为响应式场景提供 `srcset`。对于需要大量图片的项目，建议在构建时用 `sharp` 自动化压缩转换，配合图片 CDN 服务实现动态裁剪和格式优化。

::: info 📖 参考
- [web.dev - 图片优化指南](https://web.dev/fast/#optimize-your-images)
- [sharp 文档](https://sharp.pixelplumbing.com/)
- [Responsive Images 101](https://cloudfour.com/thinks/responsive-images-101-definitions/)
:::
