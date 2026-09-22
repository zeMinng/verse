# create_agent 中间件

## 概要

`create_agent` 的 [middleware](https://docs.langchain.com/oss/python/langchain/middleware/overview) 参数是 Agent 执行循环的**拦截器体系**——在模型调用前后、工具执行前后插入自定义逻辑，不改 prompt 也不改工具代码。日志记录、Token 预算控制、敏感信息过滤、人工审批、任务拆解……这些横切关注点全部收敛到 middleware 列表中，与业务逻辑彻底解耦。LangChain 内置了十余种预置中间件，也可以通过 `AgentMiddleware` 基类或装饰器编写自定义中间件，并通过 `can_jump_to` 声明条件跳转能力。本文按 常用内置中间件 → 其他内置中间件 → 组合与执行顺序 → 自定义中间件 递进展开。

## 一、常用内置中间件

LangChain 在 `langchain.agents.middleware` 下提供了一批开箱即用的中间件。以下四种覆盖了生产环境最常见的横切需求。

### 1. SummarizationMiddleware — 对话摘要

长对话的 Token 消耗随消息数线性增长。==SummarizationMiddleware== 在上下文接近模型窗口上限时自动将历史对话压缩为摘要，保留最近 N 条消息不动，旧消息替换为摘要文本：

```python{6,12-19}
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """搜索知识库。"""
    return f"关于'{query}'的结果..."

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[search],
    middleware=[
        SummarizationMiddleware(
            model=ChatOpenAI(model="gpt-4o-mini"),  # 用便宜模型做摘要
            trigger=("tokens", 4000),                # Token 数达 4000 时触发
            keep=("messages", 20),                   # 保留最近 20 条消息
        ),
    ],
)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `model` | `str \| BaseChatModel` | **必填** | 执行摘要的模型，建议用便宜的轻量模型 |
| `trigger` | `ContextSize \| list` | `None` | 触发条件，支持 `("tokens", N)` / `("messages", N)` / `("fraction", f)`，传列表为 OR 关系 |
| `keep` | `ContextSize` | `("messages", 20)` | 摘要后保留多少最近上下文不压缩 |
| `summary_prompt` | `str` | 内置默认值 | 自定义摘要提示词，需含 `{messages}` 占位符 |

**trigger 的高级用法**——列表实现 OR，字典实现 AND，列表套字典混合：

```python
# OR 逻辑：任一条件满足即触发
trigger=[("tokens", 3000), ("messages", 6)]

# AND 逻辑：必须同时满足（tokens>=5000 且 messages>=3）
trigger={"tokens": 5000, "messages": 3}

# 混合：(A AND B) OR (C AND D)
trigger=[{"tokens": 5000, "messages": 3}, {"tokens": 3000, "messages": 6}]
```

::: warning
`trigger` 只计算 `state["messages"]` 中的消息 Token——**不包含** system prompt 和工具 Schema 的开销。因此触发值要留足余量，建议设在模型上限的 70%~80%。
:::

### 2. HumanInTheLoopMiddleware — 人工审批

==HumanInTheLoopMiddleware== 在敏感工具执行前暂停 Agent，等待人工批准、修改或拒绝。文件删除、邮件发送、数据库写入等不可逆操作的标准安全护栏：

```python{4,12-22}
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import MemorySaver

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[send_email, delete_file, read_file],
    middleware=[
        HumanInTheLoopMiddleware(
            interrupt_on={
                "send_email": {
                    "allowed_decisions": ["approve", "edit", "reject"],
                },
                "delete_file": {
                    "allowed_decisions": ["approve", "reject"],
                },
                # 未列出的工具（如 read_file）自动放行
            },
        ),
    ],
    checkpointer=MemorySaver(),  # HITL 必须配 checkpointer
)
```

| 决策类型 | 效果 |
|----------|------|
| `approve` | 用 Agent 填写的原始参数执行工具 |
| `edit` | 人工修改参数后再执行 |
| `reject` | 跳过执行，返回拒绝理由给 Agent |
| `respond` | 直接用人工回复作为工具结果（"问用户"模式） |

**条件拦截 `when` 谓词**——不是每次都拦，只在参数命中特定条件时暂停：

```python{4-9}
def writes_outside_workspace(request) -> bool:
    """仅拦截写入工作区外的操作。"""
    path = request.tool_call["args"].get("file_path", "")
    return not path.startswith("/workspace/")

