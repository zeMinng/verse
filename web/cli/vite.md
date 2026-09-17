# Vite

## 概要

[Vite](https://cn.vitejs.dev/) 是一种新型前端构建工具，能够显著提升前端开发体验。

## 一、vite环境变量与模式

不知道 [vite环境变量与模式](https://cn.vitejs.dev/guide/env-and-mode) 是什么？

* **环境变量：** Vite 在一个特殊的 import.meta.env 对象上暴露环境变量，这些变量在构建时会被静态地替换掉。

* **模式：** 默认情况下，开发服务器 (dev 命令) 运行在 development (开发) 模式，而 build 命令则运行在 production (生产) 模式。

举例：package.json 文件中明显的多出了 `--mode 28` 等指令，他会在项目中找到 `.env.28` 文件（没有就新建），你可以在这个文件声明出项目的配置

:::code-group
``` json [package.json]
"scripts": {
  "dev:h5": "uni",
  "dev:h5:28": "uni --mode 28",
  "dev:h5:70": "uni --mode 70",
  "dev:h5:cqxx": "uni --mode cqxx",

  "build:h5": "uni build",
  "build:h5:28": "uni build --mode 28",
  "build:h5:70": "uni build --mode 70",
  "build:h5:cqxx": "uni build --mode cqxx",
}
```

``` sh [环境配置]
# 环境配置 @zeMing
# 开发环境
VITE_DEV_BASE_URL = 'http://172.16.124.28:48080'
# 正式环境
VITE_BASE_URL = 'http://172.16.124.28:48080'
# 接口前缀
VITE_API_PATH = '/app-api'
```

``` ts [获取文件的参数]
// 基础路径
export const baseURL = process.env.NODE_ENV === 'development'
  ? import.meta.env.VITE_DEV_BASE_URL
  : import.meta.env.VITE_BASE_URL

// 接口路径
export const apiPath = import.meta.env.VITE_API_PATH
```
:::

如果你刚好使用的是 `TypeScript` ，那么你就可以为 [import.meta.env](https://cn.vitejs.dev/guide/env-and-mode#intellisense) 提供类型定义。

要想做到这一点，你可以在 src 目录下创建一个 vite-env.d.ts 文件，接着按下面这样增加 ImportMetaEnv 的定义：

``` ts
// / <reference types="vite/client" />

// eslint-disable-next-line no-unused-vars
interface ImportMetaEnv {
  readonly VITE_DEV_PORT: string
  readonly VITE_DEV_BASE_URL: string
}
```

## 小结

Vite 是一个超快速的前端构建工具，推动着下一代网络应用的发展。

::: info 📖 相关资源
- [Vite 官方文档](https://cn.vitejs.dev/) - 官方完整文档
:::
