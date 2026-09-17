# uniapp项目初始化

## 概要

在 [Uniapp](https://uniapp.dcloud.net.cn/) 项目开发中，初始化环节是搭建基础架构的关键一步，这一过程主要依赖两种主流脚手架工具：**uni cli** 和 **HBuilderX cli**。

其中，[uni cli](https://uniapp.dcloud.net.cn/worktile/CLI.html) 凭借其更贴近前端开发者熟悉的命令行工作流、灵活的配置扩展能力以及对跨平台开发场景的深度适配，成为了我日常开发中最常选用的工具。通过它，不仅能快速生成标准化的项目结构，还能便捷地集成各类插件与依赖，为后续开发提供高效基础。

## 一、环境安装

创建 vue3 / Vite版要求 node 版本 18+、20+。

:::code-group
```sh [npm javascript工程]
# 创建以 Vue3/javascript/Vite 开发的工程
npx degit dcloudio/uni-preset-vue#vite my-vue3-project
```

```sh [npm typescript工程]
# 创建以 Vue3/typescript/Vite 开发的工程
npx degit dcloudio/uni-preset-vue#vite-ts my-vue3-project
```
:::

## 二、依赖安装

项目的搭建过程中，依赖安装是不可或缺的一部分。

### 1. **pinia**

依赖下载结束需要对pinia进行特殊处理。关于如何正确定义 Store，请看[官方文档](https://pinia.vuejs.org/zh/core-concepts/) 中的 Option Store 与 Setup Store。

::: code-group
```sh [npm]
npm i pinia@2.1.7

# 数据持久化
npm i pinia-plugin-persistedstate@3.2.1
```

```javascript{5-15} [特殊处理]
// store/index.ts
import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate' // 数据持久化

const store = createPinia()
store.use(
  createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }),
)
// 立即激活 Pinia 实例, 这样即使在 app.use(store)之前调用 store 也能正常工作 （解决APP端白屏问题）
setActivePinia(store)

export default store
```

```ts [定义Store]
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const userInfoStore = defineStore(
  'user',
  () => {
    const a = ref(6)
    return { a, }
  },
  { persist: true, },
)
```
:::

### 2. **axios**

axios需要在v1.0以下

::: code-group
```sh [npm]
npm i axios@0.24.0
```
:::

在uniapp中，使用axios发送网络请求需要做适配，如
::: code-group
``` typescript{3,11} [axios.ts]
// 在axios.ts中
import axios, { AxiosRequestConfig } from 'axios'
import axiosAdapter from './axiosAdapter'

const service = axios.create({
  baseURL,
  timeout: 30 * 1000
})

// 适配器!!!
axios.defaults.adapter = axiosAdapter

service.interceptors.request.use((config: AxiosRequestConfig) => {

})

service.interceptors.response.use(res => {

})
```
``` typescript [axiosAdapter.ts]
// 在axiosAdapter.ts中
import { AxiosRequestConfig, AxiosPromise, AxiosResponse } from 'axios'
import buildURL from 'axios/lib/helpers/buildURL'

const axiosAdapter = (config: AxiosRequestConfig): AxiosPromise => {
  return new Promise((resolve, reject) => {
    const url = config.baseURL + buildURL(config.url, config.params, config.paramsSerializer) // 确保 url 为 string 类型
    const method = config.method.toUpperCase() || 'GET' // 设置默认方法
    const headers = config.headers || {} // 设置默认头部
    const timeout = config.timeout || 5000 // 设置默认超时时间

    uni.request({
      url,
      method: method as any,
      data: config.data,
      header: headers,
      timeout,
      sslVerify: false,
      success: (res) => {
        const response: AxiosResponse = {
          data: res.data,
          status: res.statusCode,
          statusText: res.errMsg || '', // 确保 statusText 为 string 类型
          headers: res.header,
          config,
          request: null,
        }
        resolve(response)
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}

export default axiosAdapter
```
:::

### 3. **eslint**

ESLint 最新版本是 9.7.0，由于尚未熟悉 9 大版本的新文件格式，建议仍使用 8 版本进行配置。下载以下依赖后，将 [vue3 eslint](../../cli/settings/lint) 复制到项目中。

::: code-group

```sh [npm]
npm i eslint@9.39.2 -D

npm i eslint-plugin-vue@10.6.2
@eslint/js@9.39.2
typescript-eslint@8.51.0 -D

# @typescript-eslint/eslint-plugin@7.13.1
# @typescript-eslint/parser@7.13.1 -D
```
:::

### 4. **stylelint**

下载以下依赖，将[vue3 stylelint](../../cli/settings/lint) 复制到项目中。

::: code-group
```sh [npm]
npm i stylelint@16.26.1 -D

npm i
stylelint-config-standard-scss@16.0.0
stylelint-order@7.0.1
stylelint-scss@6.14.0 -D

# stylelint-config-rational-order@0.1.2
# stylelint-config-recommended@3.0.0
# stylelint-config-recommended-scss@4.0.0
# stylelint-config-standard@20.0.0
# -D
````
:::

## 小结

需要下载对应版本的依赖，否则可能导致项目无法运行或报错。最后说一句，uniapp app依托答辩。

:::info 📖 相关资源
- [unibest](https://unibest.tech/) - uniapp 开发框架 (文档)
- [unibest](https://github.com/unibest-tech/unibest) - uniapp 开发框架 (github)
- [vitesse-uni-app](https://uni-helper.js.org/vitesse-uni-app/getting-started/introduction) - uniapp 开发框架 (文档)
- [vitesse-uni-app](https://github.com/uni-helper/vitesse-uni-app) - uniapp 开发框架 (github)
:::
