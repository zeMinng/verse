<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

interface Particle {
  angle: number
  radius: number
  speed: number
  size: number
  phase: number
  opacity: number
  x: number
  y: number
}

interface NodePoint {
  name: string
  index: string
  x: number
  y: number
  mobileX: number
  mobileY: number
}

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const isHovering = ref(false)
const isVisible = ref(true)

let ctx: CanvasRenderingContext2D | null = null
let observer: IntersectionObserver | null = null
let frameId = 0

let width = 0
let height = 0
let dpr = 1

const mouse = {
  x: 0,
  y: 0,
  active: false,
}

const particles: Particle[] = []

const nodes: NodePoint[] = [
  {
    name: 'Frontend',
    index: '01',
    x: 0.17,
    y: 0.40,
    mobileX: 0.10,
    mobileY: 0.36,
  },
  {
    name: 'AI',
    index: '02',
    x: 0.78,
    y: 0.25,
    mobileX: 0.78,
    mobileY: 0.28,
  },
  {
    name: 'Rust',
    index: '03',
    x: 0.22,
    y: 0.77,
    mobileX: 0.10,
    mobileY: 0.73,
  },
  {
    name: 'Backend',
    index: '04',
    x: 0.82,
    y: 0.69,
    mobileX: 0.76,
    mobileY: 0.73,
  },
]

const PARTICLE_COUNT = 54
const MAX_CONNECTION_DISTANCE = 150
const NODE_CONNECTION_DISTANCE = 260

function isDarkMode() {
  if (typeof document === 'undefined') {
    return true
  }

  return document.documentElement.classList.contains('dark')
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createParticles() {
  particles.length = 0

  const baseRadius = Math.min(width, height) * 0.30

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      angle:
        (Math.PI * 2 * i) / PARTICLE_COUNT +
        random(-0.12, 0.12),

      radius:
        baseRadius + random(-80, 80),

      speed: random(0.00012, 0.00038),

      size: random(0.8, 2.3),

      phase: random(0, Math.PI * 2),

      opacity: random(0.18, 0.72),

      x: 0,
      y: 0,
    })
  }
}

function resizeCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value

  if (!container || !canvas) {
    return
  }

  const rect = container.getBoundingClientRect()

  width = rect.width
  height = rect.height

  dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx = canvas.getContext('2d')

  if (!ctx) {
    return
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  createParticles()
}

function getNodePosition(
  node: NodePoint,
) {
  const mobile =
    width < 768

  const x = mobile
    ? node.mobileX
    : node.x

  const y = mobile
    ? node.mobileY
    : node.y

  return {
    x: x * width,
    y: y * height,
  }
}

function updateParticles(time: number) {
  const centerX = width / 2
  const centerY = height / 2

  for (const particle of particles) {
    particle.angle += particle.speed

    const breathing =
      Math.sin(
        time * 0.00075 +
        particle.phase,
      ) * 8

    const radius =
      particle.radius + breathing

    let x =
      centerX +
      Math.cos(particle.angle) *
      radius

    let y =
      centerY +
      Math.sin(particle.angle) *
      radius

    /*
     * 鼠标产生局部排斥
     */
    if (mouse.active) {
      const dx = x - mouse.x
      const dy = y - mouse.y

      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy,
        )

      if (
        distance > 0 &&
        distance < 180
      ) {
        const strength =
          Math.pow(
            1 - distance / 180,
            2,
          ) * 46

        x +=
          (dx / distance) *
          strength

        y +=
          (dy / distance) *
          strength
      }
    }

    /*
     * 整体轻微视差
     */
    if (mouse.active) {
      const offsetX =
        (mouse.x - centerX) *
        0.018

      const offsetY =
        (mouse.y - centerY) *
        0.018

      x += offsetX
      y += offsetY
    }

    particle.x = x
    particle.y = y
  }
}

function drawBackgroundGlow() {
  if (!ctx) {
    return
  }

  const centerX = width / 2
  const centerY = height / 2

  const gradient =
    ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.min(
        width,
        height,
      ) * 0.48,
    )

  if (isDarkMode()) {
    gradient.addColorStop(
      0,
      'rgba(120, 120, 255, 0.09)',
    )

    gradient.addColorStop(
      0.4,
      'rgba(120, 120, 255, 0.035)',
    )

    gradient.addColorStop(
      1,
      'rgba(120, 120, 255, 0)',
    )
  } else {
    gradient.addColorStop(
      0,
      'rgba(70, 70, 190, 0.07)',
    )

    gradient.addColorStop(
      0.4,
      'rgba(70, 70, 190, 0.022)',
    )

    gradient.addColorStop(
      1,
      'rgba(70, 70, 190, 0)',
    )
  }

  ctx.beginPath()

  ctx.arc(
    centerX,
    centerY,
    Math.min(
      width,
      height,
    ) * 0.48,
    0,
    Math.PI * 2,
  )

  ctx.fillStyle = gradient

  ctx.fill()
}

