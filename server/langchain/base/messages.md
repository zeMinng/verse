# LangChain 消息系统

## 概要

[消息（Message）](https://python.langchain.com/docs/concepts/messages/) 是 LangChain 中 ChatModel 的核心交互单元。与旧式 LLM（纯文本进、纯文本出）不同，ChatModel 的输入和输出都是 **消息对象列表**，每条消息携带角色、内容和元数据，模型根据完整的消息序列理解上下文并生成回复。

消息系统的设计对应 OpenAI Chat Completion API 的 messages 数组——LangChain 在此基础上做了面向对象的封装，提供了类型安全、字段校验和便捷的构造方式。

## 一、四种消息类型

LangChain 提供四种核心消息类型，对应 OpenAI Chat Completion API 的四种 role：

| 对象格式 | Role角色 | 方向 | 用途 |
|------|------|------|------|
| SystemMessage | system | 输入 → 模型 | 设定 AI 的角色、行为约束、输出格式 |
| HumanMessage | user 或 human | 输入 → 模型 | 用户提问，支持文本和多模态内容 |
| AIMessage | assistant 或 ai | 模型 → 输出 | 模型的文本回复，可附带工具调用请求 |
| ToolMessage | tool | 输入 → 模型 | 工具执行结果，回传模型供其整合 |

### 1. SystemMessage — 系统消息

用于设定对话的全局约束。通常放在消息列表的最前面，定义 AI 的角色身份、语气风格、输出格式和安全边界。

```python{3-5,8-11}
from langchain_core.messages import SystemMessage

sys_msg = SystemMessage(
    content="你是一个 Python 技术顾问，回答要简洁专业，代码示例优先。"
)

# 也可通过 name 区分多个 system 来源
sys_msg = SystemMessage(
    content="用户偏好：使用 type hints，遵循 PEP 8。",
    name="user_preferences"
)
```

SystemMessage 的 content 始终为 str，不支持多模态——系统指令不会包含图片。

### 2. HumanMessage — 用户消息

代表用户输入。**纯文本**时 content 为 str；**多模态**（如图片理解）时 content 为列表。

多模态 content 格式与 OpenAI Vision API 保持一致，详见 [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)。LangChain 1.0 还提供了跨厂商统一的 ==content_blocks== 方式，见[第四部分](#四、content-blocks-跨厂商统一内容)。

::: code-group
```python [纯文本消息]
from langchain_core.messages import HumanMessage

msg = HumanMessage(content="解释 Python 装饰器的原理")
```

```python{3-11} [多模态消息 — 图片理解]
from langchain_core.messages import HumanMessage

msg = HumanMessage(
    content=[
        {"type": "text", "text": "这张图片里有什么？"},
        {
            "type": "image_url",
            "image_url": {"url": "https://example.com/photo.jpg"}
        },
    ]
)
# content 为 list[dict]，每个 dict 用 type 字段区分 text 和 image_url
```
:::

### 3. AIMessage — AI 回复消息

模型生成的回复，有两个区别于其他消息类型的关键扩展：**tool_calls**（工具调用请求）和 **usage_metadata**（token 用量）。

::: code-group
```python [纯文本回复]
from langchain_core.messages import AIMessage

ai_msg = AIMessage(content="装饰器本质是一个接受函数、返回函数的可调用对象...")
print(ai_msg.content)
```

```python{3-13} [带工具调用的回复]
from langchain_core.messages import AIMessage

ai_msg = AIMessage(
    content="",  # 纯工具调用时 content 通常为空
    tool_calls=[
        {
            "name": "get_weather",
            "args": {"city": "北京"},
            "id": "call_abc123",
            "type": "tool_call",
        }
    ],
)
# tool_calls 是一个列表，每项为一个 ToolCall 字典
```
:::

**tool_calls 子字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | str | 要调用的工具/函数名称 |
| args | dict | 传递给工具的参数字典 |
| id | str | 本次调用的唯一 ID，ToolMessage 通过此 ID 回传结果 |
| type | str | 固定值 "tool_call" |

**usage_metadata** 记录本次 API 调用的 token 消耗，常见字段：

| 字段 | 说明 |
|------|------|
| input_tokens | 输入 token 数 |
| output_tokens | 输出 token 数 |
| total_tokens | 总 token 数 |

### 4. ToolMessage — 工具调用结果

工具执行完毕后，将结果包装为 ToolMessage 回传给模型。**tool_call_id 必须与对应 AIMessage 中 tool_calls 的 id 匹配**——模型靠这个 ID 把结果和调用请求关联起来。

```python
from langchain_core.messages import ToolMessage

tool_msg = ToolMessage(
    content='{"temperature": 26, "weather": "晴"}',
    tool_call_id="call_abc123",  # 对应 AIMessage 中的 tool_call id
    name="get_weather",           # 可选，标注工具名
)
```

::: warning 注意
==tool_call_id== 的匹配是强制要求。如果 ID 对不上，模型会认为该工具调用没有收到结果，可能导致重复调用或幻觉回复。
:::

## 二、消息构造方式

`ChatPromptTemplate.from_messages()` 统一接收三种等价的消息表示方式。**推荐消息对象**（类型安全，IDE 自动补全），**元组**最简洁（快速原型），**字典**与 OpenAI API 完全一致（API 对接）。

### 1. 消息对象（推荐）

```python{1,4-5}
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="你是一个{role}，请用{style}的风格回答问题。"),
    HumanMessage(content="{input}"),
])
```

消息对象格式的优势在于**类型安全**——IDE 可以自动补全字段，拼写错误在构造时就能发现。

### 2. 元组格式

```python{3-6}
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，请用{style}的风格回答问题。"),
    ("user", "{input}"),
])
```

### 3. 字典格式

```python{3-6}
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    {"role": "system", "content": "你是一个{role}，请用{style}的风格回答问题。"},
    {"role": "user", "content": "{input}"},
])
```

字典格式与 OpenAI API 的 messages 数组完全一致，字段名使用 role 和 content。

### 4. 构造参数对照表

| 参数 | SystemMessage | HumanMessage | AIMessage | ToolMessage |
|------|:---:|:---:|:---:|:---:|
| content (str) | ✅ | ✅ | ✅ | ✅ |
| content (list, 多模态) | ❌ | ✅ | ❌ | ❌ |
| name | ✅ | ✅ | ✅ | ✅ |
| tool_calls | ❌ | ❌ | ✅ | ❌ |
| tool_call_id | ❌ | ❌ | ❌ | ✅ |
| usage_metadata | ❌ | ❌ | ✅ | ❌ |

## 三、消息基类与核心字段

所有消息类型都继承自 ==BaseMessage==，它定义了统一的消息接口。

### 1. BaseMessage 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| content | str \| list | 消息正文。纯文本为 str，多模态时为 list（如含图片的 HumanMessage） |
| type | str | 消息角色标识："system"、"human"、"ai"、"tool" |
| id | str | 消息唯一 ID，LangChain 自动生成，可用于追踪和去重 |
| name | str \| None | 消息发送者名称，用于区分同名角色（如多个工具调用） |
| additional_kwargs | dict | 模型供应商特有的额外字段（如 OpenAI 的 function_call、tool_calls 原始数据） |
| response_metadata | dict | 模型返回的响应元数据（如 token_usage、finish_reason、model_name） |

BaseMessage 是抽象基类，不直接实例化——通过四种消息子类来构造具体消息。

### 2. additional_kwargs vs response_metadata

两者是最容易混淆的两个字段：

- ==additional_kwargs==：**请求/输入侧**的附加数据，由上游组件或用户手动填充，随消息一起发送给模型。
- ==response_metadata==：**响应/输出侧**的元数据，由模型 API 返回，仅供下游读取，不会发回模型。

```python
from langchain_core.messages import AIMessage

ai_msg = AIMessage(
    content="你好",
    additional_kwargs={"refusal": None},              # 输入侧附加数据
    response_metadata={"finish_reason": "stop", "model_name": "gpt-4o"},  # 输出侧元数据
)

print(ai_msg.response_metadata["finish_reason"])  # "stop"
```

> response_metadata 的具体字段因模型厂商而异。OpenAI 返回 token_usage、finish_reason、model_name 等；其他厂商可能有不同字段，查阅对应 SDK 文档即可。

### 3. 常用方法

所有消息对象共享以下方法：

```python{6-7,13,19}
from langchain_core.messages import HumanMessage

msg = HumanMessage(content="你好")

# 转为字典
msg.dict()        # 完整字段
msg.model_dump()  # Pydantic v2 风格

# 转为 JSON 字符串
msg.json()

# 美化打印（调试用）
msg.pretty_print()
# 输出：
# ============================== Human Message ==============================
# 你好

# 链式更新字段（返回新对象，不修改原对象）
new_msg = msg.copy(update={"name": "小明"})
```

## 四、content_blocks：跨厂商统一内容

### 1. content 的两种形态

content 支持 str（纯文本）和 list[dict]（多模态）两种形态。多模态格式在[第一部分第 2 节](#_2-humanmessage-—-用户消息)已演示，此处快速回顾：

::: code-group
```python [纯文本]
from langchain_core.messages import HumanMessage

msg = HumanMessage(content="解释 Python 装饰器的原理")
# content 类型: str
```

```python [多模态 — list[dict]]
from langchain_core.messages import HumanMessage

msg = HumanMessage(content=[
    {"type": "text", "text": "这张图片里有什么？"},
    {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}},
])
# content 类型: list[dict]，每个 dict 通过 type 区分内容类别
```
:::

list[dict] 格式的问题在于它是 OpenAI 风格的——发往 Anthropic 或 Google 时需要不同的键名和结构。LangChain 1.0 引入了 ==content_blocks== 解决跨厂商兼容问题。详见 [LangChain Standard Message Content](https://www.langchain.com/blog/standard-message-content)。

### 2. content_blocks 输入与输出

content_blocks 是 BaseMessage 的 lazy property，返回厂商无关的标准化 ContentBlock 列表。同时提供 content 和 content_blocks 时，content_blocks 优先。

**输入：构造消息**

```python{4-7}
from langchain_core.messages import HumanMessage
from langchain_core.messages.content import TextContentBlock, ImageContentBlock

msg = HumanMessage(content_blocks=[
    TextContentBlock(text="这张图片里有什么？"),
    ImageContentBlock(url="https://example.com/photo.jpg"),
])
# 同样的 ImageContentBlock，发往 OpenAI 时自动转为 image_url 格式
# 发往 Anthropic 时自动转为 source 格式，无需手动适配
```

**输出：读取响应**

response.content_blocks 无论底层是 OpenAI、Anthropic 还是 Google，返回结构完全一致：

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")
response = model.invoke("Hello")

for block in response.content_blocks:
    print(block["type"], "→", block.get("text") or block.get("reasoning"))
# text → Hello! How can I help you?
```

对于 o1 / Claude extended thinking 等推理模型，思考过程和最终回答被自动拆分：

```python
# 推理模型（o1）的响应
response = ChatOpenAI(model="o1").invoke("证明根号2是无理数")

for block in response.content_blocks:
    if block["type"] == "reasoning":
        print("[思考]", block["reasoning"][:50], "...")
    elif block["type"] == "text":
        print("[回答]", block["text"])
# [思考] 使用反证法。假设根号2是有理数，则存在... ...
# [回答] 假设√2是有理数...
```

设置 `output_version="v1"` 后，`response.content` 也返回 `list[ContentBlock]` 而非 str：

```python
model = ChatOpenAI(model="gpt-4o", output_version="v1")
response = model.invoke("Hello")
print(response.content)  # [TextContentBlock(text="Hello! ...")]
```

::: warning 注意
- content_blocks 返回的始终是列表。快速取文本用 `response.content_blocks[0]["text"]` 或 `response.text` 属性。
- content 与 content_blocks 同时提供时后者优先。不要在同一个消息对象中混用两者传递不同内容。
:::

### 3. 标准 ContentBlock 类型速查

| type | Block 类 | 用途 |
|------|----------|------|
| text | TextContentBlock | 纯文本 |
| reasoning | ReasoningContentBlock | 推理/思考过程 |
| image | ImageContentBlock | 图片（支持 url / base64） |
| audio | AudioContentBlock | 音频 |
| video | VideoContentBlock | 视频 |
| file | FileContentBlock | 文件附件 |
| tool_use | ToolCall | 工具调用（完整） |
| tool_use_chunk | ToolCallChunk | 流式工具调用片段 |

## 小结

- 四种消息类型对应 OpenAI 的四种 role：==SystemMessage== 设定角色、==HumanMessage== 承载用户输入（支持多模态）、==AIMessage== 返回模型回复（含 tool_calls 和 usage_metadata）、==ToolMessage== 回传工具结果
- 消息构造有三种方式：**消息对象**（类型安全，推荐）、**元组**（最简洁）、**字典**（OpenAI 兼容），三种格式同样可用于 ChatPromptTemplate
- ==BaseMessage== 定义了六大字段，其中 ==additional_kwargs== 是输入侧附加数据，==response_metadata== 是输出侧元数据——前者随消息发送，后者仅供读取
- AIMessage.tool_calls 与 ToolMessage.tool_call_id 必须匹配，模型靠 ID 关联调用请求和结果
- ==content_blocks== 提供跨厂商统一的多模态和推理内容表示：输入侧用 `content_blocks=[...]` 构造（自动转换为厂商原生格式），输出侧用 `response.content_blocks` 读取（厂商无关的统一结构）

:::info 📖 相关资源
- [LangChain Messages 概念文档](https://python.langchain.com/docs/concepts/messages/) — 消息系统的官方概念说明
- [LangChain Core Messages API](https://python.langchain.com/api_reference/core/messages/langchain_core.messages.BaseMessage.html) — BaseMessage 完整 API 参考
- [OpenAI Chat Completions API](https://platform.openai.com/docs/guides/chat-completions) — Role 与 Message 格式的源头文档
- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision) — 多模态 content 格式说明
:::
