const writings: SidebarItem = {
  text: '手记',
  collapsed: false,
  base: '/writings',
  items: [
    {
          text: 'AI',
          collapsed: true,
          items: [
            { text: 'Claude Code', link: '/ai/claude' },
            { text: 'AI工具', link: '/ai/tools' },
          ],
        },
        { text: '微信小程序抓包', link: '/goodTool/' },
  ]
}

export default writings