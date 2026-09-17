# BEM 架构规范

## 概要

BEM（Block Element Modifier）是一种CSS命名方法论，由Yandex团队提出。它不仅是一种命名规范，更是一种CSS架构思想，特别适合大型项目和团队协作。

::: tip 💡 为什么使用BEM
- **清晰的命名** - 从类名就能看出元素的作用和关系
- **避免样式冲突** - 通过命名空间避免CSS污染
- **易于维护** - 结构化的命名让代码更易理解
- **团队协作** - 统一的命名规范提高团队效率
:::

## 一、BEM 基本概念

**Block（块）**
- **定义**：独立的、可复用的组件，具有明确的功能和职责
- **原则**：使用名词，描述组件的用途
- **特点**：可以包含其他块和元素、不应该依赖页面上的其他元素、可以嵌套在其他块中
- **命名**：使用名词描述组件的用途，使用小写字母和连字符，如 `.card`、`.button`、`.menu`

**Element（元素）**
- **定义**：块的组成部分，不能独立存在，必须属于某个块
- **原则**：使用名词，描述元素的作用
- **特点**：必须属于某个块、不能嵌套在其他元素中、可以有多个修饰符
- **命名**：格式：`block__element`，使用双下划线连接，如 `.card__header`、`.button__icon`

**Modifier（修饰符）**
- **定义**：块或元素的变化状态，改变外观、行为或状态
- **原则**：使用形容词或状态词
- **特点**：不能独立使用必须与块或元素结合，可以有多个修饰符，可以改变外观、行为或状态
- **命名**：`block--modifier` 或 `block__element--modifier`，使用双连字符连接


::: code-group
```scss [块示例]
// ✅ 正确的块命名
.card { border: 1px solid #ddd; border-radius: 8px; }

.button { padding: 12px 24px; border: none; cursor: pointer; }

// ❌ 错误的块命名
.cardComponent { } // 不要使用驼峰命名
.card-item { } // 不要使用连字符，这是元素的命名方式
```

```scss [元素示例]
// ✅ 正确的元素命名
.card {
  &__header { padding: 16px; background: #f5f5f5; }
  
  &__body { padding: 16px; }
  
  &__footer { padding: 16px; border-top: 1px solid #eee; }
}

// ❌ 错误的元素命名
.card {
  .header { } // 不要使用单下划线
  &-header { } // 不要使用单连字符
}
```

```scss [修饰符示例]
// ✅ 正确的修饰符命名
.button {
  background: #ccc;
  
  &--primary { background: #007bff; color: white;}
  
  &--large { padding: 16px 32px; font-size: 18px; }
  
  &--disabled { opacity: 0.6; cursor: not-allowed; }
}

.card {
  &--featured { border: 2px solid #007bff; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15); }
  
  &--compact { padding: 8px; }
}

// ❌ 错误的修饰符命名
.button {
  &.primary { } // 不要使用单连字符
  &_primary { } // 不要使用下划线
}
```
:::


## 二、CSS 架构规范

### 1. 文件组织结构

在大型项目中，合理的文件组织结构至关重要：
::: details 文件组织结构
```
styles/
├── abstracts/          # 抽象层
│   ├── _variables.scss
│   ├── _functions.scss
│   └── _mixins.scss
├── base/              # 基础层
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _base.scss
├── components/        # 组件层
│   ├── _button.scss
│   ├── _card.scss
│   └── _modal.scss
├── layout/           # 布局层
│   ├── _header.scss
│   ├── _footer.scss
│   └── _grid.scss
├── pages/            # 页面层
│   ├── _home.scss
│   └── _about.scss
└── main.scss         # 主文件
```
:::

### 2. 命名空间规范

为了避免样式冲突，建议使用命名空间：

```scss
// 组件命名空间
.cmp-button { /* 组件样式 */ }
.cmp-card { /* 组件样式 */ }

// 布局命名空间
.lay-header { /* 布局样式 */ }
.lay-sidebar { /* 布局样式 */ }

// 工具类命名空间
.util-text-center { /* 工具样式 */ }
.util-hidden { /* 工具样式 */ }
```

