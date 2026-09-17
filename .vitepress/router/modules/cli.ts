const cli: SidebarItem = {
  text: '工程化',
  collapsed: false,
  base: '/frontend/cli',
  items: [
    {
      text: 'Git',
      collapsed: true,
      items: [
        { text: '基础要点', link: '/git/git' },
        { text: '团队协作方式', link: '/git/gitWorkflow' },
        { text: 'Git Flow工作流', link: '/git/gitFlow' },
      ],
    },
    {
      text: '工具与项目配置',
      collapsed: true,
      items: [
        { text: 'Node生态环境', link: '/settings/node' },
        { text: 'vsCode配置', link: '/settings/vscode' },
        { text: 'es/stylelint配置', link: '/settings/lint' },
        { text: 'Prettier格式化工具', link: '/settings/prettier' },
        { text: '包管理深入', link: '/settings/package-manager' },
      ],
    },
    { text: 'Vite', link: '/vite' },
    { text: '组件库推荐', link: '/components' },
    { text: 'CI/CD 部署', link: '/cicd' },
    { text: '日志与监控', link: '/monitor' },
  ],
}

export default cli
