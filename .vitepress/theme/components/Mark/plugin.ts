import type MarkdownIt from 'markdown-it'

/**
 * 轻量自定义 mark 插件
 * 语法：
 *  - ==文本==            → 默认黄色马克笔
 *  - ==文本=={green}    → 指定主题色：yellow|green|blue|pink|info|warning|danger
 */
export function installMarkPlugin(md: MarkdownIt): void {
  const RULE_NAME = 'vp_mark'

  md.inline.ruler.before('emphasis', RULE_NAME, (state, silent) => {
    const start = state.pos
    const src = state.src

    // 必须以 == 开头
    if (src.charCodeAt(start) !== 0x3d || src.charCodeAt(start + 1) !== 0x3d) return false

    const endPos = findClosingDoubleEquals(src, start + 2)
    if (endPos === -1) return false

    if (!silent) {
      const content = src.slice(start + 2, endPos)

      // 解析可选 {type}
      let type = ''
      let nextPos = endPos + 2
      if (src.charCodeAt(nextPos) === 0x7b) { // '{'
        const endBrace = src.indexOf('}', nextPos + 1)
        if (endBrace !== -1) {
          type = sanitize(src.slice(nextPos + 1, endBrace))
          nextPos = endBrace + 1
        }
      }

      state.pos = nextPos

      const open = state.push('vp_mark_open', 'mark', 1)
      open.attrSet('class', `vp-mark${type ? ` vp-mark--${type}` : ''}`)

      const text = state.push('text', '', 0)
      text.content = content

      state.push('vp_mark_close', 'mark', -1)
    }

    state.pos = endPos + 2
    return true
  })

  md.renderer.rules.vp_mark_open = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') || 'vp-mark'
    return `<mark class="${escapeHtml(cls)}">`
  }
  md.renderer.rules.vp_mark_close = () => `</mark>`
}

// 查找结束的 ==
function findClosingDoubleEquals(src: string, from: number): number {
  let pos = from
  while (pos < src.length - 1) {
    if (src.charCodeAt(pos) === 0x3d && src.charCodeAt(pos + 1) === 0x3d) return pos
    pos++
  }
  return -1
}

function sanitize(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
