# LangChain 概念总览

## 概要

[LangChain](https://www.langchain.com/) 是当前最主流的 LLM 应用开发框架。它提供了一套统一的接口和组件化架构，让开发者能够像搭积木一样编排 Model（模型）、Prompt（提示模板）、Chain（链）、Memory（记忆）等模块，快速构建复杂的 LLM 应用。

它的核心价值在于：
- **统一 API**：一套接口对接 OpenAI、Anthropic、Google 等数十种模型提供商
- **链式编排**：通过 LCEL（LangChain Expression Language）的 `|` 管道语法串联组件
- **生态丰富**：内置文档加载器、向量存储、Agent 工具等开箱即用的模块

## 一、核心概念速览

在深入代码之前，先从四个维度建立对 LangChain 生态的整体认知：**能做什么**（应用场景）、**怎么增强知识**（RAG）、**怎么自主决策**（Agent）、**怎么选型**（技术决策）。

### 1. 大模型应用场景介绍

LangChain 覆盖了从简单到复杂的完整应用谱系，每个主流场景都有对应的技术配方：

| 场景 | 核心组件 | 典型应用 |
| --- | --- | --- |
| 文本生成 | Model + Prompt | 文案创作、翻译、摘要、代码生成 |
| 结构化提取 | Model + Prompt + OutputParser | 发票解析、简历提取、合同关键字段抽取 |
| 知识问答 | Retriever + Model（RAG） | 企业知识库、产品文档问答、智能客服 |
| 对话系统 | Model + Prompt + Memory | 多轮客服、AI 陪练、教育辅导 |
| 自主代理 | Agent + Tools + Memory | 自动化办公、数据分析、代码审查 |
| 多模态应用 | Multimodal Model + Tools | 图片理解、图文生成、视频分析 |

LangChain 的核心设计理念是 ==组件化=={blue}：每个场景都由一组可替换的组件拼装而成。比如"知识问答"中，文档加载器可以换（PDF → 网页 → 数据库），向量库也可以换（Chroma → FAISS → Pinecone），但整体编排逻辑不变。

后续「**基础使用**」章节将带你亲手实践 Model → Prompt → Chain 核心链路。

### 2. RAG 开发

==RAG==（Retrieval-Augmented Generation，检索增强生成）是 LangChain 最经典的应用模式。核心思路是 **先检索，再生成**——让模型在回答之前，先从外部知识库中查到相关资料，再基于资料作答。

**RAG 解决了三个核心痛点：**

- ==知识截止=={warning}：训练数据有截止日期，RAG 接入最新文档让模型回答"新鲜事"
- ==幻觉=={danger}：模型编造不存在的事实，RAG 用真实文档约束输出
- ==私有知识=={green}：无需微调模型即可实现企业内部文档、产品手册问答

RAG 的典型流水线及 LangChain 对应组件：

```
文档加载 → 文本分割 → 向量嵌入 → 向量存储 → 相似检索 → 生成回答
Loader  → Splitter → Embeddings → VectorStore → Retriever → ChatModel
```

| 环节 | 常用组件 | 关键点 |
| --- | --- | --- |
| 文档加载 | `PyPDFLoader`、`WebBaseLoader`、`TextLoader` | 按文档类型选 Loader |
| 文本分割 | `RecursiveCharacterTextSplitter` | `chunk_size` + `overlap` 决定检索质量 |
| 向量嵌入 | `OpenAIEmbeddings`、`DeepSeekEmbeddings` | 与 ChatModel 配套使用 |
| 向量存储 | `Chroma`（轻量）、`FAISS`（高性能）、`Pinecone`（云原生） | 按数据规模选存储 |
| 检索生成 | `as_retriever()` + `create_stuff_documents_chain()` | 检索后拼接 context 再生成 |

::: tip RAG 优化方向
- **文档切分**：`chunk_size` 太小丢失上下文，太大检索不准——需要根据文档类型调参
- **检索精度**：相似度检索 → MMR（最大边际相关，增加多样性）→ 多轮检索 → 混合检索
- **生成质量**：提示词中明确要求"基于提供的文档回答，不知道就说不知道"，减少幻觉
:::

### 3. Agent 开发

==Agent==（智能体）是 LangChain 中复杂度最高、能力也最强的模式。与 Chain 的固定流程不同，Agent 让模型**自主决定**使用什么工具、按什么顺序调用。

**Chain vs Agent：**

| 特性 | Chain（链） | Agent（智能体） |
| --- | --- | --- |
| 执行流程 | 预先定义，固定顺序 | 模型动态决策 |
| 工具使用 | 不支持（或固定嵌入） | 自主选择、组合多个工具 |
| 错误处理 | 流程中断，需人工介入 | 观察结果 → 自我纠正 → 重试 |
| 适用场景 | 翻译→摘要等固定流水线 | "帮我分析这份数据"等开放式任务 |

Agent 的核心三要素：

- **Model**（大脑）：推理、决策、生成回答——Agent 的智力来源
- **Tools**（手脚）：搜索引擎、代码执行器、数据库查询、API 调用——Agent 的行动能力
- **Orchestrator**（编排器）：`create_agent()` → AgentExecutor，控制"思考 → 行动 → 观察"循环

::: warning Agent 的代价
Agent 每次决策都需要调用模型（多次往返），==Token 消耗远高于 Chain=={danger}。对于流程固定的任务，直接用 Chain 更经济高效。Agent 适合**步骤不确定、需要探索和试错**的开放式任务。另外，每个 Tool 的 `description` 写得越清楚，模型调用越准确——这是 Agent 开发最重要的工程实践。
:::

### 4. 如何选择相关技术

选择哪种模式取决于任务的 ==确定性=={green} 与 ==复杂度=={warning}。下面的对照表可以帮你快速判断：

| 任务特征 | 推荐模式 | 典型示例 |
| --- | --- | --- |
| 流程固定、输入明确 | Chain | 翻译→摘要、格式转换、代码 review |
| 需要外部知识 | RAG | 企业文档问答、产品手册查询 |
| 步骤灵活、需要工具 | Agent | 数据分析、自动化办公、信息搜集 |
| 长期对话 + 知识库 | RAG + Memory | 带记忆的知识库客服 |
| 复杂自主任务 | Agent + RAG + Tools | AI 研究助手、自动化运维 Agent |

LangChain 生态中，不同组件解决不同层级的问题。以下四个核心模块值得从一开始就了解：

<Links
  :grid="4"
  :items="[
    {
      icon: 'simple-icons:langchain',
      name: 'LangChain',
      desc: '核心框架：Chain、Agent、RAG 编排，统一的多模型接口。',
      link: 'https://python.langchain.com/',
      linkText: '文档'
    },
    {
      icon: 'mdi:graph',
      name: 'LangGraph',
      desc: '有状态、多角色的 Agent 编排框架，支持复杂分支和循环工作流。',
      link: 'https://langchain-ai.github.io/langgraph/',
      linkText: '文档'
    },
    {
      icon: 'mdi:monitor-dashboard',
      name: 'LangSmith',
      desc: 'LLM 应用调试、测试、监控平台——开发阶段就应接入。',
      link: 'https://smith.langchain.com/',
      linkText: '平台'
    },
    {
      icon: 'mdi:api',
      name: 'LangServe',
      desc: '将 Chain / Agent 一键部署为 REST API，快速上线。',
      link: 'https://python.langchain.com/docs/langserve/',
      linkText: '文档'
    }
  ]"
