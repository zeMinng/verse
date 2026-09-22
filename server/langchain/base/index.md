# LangChain 基础使用

## 概要

将从零开始搭建大模型开发环境，并沿着输入提示（Prompt）→ 模型推理（Model）→ 链式组合（Chain） 这一 LangChain 最经典的递进式骨架展开实践。

## 一、环境搭建

本文示例使用 OpenAI 模型，如需使用其他模型，安装对应的集成包即可，例如 `langchain-deepseek`，需要同时安装框架核心和你使用的模型 SDK：

::: code-group
```bash [安装依赖]
uv add langchain langchain-openai
# 或
pip install langchain langchain-openai
```

```bash [配置 API Key]
# LangChain 默认从环境变量读取 API Key。在终端中设置：
# macOS / Linux
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxx"
# powershell
$env:OPENAI_API_KEY = "sk-xxxxxxxxxxxxxxxx"
```
:::

## 二、模型初始化

| 方式 | 适用场景 |
|---------|---------|
| **厂商原生 SDK** | 使用模型厂商专用包（如 langchain-deepseek），自动读取环境变量，代码最简洁 |
| **兼容用法** | 通过 ChatOpenAI + base_url 调用第三方模型，适合兼容 OpenAI API 格式的厂商 |
| **中转平台** | 使用 init_chat_model 统一入口，通过 `model="provider:name"` 指定，适合聚合多厂商或 API 中转（如 OneAPI、LiteLLM） |

::: code-group
```python{3,10-17,19} [中转平台：init_chat_model]
import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv(override=True)
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL")

model = init_chat_model(
    # model="deepseek-v4-flash",
    # model_provider="deepseek",
    # 或者
    model="deepseek:deepseek-v4-flash",
    base_url=DEEPSEEK_API_BASE,
    api_key=DEEPSEEK_API_KEY,
)

print(model.invoke('你是什么模型？'))
```

```python{3,10-14,16} [兼容用法：ChatOpenAI]
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv(override=True)
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL")

model = ChatOpenAI(
    base_url=DEEPSEEK_API_BASE,
    api_key=DEEPSEEK_API_KEY,
    model=DEEPSEEK_MODEL
)

print(model.invoke('你是什么模型？'))
```

```python{4,16-20} [厂商原生：ChatDeepSeek]
import os
from dotenv import load_dotenv
import langchain
from langchain_deepseek import ChatDeepSeek
print(langchain.__version__)

"""
可以省略os.getenv步骤，因为会自动加载env中的配置
"""
# 读取.env配置文件中的信息
load_dotenv(override=True)
# DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL")
# DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL")

llm_deepseek = ChatDeepSeek(
    # api_base=DEEPSEEK_BASE_URL,
    # api_key=DEEPSEEK_API_KEY,
    model=DEEPSEEK_MODEL,
)
```
:::

## 三、调用模型

LangChain 将模型抽象为两类：LLM（文本进文本出）和 ChatModel（消息列表进出）。现代应用几乎都使用 ChatModel，因为它支持 system / user / assistant 多角色消息，比纯文本的 LLM 灵活得多。

### 1. invoke()

invoke() 是模型调用的核心方法，输入消息，返回 `AIMessage` 对象。支持三种输入形式：

::: code-group
```python [文本输入]
# 最简形式：直接传字符串，LangChain 自动包装为 HumanMessage
res = model.invoke("你好")
print(res.content)
```

```python [字典列表]
# 字典格式与 OpenAI Chat API 一致，适合多轮对话
messages = [
    {"role": "user", "content": "我叫小明"},
    {"role": "assistant", "content": "你好小明，有什么可以帮你的？"},
    {"role": "user", "content": "我叫什么名字？"},
]
res = model.invoke(messages)
print(res.content)  # 小明
```

```python [消息对象列表]
# LangChain 原生类型，与 PromptTemplate / LCEL 深度集成
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

messages = [
    SystemMessage(content="你是一个乐于助人的助手，回答要简洁。"),
    HumanMessage(content="你好，我叫小明"),
    AIMessage(content="你好小明！"),
    HumanMessage(content="我叫什么名字？"),
]
res = model.invoke(messages)
print(res.content)  # 小明
```
:::

