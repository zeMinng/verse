# 包管理深入

## 概要

npm、yarn、pnpm 是前端主流的三大包管理器。理解它们的差异、workspace 机制和依赖管理策略，对 monorepo 和 CI/CD 效率至关重要。

## 一、三大包管理器对比

| 特性 | npm | yarn (v1) | yarn (v4) | pnpm |
| --- | --- | --- | --- | --- |
| **安装速度** | 慢 → 中 (v7+) | 中 | 快 | 快 |
| **磁盘效率** | 低（每个项目独立） | 中（缓存） | 中 | 高（硬链接全局 store） |
| **node_modules 结构** | 扁平 | 扁平 | 扁平 + PnP | 非扁平（嵌套） |
| **Monorepo 支持** | workspaces | workspaces | workspaces | workspaces（最强） |
| **严格模式** | ❌ | ❌ | ✅ PnP | ✅ 幽灵依赖检测 |
| **Lock 文件** | package-lock.json | yarn.lock | yarn.lock | pnpm-lock.yaml |
| **当前推荐** | 日常开发推荐 | 不推荐 | 偏好 Yarn 生态时 | **Monorepo 首选** ⭐ |

## 二、幽灵依赖问题

npm/yarn 的扁平化 `node_modules` 会导致**幽灵依赖（Phantom Dependencies）**：

```
package.json 中只声明了 express
但 node_modules 中也能 require('debug')
因为 express 依赖 debug，且被扁平提升到了顶层
```

```bash
# pnpm 严格模式下，访问未声明的依赖会报错
pnpm install
# → ERR_PNPM_PEER_DEP_ISSUES 未声明的依赖无法访问
```

::: tip
**pnpm** 用非扁平的 `node_modules` 结构 + 硬链接，从根本上解决了幽灵依赖。这也是为什么 pnpm 更适合 monorepo。
:::

## 三、pnpm Workspace（Monorepo 首选）

### 基础配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'WebPedia'
  - 'ServerPedia'
  - 'shared/*'       # 共享包
```

```json
// 根 package.json
{
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter WebPedia dev",
    "dev:server": "pnpm --filter ServerPedia dev",
    "build:all": "pnpm -r build",
    "lint:all": "pnpm -r lint"
  }
}
```

### filter 常用命令

```bash
# 在指定 workspace 中运行
pnpm --filter WebPedia dev

# 在多个 workspace 中运行
pnpm --filter WebPedia --filter ServerPedia build

# 在所有 workspace 中运行（-r = recursive）
pnpm -r build

# 排除某个 workspace
pnpm -r --filter !shared build

# 只运行有变化的 workspace
pnpm --filter "...[origin/main]" build
```

### 依赖管理

```bash
# 安装共享依赖到根
pnpm add -w vitepress

# 安装到指定 workspace
pnpm --filter WebPedia add vue

# 安装 workspace 内的包（WebPedia 引用 shared 包）
pnpm --filter WebPedia add shared@workspace:*

# 全局链接（本地开发）
pnpm link --global
```

### 依赖版本策略

```json
// pnpm 的 overrides（全局锁定版本）
{
  "pnpm": {
    "overrides": {
      "vue": "3.5.0",
      "react": "18.3.0"
    },
    "packageExtensions": {
      // 修正第三方包的 peerDependencies
      "some-broken-pkg": {
        "peerDependencies": {
          "react": "^18"
        }
      }
    }
  }
}
```

## 四、依赖版本号解读

```
"vue": "~3.4.21"     → 3.4.x（只更新补丁版本）
"vue": "^3.4.21"     → 3.x.x（不改变主版本，推荐）⭐
"vue": "3.4.21"      → 精确锁定（最安全）
"vue": "*"           → 任意版本（危险！）
"vue": ">=3.0 <4.0"  → 范围约束
```

| 符号 | 含义 | 何时使用 |
| --- | --- | --- |
| `^` | 兼容性更新（minor + patch） | **常规依赖（推荐）** |
| `~` | 仅 patch 更新 | 对稳定性要求高的库 |
| 精确 | 锁定到具体版本 | CI/CD 确定性构建 |
| `*` / `latest` | 总是最新 | ❌ 不推荐 |

## 五、安全审计

```bash
# npm
npm audit                    # 检查已知漏洞
npm audit fix                # 自动修复（minor/patch 级）
npm audit fix --force        # 强制修复（可能包含 breaking changes）

# pnpm
pnpm audit
pnpm audit --fix

# yarn
yarn npm audit
```

### 在 CI 中集成

```yaml
- name: Security Audit
  run: |
    npm audit --audit-level=high
    # 有 high 或 critical 级别漏洞时返回非 0 退出码
```

## 六、锁定文件策略

| 策略 | 适合 |
| --- | --- |
| **锁定文件提交到 Git** | ✅ 几乎所有项目都该这样做 |
| **锁定文件不进 Git** | ❌ 只在库开发模板中考虑（但也不推荐） |

```gitignore
# .gitignore — 确保锁定文件被追踪
# ❌ 不要添加：
# package-lock.json
# pnpm-lock.yaml
# yarn.lock
```

## 七、快速升级依赖

```bash
# 检查过时的依赖
npm outdated
pnpm outdated

# 交互式升级（推荐）
npx npm-check-updates -i

# 自动升级所有（谨慎）
npx npm-check-updates -u
npm install
```

### 控制升级节奏

```json
// 方案 1：package.json 中用 ^ 允许 minor 升级，定期 npm update
{ "dependencies": { "vue": "^3.4.0" } }
npm update  // 升级到 ^3.4.0 范围内的最新版

// 方案 2：用 Renovate / Dependabot 自动提 PR
// .github/renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true       // patch 自动合并
    },
    {
      "matchUpdateTypes": ["minor"],
      "automerge": false      // minor 需要 review
    }
  ]
}
```

## 八、npm 工作空间迁移到 pnpm

```bash
# 1. 安装 pnpm
npm i -g pnpm

# 2. 删除旧的 node_modules 和 lock 文件
rm -rf node_modules package-lock.json
rm -rf WebPedia/node_modules ServerPedia/node_modules

# 3. 创建 pnpm-workspace.yaml
# 4. 安装依赖
pnpm install

# 5. 更新 CI/CD 脚本
# npm ci → pnpm install --frozen-lockfile
# npm run build → pnpm build
```

### CI 中使用 pnpm

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9

- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'

- run: pnpm install --frozen-lockfile  # CI 中使用 frozen 模式
- run: pnpm build:web
```

## 九、Dependabot 自动更新依赖

```yaml
# .github/dependabot.yml
version: 2
updates:

  # npm 依赖
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '09:00'
      timezone: 'Asia/Shanghai'
    versioning-strategy: increase
    open-pull-requests-limit: 5
    labels:
      - 'dependencies'
    groups:
      # 将小更新合并为一个 PR
      dev-dependencies:
        dependency-type: 'development'
        update-types:
          - 'minor'
          - 'patch'

  # GitHub Actions
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'monthly'
```

::: info 📖 参考
- [pnpm 文档](https://pnpm.io/zh/)
- [pnpm Workspace 指南](https://pnpm.io/zh/workspaces)
- [npm docs](https://docs.npmjs.com/)
- [Renovate](https://docs.renovatebot.com/) — 比 Dependabot 更灵活的自动更新工具
:::
