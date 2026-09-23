<script setup lang="ts">
/** VitePress 相关资源：分组筛选、当前页标记与主题色适配。 */

import { Icon } from '@iconify/vue'
import { useRoute, withBase } from 'vitepress'
import { computed, ref } from 'vue'

export interface ResourceItem {
  name: string
  desc?: string
  link?: string
  icon?: string

  /**
   * 是否尝试使用 favicon。
   * 默认开启；设为 false 时直接回退到首字母。
   */
  favicon?: boolean
}

export interface ResourceGroup {
  title: string
  /** 兼容已有数据；分组导航不展示图标。 */
  icon?: string
  items: ResourceItem[]
}

const props = withDefaults(
  defineProps<{
    groups: ResourceGroup[]
    grid?: number
    showDomain?: boolean
  }>(),
  {
    grid: 2,
    showDomain: true,
  },
)

// 资源少时直接展开，避免为了查看一两个链接还要切换分组。
const availableGroups = computed(() => props.groups.filter(group => group.items.length > 0))
const totalItems = computed(() =>
  availableGroups.value.reduce((count, group) => count + group.items.length, 0),
)
const showNav = computed(() =>
  availableGroups.value.length > 1 &&
  totalItems.value > 4 &&
  availableGroups.value.every(group => group.title.trim()),
)

// 导航用索引切换，避免普通对象与 Vue 代理对象比较失败。
const selectedIndex = ref(0)
const activeIndex = computed(() =>
  selectedIndex.value < availableGroups.value.length ? selectedIndex.value : 0,
)
const activeGroup = computed(() => availableGroups.value[activeIndex.value] ?? null)
const visibleGroups = computed(() =>
  showNav.value ? (activeGroup.value ? [activeGroup.value] : []) : availableGroups.value,
)
const route = useRoute()

const EXTERNAL_URL_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i
const HTTP_URL_RE = /^https?:\/\//i

const isExternal = (href?: string) => Boolean(href && EXTERNAL_URL_RE.test(href))

const isHttpUrl = (href?: string) => Boolean(href && HTTP_URL_RE.test(href))

const gridStyle = () => ({
  '--rl-grid': Math.max(1, Math.min(4, Math.round(Number(props.grid) || 2))),
})

const hrefOf = (link?: string) => {
  if (!link) return undefined
  return isExternal(link) || link.startsWith('#') ? link : withBase(link)
}