function drawOrbit(
  radius: number,
  opacity: number,
  rotation = 0,
) {
  if (!ctx) {
    return
  }

  const centerX = width / 2
  const centerY = height / 2

  ctx.save()

  ctx.translate(
    centerX,
    centerY,
  )

  ctx.rotate(rotation)

  ctx.scale(1, 0.52)

  ctx.beginPath()

  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 2,
  )

  ctx.strokeStyle =
    isDarkMode()
      ? `rgba(150, 150, 255, ${opacity})`
      : `rgba(80, 80, 170, ${opacity})`

  ctx.lineWidth = 0.65

  ctx.stroke()

  ctx.restore()
}

function drawNodeConnections() {
  if (!ctx) {
    return
  }

  const color =
    isDarkMode()
      ? '150, 150, 255'
      : '90, 90, 170'

  const positions =
    nodes.map(
      getNodePosition,
    )

  /*
   * 节点 → 中心
   */
  const center = {
    x: width / 2,
    y: height / 2,
  }

  for (
    let i = 0;
    i < positions.length;
    i++
  ) {
    const point = positions[i]

    const dx =
      point.x - center.x

    const dy =
      point.y - center.y

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy,
      )

    let opacity =
      0.075

    if (isHovering.value) {
      opacity = 0.14
    }

    const gradient =
      ctx.createLinearGradient(
        center.x,
        center.y,
        point.x,
        point.y,
      )

    gradient.addColorStop(
      0,
      `rgba(${color}, ${opacity})`,
    )

    gradient.addColorStop(
      1,
      `rgba(${color}, 0)`,
    )

    ctx.beginPath()

    ctx.moveTo(
      center.x,
      center.y,
    )

    ctx.lineTo(
      point.x,
      point.y,
    )

    ctx.strokeStyle =
      gradient

    ctx.lineWidth =
      isHovering.value
        ? 1
        : 0.7

    ctx.stroke()

    /*
     * 避免 TS 把 distance 认为未使用
     */
    if (
      distance <
      NODE_CONNECTION_DISTANCE
    ) {
      // intentionally empty
    }
  }

  /*
   * 节点之间的连接
   */
  for (
    let i = 0;
    i < positions.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < positions.length;
      j++
    ) {
      const a = positions[i]
      const b = positions[j]

      const dx = a.x - b.x
      const dy = a.y - b.y

      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy,
        )

      if (
        distance >
        NODE_CONNECTION_DISTANCE
      ) {
        continue
      }

      const opacity =
        isHovering.value
          ? 0.075
          : 0.035

      ctx.beginPath()

      ctx.moveTo(
        a.x,
        a.y,
      )

      ctx.lineTo(
        b.x,
        b.y,
      )

      ctx.strokeStyle =
        `rgba(${color}, ${opacity})`

      ctx.lineWidth = 0.6

      ctx.stroke()
    }
  }
}

function drawParticleConnections() {
  if (!ctx) {
    return
  }

  const color =
    isDarkMode()
      ? '160, 160, 255'
      : '100, 100, 180'

  for (
    let i = 0;
    i < particles.length;
    i++
  ) {
    const a = particles[i]

    for (
      let j = i + 1;
      j < particles.length;
      j++
    ) {
      const b = particles[j]

      const dx =
        a.x - b.x

      const dy =
        a.y - b.y

      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy,
        )

      if (
        distance >
        MAX_CONNECTION_DISTANCE
      ) {
        continue
      }

      let opacity =
        (1 -
          distance /
          MAX_CONNECTION_DISTANCE) *
        0.12

      if (
        isHovering.value
      ) {
        opacity *= 1.7
      }

      ctx.beginPath()

      ctx.moveTo(
        a.x,
        a.y,
      )

      ctx.lineTo(
        b.x,
        b.y,
      )

      ctx.strokeStyle =
        `rgba(${color}, ${opacity})`

      ctx.lineWidth = 0.5

      ctx.stroke()
    }
  }
}

