# Claude Code 教程

## 概要

[Claude Code](https://code.claude.com/docs/zh-CN/overview) 是 Anthropic 推出的 AI 编程终端智能体（Agentic Coding CLI），可在终端/IDE 中直接操作文件、执行命令、联网搜索，覆盖从需求到部署的完整开发流程。

## 一、环境与配置

根据 [Claude Code 官网](https://code.claude.com/docs/zh-CN/overview) 提供的终端命令完成安装，安装完成后执行 `claude`，能正常进入交互界面即安装成功。也可使用 [npm 方式](https://code.claude.com/docs/zh-CN/setup#install-with-npm) 安装，如需[卸载](https://code.claude.com/docs/zh-CN/setup#uninstall-claude-code)可参考官方文档。

::: code-group
```sh [npm]
npm install -g @anthropic-ai/claude-code
```

```sh [官方脚本]
# macOS / Linux
curl -fsSL https://claude.ai/code/install.sh | sh

# Windows (PowerShell)
irm https://claude.ai/code/install.ps1 | iex
```
:::

当无法使用官方 Claude 模型，或希望接入第三方模型（DeepSeek、Gemini、OpenAI Codex 等）时，可以通过 [cc-switch](https://github.com/farion1231/cc-switch) 进行切换。安装后添加模型供应商并填写 API Key，启用对应模型后重启 Claude Code 即可生效。

接入第三方模型后，在各供应商的 ==API 监控面板=={info} 查看用量、余额、调用日志：

<Links
  :grid="4"
  :items="[
    {
      icon: 'simple-icons:anthropic',
      name: 'Anthropic',
      desc: 'Claude 官方 API 用量监控、Key 管理、账单查询。',
      link: 'https://console.anthropic.com',
      linkText: 'Console'
    },
    {
      icon: 'fa7-brands:openai',
      name: 'Codex',
      desc: 'GPT / Codex 模型 API 用量、Rate Limits、账单。',
      link: 'https://chatgpt.com/codex/cloud/settings/analytics',
      linkText: 'Platform'
    },
    {
      icon: 'simple-icons:deepseek',
      name: 'DeepSeek',
      desc: 'DeepSeek API 用量管理、Key 管理、充值中心。',
      link: 'https://platform.deepseek.com',
      linkText: 'Platform'
    },
    {
      icon: 'simple-icons:googlegemini',
      name: 'Gemini',
      desc: 'Google AI Studio，API Key 管理、用量统计。',
      link: 'https://aistudio.google.com/rate-limit',
      linkText: 'AI Studio'
    }
  ]"
/>

## 二、权限系统：四种运行模式

Claude Code 内置 4 种权限模式，控制 AI 修改文件、执行命令的权限。在图形化界面 `edit automatically` 切换，也可通过终端命令开启最高权限。

| 名称 | 规则 | 适用场景 |
| ---- | ---- | ---- |
| Plan Mode（计划模式） | 仅输出方案，不修改任何文件/执行命令 | 需求评审、方案规划 |
| Ask before edit（默认模式） | 修改文件前必须手动确认，终端命令也需授权 | 日常使用、安全优先 |
| Edit automatically | 自动执行文件编辑，终端/网络请求仍需确认 | 常规开发、提升效率 |
| Bypass permissions（全权限） | 所有操作自动执行，无二次确认 | 本地可信项目、批量自动化 |

:::danger 全权限风险
Bypass permissions 模式下 AI 可自由执行任何操作，**仅在完全可信的本地项目中使用**。组合以下措施降低风险：
- 在 `CLAUDE.md` 中设定红线操作（禁止 `git push`、删除目录、修改 `.env`）
- 使用 `PreToolUse` Hook 拦截高危命令
- `.gitignore` 中排除 `.claude/settings.local.json`
:::

:::tip 开启全权限
**图形化配置**：VS Code Settings → 搜索 `allow dangerous schema permissions` 启用。

**终端命令**：
```bash
claude dangerously risky permissions
```
:::

## 三、斜杠命令体系

Claude Code 的 `/` 命令分两类：内置命令（系统原生提供，不可修改）和自定义命令（用户在 `settings.json` 中定义）。在对话中直接输入即可触发。

### 1. 内置命令

| 命令 | 功能 | 使用场景 |
| ---- | ---- | ---- |
| `/init` | 扫描项目代码，自动生成 CLAUDE.md | 新项目接入 Claude Code |
| `/plugin` | 打开插件管理面板 | 安装/卸载/浏览插件 |
| `/agents` | 打开子智能体管理面板 | 创建/配置子智能体 |
| `/schedule` | 创建云端定时任务 | 周期性自动化任务 |
| `/memory` | 管理持久化记忆 | 全局 CLAUDE.md 配置 |
| `/config` | 查看/修改配置项 | 切换主题、模型选择 |
| `/clear` | 清空对话上下文 | 重新开始全新对话 |
| `/context` | 查看当前加载的全部上下文资源 | 预估 Token 占用，判断是否需要执行 /compact |
| `/compact` | 压缩上下文窗口 | Token 即将超限时使用 |
| `/doctor` | 诊断环境问题 | 排查安装/运行故障 |
| `/status` | 查看当前会话状态 | 显示模型、权限、项目信息 |
| `/review` | 审查当前分支变更 | 代码审查 PR |
| `/security-review` | 安全漏洞审查 | 检查安全隐患 |

### 2. 自定义斜杠命令

在 `.claude/settings.json` 中通过 `slashCommands` 字段定义，将常用指令固化为快捷命令：

```json
{
  "slashCommands": [
    {
      "name": "deploy",
      "description": "触发部署流程",
      "prompt": "执行项目部署脚本，完成后输出部署日志"
    },
    {
      "name": "review",
      "description": "审查当前变更",
      "prompt": "对当前 git diff 进行代码审查，列出问题和改进建议"
    },
    {
      "name": "test",
      "description": "运行测试并修复",
      "prompt": "运行项目全部测试，对失败的测试进行分析和修复"
    }
  ]
}
```

| 字段 | 说明 |
| ---- | ---- |
| `name` | 命令名，输入 `/name` 即可触发 |
| `description` | 简短描述，帮助 AI 理解何时建议使用 |
| `prompt` | 触发后自动发送的提示词 |

:::tip 设计建议
命令名简短易记（`/deploy`、`/test`），`prompt` 写清楚具体步骤和输出要求，高频重复操作优先固化为自定义命令。
:::

## 四、Hooks 钩子

Hooks 是 ==生命周期监听脚本=={green}，在 Claude Code 运行的**关键节点**自动触发预设逻辑，作用是监督、校验、自动化后置操作，类似 Git Hooks。

**常用触发事件**：

| 触发事件 | 触发时机 | 典型用途 |
| ---- | ---- | ---- |
| PreToolUse | 调用工具**之前** | 校验敏感文件、拦截危险操作 |
| PostToolUse | 调用工具**之后** | 自动格式化代码、运行代码检测 |
| Stop | 主智能体任务结束前 | 验收任务、检查测试是否完成 |
| SubagentStop | 子智能体任务结束前 | 统计子智能体修改内容、结果汇总 |
| PostToolUseFailure | 工具调用失败后 | 报错提醒、自动重试 |

:::details 实操：创建验收类 Hook
需求：AI 任务结束前，强制检查代码是否完成测试，未完成则禁止结束任务。

1. 在 Claude Code 对话中输入自然语言指令：
```text
创建一个 Stop 类型 Hook：任务结束前检查代码、配置、文档是否完成测试，未完成则继续工作，禁止结束任务。
```
2. 生效位置：项目目录 `.claude/settings.json`，自动生成 Hook 配置。
3. 验证：修改代码后让 AI 结束任务，Hook 会自动触发校验。
:::

:::tip Hook 最佳实践
1. 格式化、代码校验放在 `PostToolUse`，不打断 AI 编写逻辑
2. 高危操作拦截放在 `PreToolUse`，提前规避风险
3. 复杂逻辑封装为独立脚本，Hook 仅负责调用脚本，便于维护
:::

## 五、Skills 技能

Skills 是 ==固定流程 + 提示词 + 脚本== 打包的 ==可复用能力包=={green}，针对重复场景（生成 PPT、调研报告、文档整理），一次配置、永久调用，避免重复输入指令。

### 1. 目录结构

所有 Skills 统一存放在项目 `.claude/skills/` 目录：

```
.claude/skills/
├── my-skill/
│   ├── skill.md        # 核心配置文件（必填）
│   ├── references.md    # 可选，引用文档/流程细则
│   └── scripts/         # 可选，可执行脚本（Python/Shell）
```

### 2. skill.md 核心组成

`skill.md` 是技能的核心配置文件：

| 字段 | 说明 | 必填 |
| ---- | ---- | ---- |
| `name` | 技能名称，作为标识符 | ✅ |
| `description` | 使用场景描述，AI 据此自动判断何时启用 | ✅ |
| `instructions` | 执行步骤、输出规范、行为约束 | ✅ |
| `tools` | 可用工具权限范围 | 可选 |
| `references` | 引用辅助文档路径 | 可选 |

### 3. 实操示例

:::code-group
```text [官方 PPT 技能]
1. 安装官方 pptx 技能后，目录生成对应文件夹；
2. skill.md 规定：处理 PPT（新建/编辑/阅读）时自动启用该技能；
3. 配套文档定义排版规则、配色规范，脚本负责批量操作；
4. 使用：直接下达「根据主题生成 PPT」，AI 自动调用该技能。
```

```text [自定义 Skill 实操]
需求：实现「主题调研 → 整理资料 → 生成 PPT」自动化流程。
1. 对话输入指令：
   创建名为 research_to_slide 的 Skill：接收主题后先全网调研，交叉验证信息，再调用 pptx 技能生成 PPT。
2. 查看文件：.claude/skills/research_to_slide/skill.md 自动生成规则；
3. 测试：输入主题，AI 全自动执行调研+生成 PPT。
```
:::

:::info 使用规范
1. 通用技能建议放在**全局 `.claude`**（所有项目生效）
2. 项目专属技能放在**项目内 `.claude`**（仅当前项目生效）
3. 单一技能只聚焦一个场景，避免功能臃肿
:::

## 六、Superpowers 插件

Superpowers 是 Anthropic 官方推出的 ==开发流程最佳实践插件=={blue}，将需求头脑风暴、代码审查、测试生成等标准流程打包为一键可用的能力集。

| 能力 | 说明 |
| ---- | ---- |
| 需求头脑风暴 | 主动补全需求盲点（边界情况、交互细节、异常处理） |
| 开发流程标准化 | 需求梳理 → 计划 → 实现 → 测试 → 审查的完整流程 |
| 代码审查 | 对变更进行正确性、安全性、可维护性检查 |
| 测试生成 | 自动生成单元测试和集成测试 |

**安装**：在 Claude Code 对话中输入 `/plugin` → 选择 `marketplace` → 搜索 `superpowers` → `install`。

**实操示例**——下达指令：
```text
使用 superpowers 插件进行需求头脑风暴：项目为「AI 文案生成 App」，功能包括输入主题、选择平台、生成 10 种风格文案，支持复制、收藏、历史记录。
```
插件会主动补全需求盲点（语言、输出形式、风格区分等），确认所有细节后再进入开发阶段。

## 七、MCP Server

MCP（Model Context Protocol）是 ==外部工具/数据源连接协议=={info}，让 Claude Code 突破本地限制，对接第三方服务（GitHub、数据库、网盘、Notion 等），扩展工具边界。

在 `.claude/settings.json` 中配置：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "--root", "./"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "你的GitHub Token"
      }
    }
  }
}
```

<Links
  :grid="3"
  :items="[
    {
      icon: 'mdi:folder-multiple',
      name: '文件系统',
      desc: '本地文件高级读写操作，支持多根目录、文件监听。',
      link: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
      linkText: 'filesystem'
    },
    {
      icon: 'mdi:database',
      name: '数据库',
      desc: 'MySQL / PostgreSQL / SQLite 数据查询与修改，支持 schema 自省。',
      link: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
      linkText: 'postgres'
    },
    {
      icon: 'mdi:github',
      name: 'GitHub',
      desc: '仓库管理、PR、Issue、代码搜索，自动化 Git 工作流。',
      link: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
      linkText: 'github'
    },
    {
      icon: 'mdi:cloud',
      name: '云盘 / 笔记',
      desc: 'Notion、飞书文档读写，打通本地与云端知识库。',
      link: 'https://github.com/modelcontextprotocol/servers',
      linkText: 'MCP Servers'
    },
    {
      icon: 'mdi:web',
      name: '浏览器自动化',
      desc: 'Puppeteer / Playwright 驱动浏览器，实现 E2E 测试和网页抓取。',
      link: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
      linkText: 'puppeteer'
    },
    {
      icon: 'mdi:puzzle',
      name: '更多服务',
      desc: 'MCP 生态持续扩展，社区和官方提供了上百种服务端实现。',
      link: 'https://github.com/modelcontextprotocol/servers',
      linkText: '浏览全部'
    }
  ]"
/>

## 八、Plugin 插件

Plugin（插件）是 ==Skills + Hooks + MCP Server== 的组合包，将一整套关联能力打包分发，一键安装即可使用完整工作流，是高阶复用方案。

**组成结构**（按需组合）：

1. **Skills**：场景化能力包（如前端开发、视频脚本）
2. **Hooks**：生命周期自动化规则（如提交前校验文件）
3. **MCP Server**：外部工具连接（如视频渲染引擎、素材库）

**插件管理**：对话输入 `/plugin` → `manage plugin` → `installed`（已安装）/ `marketplace`（官方与社区插件）→ 选中安装（支持全局或项目级）。

| 安装位置 | 路径 | 生效范围 |
| ---- | ---- | ---- |
| 全局 | `~/.claude/plugins/` | 所有项目共享 |
| 项目级 | `.claude/plugins/` | 仅当前项目生效 |

## 九、子智能体（Subagent）

**主智能体**：你直接对话的核心 AI。**Subagent（子智能体）**：主智能体派出的 ==独立助手=={green}，拥有**独立上下文、独立权限、独立记忆**。

**核心优势**：任务并行执行提升效率；上下文隔离不污染主会话；拆分复杂任务分工协作。

### 1. 创建方式

**方式一：自然语言快速创建（推荐）**——直接在对话中描述子智能体职责，AI 自动生成配置。

**方式二：终端命令精细化创建**——

1. 终端启动 Claude Code，输入 `/agents`
2. 进入 `library`，选择创建位置：`project`（仅当前项目）或 `personal`（全局所有项目）
3. 选择生成方式：`generate with cloud`（AI 自动生成配置）
4. 填写子智能体职责（例：信息搜索+交叉验证）
5. 配置权限（全部工具/只读工具）、模型、标识颜色、记忆存储范围
6. 回车保存，创建完成

### 2. 目录与记忆

创建后项目 `.claude` 自动生成两个文件夹：

- `agents/`：子智能体配置文件（角色、执行步骤、系统提示词）
- `agent memory/`：子智能体持久化记忆（按配置选择项目/全局存储）

**常用调用场景**：并行搜索多份文档、独立代码审查/测试、数据采集与信息交叉验证、大型项目分模块开发。

## 十、定时任务（Schedule）

基于子智能体/技能实现 ==云端定时任务=={info}，支持每日/周期自动执行任务，使用 `/schedule` 命令创建。

**实操示例**——每日早 8 点，调用信息验证子智能体爬取前一日 AI 新闻并汇总：

1. Claude Code 对话输入指令：
```text
创建定时任务：每天早上 8 点，调用 evidence researcher 子智能体，搜索昨日 AI 新闻、交叉验证信息、生成总结。
```
2. 系统生成云端 `routines` 自动化任务，自动激活
3. 点击任务链接，可查看运行记录、执行日志

:::warning 重要限制
1. 自动化任务**仅在云端运行**，不占用本地资源
2. 仅支持 **Anthropic 官方 Claude 模型**
3. 若切换为第三方模型（cc-switch），云端自动化任务**无法执行**
:::

## 十一、项目配置体系

Claude Code 的项目配置围绕 ==`.claude/` 目录=={info} 展开，包含项目说明书、权限、Hooks、Skills、子智能体等全部配置。理解这一体系是高效使用 Claude Code 的关键。

### 1. .claude 目录全貌

```
my-project/
├── CLAUDE.md                    # 项目说明书（必选，提交 Git）
├── .claude/
│   ├── settings.json            # 权限 + hooks + MCP + slashCommands（提交 Git）
│   ├── settings.local.json      # 本地敏感覆盖（不提交 Git）
│   ├── skills/                  # 项目专属技能
│   │   └── my-skill/
│   │       └── skill.md
│   ├── agents/                  # 项目子智能体配置
│   │   └── my-agent.md
│   └── agent memory/            # 子智能体持久化记忆（不提交 Git）
├── .gitignore
└── .env.local                   # API Key（不提交 Git）
```

### 2. CLAUDE.md 项目说明书

`CLAUDE.md` 是项目根目录下的 ==项目专属说明书=={green}，Claude Code 启动时自动载入上下文。作用：告知 AI 技术栈/目录/命令、约定编码规范/开发约束、减少重复沟通。

> `CLAUDE.md` 是**软性约定（上下文注入）**；Hooks 是**硬性强制规则**。

**创建方式**：

| 方式 | 操作 | 适用场景 |
| ---- | ---- | ---- |
| 自动生成（推荐） | 项目根目录输入 `/init`，AI 扫描代码自动生成 | 已有代码的项目 |
| 手动创建 | 项目根目录新建 `CLAUDE.md`，按模板补充 | 全新项目、精确控制 |

**标准模板**：

```markdown
# 项目名称

