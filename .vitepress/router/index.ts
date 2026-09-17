import nav from './nav.ts'
import uniapp from './modules/uniapp'
import vue from './modules/vue'
import react from './modules/react'
import fundamentals from './modules/fundamentals'
import cli from './modules/cli'
import solutions from './modules/solutions'
import performance from './modules/performance'
import webApi from './modules/web-api'

const sidebarTechnology = (): SidebarItem[] => {
  return [
    {
      text: '开始',
      collapsed: false,
      base: '/frontend/start',
      items: [{ text: '简介', link: '/' }],
    },
    vue,
    uniapp,
    react,
    fundamentals,
    cli,
    performance,
    solutions,
    webApi,
  ]
}

// const sidebarExploration = (): SidebarItem[] => {
//   return [
//     {
//       text: '实践录',
//       base: '/VPExploration',
//       items: [
//         {
//           text: 'AI',
//           collapsed: true,
//           items: [
//             { text: 'Claude Code', link: '/ai/claude' },
//             { text: 'AI工具', link: '/ai/tools' },
//           ],
//         },
//         { text: '微信小程序抓包', link: '/goodTool/' },
//       ]
//     },
//   ]
// }

const sidebar = {
  '/frontend/': sidebarTechnology(),
}

export { nav, sidebar }
