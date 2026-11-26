<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import pkg from '../../../package.json' with { type: 'json' }

const { frontmatter } = useData()

interface Dep {
  name: string
  current: string
  type: 'dependencies' | 'devDependencies'
  latest?: string
  stableLatest?: string
  isPrerelease: boolean
  status: 'loading' | 'latest' | 'outdated' | 'error'
  diff?: 'none' | 'patch' | 'minor' | 'major'
}

const deps = ref<Dep[]>([])
const done = ref(false)
const searchQuery = ref('')

const filteredDeps = computed(() => {
  if (!searchQuery.value) return deps.value
  const q = searchQuery.value.toLowerCase()
  return deps.value.filter((d) => d.name.toLowerCase().includes(q))
})

const productionDeps = computed(() => filteredDeps.value.filter((d) => d.type === 'dependencies'))
const devDeps = computed(() => filteredDeps.value.filter((d) => d.type === 'devDependencies'))

const stats = computed(() => {
  const total = deps.value.length
  const latest = deps.value.filter((d) => d.status === 'latest').length
  const outdated = deps.value.filter((d) => d.status === 'outdated').length
  const outdatedPercent = total > 0 ? Math.round((outdated / total) * 100) : 0
  return { total, latest, outdated, outdatedPercent }
})

function buildList(): Dep[] {
  const list: Dep[] = []
  const depsMap = pkg.dependencies ?? {}
  const devMap = pkg.devDependencies ?? {}
  for (const [name, version] of Object.entries(depsMap)) {
    list.push({ name, current: version, type: 'dependencies', status: 'loading', isPrerelease: false })
  }
  for (const [name, version] of Object.entries(devMap)) {
    list.push({ name, current: version, type: 'devDependencies', status: 'loading', isPrerelease: false })
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

function cleanVersion(v: string): string {
  return v.replace(/^[\^~>=<\s]+/, '')
}

function compareVersion(a: string, b: string): number {
  const parse = (v: string) => {
    const main = cleanVersion(v).split('-')[0].split('.').map(Number)
    const pre = cleanVersion(v).split('-')[1] || ''
    return { main, pre }
  }
  const pa = parse(a)
  const pb = parse(b)
  for (let i = 0; i < 3; i++) {
    const x = pa.main[i] || 0
    const y = pb.main[i] || 0
    if (x > y) return 1
    if (x < y) return -1
  }
  if (!pa.pre && pb.pre) return 1
  if (pa.pre && !pb.pre) return -1
  if (pa.pre && pb.pre) {
    return pa.pre.localeCompare(pb.pre, undefined, { numeric: true })
  }
  return 0
}

function diffType(current: string, latest: string): Dep['diff'] {
  const pc = cleanVersion(current).split('.').map(Number)
  const pl = cleanVersion(latest).split('.').map(Number)
  if ((pl[0] || 0) !== (pc[0] || 0)) return 'major'
  if ((pl[1] || 0) !== (pc[1] || 0)) return 'minor'
  return 'patch'
}

async function fetchLatest(dep: Dep) {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(dep.name)}`,
      { signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    const tags = data['dist-tags'] || {}
    const stableLatest = tags.latest as string
    const currentIsPre = /-/.test(cleanVersion(dep.current))
    dep.isPrerelease = currentIsPre
    dep.stableLatest = stableLatest

    let trackLatest = stableLatest
    if (currentIsPre && tags.next) trackLatest = tags.next
    dep.latest = trackLatest

    const cmp = compareVersion(dep.current, trackLatest)
    if (cmp >= 0) {
      dep.status = 'latest'
      dep.diff = 'none'
    } else {
      dep.status = 'outdated'
      dep.diff = diffType(dep.current, trackLatest)
    }
  } catch {
    dep.status = 'error'
  }
}

onMounted(async () => {
  document
    .querySelectorAll('.docs-layout .VPDoc.has-aside .content-container, .docs-layout .container, .docs-layout .content')
    .forEach((el) => {
      ;(el as HTMLElement).style.maxWidth = '1440px'
    })

  deps.value = buildList()
  await Promise.all(deps.value.map(fetchLatest))
  done.value = true
})
</script>

<template>
  <div class="deps-panel">
    <!-- Hero -->
    <div class="hero">
      <h1 class="hero-title">{{ frontmatter.title }}</h1>
      <p v-if="frontmatter.description" class="hero-desc">{{ frontmatter.description }}</p>
    </div>

    <!-- Stats overview -->
    <div v-if="done" class="stats-overview">
      <div class="stat-card">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">总依赖</div>
      </div>
      <div class="stat-card stat-good">
        <div class="stat-num">{{ stats.latest }}</div>
        <div class="stat-label">已最新</div>
      </div>
      <div class="stat-card stat-warn">
        <div class="stat-num">{{ stats.outdated }}</div>
        <div class="stat-label">可更新</div>
      </div>
      <div class="stat-bar-wrap">
        <div class="stat-bar">
          <div class="stat-bar-latest" :style="{ width: `${100 - stats.outdatedPercent}%` }"></div>
          <div class="stat-bar-outdated" :style="{ width: `${stats.outdatedPercent}%` }"></div>
        </div>
        <div class="stat-bar-label">
          <span class="dot dot-latest"></span> {{ stats.total - stats.outdated }} 最新
          <span class="dot dot-minor"></span> {{ stats.outdated }} 待更新
        </div>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="搜索依赖..." class="search-input" />
      </div>
      <div class="legend">
        <span class="legend-item"><span class="dot dot-latest"></span> 已最新</span>
        <span class="legend-item"><span class="dot dot-patch"></span> 补丁</span>
        <span class="legend-item"><span class="dot dot-minor"></span> 次版本</span>
        <span class="legend-item"><span class="dot dot-major"></span> 大版本</span>
      </div>
    </div>

    <!-- Production Dependencies -->
    <div v-if="productionDeps.length > 0" class="dep-group">
      <div class="group-header">
        <span class="group-title">生产依赖</span>
        <span class="group-count">{{ productionDeps.length }}</span>
      </div>
      <div class="table-wrap">
        <table class="deps-table">
          <thead>
            <tr>
              <th>包名</th>
              <th>当前版本</th>
              <th>轨道最新</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dep in productionDeps" :key="dep.name" class="table-row">
              <td class="pkg-name">
                <a :href="`https://www.npmjs.com/package/${dep.name}`" target="_blank" rel="noreferrer">
                  {{ dep.name }}
                </a>
              </td>
              <td>
                <code>{{ dep.current }}</code>
                <span v-if="dep.isPrerelease" class="pre-badge">预发布</span>
              </td>
              <td>
                <div class="version-compare">
                  <code v-if="dep.latest" :class="{ outdated: dep.status === 'outdated' }">
                    {{ dep.latest }}
                  </code>
                  <span v-else-if="dep.status === 'loading'" class="muted">查询中…</span>
                  <span v-else class="muted">—</span>
                  <div v-if="dep.isPrerelease && dep.stableLatest && dep.stableLatest !== dep.latest" class="stable-note">
                    稳定版 {{ dep.stableLatest }}
                  </div>
                </div>
              </td>
              <td>
                <span v-if="dep.status === 'loading'" class="status status-loading">查询中</span>
                <span v-else-if="dep.status === 'latest'" class="status status-latest">
                  <span class="dot dot-latest"></span> 已最新
                </span>
                <span v-else-if="dep.status === 'outdated'" class="status" :class="`status-${dep.diff}`">
                  <span class="dot" :class="`dot-${dep.diff}`"></span>
                  {{ dep.diff === 'major' ? '大版本' : dep.diff === 'minor' ? '次版本' : '补丁' }}
                </span>
                <span v-else class="status status-error">查询失败</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dev Dependencies -->
    <div v-if="devDeps.length > 0" class="dep-group">
      <div class="group-header group-header-dev">
        <span class="group-title">开发依赖</span>
        <span class="group-count">{{ devDeps.length }}</span>
      </div>
      <div class="table-wrap">
        <table class="deps-table">
          <thead>
            <tr>
              <th>包名</th>
              <th>当前版本</th>
              <th>轨道最新</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dep in devDeps" :key="dep.name" class="table-row">
              <td class="pkg-name">
                <a :href="`https://www.npmjs.com/package/${dep.name}`" target="_blank" rel="noreferrer">
                  {{ dep.name }}
                </a>
              </td>
              <td>
                <code>{{ dep.current }}</code>
                <span v-if="dep.isPrerelease" class="pre-badge">预发布</span>
              </td>
              <td>
                <div class="version-compare">
                  <code v-if="dep.latest" :class="{ outdated: dep.status === 'outdated' }">
                    {{ dep.latest }}
                  </code>
                  <span v-else-if="dep.status === 'loading'" class="muted">查询中…</span>
                  <span v-else class="muted">—</span>
                  <div v-if="dep.isPrerelease && dep.stableLatest && dep.stableLatest !== dep.latest" class="stable-note">
                    稳定版 {{ dep.stableLatest }}
                  </div>
                </div>
              </td>
              <td>
                <span v-if="dep.status === 'loading'" class="status status-loading">查询中</span>
                <span v-else-if="dep.status === 'latest'" class="status status-latest">
                  <span class="dot dot-latest"></span> 已最新
                </span>
                <span v-else-if="dep.status === 'outdated'" class="status" :class="`status-${dep.diff}`">
                  <span class="dot" :class="`dot-${dep.diff}`"></span>
                  {{ dep.diff === 'major' ? '大版本' : dep.diff === 'minor' ? '次版本' : '补丁' }}
                </span>
                <span v-else class="status status-error">查询失败</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="filteredDeps.length === 0" class="empty">没有匹配的依赖</div>
  </div>
</template>

<style scoped>
.deps-panel {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 20px 48px;
}

@media (min-width: 768px) {
  .deps-panel {
    padding: 0 32px 48px;
  }
}

.hero {
  text-align: center;
  padding: 48px 0 32px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.hero-desc {
  font-size: 1.1rem;
  opacity: 0.6;
  margin: 0;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border: 1px solid var(--vp-c-divider);
  padding: 16px;
  margin-bottom: 24px;
}

/* Stats overview */
.stats-overview {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.stat-card {
  text-align: center;
}

.stat-num {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-top: 4px;
}

.stat-good .stat-num {
  color: #22c55e;
}

.stat-warn .stat-num {
  color: #f97316;
}

.stat-bar-wrap {
  flex: 1;
  min-width: 200px;
}

.stat-bar {
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  background: var(--vp-c-divider);
}

.stat-bar-latest {
  background: #22c55e;
}

.stat-bar-outdated {
  background: #f97316;
}

.stat-bar-label {
  margin-top: 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.7;
}

/* Dep groups */
.dep-group {
  margin-bottom: 24px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.group-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.group-count {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.group-header-dev .group-count {
  background: var(--vp-c-gray-soft);
  color: var(--vp-c-gray-1);
}

.search-box {
  flex: 1;
  max-width: 280px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
}

.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.8;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-latest { background: #22c55e; }
.dot-patch { background: #eab308; }
.dot-minor { background: #f97316; }
.dot-major { background: #ef4444; }

.table-wrap {
  border: 1px solid var(--vp-c-divider);
  overflow-x: auto;
}

.deps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.deps-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.deps-table th:nth-child(2),
.deps-table th:nth-child(3),
.deps-table th:nth-child(4) {
  text-align: center;
}

.deps-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.deps-table td:nth-child(2),
.deps-table td:nth-child(3),
.deps-table td:nth-child(4) {
  text-align: center;
}

.table-row {
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--vp-c-bg-soft);
}

.pkg-name a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.pkg-name a:hover {
  text-decoration: underline;
}

.pre-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.stable-note {
  font-size: 0.75rem;
  opacity: 0.5;
  margin-top: 2px;
}

code.outdated {
  color: var(--vp-c-warning-1);
  font-weight: 600;
}

.muted {
  opacity: 0.5;
  font-size: 0.85rem;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-latest {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.status-patch {
  background: rgba(234, 179, 8, 0.12);
  color: #eab308;
}

.status-minor {
  background: rgba(249, 115, 22, 0.12);
  color: #f97316;
}

.status-major {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.status-loading,
.status-error {
  background: var(--vp-c-gray-soft);
  color: var(--vp-c-gray-1);
}

.summary {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
}

.empty {
  text-align: center;
  padding: 32px;
  opacity: 0.5;
}
</style>
