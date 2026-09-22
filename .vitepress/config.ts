import { defineConfig, loadEnv, type DefaultTheme } from 'vitepress'
import { extendConfig } from '@voidzero-dev/vitepress-theme/config'
import { createMarkdownPlugins } from '../build/vite/markdown.ts'
import { i18n } from './locales/i18n.ts'
import { sidebar, nav } from './router/index.ts'

const AUTHOR_NAME = 'zeMinng'
const env = loadEnv('', process.cwd())

const config = defineConfig({
  title: 'zeMinng',
  description: 'Personal technical notes, separated by chapters. | 个人技术笔记，按章节分类',
  lang: 'zh-CN',
  locales: i18n,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'algolia-site-verification', content: 'B1D1692D2D3D00DC' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://2HEGWEY7SW-dsn.algolia.net' }],
  ],
  markdown: {
    lineNumbers: true,
    config: createMarkdownPlugins,
  },
  themeConfig: {
    variant: "voidzero",
    siteTitle: 'zeMinng',
    logo: { light: '/logo.svg', dark: '/logoFFF.svg', width: 24, height: 24 },
    outline: {
      level: [2, 3],
    },
    socialLinks: [
      { icon: 'github', link: `https://github.com/${AUTHOR_NAME}` },
      { icon: 'x', link: 'https://twitter.com/xiaoxiaoemil' }
    ],
    editLink: {
      pattern: 'https://github.com/zeMinng/verse/tree/main/:path',
      text: '在github上编辑此页面',
    },
    search: {
      provider: 'algolia',
      options: {
        appId: env.VITE_ALGOLIA_APP_ID,
        apiKey: env.VITE_ALGOLIA_API_KEY,
        indexName: env.VITE_ALGOLIA_INDEX_NAME,
        indices: [env.VITE_ALGOLIA_INDEX_NAME],
      } as DefaultTheme.AlgoliaSearchOptions & { indices: string[] }
    },
    nav,
    sidebar,
    footer: {
      message: 'CC BY-NC-SA 4.0 协议',
      copyright: `版权所有 © 2023-${new Date().getFullYear()} ${AUTHOR_NAME} | 保留所有权利`,
      nav: [
        {
          title: 'projects',
          items: [
            { text: 'runpkg', link: 'https://github.com/zeMinng/runpkg' },
            { text: 'create-vite-uniapp', link: 'https://github.com/zeMinng/create-vite-uniapp' },
            { text: 'drag-form', link: 'https://github.com/zeMinng/drag-form' },
            { text: 'quick-kit', link: 'https://github.com/zeMinng/quick-kit' },
            { text: 'apple-workout-analytics', link: 'https://github.com/zeMinng/apple-workout-analytics' },
            { text: 'health-stream-parser', link: 'https://github.com/zeMinng/health-stream-parser' },
            { text: 'imager', link: 'https://github.com/zeMinng/imager' },
            { text: 'monkey-unit', link: 'https://github.com/zeMinng/monkey-unit' },
          ],
        },
        {
          title: 'Doc Links',
          items: [
            { text: 'vue', link: 'https://cn.vuejs.org/guide/introduction.html' },
            { text: 'vite', link: 'https://cn.vitejs.dev/' },
            { text: 'pinia', link: 'https://pinia.vuejs.org/zh/introduction.html' },
            { text: 'vuex', link: 'https://next.vuex.vuejs.org/zh/' },
            { text: 'vue-router', link: 'https://next.router.vuejs.org/zh/' },
            { text: 'uniapp', link: 'https://uniapp.dcloud.net.cn/' },
            { text: 'eslint', link: 'https://eslint.org/docs/latest/use/getting-started' },
            { text: 'vitePress', link: 'https://vitepress.dev/zh/' },
          ],
        },
      ],
      social: [
        { icon: 'github', link: `https://github.com/${AUTHOR_NAME}` },
        { icon: 'discord', link: 'https://discord.com/channels/@me' },
        { icon: 'x', link: 'https://x.com/xiaoxiaoemil' },
      ], 
    }
  },
  vite: {
    server: {
      host: true,
      open: '/',
    },
  },
})

export default extendConfig(config)