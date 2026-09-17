const uniapp: SidebarItem = {
  text: 'Uniapp',
  collapsed: false,
  base: '/frontend/uniapp',
  items: [
    {
      text: '核心概念',
      collapsed: true,
      items: [
        { text: 'uniapp项目初始化', link: '/basic/cli' },
        { text: 'npm获取命令行参数', link: '/basic/get-params' },
      ],
    },
    {
      text: '微信小程序',
      collapsed: true,
      items: [
        { text: '微信获取当前位置', link: '/wx/get-location' },
        // { text: '微信支付', link: '/weixin-pay' },
      ],
    },
    {
      text: '支付宝',
      collapsed: true,
      items: [
        { text: '支付宝小程序开发', link: '/alipay' },
      ],
    },
    { text: 'canvas电子签名', link: '/electronic-signature' },
    { text: '文件下载与保存', link: '/save-path' },
    { text: 'webView拓展使用', link: '/web-view' },
    { text: '刻度进度仪表盘', link: '/gauge' },
  ],
}

export default uniapp
