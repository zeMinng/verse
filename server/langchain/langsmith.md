# LangSmith 平台

## 概要

[LangSmith](https://smith.langchain.com/) 是 LangChain 官方推出的 LLM 应用全生命周期管理平台，覆盖开发、测试、生产三个阶段。它提供调用链追踪（Tracing）、质量评测（Evaluation）、生产监控（Monitoring）、提示词管理（Prompt Hub）和数据集实验（Datasets & Experiments）五大核心能力，让 LLM 应用从"黑盒盲写"变成可观测、可评测、可迭代的工程化流程。

**LangSmith 解决的核心问题：**

- LLM 调用链路不透明，出问题难以定位 → Tracing 完整记录每一步的输入输出
- 输出质量靠"人眼感觉"，缺乏量化标准 → Evaluation 提供自动化评分体系
- 上线后 Token 用量、延迟、错误率无从感知 → Monitoring 实时仪表盘 + 告警
- 提示词散落在代码和聊天记录里，没有版本管理 → Prompt Hub 类似 Git 的提示词仓库
- 改了 Prompt 不知道是变好还是变坏 → Datasets & Experiments 用同一批数据做 A/B 对比

::: tip 接入时机
LangSmith 不是"上线后加个监控"的工具——它应该在**写下第一行 LangChain 代码时就接入**。开发阶段的 Tracing 帮你 debug，评测阶段的 Evaluation 帮你选方案，上线后的 Monitoring 帮你守住质量底线。
:::

## 一、平台简介

LangSmith 的定位是 LLM 应用开发全流程的"控制塔"。在 LangChain 生态中，各组件分工明确：

| 组件 | 职责 | 对应阶段 |
|------|------|---------|
| **LangChain** | 编写 Chain / Agent / RAG 逻辑 | 开发 |
| **LangSmith** | 调试追踪、质量评测、生产监控 | 开发 → 测试 → 生产 |
| **LangGraph** | 复杂的有状态 Agent 工作流编排 | 开发 |
| **LangServe** | 将 Chain / Agent 一键部署为 REST API | 部署 |

LangSmith 横跨整个生命周期——你在 LangChain 里写代码，在 LangSmith 里看清代码怎么跑、跑得好不好。

**核心工作流：**

```
开发阶段                测试阶段                生产阶段
Tracing 调试  ──────►  Evaluation 评测  ──────►  Monitoring 监控
  │                        │                        │
  └── 发现问题，回到代码    └── 选出最佳配置上线      └── 异常告警，反馈到数据集
```

这个闭环意味着：线上的一条异常 Trace 可以加入 Dataset，成为下一次 Experiments 的测试用例——**越跑越稳**。

## 二、环境配置

### 1. 安装与获取 API Key

安装 langsmith SDK 后，LangChain 的 invoke / stream 等调用会自动上报 Trace：

::: code-group
```bash [uv]
uv add langsmith
```

```bash [pip]
pip install langsmith
```
:::

::: tip
如果已经在用 langchain 包，langsmith 作为依赖已被自动包含，无需额外安装。可通过 `pip show langsmith` 确认。
:::

API Key 在 [smith.langchain.com/settings](https://smith.langchain.com/settings) 创建，格式为 `lsv2_pt_...`，创建后仅显示一次，请妥善保存到 .env 中，不要提交到 Git 仓库。

### 2. 环境变量

LangSmith SDK 通过环境变量配置连接信息。核心变量只有三个：

| 变量 | 必填 | 说明 |
|------|------|------|
| LANGSMITH_API_KEY | 是 | API 密钥，从平台获取（见下方） |
| LANGSMITH_TRACING | 否 | 设为 true 开启追踪（默认关闭），开发时务必开启 |
| LANGSMITH_PROJECT | 否 | 项目名称，用于在平台上分组管理 Run。 |
| LANGSMITH_ENDPOINT | 否 | https://api.smith.langchain.com，API 端点 |
| LANGSMITH_SAMPLING_RATE | 1.0 | 采样率（0~1），生产环境可用于降采样 |
| LANGCHAIN_TRACING_V2 | 否 | 兼容旧版 LangChain 的追踪开关，新项目建议用 LANGSMITH_TRACING |

::: code-group
```bash [.env 配置示例]
# .env
LANGSMITH_API_KEY=lsv2_pt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=my-llm-app
```

```python{7-9,11-12} [Python 中验证]
import os
from dotenv import load_dotenv

load_dotenv(override=True)

# 检查关键变量是否就绪
api_key = os.getenv("LANGSMITH_API_KEY")
tracing = os.getenv("LANGSMITH_TRACING")
project = os.getenv("LANGSMITH_PROJECT")

if not api_key:
    raise RuntimeError("未设置 LANGSMITH_API_KEY，请在 .env 中配置")
if tracing != "true":
    print("⚠️ LANGSMITH_TRACING 未开启，调用不会自动上报 Trace")

print(f"✅ LangSmith 配置就绪 → 项目: {project or 'default'}")
```
:::

## 三、核心功能

LangSmith 围绕 LLM 开发流程提供了五个核心模块，下面逐一介绍其用途、关键概念和使用方式。

### 1. Tracing 调用链追踪

Tracing 是 LangSmith 最基础也最常用的功能。开启后，每一次 chain.invoke()、model.stream()、tool.invoke() 调用都会被自动记录，并上传到 LangSmith 平台以可视化方式呈现。

**关键概念：**

| 概念 | 说明 |
|------|------|
| **Run** | 一次原子操作：一次 LLM 调用、一次 Tool 执行、一次 Retriever 检索。Run 是最小追踪单元 |
| **Trace** | 一棵 Run 树，根节点通常是一次 chain.invoke()，子节点是链内各组件的 Run |
| **Span** | 与 Run 同义，在 OpenTelemetry 语境下更常用，LangSmith 中 Run 和 Span 可以互换理解 |
| **Project** | Run 的分组容器，对应 LANGSMITH_PROJECT 环境变量，用于按项目隔离数据 |

**一个 Chain 的 Trace 树示例：**

```
chain.invoke({"question": "什么是 RAG？"})
├── ChatPromptTemplate.format()        # 格式化提示词
├── ChatOpenAI.invoke()                # LLM 调用（含 token 数、延迟）
│   └── HTTP POST api.openai.com       # 原始 HTTP 请求
└── StrOutputParser.invoke()           # 输出解析
```

在 LangSmith 平台上，这棵树以**时间轴 + 嵌套层级**的方式展示。点击每个节点可以看到完整的输入（Input）、输出（Output）、耗时（Latency）、Token 用量和 metadata。

**自动追踪 vs 手动追踪：**

::: code-group
```python [自动追踪（零代码侵入）]
import os
os.environ["LANGSMITH_TRACING"] = "true"

# 设置后所有 LangChain 组件自动上报，无需额外代码
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

chain = ChatPromptTemplate.from_template("...") | ChatOpenAI(model="gpt-4o-mini")
result = chain.invoke({"question": "什么是 RAG？"})
# 每次调用自动产生 Trace，无需手动干预
```

```python{3-4} [@traceable 手动追踪]
from langsmith import traceable

@traceable(name="自定义步骤", tags=["rag", "retrieval"])
def my_custom_function(query: str):
    # 适用于非 LangChain 场景（如直接调用 openai SDK）
    return some_processing(query)
```
:::

`@traceable` 适用于任何 Python 函数——不限于 LangChain 组件。

**Trace 的筛选与注释：**

平台上的 Traces 列表支持按以下维度筛选：

- **Project**（项目）
- **Tags**（标签，如 `["production", "gpt-4o"]`）
- **Metadata**（自定义键值对）
- **Run Name**（运行名称，在 config 中设置）
- **时间范围**
- **错误状态**（仅看失败的 Run）

找到关键 Trace 后，可以添加 **Feedback（反馈评分）**——打 👍/👎 或写备注，方便团队协作排查问题。

### 2. Evaluation 评测

Evaluation 让你能用**量化的分数**衡量 LLM 输出质量，而不是靠"我觉得还行"。

**核心流程：**

1. 准备一个 **Dataset**（数据集）——包含输入和期望输出
2. 选择一个 **Evaluator**（评测器）——定义评分标准
3. 运行 **Experiment**（实验）——用模型跑一遍数据集，自动打分
4. 查看 **Results**（结果）——汇总分数、找 Bad Case、对比不同配置

**内置评测器：**

LangSmith 提供了一套开箱即用的评测器，覆盖常见的质量维度：

| 评测器 | 用途 | 适用场景 |
|--------|------|---------|
| correctness | 事实正确性 | QA 问答、知识库 |
| helpfulness | 有用程度 | 客服、助手 |
| conciseness | 简洁性 | 摘要、标题生成 |
| relevance | 相关性 | 检索结果评估 |
| custom_criteria | 自定义评分标准 | 特定业务指标 |

**评测示例：**

```python{7-12,15-20}
from langsmith import Client
from langsmith.evaluation import aevaluate

client = Client()

# 定义自定义评测器
def accuracy_evaluator(run, example):
    """检查模型输出是否包含正确答案"""
    expected = example.outputs.get("answer", "")
    actual = run.outputs.get("output", "")
    score = 1.0 if expected.lower() in actual.lower() else 0.0
    return {"key": "accuracy", "score": score}

# 对数据集运行评测
results = aevaluate(
    client,
    dataset_name="my-qa-dataset",
    experiment_name="gpt-4o-baseline",
    evaluators=[accuracy_evaluator],
)
```

**A/B 对比：**

创建两个 Experiment——一个用 GPT-4o，一个用 DeepSeek-V4——LangSmith 会自动并排对比结果。你可以直观看到：

- 总体平均分对比
- 逐条对比（哪条 GPT 得分高、哪条 DeepSeek 得分高）
- 统计显著性（A 是否真的比 B 好，还是随机波动）

### 3. Monitoring 监控

Tracing 面向开发调试，Monitoring 面向**生产环境的持续监控**。它的目标不是查单条 Trace，而是看**全局趋势**。

**仪表盘指标：**

| 指标 | 说明 | 告警建议 |
|------|------|---------|
| **Token 用量** | 按模型 / 时间聚合，看清费用分布 | 日消费超过预算阈值 |
| **延迟（Latency）** | P50 / P95 / P99，识别慢请求 | P95 延迟超过 3s |
| **错误率** | Run 的失败比例 | 错误率 > 5% 持续 5 分钟 |
| **反馈评分** | 用户 👍/👎 的统计趋势 | 负面评分比例飙升 |
| **吞吐量** | 每分钟处理的请求数 | 突降可能表示下游故障 |

**在线评测（Online Evaluation）：**

Monitoring 的强大之处在于可以**在生产环境自动运行评测器**——你不必手动标注生产数据，LangSmith 自动对每一条（或采样后的）生产 Trace 打分，异常分数自动告警。

```python
# 在 config 中设置在线评测
from langsmith import monitoring

monitoring.set_online_evaluation(
    evaluators=["helpfulness", "conciseness"],
    sampling_rate=0.1,  # 只评测 10% 的请求，控制成本
)
```

### 4. Prompt Hub 提示词管理

Prompt Hub 把提示词从散落在代码和聊天记录里的"一次性文本"，变成**可版本化、可复用、可协作管理的资产**。

**核心概念：**

| 概念 | 类比 Git | 说明 |
|------|---------|------|
| **Prompt** | 仓库 | 一个完整的提示词模板（含 system + user + 变量） |
| **Commit** | commit | 每次修改的版本快照，带描述信息 |
| **Push/Pull** | push/pull | 从本地推到平台 / 从平台拉到本地代码 |

**使用方式：**

```python{4,7-11}
from langsmith import pull_prompt

# 直接从 Prompt Hub 拉取最新的提示词
prompt = pull_prompt("langchain/my-chat-prompt")

# 填充变量
messages = prompt.invoke({
    "role": "技术客服",
    "style": "专业且简洁",
    "input": "我的服务启动报错 port already in use",
})

# 发送给模型
result = model.invoke(messages)
```

**收益：**

- **代码与提示词分离**：产品/运营可以直接在 Web UI 上改提示词并查看效果，无需改代码
- **版本追踪**：每次修改都有 commit 记录，出问题可以一键回滚到之前版本
- **团队协作**：提示词支持评论、标注，让非开发角色参与迭代

### 5. Datasets & Experiments 数据集与实验

Datasets 是一组"输入 → 期望输出"的标注对，Experiments 是用不同模型/提示词/参数在同一个 Dataset 上运行评测的过程。二者配合使用，形成了 LLM 开发的"测试驱动"流程。

**Dataset 的来源：**

| 来源 | 方式 | 适用场景 |
|------|------|---------|
| 从生产 Trace 生成 | 平台上选中一批 Trace → **Add to Dataset** | 把线上真实 case 变成测试用例 |
| 手动标注 | 在平台上逐条创建，或上传 CSV/JSON | 覆盖边界 case、业务逻辑 |
| SDK 创建 | client.create_examples() | 脚本化批量导入 |

**从 Trace 创建 Dataset（最常用的方式）：**

```python
from langsmith import Client

client = Client()

# 将线上 Trace 中的成功 case 转为测试数据
client.create_examples(
    dataset_name="rag-qa-tests",
    inputs=[{"question": "什么是 RAG？"}],
    outputs=[{"answer": "RAG 是 Retrieval-Augmented Generation..."}],
)
```

**数据驱动的提示词迭代闭环：**

```
1. 在生产 Trace 中发现 Bad Case
       ↓
2. Add to Dataset → 成为回归测试用例
       ↓
3. 修改 Prompt（在 Prompt Hub 中提交新版本）
       ↓
4. 运行 Experiment → 看分数变化 → 比旧版好了就上线
       ↓
5. 上线后 Monitoring 继续收集数据 → 回到步骤 1
```

## 四、实用技巧

- **尽早接入**：开发阶段就开启 Tracing，不要等到上线出问题再补救。从第一行 LangChain 代码开始就让 LangSmith 记录。
- **规范 Tag 使用**：给 Run 打上 tags 和 metadata，后续筛选、对比、复盘都需要这些标识。
- **关注成本分布**：Monitoring 面板的 Token 用量图表可以按模型、项目、时间拆分，快速定位"吃 Token 大户"。
- **用 Prompt Hub 管理版本**：把提示词从代码中抽离出来，让产品和运营也能在 Web UI 上直接迭代。每次提交写清楚改了什么、为什么改。
- **建立 Bad Case 闭环**：线上发现错误回答 → 加入 Dataset → 改进提示词或模型 → 跑 Experiment 验证 → 上线。这个循环是 LLM 应用持续优化的核心方法论。
- **生产采样而非全量**：线上 Tracing 和在线评测不是越多越好——设置 LANGSMITH_SAMPLING_RATE=0.1 采样 10%，既保持统计意义又控制成本。
- **私有部署**：对于对数据安全有严格要求的企业，LangSmith 支持 [自托管部署](https://docs.smith.langchain.com/self_hosting/)，数据不出企业内网。

## 小结

LangSmith 补齐了 LLM 应用开发中最关键的一环——可观测性（Observability）与质量保障（Quality Assurance）。

五大核心能力的分工：

- **Tracing**：看清每一步调用，开发调试的显微镜
- **Evaluation**：量化输出质量，替代"人眼感觉"
- **Monitoring**：生产运行仪表盘，异常自动告警
- **Prompt Hub**：提示词的 Git 仓库，版本化管理
- **Datasets & Experiments**：数据驱动的 A/B 评测，科学迭代

从写第一行 LangChain 代码到上线后的长期运维，LangSmith 是贯穿始终的搭档工具。它不是锦上添花，而是 LLM 应用达到生产级质量的基础设施。

:::info 📖 相关资源
- [LangSmith 平台](https://smith.langchain.com/) - 登录并使用 LangSmith
- [LangSmith 官方文档](https://docs.smith.langchain.com/) - 完整功能文档与 API 参考
- [LangSmith Python SDK](https://pypi.org/project/langsmith/) - PyPI 包页面
- [LangSmith SDK GitHub](https://github.com/langchain-ai/langsmith-sdk) - 开源代码仓库
- [LangChain 集成文档](https://python.langchain.com/docs/langsmith/) - 在 LangChain 中使用 LangSmith 的指南
- [LangSmith Cookbook](https://github.com/langchain-ai/langsmith-cookbook) - 官方示例与最佳实践合集
- [API Key 设置](https://smith.langchain.com/settings) - 在平台上创建和管理 API Key
:::
