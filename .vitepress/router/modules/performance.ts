const performance: SidebarItem = {
  text: 'Web 性能优化',
  collapsed: false,
  base: '/web/performance',
  items: [
    { text: '性能概览', link: '/' },
    { text: 'Core Web Vitals', link: '/core-web-vitals' },
    { text: '代码分割与懒加载', link: '/code-splitting' },
    { text: '图片优化', link: '/image-optimization' },
    { text: 'Bundle 分析优化', link: '/bundle-analysis' },
  ],
}

export default performance
