const nav: NavItem[] = [
  { text: '开始', link: '/start' },
  { text: '前端', link: '/web/vue3/basic/', activeMatch: '/web/' },
  { text: '服务', link: '/server/', activeMatch: '/server/' },
  { text: '手记', link: '/goodTool' },
  {
    text: '关于',
    items: [
      { text: '关于作者', link: '/VPNavBarPage/' },
      { text: '相关作品', link: '/VPNavBarPage/works/' },
    ],
  },
]

export default nav
