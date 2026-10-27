<template>
  <section ref="rootRef" class="verse-hero" aria-hidden="true">
    <canvas ref="canvasRef" class="verse-hero__canvas" />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Editorial monogram: a custom, high-contrast V/M glyph rather than a glowing tube.
 * The letters retain a shared seven-point topology for morphing, but selected anchors
 * are deliberately sharpened to create authored corners, asymmetric tension and
 * tapered terminals. A restrained accent hairline supplies the only metallic detail.
 */

const HOLD = 5.2 // 字母静置时长
const MORPH = 3.2 // 变形时长
const SAMPLES = 300 // 定制字形的轮廓采样数

const rootRef = ref(null)
const canvasRef = ref(null)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = (t) => t * t * (3 - 2 * t)
const easeInOutCubic = (value) => (value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2)
const withAlpha = (rgb, alpha) => `rgb(${rgb} / ${clamp(alpha, 0, 1).toFixed(3)})`

// 两个字母共享七个锚点，位置、拐角性格和笔画粗细一起插值。
const LETTERS = {
  V: {
    // Endpoints are intentionally asymmetric; the lower vertex is narrow and decisive.
    points: [
      [0.035, 1.0],
      [0.225, 0.58],
      [0.425, 0.14],
      [0.5, 0.025],
      [0.575, 0.14],
      [0.79, 0.61],
      [0.965, 1.0],
    ],
    // Higher values preserve a deliberate corner instead of rounding it away.
    sharpness: [0.9, 0.12, 0.18, 0.98, 0.18, 0.12, 0.9],
    // High contrast: broader outer strokes, narrow meeting point.
    width: [1.5, 0.82, 0.58, 0.92, 1.42],
  },
  M: {
    points: [
      [0.035, 0.035],
      [0.105, 0.55],
      [0.185, 0.985],
      [0.5, 0.27],
      [0.805, 1.0],
      [0.89, 0.53],
      [0.965, 0.04],
    ],
    sharpness: [0.9, 0.1, 0.96, 0.98, 0.96, 0.1, 0.9],
    // Narrow rising strokes contrast with a heavier outer silhouette.
    width: [1.38, 0.68, 1.12, 0.68, 1.45],
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

// 将字母锚点展开成路径：锚点插值 → 定制曲线采样 → 弧长归一 → 法线计算
function samplePath(morphValue, out) {
  const a = LETTERS.V.points
  const b = LETTERS.M.points
  const { cx, cy, letterW, letterH } = layout

  // Match the anchors one by one, while interpolating corner character as well as position.
  const px = []
  const py = []
  const corner = []
  for (let i = 0; i < a.length; i++) {
    px.push(a[i][0] + (b[i][0] - a[i][0]) * morphValue)
    py.push(a[i][1] + (b[i][1] - a[i][1]) * morphValue)
    corner.push(lerp(LETTERS.V.sharpness[i], LETTERS.M.sharpness[i], morphValue))
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
      // Corner-aware Hermite curve: selected anchors can stay pointed instead of becoming round.
      const h00 = 2 * f3 - 3 * f2 + 1
      const h10 = f3 - 2 * f2 + f
      const h01 = -2 * f3 + 3 * f2
      const h11 = f3 - f2
      const m1x = (p2x - p0x) * 0.5 * (1 - corner[i])
      const m1y = (p2y - p0y) * 0.5 * (1 - corner[i])
      const m2x = (p3x - p1x) * 0.5 * (1 - corner[i + 1])
      const m2y = (p3y - p1y) * 0.5 * (1 - corner[i + 1])
      const qx = h00 * p1x + h10 * m1x + h01 * p2x + h11 * m2x
      const qy = h00 * p1y + h10 * m1y + h01 * p2y + h11 * m2y
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

// 宽度节点插值：把排印式的粗细对比沿弧长拉成平滑曲线
function profileAt(nodes, t) {
  const n = nodes.length - 1
  const pos = clamp(t, 0, 1) * n
  const i = Math.min(n - 1, Math.floor(pos))
  return lerp(nodes[i], nodes[i + 1], smooth(pos - i))
}

// 逐点宽度：端点收锋 × 粗细对比 × 极轻的整体呼吸
function computeWidths(out, morphValue) {
  const base = layout.letterH * 0.027
  const breathe = 0.985 + 0.015 * Math.sin(clock * 0.52)
  const ripple = morph.active ? 0.025 * Math.sin(clock * 3.8) : 0
  for (let i = 0; i < out.count; i++) {
    const t = out.ts[i]
    // Cut terminals taper almost to a point; the silhouette, not a glow, defines the glyph.
    const taper = 0.12 + 0.88 * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.32)
    const pv = profileAt(LETTERS.V.width, t)
    const pm = profileAt(LETTERS.M.width, t)
    const contrast = pv + (pm - pv) * morphValue
    out.ws[i] = base * taper * contrast * (1 + ripple * Math.sin(t * Math.PI * 3)) * breathe
  }
}

// 细光沿字形往返移动
function pulsePosition() {
  return 1 - Math.abs(2 * ((clock * 0.11) % 1) - 1)
}

// 一条闭合轮廓一次填充：上、下边缘合成定制笔画
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

// 高光：一小段克制的白色细光沿字形扫过
function drawPulseBand(out, pulse) {
  const half = 0.035
  const t0 = Math.max(0, pulse - half)
  const t1 = Math.min(1, pulse + half)
  const { xs, ys, ts, nx, ny, ws, count } = out
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = withAlpha(palette.white, 0.7)
  for (let i = 0; i < count - 1; i++) {
    const tm = (ts[i] + ts[i + 1]) / 2
    if (tm < t0 || tm > t1) continue
    const offset = (tm - pulse) / half
    ctx.globalAlpha = Math.exp(-offset * offset) * 0.24
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

// 沿笔画内侧绘制一条极细的刻线，补充排印感
function drawEditorialEdge(out) {
  const { xs, ys, nx, ny, ws, count } = out
  if (count < 2) return
  ctx.save()
  ctx.globalAlpha = palette.dark ? 0.32 : 0.22
  ctx.strokeStyle = withAlpha(palette.accent, 1)
  ctx.lineWidth = 0.7
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    // Stay inside the silhouette so this reads as a fine engraved edge, not a second stroke.
    const inset = ws[i] * 0.48
    const x = xs[i] + nx[i] * inset
    const y = ys[i] + ny[i] * inset
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()
}

// 背景：保留非常淡的品牌色，主体仍由字形承担
function drawAmbient(clockValue) {
  const breathe = 1 + Math.sin(clockValue * 0.35) * 0.06
  const x = layout.cx
  const y = layout.cy - layout.letterH * 0.1
  const radius = Math.max(layout.letterH * 1.7, Math.min(width, height) * 0.5) * breathe
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, withAlpha(palette.accent, palette.dark ? 0.025 : 0.018))
  gradient.addColorStop(0.55, withAlpha(palette.accent, palette.dark ? 0.009 : 0.006))
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
  gradient.addColorStop(1, withAlpha(palette.shadow, palette.dark ? 0.09 : 0.025))
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

// 指针仅带来非常轻的纸面亮度变化
function drawSpotlight() {
  if (pointer.ease < 0.01) return
  const radius = Math.min(width, height) * 0.52
  const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius)
  gradient.addColorStop(0, withAlpha(palette.white, (palette.dark ? 0.05 : 0.06) * pointer.ease))
  gradient.addColorStop(1, withAlpha(palette.white, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// 每帧一次性算好的数据：形变进度与细光位置
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

  // A single, solid silhouette anchors the design. No ghost stack or broad outer glow.
  fillRibbon(path, 1.04, palette.dark ? 0.12 : 0.08, withAlpha(palette.accent, 1))
  fillRibbon(path, 1, palette.dark ? 0.98 : 0.96, bodyColor)
  drawEditorialEdge(path)
  drawPulseBand(path, f.pulse)
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
  --verse-accent: #c5a6ff;
  --verse-accent-rgb: 197 166 255;
  --verse-ribbon-rgb: 239 236 229;
  --verse-white-rgb: 255 251 243;
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
    radial-gradient(ellipse at 50% 46%, rgb(100 82 150 / 4%), transparent 62%),
    linear-gradient(145deg, rgb(19 20 27 / 98%), rgb(25 26 34 / 96%));
}

/* 浅色主题：用 :is() 声明祖先条件，才能在 scoped 样式里保留选择器 */
.verse-hero:is(html:not([data-theme='dark']):not(.dark) *) {
  --verse-accent: #7655a8;
  --verse-accent-rgb: 118 85 168;
  --verse-ribbon-rgb: 35 36 43;
  --verse-white-rgb: 252 249 242;
  --verse-shadow-rgb: 25 25 31;
  border-color: rgb(37 36 43 / 13%);
  background:
    radial-gradient(ellipse at 50% 46%, rgb(118 85 168 / 5%), transparent 60%),
    linear-gradient(145deg, rgb(247 245 240 / 98%), rgb(237 234 227 / 96%));
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
