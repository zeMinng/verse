# Notification API

## 概要

[Notification API](https://developer.mozilla.org/zh-CN/docs/Web/API/Notification) 允许网页向用户**推送桌面通知**，即使浏览器在后台也能显示。适用于消息提醒、任务完成通知等场景。

## 一、基本用法

```js
// 1. 请求权限
async function requestPermission() {
  const result = await Notification.requestPermission()
  // result: 'granted' | 'denied' | 'default'
  console.log('通知权限:', result)
  return result === 'granted'
}

// 2. 发送通知
function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission !== 'granted') {
    console.warn('未获得通知权限')
    return
  }

  const notification = new Notification(title, {
    body: '这是通知的正文内容',
    icon: '/logo.png',
    badge: '/badge.png',        // 移动端小图标
    tag: 'unique-tag',          // 相同 tag 的通知会被替换而非堆叠
    requireInteraction: false,  // 是否需用户手动关闭
    silent: false,
    ...options,
  })

  // 点击通知回调
  notification.onclick = () => {
    window.focus()
    // 可以跳转到特定页面
    // window.location.href = '/detail'
  }

  // 通知关闭回调
  notification.onclose = () => {
    console.log('通知已关闭')
  }
}
```

## 二、实战场景

### 1. 任务完成通知

```js
function notifyTaskComplete(taskName: string) {
  new Notification('✅ 任务完成', {
    body: `${taskName} 已处理完毕`,
    icon: '/logo.png',
    tag: 'task-complete',
  })
}

// 使用
async function exportData() {
  await heavyExportTask()
  notifyTaskComplete('数据导出')
}
```

### 2. 新消息提醒

```js
function notifyNewMessage(sender: string, content: string) {
  new Notification(`📩 ${sender}`, {
    body: content,
    icon: '/avatar.png',
    tag: `msg-${sender}`,  // 同一发送者的消息不重复堆叠
    requireInteraction: true, // 用户需手动关闭
  })
}
```

### 3. 倒计时提醒

```js
function scheduleNotification(title: string, delayMs: number) {
  setTimeout(() => {
    new Notification(title, {
      body: `设置的 ${delayMs / 60000} 分钟已到`,
    })
  }, delayMs)
}

// 30 分钟后提醒
scheduleNotification('⏰ 休息提醒', 30 * 60 * 1000)
```

## 三、权限状态管理

::: code-group
```js [权限检查与请求逻辑]
// 检查和处理权限
function checkNotificationPermission() {
  switch (Notification.permission) {
    case 'granted':
      return true  // 已授权
    case 'denied':
      console.warn('用户已拒绝通知权限，无法发送')
      return false
    case 'default':
      // 未决定，可以请求
      return 'prompt'
  }
}

// 优雅请求
async function ensureNotificationPermission() {
  const status = checkNotificationPermission()
  
  if (status === true) return true
  if (status === false) return false
  
  // 首次请求 — 在用户操作上下文中调用
  const result = await Notification.requestPermission()
  return result === 'granted'
}
```

```html [页面按钮触发]
<!-- 用户点击后才请求权限（避免被浏览器静默拒绝） -->
<button onclick="ensureNotificationPermission()">
  开启通知
</button>
```
:::

::: warning 注意
`Notification.requestPermission()` 必须在**用户操作上下文**中调用（如点击事件），否则部分浏览器会静默拒绝。
:::

## 四、Service Worker 推送（PWA）

真正的"离线推送"需要 Service Worker：

```js
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: '新消息', body: '' }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.png',
      badge: '/badge.png',
      data: { url: data.url || '/' },
    })
  )
})

// 点击通知跳转
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data.url || '/'

  event.waitUntil(
    clients.openWindow(url)
  )
})
```

## 五、Vue/React 封装

### 1. Vue Composable

```ts
// composables/useNotification.ts
import { ref } from 'vue'

export function useNotification() {
  const isSupported = ref('Notification' in window)
  const permission = ref(Notification.permission)

  async function requestPermission() {
    if (!isSupported.value) return false
    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  function notify(title: string, options?: NotificationOptions) {
    if (permission.value !== 'granted') return null
    return new Notification(title, options)
  }

  return {
    isSupported,
    permission,
    requestPermission,
    notify,
  }
}
```

### 2. React Hook

```tsx
import { useState, useCallback } from 'react'

export function useNotification() {
  const [permission, setPermission] = useState(Notification.permission)

  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return null
    return new Notification(title, options)
  }, [permission])

  return { permission, requestPermission, notify }
}
```

## 六、兼容性处理

```js
function safeNotify(title: string, options?: NotificationOptions) {
  // 1. 检查浏览器支持
  if (!('Notification' in window)) {
    // 降级：使用页面内 Toast 提示
    showInAppToast(title, options?.body)
    return
  }

  // 2. 检查权限
  if (Notification.permission === 'granted') {
    new Notification(title, options)
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification(title, options)
      } else {
        showInAppToast(title, options?.body)
      }
    })
  } else {
    // 已拒绝 → 降级为页面内提示
    showInAppToast(title, options?.body)
  }
}

// 降级方案
function showInAppToast(title: string, body?: string) {
  // 你项目的 Toast 组件
  console.log(`[Toast] ${title}: ${body}`)
}
```

## 小结

`Notification API` 用于向用户推送桌面通知，关键流程为**请求权限 → 发送通知**。权限请求必须在用户操作上下文中（如点击事件）调用，否则部分浏览器会静默拒绝。配合 Service Worker 的 Push API 可以实现真正的离线推送。对于不支持通知的浏览器，应提供页面内 Toast 降级方案。

::: info 📖 参考
- [Notification API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Notification)
- [Push API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Push_API)
- [Web Push 最佳实践](https://web.dev/articles/push-notifications-overview)
:::
