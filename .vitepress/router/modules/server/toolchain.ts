const Toolchain: SidebarItem = {
  text: '工具链',
  collapsed: false,
  base: '/server/toolchain',
  items: [
    { text: 'VMware虚拟机', link: '/vmware' },
    // { text: 'Docker', link: '/docker' },
    {
      text: 'Docker',
      collapsed: true,
      items: [
        { text: '基础命令', link: '/docker/' },
        { text: '数据卷与网络', link: '/docker/volume' },
        { text: 'Dockerfile', link: '/docker/dockerfiles' }
      ],
    },
    {
      text: 'Kubernetes (K8S)',
      collapsed: true,
      items: [
        { text: 'K8S 基础', link: '/k8s/foundation' },
      ],
    },
  ]
}

export default Toolchain