### 3. 层级关系规范

```scss
// ✅ 正确的层级关系
.card {
  // 块的样式
  &__header {
    // 元素的样式
    &--large {
      // 元素修饰符的样式
    }
  }
  
  &--featured {
    // 块修饰符的样式
    .card__header {
      // 修饰符影响下的元素样式
    }
  }
}

// ❌ 避免的嵌套过深
.card {
  &__header {
    &__title {
      &__text {
        // 嵌套过深，应该重新设计结构
      }
    }
  }
}
```

## 三、BEM 最佳实践
在实际使用 BEM 的过程中，开发者经常会遇到一些误区。以下是最常见的问题和正确的解决方案：

### 1. 修饰符独立使用
::: code-group
```html [✅ 正确用法]
<!-- 正确：修饰符必须与块一起使用 -->
<div class="button button--primary">按钮</div>
<div class="card card--featured">卡片</div>
```
```html [❌ 错误用法]
<!-- 错误：修饰符不能独立使用 -->
<div class="button--primary">按钮</div>
<div class="card--featured">卡片</div>
```
:::

### 2. 元素脱离块使用
::: code-group
```html [✅ 正确用法]
<!-- 正确：元素必须在对应的块内部 -->
<div class="card">
  <div class="card__header">标题</div>
</div>

<div class="modal">
  <div class="modal__footer">底部</div>
</div>
```
```html [❌ 错误用法]
<!-- 错误：元素不能脱离块单独使用 -->
<div class="card__header">标题</div>
<div class="modal__footer">底部</div>
```
:::

### 3. 元素嵌套元素
::: code-group
```scss [✅ 正确用法]
// 正确：重新设计扁平化结构
.card {
  &__header { }
  &__header-title { }
  &__header-text { }
}

// 或者使用独立的块
.card-header {
  &__title { }
  &__text { }
}
```
```scss [❌ 错误用法]
// 错误：元素不应该嵌套元素
.card {
  &__header {
    &__title {
      &__text {
        // 嵌套过深
      }
    }
  }
}
```
:::

### 4. 过度使用修饰符
::: code-group
```vue [✅ 正确用法]
<!-- 在 HTML 中组合使用 -->
<button class="button button--primary button--large button--with-icon">
  按钮
</button>

<style lang="scss" scoped>
// 正确：拆分为多个简单修饰符
.button {
  &--primary { }
  &--large { }
  &--disabled { }
  &--with-icon { }
  &--with-shadow { }
}
</style>
```
```scss [❌ 错误用法]
// 错误：修饰符过于复杂
.button {
  &--primary-large-disabled-with-icon-and-shadow { }
}
```
:::

### 5. 混用命名规范
::: code-group
```scss [✅ 正确用法]
// 正确：统一使用 BEM 规范
.user-profile {
  &__avatar { }
  &__name { }
  &--active { }
}
```
```scss [❌ 错误用法]
// 错误：混用不同的命名规范
.userProfile {  // 驼峰命名
  &_avatar { }  // 下划线
  &-name { }    // 单连字符
  &--isActive { } // 驼峰修饰符
}
```
:::

### 6. 忽略语义化
::: code-group
```scss [✅ 正确用法]
// 正确：基于功能和语义命名
.button {
  &--danger { }    // 表示危险操作
  &--primary { }   // 表示主要操作
}

.text {
  &--heading { }   // 表示标题
  &--caption { }   // 表示说明文字
}

.sidebar {
  &--left { }      // 表示位置（如果位置是语义的一部分）
}
```
```scss [❌ 错误用法]
// 错误：基于样式命名
.red-button { }
.big-text { }
.left-box { }
```
:::

## 四、规模化项目规范

**1. 核心原则**

- **单一职责**：每个组件只负责一个功能
- **可复用性**：组件可在不同场景下使用
- **可配置性**：通过修饰符提供不同变体
- **独立性**：不依赖特定上下文

**2. 团队协作**

