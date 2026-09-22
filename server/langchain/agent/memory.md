# 上下文与记忆

## 概要

[LangGraph Checkpoint](https://langchain-ai.github.io/langgraph/concepts/persistence/) 是 `create_agent` 管理持久化状态的核心机制。LLM 本身是**无状态**的——每次 API 调用都是一张白纸，不知道上一轮聊了什么、不记得用户是谁、也不清楚中间做过哪些工具调用。Memory 负责在多次对话间保存和传递**上下文**，让 Agent 拥有"连续对话"的能力。

按作用域，Memory 分为两层：
- **短期记忆**：checkpointer，会话内状态持久化
- **长期记忆**：Store，跨会话键值存储

## 一、短期记忆：Checkpointer 状态持久化

`create_agent` 的 `checkpointer` 参数接收 `BaseCheckpointSaver` 实例。LangGraph 提供三种实现，覆盖开发到生产的全场景。

### 1. 基于内存的持久化器: InMemorySaver

`InMemorySaver` 将状态保存在进程内存中。适合本地开发和原型验证：

```python{7,12}
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents import create_agent

agent = create_agent(
    model=model,
    tools=[get_weather, search],
    checkpointer=InMemorySaver(),  # 内存级持久化
    system_prompt="你是一个智能助手。",
)

# thread_id 隔离不同会话
config = {"configurable": {"thread_id": "session-1"}}

# 第 1 轮
result1 = agent.invoke(
    {"messages": [{"role": "user", "content": "北京天气如何？"}]},
    config=config,
)
print(result1["messages"][-1].content)  # 北京晴，22°C

# 第 2 轮——同一 thread_id，Agent 从 checkpoint 恢复全部上下文
result2 = agent.invoke(
    {"messages": [{"role": "user", "content": "那明天呢？"}]},
    config=config,
)
print(result2["messages"][-1].content)  # 理解"那"指的是北京
```

`InMemorySaver` 的限制：**进程退出，状态消失**。仅适合开发调试，不适合持久化场景。

### 2. 基于外部存储介质的持久化器

::: code-group
```python{3,8} [SqliteSaver]
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

agent = create_agent(
    model=model,
    tools=[...],
    checkpointer=checkpointer,
    system_prompt="...",
)
```

```python{4-7,12} [PostgresSaver]
# pip install langgraph-checkpoint-postgres
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:password@localhost:5432/agent_db"
)
checkpointer.setup()

agent = create_agent(
    model=model,
    tools=[...],
    checkpointer=checkpointer,
    system_prompt="...",
)
```
:::

| 持久化器 | 存储介质 | 重启保留 | 并发能力 | 适用场景 |
|----------|----------|----------|----------|----------|
| `InMemorySaver` | 进程内存 | 否 | 单线程 | 本地开发、原型验证 |
| `SqliteSaver` | SQLite 文件 | 是 | 单写入 | 单机小应用、边缘设备 |
| `PostgresSaver` | PostgreSQL | 是 | 高 | 生产环境、多实例部署 |

::: tip 选型建议
开发阶段用 `InMemorySaver` 快速迭代。需要持久化时，单机直接上 `SqliteSaver`（零运维成本），有多实例/高并发需求再切换到 `PostgresSaver`。
:::

### 3. 记忆治理策略

checkpointer 保存完整状态，但消息只增不减，多轮后 token 必然超出上下文窗口。

::: code-group
```python{11-18} [消息裁剪]
from langchain_core.messages import trim_messages, HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")

# 在模型调用前裁剪消息历史
def trim_history(state):
    """按 token 预算裁剪消息，保留最新内容。"""
    return {"messages": trim_messages(
        state["messages"],
        max_tokens=4000,               # Token 预算上限
        strategy="last",               # 保留最新的消息
        token_counter=model,           # 用模型做准确 token 计数
        include_system=True,           # SystemMessage 始终保留
        start_on="human",              # 裁剪后以 human 消息开头
    )}

agent = create_agent(
    model=model,
    tools=[...],
    checkpointer=InMemorySaver(),
    system_prompt="你是一个助手。",
)

config = {"configurable": {"thread_id": "session-1"}}
agent.invoke(
    {"messages": [HumanMessage(content="你好")]},
    config=config,
)
```

```python{9} [消息删除]
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_agent
from langchain_openai import ChatOpenAI

# 最简单的方式：只保留最近 N 条消息
def delete_old_messages(state):
    """裁剪消息列表，只保留最近 10 条。"""
    return {"messages": state["messages"][-10:]}

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=[...],
    checkpointer=InMemorySaver(),
    system_prompt="你是一个助手。",
)

config = {"configurable": {"thread_id": "session-1"}}
agent.invoke(
    {"messages": [HumanMessage(content="你好")]},
    config=config,
)
```

```python{13-16} [消息摘要]
from langchain.agents.middleware import SummarizationMiddleware
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")

agent = create_agent(
    model=model,
    tools=[...],
    checkpointer=InMemorySaver(),
    middleware=[
        SummarizationMiddleware(
            model=model,                    # 用于生成摘要的模型
            trigger_tokens=3000,            # 达到此 token 数时触发摘要
            keep_recent=4,                  # 保留最近 4 条消息原样不动
        ),
    ],
    system_prompt="你是一个助手。",
)

config = {"configurable": {"thread_id": "session-1"}}
agent.invoke(
    {"messages": [HumanMessage(content="你好")]},
    config=config,
)
```
:::

三种策略由简到繁：消息删除最简单粗暴，trim_messages 按 token 预算精修，SummarizationMiddleware 用摘要压缩旧消息。checkpointer 保留完整历史不受影响，可组合使用或只用其一。

## 二、长期记忆：Store 跨会话存储

checkpointer 解决了"同一会话内记住对话"的问题，但 **跨会话** 的知识共享需要另一种机制。LangGraph 的 ==Store API=={blue} 正是为此设计——它是一个带命名空间的键值存储，数据跨 `thread_id` 共享，适合存储用户偏好、事实积累、全局配置等需要长期保留的信息。

### 1. 基于内存的持久化器: InMemoryStore

Store 以 `(namespace, key)` 为索引组织数据。`namespace` 用元组表示层级关系（类似文件路径），`key` 是同一命名空间下的唯一标识：

```python{4,10}
from langgraph.store.memory import InMemoryStore

# 创建内存 Store
store = InMemoryStore()

agent = create_agent(
    model=model,
    tools=[...],
    checkpointer=InMemorySaver(),
    store=store,  # 注入 Store——Agent 可通过工具读写长期记忆
    system_prompt="你是一个个性化助手。",
)

# Agent 在工具中调用 store.put() 保存长期记忆
# store.put(
#     ("users", "user-123"),   # namespace 元组
#     "preferences",            # key
#     {"language": "zh", "theme": "dark"},  # value
# )

# 另一个 thread_id 读取同一份长期记忆
# prefs = store.get(("users", "user-123"), "preferences")
```

`InMemoryStore` 同样受限于进程生命周期——重启后数据丢失。适合原型开发和快速验证长期记忆的逻辑。

### 2. 基于外部存储介质的持久化器: PostgresStore

生产环境使用 `PostgresStore`（或 `AsyncPostgresStore`），数据持久化到 PostgreSQL：

```python{3,6,12}
from langgraph.store.postgres import AsyncPostgresStore

store = AsyncPostgresStore.from_conn_string(
    "postgresql://user:password@localhost:5432/agent_db"
)
await store.setup()  # 初始化表结构

agent = create_agent(
    model=model,
    tools=[...],
    checkpointer=PostgresSaver.from_conn_string(...),
    store=store,  # 跨会话的长期记忆持久化
    system_prompt="...",
)
```

::: tip 长期记忆的典型模式
- **用户偏好**：语言、主题、通知设置——一次设置，所有会话生效
- **事实积累**：Agent 在会话中提取的用户信息（姓名、角色、项目背景），存到 Store 供后续会话引用
- **知识片段**：Agent 搜索或推理得到的关键结论，写入 Store 避免重复查询

Store 不对数据做语义理解——它只是存和取。数据的结构化、索引、过期策略由你定义。
:::

## 小结

本章以 `create_agent` 的 checkpointer 为主线，串联了 Agent 记忆的完整体系：

- **checkpointer + thread_id** 是短期记忆的两个支点：前者决定"怎么存"，后者决定"存到哪"
- **InMemorySaver / SqliteSaver / PostgresSaver** 覆盖从开发到生产的全场景——按并发和持久化需求选型
- **trim_messages + SummarizationMiddleware** 构成记忆治理层——checkpointer 保存完整状态，治理策略控制传给模型的窗口
- **Store API** 是长期记忆的载体——跨 thread_id 共享，适合用户偏好、事实积累等需要跨会话保留的信息

从 checkpointer 到 Store，记忆从"会话内状态快照"扩展到"跨会话知识沉淀"。掌握了这条链路，后续 [中间件](/server/langchain/agent/middleware) 中的 SummarizationMiddleware 和 HumanInTheLoopMiddleware 就有了坚实的理解基础。

:::info 📖 相关资源
- [LangGraph Persistence 概念文档](https://langchain-ai.github.io/langgraph/concepts/persistence/) — checkpointer 与 Store 的核心架构
- [LangGraph Checkpoint API](https://langchain-ai.github.io/langgraph/reference/checkpoints/) — InMemorySaver / SqliteSaver / PostgresSaver 接口文档
- [LangGraph Store API](https://langchain-ai.github.io/langgraph/reference/store/) — InMemoryStore / PostgresStore 接口文档
- [trim_messages 使用指南](https://python.langchain.com/docs/how_to/trim_messages/) — 消息裁剪策略详解
- [create_agent API 参考](https://python.langchain.com/api_reference/langgraph/prebuilt/langgraph.prebuilt.chat_agent_executor.create_agent.html) — checkpointer、store、state_schema 参数说明
:::
