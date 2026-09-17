# CSS 工具链：Stylelint、ESLint 插件与 SCSS 校验

## 概要

在现代前端开发中，CSS 代码质量检查工具是必不可少的。本文将详细介绍如何使用 Stylelint、ESLint 插件来校验 CSS 命名规范，以及 SCSS lint 工具的使用方法，帮助团队建立统一的代码规范。

## 一、Stylelint 配置与使用

### 1. 安装与基础配置

```bash
# 安装 Stylelint 及相关插件
npm install --save-dev stylelint stylelint-config-standard stylelint-config-standard-scss
npm install --save-dev stylelint-scss stylelint-order
```

### 2. 基础配置文件

创建 `.stylelintrc.json` 文件：

```json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-standard-scss"
  ],
  "plugins": [
    "stylelint-scss",
    "stylelint-order"
  ],
  "rules": {
    // 基础规则
    "color-no-invalid-hex": true,
    "font-family-no-duplicate-names": true,
    "font-family-no-missing-generic-family-keyword": true,
    
    // 命名规范
    "selector-class-pattern": "^[a-z][a-z0-9]*(__[a-z0-9]+)*(--[a-z0-9]+)*$",
    
    // 属性顺序
    "order/properties-alphabetical-order": true,
    
    // SCSS 特定规则
    "scss/at-rule-no-unknown": true,
    "scss/selector-no-redundant-nesting-selector": true,
    
    // 禁用规则
    "no-descending-specificity": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": ["global", "local"]
      }
    ]
  }
}
```

### 3. BEM 命名规范检查

```json
{
  "rules": {
    // BEM 命名规范检查
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(__[a-z0-9]+)*(--[a-z0-9]+)*$",
      {
        "message": "类名必须符合 BEM 命名规范：block__element--modifier"
      }
    ],
    
    // 禁止使用 ID 选择器
    "selector-max-id": 0,
    
    // 限制选择器嵌套深度
    "max-nesting-depth": 3,
    
    // 禁止使用通用选择器
    "selector-max-universal": 0,
    
    // 限制选择器特异性
    "selector-max-specificity": "0,3,0"
  }
}
```

### 4. 自定义规则配置

```json
{
  "rules": {
    // 自定义 BEM 检查规则
    "custom-property-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
      {
        "message": "CSS 变量名必须使用 kebab-case 格式"
      }
    ],
    
    // 颜色值规范
    "color-hex-case": "lower",
    "color-hex-length": "short",
    
    // 单位规范
    "unit-no-unknown": true,
    "length-zero-no-unit": true,
    
    // 属性值规范
    "property-no-unknown": true,
    "declaration-no-important": true,
    
    // 注释规范
    "comment-no-empty": true,
    "comment-whitespace-inside": "always"
  }
}
```

## 二、ESLint 插件配置

### 1. 安装相关插件

```bash
# 安装 ESLint 插件
npm install --save-dev eslint-plugin-css-modules
npm install --save-dev eslint-plugin-import
```

### 2. ESLint 配置

创建 `.eslintrc.js` 文件：

```javascript
module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript'
  ],
  plugins: [
    'css-modules',
    'import'
  ],
  rules: {
    // CSS Modules 相关规则
    'css-modules/no-unused-class': 'error',
    'css-modules/no-undef-class': 'error',
    
    // 导入相关规则
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    
    // 自定义规则
    'no-console': 'warn',
    'no-debugger': 'warn'
  }
}
```

### 3. CSS 类名检查规则

```javascript
module.exports = {
  rules: {
    // 检查 CSS 类名是否符合 BEM 规范
    'css-modules/no-unused-class': [
      'error',
      {
        'camelCase': true,
        'allowPascalCase': false
      }
    ],
    
    // 检查未定义的 CSS 类
    'css-modules/no-undef-class': 'error',
    
    // 检查 CSS 导入
    'import/no-unresolved': [
      'error',
      {
        'ignore': ['\\.scss$', '\\.css$']
      }
    ]
  }
}
```

## 三、SCSS Lint 工具

### 1. 安装 SCSS Lint

```bash
# 安装 SCSS Lint
npm install --save-dev sass-lint
```

### 2. SCSS Lint 配置

创建 `.sass-lint.yml` 文件：

