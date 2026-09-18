<script setup>
import CodeGroup from '@components/shared/CodeGroup.vue'
import RiveAnimation from '@components/shared/RiveAnimation.vue'

import viteAnimation from '@assets/vite/animations/641_x_629_vite_masthead.riv'

if (typeof document !== 'undefined') {
  const preloadLink = document.createElement('link')
  preloadLink.rel = 'preload'
  preloadLink.href = viteAnimation
  preloadLink.as = 'fetch'
  preloadLink.crossOrigin = 'anonymous'
  document.head.appendChild(preloadLink)
}

const installTabs = [
  { label: 'npm', code: 'npm create vite-uniapp@latest', prefix: '$ ' },
  { label: 'Yarn', code: 'yarn create vite-uniapp@latest', prefix: '$ ' },
  { label: 'pnpm', code: 'pnpm create vite-uniapp@latest', prefix: '$ ' },
  { label: 'Bun', code: 'bun create vite-uniapp@latest', prefix: '$ ' },
  { label: 'Deno', code: 'deno init --npm vite-uniapp@latest', prefix: '$ ' },
]
</script>

<template>
  <div
    class="wrapper wrapper--ticks grid md:grid-cols-2 w-full border-nickel md:divide-x"
  >
    <div
      class="flex flex-col p-10 justify-between gap-20 items-center md:items-start"
    >
      <div
        class="flex flex-col gap-5 items-center md:items-start text-center md:text-left"
      >
        <a
          class="flex items-center gap-2"
          href="https://voidzero.dev"
          target="_blank"
        >
          <span class="text-grey text-xs font-mono uppercase tracking-wide">By</span>
          <span class="text-white text-xs font-mono tracking-wide">zeMinng</span>
        </a>
        <h1 class="text-white text-pretty max-w-[25rem]">
          Verse
        </h1>
        <p class="text-white/70 md:text-lg max-w-[27rem] text-pretty">
          Personal technical notes, separated by chapters. <br /> 记录代码片段、技术实践与零散思考。
        </p>
        <div class="flex items-center gap-5 mt-8">
          <a href="/start" class="button button--primary inline-block w-fit">
            Get Started
          </a>
          <a
            href="https://github.com/zeMinng"
            target="_blank"
            rel="noopener noreferrer"
            class="button inline-block w-fit"
          >
            View on GitHub
          </a>
        </div>
      </div>
      <CodeGroup
        :tabs="installTabs"
        class="hidden md:block w-full -mb-[16px]"
        style="
          --vp-code-tab-bg: var(--color-slate);
          --vp-code-block-bg: var(--color-slate);
          --vp-code-tab-divider: #000;
        "
      />
    </div>
    <div class="flex flex-col sm:min-h-[30rem]">
      <div
        class="relative px-10 pb-10 md:pt-10 h-full flex flex-col justify-center overflow-clip"
      >
        <ClientOnly>
          <RiveAnimation
            :desktop-src="viteAnimation"
            :mobile-src="viteAnimation"
            :desktop-width="641"
            :desktop-height="629"
            :mobile-width="641"
            :mobile-height="629"
            canvas-class="w-full"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>