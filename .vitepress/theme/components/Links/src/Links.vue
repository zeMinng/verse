<script setup lang="ts">
import Icon from './Icon.vue'
import Image from './Image.vue'
import Link from './Link.vue'
import type { LinkItem } from '../type'

const props = defineProps<{
  items: LinkItem[]
  grid?: number
}>()
</script>

<template>
  <div
    class="grid"
    :style="typeof props.grid === 'number' ? { gridTemplateColumns: `repeat(${props.grid}, 1fr)` } : undefined"
  >
    <Link
      v-for="(link, i) in props.items"
      :key="link.name + i"
      class="link"
      :href="link.link"
      :rel="link.rel"
      :target="link.target"
      no-icon
    >
      <span class="row">
        <Icon v-if="link.icon" :icon="link.icon" :size="link.size || '32'" />
        <Image v-else-if="link.image" :image="link.image" :size="link.size || '32'" />
        <span class="name" v-html="link.name"></span>
      </span>
      <p v-if="link.desc" class="desc" v-html="link.desc"></p>
      <p v-if="link.linkText" class="link-text">
        {{ link.linkText }} <span class="vpi-arrow-right" style="margin-left: 6px" />
      </p>
    </Link>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.5em;
  margin: 0.5em 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75em;
  width: 100%;
  min-width: 0;
}

.link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition:
    color 0.25s,
    transform 0.25s,
    box-shadow 0.25s,
    border-color 0.25s,
    background-color 0.25s;
  margin: 0;
  /* 替换：使用 VitePress 次级背景色作为边框 */
  border: 1px solid var(--vp-c-bg-alt);
  border-radius: 0.75em;
  /* 替换：使用 VitePress 标准软背景色 */
  background-color: var(--vp-c-bg-soft);
  padding: 1em;
  min-width: 0;
  text-decoration: none !important;
}

.link.lm-link {
  /* 替换：使用 VitePress 正文一级颜色 */
  color: var(--vp-c-text-1);
}

.link.lm-link:hover {
  /* transform: translateY(-2px);  */
  /* 替换：使用 VitePress 默认卡片阴影 */
  box-shadow: var(--vp-shadow-2);
  /* 替换：悬停时边框变为品牌色 */
  border-color: var(--vp-c-brand-1);
  /* 替换：悬停背景稍作深/浅色偏移 */
  background-color: var(--vp-c-bg-alt);
  /* 替换：悬停时文字颜色 */
  color: var(--vp-c-brand-1);
}

.link.lm-link:active {
  /* 保持逻辑 */
  transform: scale(0.98);
}

.iconify {
  flex-shrink: 0;
  /* 替换：图标默认跟随文字颜色 1 */
  color: var(--vp-c-text-1);
}

.name {
  flex: 1 1 0%;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  margin: 0.875em 0 0 0;
  /* 替换：描述使用 VitePress 二级文本颜色（灰色） */
  color: var(--vp-c-text-2);
  font-weight: 500;
  font-size: 0.75em;
  line-height: 1.5;
  word-break: break-all;
}

.link-text {
  display: flex;
  align-items: center;
  margin: 0;
  padding-top: 8px;
  font-weight: 500;
  font-size: 0.75em;
  line-height: 1.5;
  /* 替换：链接提示文字使用品牌颜色 */
  color: var(--vp-c-brand-1);
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: repeat(auto-fit, minmax(45%, 1fr)) !important;
  }
}
</style>
