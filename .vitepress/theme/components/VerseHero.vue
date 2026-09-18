<script setup lang="ts">
import {
  computed,
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
  baseX: number
  baseY: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const isHovering = ref(false)
const isVisible = ref(false)

const mouse = {
  x: 0,
  y: 0,
  active: false,
}

let ctx: CanvasRenderingContext2D | null = null
let animationFrame = 0
let observer: IntersectionObserver | null = null

let width = 0
let height = 0
let dpr = 1

const particles: Particle[] = []

const PARTICLE_COUNT = 42
const CONNECTION_DISTANCE = 145

const isDark = computed(() => {
  if (typeof document === 'undefined') return true

  return document.documentElement.classList.contains('dark')
})

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createParticles() {
  particles.length = 0

  const radius = Math.min(width, height) * 0.27

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle =
      (Math.PI * 2 * i) / PARTICLE_COUNT +
      random(-0.08, 0.08)

    const particleRadius =
      radius + random(-45, 45)

    particles.push({
      angle,
      radius: particleRadius,

      speed: random(0.00015, 0.00045),

      size: random(1.2, 2.8),

      phase: random(0, Math.PI * 2),

      opacity: random(0.25, 0.8),

      x: 0,
      y: 0,

      baseX: 0,
      baseY: 0,
    })
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value

  if (!canvas || !container) return

  const rect = container.getBoundingClientRect()

  width = rect.width
  height = rect.height

  dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = width * dpr
  canvas.height = height * dpr

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx = canvas.getContext('2d')

  if (!ctx) return

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0,
  )

  createParticles()
}

function updateParticles(time: number) {
  const centerX = width / 2
  const centerY = height / 2

  for (const particle of particles) {
    particle.angle += particle.speed

    const breathing =
      Math.sin(
        time * 0.0008 + particle.phase,
      ) * 8

    const radius =
      particle.radius + breathing

    let x =
      centerX +
      Math.cos(particle.angle) * radius

    let y =
      centerY +
      Math.sin(particle.angle) * radius

    /*
     * 鼠标排斥
     */
    if (mouse.active) {
      const dx = x - mouse.x
      const dy = y - mouse.y

      const distance = Math.sqrt(
        dx * dx + dy * dy,
      )

      const influence = Math.max(
        0,
        1 - distance / 180,
      )

      if (influence > 0) {
        const force =
          influence * influence * 42

        if (distance > 0) {
          x += (dx / distance) * force
          y += (dy / distance) * force
        }
      }
    }

    /*
     * 鼠标造成轻微视差
     */
    const parallaxX = mouse.active
      ? (mouse.x - centerX) * 0.025
      : 0

    const parallaxY = mouse.active
      ? (mouse.y - centerY) * 0.025
      : 0

    particle.baseX = x
    particle.baseY = y

    particle.x = x + parallaxX
    particle.y = y + parallaxY
  }
}

function drawGlow(
  x: number,
  y: number,
  radius: number,
) {
  if (!ctx) return

  const gradient = ctx.createRadialGradient(
    x,
    y,
    0,
    x,
    y,
    radius,
  )

  if (isDark.value) {
    gradient.addColorStop(
      0,
      'rgba(120, 120, 255, 0.13)',
    )

    gradient.addColorStop(
      0.45,
      'rgba(120, 120, 255, 0.045)',
    )

    gradient.addColorStop(
      1,
      'rgba(120, 120, 255, 0)',
    )
  } else {
    gradient.addColorStop(
      0,
      'rgba(80, 80, 220, 0.08)',
    )

    gradient.addColorStop(
      0.45,
      'rgba(80, 80, 220, 0.025)',
    )

    gradient.addColorStop(
      1,
      'rgba(80, 80, 220, 0)',
    )
  }

  ctx.fillStyle = gradient

  ctx.beginPath()

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2,
  )

  ctx.fill()
}

function drawConnections() {
  if (!ctx) return

  const lineColor = isDark.value
    ? '120, 120, 255'
    : '80, 80, 180'

  for (let i = 0; i < particles.length; i++) {
    for (
      let j = i + 1;
      j < particles.length;
      j++
    ) {
      const a = particles[i]
      const b = particles[j]

      const dx = a.x - b.x
      const dy = a.y - b.y

      const distance = Math.sqrt(
        dx * dx + dy * dy,
      )

      if (distance > CONNECTION_DISTANCE) {
        continue
      }

      let opacity =
        (1 - distance / CONNECTION_DISTANCE) *
        0.25

      if (isHovering.value) {
        opacity *= 1.8
      }

      ctx.beginPath()

      ctx.moveTo(a.x, a.y)

      ctx.lineTo(b.x, b.y)

      ctx.strokeStyle =
        `rgba(${lineColor}, ${opacity})`

      ctx.lineWidth =
        isHovering.value ? 1 : 0.7

      ctx.stroke()
    }
  }
}