## 项目简介
简要描述项目功能和定位。

## 技术栈
列出语言、框架、关键依赖。

## 目录结构
- /src：源代码
- /docs：文档
- .env.local：API Key 配置文件

## 运行命令
- npm run dev：启动开发服务器
- npm run build：构建生产版本
```

**编写规范**：

1. 内容**简洁精炼**，建议控制在 200 行内，过长会稀释规则权重
2. 三大核心模块：项目介绍 → 技术栈/目录 → 运行命令/编码规范
3. 仅写**项目通用规则**，重复流程拆分至 Skills，高危约束使用 Hooks
4. 迭代优化：AI 频繁出错时，补充对应规则至文档

**优先级**：项目根目录 `./CLAUDE.md`（最高，推荐提交 Git）> 全局 `~/.claude/CLAUDE.md`（所有项目通用规则）。

### 3. settings.json 配置

`.claude/settings.json` 是项目级配置中心，统一管理权限、Hooks、MCP、自定义斜杠命令：

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev)",
      "Bash(npm run build)",
      "Bash(npm test)",
      "Bash(git diff)",
      "Bash(git status)"
    ],
    "deny": [
      "Bash(git push)",
      "Bash(git rebase)",
      "Bash(rm -rf)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_TOOL_FILE_PATH"
          }
        ]
      }
    ]
  },
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "--root", "./"]
    }
  },
  "slashCommands": [
    {
      "name": "review",
      "description": "审查当前变更",
      "prompt": "对当前 git diff 进行代码审查，列出问题和改进建议"
    }
  ]
}
```