HumanInTheLoopMiddleware(interrupt_on={
    "write_file": {
        "allowed_decisions": ["approve", "reject"],
        "when": writes_outside_workspace,    # 工作区内直接放行
    },
})
```

Agent 暂停后，通过 `Command(resume=...)` 提供决策并继续执行：

```python
from langgraph.types import Command

# 批准 → 按原始参数执行
agent.invoke(
    Command(resume={"decisions": [{"type": "approve"}]}),
    config={"configurable": {"thread_id": "user-session-1"}},
)

# 修改参数后执行
agent.invoke(Command(resume={
    "decisions": [{
        "type": "edit",
        "edited_action": {"name": "send_email", "args": {"to": "admin@corp.com"}},
    }]
}), config={"configurable": {"thread_id": "user-session-1"}})

# 拒绝
agent.invoke(Command(resume={
    "decisions": [{"type": "reject", "message": "不允许向外部邮箱发信"}]
}), config={"configurable": {"thread_id": "user-session-1"}})
```

::: warning
`checkpointer` 和 `thread_id` 是 HITL 的硬性前提——没有 checkpointer，中断后的状态无法持久化，恢复执行会丢失上下文。
:::

### 3. PIIMiddleware — 敏感信息检测

==PIIMiddleware== 在消息进入模型**之前**扫描并处理个人敏感信息，支持脱敏、遮罩、哈希、阻断四种策略：

```python{3,11-24}
from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[customer_lookup],
    middleware=[
        PIIMiddleware(
            built_in_types={
                "credit_card": "redact",     # 信用卡号 → 替换为 [REDACTED]
                "email": "mask",             # 邮箱 → u***@domain.com
                "phone": "hash",             # 手机 → SHA-256 哈希
                "ip": "redact",              # IP → [REDACTED]
            },
            custom_patterns={
                r"\b[A-Z]{2}\d{6}\b": "block",  # 自定义规则：工号格式 → 阻断请求
            },
        ),
    ],
)
```

| 策略 | 效果 | 适用场景 |
|------|------|----------|
| `redact` | 替换为 `[REDACTED]` | 完全不需要原始值的场景 |
| `mask` | 部分遮盖（`u***@domain.com`） | 需要保留部分格式信息的场景 |
| `hash` | 单向哈希替换 | 需要去重但不可逆的场景 |
| `block` | 拒绝请求，抛异常 | 严重违规，不允许继续执行 |

PIIMiddleware 工作在 `before_model` 阶段——消息在**发送给 LLM 之前**已经完成脱敏，模型根本看不到原始敏感信息。

### 4. TodoListMiddleware — 任务规划

==TodoListMiddleware== 为 Agent 注入 `write_todos` 工具，让模型在处理复杂任务时先拆解步骤、再逐步执行，完成时更新状态：

```python{3,9-12}
from langchain.agents import create_agent
from langchain.agents.middleware import TodoListMiddleware

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[search, calculator],
    middleware=[
        TodoListMiddleware(
            system_prompt=(
                "拆分任务时确保每一步都可独立完成。"
                "每完成一步立即更新状态。"
            ),
        ),
    ],
)
```

Todo 结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| `content` | `str` | 任务描述 |
| `status` | `"pending" \| "in_progress" \| "completed"` | 当前状态 |

::: tip
`write_todos` 是**全量替换**语义——每次调用覆盖整个 Todo 列表，不能增量追加。模型在同一轮内不应并行调用多次 `write_todos`，否则可能出现状态竞争。
:::

## 二、其他内置中间件

除上述四种外，LangChain 还提供以下内置中间件，按用途分为四类：

| 类别 | 中间件 | 用途 |
|------|--------|------|
| **成本控制** | `ModelCallLimitMiddleware` | 限制模型调用次数，防无限循环 |
| | `ToolCallLimitMiddleware` | 限制工具调用次数（全局或按工具） |
| **容错与重试** | `ModelRetryMiddleware` | 模型调用失败自动重试 + 指数退避 |
| | `ToolRetryMiddleware` | 工具调用失败自动重试 + 指数退避 |
| | `ModelFallbackMiddleware` | 主模型失败时自动切换备用模型 |
| **上下文优化** | `LLMToolSelectorMiddleware` | 用轻量 LLM 预选相关工具，减少主模型 Token 消耗 |
| | `ContextEditingMiddleware` | 修剪或清理旧的工具调用输出 |
| **测试与模拟** | `LLMToolEmulator` | 用 LLM 模拟工具返回，方便开发调试 |

全部从 `langchain.agents.middleware` 直接导入，用法与第一节四种完全一致——实例化后放入 `middleware=[]` 列表即可。

## 三、多个中间件组合及执行顺序

### 1. 列表顺序决定包装层级

`create_agent(middleware=[A, B, C])` 中**列表顺序 = 包装层级**：A 是最外层，C 是最内层。不同钩子类型的执行方向完全不同：

```text
create_agent(model=..., middleware=[A, B, C])

