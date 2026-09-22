# Sass 高级技巧

## 概要

[Sass](https://sass-lang.com/guide/) / [Sass中文网](https://www.sass.hk/) 作为 CSS 预处理器，提供了变量、嵌套、混入、继承等强大特性，与 BEM 方法论结合使用，可以创造出更加优雅、可维护的样式代码。本文将深入探讨 Sass 基础语法、与 BEM 的结合使用，以及高级技巧和风格提升方法。

::: info 💡 Sass 支持两种语法格式
- **`.scss`** - 使用大括号和分号的语法（推荐）
- **`.sass`** - 使用缩进的语法（本文主要介绍 SCSS）

SCSS 语法更接近 CSS，学习成本更低，推荐使用。
:::

## 一、Sass 基础语法

<!-- **注释**
```scss [SCSS 注释]
// 这是单行注释，不会编译到 CSS 中

/* 
 * 这是多行注释
 * 会编译到 CSS 中
 */

/*! 这是强制注释，即使在压缩模式下也会保留 */
``` -->

### 1. 变量（Variables）

Sass 变量让样式更加灵活和可维护：

::: code-group
```scss [定义变量与变量作用域]
// ✅ 定义变量
$primary-color: #007bff;
$secondary-color: #6c757d;
$font-size-base: 16px;
$border-radius: 8px;
$spacing-unit: 8px;

// ✅ 使用变量
.button {
  background-color: $primary-color;
  font-size: $font-size-base;
  border-radius: $border-radius;
  padding: $spacing-unit * 2;
}

// ✅ 变量作用域
.card {
  $card-bg: #fff;  // 局部变量
  background-color: $card-bg;
  
  &__header {
    background-color: $card-bg;  // 可以访问父级变量
  }
}
```
```scss [变量插值]
// 变量插值允许在属性名、选择器名等地方使用变量：
$property: "color";
$value: "red";
$class-name: "primary";

.#{$class-name}-button {
  #{$property}: #{$value};
  background-#{$property}: lighten(#{$value}, 20%);
}

// 使用 #{} 语法可以在选择器名、属性名、属性值等地方插入变量。
```

```scss [数据类型]
// 1. 数字 (Numbers)
$number: 42;
$percentage: 15.5%;
$pixel: 16px;
$em: 1.5em;
$rem: 2rem;

// 2. 字符串 (Strings)
$string: "Hello World";
$url: url("https://example.com");
$font-family: 'Helvetica Neue', Arial, sans-serif;

// 3. 颜色 (Colors)
$color: #ff0000;
$color-rgb: rgb(255, 0, 0);
$color-hsl: hsl(0, 100%, 50%);
$color-named: red;

// 4. 布尔值 (Booleans)
$true: true;
$false: false;

// 5. 空值 (Null)
$null: null;

// 6. 列表 (Lists)
$list: 1px 2px 3px 4px;
$list-comma: Helvetica, Arial, sans-serif;
$list-mixed: 1px solid #ccc;

// 7. 映射 (Maps)
$map: (
  "primary": #3498db,
  "secondary": #2ecc71,
  "danger": #e74c3c
);
```
:::


### 2. 嵌套（Nesting）

Sass 的嵌套功能与 BEM 完美结合：

::: code-group
```scss [基本嵌套与父选择器引用 (&)]
// & 符号代表父选择器，是 SCSS 中非常强大的特性：
// ✅ BEM + Sass 嵌套
.card {
  border: 1px solid #ddd;
  border-radius: $border-radius;
  
  // Block 样式
  &--featured {
    border-color: $primary-color;
    box-shadow: 0 4px 12px rgba($primary-color, 0.15);
  }
  
  // Element 样式
  &__header {
    padding: $spacing-unit * 2;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    
    &--large {
      padding: $spacing-unit * 3;
    }
  }
  
  &__body {
    padding: $spacing-unit * 2;
    
    &--compact {
      padding: $spacing-unit;
    }
  }
  
  &__footer {
    padding: $spacing-unit * 2;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
  }
  
  // 修饰符影响下的元素
  &--featured &__header {
    background: rgba($primary-color, 0.1);
    border-bottom-color: $primary-color;
  }
}
```

``` scss [属性嵌套]
.element {
  font: {
    family: Arial, sans-serif;
    size: 16px;
    weight: bold;
  }
  
  border: {
    top: 1px solid #ccc;
    bottom: 2px solid #999;
  }
  
  margin: {
    left: 10px;
    right: 10px;
  }
}
```
:::


### 3. 混入（Mixins）

混入是 Sass 的强大功能，可以创建可复用的样式块：

::: code-group
```scss [基础混入与带参数的混入]
// ✅ 基础混入
@mixin button-base {
  display: inline-block;
  padding: $spacing-unit $spacing-unit * 2;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

@mixin button-variant($bg-color, $text-color: #fff) {
  background-color: $bg-color;
  color: $text-color;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
  
  &:focus {
    box-shadow: 0 0 0 3px rgba($bg-color, 0.25);
  }
}

// ✅ 使用混入
.button {
  @include button-base;
  
  // 带参数的混入
  &--primary {
    @include button-variant($primary-color);
  }
  
  &--secondary {
    @include button-variant($secondary-color);
  }
  
  &--danger {
    @include button-variant(#dc3545);
  }
}
```
```scss [内容块混入]
// `@content` 指令允许混入接收外部传入的样式块，非常适合创建响应式设计的混入。
// 使用 `@content` 指令可以传递内容块给混入：
@mixin media-query($breakpoint) {
  @media (max-width: $breakpoint) {
    @content;
  }
}

.container {
  width: 100%;
  
  @include media-query(768px) {
    width: 90%;
    margin: 0 auto;
  }
}
```
:::

::: info 📝 默认参数
参数可以有默认值，调用时可以不传递该参数。

**参数传递方式：**
- 按位置传递：`@include button(#3498db, black)`
- 按名称传递：`@include button($bg-color: #3498db, $text-color: black)`
- 混合使用：`@include button(#3498db, $padding: 15px 30px)`
:::

### 4. 继承（Inheritance）

使用 `@extend` 实现样式继承，占位符选择器以 `%` 开头，只有被继承时才会编译到 CSS 中：

```scss
// ✅ 基础样式
%button-base {
  display: inline-block;
  padding: $spacing-unit $spacing-unit * 2;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

%button-primary {
  @extend %button-base;
  background-color: $primary-color;
  color: #fff;
  
  &:hover {
    background-color: darken($primary-color, 10%);
  }
}

// ✅ 使用继承
.button {
  &--primary {
    @extend %button-primary;
  }
  
  &--large {
    @extend %button-base;
    padding: $spacing-unit * 2 $spacing-unit * 3;
    font-size: 18px;
  }
}
```

::: warning ⚠️ 继承注意事项
`@extend` 会将选择器合并，可能导致 CSS 文件变大。对于简单的样式复用，建议使用混入。

**何时使用继承 vs 混入：**
- **使用继承**：当多个选择器需要完全相同的样式时
- **使用混入**：当需要参数化或条件样式时
:::

::: tip ✨ 占位符优势
占位符选择器不会生成独立的 CSS 规则，只有被继承时才会编译，避免了无用代码。

**使用场景：**
- 定义基础样式模板
- 避免生成未使用的 CSS 规则
- 提高代码的可维护性
:::


## 二、高级技巧

### 1. 函数库
SCSS 提供了丰富的内置函数，让样式计算更加灵活：

:::code-group
```scss [颜色函数]
@function color-shade($color, $percentage) {
  @return mix(black, $color, $percentage);
}

@function color-tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}

@function color-alpha($color, $alpha) {
  @return rgba($color, $alpha);
}
```

```scss [尺寸函数]
@function rem($pixels, $base: 16px) {
  @return ($pixels / $base) * 1rem;
}

@function em($pixels, $base: 16px) {
  @return ($pixels / $base) * 1em;
}

@function strip-unit($number) {
  @if type-of($number) == 'number' and not unitless($number) {
    @return $number / ($number * 0 + 1);
  }
  @return $number;
}
```

```scss [函数使用示例]
.button {
  padding: rem(12px) rem(24px);
  background-color: color-shade($primary-color, 20%);
  border: 1px solid color-alpha($primary-color, 0.3);
  margin: strip-unit(20px) * 2px; // 40px
  
  &:hover {
    background-color: color-tint($primary-color, 10%);
  }
}
```

```scss [内置函数]
// 颜色函数
$primary: #3498db;

.light-primary {
  background-color: lighten($primary, 20%);
}

.dark-primary {
  background-color: darken($primary, 20%);
}

.transparent-primary {
  background-color: rgba($primary, 0.5);
}

// 数学函数
$width: 960px;
$columns: 12;

.column {
  width: percentage(1 / $columns);
  width: $width / $columns;
  width: round($width / $columns);
}

// 字符串函数
$font-family: "Helvetica Neue", Arial, sans-serif;
$base-font: to-upper-case("helvetica");

// 列表函数
$list: 1px 2px 3px;
$first: nth($list, 1); // 1px
$length: length($list); // 3
```
:::

### 2. 控制指令
:::code-group
```scss [@for 循环]
// 使用 @for 循环可以批量生成样式：
@for $i from 1 through 4 {
  .col-#{$i} {
    width: percentage($i / 4);
  }
}
```

```scss [@if 条件语句]
/** 最简单的例子 */
$debug: true;
@if $debug {
  .debug {
    border: 1px solid red;
  }
}

// ✅ 条件混入
@mixin button-size($size) {
  @if $size == 'small' {
    padding: $spacing-unit $spacing-unit * 1.5;
    font-size: 14px;
  } @else if $size == 'large' {
    padding: $spacing-unit * 2 $spacing-unit * 3;
    font-size: 18px;
  } @else {
    padding: $spacing-unit $spacing-unit * 2;
    font-size: 16px;
  }
}

// ✅ 使用条件混入
.button {
  @include button-size('medium');
  
  &--small {
    @include button-size('small');
  }
  
  &--large {
    @include button-size('large');
  }
}
```

```scss [@each 遍历]
// 使用 @each 可以遍历列表和映射：
$colors: red, green, blue, yellow;
@each $color in $colors {
  .text-#{$color} {
    color: $color;
  }
}

/** 或者这样 */
$themes: (
  "light": #ffffff,
  "dark": #000000,
  "blue": #3498db
);
@each $name, $color in $themes {
  .theme-#{$name} {
    background-color: $color;
  }
}
```

```scss [@while 循环]
// 使用 @while 循环可以根据条件重复执行：
$i: 1;
@while $i <= 3 {
  .item-#{$i} {
    width: 2em * $i;
  }
  $i: $i + 1;
}
```
:::

### 3. 高级特性
:::code-group
```scss [模块化 (@use)]
// _variables.scss
$primary-color: #3498db;
$secondary-color: #2ecc71;

// _mixins.scss
@mixin button-style {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}

// main.scss
@use 'variables' as vars;
@use 'mixins';

.button {
  @include mixins.button-style;
  background-color: vars.$primary-color;
}
```

```scss [错误处理]
@function divide($a, $b) {
  @if $b == 0 {
    @error "除数不能为零";
  }
  @return $a / $b;
}

@warn "这是一个警告信息";
```
:::

## 三、实用示例
:::code-group
```scss [组件化开发]
// ✅ 组件化 BEM + Sass
@mixin component($name) {
  .#{$name} {
    @content;
  }
}

@mixin element($name) {
  &__#{$name} {
    @content;
  }
}

@mixin modifier($name) {
  &--#{$name} {
    @content;
  }
}

// ✅ 使用组件化混入
@include component('card') {
  border: 1px solid #ddd;
  border-radius: $border-radius;
  
  @include element('header') {
    padding: $spacing-unit * 2;
    background: #f8f9fa;
  }
  
  @include element('body') {
    padding: $spacing-unit * 2;
  }
  
  @include modifier('featured') {
    border-color: $primary-color;
    box-shadow: 0 4px 12px rgba($primary-color, 0.15);
  }
}
```

```scss [响应式设计]
// ✅ 响应式断点
$breakpoints: (
  'xs': 0,
  'sm': 576px,
  'md': 768px,
  'lg': 992px,
  'xl': 1200px
);

@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}

// ✅ 响应式组件
.card {
  padding: $spacing-unit;
  
  @include respond-to('sm') { padding: $spacing-unit * 2; }
  @include respond-to('lg') { padding: $spacing-unit * 3; }
  
  &__header {
    font-size: 16px;

    @include respond-to('md') { font-size: 18px; }
    @include respond-to('lg') { font-size: 20px; }
  }
}
```

```scss [主题系统]
// ✅ 主题变量
$themes: (
  'light': (
    'bg-primary': #ffffff,
    'bg-secondary': #f8f9fa,
    'text-primary': #333333,
    'text-secondary': #666666,
    'border-color': #dee2e6
  ),
  'dark': (
    'bg-primary': #1a1a1a,
    'bg-secondary': #2d2d2d,
    'text-primary': #ffffff,
    'text-secondary': #cccccc,
    'border-color': #404040
  )
);

@function theme($key, $theme: 'light') {
  @return map-get(map-get($themes, $theme), $key);
}

// ✅ 主题混入
@mixin theme($theme: 'light') {
  .theme-#{$theme} & {
    @content;
  }
}

// ✅ 使用主题
.card {
  background-color: theme('bg-primary');
  color: theme('text-primary');
  border-color: theme('border-color');
  
  @include theme('dark') {
    background-color: theme('bg-primary', 'dark');
    color: theme('text-primary', 'dark');
    border-color: theme('border-color', 'dark');
  }
}
```

```scss [动画混入]
@mixin transition($properties...) {
  transition: $properties;
  transition-duration: 0.3s;
  transition-timing-function: ease-in-out;
}

@mixin fade-in($duration: 0.3s) {
  opacity: 0;
  animation: fadeIn $duration ease-in-out forwards;
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
}

.button {
  @include transition(background-color, color, transform);
  
  &:hover {
    background-color: darken($primary-color, 10%);
    transform: translateY(-2px);
  }
}

.modal {
  @include fade-in(0.5s);
}
```
:::

## 四、风格提升技巧
* 良好的文件组织是维护大型 SCSS 项目的关键

:::code-group
``` [文件组织结构]
styles/
├── abstracts/
│   ├── _variables.scss
│   ├── _functions.scss
│   └── _mixins.scss
├── base/
│   ├── _reset.scss
│   └── _typography.scss
├── components/
│   ├── _buttons.scss
│   └── _forms.scss
├── layout/
│   ├── _header.scss
│   └── _footer.scss
└── main.scss
```

```scss [代码组织]
// ✅ 良好的代码组织
// 1. 变量定义
$primary-color: #007bff;
$secondary-color: #6c757d;
$spacing-unit: 8px;

// 2. 混入定义
@mixin button-base {
  // 基础样式
}

@mixin button-variant($color) {
  // 变体样式
}

// 3. 组件样式
.button {
  @include button-base;
  
  &--primary {
    @include button-variant($primary-color);
  }
  
  &--secondary {
    @include button-variant($secondary-color);
  }
}
```

```scss [性能优化]
// ✅ 避免深层嵌套
.card {
  &__header { }
  &__body { }
  &__footer { }
}

// ❌ 避免过度嵌套
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

```scss [可维护性]
// ✅ 使用语义化变量
$button-padding-sm: $spacing-unit;
$button-padding-md: $spacing-unit * 2;
$button-padding-lg: $spacing-unit * 3;

// ✅ 模块化混入
@mixin button-padding($size: 'md') {
  @if $size == 'sm' {
    padding: $button-padding-sm;
  } @else if $size == 'lg' {
    padding: $button-padding-lg;
  } @else {
    padding: $button-padding-md;
  }
}
```
:::

## 小结

通过掌握这些 Sass 基础语法和高级技巧，结合 BEM 方法论，你可以创建出更加优雅、可维护的样式代码，提升开发效率和代码质量。

::: tip 记住以下关键点
- **命名规范**：使用语义化的变量名，保持一致的命名约定
- **代码组织**：按功能模块组织代码，使用注释说明复杂逻辑
- **性能考虑**：避免深层嵌套，合理使用混入和继承
- **可维护性**：使用变量和函数，创建可复用的混入
:::
::: warning 注意事项
- 避免过度嵌套（建议不超过 3-4 层）
- 合理使用 `@extend`，避免生成过大的 CSS 文件
- 保持变量命名的一致性
- 定期重构和优化代码结构
:::
::: tip 🚀 下一步学习
掌握了 SCSS 基础后，建议学习：
- **PostCSS** - 现代 CSS 处理工具
- **CSS-in-JS** - 组件化样式方案
- **Tailwind CSS** - 实用优先的 CSS 框架
- **CSS Modules** - 模块化 CSS 解决方案
:::

::: info 📖 相关资源
- [Sass 官方文档](https://sass-lang.com/) - 官方完整文档
- [Sass Guidelines](https://sass-guidelin.es/) - 最佳实践指南
- [Sass Playground](https://www.sassmeister.com/) - 在线编辑器
- [Sass 函数参考](https://sass-lang.com/documentation/modules) - 内置函数文档
:::
