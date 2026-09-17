# 创建 Agent

## 概要

[create_agent](https://python.langchain.com/api_reference/langgraph/agents/langchain.agents.create_agent.html) 把 [Tool Calling](/server/langchain/base/tools) 的四阶段循环封装为一个函数调用。你只需提供模型和工具列表，Agent 自动完成"推理 → 调用工具 → 回传结果 → 再次推理"的循环，直到产出最终回复。Agent 的本质就是 ==消息驱动循环 + 自主决策==。

## 一、基础用法

`create_agent` 最简形式只需两个参数：**model**（推理引擎）和 **tools**（可用工具列表）。完整参数还包括 `system_prompt`（角色设定）、`name`（Agent 标识名称）和 `response_format`（结构化输出）。

::: code-group
```python{20-30,33-35} [完整示例]
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

# ① 定义模型
model = ChatOpenAI(model="gpt-4o-mini")

# ② 定义工具
@tool
def get_weather(location: str) -> str:
    """获取指定城市的天气信息。"""
    return f"{location}: 晴，22°C"

@tool
def calculate(expression: str) -> str:
    """执行数学计算，支持四则运算。"""
    return str(eval(expression))

# ③ 创建 Agent
agent = create_agent(
    model=model,                           # 推理引擎
    tools=[get_weather, calculate],        # 绑定工具
    system_prompt="你是一个乐于助人的助手。",    # 系统提示词
    name="weather_assistant",              # Agent 标识（多 Agent 系统用作节点名）
    response_format=ToolStrategy(
        schema=Union[WeatherResult, CalcResult], # 多schema联合模式
        handle_errors=True,
        tool_message_content="已成功抽取信息",
    ) # 结构化输出
)

# ④ 执行
result = agent.invoke({
    "messages": [{"role": "user", "content": "深圳人口是上海人口的几倍？"}]
})
```

```python{7,14-16} [系统提示词]
from langchain_core.messages import SystemMessage

# 方式一：直接传字符串——最简形式，内部自动包装为 SystemMessage
agent = create_agent(
    model=model,
    tools=[get_weather, calculate],
    system_prompt="你是一个专业的数据助手。优先使用工具获取数据，回答简洁。"
)

# 方式二：传 SystemMessage 对象——可携带 name 等额外元数据
agent = create_agent(
    model=model,
    tools=[get_weather, calculate],
    system_prompt=SystemMessage(
        content="你是一个专业的数据助手。优先使用工具获取数据，回答简洁。",
        name="DataAssistant"
    )
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "北京天气怎么样？"}]
})
```

```python{2-5,18,24,30} [结构化输出]
from pydantic import BaseModel, Field
from langchain.agents.structured_output import (
    AutoStrategy,      # 自动选择 → 根据模型能力选 Provider 或 Tool
    ProviderStrategy,  # 提供者原生 → 调用模型原生 JSON Schema API
    ToolStrategy,      # 工具模拟 → 生成虚拟工具，通过 tool_call 返回结构化数据
)

# 定义输出 Schema
class WeatherResult(BaseModel):
    """天气查询的结构化结果"""
    location: str = Field(description="城市名称")
    temperature: str = Field(description="天气与温度描述")
    suggestion: str = Field(description="出行建议")

# ① AutoStrategy：自动选择最佳策略（传裸 Schema 等效）
agent = create_agent(
    model=model, tools=[get_weather],
    response_format=AutoStrategy(WeatherResult)
)

# ② ProviderStrategy：强制使用模型原生 API，支持 strict 模式
agent = create_agent(
    model=model, tools=[get_weather],
    response_format=ProviderStrategy(WeatherResult, strict=True)
)

# ③ ToolStrategy：通过虚拟工具调用实现，支持错误重试与 Union 类型
agent = create_agent(
    model=model, tools=[get_weather],
    response_format=ToolStrategy(WeatherResult, handle_errors=True)
)

# ④ None：不设置 response_format（默认），Agent 输出自由文本
agent = create_agent(model=model, tools=[get_weather])

# 结构化结果统一从 result["structured_response"] 获取
result = agent.invoke({
    "messages": [{"role": "user", "content": "北京今天天气怎么样？"}],
})
print(result["structured_response"])
```
:::

### 1. Agent 执行流程

`agent.invoke()` 内部自动完成循环：

::: code-group
```text [流程示意]
① 模型推理当前消息 → 决定是否调用工具
② 如需调用 → 执行工具 → ToolMessage 回传
③ 模型再次推理 → 继续调用其他工具或直接回复
④ 循环直到模型输出最终文本 → 返回完整消息列表
```

```python{4-8} [等效的手动循环]
# agent.invoke() 内部等价于以下逻辑
messages = [SystemMessage(system_prompt), HumanMessage(user_input)]

while True:
    response = model_with_tools.invoke(messages)
    messages.append(response)
    if not response.tool_calls:     # 无工具调用 → 任务完成
        break
    for tc in response.tool_calls:
        result = tool_map[tc["name"]].invoke(tc["args"])
        messages.append(ToolMessage(content=result, tool_call_id=tc["id"]))
```
:::

对比 [Tools 工具](/server/langchain/base/tools) 中手动编写四阶段流程，`create_agent` 接管了循环控制、工具匹配、消息追加——你只关心"有哪些工具"和"要做什么"。

### 2. 使用内置工具

LangChain 生态提供大量开箱即用的内置工具，直接导入配置即可：

```python{7-9,12}
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.tools.wikipedia import WikipediaQueryRun
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper

search = TavilySearchResults(max_results=2)
wiki = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

agent = create_agent(model=ChatOpenAI(model="gpt-4o-mini"), tools=[search, wiki])
result = agent.invoke({
    "messages": [{"role": "user", "content": "量子计算最新进展有哪些？"}]
})
```

`TavilySearchResults` 需设置环境变量 `TAVILY_API_KEY`（[免费获取](https://tavily.com/)）。内置工具与 `@tool` 用法完全一致——Agent 根据 description 自动判断调用时机。

## 二、system_prompt 配置

`system_prompt` 决定 Agent 的行为风格、工具使用策略和回答边界：

::: code-group
```python [基础设定]
agent = create_agent(
    model=model, tools=[get_weather, calculate],
    system_prompt="你是一个气象助手。优先使用工具获取实时数据，不要凭空猜测。"
)
```

```python{4-10} [精细控制]
agent = create_agent(
    model=model, tools=[search_docs, get_weather, calculate],
    system_prompt="""
你是一个数据助手，遵循以下规则：

1. 优先使用 search_docs 查询内部知识库
2. 需要实时数据时使用 get_weather
3. 涉及数学计算使用 calculate，不要口算
4. 所有工具都不适用时，用自己的知识回答
5. 回答简洁，不超过三句话
"""
)
```
:::

::: tip 使用建议
- 写清楚工具的**调用时机和优先级**，减少模型试错
- 设定**行为边界**——什么能做、什么不能做（如"不要编造数据"）
- 控制**输出风格**——简洁/详细、专业/通俗
:::

## 三、执行与结果解析

### 1. invoke：同步执行

`invoke()` 返回包含完整消息历史的字典，最终回复在 `result["messages"][-1]`：

```python
# 单轮
result = agent.invoke({
    "messages": [{"role": "user", "content": "北京天气如何？"}]
})
print(result["messages"][-1].content)

# 多轮——直接追加历史消息
result = agent.invoke({
    "messages": [
        {"role": "user", "content": "北京天气如何？"},
        {"role": "assistant", "content": "北京晴，22°C。"},
        {"role": "user", "content": "那明天呢？"},
    ]
})
```

`result["messages"]` 包含完整历史（SystemMessage → HumanMessage → AIMessage → ToolMessage → ...），遍历可查看每一轮推理和工具调用。

### 2. 解析中间步骤

遍历消息列表可审计 Agent 的决策过程：

```python{5-13}
result = agent.invoke({
    "messages": [{"role": "user", "content": "深圳和上海哪个更暖和？"}]
})

for msg in result["messages"]:
    match msg:
        case AIMessage(tool_calls=tc) if tc:
            for call in tc:
                print(f"🔧 {call['name']}({call['args']})")
        case ToolMessage():
            print(f"📦 {msg.content[:50]}...")
        case AIMessage(content=content):
            print(f"💬 {content[:80]}...")
```

```
🔧 get_weather({'location': '深圳'})
📦 深圳: 晴，28°C...
🔧 get_weather({'location': '上海'})
📦 上海: 阴，20°C...
💬 深圳更暖和，当前 28°C...
```

### 3. stream：流式输出

`stream()` 逐步返回推理过程，通过 `stream_mode` 控制粒度：

::: code-group
```python [updates（默认）]
# 每步只输出变更，chunk 为 {node: {messages: [...]}}
for chunk in agent.stream({
    "messages": [{"role": "user", "content": "深圳天气如何并计算比上海高几度"}]
}):
    print(chunk)
    # {"agent": {"messages": [AIMessage(...)]}}   ← 模型推理/回复
    # {"tools": {"messages": [ToolMessage(...)]}}  ← 工具执行
```

```python [values]
# 每步输出完整状态
for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "深圳天气如何？"}]},
    stream_mode="values"
):
    print(chunk["messages"][-1])
```

```python [messages]
# 逐 token 输出 LLM 文本，适合聊天 UI
for msg_chunk, metadata in agent.stream(
    {"messages": [{"role": "user", "content": "深圳天气如何？"}]},
    stream_mode="messages"
):
    print(msg_chunk.content, end="", flush=True)  # 逐字打印
```
:::

::: tip
`stream_mode` 支持组合使用 `["updates", "messages"]`，还支持 `tasks`、`debug`、`custom` 等模式。
:::

## 四、错误处理与调试

工具执行异常默认作为 ToolMessage 返回给模型，模型自行调整策略：

```python
@tool
def risky_search(query: str) -> str:
    """搜索知识库。"""
    if "不存在的主题" in query:
        raise ValueError("未找到相关文档")
    return f"搜索结果：关于 {query} 的文档..."

agent = create_agent(model=model, tools=[risky_search])
result = agent.invoke({
    "messages": [{"role": "user", "content": "搜索'不存在的主题'"}]
})
# 模型收到 ValueError 后会尝试换词搜索，或告知用户查不到
```

::: warning
如果 Agent 陷入无限循环，检查 `system_prompt` 是否清晰定义了任务结束条件。模型不确定何时停止是循环最常见的原因。
:::

## 小结

`create_agent` 将 Tool Calling 四阶段循环封装为一行调用——你提供模型和工具，Agent 自动完成推理、调用、回传、再推理的闭环。`system_prompt` 定义行为边界和工具策略，`response_format` 约束输出格式，`stream()` 提供实时进度反馈。

Agent 是 LangChain 工作流的最终形态：Prompt 定义意图 → Tools 赋予行动力 → Structured Output 约束格式 → Agent 封装自主决策循环。返回[概念总览](/server/langchain/)可回顾完整架构。

::: info 📖 相关资源
- [create_agent API 参考](https://python.langchain.com/api_reference/langgraph/agents/langchain.agents.create_agent.html) — 函数签名与全部参数
- [LangChain Agents 概念文档](https://python.langchain.com/docs/concepts/agents/) — Agent 架构设计原理
:::
