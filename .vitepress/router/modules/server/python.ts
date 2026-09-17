const Pyhton: SidebarItem = {
  text: 'Python',
  collapsed: false,
  base: '/server/python',
  items: [
    {
      text: '核心概念',
      collapsed: true,
      items: [
        { text: '语法基础', link: '/base/' },
        { text: '面向对象', link: '/base/python-face' },
      ],
    },
    { text: 'UV 极速指南', link: '/uv' },
  ]
}

export default Pyhton
