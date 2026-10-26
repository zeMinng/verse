<template>
  <section ref="rootRef" class="verse-hero" aria-hidden="true">
    <canvas ref="canvasRef" class="verse-hero__canvas" />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 「流体光带」：一条银白色的光带，在 V 与 M 之间平滑流动变形。
 *
 * V 是 verse，M 是 zeMinng。光带始终是一条连续的线：静置数秒后，轮廓像水一样
 * 缓缓流入另一个字母，再静置、再流回。光带以一条闭合路径一次填充，边缘平滑
 * 无接缝；骨架用 Catmull-Rom 曲线，拐角圆转、笔画带自然弧线。一道白色高光
 * 沿带身往返滑动，变形时身后拖着很淡的残影。
 *
 * 材质保持克制：银白为主体，边缘只留一圈贴身的冷紫细光与极淡的外晕，紫色
 * 始终让位给银色高光。骨架之外，笔画宽度还叠加了「书写感」：每个字母带一组
 * 笔锋节点（V 顶部厚、谷底细；M 外侧竖画厚、中部细），随形变一起插值；两端
 * 收口成圆润的墨点，形变时带身像液体一样泛起细浪。
 */

const HOLD = 5.2 // 字母静置时长
const MORPH = 3.2 // 变形时长
const SAMPLES = 320 // 光带采样数
const TAU = Math.PI * 2

const rootRef = ref(null)
const canvasRef = ref(null)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = (t) => t * t * (3 - 2 * t)
const easeInOutCubic = (value) => (value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2)
const withAlpha = (rgb, alpha) => `rgb(${rgb} / ${clamp(alpha, 0, 1).toFixed(3)})`

// 两个字母的骨架：同一条 7 点折线，点对点插值即可完成形变。
// width 是笔画宽度节点（笔锋对比），随骨架一同插值：
// V 顶部厚、谷底细；M 外侧竖画厚、中部细。
const LETTERS = {
  V: {
    points: [
      [0.1, 1.0],
      [0.28, 0.52],
      [0.44, 0.12],
      [0.5, 0.05],
      [0.56, 0.12],
      [0.72, 0.52],
      [0.9, 1.0],
    ],
    width: [1.3, 1.12, 0.7, 1.12, 1.3],
  },
  M: {
    points: [
      [0.05, 0.05],
      [0.12, 0.56],
      [0.19, 1.0],
      [0.5, 0.24],
      [0.81, 1.0],
      [0.88, 0.56],
      [0.95, 0.05],
    ],
    width: [1.2, 1.0, 0.8, 1.0, 1.2],
  },
}

// 组件级可变状态，集中声明便于查看
let ctx = null
let dpr = 1
let width = 0
let height = 0
let frameId = 0
let running = false
let inView = true
let reduceMotion = false
let clock = 0
let lastTime = 0
let layout = null
let palette = null
let sprites = null
let grain = null
let grainPattern = null
let motionQuery = null
let intersectionObserver = null
let resizeObserver = null
let themeObserver = null

const pointer = { x: -9999, y: -9999, ease: 0, hover: false }
const morph = { from: 0, to: 0, start: 0, active: false, lastSettle: 0 }

// 可复用的路径缓冲：每帧原地重写，避免反复分配
function createPathBuffers() {
  return {
    xs: new Float32Array(SAMPLES + 16),
    ys: new Float32Array(SAMPLES + 16),
    ts: new Float32Array(SAMPLES + 16),
    nx: new Float32Array(SAMPLES + 16),
    ny: new Float32Array(SAMPLES + 16),
    ws: new Float32Array(SAMPLES + 16),
    count: 0,
  }
}
const path = createPathBuffers()
const ghostPath = createPathBuffers()

