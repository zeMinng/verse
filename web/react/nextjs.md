# Next.js 入门

## 概要

[Next.js](https://nextjs.org/) 是基于 React 的全栈框架，提供了文件系统路由、SSR/SSG/ISR、Server Components、API 路由等开箱即用的能力。当前主流版本为 Next.js 14/15，使用 App Router 作为默认路由系统。

## 一、核心概念

### 1. 渲染策略对比

| 策略 | 渲染时机 | 适用场景 |
| --- | --- | --- |
| **SSR** (Server-Side Rendering) | 每次请求时在服务端渲染 | 个性化内容、实时数据 |
| **SSG** (Static Site Generation) | 构建时预渲染 | 博客、文档、营销页 |
| **ISR** (Incremental Static Regeneration) | 构建时 + 定时重新生成 | 内容更新不频繁的页面 |
| **CSR** (Client-Side Rendering) | 浏览器端渲染 | 后台管理、需交互的页面 |

## 二、项目初始化

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
```

```bash
# 项目结构（App Router）
my-app/
├── app/
│   ├── layout.tsx        # 根布局（必需）
│   ├── page.tsx          # 首页 /
│   ├── about/
│   │   └── page.tsx      # /about
│   ├── blog/
│   │   ├── page.tsx      # /blog
│   │   └── [slug]/
│   │       └── page.tsx  # /blog/:slug (动态路由)
│   └── api/
│       └── hello/
│           └── route.ts  # /api/hello
├── components/
├── public/
└── next.config.ts
```

## 三、页面与路由

### 1. 文件约定

| 文件 | 作用 |
| --- | --- |
| `page.tsx` | 页面组件 |
| `layout.tsx` | 布局组件（嵌套生效，切换页面时保持状态） |
| `loading.tsx` | 加载状态（Suspense 边界） |
| `error.tsx` | 错误边界 |
| `not-found.tsx` | 404 页面 |
| `route.ts` | API 路由 |

### 2. 动态路由

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}

// 生成静态参数（SSG 场景）
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

### 3. 布局与嵌套

```tsx
// app/layout.tsx — 根布局
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}

// app/dashboard/layout.tsx — 嵌套布局
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  )
}
```

## 四、数据获取

### 1. Server Components（默认）

```tsx
// app/posts/page.tsx
// Server Component 中可以直接 async/await
export default async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: {
      revalidate: 3600  // ISR: 每 1 小时重新生成
    }
  }).then(res => res.json())

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  )
}
```

### 2. Client Components

```tsx
'use client'  // 👈 标记为客户端组件

import { useState, useEffect } from 'react'

export default function SearchBox() {
  const [query, setQuery] = useState('')
  
  useEffect(() => {
    // 客户端数据请求
  }, [query])

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

### 3. Server Component vs Client Component

| | Server Component（默认） | Client Component（'use client'） |
| --- | --- | --- |
| 运行环境 | 服务端 | 浏览器 |
| 可以使用 async/await | ✅ | ❌ |
| 可以使用 useState/useEffect | ❌ | ✅ |
| 可以使用 onClick 等事件 | ❌ | ✅ |
| 打包体积 | 0 (不发到客户端) | 正常 |
| 可以直接访问数据库/文件系统 | ✅ | ❌ |

::: tip 使用原则
**尽量让组件保持为 Server Component**，只在需要交互（状态、事件、浏览器 API）时才降级为 Client Component。
:::

## 五、API 路由

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') ?? '1'
  
  const posts = await db.post.findMany({
    skip: (Number(page) - 1) * 10,
    take: 10,
  })
  
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const post = await db.post.create({ data: body })
  
  return NextResponse.json(post, { status: 201 })
}
```

### 1. 中间件

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  
  // 未登录重定向
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',  // 匹配哪些路径
}
```

## 六、常用模式

### 1. SEO 元数据

```tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.coverImage],
    },
  }
}
```

### 2. 图片优化

```tsx
import Image from 'next/image'

// next/image 自动做：懒加载、格式转换(WebP/AVIF)、响应式尺寸
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // 首屏图片标记为优先加载
  placeholder="blur"  // 模糊占位符
  blurDataURL="data:image/..."  // base64 占位
/>
```

### 3. 环境变量

```bash
# .env.local
DATABASE_URL=postgres://localhost:5432/mydb
NEXT_PUBLIC_API_URL=https://api.example.com  # 客户端可用
```

```tsx
// 服务端：所有环境变量可用
const dbUrl = process.env.DATABASE_URL

// 客户端：只有 NEXT_PUBLIC_ 前缀可用
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## 七、部署

```bash
# 默认 Node.js 服务器
npm run build
npm start

# 静态导出（纯 SSG）
# next.config.ts
const nextConfig = { output: 'export' }
npm run build
# → out/ 目录，可部署到任何静态托管

# Vercel（零配置）
# 直接 git push → Vercel 自动部署
```

## 八、与 VitePress 的对比

| 特性 | Next.js | VitePress |
| --- | --- | --- |
| 定位 | 全栈应用框架 | 静态文档/博客生成器 |
| 路由 | 文件系统（App Router） | 文件系统（自动） |
| 数据获取 | 服务端任意数据源 | 构建时 + `createContentLoader` |
| 交互性 | 完整 React 能力 | 可在 Markdown 中使用 Vue/React 组件 |
| Markdown | 需额外配置 | 一等公民 |
| 部署 | Node.js / Vercel / 静态导出 | 纯静态 |
| 适合 | Web 应用、SaaS、后台 | 文档、知识库、博客 |

::: tip 选型建议
- 做**文档/知识库** → VitePress（你现在的选择 ✅）
- 做 **Web 应用/SaaS** → Next.js
- 两者可以在同一个项目中互补使用
:::

## 小结

Next.js 是基于 React 的全栈框架，核心优势在于 ==Server Components==（默认服务端渲染，0 JS 打包体积）、==文件系统路由==（App Router）和 ==灵活的渲染策略==（SSR/SSG/ISR 按页面选择）。`next/image` 自动优化图片，`middleware.ts` 实现请求拦截，API Route 替代轻量后端。选型上：文档/博客用 VitePress，Web 应用/SaaS 用 Next.js，两者可在项目中互补使用。

::: info 📖 参考
- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js 中文教程](https://nextjs.frontendx.cn/)
- [Learn Next.js](https://nextjs.org/learn) — 官方交互教程
:::