### 4. 项目启动模板套件

新项目接入时，可直接复制以下模板文件快速启动：

**skill.md 模板**：

```markdown
# Skill: my-skill

## Description
[描述此技能的使用场景，AI 据此判断何时自动启用]

## Instructions
1. [步骤一]
2. [步骤二]
3. [步骤三]

## Output
[输出格式和规范要求]
```

**.gitignore 推荐条目**：

```bash
# Claude Code
.claude/settings.local.json
.claude/agent memory/

# API Keys
.env.local
.env
```

### 5. /memory 全局配置

通过 `/memory` 命令直接编辑全局 `~/.claude/CLAUDE.md`，适用于跨项目通用规则——沟通风格、Git 规范、红线操作等，一次配置所有项目生效。

## 十二、综合实战

制作 **AI 文案网页 App**：用户输入主题 + 选择平台，自动生成 10 种风格文案开头，支持复制、收藏、历史记录。

**前置准备**：安装 `superpowers` 插件 → 切换权限为 `Edit automatically` → 配置第三方模型并填写 API Key。

| 阶段 | 操作 | 关键点 |
| ---- | ---- | ---- |
| 需求梳理 | 用 superpowers 做头脑风暴 | 补全边界情况、交互细节 |
| 开发计划 | AI 生成待办清单 + 子智能体并行 | 自动拆分任务 |
| 项目开发 | 子智能体创建文件、编写代码、对接 API | 并行执行，效率高 |
| 功能测试 | 本地启动 `localhost`，测试核心功能 | 复制、收藏、历史记录 |
| 收尾配置 | 执行 `/init` 刷新 CLAUDE.md | 同步最新项目信息 |