function drawParticles() {
  if (!ctx) {
    return
  }

  for (
    const particle of particles
  ) {
    const size =
      particle.size *
      (isHovering.value
        ? 1.25
        : 1)

    const alpha =
      particle.opacity *
      (isHovering.value
        ? 1.18
        : 1)

    ctx.beginPath()

    ctx.arc(
      particle.x,
      particle.y,
      size,
      0,
      Math.PI * 2,
    )

    ctx.fillStyle =
      isDarkMode()
        ? `rgba(190, 190, 255, ${alpha})`
        : `rgba(90, 90, 170, ${alpha})`

    ctx.fill()
  }
}

function draw(time: number) {
  if (!ctx) {
    return
  }

  if (!isVisible.value) {
    frameId =
      requestAnimationFrame(draw)

    return
  }

  ctx.clearRect(
    0,
    0,
    width,
    height,
  )

  /*
   * 背景光
   */
  drawBackgroundGlow()

  /*
   * 两个不完整轨道
   */
  drawOrbit(
    Math.min(
      width,
      height,
    ) * 0.29,
    0.045,
    time * 0.00003,
  )

  drawOrbit(
    Math.min(
      width,
      height,
    ) * 0.39,
    0.025,
    -time * 0.00002,
  )

  /*
   * 节点网络
   */
  drawNodeConnections()

  /*
   * 粒子网络
   */
  updateParticles(time)

  drawParticleConnections()

  drawParticles()

  frameId =
    requestAnimationFrame(draw)
}

function handleMouseMove(
  event: MouseEvent,
) {
  const container =
    containerRef.value

  if (!container) {
    return
  }

  const rect =
    container.getBoundingClientRect()

  mouse.x =
    event.clientX -
    rect.left

  mouse.y =
    event.clientY -
    rect.top

  mouse.active = true
}

function handleMouseEnter() {
  isHovering.value = true
  mouse.active = true
}

function handleMouseLeave() {
  isHovering.value = false

  mouse.active = false

  mouse.x =
    width / 2

  mouse.y =
    height / 2
}

function handleIntersection(
  entries: IntersectionObserverEntry[],
) {
  const entry = entries[0]

  if (!entry) {
    return
  }

  isVisible.value =
    entry.isIntersecting
}

onMounted(async () => {
  await nextTick()

  resizeCanvas()

  window.addEventListener(
    'resize',
    resizeCanvas,
    {
      passive: true,
    },
  )

  observer =
    new IntersectionObserver(
      handleIntersection,
      {
        threshold: 0.08,
      },
    )

  if (
    containerRef.value
  ) {
    observer.observe(
      containerRef.value,
    )
  }

  frameId =
    requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(
    frameId,
  )

  observer?.disconnect()

  observer = null

  window.removeEventListener(
    'resize',
    resizeCanvas,
  )
})
</script>

<template>
  <section ref="containerRef" class="verse-hero" :class="{
    'is-hovering': isHovering,
  }" @mousemove="handleMouseMove" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- 背景 -->
    <div class="verse-hero__noise" />
    <div class="verse-hero__grid" />
    <div class="verse-hero__scanline" />

    <!-- Canvas -->
    <canvas ref="canvasRef" class="verse-hero__canvas" />

    <!-- 左上信息 -->
    <div class="verse-hero__meta verse-hero__meta--top-left">
      <span class="meta-index">
        00
      </span>

      <span class="meta-line" />

      <span>
        PERSONAL KNOWLEDGE SPACE
      </span>
    </div>

    <!-- 右上信息 -->
    <div class="verse-hero__meta verse-hero__meta--top-right">
      <span>
        2026
      </span>

      <span class="meta-line" />

      <span class="meta-live">
        <i />
        ONLINE
      </span>
    </div>

    <!-- 中央主体 -->
    <div class="verse-hero__content">
      <div class="verse-hero__eyebrow">
        <span />
        TECHNICAL NOTES / SYSTEMS / IDEAS
      </div>

      <h1 class="verse-hero__title">
        Verse
      </h1>

      <p class="verse-hero__subtitle">
        A living archive of
        <span>Frontend</span>,
        <span>Backend</span>,
        <span>AI</span>
        and
        <span>Rust</span>.
      </p>

      <div class="verse-hero__rule">
        <span />
        <span />
        <span />
      </div>
    </div>

    <!-- 知识节点 -->
    <div v-for="node in nodes" :key="node.index" class="verse-node" :class="[
      `verse-node--${node.name.toLowerCase()}`,
    ]">
      <span class="verse-node__index">
        {{ node.index }}
      </span>

      <span class="verse-node__dot" />

      <span class="verse-node__label">
        {{ node.name }}
      </span>
    </div>

    <!-- 左下 -->
    <div class="verse-hero__footer verse-hero__footer--left">
      <span class="footer-mark">
        +
      </span>

      <span>
        CURATED / BUILT / WRITTEN
      </span>
    </div>

    <!-- 右下 -->
    <div class="verse-hero__footer verse-hero__footer--right">
      <span>
        SCROLL TO EXPLORE
      </span>

      <span class="footer-arrow">
        ↘
      </span>
    </div>
  </section>
