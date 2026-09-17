import nav from './nav.ts'
import uniapp from './modules/uniapp.ts'
import vue from './modules/vue.ts'
import react from './modules/react.ts'
import fundamentals from './modules/fundamentals.ts'
import cli from './modules/cli.ts'
import solutions from './modules/solutions.ts'
import performance from './modules/performance.ts'
import webApi from './modules/web-api.ts'

const sidebarTechnology = (): SidebarItem[] => {
  return [
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
  '/web/': sidebarTechnology(),
}

export { nav, sidebar }
