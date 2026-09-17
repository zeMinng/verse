# 错误边界捕获渲染错误

## 概要

在 React 应用中，如果组件在 **渲染过程中** 发生错误，React 默认会直接把整个组件树卸载，导致页面出现白屏。为了避免用户看到崩溃画面，我们会使用 [错误边界（Error Boundary）](https://zh-hans.react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) 来捕获错误并展示备用 UI。

错误边界可以让你的应用在局部组件发生异常时，依然保持整体可用性。

## 一、什么是错误边界？

**错误边界（Error Boundary）** 是一个用于捕获其子组件树中 JavaScript 错误的组件。当子组件渲染出错时，它会渲染一个“兜底 UI”（Fallback UI），例如错误提示，而不是整个页面崩溃。

**错误边界可以捕获：** 渲染阶段的错误、子组件生命周期中的错误、子组件构造函数中的错误

**不能捕获：**

- 事件处理函数里的错误（用 try/catch 处理）

- 异步代码里的错误（Promise / setTimeout）

- 服务端渲染（SSR） 的错误

- 自身内部抛出的错误（不会捕获自己）

## 二、使用类组件创建错误边界

React 官方要求：只有类组件才能成为真正的 Error Boundary。必须至少实现以下生命周期方法之一：static getDerivedStateFromError(error)、componentDidCatch(error, info)。

:::code-group
```tsx [使用]
import ErrorBoundary from './components/ErrorBoundary'

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="app">
        <Suspense fallback={
          <div className="center-loading"></div>
        }>
          <Router />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}
```

```tsx [定义]
import React from 'react'
import { Button, Result, Space, Modal } from 'antd'
import { ReloadOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons'
import './index.scss'

interface ErrorBoundaryProps {
  children: React.ReactNode
}
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误信息
    console.error('Error caught by boundary:', error, errorInfo)
    // 保存错误信息到 state（用于详细显示）
    this.setState({
      errorInfo,
    })
    // 这里可以添加错误上报逻辑
    // 例如：上报到监控系统
    // reportError(error, errorInfo)
  }
  /** 重置错误状态，尝试重新渲染 */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }
  /** 清除缓存 */
  handleDeleteCache = (): void => {
    Modal.warning({
      title: '清除本地缓存',
      content: '拖入的组件信息会被清空，确定要清除缓存吗？',
      centered: true,
      onOk: () => {
        localStorage.clear()
        window.location.reload()
      }
    })
  }
  /** 重新加载页面 */
  handleReload = (): void => {
    window.location.reload()
  }
  /** 返回首页 */
  handleGoHome = (): void => {
    window.location.href = '/'
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state

      return (
        <div className="error-boundary-container">
          <Result
            status="error"
            title="出现了一些问题"
            subTitle={
              <div className="error-details">
                <p className="error-message">
                  {error?.message || '未知错误'}
                </p>
                {errorInfo && (
                  <details className="error-stack">
                    <summary>错误详情</summary>
                    <pre>{errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            }
            extra={
              <Space size="middle">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReset}
                >
                  重试
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={this.handleDeleteCache}
                >
                  清空缓存
                </Button>
                <Button
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  返回首页
                </Button>
                <Button onClick={this.handleReload}>重新加载页面</Button>
              </Space>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}
```

```scss [样式]
@use "sass:color";

.error-boundary-container {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  padding: 20px;
  margin: 0;
  overflow-x: hidden;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  box-sizing: border-box;
  align-items: center;
  justify-content: center;

  // 限制 Ant Design Result 组件的宽度
  .ant-result {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .ant-result-content {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .ant-result-subtitle {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .error-details {
    width: 100%;
    max-width: 600px;
    padding: 0;
    margin: 0 auto;
    overflow: hidden;
    text-align: left;
    box-sizing: border-box;

    .error-message {
      width: 100%;
      max-width: 100%;
      padding: 12px;
      margin: 0 0 16px;
      font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
      font-size: 14px;
      color: var(--color-error);
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-sizing: border-box;
      overflow-wrap: break-word;
    }

    .error-stack {
      width: 100%;
      max-width: 100%;
      padding: 12px;
      margin-top: 16px;
      cursor: pointer;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-sizing: border-box;

      summary {
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
        user-select: none;

        &:hover {
          color: var(--text-primary);
        }
      }

      pre {
        width: 100%;
        height: 300px;
        max-width: 100%;
        padding: 8px;
        margin: 8px 0 0;
        overflow: auto;
        font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.5;
        color: var(--text-secondary);
        word-break: break-all;
        white-space: pre-wrap;
        background-color: var(--bg-primary);
        border-radius: 4px;
        box-sizing: border-box;
        overflow-wrap: break-word;
        
        // 确保内容不会溢出
        * {
          max-width: 100%;
          box-sizing: border-box;
        }
      }

      &[open] {
        summary {
          color: var(--text-primary);
        }
      }
    }
  }
}

// 移动端适配
@media (width <= 768px) {
  .error-boundary-container {
    padding: 12px;
    align-items: flex-start;
    overflow: hidden auto;

    // 移动端限制 Result 组件
    .ant-result {
      width: 100%;
      max-width: 100%;
      padding: 8px;
    }

    .ant-result-content {
      width: 100%;
      max-width: 100%;
    }

    .ant-result-subtitle {
      width: 100%;
      max-width: 100%;
    }

    .error-details {
      width: 100%;
      max-width: 100%;
      overflow: hidden;

      .error-message {
        width: 100%;
        max-width: 100%;
        padding: 10px;
        margin-bottom: 12px;
        font-size: 12px;
        line-height: 1.5;
        word-break: break-all;
        overflow-wrap: break-word;
      }

      .error-stack {
        width: 100%;
        max-width: 100%;
        padding: 10px;
        margin-top: 12px;
        overflow: hidden;

        summary {
          font-size: 13px;
          overflow-wrap: break-word;
        }

        pre {
          width: 100%;
          height: 200px;
          max-width: 100%;
          padding: 6px;
          margin-top: 8px;
          overflow: auto;
          font-size: 10px;
          line-height: 1.4;
          word-break: break-all;
          overflow-wrap: break-word;
        }
      }
    }
  }
}
```

:::

## 三、使用 react-error-boundary（推荐方案）

虽然函数组件不能成为原生错误边界，但第三方库 react-error-boundary 用更友好的方式封装了类组件，让我们可以：在函数组件中使用错误边界、使用更灵活的 Fallback UI、自动重试、集成日志上报、使用 Hooks 将错误“交给”边界处理。

需要注意的是：react-error-boundary 表面上是函数组件 / Hook，但底层依然用 class 组件实现真正的 Error Boundary。

:::code-group
```tsx [定义]
import { useState } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { Button, Result, Space } from 'antd'
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons'

import './index.scss'

function ErrorFallback({ error, resetErrorBoundary, componentStack }: FallbackProps & { componentStack?: string }) {
  const [showStack, ] = useState(true)
  const handleGoHome = () => (window.location.href = '/')
  const handleReload = () => window.location.reload()

  return (
    <div className="error-boundary">
      <Result
        status="error"
        title="出现了一些问题"
        subTitle={
          <div className="error-details">
            <div className="error-outline">
              <h1 className="error-title">错误信息：</h1>
              <p className="error-message">{error.message}</p>
            </div>
            {componentStack && (
              <details className="error-stack" open={showStack}>
                <summary>错误详情</summary>
                <pre>{componentStack}</pre>
              </details>
            )}
          </div>
        }
        extra={
          <Space size="middle">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={resetErrorBoundary}
            >
              重试
            </Button>
            <Button icon={<HomeOutlined />} onClick={handleGoHome}>
              返回首页
            </Button>
            <Button onClick={handleReload}>重新加载页面</Button>
          </Space>
        }
      />
    </div>
  )
}

export function ErrorBoundaryComponent({ children }: { children: ReactNode }) {
  const [componentStack, setComponentStack] = useState<string | undefined>(undefined)

  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} componentStack={componentStack} />
      )}
      onError={(error: Error, info: ErrorInfo) => {
        const { message, stack } = error // 错误信息
        const { componentStack } = info // 组件栈
        /** 1. 生产模式：上报错误 */
        reportError({ message, stack, componentStack })
        /** 2. UI 模式：保存组件栈 */
        setComponentStack(componentStack ?? undefined)
      }}
      onReset={() => {
        /** 重置组件栈 */
        setComponentStack(undefined)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/** 错误上报 */
const reportError = (payload: any) => {
  // componentStack 是给前端开发者定位组件错误的（UI 更友好）
  // stack 是更低层信息（通常不适合直接展示在 UI）
  console.error('上报错误：', payload)
}
```

:::

## 小结

错误边界是 React 中保障应用稳定性的核心机制，合理使用可大幅提升用户体验，避免因局部组件错误导致整个页面崩溃。实际项目中建议结合监控工具，持续优化错误处理逻辑。

:::info 📖 相关资源
- [react 官方介绍](https://zh-hans.react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) - 官方介绍
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary) - react-error-boundary GitHub地址
:::