const normalizePath = (path: string) =>
  decodeURI(path.split(/[?#]/, 1)[0])
    .replace(/\/index(?:\.html)?$/, '/')
    .replace(/\.html$/, '')
    .replace(/\/$/, '') || '/'

const isCurrent = (link?: string) => {
  if (!link || isExternal(link) || link.startsWith('#')) return false
  const href = hrefOf(link)
  if (!href?.startsWith('/')) return false
  try {
    return normalizePath(href) === normalizePath(route.path)
  } catch {
    return false
  }
}

const hostOf = (link?: string) => {
  if (!link || !isHttpUrl(link)) return ''

  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const badgeOf = (name: string) => {
  const value = (name || '?').trim()
  return value.charAt(0).toUpperCase()
}

const faviconUrl = (link?: string) => {
  const host = hostOf(link)
  return host
    ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`
    : ''
}

const shouldUseFavicon = (item: ResourceItem) => {
  return item.favicon !== false && !item.icon && Boolean(faviconUrl(item.link))
}

const favFail = ref<Record<string, boolean>>({})

const itemKey = (item: ResourceItem) => `${item.name}:${item.link ?? ''}`

const favFailed = (item: ResourceItem) => favFail.value[itemKey(item)] === true

const markFavFail = (item: ResourceItem) => {
  favFail.value = {
    ...favFail.value,
    [itemKey(item)]: true,
  }
}
</script>

<template>
  <div class="rl" :class="{ 'rl--nav': showNav }" :style="gridStyle()">
    <nav v-if="showNav" class="rl-filters" aria-label="资源分组">
      <button v-for="(group, index) in availableGroups" :key="index" type="button" class="rl-filter"
        :aria-pressed="activeIndex === index" @click="selectedIndex = index">{{ group.title }}</button>
    </nav>
    <div class="rl-sections">
      <section v-for="(group, gi) in visibleGroups" :key="gi" class="rl-section">
        <h3 v-if="group.title" class="rl-title" :class="{ 'rl-title--sr': showNav }">{{ group.title }}</h3>
        <div class="rl-grid" :class="{ 'rl-grid--single': group.items.length === 1 }">
          <component :is="item.link ? 'a' : 'div'" v-for="(item, i) in group.items" :key="i"
            class="rl-card" :class="{ 'rl-card--current': isCurrent(item.link) }"
            :href="hrefOf(item.link)"
            :target="isExternal(item.link) ? '_blank' : undefined"
            :rel="isExternal(item.link) ? 'noopener noreferrer' : undefined"
            :aria-current="isCurrent(item.link) ? 'page' : undefined">
            <span class="rl-icon" aria-hidden="true">
              <Icon v-if="item.icon" :icon="item.icon" :width="20" :height="20" inline />
              <img v-else-if="shouldUseFavicon(item) && !favFailed(item)" class="rl-fav"
                :src="faviconUrl(item.link)" alt="" loading="lazy" decoding="async"
                @error="markFavFail(item)" />
              <span v-else class="rl-badge">{{ badgeOf(item.name) }}</span>
            </span>
            <span class="rl-body">
              <span class="rl-name">{{ item.name }}</span>
              <span v-if="item.desc" class="rl-desc">{{ item.desc }}</span>
            </span>
            <span v-if="showDomain && hostOf(item.link)" class="rl-host">{{ hostOf(item.link) }}</span>
          </component>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.rl {
  margin: 1.5rem 0;
  color: var(--vp-c-text-1);
}
.rl-filters {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  border-bottom: 1px solid var(--vp-c-divider);
  scrollbar-width: none;
}
.rl-filters::-webkit-scrollbar { display: none; }
.rl-filter {
  position: relative;
  flex: none;
  padding: 0.65rem 0 0.7rem;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
}
.rl-filter:hover,
.rl-filter[aria-pressed="true"] { color: var(--vp-c-text-1); }
.rl-filter[aria-pressed="true"] { font-weight: 600; }
.rl-filter[aria-pressed="true"]::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--vp-c-brand-1);
  content: '';
}
.rl-filter:focus-visible,
.rl-card:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.rl-sections {
  display: grid;
  gap: 1.7rem;
}
.rl--nav .rl-sections { padding-top: 1.1rem; }
.rl-section { min-width: 0; }
.rl-title {
  margin: 0 0 0.7rem;
  border: 0;
  color: var(--vp-c-text-2);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.5;
}
.rl-title--sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.rl-grid {
  display: grid;
  grid-template-columns: repeat(var(--rl-grid), minmax(0, 1fr));
  gap: 0.7rem;
}
.rl-grid--single { grid-template-columns: minmax(0, 34rem); }
.rl-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  min-height: 4.6rem;
  padding: 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none !important;
}
.rl-card[href]:hover {
  border-color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
  background: var(--vp-c-bg-alt);
}
.rl-card--current,
.rl-card--current[href]:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.rl-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 7px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}
.rl-card--current .rl-icon { background: var(--vp-c-bg-soft); }
.rl-fav { width: 19px; height: 19px; border-radius: 3px; }
.rl-badge { font-size: 0.85rem; font-weight: 600; }
.rl-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.rl-name {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rl-desc {
  display: -webkit-box;
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.rl-host {
  overflow: hidden;
  flex: none;
  max-width: 30%;
  color: var(--vp-c-text-3);
  font-size: 0.6875rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 720px) {
  .rl-grid { grid-template-columns: 1fr; }
  .rl-filters { gap: 1.25rem; }
  .rl-host { max-width: 28%; }
}
</style>