// 明暗主题由 VitePress 的 data-theme 或 .dark 类决定，两者都认
function isDarkMode() {
  const html = document.documentElement
  const forced = html.getAttribute('data-theme')
  if (forced) return forced === 'dark'
  if (html.classList.contains('dark')) return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readPalette() {
  const el = rootRef.value
  if (!el) return null
  const styles = getComputedStyle(el)
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback
  return {
    dark: isDarkMode(),
    accent: read('--verse-accent-rgb', '165 166 255'),
    ribbon: read('--verse-ribbon-rgb', '206 215 238'),
    white: read('--verse-white-rgb', '232 234 255'),
    shadow: read('--verse-shadow-rgb', '0 0 0'),
  }
}

// 柔光贴图：脉冲光晕与纸面的灯光
function createGlowSprite(rgb) {
  const sprite = document.createElement('canvas')
  sprite.width = 64
  sprite.height = 64
  const spriteCtx = sprite.getContext('2d')
  if (!spriteCtx) return sprite
  const gradient = spriteCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, withAlpha(rgb, 1))
  gradient.addColorStop(0.14, withAlpha(rgb, 0.78))
  gradient.addColorStop(0.4, withAlpha(rgb, 0.14))
  gradient.addColorStop(1, withAlpha(rgb, 0))
  spriteCtx.fillStyle = gradient
  spriteCtx.fillRect(0, 0, 64, 64)
  return sprite
}

function buildSprites(current) {
  if (!current) return null
  return {
    white: createGlowSprite(current.white),
    accent: createGlowSprite(current.accent),
  }
}

// 固定种子的伪随机（纸纹用）
function createRandom(seed) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

// 纸纹：深色纸上撒亮斑，浅色纸上压暗斑；一次生成，整页平铺
function buildGrainTile(dark) {
  const tile = document.createElement('canvas')
  tile.width = 160
  tile.height = 160
  const tileCtx = tile.getContext('2d')
  if (!tileCtx) return tile
  const random = createRandom(dark ? 31337 : 27117)
  const image = tileCtx.createImageData(160, 160)
  for (let i = 0; i < image.data.length; i += 4) {
    if (random() < 0.13) {
      if (dark) {
        image.data[i] = 255
        image.data[i + 1] = 255
        image.data[i + 2] = 255
        image.data[i + 3] = Math.floor(10 + random() * 42)
      } else {
        const value = Math.floor(206 - random() * 34)
        image.data[i] = value
        image.data[i + 1] = value
        image.data[i + 2] = value
        image.data[i + 3] = 255
      }
    } else if (!dark) {
      image.data[i] = 255
      image.data[i + 1] = 255
      image.data[i + 2] = 255
      image.data[i + 3] = 255
    }
  }
  tileCtx.putImageData(image, 0, 0)
  return tile
}

function rebuildGrain() {
  grain = buildGrainTile(palette?.dark ?? true)
  grainPattern = grain && ctx ? ctx.createPattern(grain, 'repeat') : null
}

function ensureLayout() {
  const el = rootRef.value
  const canvas = canvasRef.value
  if (!el || !canvas) return false

  const rect = el.getBoundingClientRect()
  const nextWidth = Math.max(1, Math.round(rect.width))
  const nextHeight = Math.max(1, Math.round(rect.height))
  const nextDpr = Math.min(window.devicePixelRatio || 1, 2)
  if (ctx && nextWidth === width && nextHeight === height && nextDpr === dpr) return true

  width = nextWidth
  height = nextHeight
  dpr = nextDpr
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  sprites = buildSprites(palette)
  rebuildGrain()
  layout = {
    cx: width * 0.5,
    cy: height * 0.48,
    letterW: 0,
    letterH: Math.min(height * 0.42, (width * 0.8) / 1.4),
  }
  layout.letterW = layout.letterH * 1.4
  return true
}

// 当前形变进度：0 = V，1 = M（带缓动；进度走完时原地收束）
function advanceMorph() {
  if (!morph.active) return morph.from
  const progress = clamp((clock - morph.start) / MORPH, 0, 1)
  const u = morph.from + (morph.to - morph.from) * easeInOutCubic(progress)
  if (progress >= 1) {
    morph.active = false
    morph.from = morph.to
    morph.lastSettle = clock
  }
  return u
}

// 从当前进度出发，向目标流动
function startMorphTo(target) {
  morph.from = advanceMorph()
  morph.to = target
  morph.start = clock
  morph.active = true
}

