# Eslint 与 Stylelint配置

## 概要
[ESLint](https://eslint.org/docs/latest/use/getting-started) 与 [Stylelint](https://stylelint.io/) 是前端开发中保障代码质量的核心工具。两者配合使用，能在开发阶段自动拦截不规范代码，减少团队协作中的格式争议，同时降低线上 bug 风险，是现代化工程化中不可或缺的质量保障环节。

## 一、Eslint

### 1. 安装 Eslint

运行该命令时 `npm init @eslint/config`，系统会询问一系列问题，以确定如何使用 ESLint 以及应该包含哪些选项。回答这些问题后，您的目录中会创建一个eslint.config.js文件(或者其他类型)。

例如，其中一个问题是“你的代码在哪里运行？” 如果你选择“浏览器”，那么你的配置文件将包含 Web 浏览器中全局变量的定义。

:::code-group
```sh [npm]
# 按照提示完成配置，系统会自动：创建配置文件、安装必要的依赖包
npm init @eslint/config@latest

# √ What do you want to lint? · javascript
# √ How would you like to use ESLint? · problems
# √ What type of modules does your project use? · esm
# √ Which framework does your project use? · vue
# √ Does your project use TypeScript? · No / Yes
# √ Where does your code run? · browser
# √ Which language do you want your configuration file be written in? · ts
# i Jiti is required for Node.js <24.3.0 to read TypeScript configuration files.
# √ Would you like to add Jiti as a devDependency? · No / Yes
# i The config that you've selected requires the following dependencies:

# eslint, @eslint/js, globals, typescript-eslint, eslint-plugin-vue, jiti
```
:::


### 2. 配置 Eslint

:::code-group
```js [eslint基础配置]
// 在浏览器运行ts的vue代码
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'], plugins: { js }, extends: ['js/recommended'], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },

  // 自己添加的一些rules
  {
    rules: {
      // 禁用代码结尾分号
      'semi': ['error', 'never'],
      // 使用单引号
      'quotes': ['error', 'single', {
        'avoidEscape': true,  // 允许在字符串中使用双引号来避免转义
        'allowTemplateLiterals': true  // 允许使用模板字符串
      }],
    },
  }
])
```

:::

ESLint 规则的严重程度分为三个级别：

| 配置值 | 等效值 | 说明 |
|--------|--------|------|
| `'off'` | `0` | 关闭该规则 |
| `'warn'` | `1` | 将该规则设置为警告（不影响退出代码） |
| `'error'` | `2` | 将该规则设置为错误（违反时退出代码为 1） |

## 二、Stylelint

### 1. 安装 Stylelint

:::tip 💡提示
无论是方法一还是方法二，都是安装两个核心依赖包和创建 .mjs文件：
- stylelint - Stylelint 的核心库
- stylelint-config-standard - 官方推荐的标准配置集
:::

- **方法一**：使用 create-stylelint（推荐）

:::code-group
``` sh [npm]
# 在项目根目录运行
# 按照提示完成配置，系统会自动：创建配置文件、安装必要的依赖包
npm create stylelint@latest
```
:::

- **方法二**：手动安装

:::code-group
``` sh [npm]
# 安装 Stylelint 和标准配置
npm install stylelint stylelint-config-standard --save-dev
```

```sh [npm 额外的规则]
# stylelint-config-standard-scss: SCSS 标准配置（已包含 standard 基础规则）
# stylelint-order: CSS 属性排序插件
# stylelint-scss: SCSS 专用规则集
# postcss-html: 解析 HTML 中 <style> 标签的插件，支持 Vue/Svelte/JSX 等
npm install stylelint-config-standard-scss stylelint-order stylelint-scss postcss-html --save-dev


# ---------- 下面暂存uniapp的微信版 ----------
# 'stylelint-config-standard',
# 'stylelint-config-standard-wxss',
# 'stylelint-config-recommended-wxss',
```
:::

### 2. 配置 Stylelint

下载完依赖后，请在项目根目录创建 `stylelint.config.mjs` 文件。

选择 .mjs 格式是基于 [Stylelint 官方建议](https://stylelint.io/user-guide/configure)：虽然目前仍兼容 .stylelintrc.js、.stylelintrc.json 等传统格式，但这些格式将在未来版本中被逐步移除。采用 .mjs 格式不仅符合 ES 模块规范，也能确保项目配置的长期兼容性。

:::code-group
``` js [stylelint基础配置]
/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard-scss' // SCSS 支持（已包含 standard 规则）
  ],
  plugins: ['stylelint-order', 'stylelint-scss',],
  ignoreFiles: [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.json',
    'node_modules/**',
    'dist/**',
    'build/**'
  ],
  overrides: [
    { files: ['**/*.vue'], customSyntax: 'postcss-html' },
    { files: ['**/*.scss'], customSyntax: 'postcss-scss' }
  ],
  rules: {
    // 允许字体族名称不带引号
    'font-family-name-quotes': null,
    // 允许字体族缺少通用关键字
    'font-family-no-missing-generic-family-keyword': null,
    // 允许现代颜色函数
    'color-function-notation': null,
    // 允许注释前没有空行
    'scss/double-slash-comment-empty-line-before': null,
    // 指定声明块内属性的字母顺序
    'order/properties-order': [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'display',
      'float',
      'width',
      'height',
      'max-width',
      'max-height',
      'min-width',
      'min-height',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'margin-collapse',
      'margin-top-collapse',
      'margin-right-collapse',
      'margin-bottom-collapse',
      'margin-left-collapse',
      'overflow',
      'overflow-x',
      'overflow-y',
      'clip',
      'clear',
      'font',
      'font-family',
      'font-size',
      'font-smoothing',
      'osx-font-smoothing',
      'font-style',
      'font-weight',
      'hyphens',
      'src',
      'line-height',
      'letter-spacing',
      'word-spacing',
      'color',
      'text-align',
      'text-decoration',
      'text-indent',
      'text-overflow',
      'text-rendering',
      'text-size-adjust',
      'text-shadow',
      'text-transform',
      'word-break',
      'word-wrap',
      'white-space',
      'vertical-align',
      'list-style',
      'list-style-type',
      'list-style-position',
      'list-style-image',
      'pointer-events',
      'cursor',
      'background',
      'background-attachment',
      'background-color',
      'background-image',
      'background-position',
      'background-repeat',
      'background-size',
      'border',
      'border-collapse',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
      'border-color',
      'border-image',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'border-spacing',
      'border-style',
      'border-top-style',
      'border-right-style',
      'border-bottom-style',
      'border-left-style',
      'border-width',
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width',
      'border-radius',
      'border-top-right-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius',
      'border-top-left-radius',
      'border-radius-topright',
      'border-radius-bottomright',
      'border-radius-bottomleft',
      'border-radius-topleft',
      'content',
      'quotes',
      'outline',
      'outline-offset',
      'opacity',
      'filter',
      'visibility',
      'size',
      'zoom',
      'transform',
      'box-align',
      'box-flex',
      'box-orient',
      'box-pack',
      'box-shadow',
      'box-sizing',
      'table-layout',
      'animation',
      'animation-delay',
      'animation-duration',
      'animation-iteration-count',
      'animation-name',
      'animation-play-state',
      'animation-timing-function',
      'animation-fill-mode',
      'transition',
      'transition-delay',
      'transition-duration',
      'transition-property',
      'transition-timing-function',
      'background-clip',
      'backface-visibility',
      'resize',
      'appearance',
      'user-select',
      'interpolation-mode',
      'direction',
      'marks',
      'page',
      'set-link-source',
      'unicode-bidi',
      'speak',
    ]
  }
}
```

``` js [vue特定规则]
rules: {
  'selector-pseudo-class-no-unknown': [true, {
    ignorePseudoClasses: ['deep', 'global']
  }],
}
```

``` js [react特定规则]
rules: {
  'selector-max-compound-selectors': 3,
  'selector-no-qualifying-type': [true, {
    ignore: ['attribute']
  }]
}
```

``` js [uniapp特定规则]
rules: {
  // 允许 uniapp 的 rpx 单位
  'unit-no-unknown': [true, {
    ignoreUnits: ['rpx'],
  }],
  // 允许驼峰式类名（uniapp 常用）
  'selector-class-pattern': null,
  // 允许 uniapp 特有的选择器类型
  'selector-type-no-unknown': [true, {
    ignoreTypes: ['page', 'view', 'input', 'image', 'textarea', 'scroll-view', 'button'],
  }],
}
```
:::

## 三、旧版本 Lint 配置

:::details 旧版本（vue2） Eslint配置

``` js [Eslint配置 - 旧版本（vue2）] 
module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: ['plugin:vue/base'],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  plugins: ['vue'],
  rules: {
    // 花括号中间间距一个空格
    'vue/mustache-interpolation-spacing': ['error', 'always'],
    // 不允许多个空格
    'vue/no-multi-spaces': [
      'error',
      {
        ignoreProperties: false,
      },
    ],
    // 属性顺序
    'vue/attributes-order': [
      'error',
      {
        order: [
          'DEFINITION',
          'LIST_RENDERING',
          'CONDITIONALS',
          'RENDER_MODIFIERS',
          'GLOBAL',
          'UNIQUE',
          'TWO_WAY_BINDING',
          'OTHER_DIRECTIVES',
          'OTHER_ATTR',
          'EVENTS',
          'CONTENT',
        ],
        alphabetical: false,
      },
    ],
    // 标签属性-连接
    'vue/attribute-hyphenation': ['error', 'never'],
    'vue/html-closing-bracket-spacing': [
      'error',
      {
        startTag: 'never',
        endTag: 'never',
        selfClosingTag: 'always',
      },
    ],
    'vue/html-indent': [
      'error',
      2,
      {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true,
        ignores: [],
      },
    ],
    'vue/html-quotes': ['error', 'double', { avoidEscape: true }],
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'never',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    // 在computed properties中禁用异步actions
    'vue/no-async-in-computed-properties': 'error',
    // 不允许重复的keys
    'vue/no-dupe-keys': 'error',
    // 不允许重复的attributes
    'vue/no-duplicate-attributes': 'warn',
    'comma-spacing': ['error', { before: false, after: true }],
    // 在 <template> 标签下不允许解析错误
    'vue/no-parsing-error': [
      'error',
      {
        'x-invalid-end-tag': false,
      },
    ],
    // 不允许覆盖保留关键字
    'vue/no-reserved-keys': 'error',
    // 强制data必须是一个带返回值的函数
    // 'vue/no-shared-component-data': 'error',
    // 不允许在computed properties中出现副作用。
    'vue/no-side-effects-in-computed-properties': 'error',
    // <template>不允许key属性
    'vue/no-template-key': 'warn',
    // 在 <textarea> 中不允许mustaches
    'vue/no-textarea-mustache': 'error',
    // 不允许在v-for或者范围内的属性出现未使用的变量定义
    'vue/no-unused-vars': 'warn',
    // <component>标签需要v-bind:is属性
    'vue/require-component-is': 'error',
    // render 函数必须有一个返回值
    'vue/require-render-return': 'error',
    // 保证 v-bind:key 和 v-for 指令成对出现
    'vue/require-v-for-key': 'error',
    // 检查默认的prop值是否有效
    'vue/require-valid-default-prop': 'error',
    // 保证computed属性中有return语句
    'vue/return-in-computed-property': 'error',
    // 强制校验 template 根节点
    'vue/valid-template-root': 'error',
    // 强制校验 v-bind 指令
    'vue/valid-v-bind': 'error',
    // 强制校验 v-cloak 指令
    'vue/valid-v-cloak': 'error',
    // 强制校验 v-else-if 指令
    'vue/valid-v-else-if': 'error',
    // 强制校验 v-else 指令
    'vue/valid-v-else': 'error',
    // 强制校验 v-for 指令
    'vue/valid-v-for': 'error',
    // 强制校验 v-html 指令
    'vue/valid-v-html': 'error',
    // 强制校验 v-if 指令
    'vue/valid-v-if': 'error',
    // 强制校验 v-model 指令
    'vue/valid-v-model': 'error',
    // 强制校验 v-on 指令
    'vue/valid-v-on': 'error',
    // 强制校验 v-once 指令
    'vue/valid-v-once': 'error',
    // 强制校验 v-pre 指令
    'vue/valid-v-pre': 'error',
    // 强制校验 v-show 指令
    'vue/valid-v-show': 'error',
    // 强制校验 v-text 指令
    'vue/valid-v-text': 'error',
    'vue/comment-directive': 0,
    // 空行最多不能超过2行
    'no-multiple-empty-lines': [
      1,
      {
        max: 1,
      },
    ],
    'object-curly-spacing': ['error', 'always'],
    'no-cond-assign': 'error', // 禁止条件表达式中出现赋值操作符
    'no-constant-condition': 'error', // 禁止在条件中使用常量表达式
    'no-multi-spaces': 'error',
    'no-dupe-args': 'error', // 禁止 function 定义中出现重名参数
    'no-duplicate-case': 'error', // 禁止出现重复的 case 标签
    'no-empty': 'error', // 禁止出现空语句块
    'no-irregular-whitespace': 'error', // 禁止不规则的空白
    'array-bracket-spacing': ['error', 'never'], // 禁止或强制在括号内使用空格
    'no-alert': 'error', // 禁止alert,conirm等
    'no-debugger': 'error', // 禁止debugger
    semi: ['error', 'never'], // 禁止分号
    'no-unreachable': 'error', // 当有不能执行到的代码时
    'eol-last': 'error', // 文件末尾强制换行
    'no-new': 'error', // 禁止在使用new构造一个实例后不赋值
    quotes: ['error', 'single'], // 引号类型 `` "" ''
    'no-unused-vars': ['error', { vars: 'all', args: 'after-used' }], // 不能有声明后未被使用的变量
    'no-trailing-spaces': 'error', // 一行结束后面不要有空格
    'space-before-function-paren': ['error', 'never'], // 函数定义时括号前面要不要有空格
    'generator-star-spacing': 'error', // allow async-await
    'space-before-function-paren': ['error', 'never'], // 禁止函数名前有空格，如function Test (aaa,bbb)
    'space-in-parens': ['error', 'never'], // 禁止圆括号有空格，如Test( 2, 3 )
    'space-infix-ops': 'error', // 在操作符旁边必须有空格， 如 a + b而不是a+b
    'space-before-blocks': ['error', 'always'], // 语句块之前必须有空格 如 ) {}
    'spaced-comment': ['error', 'always'], // 注释前必须有空格
    'arrow-body-style': ['error', 'always'], // 要求箭头函数必须有大括号 如 a => {}
    'arrow-spacing': ['error', { before: true, after: true }], // 定义箭头函数的箭头前后都必须有空格
    'no-const-assign': 'error', // 禁止修改const变量
    'template-curly-spacing': ['error', 'never'], // 禁止末班字符串中的{}中的变量出现空格，如以下错误`${ a }`
    'no-multi-spaces': 'error', // 禁止多个空格，只有一个空格的地方必须只有一个
    'no-whitespace-before-property': 'error', // 禁止属性前有空格，如obj. a
    'keyword-spacing': ['error', { before: true, after: true }], // 关键字前后必须有空格 如 } else {
  },
}
```

:::

## 小结

为确保代码规范的有效执行，需要建立完整的检查体系：

- **项目级配置**：通过 ESLint、Stylelint 等工具的配置文件定义规则

- **编辑器配置**：安装配套的 VS Code 插件、配置 settings.json 启用自动修复功能

- **团队共识**：全体成员统一开发环境、保持配置一致性

这种三层架构确保了代码规范从定义到执行的完整闭环，避免了"配置与执行脱节"的问题。

::: info 📖 相关资源
- [eslint 中文文档](https://zh-hans.eslint.org/) - 官方中文文档
- [eslint 配置](https://mp.weixin.qq.com/s/UNCmGb9dciew_KUPrTE-Ng) - Eslint配置指南
- [开源作者配置](https://www.30secondsofcode.org/js/s/eslint-prettier-configuration/) - 开源作者非常偏好的配置
- [stylelint 文档](https://stylelint.io/) - 官方文档
:::