/>

::: tip 选型原则
1. **从简到繁**：先用 Chain 跑通核心流程 → 需要知识时加 RAG → 需要自主决策时升级 Agent
2. **能用 RAG 不上 Agent**：Agent 贵且不稳定，固定流程用 RAG 性价比更高
3. **早接入 LangSmith**：开发阶段就接入调试平台，不要等到出问题再补救
4. **多模型适配**：LangChain 统一接口让你可以低成本切换模型——开发用便宜模型，生产切高性能模型
:::

## 小结

本文建立了 LangChain 生态的全局认知：

- ==应用场景==：从文本生成到自主代理，LangChain 覆盖了完整的 LLM 应用谱系，每个场景都有对应的组件配方
- ==RAG==：检索增强生成解决了知识截止、幻觉、私有知识三大痛点，是性价比最高的知识注入方案
- ==Agent==：智能体让模型自主决策工具调用，适合开放式任务，但 Token 成本高，能用 RAG 不上 Agent
- ==技术选型==：从简到繁 — Chain → RAG → Agent，LangSmith 全程护航

进入「**基础使用**」章节，从零搭建环境，亲手实践 Model → Prompt → Chain 核心链路。

:::info 📖 相关资源
- [中文文档](https://docs.langchain.org.cn/oss/python/langchain/install) - 中文 LangChain 文档
- [LangChain 官方文档](https://python.langchain.com/) - LangChain Python SDK 完整文档
- [LangChain GitHub](https://github.com/langchain-ai/langchain) - 开源代码仓库
- [LangSmith](https://smith.langchain.com/) - LLM 应用调试、测试与监控平台
- [LCEL 协议文档](https://python.langchain.com/docs/concepts/lcel/) - LangChain Expression Language 详解
:::