```yaml
# SCSS Lint 配置文件
options:
  formatter: stylish
  merge-default-rules: false

files:
  include: '**/*.scss'
  ignore:
    - 'node_modules/**/*'
    - 'dist/**/*'
    - 'build/**/*'

rules:
  # 基础规则
  no-ids: 1
  no-important: 1
  no-mergeable-selectors: 1
  
  # 命名规范
  class-name-format: 1
  id-name-format: 1
  variable-name-format: 1
  
  # 属性规则
  property-sort-order: 1
  property-units: 1
  
  # 嵌套规则
  nesting-depth: 1
  no-qualifying-elements: 1
  
  # 颜色规则
  color-variable: 1
  hex-length: 1
  
  # 注释规则
  no-comment: 0
  no-css-comments: 1
  
  # 导入规则
  import-path: 1
  no-import: 0
```

### 3. 自定义 SCSS 规则

```yaml
rules:
  # BEM 命名规范检查
  class-name-format:
    - 1
    - convention: 'bem'
  
  # 变量命名规范
  variable-name-format:
    - 1
    - convention: 'camelCase'
  
  # 混入命名规范
  mixin-name-format:
    - 1
    - convention: 'camelCase'
  
  # 函数命名规范
  function-name-format:
    - 1
    - convention: 'camelCase'
  
  # 嵌套深度限制
  nesting-depth:
    - 1
    - max-depth: 3
  
  # 属性排序
  property-sort-order:
    - 1
    - order: 'alphabetical'
```

## 四、集成到开发流程

### 1. Package.json 脚本配置

```json
{
  "scripts": {
    "lint:css": "stylelint '**/*.{css,scss,vue}' --fix",
    "lint:scss": "sass-lint -v -q",
    "lint:all": "npm run lint:css && npm run lint:scss",
    "lint:css:check": "stylelint '**/*.{css,scss,vue}'",
    "lint:scss:check": "sass-lint -v -q --no-exit"
  }
}
```

### 2. Git Hooks 配置

使用 Husky 配置 Git hooks：

```bash
# 安装 Husky
npm install --save-dev husky lint-staged
```

配置 `package.json`：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{css,scss,vue}": [
      "stylelint --fix",
      "git add"
    ],
    "*.scss": [
      "sass-lint -v -q",
      "git add"
    ]
  }
}
```

### 3. VS Code 配置

创建 `.vscode/settings.json`：

```json
{
  "stylelint.enable": true,
  "stylelint.validate": [
    "css",
    "scss",
    "vue"
  ],
  "css.validate": false,
  "scss.validate": false,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": true
  }
}
```

## 五、常用规则说明

### 1. BEM 命名规范检查

Stylelint 规则配置：
```javascript
{
  "selector-class-pattern": [
    "^[a-z][a-z0-9]*(__[a-z0-9]+)*(--[a-z0-9]+)*$",
    {
      "message": "类名必须符合 BEM 命名规范：block__element--modifier"
    }
  ]
}
```

### 2. 属性排序规则

```json
{
  "order/properties-alphabetical-order": true
}
```

### 3. 嵌套深度限制

```json
{
  "max-nesting-depth": 3
}
```

## 六、高级配置

### 1. 自定义规则插件

创建自定义 Stylelint 规则：

```javascript
// stylelint-custom-rules.js
module.exports = {
  'bem-naming': {
    'message': '类名必须符合 BEM 命名规范',
    'regex': /^[a-z][a-z0-9]*(__[a-z0-9]+)*(--[a-z0-9]+)*$/
  }
}
```

### 2. 团队规范配置

```json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-standard-scss"
  ],
  "rules": {
    // 团队统一规则
    "selector-class-pattern": "^[a-z][a-z0-9]*(__[a-z0-9]+)*(--[a-z0-9]+)*$",
    "max-nesting-depth": 3,
    "selector-max-specificity": "0,3,0",
    "no-descending-specificity": null,
    
    // 项目特定规则
    "custom-property-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "function-name-format": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "mixin-name-format": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"
  }
}
```

## 小结

通过合理配置 Stylelint、ESLint 插件和 SCSS Lint 工具，可以：

1. **确保代码一致性** - 统一的命名规范和代码风格
2. **提高代码质量** - 自动发现潜在问题和错误
3. **提升开发效率** - 减少代码审查时间
4. **支持团队协作** - 统一的开发规范

记住，工具只是手段，关键是要建立适合团队的规范，并持续维护和优化。选择合适的规则配置，既能保证代码质量，又不会过度限制开发效率。

::: info 📖 相关资源
- [Stylelint 官方文档](https://stylelint.io/) - CSS 代码检查工具
- [stylelint-scss](https://github.com/stylelint-scss/stylelint-scss) - SCSS 专属规则
- [ESLint Plugin CSS Modules](https://github.com/atfzl/eslint-plugin-css-modules) - CSS Modules ESLint 插件
- [sass-lint](https://github.com/sasstools/sass-lint) - SCSS 专用 Lint 工具
:::