before_* 钩子（正序）:
  A.before_model → B.before_model → C.before_model
          │              │              │
          ▼              ▼              ▼
  ┌─────────────────────────────────────────┐
  │  A.wrap_model_call                      │
  │    └─ B.wrap_model_call                 │
  │         └─ C.wrap_model_call            │
  │              └─ 实际模型调用             │  ← 洋葱嵌套
  │         ──────────────────────────      │
  │              ──────────────────────      │
  │  ──────────────────────────────────      │
  └─────────────────────────────────────────┘
          │              │              │
          ▼              ▼              ▼
after_* 钩子（逆序）:
  C.after_model → B.after_model → A.after_model
```

- **before_\*** 钩子按列表**正序**执行（A → B → C），适合逐层做前置检查
- **wrap_\*** 钩子按列表**洋葱嵌套**（A 包 B 包 C），最外层有最高控制权——A 可以短路跳过 B、C 和模型调用
- **after_\*** 钩子按列表**逆序**执行（C → B → A），与 before 对称，内层先收尾

### 2. 组合实战：限流 + 摘要 + 审批

三者组合，按**容错在前、业务在中、安全在里**的层次排列：

```python{4-20}
agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[send_email, search],
    middleware=[
        # ① 最外层：重试——所有操作的最后兜底
        ModelRetryMiddleware(stop_after_attempt=3),

        # ② 中层：摘要——长对话自动压缩
        SummarizationMiddleware(
            model=ChatOpenAI(model="gpt-4o-mini"),
            trigger=("tokens", 6000),
            keep=("messages", 20),
        ),

        # ③ 最内层：人工审批——在工具实际执行前拦截
        HumanInTheLoopMiddleware(
            interrupt_on={"send_email": {"allowed_decisions": ["approve", "reject"]}},
        ),
    ],
    checkpointer=MemorySaver(),
)
```

执行流：请求进入时**重试包裹**首先生效 → 触发模型调用前**摘要检查** Token 数 → 模型返回工具调用后**审批拦截** → 审批通过才真正执行工具。三层职责分明，互不耦合——去掉任何一个，其余照常工作。

## 四、自定义中间件

内置中间件覆盖不了所有场景时，通过钩子函数或 `AgentMiddleware` 子类实现定制逻辑。

### 1. 钩子分类：节点风格 vs 包装风格

中间件提供**两种风格**的钩子，选型取决于你需要"观察"还是"控制"：

| 类型 | 钩子 | 触发频率 | 能做什么 | 不能做什么 |
|------|------|----------|----------|------------|
| **节点** | before_agent | 每次调用 1 次 | 初始化、注入消息到 state | 阻止调用 |
| | before_model | 每轮 1 次 | 检查 state、记录日志、`jump_to` | 重试、修改请求 |
| | after_model | 每轮 1 次 | 检查输出、记录日志、`jump_to` | 修改响应 |
| | after_agent | 每次调用 1 次 | 清理、统计、通知 | — |
| **包装** | wrap_model_call | 每轮 1 次 | 短路调用、重试、修改请求/响应 | — |
| | wrap_tool_call | 每次工具调用 1 次 | 短路工具、修改参数、注入结果 | — |

节点风格返回 `dict | None`（修改 state 就返回 dict，不修改就返回 None）。包装风格通过 `handler(request)` 控制执行 0 次（短路）、1 次（正常）或 N 次（重试）。

### 2. 节点风格钩子

节点风格钩子——`before_agent` / `before_model` / `after_model` / `after_agent`——在固定时间点顺序触发。以下用同一个场景对比两种实现：**记录消息数 + 限制调用次数**。

::: code-group
```python{6-11,14-23,26-28} [装饰器]
from langchain.agents.middleware import before_model, after_model
from langchain.agents.middleware.types import AgentState
from langgraph.runtime import Runtime
from typing import Any