| 输入形式 | 特点 | 适用场景 |
|---------|------|---------|
| 文本输入 | 最简形式，LangChain 自动包装为 HumanMessage | 一次性简单问答、快速测试 |
| 字典列表 | `role` + `content` 键值与 OpenAI API 一致，序列化方便 | 多轮对话、API 对接、手动管理历史 |
| 消息对象列表 | SystemMessage / HumanMessage / AIMessage 类型明确 | LangChain 完整工作流、配合 PromptTemplate / LCEL |

### 2. stream() -流式调用

stream() 逐 token 返回模型输出，适合聊天 UI 逐字显示。输入形式与 invoke() 完全一致：

::: code-group
```python [文本输入]
# end="" 避免自动换行，flush=True 确保即时输出
for chunk in model.stream("用一句话介绍 Python 的 GIL"):
    print(chunk.content, end="", flush=True)
```

```python [消息列表]
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage(content="你是一个 Python 专家，回答要简洁。"),
    HumanMessage(content="解释装饰器的原理"),
]

for chunk in model.stream(messages):
    print(chunk.content, end="", flush=True)
```
:::

每个 chunk 是 `AIMessageChunk` 对象，`.content` 拿到增量文本，`response_metadata` 含 `finish_reason` 等 Token 消耗信息。

::: tip invoke 与 stream 的选择
- **invoke()**：一次性获取完整结果，适合批处理、API 后端
- **stream()**：逐 token 返回，适合聊天 UI、实时打字效果
:::

### 3. batch() -批量调用

batch() 对一组输入**并行**调用模型，总耗时接近最慢的那条而非所有请求之和。输入形式与 invoke() 完全一致：

::: code-group
```python [batch 基本用法]
inputs = [
    "用一句话介绍 Python 的 GIL",
    "用一句话介绍 JavaScript 的事件循环",
    "用一句话介绍 Rust 的所有权机制",
]

results = model.batch(inputs)
for i, res in enumerate(results):
    print(f"{i+1}. {res.content}")
```

```python [带并发控制]
inputs = [
    {"role": "user", "content": "Python 的装饰器是什么？"},
    {"role": "user", "content": "JavaScript 的闭包是什么？"},
    {"role": "user", "content": "Rust 的生命周期是什么？"},
]

# max_concurrency 限制最大并发数，避免触发速率限制
results = model.batch(inputs, config={"max_concurrency": 2})
for i, res in enumerate(results):
    print(f"{i+1}. {res.content}")
```
:::

| 方式 | 执行模式 | 5 条请求预计耗时 | 适用场景 |
|------|---------|----------------|---------|
| 循环 invoke() | 串行，逐条等待 | ~5 × 单次耗时 | 调试、单条请求 |
| batch() | 并行，同时发出 | ~1 × 单次耗时 | 批量处理、数据清洗、批量翻译 |

实际加速比受 `max_concurrency` 和 API 速率限制共同影响，建议根据 API 提供商的速率上限设置 `max_concurrency`。

### 4. batch_as_completed()

batch() 等所有请求完成后统一返回，结果顺序与输入一致。如需**哪个先完成就先拿哪个**，使用 `asyncio.as_completed()` + `ainvoke()`：

::: code-group
```python [as_completed 基本用法]
import asyncio

async def batch_as_completed_demo():
    inputs = [
        "用一句话介绍黑洞的形成",
        "用一句话介绍量子纠缠",
        "用一句话介绍暗物质",
    ]

    tasks = [model.ainvoke(x) for x in inputs]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        print(f"[完成] {result.content[:30]}...")

asyncio.run(batch_as_completed_demo())
```

