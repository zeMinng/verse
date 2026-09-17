const nav: NavItem[] = [
  { text: '前端', link: '/frontend/', activeMatch: '/guide/' },
  { text: '后端', link: '/backend/', activeMatch: '/config/' },
  { text: '实践录', link: '/goodTool' },
  {
    text: '文档友链',
    items: [
      {
        items: [
          { text: 'vue', link: 'https://cn.vuejs.org/guide/introduction.html' },
          { text: 'vite', link: 'https://cn.vitejs.dev/' },
          { text: 'pinia', link: 'https://pinia.vuejs.org/zh/introduction.html' },
          { text: 'vuex', link: 'https://next.vuex.vuejs.org/zh/' },
          { text: 'vue-router', link: 'https://next.router.vuejs.org/zh/' },
        ],
      },
      { text: 'uniapp', link: 'https://uniapp.dcloud.net.cn/' },
      { text: 'eslint', link: 'https://eslint.org/docs/latest/use/getting-started' },
      { text: 'vitePress', link: 'https://vitepress.dev/zh/' },
    ],
  },
  {
    text: '关于',
    items: [
      { text: '关于作者', link: '/VPNavBarPage/' },
      { text: '相关作品', link: '/VPNavBarPage/works/' },
    ],
  },
]

export default nav