// 把字母骨架展开成平滑采样路径：控制点插值 → Catmull-Rom 采样 → 弧长归一 → 平滑法线
function samplePath(morphValue, out) {
  const a = LETTERS.V.points
  const b = LETTERS.M.points
  const { cx, cy, letterW, letterH } = layout

  // 点对点插值控制点
  const px = []
  const py = []
  for (let i = 0; i < a.length; i++) {
    px.push(a[i][0] + (b[i][0] - a[i][0]) * morphValue)
    py.push(a[i][1] + (b[i][1] - a[i][1]) * morphValue)
  }

  // 段长 → 采样数
  const segN = []
  let total = 0
  for (let i = 0; i < px.length - 1; i++) {
    const len = Math.hypot(px[i + 1] - px[i], py[i + 1] - py[i]) || 0.0001
    segN.push(len)
    total += len
  }
  for (let i = 0; i < segN.length; i++) {
    segN[i] = Math.max(2, Math.round((SAMPLES * segN[i]) / total))
  }

  const capacity = out.xs.length
  let index = 0
  for (let i = 0; i < px.length - 1; i++) {
    const p0x = px[Math.max(0, i - 1)]
    const p0y = py[Math.max(0, i - 1)]
    const p1x = px[i]
    const p1y = py[i]
    const p2x = px[i + 1]
    const p2y = py[i + 1]
    const p3x = px[Math.min(px.length - 1, i + 2)]
    const p3y = py[Math.min(py.length - 1, i + 2)]
    const n = segN[i]
    for (let k = i === 0 ? 0 : 1; k < n; k++) {
      if (index >= capacity) break
      const f = k / (n - 1)
      const f2 = f * f
      const f3 = f2 * f
      // Catmull-Rom 内联计算，避免逐点分配对象
      const qx =
        0.5 *
        (2 * p1x +
          (-p0x + p2x) * f +
          (2 * p0x - 5 * p1x + 4 * p2x - p3x) * f2 +
          (-p0x + 3 * p1x - 3 * p2x + p3x) * f3)
      const qy =
        0.5 *
        (2 * p1y +
          (-p0y + p2y) * f +
          (2 * p0y - 5 * p1y + 4 * p2y - p3y) * f2 +
          (-p0y + 3 * p1y - 3 * p2y + p3y) * f3)
      out.xs[index] = cx + (qx - 0.5) * letterW
      out.ys[index] = cy + (0.5 - qy) * letterH
      index++
    }
  }
  out.count = index

  // 弧长参数化
  let acc = 0
  out.ts[0] = 0
  for (let i = 1; i < index; i++) {
    acc += Math.hypot(out.xs[i] - out.xs[i - 1], out.ys[i] - out.ys[i - 1])
    out.ts[i] = acc
  }
  for (let i = 0; i < index; i++) out.ts[i] /= acc || 1

  // 相邻段平均得到的平滑法线，消除折角毛刺
  for (let i = 0; i < index; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(index - 1, i + 1)
    const dx = out.xs[i1] - out.xs[i0]
    const dy = out.ys[i1] - out.ys[i0]
    const len = Math.hypot(dx, dy) || 1
    out.nx[i] = -dy / len
    out.ny[i] = dx / len
  }
}

// 宽度节点插值：把笔锋对比沿弧长拉成平滑曲线
function profileAt(nodes, t) {
  const n = nodes.length - 1
  const pos = clamp(t, 0, 1) * n
  const i = Math.min(n - 1, Math.floor(pos))
  return lerp(nodes[i], nodes[i + 1], smooth(pos - i))
}

// 逐点宽度：收细 × 笔锋对比 × 形变细浪 × 整体呼吸，每帧只算一次供全部填充复用
function computeWidths(out, morphValue) {
  const base = layout.letterH * 0.022
  const breathe = 0.94 + 0.06 * Math.sin(clock * 0.7)
  const ripple = morph.active ? 0.09 * Math.sin(clock * 4.6) : 0
  for (let i = 0; i < out.count; i++) {
    const t = out.ts[i]
    const taper = 0.78 + 0.22 * Math.sin(Math.PI * t)
    const pv = profileAt(LETTERS.V.width, t)
    const pm = profileAt(LETTERS.M.width, t)
    const contrast = pv + (pm - pv) * morphValue
    out.ws[i] = base * taper * contrast * (1 + ripple * Math.sin(t * Math.PI * 3)) * breathe
  }
}