- **命名统一**：统一使用 BEM 规范
- **文件组织**：按功能模块组织样式文件
- **代码审查**：检查 BEM 命名符合规范
- **文档维护**：维护组件样式文档

**3. 性能优化**
* **推荐**：扁平化结构，避免过度嵌套。

## 五、工具推荐与自动化

为了更好地实践 BEM 方法论，推荐使用以下工具和插件：

**1. 代码检查工具**

::: code-group

```json [Stylelint 配置]
{
  "plugins": [
    "stylelint-selector-bem-pattern"
  ],
  "rules": {
    "plugin/selector-bem-pattern": {
      "preset": "bem",
      "componentName": "[A-Z]+",
      "componentSelectors": {
        "initial": "^\\.{componentName}(?:__[a-z]+(?:-[a-z]+)*)?(?:--[a-z]+(?:-[a-z]+)*)?$",
        "combined": "^\\.combined-{componentName}-[a-z]+(?:-[a-z]+)*$"
      },
      "ignoreSelectors": [
        "^\\.is-[a-z]+(?:-[a-z]+)*$"
      ]
    }
  }
}
```

```bash [安装命令]
# Stylelint BEM 规则
npm install stylelint-selector-bem-pattern --save-dev

# PostCSS BEM Linter
npm install postcss-bem-linter --save-dev
```

:::

**2. 编辑器插件**

::: details VS Code 推荐插件
| 插件名称 | 功能描述 |
|---------|----------|
| `BEM Helper` | BEM 命名辅助工具 |
| `CSS BEM Snippets` | BEM 代码片段快速插入 |
| `Auto Rename Tag` | 标签同步重命名 |
| `Stylelint` | CSS 代码检查 |
:::

::: details WebStorm / IntelliJ IDEA 推荐插件
| 插件名称 | 功能描述 |
|---------|----------|
| `BEM Support` | BEM 语法支持和检查 |
| `CSS X-Fire` | 实时 CSS 预览 |
:::

**3. 构建工具集成**

::: code-group

```javascript [Vite 配置]
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    modules: {
      // BEM 风格的类名生成
      generateScopedName: '[name]__[local]--[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        // 全局 SCSS 变量
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
});
```

```javascript [Webpack 配置]
module.exports = {
  module: {
    rules: [
      {
        test: /\\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          },
          'sass-loader'
        ]
      }
    ]
  }
};
```

:::

**4. 自动化脚本**

::: details 组件生成脚本
```bash
#!/bin/bash
# create-bem-component.sh
# 使用方法：./create-bem-component.sh ProductCard

COMPONENT_NAME=$1
COMPONENT_DIR="src/components/$COMPONENT_NAME"

if [ -z "$COMPONENT_NAME" ]; then
  echo "错误：请提供组件名称"
  echo "使用方法：./create-bem-component.sh ComponentName"
  exit 1
fi

# 创建组件目录
mkdir -p $COMPONENT_DIR

# 生成 SCSS 文件
cat > $COMPONENT_DIR/$COMPONENT_NAME.scss << EOF
// $COMPONENT_NAME 组件样式
.$COMPONENT_NAME {
  // 块基础样式
  
  // 元素
  &__header {
    // 头部样式
  }
  
  &__body {
    // 主体样式
  }
  
  &__footer {
    // 底部样式
  }
  
  // 修饰符
  &--primary {
    // 主要样式
  }
  
  &--disabled {
    // 禁用样式
  }
}
EOF

# 生成 HTML 模板
cat > $COMPONENT_DIR/$COMPONENT_NAME.html << EOF
<!-- $COMPONENT_NAME 组件模板 -->
<div class="$COMPONENT_NAME">
  <div class="$COMPONENT_NAME__header">
    <!-- 头部内容 -->
  </div>
  
  <div class="$COMPONENT_NAME__body">
    <!-- 主体内容 -->
  </div>
  
  <div class="$COMPONENT_NAME__footer">
    <!-- 底部内容 -->
  </div>
</div>
EOF

echo "✅ 组件 $COMPONENT_NAME 已创建在 $COMPONENT_DIR"
echo "📁 包含文件："
echo "   - $COMPONENT_NAME.scss"
echo "   - $COMPONENT_NAME.html"
```
:::

