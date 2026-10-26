import type MarkdownItAsync from 'markdown-it'
import { installMarkPlugin } from '../../.vitepress/theme/components/Mark/index.ts'

export function createMarkdownPlugins(md: MarkdownItAsync) {
  md.use(installMarkPlugin)
}
