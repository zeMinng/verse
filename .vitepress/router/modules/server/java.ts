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
        { text: '泛型和比较器', link: '/base/generics' },
      ],
    },
    {
      text: '集合框架',
      collapsed: false,
      items: [{ text: '集合总览', link: '/collection/' }],
    },
    { text: '二叉树', link: '/treeSet' },
  ],
}

export default Java