// 能量高光位置：沿光带往返流动
function pulsePosition() {
  return 1 - Math.abs(2 * ((clock * 0.11) % 1) - 1)
}

// 一条闭合路径一次填充：上下边缘各走一遍，平滑无接缝
function fillRibbon(out, widthScale, alphaScale, color) {
  const { xs, ys, nx, ny, ws, count } = out
  ctx.globalAlpha = alphaScale
  ctx.fillStyle = color
  ctx.beginPath()
  let w = ws[0] * widthScale
  ctx.moveTo(xs[0] + nx[0] * w, ys[0] + ny[0] * w)
  for (let i = 1; i < count; i++) {
    w = ws[i] * widthScale
    ctx.lineTo(xs[i] + nx[i] * w, ys[i] + ny[i] * w)
  }
  for (let i = count - 1; i >= 0; i--) {
    w = ws[i] * widthScale
    ctx.lineTo(xs[i] - nx[i] * w, ys[i] - ny[i] * w)
  }
  ctx.closePath()
  ctx.fill()
}

// 高光：一小段白色亮带沿光带滑动，叠加发光
function drawPulseBand(out, pulse) {
  const half = 0.11
  const t0 = Math.max(0, pulse - half)
  const t1 = Math.min(1, pulse + half)
  const { xs, ys, ts, nx, ny, ws, count } = out
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = withAlpha(palette.white, 0.85)
  for (let i = 0; i < count - 1; i++) {
    const tm = (ts[i] + ts[i + 1]) / 2
    if (tm < t0 || tm > t1) continue
    const offset = (tm - pulse) / half
    ctx.globalAlpha = Math.exp(-offset * offset) * 0.5
    const w0 = ws[i]
    const w1 = ws[i + 1]
    ctx.beginPath()
    ctx.moveTo(xs[i] + nx[i] * w0, ys[i] + ny[i] * w0)
    ctx.lineTo(xs[i + 1] + nx[i + 1] * w1, ys[i + 1] + ny[i + 1] * w1)
    ctx.lineTo(xs[i + 1] - nx[i + 1] * w1, ys[i + 1] - ny[i + 1] * w1)
    ctx.lineTo(xs[i] - nx[i] * w0, ys[i] - ny[i] * w0)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

// 高光处的光晕：白色为主、紫晕仅作点缀
function drawPulseGlow(out, pulse) {
  if (!sprites) return
  const index = clamp(Math.round(pulse * (out.count - 1)), 0, out.count - 1)
  const x = out.xs[index]
  const y = out.ys[index]
  const w = out.ws[index]
  const accentSize = layout.letterH * 0.12
  const whiteSize = Math.max(w * 2.6, layout.letterH * 0.055)
  ctx.globalAlpha = palette.dark ? 0.18 : 0.12
  ctx.drawImage(sprites.accent, x - accentSize / 2, y - accentSize / 2, accentSize, accentSize)
  ctx.globalAlpha = palette.dark ? 0.6 : 0.5
  ctx.drawImage(sprites.white, x - whiteSize / 2, y - whiteSize / 2, whiteSize, whiteSize)
  // 白色亮核
  ctx.globalAlpha = 0.9
  ctx.fillStyle = withAlpha(palette.white, 1)
  ctx.beginPath()
  ctx.arc(x, y, Math.max(1.2, w * 0.55), 0, TAU)
  ctx.fill()
  ctx.globalAlpha = 1
}

// 两端收口：圆润的墨点 + 柔光
function drawCaps(out, bodyColor) {
  if (!sprites) return
  const last = out.count - 1
  const caps = [
    [out.xs[0], out.ys[0], out.ws[0]],
    [out.xs[last], out.ys[last], out.ws[last]],
  ]
  for (const [x, y, w] of caps) {
    const r = Math.max(2, w * 0.95)
    const halo = r * 3.4
    ctx.globalAlpha = palette.dark ? 0.4 : 0.3
    ctx.drawImage(sprites.white, x - halo / 2, y - halo / 2, halo, halo)
    ctx.globalAlpha = 1
    ctx.fillStyle = bodyColor
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
    ctx.fillStyle = withAlpha(palette.white, palette.dark ? 0.9 : 0.75)
    ctx.beginPath()
    ctx.arc(x, y, r * 0.5, 0, TAU)
    ctx.fill()
  }
}

// 背景：一晕极淡的品牌色，托在字母后方
function drawAmbient(clockValue) {
  const breathe = 1 + Math.sin(clockValue * 0.35) * 0.06
  const x = layout.cx
  const y = layout.cy - layout.letterH * 0.1
  const radius = Math.max(layout.letterH * 1.7, Math.min(width, height) * 0.5) * breathe
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, withAlpha(palette.accent, palette.dark ? 0.05 : 0.03))
  gradient.addColorStop(0.55, withAlpha(palette.accent, palette.dark ? 0.02 : 0.012))
  gradient.addColorStop(1, withAlpha(palette.accent, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawVignette() {
  const radius = Math.hypot(width, height) * 0.5
  const gradient = ctx.createRadialGradient(
    width / 2,
    height * 0.47,
    radius * 0.42,
    width / 2,
    height * 0.47,
    radius,
  )
  gradient.addColorStop(0, withAlpha(palette.shadow, 0))
  gradient.addColorStop(1, withAlpha(palette.shadow, palette.dark ? 0.14 : 0.04))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawGrain() {
  if (!grainPattern) return
  ctx.save()
  ctx.globalCompositeOperation = palette.dark ? 'lighter' : 'multiply'
  ctx.globalAlpha = palette.dark ? 0.7 : 0.55
  ctx.fillStyle = grainPattern
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

// 指针像一盏小灯，照在纸上
function drawSpotlight() {
  if (pointer.ease < 0.01) return
  const radius = Math.min(width, height) * 0.52
  const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius)
  gradient.addColorStop(0, withAlpha(palette.white, (palette.dark ? 0.05 : 0.06) * pointer.ease))
  gradient.addColorStop(1, withAlpha(palette.white, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// 每帧一次性算好的数据：形变进度、残影开关、高光位置
function currentFrame() {
  return {
    u: advanceMorph(),
    morphing: morph.active,
    pulse: pulsePosition(),
    clock,
  }
}

function renderFrame(f) {
  if (!ctx || !palette || !layout) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  drawAmbient(f.clock)
  drawVignette()
  drawGrain()

  samplePath(f.u, path)
  computeWidths(path, f.u)
  const bodyColor = withAlpha(palette.ribbon, 1)

  // 浅色纸面上的一层淡影，让光带微微浮起
  if (!palette.dark) {
    ctx.save()
    ctx.translate(0, height * 0.005)
    fillRibbon(path, 1, 0.1, withAlpha(palette.shadow, 1))
    ctx.restore()
  }

  // 轻微残影：形变时身后拖三道渐隐的旧姿态
  if (f.morphing) {
    const sign = morph.to > morph.from ? -1 : 1
    for (let k = 0; k < 3; k++) {
      const ghostU = clamp(f.u + sign * (0.05 + k * 0.055), 0, 1)
      samplePath(ghostU, ghostPath)
      computeWidths(ghostPath, ghostU)
      fillRibbon(ghostPath, 0.9, (palette.dark ? 0.1 : 0.08) * (1 - k * 0.3), bodyColor)
    }
  }

  // 冷紫边缘高光：一圈贴身的细光 + 极淡外晕，克制地衬托银色主体
  fillRibbon(path, 1.45, palette.dark ? 0.12 : 0.09, withAlpha(palette.accent, 1))
  fillRibbon(path, 2.8, palette.dark ? 0.05 : 0.035, withAlpha(palette.accent, 1))

  // 银白光带本体
  fillRibbon(path, 1, palette.dark ? 0.95 : 0.9, bodyColor)

  drawCaps(path, bodyColor)
  drawPulseBand(path, f.pulse)
  drawPulseGlow(path, f.pulse)
  drawSpotlight()
}

function drawStatic() {
  if (!ctx) return
  clock = 1.7
  renderFrame(currentFrame())
}

function tick(now) {
  if (!running) return
  const elapsed = Math.min(0.06, Math.max(0, (now - lastTime) / 1000))
  lastTime = now
  clock += elapsed
  pointer.ease += ((pointer.hover ? 1 : 0) - pointer.ease) * 0.045

  if (!morph.active && clock - morph.lastSettle >= HOLD) startMorphTo(morph.from === 0 ? 1 : 0)

  renderFrame(currentFrame())
  frameId = requestAnimationFrame(tick)
}

function start() {
  if (running || reduceMotion || !ctx) return
  running = true
  lastTime = performance.now()
  frameId = requestAnimationFrame(tick)
}

function stop() {
  running = false
  if (frameId) cancelAnimationFrame(frameId)
  frameId = 0
}

function sync() {
  if (reduceMotion) {
    stop()
    drawStatic()
    return
  }
  if (inView && !document.hidden) start()
  else stop()
}

function handlePointer(event) {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  pointer.x = event.clientX - rect.left
  pointer.y = event.clientY - rect.top
  pointer.hover = true
}

function handlePointerLeave() {
  pointer.hover = false
}

function handlePointerDown() {
  if (reduceMotion) return
  const u = advanceMorph()
  startMorphTo(u > 0.5 ? 0 : 1)
  sync()
}

function handleMotionChange(event) {
  reduceMotion = event.matches
  sync()
}

function handleThemeChange() {
  palette = readPalette()
  sprites = buildSprites(palette)
  rebuildGrain()
  if (!running) renderFrame(currentFrame())
}

onMounted(() => {
  if (!rootRef.value || !canvasRef.value) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduceMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  palette = readPalette()
  if (ensureLayout()) renderFrame(currentFrame())

  const el = rootRef.value
  el.addEventListener('pointermove', handlePointer, { passive: true })
  el.addEventListener('pointerleave', handlePointerLeave, { passive: true })
  el.addEventListener('pointerdown', handlePointerDown, { passive: true })
  document.addEventListener('visibilitychange', sync)

  resizeObserver = new ResizeObserver(() => {
    if (ensureLayout() && !running) renderFrame(currentFrame())
  })
  resizeObserver.observe(el)

  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting)
        sync()
      },
      { threshold: 0 },
    )
    intersectionObserver.observe(el)
  }

  themeObserver = new MutationObserver(handleThemeChange)
  themeObserver.observe(document.documentElement, { attributeFilter: ['class', 'data-theme'] })

  sync()
})

onBeforeUnmount(() => {
  stop()
  motionQuery?.removeEventListener('change', handleMotionChange)
  document.removeEventListener('visibilitychange', sync)
  rootRef.value?.removeEventListener('pointermove', handlePointer)
  rootRef.value?.removeEventListener('pointerleave', handlePointerLeave)
  rootRef.value?.removeEventListener('pointerdown', handlePointerDown)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  themeObserver?.disconnect()
})
</script>

<style scoped>
.verse-hero {
  --verse-accent: #a5a6ff;
  --verse-accent-rgb: 165 166 255;
  --verse-ribbon-rgb: 206 215 238;
  --verse-white-rgb: 232 234 255;
  --verse-shadow-rgb: 0 0 0;

  position: relative;
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 520px;
  overflow: hidden;
  isolation: isolate;
  place-items: center;
  border: 1px solid rgb(148 163 184 / 10%);
  border-radius: 24px;
  background:
    radial-gradient(ellipse at 50% 46%, rgb(90 108 180 / 7%), transparent 58%),
    linear-gradient(145deg, rgb(22 28 44 / 32%), rgb(12 17 28 / 12%));
}

/* 浅色主题：用 :is() 声明祖先条件，才能在 scoped 样式里保留选择器 */
.verse-hero:is(html:not([data-theme='dark']):not(.dark) *) {
  --verse-accent: #7478db;
  --verse-accent-rgb: 116 120 219;
  --verse-ribbon-rgb: 96 106 138;
  --verse-shadow-rgb: 56 68 110;
  border-color: rgb(100 116 139 / 15%);
  background:
    radial-gradient(ellipse at 50% 46%, rgb(106 119 209 / 9%), transparent 57%),
    linear-gradient(145deg, rgb(248 250 255 / 94%), rgb(239 243 250 / 78%));
}

.verse-hero__canvas {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
