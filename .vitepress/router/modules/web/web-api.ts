const webApi: SidebarItem = {
  text: 'Web API & 浏览器能力',
  collapsed: false,
  base: '/web/web-api',
  items: [
    { text: '概览', link: '/' },
    { text: 'Intersection Observer', link: '/intersection-observer' },
    { text: 'Resize Observer', link: '/resize-observer' },
    { text: 'Web Worker', link: '/web-worker' },
    { text: 'Service Worker & PWA', link: '/service-worker' },
    { text: 'Clipboard API', link: '/clipboard' },
    { text: 'Notification API', link: '/notification' },
    { text: '存储方案对比', link: '/storage' },
  ],
}

export default webApi
