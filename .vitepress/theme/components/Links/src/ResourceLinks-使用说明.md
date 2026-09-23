# ResourceLinks 使用说明

`ResourceLinks.vue` 用于在 VitePress 页面展示文档、项目、工具等相关链接。组件沿用 VitePress 主题色变量，适用于已配置 `@voidzero-dev/vitepress-theme` 的站点。

## 放置与引用

将 `ResourceLinks.vue` 放在 `docs/.vitepress/theme/components/`。组件使用 `@iconify/vue`、Vue 和 VitePress；请确保项目已安装 `@iconify/vue`。

以下假设页面是 `docs/resources.md`，直接在该页引用组件：

```md
<script setup lang="ts">
import ResourceLinks from './.vitepress/theme/components/ResourceLinks.vue'
</script>

# 相关资源

<ResourceLinks
  :groups="[
    {
      title: '',
      items: [
        {
          name: '项目官网',
          desc: '查看官方文档与更新',
          link: 'https://example.com',
        },
      ],
    },
  ]"
/>
```

这里的 `title: ''` 表示不再重复显示分组标题，适合页面本身已有“相关资源”标题时使用。组件应单独占一段，与前后的 Markdown 内容留空行；页面路径不同时，请相应调整 `import` 的相对路径。

## 资源少时怎么写

只有一两个链接时，只传一个分组即可。该分组只有一张卡片时，卡片会限制最大宽度，不会横跨整个文档区。

如果资源属于不同类别，仍可传入多个分组。例如：

```vue
<ResourceLinks
  :groups="[
    {
      title: '官方资料',
      items: [
        { name: '使用手册', link: 'https://example.com/guide' },
      ],
    },
    {
      title: '源码',
      items: [
        { name: '项目仓库', link: 'https://example.com/repo' },
      ],
    },
  ]"
/>
```

这时两个分组会直接展开，不需要点击导航。

## 分组显示规则

| 条件 | 显示方式 |
| --- | --- |
| 总资源数为 1～4 个 | 展开所有非空分组，显示各组标题；空标题不显示。 |
| 总资源数超过 4 个，且至少有两个非空、标题非空的分组 | 显示文字分组导航，默认选中第一组；点击导航切换内容。 |
| 只有一个非空分组 | 直接展示该组，不显示导航。 |
| 存在标题为空的分组 | 展开所有非空分组，避免导航出现无文字的按钮。 |
| 分组的 `items` 为空 | 忽略该分组。 |

总数按所有**非空分组**的 `items` 数量计算。导航的选中状态只保留在当前页面，不写入地址栏。

## 参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `groups` | `ResourceGroup[]` | 必填 | 资源分组。 |
| `grid` | `number` | `2` | 桌面端每行列数，会四舍五入并限制在 1～4 列；宽度不超过 720px 时改为单列。 |
| `showDomain` | `boolean` | `true` | 是否在卡片右侧显示 HTTP(S) 外链的域名。 |

### `ResourceGroup`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 分组名称；单组时可设为空字符串以隐藏标题。多个分组若需导航，都应填写标题。 |
| `items` | `ResourceItem[]` | 该组的资源列表。 |
| `icon` | `string` | 仅保留对旧数据的兼容；分组不显示图标。 |

### `ResourceItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 必填，卡片名称。 |
| `desc` | `string` | 可选，简短说明，最多显示两行。 |
| `link` | `string` | 可选，链接地址；省略后卡片仅作展示，不能点击。 |
| `icon` | `string` | 可选，Iconify 图标名称，如 `simple-icons:github`。 |
| `favicon` | `boolean` | 默认尝试获取站点图标；设为 `false` 时使用名称首字。 |

卡片图标依次使用：`icon`、HTTP(S) 外链的 favicon、名称首字。favicon 加载失败也会回退到首字。

## 链接与选中态

- 站内路径建议写成以 `/` 开头的路径，例如 `link: '/guide/start'`。组件会使用 VitePress 的 `withBase` 处理站点 `base`。
- `http://` 和 `https://` 链接会在新标签页打开；站内链接在当前页跳转。
- 当前站内页面对应的卡片会使用主题色边框和浅色背景标识，并带有 `aria-current="page"`。外链不会被标记为当前页。
- 卡片悬停仅改变边框与背景颜色，没有位移或阴影效果。

例如，同时展示站内入口和外部项目：

```vue
<ResourceLinks
  :grid="2"
  :show-domain="true"
  :groups="[
    {
      title: '继续阅读',
      items: [
        { name: '快速开始', desc: '先完成基础配置', link: '/guide/start' },
        { name: 'API 参考', link: '/reference/api', favicon: false },
      ],
    },
    {
      title: '外部资源',
      items: [
        { name: '项目仓库', link: 'https://example.com/repo', icon: 'simple-icons:github' },
      ],
    },
  ]"
/>
```

上例总共 3 个资源，因此会同时展开两个分组，不出现导航。如果后续增加到 5 个资源且两个分组都有标题，组件会自动切换为导航模式。
