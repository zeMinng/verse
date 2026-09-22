# LangChain 提示词模板

## 概要

[ChatPromptTemplate](https://python.langchain.com/api_reference/core/prompts/langchain_core.prompts.chat.ChatPromptTemplate.html) 解决一个具体问题：**把用户输入和固定约束组装成结构化的消息列表**。直接在代码里拼接字符串，提示词散落各处无法统一管理，变量硬编码换场景就要改代码。`from_messages()` 定义消息骨架——`{变量}` 是占位符，`invoke()` 填入具体值，生成 ChatModel 直接消费的 ==消息列表==。提示词从此可以像函数一样被调用、复用、组合。

## 一、基础使用

模板的核心思想就一个：**骨架和内容分离**。system 消息定角色和约束，user 消息放每次不同的业务输入，占位符 `{变量}` 标记变化的部分。

from_messages() 支持三种消息格式（元组、字典、消息对象），与消息系统中介绍的完全一致。

::: code-group
```python{3-6,8-12} [基础模板]
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，请用{style}的风格回答问题。"),
    ("user", "{input}"),
])

messages = prompt.invoke({
    "role": "Python 技术顾问",
    "style": "简洁",
    "input": "装饰器的原理是什么？",
})
# messages 是 List[BaseMessage]，可直接传给 ChatModel
```

```python{3-7,14-15} [带对话历史]
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个乐于助人的助手。"),
    MessagesPlaceholder(variable_name="history"),
    ("user", "{input}"),
])

# 历史消息从外部传入——数据库、缓存、前端会话皆可
history = [
    ("user", "我叫小明"),
    ("assistant", "你好小明，有什么可以帮你的？"),
]

messages = prompt.invoke({"history": history, "input": "我叫什么名字？"})
```
:::

两个模板对应两种场景：基础模板所有变量都由 invoke 传入，适合单轮问答；`MessagesPlaceholder` 在模板中留一个"消息列表插槽"，适合多轮对话——历史由外部管理，模板只管结构。

## 二、初始化参数类型

`from_messages()` 接受 6 种参数，按是否需要变量替换归为两类。日常只用 tuple，其余按场景查。

::: code-group
```python [tuple元组]
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}。"),  # 2-元组：(role, content)
    ("user", "{input}"),
])
# ("tool", "content", tool_call_id)  # tool 消息需 3-元组
```

```python [dict字典]
prompt = ChatPromptTemplate.from_messages([
    {"role": "system", "content": "你是一个{role}。"},
    {"role": "user", "content": "{input}"},
])
# 与 OpenAI Chat API 的 messages 格式一致，序列化友好
```

```python [字符串]
prompt = ChatPromptTemplate.from_messages([
    "你是一个乐于助人的助手。",      # 等价于 ("human", "...")
    ("human", "{input}"),
])
# 纯字符串自动视为 human 消息
```

```python [静态消息（无变量）]
from langchain_core.messages import SystemMessage

prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="你是一个助手。"),  # 固定内容，不含 {变量}
    ("user", "{input}"),
])
# BaseMessage 是具体消息实例，不会做变量替换
```

```python{8-10} [模板消息]
# xxxMessagePromptTemplate
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template("你是一个{role}。"),
    HumanMessagePromptTemplate.from_template("{input}"),
])
# 需要显式指定消息类型时使用
```

```python [嵌套模板]
# 子模板：可独立测试、跨 prompt 复用
role_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}。"),
])

# 父模板：组合子模板 + 业务变量
prompt = ChatPromptTemplate.from_messages([
    role_prompt,
    ("user", "{input}"),
])
# 多个 prompt 共享同一套 system 约束时最有用
```
:::

| 类型 | 变量替换 | 使用场景 |
|------|:---:|------|
| tuple `("role", "content")` | ✅ | **日常首选**，最简洁 |
| dict `{"role": ..., "content": ...}` | ✅ | 对接 OpenAI API，需序列化存储时 |
| str | ✅ | 快速测试，仅 human 消息 |
| MessagePromptTemplate | ✅ | 需显式控制消息类型时 |
| BaseChatPromptTemplate | ✅ | 模板组合复用 |
| BaseMessage | ❌ | 固定不变的 system 指令 |

表中按推荐度排序——从上到下是日常使用频率。

## 三、与 ChatModel 配合

模板只生成消息列表，不调用模型。连接模型只需 LCEL 管道 `|`：

::: code-group
```python{10-11} [prompt | model → AIMessage]
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

model = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}。"),
    ("user", "{input}"),
])

chain = prompt | model
response = chain.invoke({"role": "代码审查专家", "input": "解释 SOLID 原则"})
# response 是 AIMessage，需通过 .content 拿文本
print(response.content)
```

```python{11-12} [prompt | model | parser → str]
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}。"),
    ("user", "{input}"),
])

chain = prompt | model | StrOutputParser()
result = chain.invoke({"role": "代码审查专家", "input": "解释 SOLID 原则"})
# result 直接是字符串，无需 .content
print(result)
```
:::

两种链的区别只有一点：**是否需要 AIMessage 的元数据**。`StrOutputParser` 把 AIMessage 提取为纯字符串，适合直接展示、入库、API 返回。需要访问 `tool_calls`、`response_metadata` 或做消息级操作时，保留 AIMessage，不加 parser。

::: tip
`prompt | model | parser` 是 LangChain 中最常见的三件套。掌握了这个模式，后续学 Tools（`prompt | model.bind_tools(...) | ...`）和 Agent 就是在此基础上的自然扩展。
:::

## 四、高级特性

模板定义好骨架之后，变量从三条路径进入：**invoke() 传参**（每次变化的业务数据）、**partial() 固化**（定义时就确定的全局配置）、**MessagesPlaceholder 插入**（外部维护的消息列表）。第一条路径在第一章已演示，这里展开后两条。

### 1. partial — 固化不变变量

语气风格、输出格式这类配置在应用启动时就确定了，每次 invoke 都传一遍既啰嗦又容易漏。`partial` 把它们固化在模板里：

```python{9}
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，请用{style}的风格回答。"),
    ("user", "{input}"),
])

# 固化全局配置，invoke 只需传业务变量
prompt = prompt.partial(style="简洁专业")

messages = prompt.invoke({
    "role": "Python 顾问",
    "input": "装饰器原理？",
})
```

`partial_variables` 构造参数与此等价——选哪个只是风格偏好。

::: warning 变量名冲突
partial 固化的变量不能与 invoke 传入的变量重名——LangChain 优先使用 partial 值，invoke 中的同名变量被**静默忽略**。从命名上彻底区分：`style`、`tone`、`format` 用 partial；`input`、`topic`、`question` 用 invoke。
:::

### 2. MessagesPlaceholder — 消息列表插槽

第一章用 tuple 列表快速演示了基础用法。生产环境中的对话历史通常以 `HumanMessage` / `AIMessage` 对象形式存在——它们携带 `content_blocks`（多模态内容）、`tool_calls`（工具调用记录）等元数据，tuple 无法表达这些信息。

::: code-group
```python{6,15} [基本用法]
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个乐于助人的助手。"),
    MessagesPlaceholder(variable_name="history"),
    ("user", "{input}"),
])

history = [
    HumanMessage(content="我叫小明"),
    AIMessage(content="你好小明！"),
]

messages = prompt.invoke({"history": history, "input": "我叫什么名字？"})
```

```python{3,7} [可选占位符]
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个助手。"),
    MessagesPlaceholder(variable_name="history", optional=True),
    ("user", "{input}"),
])

messages = prompt.invoke({"input": "你好"})
# 不传 history 不报错，占位符位置为空
```
:::

| 参数 | 类型 | 默认值 | 说明 |
|------|------|:---:|------|
| variable_name | str | — | invoke 时用此键名传入消息列表 |
| optional | bool | False | 为 True 时可不传，占位处为空 |
| n_messages | int | None | 限制恰好 N 条消息，超出抛 ValueError |

::: tip
`n_messages` 用于硬限制历史轮数（如设为 10 保留最近 5 轮对话），防止 token 消耗随对话增长失控。`optional=True` 适合首次对话没有历史的场景，但注意**不传变量不报错，占位处为空**——如果后续链逻辑依赖该位置有内容，模型行为可能异常。
:::

## 小结

提示词模板解决的本质问题是**消息结构的复用**——骨架和内容分离，同一套 prompt 适配不同输入、不同对话历史、不同全局配置。在 LangChain 工作流中，`prompt | model | parser` 是最基础的组装单元：Tools 在此之上给模型绑定函数调用能力，Agent 在此基础上加入自主决策循环。返回[概念总览](/server/langchain/)可回顾整体架构。

::: info 📖 相关资源
- [ChatPromptTemplate API](https://python.langchain.com/api_reference/core/prompts/langchain_core.prompts.chat.ChatPromptTemplate.html) — 完整 API 参考
- [Prompt Templates 概念文档](https://python.langchain.com/docs/concepts/prompt_templates/) — 官方概念说明
- [MessagesPlaceholder API](https://python.langchain.com/api_reference/core/prompts/langchain_core.prompts.chat.MessagesPlaceholder.html) — 完整参数与用法
- [LCEL 协议文档](https://python.langchain.com/docs/concepts/lcel/) — LangChain Expression Language 详解
:::
