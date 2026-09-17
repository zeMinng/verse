# Agent 概述

## 概要

[Agent](https://python.langchain.com/docs/concepts/agents/) 是 LangChain 中让 LLM **自主决策与行动**的核心抽象。与固定流程的 Chain 不同，Agent 将 LLM 作为推理引擎，根据用户输入动态选择工具、编排执行顺序，并在多轮交互中自主收敛到最终答案。

核心三角：==Agent==（推理引擎）+ ==Tools==（行动能力）+ ==Memory==（记忆上下文）。适用场景包括：==自动化办公==、==数据分析==、==代码审查==、==多步信息检索==。

## 一、Agent 是什么

**Agent 的本质是 LLM 驱动的自主决策循环**。它不是按预设脚本执行，而是在每一步根据当前状态和可用工具，自主决定下一步该做什么。

### 1. 核心三角模型

```
          ┌──────────────────┐
          │     Agent         │
          │   (推理引擎)       │
          └────────┬──────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Tools   │ │  Memory  │ │  Model   │
  │ (行动)   │ │ (记忆)   │ │ (大脑)   │
  └──────────┘ └──────────┘ └──────────┘
```

| 组件 | 角色 | LangChain 对应 |
|------|------|----------------|
| Model（大脑） | 理解意图、推理决策、生成回答 | ChatModel |
| Tools（双手） | 执行具体操作：搜索、计算、读写文件 | [@tool 装饰器](/VPContent/langchain/base/tools) |
| Memory（记事本） | 保存对话历史和中间结果 | [消息列表](/VPContent/langchain/base/messages) |

### 2. Agent 决策循环

一次完整的 Agent 执行走以下循环，直到模型认为任务完成：

```text
用户输入
  │
  ▼
┌─────────────────────────────────────────────────┐
│  ① 推理：模型分析当前消息 + 可用工具列表          │
│     → 决定是调用工具，还是直接回复用户             │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   需要调用工具          任务完成
          │                 │
          ▼                 ▼
┌──────────────────┐    最终回复用户
│  ② 执行：调用工具   │
│     获取返回值      │
└────────┬─────────┘
          │
          ▼
┌──────────────────┐
│  ③ 回传：ToolMessage │
│     追加到消息历史    │────→ 回到 ①
└──────────────────────┘
```

这个循环和Tools 工具中手动编写的四阶段流程本质相同——Agent 只是把这个循环**自动化**了，你不需要手动检查 `tool_calls`、遍历调用、回传 ToolMessage。

## 二、Agent 类型速览

LangChain 提供了多种 Agent 实现，核心区别在于**推理策略**——即模型如何决定调用哪个工具、何时停止。

| 类型 | 推理方式 | 适用场景 | 特点 |
|------|----------|----------|------|
| Tool Calling Agent | 模型输出结构化 `tool_calls` | 现代主流，推荐首选 | 模型原生支持，精准可靠 |
| ReAct Agent | 交替输出 `Thought → Action → Observation` | 需要可解释推理链 | 推理过程透明，便于调试 |
| Structured Chat Agent | 支持多参数复杂工具的 ReAct 变体 | 工具有复杂输入 Schema | 参数传递更精确 |

### 1. Tool Calling Agent（推荐）

当前 LangChain 的默认和推荐方案。模型直接通过 `tool_calls` 字段输出要调用的工具名和参数，格式与 bind_tools 一致。LangChain 自动完成 `invoke → 检测 tool_calls → 执行工具 → 回传 ToolMessage → 再次 invoke` 的完整循环。

```python{5-6}
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")
agent = create_agent(model=model, tools=[search, calculator])
result = agent.invoke({"messages": [{"role": "user", "content": "深圳人口除以上海人口?"}]})
```

### 2. ReAct Agent

ReAct（Reasoning + Acting）让模型交替输出推理步骤和行动指令。每一步先写出 Thought（思考），再决定 Action（行动），然后观察 Observation（结果），循环直到得出 Final Answer。

```text
Thought: 我需要查深圳和上海的人口数据
Action: search
Action Input: "深圳人口 2024"
Observation: 深圳常住人口约 1779 万

Thought: 还需要上海的人口数据
Action: search
Action Input: "上海人口 2024"
Observation: 上海常住人口约 2487 万

Thought: 现在可以计算深圳人口除以上海人口了
Action: calculate
Action Input: 1779 / 2487
Observation: 0.715

Thought: 已有最终结果
Final Answer: 深圳人口约为上海的 71.5%
```

ReAct 的核心优势是 ==推理过程可读==——每一步 Thought 都展示了模型的决策逻辑，调试和审计都很方便。但相比 Tool Calling 模式，ReAct 的 Token 消耗更高，且依赖模型遵循特定输出格式。

### 3. Structured Chat Agent

ReAct 的一个增强变体，支持**多参数工具调用**。当工具的参数 Schema 复杂（如多个必填参数、嵌套结构）时，Structured Chat Agent 能生成更精确的 Action Input。

::: warning 注意
自 LangChain 0.3+ 起，**Tool Calling Agent 已成为默认推荐方案**。ReAct 和 Structured Chat 主要用于遗留代码兼容，新项目直接使用 `create_agent` 即可。
:::

## 三、Agent 与 Chain 的区别

| 维度 | Chain | Agent |
|------|-------|-------|
| 执行路径 | 预设的固定流程 | 运行时动态决定 |
| 工具调用 | 手动编排 | 模型自动选择 |
| 决策权 | 开发者预定义 | LLM 自主判断 |
| 适用场景 | 明确的线性任务（翻译 → 摘要 → 存储） | 开放式任务（多步推理、信息检索） |
| 可控性 | 高，路径确定 | 低，模型可能走偏 |
| 灵活性 | 低，无法应对未知变化 | 高，适应动态需求 |

**选择原则**：==知道怎么做的用 Chain，知道要做什么但不知道怎么做的用 Agent==。如果任务步骤固定且可枚举（如"读取 PDF → 翻译 → 存为 Markdown"），Chain 更简单可靠；如果任务需要模型自行探索（如"帮我分析这份财报的风险点"），Agent 更合适。

## 四、Agent 工作流示意

以下是一个典型的 Agent 执行时序：

```
用户: "帮我查一下今天的深圳天气和上海天气，对比哪个城市更适合户外活动"
  │
  ▼
Agent (推理): 需要查两个城市的天气 → 调用 get_weather 两次
  │
  ├──▶ get_weather("深圳") → "深圳晴，28°C，湿度 55%"
  │
  ├──▶ get_weather("上海") → "上海阴，22°C，湿度 80%"
  │
  ▼
Agent (推理): 已获得两个城市天气数据，可以直接对比回复
  │
  ▼
最终回复: "深圳更适合户外活动。深圳晴天气温舒适（28°C），而上海阴天湿度较高（80%），可能有降雨风险。"
```

整个过程只写了一个 Agent，它会自动编排两次工具调用并合成对比结论——如果用 Chain 实现，必须手动编写两个并行的 Chain 和一个合并步骤。

## 小结

- Agent 是 ==LLM 驱动的自主决策循环==，核心三角为 Model（大脑）+ Tools（双手）+ Memory（记事本）
- Agent 自动完成了 Tools 工具 中手动编写的四阶段循环，让模型自主决定何时调用工具、何时结束
- Tool Calling Agent 是现代主流方案（`create_agent`），ReAct 适合需要可解释推理链的场景
- Chain 用于固定流程，Agent 用于动态决策——==知道步骤用 Chain，不知道步骤用 Agent==

::: info 📖 相关资源
- [LangChain Agents 概念文档](https://python.langchain.com/docs/concepts/agents/) — Agent 核心概念与架构
- [create_agent API 参考](https://python.langchain.com/api_reference/langgraph/agents/langchain.agents.create_agent.html) — create_agent 函数签名与参数
- [LangChain Tools 概念文档](https://python.langchain.com/docs/concepts/tools/) — 工具定义与使用
:::