function drawParticles() {
  if (!ctx) return

  for (const particle of particles) {
    const size =
      particle.size *
      (isHovering.value ? 1.25 : 1)

    const opacity =
      particle.opacity *
      (isHovering.value ? 1.25 : 1)

    ctx.beginPath()

    ctx.arc(
      particle.x,
      particle.y,
      size,
      0,
      Math.PI * 2,
    )

    ctx.fillStyle = isDark.value
      ? `rgba(170, 170, 255, ${opacity})`
      : `rgba(80, 80, 180, ${opacity})`

    ctx.fill()
  }
}

function drawOrbit(
  radius: number,
  opacity: number,
) {
  if (!ctx) return

  const centerX = width / 2
  const centerY = height / 2

  ctx.beginPath()

  ctx.arc(
    centerX,
    centerY,
    radius,
    0,
    Math.PI * 2,
  )

  ctx.strokeStyle = isDark.value
    ? `rgba(130, 130, 255, ${opacity})`
    : `rgba(80, 80, 180, ${opacity})`

  ctx.lineWidth = 0.7

  ctx.stroke()
}

function draw(time: number) {
  if (!ctx) return

  ctx.clearRect(
    0,
    0,
    width,
    height,
  )

  updateParticles(time)

  const centerX = width / 2
  const centerY = height / 2

  /*
   * 环境光
   */
  drawGlow(
    centerX,
    centerY,
    Math.min(width, height) * 0.42,
  )

  /*
   * Orbit
   */
  drawOrbit(
    Math.min(width, height) * 0.25,
    0.06,
  )

  drawOrbit(
    Math.min(width, height) * 0.33,
    0.035,
  )

  /*
   * 网络连接
   */
  drawConnections()

  /*
   * 粒子
   */
  drawParticles()

  animationFrame =
    requestAnimationFrame(draw)
}

function handleMouseMove(
  event: MouseEvent,
) {
  const container =
    containerRef.value

  if (!container) return

  const rect =
    container.getBoundingClientRect()

  mouse.x =
    event.clientX - rect.left

  mouse.y =
    event.clientY - rect.top

  mouse.active = true
}

function handleMouseEnter() {
  isHovering.value = true
  mouse.active = true
}

function handleMouseLeave() {
  isHovering.value = false
  mouse.active = false

  mouse.x = width / 2
  mouse.y = height / 2
}

function handleIntersection(
  entries: IntersectionObserverEntry[],
) {
  const entry = entries[0]

  if (!entry) return

  isVisible.value =
    entry.isIntersecting
}

onMounted(async () => {
  await nextTick()

  resizeCanvas()

  window.addEventListener(
    'resize',
    resizeCanvas,
    { passive: true },
  )

  observer =
    new IntersectionObserver(
      handleIntersection,
      {
        threshold: 0.1,
      },
    )

  if (containerRef.value) {
    observer.observe(
      containerRef.value,
    )
  }

  animationFrame =
    requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(
    animationFrame,
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
  <section
    ref="containerRef"
    class="verse-hero"
    :class="{
      'is-hovering': isHovering,
      'is-visible': isVisible,
    }"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Canvas 网络 -->
    <canvas
      ref="canvasRef"
      class="verse-hero__canvas"
    />

    <!-- 中央 Logo -->
    <div class="verse-hero__center">
      <div class="verse-hero__logo">
        Z
      </div>

      <div class="verse-hero__brand">
        zeMinng
      </div>

      <div class="verse-hero__name">
        Verse
      </div>

      <div class="verse-hero__subtitle">
        Frontend · Backend · AI · Rust
      </div>
    </div>

    <!-- 四周内容节点 -->
    <div class="verse-hero__node node-frontend">
      <span>Frontend</span>
    </div>

    <div class="verse-hero__node node-ai">
      <span>AI</span>
    </div>

    <div class="verse-hero__node node-rust">
      <span>Rust</span>
    </div>

    <div class="verse-hero__node node-backend">
      <span>Backend</span>
    </div>

    <!-- 底部提示 -->
    <div class="verse-hero__hint">
      <span class="dot" />
      Explore the Verse
    </div>
  </section>
</template>

<style scoped>
.verse-hero {
  position: relative;

  width: 100%;
  min-height: 600px;

  overflow: hidden;

  display: flex;

  align-items: center;
  justify-content: center;

  border-radius: 28px;

  background:
    radial-gradient(
      circle at center,
      rgba(120, 120, 255, 0.035),
      transparent 55%
    );

  isolation: isolate;

  cursor: crosshair;
}

.verse-hero__canvas {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  z-index: 1;

  pointer-events: none;
}

/* =========================
   中央区域
   ========================= */

.verse-hero__center {
  position: relative;

  z-index: 5;

  display: flex;

  flex-direction: column;

  align-items: center;

  pointer-events: none;

  user-select: none;

  transition:
    transform 0.6s
      cubic-bezier(0.22, 1, 0.36, 1);
}

.verse-hero.is-hovering
  .verse-hero__center {
  transform: scale(1.035);
}

.verse-hero__logo {
  width: 100px;
  height: 100px;

  display: flex;

  align-items: center;
  justify-content: center;

  font-size: 62px;

  font-weight: 800;

  letter-spacing: -0.08em;

  border-radius: 28px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.08),
      rgba(255, 255, 255, 0.015)
    );

  border: 1px solid
    rgba(130, 130, 255, 0.15);

  box-shadow:
    0 0 0 1px
      rgba(130, 130, 255, 0.025),
    0 0 60px
      rgba(100, 100, 255, 0.08);

  transition:
    transform 0.6s
      cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.6s ease;
}

