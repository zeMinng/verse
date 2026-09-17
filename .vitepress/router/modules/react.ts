const React: SidebarItem = {
  text: 'React',
  collapsed: false,
  base: '/frontend/react',
  items: [
    {
      text: '核心概念',
      collapsed: true,
      items: [
        { text: '函数式组件', link: '/base/' },
        { text: '类组件', link: '/base/classComponent' },
        { text: '错误边界捕获', link: '/base/errorBoundary' },
      ],
    },
    {
      text: '进阶',
      collapsed: true,
      items: [
        { text: 'Hooks 深入', link: '/hooks-advanced' },
        { text: '状态管理对比', link: '/state-management' },
        { text: 'Next.js 入门', link: '/nextjs' },
        { text: 'React 18/19 新特性', link: '/new-features' },
      ],
    },
    { text: 'redux状态管理', link: '/redux' },
    { text: 'react Router', link: '/router' },
  ],
}

export default React
