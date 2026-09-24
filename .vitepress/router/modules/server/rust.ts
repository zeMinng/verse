const Rust: SidebarItem = {
  text: 'Rust',
  collapsed: false,
  base: '/server/rust',
  items: [
    { text: '安装与 Wasm', link: '/wasm' },
    {
      text: '核心概念',
      collapsed: false,
      items: [
        { text: '语法基础', link: '/base/' },
        { text: '认识所有权', link: '/base/ownership' },
        { text: '类型系统', link: '/base/types' },
        { text: '模块系统', link: '/base/modules' },
        { text: '并发与异步', link: '/base/concurrency' },
        { text: '工程实践', link: '/base/engineering' },
      ],
    },
  ],
}

export default Rust