.verse-hero.is-hovering
  .verse-hero__logo {
  transform: translateY(-4px);

  box-shadow:
    0 0 0 1px
      rgba(130, 130, 255, 0.08),
    0 0 90px
      rgba(100, 100, 255, 0.2);
}

.verse-hero__brand {
  margin-top: 22px;

  font-size: 13px;

  font-weight: 600;

  letter-spacing: 0.28em;

  text-transform: uppercase;

  opacity: 0.45;
}

.verse-hero__name {
  margin-top: 4px;

  font-size: clamp(
    42px,
    6vw,
    76px
  );

  font-weight: 750;

  letter-spacing: -0.065em;

  line-height: 1;

  background:
    linear-gradient(
      120deg,
      currentColor 20%,
      rgba(120, 120, 255, 0.72)
    );

  -webkit-background-clip: text;

  background-clip: text;

  color: transparent;
}

.verse-hero__subtitle {
  margin-top: 16px;

  font-size: 12px;

  letter-spacing: 0.16em;

  opacity: 0.4;
}

/* =========================
   四个知识节点
   ========================= */

.verse-hero__node {
  position: absolute;

  z-index: 4;

  padding: 8px 14px;

  border-radius: 999px;

  font-size: 11px;

  letter-spacing: 0.08em;

  opacity: 0.38;

  border: 1px solid
    rgba(130, 130, 255, 0.1);

  background:
    rgba(120, 120, 255, 0.025);

  backdrop-filter: blur(8px);

  transition:
    opacity 0.4s ease,
    transform 0.5s
      cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.4s ease;
}

.verse-hero.is-hovering
  .verse-hero__node {
  opacity: 0.75;

  border-color:
    rgba(130, 130, 255, 0.22);
}

.node-frontend {
  top: 27%;
  left: 18%;
}

.node-ai {
  top: 20%;
  right: 22%;
}

.node-rust {
  bottom: 25%;
  left: 23%;
}

.node-backend {
  bottom: 22%;
  right: 19%;
}

/* =========================
   底部
   ========================= */

.verse-hero__hint {
  position: absolute;

  z-index: 5;

  bottom: 28px;

  left: 50%;

  transform: translateX(-50%);

  display: flex;

  align-items: center;

  gap: 8px;

  font-size: 10px;

  letter-spacing: 0.14em;

  text-transform: uppercase;

  opacity: 0.3;

  white-space: nowrap;
}

.dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: currentColor;

  animation:
    blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* =========================
   Mobile
   ========================= */

@media (max-width: 768px) {
  .verse-hero {
    min-height: 480px;

    border-radius: 20px;
  }

  .verse-hero__logo {
    width: 78px;
    height: 78px;

    font-size: 48px;

    border-radius: 22px;
  }

  .verse-hero__brand {
    margin-top: 16px;

    font-size: 10px;
  }

  .verse-hero__subtitle {
    font-size: 9px;

    letter-spacing: 0.08em;
  }

  .verse-hero__node {
    font-size: 9px;

    padding: 6px 10px;
  }

  .node-frontend {
    top: 23%;
    left: 8%;
  }

  .node-ai {
    top: 18%;
    right: 9%;
  }

  .node-rust {
    bottom: 23%;
    left: 10%;
  }

  .node-backend {
    bottom: 20%;
    right: 8%;
  }
}

/* =========================
   Reduced Motion
   ========================= */

@media (prefers-reduced-motion: reduce) {
  .verse-hero__center,
  .verse-hero__logo,
  .verse-hero__node {
    transition: none;
  }

  .dot {
    animation: none;
  }
}
</style>
