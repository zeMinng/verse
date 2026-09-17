# Clipboard API

## 概要

[Clipboard API](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API) 提供了**异步的剪贴板读写能力**，替代了传统的 `document.execCommand('copy')` 方案。支持文本、图片等多种类型。

## 一、基础：复制文本

```js
// ✅ 现代方式（推荐）
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    console.log('已复制:', text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// ❌ 旧方式（已废弃，不推荐）
function copyTextLegacy(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
```

## 二、读取剪贴板

```js
// 读取文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    console.log('剪贴板内容:', text)
    return text
  } catch (err) {
    console.error('读取失败:', err)
  }
}

// 读取图片
async function pasteImage() {
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          const url = URL.createObjectURL(blob)
          // 显示图片
          document.querySelector('img')!.src = url
        }
      }
    }
  } catch (err) {
    console.error('读取图片失败:', err)
  }
}
```

::: warning 安全限制
读取剪贴板需要用户授权（浏览器弹出权限提示），且必须在 **HTTPS** 或 **localhost** 下才能使用。
:::

## 三、复制富文本/HTML

```js
async function copyHTML(html: string) {
  const blob = new Blob([html], { type: 'text/html' })
  const data = new ClipboardItem({
    'text/html': blob,
    'text/plain': new Blob([stripHTML(html)], { type: 'text/plain' }),
  })

  await navigator.clipboard.write([data])
}

function stripHTML(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}
```

## 四、复制图片

```js
// 从 canvas 复制图片
async function copyCanvas(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })

  const data = new ClipboardItem({
    'image/png': blob,
  })

  await navigator.clipboard.write([data])
}

// 从 URL 复制图片
async function copyImageFromURL(imageURL: string) {
  const response = await fetch(imageURL)
  const blob = await response.blob()

  const data = new ClipboardItem({
    [blob.type]: blob,
  })

  await navigator.clipboard.write([data])
}
```

## 五、Vue/React 封装

### 1. Vue 自定义指令

```ts
// directives/vClipboard.ts
import type { Directive } from 'vue'

export const vClipboard: Directive = {
  mounted(el: HTMLElement, binding) {
    el.addEventListener('click', async () => {
      const text = typeof binding.value === 'string'
        ? binding.value
        : binding.value?.()

      try {
        await navigator.clipboard.writeText(text)
        // 显示复制成功提示
        el.classList.add('copied')
        setTimeout(() => el.classList.remove('copied'), 1500)
      } catch {
        // 降级到旧方案
        fallbackCopy(text)
      }
    })
  },
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
```

```vue
<button v-clipboard="'要复制的文本'">复制</button>
<button v-clipboard="() => codeBlock.textContent">复制代码</button>
```

### 2. React Hook
```tsx
import { useState, useCallback } from 'react'

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch {
      return false
    }
  }, [])

  return { copied, copy }
}

// 使用
function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useClipboard()

  return (
    <button onClick={() => copy(text)}>
      {copied ? '已复制 ✅' : '复制'}
    </button>
  )
}
```

## 六、权限检测

```js
// 检查是否有写入权限
async function canWriteToClipboard() {
  try {
    const permission = await navigator.permissions.query({
      name: 'clipboard-write' as PermissionName,
    })
    return permission.state === 'granted' || permission.state === 'prompt'
  } catch {
    // 降级检查
    return !!navigator.clipboard?.writeText
  }
}

// 检查是否有读取权限
async function canReadFromClipboard() {
  try {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    })
    return permission.state === 'granted' || permission.state === 'prompt'
  } catch {
    return false
  }
}
```

## 七、Clipboard API vs execCommand

| | Clipboard API | execCommand('copy') |
| --- | --- | --- |
| **异步/同步** | ✅ 异步（不阻塞） | ❌ 同步（阻塞） |
| **权限** | ✅ 需要用户授权（安全） | ❌ 无权限检查 |
| **支持格式** | ✅ 文本/HTML/图片 | ❌ 仅文本 |
| **Future** | ✅ 标准 | ❌ 已废弃 |
| **浏览器支持** | 95%+ | 100%（但不再推荐） |

## 小结

`Clipboard API` 是现代浏览器中操作剪贴板的标准方式。相比已废弃的 `document.execCommand('copy')`，Clipboard API 支持 ==异步读写==、==多格式数据==（文本、HTML、图片），且内置权限检查机制。读取剪贴板需要用户授权，生产环境必须使用 HTTPS。结合 Vue 指令或 React Hook 封装，可以轻松实现一键复制功能。

::: info 📖 参考
- [Clipboard API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API)
:::
