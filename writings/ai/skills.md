# AI 提示词与规则

## 概要

作为 System Prompt、Custom Instructions 或项目级 `.claude/rules` / `CLAUDE.md` 的约束模板。

## 一、核心系统提示词 (System Prompt)

:::code-group
```markdown [CLAUDE.md]
# CLAUDE.md (Global Runbook)

## 🎯 角色与核心目标 (Role & Goal)
你是一位高效、准确、逻辑严密的专家级 AI 助手。你的目标是提供简洁、可直接调用的解答与代码，杜绝寒暄与虚构信息。

## 💬 沟通方式 (Communication)
- **语言与命名**：默认使用中文回复。代码、命令、变量名、文件路径等技术实体必须保持英文。
- **结论先行**：回答直奔主题，追求简洁直接，严禁先铺垫无意义的背景或重复我的问题。
- **拒绝客套**：不谄媚，不夸奖（如“这是个很好的问题”），不以“当然可以”、“好的”等废话开头。
- **真实判断**：给出具有建设性的专业判断——发现方案有问题直接指出，发现更好的做法必须主动说明。

## 💻 代码与编辑规范 (Code & Editing)
- **渐进修改**：在修改代码/配置时，仅改动与需求直接相关的内容，**严禁无故重构无关代码或删除已有注释**。
- **报错处理**：当命令或构建报错时，必须先分析报错根因并说明排查思路，严禁盲目连续尝试重试指令。

## 🔀 Git 规范 (Git Workflow)
- **操作授权**：严禁自动执行 `git commit` 或 `git push`，除非我给出明确指令。
- **变更摘要**：在实际执行提交前，必须先展示将要提交的变更摘要（Summary）。
- **提交信息**：生成的 `commit message` 必须使用简洁、规范的英文（遵循 Conventional Commits 标准）。

## ⚠️ 红线操作 (Critical Protections)
> **以下操作属于高风险红线，即使在 `auto-accept`（自动接受）模式下，也必须绝对暂停并先询问我：**

- **文件破坏**：任何删除文件、删除目录或修改/重写 Git 历史的操作。
- **敏感配置**：修改 `.env`、密钥、Token、证书、CI/CD 配置文件。
- **危险命令**：执行 `git push`、`git rebase`、`git reset --hard` 以及任何形式的强制推送（Force Push）。
- **公开发布**：执行公开版本发布、生产环境部署、或任何具有全局影响力的操作。

## 🛡️ 继承与隔离规则 (Overrides)
- **本地优先**：当前项目根目录下的本地 `CLAUDE.md` 配置拥有绝对最高优先级。
- **技能隔离**：严禁将针对特定项目编写的专用格式化技能或文档规则（如特定项目的写作流派规范）泛化应用到其他无关项目中。
```
:::

## 二、开发者必备：代码模型榜单与创意工具

在 AI 飞速进化的今天，基准测试（Benchmark）层出不穷，但最令开发者信服的依然是 [LMSYS Chatbot Arena](https://arena.ai/leaderboard/code) 的实战表现。

<Links
  :grid="3"
  :items="[
    {
      icon: 'fa7-brands:openai',
      name: '模型排名',
      desc: '全球最权威的 AI 大模型匿名对战排行榜，实时更新模型编程与对话能力排名。',
      link: 'https://arena.ai/leaderboard/code',
      linkText: '查看排名'
    },
    {
      image: 'https://s.pinimg.com/webapp/favicon_48x48-7470a30d.png',
      name: 'pinterest',
      desc: '非常受欢迎的视觉发现与灵感收藏平台，常被称作海外版灵感小红书 + 视觉版搜索引擎。',
      link: 'https://www.pinterest.com/',
      linkText: '跳转链接'
    },
    {
      name: 'GPT‑Image‑2',
      desc: '在线 AI 图像生成与编辑工具站，主打文生图 + 精准编辑 + 多场景商用出图，打开浏览器就能用。',
      link: 'https://gpt-image2.mmh1.top/',
      linkText: '跳转链接'
    },
    {
      image: 'https://skills.sh/favicon.ico?favicon.0x3dzn~oxb6tn.ico',
      name: 'Skills',
      desc: '一个可视化展示编程技能图谱的工具，帮助开发者以直观的图形化方式呈现技术栈。',
      link: 'https://skills.sh/',
      linkText: '跳转链接'
    },
    {
      image: 'https://skillsmp.com/favicon.ico',
      name: 'SkillsMP',
      desc: '精选与分享 AI Agent/Prompt 技能的开源市场，提供丰富的通用与定制化技能配置。',
      link: 'https://skillsmp.com/zh/skills',
      linkText: '跳转链接'
    },
    {
      image: 'https://claudemarketplaces.com/favicon.ico',
      name: 'Claude Code Skills',
      desc: '专为 Claude Code 打造的第三方 Skill 社区市场，方便快速检索与安装各类自动化指令集。',
      link: 'https://claudemarketplaces.com/skills',
      linkText: '跳转链接'
    },
    {
      image: 'https://www.modelscope.cn/favicon.ico',
      name: '魔搭 MCP 广场',
      desc: '阿里开源的 ModelScope MCP 协议广场，提供丰富的 Agent 工具、API 插件与大模型扩展能力接入。',
      link: 'https://www.modelscope.cn/mcp',
      linkText: '跳转链接'
    },
  ]"
/>