## 十三、常见问题与避坑指南

:::details 第三方模型无法使用云端自动化
云端定时任务仅支持官方 Claude 模型，切换 cc-switch 后 Schedule 失效。方案：本地手动触发任务，或换回官方模型使用自动化。
:::

:::details Hook 不生效
检查 `.claude/settings.json` 配置是否正确、触发事件（PreToolUse / PostToolUse / Stop）是否匹配场景。手动触发目标事件，观察控制台是否有 Hook 执行日志。
:::

:::details 文件无法被 AI 修改
权限模式是否为 `Plan Mode` 或 `Ask before edit`。切换至 `Edit automatically` 或手动点击确认。注意某些系统目录受系统保护，需提升权限。
:::

:::details Skills 无法自动调用
`skill.md` 中 `description` 场景描述是否清晰——AI 依赖该字段判断启用时机。重新描述触发场景，使用更明确的词汇，重启对话后再次触发。
:::

:::details Token 消耗过快
高频读取/搜索任务交给子智能体隔离上下文；精简 `CLAUDE.md` 内容控制在 200 行内；长对话中使用 `/compact` 压缩上下文；使用 `/clear` 定期清空对话历史。
:::

:::details cc-switch 模型兼容性问题
第三方模型对工具调用、系统提示词等特性的支持程度不一致，部分功能（Skills、Hooks、定时任务）可能出现兼容性问题。优先使用 Anthropic 官方模型获得完整功能，第三方模型适合轻量级对话和代码补全。
:::

