const nav: NavItem[] = [
  { text: '开始', link: '/start' },
  { text: '前端', link: '/frontend/vue3/basic/', activeMatch: '/frontend/' },
  { text: '后端', link: '/backend/', activeMatch: '/backend/' },
  { text: '实践录', link: '/goodTool' },
  {
    text: '关于',
    items: [
      { text: '关于作者', link: '/VPNavBarPage/' },
      { text: '相关作品', link: '/VPNavBarPage/works/' },
    ],
  },
]

export default nav
