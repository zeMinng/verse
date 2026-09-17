# Bundle 分析与优化

## 概要

Bundle 分析是找出打包产物体积瓶颈的关键手段。通过可视化工具定位哪些模块体积过大、哪些依赖重复打包，然后有针对性地优化。

## 一、分析工具对比

| 工具 | 适用构建工具 | 特点 |
| --- | --- | --- |
| **rollup-plugin-visualizer** | Vite / Rollup | 可视化 treemap，最常用 |
| **webpack-bundle-analyzer** | Webpack | 老牌工具，功能完善 |
| **source-map-explorer** | 通用 | 基于 source map 分析 |
| **vite-plugin-inspect** | Vite | 查看中间产物和转换过程 |
| **bundlemon** | 通用 | CI 中监控 bundle 大小变化 |

## 二、rollup-plugin-visualizer（Vite）

### 1. 安装与配置

```bash
npm i -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',   // 输出文件
      open: true,                     // 构建后自动打开
      gzipSize: true,                 // 显示 gzip 大小
      brotliSize: true,               // 显示 brotli 大小
      template: 'treemap',            // treemap | sunburst | network
    }),
  ],
})
```

### 2. 读懂 Treemap

```
┌──────────────────────────────────────────────┐
│  react-dom (120KB)                           │
│  ┌──────────────┬───────────────────────────┐│
│  │ react (8KB)  │  dayjs (17KB)             ││
│  ├──────────────┴──────────┬────────────────┤│
│  │  lodash (70KB)          │  antd (200KB)  ││
│  │                         │                ││
│  └─────────────────────────┴────────────────┘│
└──────────────────────────────────────────────┘
 ↑ 面积越大 = 体积占比越高，优先优化
```

### 3. 常见问题与修复

| 问题 | 现象 | 修复 |
| --- | --- | --- |
| **Moment.js 太大** | locale 文件全被打包 | 换 dayjs，或用 webpack 的 `IgnorePlugin` |
| **lodash 全量引入** | treemap 中 lodash 占比大 | 改用 `lodash-es` + tree shaking |
| **重复的依赖版本** | 同一个库出现多次 | `npm dedupe` 或在 pnpm 中配置 `overrides` |
| **未压缩的 sourcemap** | `.map` 文件在 dist 里 | 生产构建关闭 sourcemap 或使用 hidden 模式 |
| **字体文件过大** | .ttf 文件被打包 | 改用 woff2 格式，或从 CDN 加载 |

## 三、CI 中的 Bundle 监控

### 1. 使用 bundlewatch

```bash
npm i -D bundlewatch
```

```json
// package.json
{
  "bundlewatch": {
    "files": [
      { "path": "dist/assets/*.js", "maxSize": "200KB" },
      { "path": "dist/assets/*.css", "maxSize": "50KB" }
    ],
    "ci": {
      "githubAccessToken": "${{ secrets.BUNDLEWATCH_GITHUB_TOKEN }}",
      "trackBranches": ["main"]
    }
  }
}
```

### 2. GitHub Actions 集成

```yaml
# .github/workflows/bundle-check.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npx bundlewatch
```

## 四、Tree Shaking 深度排查

Tree shaking 依赖 ES Module 的静态分析，以下情况会"杀死" tree shaking：

```ts
// ❌ 副作用导入 — 整个模块都会保留
import './utils'           // 有副作用
import 'core-js/stable'    // polyfill 通常有副作用

// ❌ CommonJS — 无法 tree shake
const { debounce } = require('lodash')

// ❌ 动态属性访问
const utils = { debounce, throttle }
utils[someVar]()  // 编译器不知道用哪个

// ✅ ES Module 命名导入 — 可 tree shake
import { debounce } from 'lodash-es'

// ✅ 纯函数库
import { useQuery } from '@tanstack/react-query'
```

### 1. 检查 tree shaking 是否生效

```bash
# 1. 构建生产版本
npm run build

# 2. 检查 dist 中是否包含未使用的代码
# 用 source-map-explorer 看 treemap
npx source-map-explorer dist/**/*.js

# 3. 检查 package.json 中的 sideEffects
```

```json
// package.json (库开发者需要声明)
{
  "sideEffects": false,  // 标记为无副作用，可安全 tree shake
  // 或指定有副作用的文件
  "sideEffects": ["*.css", "*.scss", "src/polyfill.js"]
}
```

## 五、常见体积优化速查表

| 方案 | 典型收益 | 实现难度 |
| --- | --- | --- |
| 换用轻量替代库 (moment → dayjs) | -60KB+ | 低 |
| 按需导入 (antd → 按需加载) | -100KB+ | 中 |
| 移除未使用的 polyfill | -30KB+ | 低 |
| 代码分割 (路由级) | 首屏 -50% | 中 |
| 压缩 (gzip/brotli) | -70% | 低（服务端配置） |
| lodash → lodash-es | -50KB+ | 低 |
| echarts 按需引入 | -500KB+ | 中 |
| 图标库 tree shaking | -200KB+ | 中 |

### 1. Echarts 按需引入示例

```ts
// ❌ 全量引入 — 约 1MB
import * as echarts from 'echarts'

// ✅ 按需引入 — 约 200KB
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart, LineChart,
  TitleComponent, TooltipComponent, GridComponent,
  CanvasRenderer,
])
```

### 2. 图标库按需加载

```ts
// ❌ 引入全部图标
import * as Icons from '@ant-design/icons-vue'  // 全量

// ✅ 按需引入
import { HomeOutlined, UserOutlined } from '@ant-design/icons-vue'

// ✅ 使用 unplugin-icons（自动按需）
import IconHome from '~icons/ant-design/home-outlined'
```

## 六、构建产物检查清单

每次构建后检查：

```bash
# 用 du 查看各文件大小
ls -lhS dist/assets/ | head -20

# 分析重复依赖
npx depcheck       # 检查未使用的依赖
npx npm-check      # 交互式检查和升级
```

```json
// package.json 中可添加构建后检查脚本
{
  "scripts": {
    "build": "vite build",
    "analyze": "vite build --mode analyze",
    "postbuild": "node scripts/check-bundle-size.mjs"
  }
}
```

```js
// scripts/check-bundle-size.mjs
import { statSync } from 'fs'
import { globSync } from 'glob'

const MAX_SIZE_MB = 2  // 单个文件最大限制
const files = globSync('dist/assets/*.js')

for (const file of files) {
  const size = statSync(file).size / 1024 / 1024
  if (size > MAX_SIZE_MB) {
    console.error(`❌ ${file}: ${size.toFixed(2)}MB exceeds limit of ${MAX_SIZE_MB}MB`)
    process.exit(1)
  }
  console.log(`✓ ${file}: ${size.toFixed(2)}MB`)
}
```

## 小结

Bundle 分析是定位包体积瓶颈的关键步骤。使用 `rollup-plugin-visualizer` 可视化 treemap 可以快速发现大模块和重复依赖。常见的优化手段包括：==替换轻量库==（moment → dayjs）、==按需引入==（echarts、图标库）、==代码分割==（路由级 + 组件级）和 ==Tree Shaking==。建议在 CI 中集成 `bundlewatch` 持续监控包体积变化，避免随迭代默默膨胀。

::: info 📖 参考
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [bundlephobia](https://bundlephobia.com/) — 在线查询 npm 包大小
- [Bundle Buddy](https://bundle-buddy.com/) — Webpack bundle 去重分析
:::