</template>

<style scoped>
.verse-hero {
  --accent-rgb: 120, 120, 255;

  position: relative;
  display: flex;
  width: 100%;
  min-height: 650px;
  overflow: hidden;
  background:
    radial-gradient(
      ellipse at center,
      rgba(
        var(--accent-rgb),
        0.026
      ),
      transparent 58%
    );
  border: 1px solid rgba(128, 128, 128, 0.08);
  border-radius: 28px;
  user-select: none;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.verse-hero__canvas {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
  inset: 0;
}

/* =========================
   背景 Grid
   ========================= */

.verse-hero__grid {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(
      rgba(
        128,
        128,
        128,
        0.07
      ) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(
        128,
        128,
        128,
        0.07
      ) 1px,
      transparent 1px
    );
  background-size: 64px 64px;
  opacity: 0.42;
  inset: 0;
  mask-image:
    radial-gradient(
      ellipse at center,
      black 0%,
      rgba(0, 0, 0, 0.9) 35%,
      transparent 78%
    );
}

/* =========================
   Noise
   ========================= */

.verse-hero__noise {
  position: absolute;
  z-index: 6;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E");
  opacity: 0.025;
  inset: 0;
}

/* =========================
   Scanline
   ========================= */

.verse-hero__scanline {
  position: absolute;
  top: -10%;
  right: 0;
  left: 0;
  z-index: 4;
  height: 1px;
  pointer-events: none;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(
        var(--accent-rgb),
        0.18
      ),
      transparent
    );
  opacity: 0;
  animation: scan 9s linear infinite;
}

.verse-hero.is-hovering .verse-hero__scanline {
  opacity: 1;
}

@keyframes scan {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(760px);
  }
}

/* =========================
   Meta
   ========================= */

.verse-hero__meta {
  position: absolute;
  top: 28px;
  z-index: 7;
  display: flex;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.35;
  align-items: center;
  gap: 10px;
}

.verse-hero__meta--top-left {
  left: 30px;
}

.verse-hero__meta--top-right {
  right: 30px;
}

.meta-index {
  font-variant-numeric: tabular-nums;
  opacity: 0.6;
}

.meta-line {
  width: 34px;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
}

.meta-live {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-live i {
  display: block;
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  animation: live 2s ease-in-out infinite;
}

@keyframes live {
  0%,
  100% {
    opacity: 0.25;
  }

  50% {
    opacity: 1;
  }
}

/* =========================
   Center
   ========================= */

.verse-hero__content {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    transform 0.8s cubic-bezier(
      0.22,
      1,
      0.36,
      1
    );
}

.verse-hero.is-hovering .verse-hero__content {
  transform: translateY(-8px);
}

.verse-hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.17em;
  opacity: 0.36;
}

.verse-hero__eyebrow span {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.65;
}

.verse-hero__title {
  display: block;
  padding: 0 0.12em;

  /*
   * 给文字左右留出真正的安全区域
   */
  margin: 8px 0 0;

  /*
   * 防止背景裁切影响最后一个字母
   */
  overflow: visible;
  font-size:
    clamp(
      76px,
      10vw,
      132px
    );
  font-weight: 750;

  /*
   * 这里不要使用 1
   * 给字体上下留一点 glyph 空间
   */
  line-height: 1.08;

  /*
   * 不要压得太狠
   */
  letter-spacing: -0.035em;
  color: transparent;

  /*
   * 不允许 Verse 被拆开
   */
  white-space: nowrap;

  /*
   * 渐变文字
   */
  background:
    linear-gradient(
      120deg,
      currentColor 20%,
      rgba(
        var(--accent-rgb),
        0.65
      ) 100%
    );
  -webkit-background-clip: text;
  background-clip: text;
}

.verse-hero.is-hovering .verse-hero__title {
  filter:
    drop-shadow(
      0 0 42px rgba(
        var(--accent-rgb),
        0.11
      )
    );
  transform: scale(1.015);
}

.verse-hero__subtitle {
  max-width: 520px;
  margin: 26px 0 0;
  font-size:
    clamp(
      12px,
      1.3vw,
      14px
    );
  line-height: 1.7;
  letter-spacing: 0.01em;
  opacity: 0.48;
}