```python [带异常处理]
import asyncio

async def batch_with_error_handling():
    inputs = ["正常问题1", "", "正常问题3"]  # 空字符串可能触发异常

    async def safe_invoke(inp, idx):
        try:
            result = await model.ainvoke(inp)
            return idx, result, None
        except Exception as e:
            return idx, None, e

    tasks = [safe_invoke(inp, i) for i, inp in enumerate(inputs)]
    for coro in asyncio.as_completed(tasks):
        idx, result, error = await coro
        if error:
            print(f"[{idx} 异常] {error}")
        else:
            print(f"[{idx} 完成] {result.content[:30]}...")

asyncio.run(batch_with_error_handling())
```
:::

| 维度 | batch() | as_completed |
|------|----------|----------------|
| 返回时机 | 全部完成后统一返回 | 逐条完成，先完先返 |
| 结果顺序 | 保持输入顺序 | 无序（按完成时间） |
| 适用场景 | 结果需与输入一一对应 | 实时展示、不关心顺序 |

::: tip invoke / stream / batch / as_completed 的选择

| 方法 | 一句话 | 适用场景 |
|------|-------|---------|
| invoke() | 单条请求，等完整结果 | 简单问答、API 后端 |
| stream() | 单条请求，逐 token 返回 | 聊天 UI、实时打字效果 |
| batch() | 多条请求，并行处理，保持顺序 | 批量翻译、数据清洗、离线评测 |
| as_completed | 多条请求，谁先完成先拿谁 | 实时面板、多条独立查询、渐进式加载 |
:::

### 5. 异步调用

ainvoke()、astream()、abatch() 分别是 invoke()、stream()、batch() 的异步版本，输入输出行为完全一致，区别仅在于返回协程，需要 await 驱动。

::: code-group
```python [ainvoke]
import asyncio

async def main():
    result = await model.ainvoke("用一句话介绍 Python 的 asyncio")
    print(result.content)

asyncio.run(main())
```

```python [astream]
import asyncio

async def main():
    async for chunk in model.astream("解释 Python 装饰器的原理"):
        print(chunk.content, end="", flush=True)

asyncio.run(main())
```
:::

| 同步 | 异步 | 返回类型 |
|------|------|---------|
| invoke() | ainvoke() | 协程 → 单条结果 |
| stream() | astream() | AsyncIterator → 逐 token 流 |
| batch() | abatch() | 协程 → 结果列表 |

::: warning 异步混用陷阱
- 不要在同步函数中直接调用 ainvoke()——它返回 coroutine 对象而非结果，必须 await 才能执行。如需在同步代码中使用异步方法，用 asyncio.run() 包裹。
- 不要在 asyncio.run() 内部再调用 asyncio.run()——会触发 `RuntimeError: Event loop is already running`。在已有事件循环的框架（FastAPI、Jupyter）中，直接用 await 即可。
- batch() 内部会自动创建事件循环来并行执行，因此同步的 batch() 已经具备并行能力，大多数批量场景无需特意改用 abatch()。
:::

## 四、模型配置与进阶

模型初始化参数全览、调用 config、异常处理与重试、输出美化四项实用配置。

### 1. 模型初始化参数

这里集中列出初始化时可传入的常见参数，按用途分为四类。

##### 客户端与链接参数

| 参数 | 类型 | 说明 |
|------|------|------|
| base_url | str | API 服务地址，兼容 OpenAI 格式的第三方服务需指定 |
| api_key | str | API 密钥，默认从环境变量读取 |
| timeout | int/float | 请求超时秒数 |
| max_retries | int | 失败重试次数 |
| default_headers | dict | 自定义请求头 |
| http_client | httpx.Client | 自定义 HTTP 客户端 |

##### 模型推理参数

| 参数 | 类型 | 说明 |
|------|------|------|
| model | str | 模型名称/ID |
| temperature | float | 输出随机性 0~2，越低越确定，代码/事实建议 0~0.3 |
| max_tokens | int | 输出 token 上限 |
| top_p | float | 核采样阈值，与 temperature 二选一调参 |
| frequency_penalty | float | 频率惩罚 -2~2，抑制重复内容 |
| presence_penalty | float | 存在惩罚 -2~2，鼓励新话题 |
| stop | list[str] | 停止序列列表 |
| seed | int | 随机种子，用于可复现输出 |

