import nav from './nav.ts'
import web from './modules/web/index.ts'
import server from './modules/server/index.ts'
import writings from './modules/writings/index.ts'

const sidebar = {
  '/web/': web,
  '/server/': server,
  '/writings/': writings,
}

export { nav, sidebar }
