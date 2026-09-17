# LangChain 结构化输出

## 概要

[with_structured_output()](https://python.langchain.com/docs/how_to/structured_output/) 让 LLM 按预定义 Schema 返回结构化对象——不再是自由文本，而是可直接被下游代码消费的 Pydantic 实例或 dict。一个方法调用替代了传统的"Prompt 指令 + OutputParser + 异常重试"长链路，把 Schema 直接传给模型底层 API，由模型侧原生保证输出格式。适用场景包括 ==结构化提取==、==数据分类==、==表单填充==。

LangChain 支持四种 Schema 定义方式：**Pydantic BaseModel**（推荐首选）、**TypedDict**（轻量 dict）、**JSON Schema**（跨语言）、**@dataclass**（dataclass 风格）。

## 一、四种 Schema 方式总览

四种方式的差异只在 `schema` 参数，模型调用代码无需变化：

| Schema 方式 | 输出类型 | 自带校验 | 适用场景 |
|-------------|----------|:---:|------|
| **Pydantic BaseModel** | 实例（`result.field`） | ✅ | 生产环境，类型安全、校验完备 |
| **TypedDict** | dict（`result["key"]`） | ❌ | 简单键值结构，快速原型 |
| **JSON Schema dict** | dict（`result["key"]`） | ❌ | 已有 JSON Schema、跨语言复用 |
| **@dataclass** | 实例（`result.field`） | ✅* | 偏好 dataclass 风格 |

`@dataclass` 需用 `pydantic.dataclasses.dataclass`，标准库 `dataclasses.dataclass` 不兼容。

::: tip 选择建议
生产环境首选 ==Pydantic BaseModel==；简单提取用 ==TypedDict==；已有 JSON Schema 用 ==JSON Schema dict==；偏好 dataclass 风格用 ==pydantic.dataclasses==。
:::

## 二、Pydantic 模式详解

Pydantic 是官方推荐的结构化输出载体。定义 `BaseModel` 子类作为 Schema，模型按字段定义返回经过校验的实例。

### 1. 基础使用

::: code-group
```python{6-7,10,12} [基础提取]
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

class Joke(BaseModel):
    """笑话结构"""
    setup: str = Field(description="笑话的铺垫部分")
    punchline: str = Field(description="笑话的包袱/笑点")

model = ChatOpenAI(model="gpt-4o-mini")
structured_model = model.with_structured_output(Joke)

result = structured_model.invoke("给我讲一个关于程序员的冷笑话")
# result.setup / result.punchline —— Pydantic 实例，属性访问
```

```python{5-8,11,13} [多字段提取]
from pydantic import BaseModel, Field

class PersonInfo(BaseModel):
    """人物信息提取"""
    name: str = Field(description="人物姓名")
    age: int = Field(description="年龄，未知则填 -1")
    occupation: str = Field(description="职业")
    skills: list[str] = Field(description="技能列表")

model = ChatOpenAI(model="gpt-4o-mini")
structured_model = model.with_structured_output(PersonInfo)

result = structured_model.invoke("张三，28岁，全栈工程师，精通 Vue 和 Python。")
# result.name, result.skills, ...
```

```python{8-9} [LCEL 管道串联]
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "从用户输入中提取人物信息。"),
    ("user", "{input}"),
])

chain = prompt | structured_model
result = chain.invoke({"input": "李四，35岁，架构师"})
```
:::

::: warning
`Field(description=...)` 决定模型输出质量——description 随 Schema 一起发送给模型。**每个字段都应该写 description。**
:::

### 2. 可选字段与默认值

模型并非总能获取所有信息。用 `Optional` + `default=None` 让字段在无信息时返回 `None`——不设则模型会强行猜测。用 `default` 预设合理缺省值，减少模型推断压力：

```python{7-9}
from typing import Optional
from pydantic import BaseModel, Field

class Ticket(BaseModel):
    """客服工单"""
    summary: str = Field(description="问题摘要")
    priority: Optional[str] = Field(default=None, description="紧急程度，未提及时为 None")
    language: str = Field(default="zh-CN", description="用户语言")
    channel: str = Field(default="chat", description="提交渠道：chat / email / phone")
```

### 3. 枚举与约束

`Literal` 将字段约束到有限取值集合，模型输出非枚举值会触发 Pydantic 校验失败，LangChain 自动重试。`Field` 的约束参数（`ge`/`le`/`pattern`/`min_length` 等）提供更细粒度的边界控制：

```python{6-7,11-12}
from typing import Literal
from pydantic import BaseModel, Field

class Ticket(BaseModel):
    """客服工单"""
    summary: str = Field(description="问题摘要", min_length=5, max_length=200)
    category: Literal["技术故障", "账号问题", "投诉建议", "退款申请", "其他"] = Field(
        description="工单分类"
    )
    severity: Literal["低", "中", "高", "紧急"] = Field(default="中", description="严重程度")
    priority_score: int = Field(description="优先级评分", ge=1, le=10, default=5)
    customer_phone: str = Field(description="联系电话", pattern=r"^1[3-9]\d{9}$", default="")
```

| 约束 | 类型 | 说明 |
|------|------|------|
| `ge` / `le` | int, float | 最小值 / 最大值 |
| `gt` / `lt` | int, float | 严格大于 / 小于 |
| `min_length` / `max_length` | str, list | 长度范围 |
| `pattern` | str | 正则匹配 |
| `min_items` / `max_items` | list | 列表项数量范围 |

约束在校验阶段生效——不满足时 LangChain 自动重试直至合规或达上限。

### 4. 列表与嵌套

从文本中提取多个同类实体用 `list[Item]`；复杂场景下用 `BaseModel` 嵌套形成层次化结构：

```python{14-15,17}
from typing import Optional
from pydantic import BaseModel, Field

class CustomerInfo(BaseModel):
    name: str = Field(description="客户姓名")
    phone: Optional[str] = Field(default=None, description="联系电话")

class OrderInfo(BaseModel):
    order_id: Optional[str] = Field(default=None, description="订单号")
    product: str = Field(description="涉及产品")

class Ticket(BaseModel):
    """客服工单（嵌套结构）"""
    customer: CustomerInfo = Field(description="客户信息")
    order: Optional[OrderInfo] = Field(default=None, description="关联订单")
    summary: str = Field(description="问题摘要")
    action_items: list[str] = Field(default_factory=list, description="待办事项列表")
```

嵌套结构让 Schema 与业务模型对齐——客户、订单、工单各司其职，下游代码按层级消费。`default_factory=list` 优于 `default=[]`，避免 Pydantic 共享可变默认值陷阱。

## 三、其他三种 Schema 方式

### 1. TypedDict — 轻量 dict 输出

定义最简洁，输出为普通 dict。可选字段用 `Annotated[类型, None, "描述"]` 标记：

```python{7-9,12}
from typing import TypedDict
from typing_extensions import Annotated
from langchain_openai import ChatOpenAI

class MovieDict(TypedDict):
    """电影信息"""
    title: Annotated[str, "电影名称"]
    year: Annotated[int, "上映年份"]
    rating: Annotated[str | None, None, "评分，未知则为 None"]

model = ChatOpenAI(model="gpt-4o-mini")
structured = model.with_structured_output(MovieDict)
result = structured.invoke("《肖申克的救赎》是哪一年的？")
# {'title': '肖申克的救赎', 'year': 1994} —— dict 访问
```

::: warning
TypedDict 输出为 dict，**无校验能力**——多余字段或类型不匹配不会报错。对可靠性有要求的场景优先用 Pydantic。
:::

### 2. JSON Schema — 原生字典定义

直接传入 JSON Schema dict，适合已有 Schema 定义或跨语言复用：

```python{3,16}
from langchain_openai import ChatOpenAI

json_schema = {
    "title": "WeatherInfo",
    "description": "天气信息",
    "type": "object",
    "properties": {
        "city": {"type": "string", "description": "城市名称"},
        "temperature": {"type": "number", "description": "摄氏温度"},
        "condition": {"type": "string", "enum": ["晴", "多云", "雨", "雪"]},
    },
    "required": ["city", "temperature"],
}

model = ChatOpenAI(model="gpt-4o-mini")
structured = model.with_structured_output(json_schema)
result = structured.invoke("北京今天天气怎么样？")
```

### 3. @dataclass — Pydantic dataclass 风格

用 `pydantic.dataclasses.dataclass` 替代 `BaseModel`，语法更轻，同时保留校验能力：

```python{5-6,13}
from pydantic.dataclasses import dataclass
from pydantic import Field
from langchain_openai import ChatOpenAI

@dataclass
class Person:
    """人物信息"""
    name: str = Field(description="姓名")
    age: int = Field(description="年龄")
    occupation: str = Field(description="职业")

model = ChatOpenAI(model="gpt-4o-mini")
structured = model.with_structured_output(Person)
result = structured.invoke("小王，25岁，前端工程师")
```

::: warning
标准库 `from dataclasses import dataclass` **不兼容**，必须用 `from pydantic.dataclasses import dataclass`。
:::

## 小结

`with_structured_output()` 把 Schema 传给模型底层 API，让输出从自由文本变为 ==结构化对象==。四种 Schema 方式中，Pydantic BaseModel 是生产首选——类型安全、校验完备、约束丰富。TypedDict 轻量但无校验，JSON Schema 适合跨语言复用，@dataclass 是语法替代。

结构化输出与 [Tools 工具](/VPContent/langchain/base/tools) 是 Agent 的两大核心能力：`with_structured_output()` 约束输出格式，`bind_tools()` 赋予外部行动力。两者通过 LCEL 组合——`prompt | model.with_structured_output(...)` 或 `prompt | model.bind_tools(...)`——覆盖了 LLM 应用的绝大多数场景。

::: info 📖 相关资源
- [LangChain Structured Output 指南](https://python.langchain.com/docs/how_to/structured_output/) — 官方结构化输出完整教程
- [with_structured_output API](https://python.langchain.com/api_reference/core/language_models/langchain_core.language_models.chat_models.BaseChatModel.html#langchain_core.language_models.chat_models.BaseChatModel.with_structured_output) — 完整参数说明
- [Pydantic 官方文档](https://docs.pydantic.dev/latest/) — BaseModel 与 Field 参考
- [Pydantic Dataclasses](https://docs.pydantic.dev/latest/concepts/dataclasses/) — pydantic.dataclasses 用法
:::