##### 框架通用参数

| 参数 | 类型 | 说明 |
|------|------|------|
| streaming | bool | 是否启用流式 |
| callbacks | list | 回调处理器列表 |
| tags | list[str] | 标签，LangSmith 追踪用 |
| metadata | dict | 元数据键值对 |
| verbose | bool | 是否输出详细日志 |

##### 高级与特定拓展参数

| 参数 | 类型 | 说明 |
|------|------|------|
| model_kwargs | dict | 传递给模型 API 的额外参数（如 top_k 等） |
| extra_body | dict | 直接注入请求体的额外字段（如 reasoning_effort、thinking 等厂商扩展） |
| default_query | str | 默认查询参数 |
| request_timeout | int/float | 请求级超时（覆盖全局 timeout） |

### 2. 调用配置 -config 参数

invoke()、batch()、stream() 均接受 config 参数，类型为 RunnableConfig，用于控制本次调用的运行时行为：

| 参数 | 类型 | 说明 |
|------|------|------|
| max_concurrency | int | 最大并发数，batch() 场景最常用 |
| configurable | dict | 运行时动态配置，链内组件可通过 configurable 字段读取 |
| tags | list[str] | 本次调用的标签，LangSmith 追踪 |
| metadata | dict | 键值对元数据 |
| run_name | str | 本次调用的运行名称 |
| callbacks | list | 回调处理器 |
| recursion_limit | int | 递归调用上限，Agent 场景防无限循环 |

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini").configurable_fields(
    model=str,
    provider=str,
)

# 调用时动态切换，无需重建实例
model.invoke("你好", config={"configurable": {"model": "deepseek-v4-flash", "provider": "deepseek"}})
```

### 3. 异常处理与重试

API 调用可能因网络、限流、认证等原因失败，LangChain 提供三种应对手段。

##### 常见异常类型

| 异常 | 触发场景 |
|------|---------|
| RateLimitError | API 速率限制（429） |
| APIConnectionError | 网络连接失败 |
| APITimeoutError | 请求超时 |
| BadRequestError | 请求参数错误（400） |
| AuthenticationError | 认证失败（401） |

##### 内置重试

初始化时设置 max_retries，LangChain 自动在连接失败和限流时重试：

```python
model = ChatOpenAI(model="gpt-4o-mini", max_retries=3)
```

##### 模型降级 with_fallbacks()

当主模型不可用时自动切换到备用模型：

::: code-group
```python [基本回退]
from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek

primary = ChatOpenAI(model="gpt-4o", max_retries=2)
fallback = ChatDeepSeek(model="deepseek-v4-flash")

model = primary.with_fallbacks([fallback])
result = model.invoke("你好")  # GPT 失败时自动用 DeepSeek
```

```python [多级降级]
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_deepseek import ChatDeepSeek

gpt = ChatOpenAI(model="gpt-4o")
claude = ChatAnthropic(model="claude-sonnet-4-6")
deepseek = ChatDeepSeek(model="deepseek-v4-flash")

model = gpt.with_fallbacks([claude, deepseek])
```
:::

##### try/except 手动捕获

```python
from openai import RateLimitError, APIConnectionError

try:
    result = model.invoke("你好")
except RateLimitError:
    print("触发限流，稍后重试")
except APIConnectionError:
    print("网络连接失败")
except Exception as e:
    print(f"未知错误：{e}")
```

### 4. 输出美化

AIMessage 直接打印可读性差。配合 Rich 库格式化输出：

```python
# from rich.console import Console
# from rich.markdown import Markdown
# console = Console()
# result = model.invoke("用 Markdown 介绍 Python 装饰器")
# console.print(Markdown(result.content))

from rich import print as rprint
rprint("xxxxx")
```

Rich 自动解析模型返回的 Markdown 内容——标题、代码块高亮、表格等直接渲染到终端。

## 五、第一个 Chain

现在把 Model 和 Prompt 串起来。LangChain 用 ==LCEL==（LangChain Expression Language）的管道 `|` 运算符串联组件：

```python{15,18,21-25}
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 1. 定义模型
model = ChatOpenAI(model="gpt-4o-mini")