@before_model
def log_and_limit(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """调用前：记录消息数，超限时短路。"""
    count = len(state["messages"])
    print(f"[model] 第 {count} 条消息")
    if count > 50:
        from langchain_core.messages import AIMessage
        return {
            "messages": [AIMessage("对话过长，已终止。")],
            "jump_to": "end",
        }
    return None

@after_model
def log_result(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """调用后：打印回复摘要。"""
    last = state["messages"][-1]
    print(f"[model] 回复前 60 字: {str(last.content)[:60]}")
    return None

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[...],
    middleware=[log_and_limit, log_result],  # 函数直接传入
)
```

```python{9-18,22-25} [类实现]
from langchain.agents.middleware import AgentMiddleware
from langchain.agents.middleware.types import AgentState
from langgraph.runtime import Runtime
from typing import Any

class BudgetMiddleware(AgentMiddleware):
    """限制模型调用次数，超出预算强制终止。"""

    def __init__(self, max_calls: int = 10):
        super().__init__()
        self.max_calls = max_calls
        self._count = 0                         # 实例属性，跨钩子共享

    def before_model(
        self, state: AgentState, runtime: Runtime
    ) -> dict[str, Any] | None:
        self._count += 1
        if self._count > self.max_calls:
            from langchain_core.messages import AIMessage
            return {
                "messages": [AIMessage("已达到最大调用次数。")],
                "jump_to": "end",
            }
        print(f"[Budget] 第{self._count}/{self.max_calls}次调用")
        return None

    def after_agent(
        self, state: AgentState, runtime: Runtime
    ) -> dict[str, Any] | None:
        print(f"[Budget] 本次共调用模型 {self._count} 次")
        return None

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[...],
    middleware=[BudgetMiddleware(max_calls=5)],
)
```
:::

装饰器干净利落——一个钩子一个函数，粒度最细。代价是 `@before_model` 和 `@after_model` 是两个独立函数，共享计数器只能靠闭包。类的核心价值恰好在这里：多个钩子放在同一类体中，`self._count` 在 `before_model` 和 `after_agent` 之间自然流通。

### 3. 包装风格钩子

包装风格钩子——`wrap_model_call` / `wrap_tool_call`——**包裹**实际的模型或工具调用，拿到 `handler` 后可以决定不调用（短路）、调一次（正常）、调多次（重试）。

::: code-group
```python{4,9-18} [装饰器]
from langchain.agents.middleware import wrap_model_call
from langchain.agents.middleware.types import ModelRequest, ModelResponse

@wrap_model_call
def retry_on_error(
    request: ModelRequest,
    handler: callable,
) -> ModelResponse:
    """异常时自动重试最多 3 次。"""
    for attempt in range(3):
        try:
            return handler(request)             # handler(request) 触发真实调用
        except Exception as e:
            if attempt == 2:                    # 最后一次仍失败 → 抛出
                raise
            print(f"[retry] 第{attempt + 1}次重试: {e}")

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[...],
    middleware=[retry_on_error],                # 装饰器函数直接传入
)
```

```python{3,8-11,16-21} [类实现]
from langchain.agents.middleware import AgentMiddleware
from langchain.agents.middleware.types import ModelRequest, ModelResponse

class AdaptiveRetryMiddleware(AgentMiddleware):
    """根据剩余预算动态调整重试次数。"""

    def __init__(self, max_retries: int = 3):
        super().__init__()
        self.max_retries = max_retries
        self._budget = max_retries              # 全局预算，跨调用递减

    def wrap_model_call(
        self, request: ModelRequest, handler: callable
    ) -> ModelResponse:
        for attempt in range(self._budget + 1):
            try:
                result = handler(request)
                return result                   # 成功则恢复正常预算
            except Exception as e:
                self._budget -= 1
                if attempt >= self._budget:
                    raise
                print(f"[retry] 剩余预算 {self._budget}: {e}")

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[...],
    middleware=[AdaptiveRetryMiddleware(max_retries=5)],
)
```
:::

`handler(request)` 是关键的"控制杆"——不调用就是短路，调 N 次就是重试 N 次。装饰器版本适合单一职责：固定次数重试，简洁直接。类版本适合需要**实例记忆**的场景：`self._budget` 跨多轮调用递减，第一次把预算耗光后后续调用不再重试。这是类实现的核心价值——**钩子间共享状态 + 初始化参数**。

**节点 vs 包装 + 装饰器 vs 类**的选型速查：

| 场景 | 推荐方式 |
|------|----------|
| 单钩子、无状态（日志、校验） | 装饰器（节点或包装均可） |
| 单钩子、需要短路/重试 | `@wrap_model_call` 装饰器 |
| 多钩子共享状态（计数器、连接） | 类 + 节点风格钩子 |
| 需要初始化参数 + 运行时状态 | 类（节点或包装均可） |

### 4. can_jump_to — 条件跳转

`can_jump_to` 声明钩子**有权跳转到哪些目标节点**。不声明则钩子不能使用 `jump_to`。可跳转目标：

| 目标 | 含义 |
|------|------|
| `"end"` | 跳过剩余所有步骤，直接走 `after_agent` → 结束 |
| `"tools"` | 跳过模型调用，直接进入工具执行阶段 |
| `"model"` | 跳过工具执行，直接回到模型推理 |

**装饰器声明**——在 `@before_model` / `@after_model` 中传入参数：

```python{3-11}
from langchain_core.messages import AIMessage

