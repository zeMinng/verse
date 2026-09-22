const Java: SidebarItem = {
  text: 'Java',
  collapsed: false,
  base: '/server/java',
  items: [
    {
      text: '基础教程',
      collapsed: true,
      items: [
        { text: '语法基础', link: '/base/' },
        { text: '面向对象', link: '/base/javaFace' },
      ],
    },
    { text: '二叉树', link: '/treeSet' },
  ],
}

export default Java
