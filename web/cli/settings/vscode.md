# vsCode 配置

## 概要

[VS Code](https://code.visualstudio.com/) 是前端开发必备工具，登录账号后会自动同步扩展和配置。下面分享我的个性化配置。

## 一、拓展推荐

**🔍 人工智能类（AI辅助编码工具，大幅提升开发效率）**

- GitHub Copilot Chat：对话式AI助手，可解释代码、调试问题
- GitHub Copilot：基于上下文的代码自动补全工具
- Windsurf Plugin (formerly Codeium)：多语言支持的AI代码生成器

**🚨 必装插件（前端开发基础工具链，保障代码质量与协作效率）**
- GitLens — Git supercharged：增强Git功能，显示代码作者、提交历史
- Git History：可视化查看Git提交历史、分支对比
- ESLint：JavaScript代码规范检查工具，提前发现语法问题
- console helper：快速生成格式化的console语句，支持一键注释/删除
- Stylelint：CSS/SCSS样式代码规范检查，统一样式写法
- var-translate-en：中文变量名快速翻译为英文，规范命名

**🖖 Vue 系列（Vue框架开发专用工具，提升组件化开发体验）**
- Vue (Official)：Vue官方扩展，提供语法高亮和基础支持
- Vuter：Vue2/3语法增强，支持模板与脚本联动提示
- Vue 3 Snippets：包含Vue3常用API和组合式函数的代码片段
- vue-helper：快速跳转组件定义、查看Props/Events类型

**📱 Uniapp 系列（跨端应用开发辅助工具）**
- uniapp-snippet：Uniapp专用代码片段，涵盖页面、组件、API调用模板

**⚡ 效率神器（提升日常开发操作速度的辅助工具）**
- vscode-styled-components：CSS-in-JS语法高亮与自动补全
- Prettier - Code formatter：代码格式化工具，统一团队代码风格
- Prettier ESLint：结合ESLint规则的Prettier增强版
- path-alias：解析项目路径别名（如@/），支持跳转
- Path Intellisense：自动补全文件路径，减少手动输入错误
- JavaScript (ES6) code snippets：ES6语法代码片段，快速生成箭头函数、解构等
- Import Cost：显示导入包的体积大小，优化打包体积
- Image preview：鼠标悬停时预览图片，无需打开文件
- EditorConfig for VS Code：同步不同编辑器的基础配置（缩进、换行符等）
- Code Translate：实时翻译代码注释，支持多语言互译
- Auto Rename Tag：修改开始标签时自动同步修改结束标签
- Auto Import：自动检测并导入未声明的变量/组件
- Auto Close Tag：输入开始标签后自动生成结束标签

## 二、代码片段配置

代码片段（Code Snippets）可以通过简短前缀快速生成重复代码结构，大幅提升开发效率。可通过 VS Code 的==[文件>首选项>配置用户代码片段]==添加下述配置。

::: code-group
```json [vue3快捷模板生成]
// vue3快捷模板生成
"vue1": {
  "prefix": "vue3",
  "body": [
   "<template>",
   "\t<view class=\"xx\">\n",
   "\t</view>",
   "</template>\n",
   "<script setup lang=\"ts\">",
   "import { ref, unref } from 'vue'",
   "</script>\n",
   "<style lang=\"scss\" scoped>\n",
   "</style>\n",
  ],
  "description": "vue3 template"
},
```
```json [uniapp的view标签快捷生成]
"view": {
  "prefix": "view",
  "body": [
   "<view class=\"xx\"></view>",
  ],
  "description": "view"
},
```
:::

## 三、settings.json

VS Code 的 settings.json 是个性化编辑器行为的核心配置文件，通过 JSON 格式定义编辑器的格式规范、插件行为、界面展示等参数。

以下 JSON 标签==越靠左代表越新==：

::: code-group
```json [2025-11-07]
{
  "editor.suggestSelection": "first",
  "vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
  
  "files.associations": {
    "*.cjson": "jsonc",
    "*.wxss": "css",
    "*.wxs": "javascript"
  },
  
  "emmet.includeLanguages": {
    "wxml": "html"
  },
  
  "minapp-vscode.disableAutoConfig": true,
  "editor.tabSize": 2,
  
  // 配置 eslint 检查的文件类型（移除 css 和 scss）
  "eslint.autoFixOnSave": true,
  "eslint.validate": [
    "javascript",
    "typescript",
    "typescriptreact",
    "vue",
    {
      "language": "vue",
      "autoFix": true
    }
  ],
  
  // stylelint 需要检查的文件
  "stylelint.validate": [
    "css",
    "less",
    "postcss",
    "scss",
    "vue",
    "sass"
  ],
  // 删除 stylelint.autoFixOnSave，使用 editor.codeActionsOnSave 代替
  
  "editor.fontSize": 14,
  "javascript.updateImportsOnFileMove.enabled": "always",
  
  "[html]": {
    "editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
  },
  
  "[javascript]": {
    "editor.defaultFormatter": "vscode.typescript-language-features"
  },
  
  "[vue]": {
    // 建议改为 Prettier 或其他 Vue 格式化器，而不是 stylelint
    "editor.defaultFormatter": "stylelint.vscode-stylelint"
  },
  
  "[css]": {
    "editor.defaultFormatter": "stylelint.vscode-stylelint"
  },
  
  "[scss]": {
    "editor.defaultFormatter": "stylelint.vscode-stylelint"
  },
  
  "tabnine.experimentalAutoImports": true,
  
  // 自动修复配置（已包含 stylelint 和 eslint）
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": "explicit",
    "source.fixAll.eslint": "explicit"
  },
  
  "liveServer.settings.AdvanceCustomBrowserCmdLine": "",
  "editor.fontLigatures": false,
  "editor.inlineSuggest.enabled": true,
  "workbench.colorTheme": "Default Dark+",
  "vue.autoInsert.dotValue": true,
  
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": false,
    "scminput": false,
    "vue": true
  },
  
  "window.commandCenter": true,
  "extensions.autoCheckUpdates": false,
  "files.autoSave": "afterDelay",
  "json.schemas": [],
  "eslint.format.enable": true,
  "editor.stickyScroll.enabled": false,
  "codeium.enableConfig": {
    "*": true
  },
  "workbench.settings.applyToAllProfiles": [
  
  ],
  "diffEditor.ignoreTrimWhitespace": true,
  "editor.cursorBlinking": "expand",
  "git.confirmSync": false,
  "settingsSync.ignoredSettings": [],
  "typescript.updateImportsOnFileMove.enabled": "always",
  "terminal.integrated.stickyScroll.enabled": false
}
```

```json [版本三]
{
	"editor.suggestSelection": "first",
	"vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
	"files.associations": {
			"*.cjson": "jsonc",
			"*.wxss": "css",
			"*.wxs": "javascript"
	},
	"emmet.includeLanguages": {
			"wxml": "html"
	},
	"minapp-vscode.disableAutoConfig": true,
	"editor.tabSize": 2,
	// 配置 eslint 检查的文件类型
	"eslint.autoFixOnSave": true,
	"eslint.validate": [
			"javascript", {
					"language": "vue",
					"autoFix": true
			},
			"html",
			"vue",
			"css",
     	"scss",
	],
	// stylelint 需要检查的文件
	"stylelint.validate": [
			"css",
			"less",
			"postcss",
			"scss",
			"vue",
			"sass"
	],
	// 配置 stylelint 自动修复 ,VScode需要安装stylelint-plus插件，否则不能实现自动修复
	"stylelint.autoFixOnSave": true,
	"editor.fontSize": 14,
	"javascript.updateImportsOnFileMove.enabled": "always",
	"[html]": {
			"editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
	},
	"[javascript]": {
			"editor.defaultFormatter": "vscode.typescript-language-features"
	},
	"[vue]": {
			"editor.defaultFormatter": "stylelint.vscode-stylelint"
	},
	"tabnine.experimentalAutoImports": true,
	"[css]": {
			"editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
	},
	"editor.codeActionsOnSave": {
			"source.fixAll.stylelint": "explicit",
			"source.fixAll.eslint": "explicit"
	},
	"liveServer.settings.AdvanceCustomBrowserCmdLine": "",
	"editor.fontLigatures": false,
	"editor.inlineSuggest.enabled": true,
	"workbench.colorTheme": "Default Dark+",
	"vue.autoInsert.dotValue": true,
	"github.copilot.enable": {
			"*": true,
			"plaintext": false,
			"markdown": false,
			"scminput": false,
			"vue": true
	},
	"window.commandCenter": true,
	"extensions.autoCheckUpdates": false,
	"files.autoSave": "afterDelay",
	"json.schemas": [
			
	],
	"eslint.format.enable": true,
	"editor.stickyScroll.enabled": false,
	"codeium.enableConfig": {
		"*": true
	},
	"workbench.settings.applyToAllProfiles": [
		
	],
	"diffEditor.ignoreTrimWhitespace": true,
	"editor.cursorBlinking": "expand",
	"git.confirmSync": false,
}
```

```json [版本二]
{
	"editor.suggestSelection": "first",
	"vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
	"files.associations": {
			"*.cjson": "jsonc",
			"*.wxss": "css",
			"*.wxs": "javascript"
	},
	"emmet.includeLanguages": {
			"wxml": "html"
	},
	"minapp-vscode.disableAutoConfig": true,
	"editor.tabSize": 2,
	// 配置 eslint 检查的文件类型
	"eslint.autoFixOnSave": true,
	"eslint.validate": [
			"javascript", {
					"language": "vue",
					"autoFix": true
			},
			"html",
			"vue"
	],
	// stylelint 需要检查的文件
	"stylelint.validate": [
			"css",
			"less",
			"postcss",
			"scss",
			"vue",
			"sass"
	],
	// 配置 stylelint 自动修复 ,VScode需要安装stylelint-plus插件，否则不能实现自动修复
	"stylelint.autoFixOnSave": true,
	"editor.fontSize": 14,
	"javascript.updateImportsOnFileMove.enabled": "always",
	"[html]": {
			"editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
	},
	"[javascript]": {
			"editor.defaultFormatter": "esbenp.prettier-vscode"
	},
	"[vue]": {
			"editor.defaultFormatter": "stylelint.vscode-stylelint"
	},
	"tabnine.experimentalAutoImports": true,
	"[css]": {
			"editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
	},
	"editor.codeActionsOnSave": {
			"source.fixAll.stylelint": "explicit",
			"source.fixAll.eslint": "explicit"
	},
	"liveServer.settings.AdvanceCustomBrowserCmdLine": "",
	"editor.fontLigatures": false,
	"editor.inlineSuggest.enabled": true,
	"workbench.colorTheme": "Default Dark+",
	"vue.autoInsert.dotValue": true,
	"github.copilot.enable": {
			"*": true,
			"plaintext": false,
			"markdown": false,
			"scminput": false,
			"vue": true
	},
	"window.commandCenter": true,
	"extensions.autoCheckUpdates": false,
	"files.autoSave": "afterDelay",
	"json.schemas": [

	],
	"eslint.format.enable": true,
	"editor.stickyScroll.enabled": false
}
```

```json [版本一]
{
    "editor.suggestSelection": "first",
    "vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
    "files.associations": {
        "*.cjson": "jsonc",
        "*.wxss": "css",
        "*.wxs": "javascript"
    },
    "emmet.includeLanguages": {
        "wxml": "html"
    },
    "minapp-vscode.disableAutoConfig": true,
    "editor.tabSize": 2,
    // #每次保存的时候自动格式化
    // "editor.formatOnSave": true,
    // 配置 eslint 检查的文件类型
    // "eslint.autoFixOnSave": true,
    "eslint.validate": [
        // "javascript", {
        //     "language": "vue",
        //     "autoFix": true
        // },
        // "javascriptreact",
        "javascript",
        "html",
        "vue"
    ],
    // 关闭编辑器内置样式检查（避免与stylelint冲突）
    // "css.validate": false,
    // "less.validate": false,
    // "scss.validate": false,
    // 配置stylelint检查的文件类型范围
    "stylelint.validate": ["css", "less", "postcss", "scss", "sass", "vue"],
    // 配置 stylelint 自动修复 ,VScode需要安装stylelint-plus插件，否则不能实现自动修复
    "stylelint.autoFixOnSave": true,
    "editor.fontSize": 14,
    "javascript.updateImportsOnFileMove.enabled": "always",
    "workbench.colorTheme": "Default Dark+",
    "[html]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[vue]": {
        "editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
    },
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit",
        "source.fixAll.stylelint": "explicit"
    },
    "tabnine.experimentalAutoImports": true,
    "settingsSync.ignoredExtensions": [],
    "diffEditor.ignoreTrimWhitespace": false,
    "consoleLog.Font Size": "14",
    "settingsSync.ignoredSettings": [],
    "liveServer.settings.AdvanceCustomBrowserCmdLine": "",
    "editor.fontLigatures": false,
    "github.copilot.enable": {
        "*": true,
        "plaintext": false,
        "markdown": false,
        "scminput": false
    },
    "editor.inlayHints.enabled": "offUnlessPressed",
    "files.autoSave": "afterDelay",
    "security.workspace.trust.untrustedFiles": "open",
}
```

:::

## 小结