@before_model(can_jump_to=["end"])
def enforce_message_limit(state: AgentState, runtime: Runtime) -> dict | None:
    """消息数超限直接终止。"""
    if len(state["messages"]) > 50:
        return {
            "messages": [AIMessage("对话已达上限，请重新开始。")],
            "jump_to": "end",
        }
    return None
```

**类声明**——通过 `hook_config` 装饰器标记方法：

```python{4-12}
from langchain.agents.middleware import AgentMiddleware, hook_config

class RoutingMiddleware(AgentMiddleware):
    @hook_config(can_jump_to=["tools", "end"])
    def after_model(self, state, runtime) -> dict | None:
        """模型回复为空时短路到 end，要求补充信息时跳到 tools。"""
        last_msg = state["messages"][-1]
        if not last_msg.content.strip():
            return {"jump_to": "end"}         # 空回复直接结束
        if last_msg.tool_calls:
            return None                        # 有工具调用，正常执行
        return None
```

::: warning
`jump_to` 跳过的钩子**不会执行**。例如 `before_model` 中 `jump_to="end"` 后，本轮 `wrap_model_call`、模型调用、`after_model` 全部跳过，直接走 `after_agent`。这在提前终止场景下是高价值的优化，但要注意**after_agent 仍需处理被跳过的中间状态**。
:::

## 小结

create_agent 的 middleware 是 Agent 的插件系统——在"推理→调用工具→回传→再推理"的循环中嵌入七个标准钩子点，通过**装饰器或类**实现自定义逻辑，按**列表顺序控制执行层级**。

- **四种常用内置中间件**：Summarization 管 Token 预算、HITL 管安全审批、PII 管敏感数据、TodoList 管任务拆解——覆盖了长对话、高风险操作、合规和复杂任务四大痛点
- **其他内置中间件**按成本控制 / 容错重试 / 上下文优化 / 测试模拟四类归类，按需取用
- **组合时**列表顺序决定包装层级，before 正序、after 逆序、wrap 洋葱嵌套——理解这三者才能排出正确顺序
- **自定义中间件**分节点风格（观察）和包装风格（控制），装饰器适合简单单钩子、类适合有状态的复杂场景，`can_jump_to` 赋予钩子条件跳转能力

掌握了 middleware，就不需要为了加一行日志去改 prompt，也不需要为了加审批去改工具代码。Agent 只管"做什么"，中间件只管"怎么做"。

:::info 📖 相关资源
- [LangChain Middleware 概览](https://docs.langchain.com/oss/python/langchain/middleware/overview) — 官方中间件体系介绍
- [自定义中间件文档](https://docs.langchain.com/oss/python/langchain/middleware/custom) — 装饰器与类实现的完整指南
- [内置中间件文档](https://docs.langchain.com/oss/python/langchain/middleware/built-in) — 所有预置中间件参数说明
- [create_agent API 参考](https://python.langchain.com/api_reference/langgraph/agents/langchain.agents.create_agent.html) — middleware 参数签名
- [AgentMiddleware API](https://reference.langchain.com/python/langchain/agents/middleware/types/AgentMiddleware) — 基类与钩子方法 API
- [HumanInTheLoopMiddleware API](https://reference.langchain.com/python/langchain/agents/middleware/human_in_the_loop/HumanInTheLoopMiddleware) — HITL 完整参数配置
- [SummarizationMiddleware API](https://reference.langchain.com/python/langchain/agents/middleware/summarization/SummarizationMiddleware) — 摘要中间件参数
- [LangChain Blog: How Middleware Lets You Customize Your Agent Harness](https://www.langchain.com/blog/how-middleware-lets-you-customize-your-agent-harness) — 设计思路与理念
:::
