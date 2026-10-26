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
        { text: 'AI 提示词与规则', link: '/ai/skills' },
      ],
    },
    { text: '微信小程序抓包', link: '/goodTool/' },
  ],
}

export default writings