**5. 测试与验证工具**

::: code-group

```javascript [BEM 验证器]
/**
 * BEM 命名验证器
 * @param {string} selector - CSS 选择器
 * @returns {boolean} - 是否符合 BEM 规范
 */
function validateBEMSelector(selector) {
  const bemPattern = /^\.[a-z]+(?:-[a-z]+)*(?:__[a-z]+(?:-[a-z]+)*)?(?:--[a-z]+(?:-[a-z]+)*)?$/;
  return bemPattern.test(selector);
}

/**
 * 批量验证 BEM 选择器
 * @param {string[]} selectors - 选择器数组
 * @returns {Object} - 验证结果
 */
function validateBEMSelectors(selectors) {
  const results = {
    valid: [],
    invalid: []
  };
  
  selectors.forEach(selector => {
    if (validateBEMSelector(selector)) {
      results.valid.push(selector);
    } else {
      results.invalid.push(selector);
    }
  });
  
  return results;
}
```

```javascript [使用示例]
// 单个验证
console.log(validateBEMSelector('.card'));              // true
console.log(validateBEMSelector('.card__header'));      // true
console.log(validateBEMSelector('.card--featured'));    // true
console.log(validateBEMSelector('.card__header--large')); // true
console.log(validateBEMSelector('.cardHeader'));        // false

// 批量验证
const testSelectors = [
  '.button',
  '.button__icon',
  '.button--primary',
  '.buttonPrimary',    // 驼峰命名
  '.button_icon',      // 下划线
];

const results = validateBEMSelectors(testSelectors);
console.log('✅ 符合规范:', results.valid);
console.log('❌ 不符合规范:', results.invalid);
```

:::

**6. 文档生成**

::: code-group

```bash [安装与使用]
# 安装 SassDoc
npm install sassdoc --save-dev

# 生成文档
sassdoc src/styles/ --dest docs/styles/

# 实时预览
sassdoc src/styles/ --dest docs/styles/ --watch
```

```scss [组件文档模板]
/// 产品卡片组件
/// @description 用于展示产品信息的卡片组件
/// @group components
/// @author 你的名字
/// @since 1.0.0
/// 
/// @example scss - 基本用法
///   <div class="product-card">
///     <img class="product-card__image" src="..." />
///     <div class="product-card__content">
///       <h3 class="product-card__title">产品名称</h3>
///       <p class="product-card__price">¥299</p>
///     </div>
///   </div>
/// 
/// @example scss - 特色样式
///   <div class="product-card product-card--featured">
///     <!-- 内容同上 -->
///   </div>
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  
  /// 产品图片
  /// @type Image
  &__image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  /// 产品内容容器
  &__content {
    padding: 16px;
  }
  
  /// 产品标题
  &__title {
    font-size: 18px;
    font-weight: bold;
  }
  
  /// 产品价格
  &__price {
    color: #e74c3c;
    font-size: 20px;
  }
  
  /// 特色样式修饰符
  /// @modifier featured - 高亮显示的特色产品
  &--featured {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
  }
  
  /// 紧凑样式修饰符
  /// @modifier compact - 紧凑布局的小尺寸版本
  &--compact {
    .product-card__content {
      padding: 12px;
    }
  }
}
```

:::

## 小结

BEM 不仅仅是一种命名规范，更是一种 CSS 架构思想。在大型项目中，正确使用 BEM 可以：

- 提高代码的可维护性
- 减少样式冲突
- 提升团队协作效率
- 支持项目的长期发展

记住，BEM 的核心是**清晰、可预测、可维护**，始终以这三个原则来指导你的 CSS 架构设计。


::: info 📖 相关资源
- [BEM 官方文档](https://bem.info/) - 官方完整文档
- [BEM 方法论](https://bem.info/methodology/) - 方法论详解
- [BEM 命名约定](https://bem.info/methodology/naming-convention/) - 命名规范
- [BEM 最佳实践](https://bem.info/methodology/quick-start/) - 快速开始指南
:::
