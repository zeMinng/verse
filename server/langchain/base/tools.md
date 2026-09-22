# LangChain Tools 工具

## 概要

[Tool Calling](https://python.langchain.com/docs/concepts/tool_calling/) 让模型不再是封闭的文本生成器——它主动调用外部函数获取数据、执行操作。核心是一个**消息驱动的四阶段循环**：模型决定调用哪个工具 → 代码执行工具 → 结果回传模型 → 模型融合结果生成回复。这个循环是 ==Agent== 自主决策的基础——Agent 不过是在此之上加了一个"是否继续调用"的控制流。

## 一、工具调用的整体流程

::: code-group
```python{6-7,12,16,21-22,24} [完整代码]
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI

# ① 定义工具
@tool
def get_weather(location: str) -> str:
    """获取指定城市的天气。"""
    return f"{location} 晴，22°C"

# ② 绑定工具
model = ChatOpenAI(model="gpt-4o-mini").bind_tools([get_weather])

# ③ 模型决策
messages = [HumanMessage(content="东京现在天气怎么样？")]
response = model.invoke(messages)
messages.append(response)

# ④ 执行 → 回传 → 再次推理
for tc in response.tool_calls:
    result = get_weather.invoke(tc["args"])
    messages.append(ToolMessage(content=result, tool_call_id=tc["id"]))

final = model.invoke(messages)
```

```text [流程示意]
用户提问
  │
  ▼
┌──────────────────────────────────────────────┐
│  阶段 ① 模型决策                              │
│  model.invoke(messages) → AIMessage           │
│  检查 response.tool_calls 是否为空             │
│  非空 → 模型决定调用工具，进入 ②               │
│  为空 → 直接返回文本回答，流程结束              │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  阶段 ② 执行工具                              │
│  遍历 tool_calls，匹配工具名 → tool.invoke()   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  阶段 ③ 回传结果                              │
│  将每个结果包装为 ToolMessage                  │
│  tool_call_id 必须与 ToolCall.id 一一对应       │
│  追加到 messages 历史中                        │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  阶段 ④ 模型总结                              │
│  model.invoke(messages) → 最终 AIMessage      │
│  模型根据 ToolMessage 内容生成自然语言回复       │
│  如果还需要更多工具 → 回到 ②                   │
└──────────────────────────────────────────────┘
```
:::

::: warning
`ToolMessage.tool_call_id` 必须与对应 `ToolCall.id` 完全匹配。ID 对不上，模型认为调用结果丢失，引发重复调用或幻觉。
:::

四类消息在循环中的角色：

| 消息类型 | 方向 | 作用 |
|----------|------|------|
| HumanMessage | 用户 → 模型 | 发起对话 |
| AIMessage (tool_calls) | 模型 → 代码 | 模型决定调用哪些工具，携带函数名和参数 |
| ToolMessage | 代码 → 模型 | 工具执行结果，通过 `tool_call_id` 关联 |
| AIMessage (纯文本) | 模型 → 用户 | 融合工具结果后的最终回复 |

## 二、工具的定义方式

工具就是 Python 函数 + `@tool` 装饰器。装饰器自动提取函数名 → `name`、docstring → `description`、类型注解 → `args_schema`，生成模型能理解的 Tool 对象。**docstring 是必填项**——没有它，模型不知道这工具是干什么的，调用时机全凭猜。

```python
from langchain_core.tools import tool

@tool
def get_weather(location: str) -> str:
    """获取指定城市的天气信息。"""
    return f"{location}: 晴，22°C"
```

类型注解够用就别加 `args_schema`。只有需要字段描述、枚举约束、范围校验时才升级到以下方案：

::: code-group
```python [Pydantic 模型]
from pydantic import BaseModel, Field
from typing import Literal

class WeatherInput(BaseModel):
    location: str = Field(description="城市名称或坐标")
    units: Literal["celsius", "fahrenheit"] = Field(default="celsius")

@tool(args_schema=WeatherInput)
def get_weather(location: str, units: str = "celsius") -> str:
    """查询天气。"""
    ...
```

```python [Annotated + Field]
from typing import Annotated
from pydantic import Field

@tool
def search_docs(
    query: Annotated[str, Field(description="搜索关键词")],
    max_results: Annotated[int, Field(ge=1, le=20)] = 5
) -> str:
    """搜索内部文档库。"""
    ...
```

```python [JSON Schema]
@tool(args_schema={
    "type": "object",
    "properties": {
        "location": {"type": "string", "description": "城市名称"},
        "units": {"type": "string", "enum": ["celsius", "fahrenheit"]}
    },
    "required": ["location"]
})
def get_weather(location: str, units: str = "celsius") -> str:
    """查询天气。"""
    ...
```

```python [Google-style docstring]
@tool(parse_docstring=True)
def get_weather(location: str, units: str = "celsius") -> str:
    """查询指定城市的天气。

    Args:
        location: 城市名称或坐标。
        units: 温度单位，celsius 或 fahrenheit。
    """
    ...
```
:::

| 方式 | 适用场景 |
|------|----------|
| 类型注解 + docstring | 参数简单，无需约束——**默认首选** |
| `Annotated` + `Field` | 需要字段描述 + 简单校验，不想单独建类 |
| `parse_docstring=True` | 团队习惯 Google 风格注释 |
| `args_schema` + Pydantic | 枚举、范围校验等复杂约束 |
| `args_schema` + JSON Schema | 跨语言复用、动态生成 Schema |

## 三、tool_choice 参数

`tool_choice` 控制模型调用工具的强制性——让模型自主决策，还是强制/禁止调用：

| 值 | 行为 | 适用场景 |
|----|------|----------|
| auto（默认） | 模型自主决定 | 工具为可选辅助，日常对话 |
| any | 必须调用至少一个 | 需要外部数据才能回答的问题 |
| `<tool_name>` | 强制调用指定工具 | 多工具路由，已知该走哪个 |
| none | 禁止调用任何工具 | 闲聊、总结等纯语言任务 |

::: code-group
```python [auto]
model.bind_tools([get_weather, calculate])  # 默认，模型自主判断
```

```python [any]
model.bind_tools([get_weather, calculate], tool_choice="any")  # 必须调用
```

```python [指定工具]
model.bind_tools([get_weather, calculate], tool_choice="get_weather")  # 强制走指定工具
```

```python [none]
model.bind_tools([get_weather, calculate], tool_choice="none")  # 纯文本，禁止调用
```
:::

`"auto"` 和 `"any"` 的差异在闲聊场景下最明显——用户只是打招呼，但 `"any"` 会强制模型"找点事做"：

```python
# auto：闲聊不触发工具调用
model = ChatOpenAI(model="gpt-4o-mini").bind_tools([get_weather])  # 默认 auto
response = model.invoke([HumanMessage(content="你好，今天过得怎么样？")])
# AIMessage 纯文本回复，tool_calls 为空

# any：即使不需要也强行调用
model = ChatOpenAI(model="gpt-4o-mini").bind_tools([get_weather], tool_choice="any")
response = model.invoke([HumanMessage(content="你好，今天过得怎么样？")])
# AIMessage.tool_calls 非空——模型被迫调用了 get_weather
```

::: warning
`"any"` 和指定工具名时，工具列表不能为空——无工具可调，调用直接失败。
:::

::: tip
- 需要外部数据才能回答（天气、搜索、计算）→ `"any"` 确保信息准确
- 多工具场景已知路由目标 → 直接指定工具名，避免模型选错
- 闲聊、总结、翻译 → `"none"` 屏蔽工具，节省 Token
:::

## 小结

工具调用的本质是 ==消息驱动的循环==：模型输出 ToolCall → 代码执行 → ToolMessage 回传 → 模型再次推理。这个循环往上加一层"判断是否需要继续调用"的控制流，就是 Agent；往模型输出上加一层结构化约束（Pydantic / JSON Schema），就是[结构化输出](/server/langchain/base/structured-output)。两者结合——`prompt | model.bind_tools(...) | ...`——是 LangChain 最核心的组装模式。

::: info 📖 相关资源
- [Tool Calling 概念文档](https://python.langchain.com/docs/concepts/tool_calling/) — 官方概念说明
- [LangChain Tools 文档](https://python.langchain.com/docs/concepts/tools/) — 工具定义与使用
- [LangChain Messages API](https://python.langchain.com/api_reference/core/messages/langchain_core.messages.BaseMessage.html) — 消息系统 API
:::