.verse-hero__subtitle span {
  opacity: 0.92;
}

.verse-hero__rule {
  display: flex;
  margin-top: 28px;
  opacity: 0.25;
  align-items: center;
  gap: 5px;
}

.verse-hero__rule span {
  width: 5px;
  height: 5px;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.verse-hero__rule span:nth-child(2) {
  width: 24px;
  border-radius: 0;
}

/* =========================
   Node
   ========================= */

.verse-node {
  position: absolute;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 9px;
  pointer-events: none;
  opacity: 0.36;
  transition:
    opacity 0.45s ease,
    transform 0.6s cubic-bezier(
      0.22,
      1,
      0.36,
      1
    );
}

.verse-hero.is-hovering .verse-node {
  opacity: 0.78;
}

.verse-node__index {
  font-size: 8px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
  opacity: 0.55;
}

.verse-node__dot {
  width: 5px;
  height: 5px;
  border:
    1px solid rgba(
      var(--accent-rgb),
      0.45
    );
  border-radius: 50%;
  box-shadow:
    0 0 0 3px rgba(
      var(--accent-rgb),
      0.025
    );
}

.verse-node__label {
  font-size: 10px;
  font-weight: 550;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.verse-node--frontend {
  top: 39%;
  left: 17%;
}

.verse-node--ai {
  top: 25%;
  right: 18%;
}

.verse-node--rust {
  bottom: 22%;
  left: 20%;
}

.verse-node--backend {
  right: 17%;
  bottom: 27%;
}

.verse-hero.is-hovering .verse-node--frontend {
  transform: translateX(-5px);
}

.verse-hero.is-hovering .verse-node--ai {
  transform: translateY(-5px);
}

.verse-hero.is-hovering .verse-node--rust {
  transform: translateX(-5px);
}

.verse-hero.is-hovering .verse-node--backend {
  transform: translateX(5px);
}

/* =========================
   Footer
   ========================= */

.verse-hero__footer {
  position: absolute;
  bottom: 28px;
  z-index: 7;
  display: flex;
  font-size: 8px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.28;
  align-items: center;
  gap: 9px;
}

.verse-hero__footer--left {
  left: 30px;
}

.verse-hero__footer--right {
  right: 30px;
}

.footer-mark {
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
}

.footer-arrow {
  font-size: 16px;
  line-height: 1;
  opacity: 0.7;
  transition: transform 0.35s ease;
}

.verse-hero:hover .footer-arrow {
  transform:
    translate(
      3px,
      3px
    );
}

/* =========================
   Mobile
   ========================= */

@media (max-width: 768px) {
  .verse-hero {
    min-height: 500px;
    border-radius: 20px;
  }

  .verse-hero__grid {
    background-size: 42px 42px;
  }

  .verse-hero__meta {
    top: 20px;
    font-size: 7px;
  }

  .verse-hero__meta--top-left {
    left: 18px;
  }

  .verse-hero__meta--top-right {
    right: 18px;
  }

  .verse-hero__meta--top-left > span:last-child {
    display: none;
  }

  .verse-hero__title {
    font-size:
      clamp(
        72px,
        24vw,
        112px
      );
  }

  .verse-hero__eyebrow {
    font-size: 7px;
    letter-spacing: 0.13em;
  }

  .verse-hero__subtitle {
    max-width: 290px;
    padding: 0 16px;
    font-size: 11px;
    line-height: 1.8;
  }

  .verse-node {
    gap: 6px;
  }

  .verse-node__index {
    font-size: 7px;
  }

  .verse-node__label {
    font-size: 8px;
    letter-spacing: 0.1em;
  }

  .verse-node--frontend {
    top: 35%;
    left: 8%;
  }

  .verse-node--ai {
    top: 26%;
    right: 8%;
  }

  .verse-node--rust {
    bottom: 21%;
    left: 9%;
  }

  .verse-node--backend {
    right: 8%;
    bottom: 27%;
  }

  .verse-hero__footer {
    bottom: 18px;
    font-size: 7px;
  }

  .verse-hero__footer--left {
    left: 18px;
  }

  .verse-hero__footer--right {
    right: 18px;
  }

  .verse-hero__footer--left span:last-child {
    display: none;
  }
}

/* =========================
   Reduced Motion
   ========================= */

@media (prefers-reduced-motion: reduce) {
  .verse-hero__scanline,
  .meta-live i {
    animation: none;
  }

  .verse-hero__content,
  .verse-hero__title,
  .verse-node {
    transition: none;
  }
}
</style>
