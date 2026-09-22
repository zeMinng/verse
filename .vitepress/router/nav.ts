const nav: NavItem[] = [
  { text: '开始', link: '/start' },
  { text: '前端', link: '/web/vue3/basic/', activeMatch: '/web/' },
  { text: '服务', link: '/server/java/base/', activeMatch: '/server/' },
  { text: '手记', link: '/writings/ai/claude', activeMatch: '/writings/' },
  {
    text: '关于',
    items: [
      { text: '关于作者', link: '/about' },
      // { text: '相关作品', link: '/VPNavBarPage/works/' },
    ],
  },
]

export default nav
