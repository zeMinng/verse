const vue: SidebarItem = {
  text: 'Vue',
  collapsed: false,
  base: '/web/vue3',
  items: [
    {
      text: '核心概念',
      collapsed: true,
      items: [
        { text: '核心API概览', link: '/basic/' },
      ],
    },
    { text: 'Vue图片引入指南', link: '/guide-images' },
    { text: 'TSX渲染', link: '/tsx' },
    { text: 'OpenSSL问题', link: '/script' },
    // { text: 'SHA256', link: '/sha256' },
    // { text: 'ThreeJs', link: '/three' },
    // { text: 'Number精度问题', link: '/precision' },
  ],
}

export default vue
