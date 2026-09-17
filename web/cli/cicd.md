# CI/CD 前端部署

## 概要

CI/CD（持续集成/持续部署）将代码的构建、测试、部署流程自动化，让每次 `git push` 都能自动触发质量检查和上线。本文聚焦前端项目的 GitHub Actions 实战。

## 一、核心概念

```
CI (Continuous Integration)  →  代码推送 → 自动构建 + 测试 + Lint
                                         ↓
CD (Continuous Deployment)   →  通过后 → 自动部署到服务器/CDN
```

### 1. 前端 CI/CD 典型流程

```
git push → GitHub Actions
           ├── 1. 安装依赖  →  npm ci
           ├── 2. Lint 检查 →  eslint + stylelint
           ├── 3. 类型检查  →  tsc --noEmit
           ├── 4. 单元测试  →  vitest run
           ├── 5. 构建     →  npm run build
           ├── 6. 部署     →  推送至 Cloudflare/Netlify/Vercel
           └── 7. 通知     →  企业微信/钉钉/邮件
```

## 二、GitHub Actions 基础

### 1. 工作流文件结构

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

# 触发条件
on:
  push:
    branches: [main]      # main 分支推送时触发
  pull_request:
    branches: [main]      # PR 到 main 时触发

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run deploy  # 部署步骤
```

### 2. 缓存优化

```yaml
# 缓存 node_modules，加速后续构建
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
    cache-dependency-path: 'package-lock.json'  # 缓存依据

# 缓存构建产物（如 .vitepress/dist）
- uses: actions/cache@v4
  with:
    path: |
      .vitepress/dist
      .vitepress/cache
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: ${{ runner.os }}-build-
```

## 三、实战：VitePress 文档站自动部署

### 1. 部署到 Cloudflare Pages

```yaml
# .github/workflows/deploy-cloudflare.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:  # 允许手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Build WebPedia
        run: npm run build:web
        env:
          VITE_SERVER_URL: ${{ vars.VITE_SERVER_URL }}
          VITE_ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
          VITE_ALGOLIA_API_KEY: ${{ secrets.ALGOLIA_API_KEY }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy WebPedia/.vitepress/dist --project-name=webpedia
```

### 2. 部署到 Netlify

```yaml
# .github/workflows/deploy-netlify.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run build:web

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: 'WebPedia/.vitepress/dist'
          production-branch: main
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### 3. 部署到 GitHub Pages

```yaml
# .github/workflows/deploy-gh-pages.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    permissions:
      contents: read
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run build:web

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: './WebPedia/.vitepress/dist'

      - uses: actions/deploy-pages@v4
```

## 四、质量门禁：PR 检查

```yaml
# .github/workflows/pr-check.yml
name: PR Quality Check

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm test -- --run  # vitest 单次运行

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build:web
```

## 五、定时任务：Algolia 搜索索引更新

```yaml
# .github/workflows/crawl-algolia.yml
name: Update Algolia Search Index

on:
  schedule:
    # 每天 UTC 2:00（北京时间 10:00）运行
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Trigger Algolia Crawler
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.ALGOLIA_CRAWLER_API_KEY }}" \
            https://crawler.algolia.com/api/1/crawlers/${{ secrets.ALGOLIA_CRAWLER_ID }}/run
```

## 六、多站点 Monorepo 工作流

```yaml
# .github/workflows/deploy-monorepo.yml
name: Deploy (Monorepo)

on:
  push:
    branches: [main]
    paths:
      # 只检测变化的路径，减少不必要的构建
      - 'WebPedia/**'
      - 'ServerPedia/**'
      - 'package.json'
      - '.github/workflows/**'

jobs:
  # 用 matrix 策略并行构建两个站点
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      matrix:
        site: [web, server]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build:${{ matrix.site }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.site }}
          path: ${{ matrix.site }}Pedia/.vitepress/dist

  deploy-web:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist-web, path: dist }
      # ... 部署步骤
```

## 七、环境变量与密钥管理

### 1. GitHub Secrets

```
Settings → Secrets and variables → Actions → Secrets

# 按环境分级
Repository secrets:   全局可用
Environment secrets:  仅特定 environment 可用
```

### 2. 命名规范

| 类型 | 前缀 | 示例 |
| --- | --- | --- |
| API 密钥 | `*_API_KEY` | `CLOUDFLARE_API_KEY` |
| Token | `*_TOKEN` | `GITHUB_TOKEN` |
| URL / 非敏感配置 | `*_URL` | `DEPLOY_URL` |
| 环境变量 | `VITE_*` | `VITE_API_URL` |

```yaml
# 使用
env:
  VITE_API_URL: ${{ vars.VITE_API_URL }}          # 非敏感 → variables
  DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}       # 敏感 → secrets
```

## 八、常用 Actions 速查

| Action | 用途 |
| --- | --- |
| `actions/checkout@v4` | 检出代码 |
| `actions/setup-node@v4` | 安装 Node.js |
| `actions/cache@v4` | 缓存依赖/构建产物 |
| `actions/upload-artifact@v4` | 上传构建产物 |
| `actions/download-artifact@v4` | 下载构建产物 |
| `peaceiris/actions-gh-pages@v4` | 部署到 GitHub Pages |
| `cloudflare/wrangler-action@v3` | Cloudflare Pages 部署 |
| `nwtgck/actions-netlify@v3` | Netlify 部署 |
| `peter-evans/create-pull-request@v6` | 自动创建 PR |

## 九、通知集成

```yaml
# 部署失败时通知（企业微信为例）
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST '${{ secrets.WECHAT_WEBHOOK }}' \
      -H 'Content-Type: application/json' \
      -d '{
        "msgtype": "markdown",
        "markdown": {
          "content": "## ❌ 部署失败\n> 仓库: ${{ github.repository }}\n> 分支: ${{ github.ref_name }}\n> 提交: ${{ github.sha }}\n> [查看详情](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})"
        }
      }'
```

::: tip 安全注意
- 永远不要在 workflow 中 `echo ${{ secrets }}`
- 不要在 PR 触发的 workflow 中暴露 secrets 给不可信代码
- 使用 `environment` 限制生产环境部署权限
:::

## 小结

前端 CI/CD 的核心是将 ==构建→测试→部署== 流程自动化。GitHub Actions 是当前最主流的选择，通过 YAML 配置即可实现 PR 质量门禁（Lint + TypeCheck + Test + Build）、自动化部署（Cloudflare/Netlify/GitHub Pages）和定时任务。Monorepo 项目中可使用 `paths` 过滤和 `matrix` 策略实现按需构建。密钥管理方面，敏感信息通过 GitHub Secrets 注入，非敏感配置使用 Variables。

::: info 📖 参考
- [GitHub Actions 文档](https://docs.github.com/zh/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Cloudflare Pages + GitHub Actions](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
:::
