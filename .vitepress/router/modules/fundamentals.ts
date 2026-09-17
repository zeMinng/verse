const fundamentals: SidebarItem = {
  text: '语言基础',
  collapsed: false,
  base: '/frontend/fundamentals',
  items: [
    {
      text: 'TypeScript',
      collapsed: true,
      items: [
        { text: 'TS 高级技巧', link: '/typescript/advanced' },
      ],
    },
    {
      text: 'CSS & 样式',
      collapsed: true,
      items: [
        { text: 'BEM 架构规范', link: '/css/bem' },
        { text: 'Sass 高级技巧', link: '/css/sass' },
        { text: 'CSS 工具链配置', link: '/css/css-tools' },
        { text: 'Flex与Grid详解', link: '/css/flexbox' },
        { text: 'Tailwind CSS', link: '/css/tailwind' },
        { text: 'CSS 新特性', link: '/css/new-features' },
        { text: 'CSS & Web 动画', link: '/css/animation' },
      ],
    },
    {
      text: '编程概念',
      collapsed: true,
      items: [
        { text: 'Class 类', link: '/class' },
      ],
    },
  ],
}

export default fundamentals