# 2. 定义提示模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}。"),
    ("user", "{input}"),
])

# 3. 定义输出解析器（将模型返回的消息对象转为纯字符串）
parser = StrOutputParser()

# 4. 用 | 管道符串联成链
chain = prompt | model | parser

# 5. 运行
result = chain.invoke({
    "role": "代码审查专家",
    "input": "请 review 以下代码：\n"
             "def add(a, b): return a + b",
})

print(result)
```

::: tip LCEL 管道符
`prompt | model | parser` 的执行流程是：

1. `invoke()` 的输入字典传给 `prompt`，生成格式化后的消息列表
2. 消息列表传给 model，模型返回 AIMessage 对象
3. AIMessage 传给 parser，被提取为纯字符串

每个组件的输出自动成为下一个组件的输入。这种声明式风格让链的搭建和调试都非常直观。
:::

## 六、多步链式调用

一个链的输出可以作为另一个链的输入。下面用一个"翻译→摘要"两段式链来演示：

```python{12,19,22-24}
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4o-mini")

# 链1：英文翻译
translate_prompt = ChatPromptTemplate.from_messages([
    ("system", "把以下中文翻译成自然流畅的英文。只输出译文，不要解释。"),
    ("user", "{text}"),
])
translate_chain = translate_prompt | model | StrOutputParser()

# 链2：摘要生成
summarize_prompt = ChatPromptTemplate.from_messages([
    ("system", "用一句话总结以下英文文本的核心要点。"),
    ("user", "{text}"),
])
summarize_chain = summarize_prompt | model | StrOutputParser()

# 串联：翻译 → 摘要
combined_chain = translate_chain | (
    lambda en: {"text": en}
) | summarize_chain

result = combined_chain.invoke({
    "text": "LangChain 是一个用于构建 LLM 应用的框架。"
       "它将模型调用、提示模板、链式执行和工具调用等组件封装为可组合的模块。"
       "开发者通过 LCEL 管道语法即可快速搭建复杂的工作流。",
})

print(f"摘要结果：{result}")
```

::: warning 注意
两个 Chain 串联时，前一个输出是字符串，后一个需要字典输入。通过 `lambda` 做一次轻量转换即可桥接不同类型的输入输出。实际项目中，`RunnableLambda` 提供了更完善的方案。
:::

## 小结

本章覆盖了 LangChain 最核心的编程概念：

- ==Model==：模型调用抽象，invoke() / ainvoke() 同步异步调用，stream() / astream() 流式输出，batch() / abatch() 批量并行，as_completed 先完先返，config 控制运行时行为，with_fallbacks() 模型降级
- ==Prompt==：提示模板结构化输入，system 设定角色，MessagesPlaceholder 承载对话历史
- ==Chain==：通过 **LCEL** 的管道符串联组件，StrOutputParser 提取纯文本输出
- **配置进阶**：初始化参数四类全览、调用 config 参数、异常处理与重试、输出美化

掌握了"安装 → 模型初始化 → 模型调用 → 配置进阶 → 提示词模板 → Chain"这套骨架，就为后续学习 Agent 工具调用、RAG 检索增强、Memory 对话记忆等高级主题打下了坚实基础。返回「**概念总览**」可回顾 RAG 与 Agent 的设计思路与选型原则。

:::info 📖 相关资源
- [中文文档](https://docs.langchain.org.cn/oss/python/langchain/install) - 中文 LangChain 文档
- [LangChain 官方文档](https://python.langchain.com/) - LangChain Python SDK 完整文档
- [LangChain GitHub](https://github.com/langchain-ai/langchain) - 开源代码仓库
- [LangSmith](https://smith.langchain.com/) - LLM 应用调试、测试与监控平台
- [LCEL 协议文档](https://python.langchain.com/docs/concepts/lcel/) - LangChain Expression Language 详解
:::