## 小结

Claude Code 的核心能力可以分层理解：

- ==基础层==：环境安装（Claude Code + cc-switch）→ API 监控面板 → 权限系统（4 种模式）
- ==操作层==：斜杠命令体系（12 个内置命令 + 自定义命令）
- ==扩展层==：Hooks（生命周期监听）→ Skills（能力封装）→ MCP（外部连接）→ Plugin（组合包）→ Superpowers（最佳实践插件）
- ==自动化层==：子智能体（并行任务）+ 定时任务（云端自动化）
- ==配置层==：.claude 目录全貌 → CLAUDE.md → settings.json → 模板套件 → /memory 全局配置

:::info 📖 相关资源
- [Claude Code 官方文档](https://code.claude.com/docs/zh-CN/overview) — 安装、配置、功能完整指南
- [cc-switch](https://github.com/farion1231/cc-switch) — 第三方模型切换工具
- [MCP 官方文档](https://modelcontextprotocol.io) — Model Context Protocol 规范
- [MCP Servers 仓库](https://github.com/modelcontextprotocol/servers) — 官方与社区 MCP 服务端实现
- [Anthropic Console](https://console.anthropic.com) — API 用量监控、Key 管理
- [OpenAI Platform](https://platform.openai.com) — Codex/GPT API 用量监控
- [DeepSeek Platform](https://platform.deepseek.com) — DeepSeek API 用量管理
- [Google AI Studio](https://aistudio.google.com) — Gemini API 用量监控
:::
