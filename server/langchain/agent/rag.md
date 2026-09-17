# RAG 知识库实战

## 概要

[RAG](https://python.langchain.com/docs/tutorials/rag/)（Retrieval-Augmented Generation，检索增强生成）是 LangChain 最经典的应用模式。它让模型在回答之前先从外部知识库检索相关文档，再基于文档生成答案——解决了大模型知识截止、幻觉、私有知识三大痛点。

RAG 的完整流水线由六个环节串联而成：

```text
文档加载   →   文本切分   →   向量嵌入   →   向量存储   →   相似检索   →   生成回答
Loader   →   Splitter  →  Embeddings →  VectorStore →  Retriever  →  ChatModel
```

本文从零搭建这条流水线，依次实战四个核心环节：文档加载器、文本切分器、文档嵌入大模型和 Milvus 向量存储。

## 一、文档加载器: Document Loaders

LangChain 内置了上百种文档加载器，覆盖 TXT、CSV、JSON、PDF、网页、数据库等常见数据源。加载器统一返回 `Document` 对象——包含 `page_content`（文本内容）和 `metadata`（元数据）两个字段。

### 1. TextLoader — 加载 TXT

`TextLoader` 是最简单的加载器，按行或整个文件读取纯文本。

::: code-group
```python{4,7-8,10} [TextLoader 基本用法]
from langchain_community.document_loaders import TextLoader

# 加载 TXT 文件，encoding 默认 utf-8
loader = TextLoader("./data/readme.txt", encoding="utf-8")

# load() 返回 List[Document]，每个 Document 包含 page_content 和 metadata
docs = loader.load()
print(f"加载了 {len(docs)} 个文档")
print(f"内容预览: {docs[0].page_content[:200]}")
print(f"元数据: {docs[0].metadata}")  # {'source': './data/readme.txt'}
```
:::

`TextLoader` 默认将整个文件作为一个 Document。如需按段落或句子粒度初步分割，可以配合后续的 `TextSplitter` 使用。

### 2. CSVLoader — 加载 CSV

`CSVLoader` 将 CSV 的每一行转换为一个 Document，列名和值拼接为 `page_content`。

::: code-group
```python{4,9-10,12-13,15} [CSVLoader 基本用法]
from langchain_community.document_loaders import CSVLoader

# 加载 CSV，每一行生成一个 Document
loader = CSVLoader(
    file_path="./data/products.csv",
    encoding="utf-8",
    csv_args={"delimiter": ",", "quotechar": '"'},
)

docs = loader.load()
print(f"共 {len(docs)} 行数据")

# 每个 Document 的 page_content 格式: "列1: 值1\n列2: 值2\n..."
print(docs[0].page_content)
# name: 笔记本电脑\nprice: 5999\ncategory: 电子产品

print(docs[0].metadata)  # {'source': './data/products.csv', 'row': 0}
```
```python{3,5-9} [自定义内容列]
# 只提取指定列的内容，跳过无关字段
loader = CSVLoader(
    file_path="./data/products.csv",
    content_columns=["name", "description"],  # 仅这两列进入 page_content
    metadata_columns=["category", "price"],   # 这两列进入 metadata
)

docs = loader.load()
print(docs[0].page_content)
# name: 笔记本电脑\ndescription: 高性能轻薄本...
print(docs[0].metadata)
# {'source': '...', 'row': 0, 'category': '电子产品', 'price': '5999'}
```
:::

| 参数 | 说明 |
|------|------|
| `content_columns` | 指定哪些列的内容写入 `page_content`，不指定则全部列拼接 |
| `metadata_columns` | 指定哪些列写入 `metadata`，用作检索时的过滤条件 |
| `csv_args` | 透传给 Python 标准库 `csv.reader` 的参数 |

::: tip
CSV 数据通常结构规整，建议将用作过滤条件的列（如 `category`、`date`）放入 `metadata_columns`，检索时通过 Milvus 的元数据过滤精准定位。
:::

### 3. JSONLoader — 加载 JSON

`JSONLoader` 使用 [jq](https://jqlang.org/) 语法指定提取哪些字段，支持嵌套 JSON 结构。

::: code-group
```python{3,7,9-10} [JSONLoader 基本用法]
from langchain_community.document_loaders import JSONLoader

# jq 语法 '.' 表示提取整个 JSON，'.messages[].content' 提取嵌套字段
loader = JSONLoader(
    file_path="./data/chat_history.json",
    jq_schema=".messages[].content",  # 提取 messages 数组中每个对象的 content 字段
    text_content=False,  # content 是纯文本，非 JSON 字符串
)

docs = loader.load()
print(f"提取了 {len(docs)} 条消息")

for i, doc in enumerate(docs[:3]):
    print(f"[{i}] {doc.page_content[:80]}...")
```
```python{4-8} [提取内容 + 元数据]
# 同时提取内容和元数据
def metadata_func(record: dict, metadata: dict) -> dict:
    """将 JSON 中的 role 和 date 字段注入 metadata。"""
    metadata["role"] = record.get("role", "unknown")
    metadata["date"] = record.get("date", "")
    return metadata

loader = JSONLoader(
    file_path="./data/qa_pairs.json",
    jq_schema=".[]",
    content_key="answer",          # 将 answer 字段作为 page_content
    metadata_func=metadata_func,   # 自定义元数据提取
)

docs = loader.load()
print(docs[0].page_content[:100])
print(docs[0].metadata)  # {'source': '...', 'seq_num': 1, 'role': 'assistant', 'date': '2025-06-01'}
```
:::

| 参数 | 说明 |
|------|------|
| `jq_schema` | jq 语法，指定从 JSON 中提取哪些节点 |
| `content_key` | 指定节点的哪个字段作为 `page_content`，不指定则用整个节点的 JSON 字符串 |
| `metadata_func` | 自定义函数，将 JSON 字段映射到 Document 的 `metadata` |
| `text_content` | `True` 时将 content 当作 JSON 字符串处理，`False` 时直接当作文本 |

### 4. 其他 Loader 速览

| Loader | 适用场景 | 一句话使用 |
|--------|---------|-----------|
| `PyPDFLoader` | PDF 文档 | `PyPDFLoader("./doc.pdf").load()` |
| `WebBaseLoader` | 网页抓取 | `WebBaseLoader("https://example.com").load()` |
| `UnstructuredMarkdownLoader` | Markdown 文件 | `UnstructuredMarkdownLoader("./note.md").load()` |
| `DirectoryLoader` | 批量加载目录下的所有文件 | `DirectoryLoader("./docs/", glob="*.txt").load()` |

所有 Loader 返回的 `Document` 对象都遵循统一结构，这意味着无论数据来源是什么，下游的处理流程（切分、嵌入、存储）完全一致。

## 二、文档切分器: Text Splitters

加载完文档后，必须将长文本切分为合适大小的 ==chunk=={green}。chunk 太大则检索不准（噪声多），太小则丢失上下文——这个权衡决定了整个 RAG 系统的检索质量。

### 1. RecursiveCharacterTextSplitter 核心参数

`RecursiveCharacterTextSplitter` 是 LangChain 的默认切分器，也是实用性最高的选择。它按优先级依次尝试多种分隔符来拆分文本，确保切分点尽可能合理。

::: code-group
```python{3,6-13,15-16} [基本用法]
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 初始化切分器
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每个 chunk 的目标最大字符数
    chunk_overlap=50,     # 相邻 chunk 之间的重叠字符数
    separators=[          # 分隔符优先级：先按段落分，不行再按句子，最后按空格
        "\n\n",           # 段落分隔
        "\n",             # 换行
        "。",             # 中文句号
        ".",              # 英文句号
        " ",              # 空格（最后手段）
    ],
    length_function=len,  # 使用字符数计算长度
    is_separator_regex=False,
)

# split_documents() 接收 Document 列表，返回切分后的 Document 列表
docs = text_splitter.split_documents(loaded_docs)
print(f"切分前: {len(loaded_docs)} 个文档 → 切分后: {len(docs)} 个 chunk")
```
```python{3-7} [从文本直接切分]
# 也可以直接从纯文本切分
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=30,
)

texts = text_splitter.split_text("这是一段很长的文本...")
print(f"切分为 {len(texts)} 段")
# ['这是第一段内容...', '第一段内容...（重叠部分）继续第二段...', ...]
```
:::

几个核心参数详解：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `chunk_size` | 4000 | chunk 的目标大小（字符数）。切分器会尽量接近这个值，但不会为了精确反而不拆分完整句子 |
| `chunk_overlap` | 200 | 相邻 chunk 的重叠部分。==关键调参项=={warning}——太小可能切断关键信息，太大则冗余膨胀 |
| `separators` | `["\n\n", "\n", " ", ""]` | 分隔符优先级列表。切分器先尝试用 `separators[0]` 切分，如果 chunk 还是太大，则降级到 `separators[1]`，依此类推 |
| `length_function` | `len` | 计算文本长度的函数，默认按字符数。中文场景注意：`len("你好")` = 2 |
| `keep_separator` | `True` | 是否在 chunk 末尾保留分隔符 |

### 2. 切分实战与调参建议

`chunk_size` 和 `chunk_overlap` 没有银弹，需要根据文档类型和嵌入模型的上下文窗口来调参。

::: code-group
```python{3-7,13,16-17,20} [对比不同参数的效果]
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 场景 A：代码文档 — 小 chunk、小 overlap，保证单段代码完整
code_splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=30,
    separators=["\n\n", "\n", " ", ""],
)

# 场景 B：长篇文章 — 大 chunk、大 overlap，保留段落语义
article_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    separators=["\n\n", "\n", "。", ".", " ", ""],
)

# 查看切分效果
code_docs = code_splitter.split_documents(code_loaded_docs)
article_docs = article_splitter.split_documents(article_loaded_docs)

print(f"代码文档: {len(code_docs)} chunks, 平均长度 {sum(len(d.page_content) for d in code_docs) // len(code_docs)}")
print(f"文章文档: {len(article_docs)} chunks, 平均长度 {sum(len(d.page_content) for d in article_docs) // len(article_docs)}")
```
:::

::: tip 调参口诀
- **chunk_size**：取嵌入模型上下文窗口的 30%~50%。模型窗口 8192 token（约 6000 中文字符），chunk_size 设为 500~800 比较合适
- **chunk_overlap**：取 chunk_size 的 10%~20%。太小切不断关键句，太大检索列表全是重复内容
- **中文优先加 `。`**：separators 列表中加入中文句号，让切分器优先在句子边界断开，而非粗暴地在空格处切断
- **先跑后调**：先用默认参数跑一次，在检索阶段观察 top-K 结果的质量，据此反向调整
:::

## 三、文档嵌入大模型: Embeddings

切分好的 chunk 仍是文本，无法直接做数学运算。==Embedding 模型=={blue}将文本映射为高维向量——语义相近的文本，向量距离也相近。这是检索的核心数学基础。

### 1. 选型与初始化

LangChain 的 `Embeddings` 类提供统一接口，底层模型可以自由切换。选择嵌入模型时需关注两点：**向量维度**（影响存储开销和检索速度）和**上下文窗口**（决定 chunk 能多长）。

::: code-group
```python{3-6,8} [OpenAIEmbeddings]
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",  # 维度: 1536, 性价比高
    # model="text-embedding-3-large",  # 维度: 3072, 精度更高
    dimensions=512,  # 可选：降维到 512，减少存储开销（仅 text-embedding-3 系列支持）
)

# 测试连接
test_vector = embeddings.embed_query("测试文本")
print(f"向量维度: {len(test_vector)}")  # 512
```
```python{4-8} [兼容接口: DeepSeek 等]
from langchain_openai import OpenAIEmbeddings

# 大多数国产模型兼容 OpenAI API 格式，通过 base_url 切换
embeddings = OpenAIEmbeddings(
    model="deepseek-text-embedding",
    base_url="https://api.deepseek.com/v1",
    api_key="sk-xxxxxxxx",  # 或从环境变量 DEEPSEEK_API_KEY 读取
)

test_vector = embeddings.embed_query("测试文本")
print(f"向量维度: {len(test_vector)}")
```
```python{3-7} [HuggingFace 本地模型]
from langchain_huggingface import HuggingFaceEmbeddings

# 本地运行，无需联网，适合离线场景
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-zh-v1.5",  # 中文优化，维度: 512
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

test_vector = embeddings.embed_query("你好世界")
print(f"向量维度: {len(test_vector)}")  # 512
```
:::

| 方案 | 模型 | 维度 | 适用场景 |
|------|------|------|---------|
| OpenAI | `text-embedding-3-small` | 1536（可降维） | 英文为主，快速上线 |
| OpenAI | `text-embedding-3-large` | 3072（可降维） | 精度要求高 |
| 国产兼容 | DeepSeek / 智谱 / 通义等 | 1024~4096 | 中文为主，国内部署 |
| 本地部署 | `bge-small-zh-v1.5` | 512 | 离线、数据不出域 |

### 2. 句子向量化: embed_query()

`embed_query()` 将单个查询文本转为向量，用于检索时的用户提问向量化。

```python{4-7,9-13}
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=512)

# 单个查询向量化
query = "如何在 Linux 上安装 Docker？"
query_vector = embeddings.embed_query(query)

print(f"查询文本: {query}")
print(f"向量维度: {len(query_vector)}")   # 512
print(f"向量前 5 维: {query_vector[:5]}")  # [0.023, -0.041, 0.015, -0.008, 0.032]
```

`embed_query()` 内部会处理截断、归一化等细节，调用方只需传入文本，拿到向量后直接做相似度计算。

### 3. 文档向量化: embed_documents()

`embed_documents()` 批量将多个文档文本转为向量，用于入库时的文档向量化。**批量调用比逐条调用 embed_query() 效率高很多**——API 一次性处理，减少网络往返。

```python{4-6,8-11,14-17}
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=512)

# 待向量化的文档列表
texts = [
    "Docker 是一个开源的容器化平台。",
    "Kubernetes 用于编排容器集群。",
    "Nginx 是一款高性能的反向代理服务器。",
]

# 批量向量化
doc_vectors = embeddings.embed_documents(texts)

print(f"文档数量: {len(texts)}")
print(f"每个向量维度: {len(doc_vectors[0])}")  # 512

# 验证语义相近的文本向量距离更近
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Docker 和 K8s 语义接近，和 Nginx 相对较远
sim_docker_k8s = cosine_similarity(doc_vectors[0], doc_vectors[1])
sim_docker_nginx = cosine_similarity(doc_vectors[0], doc_vectors[2])
print(f"Docker ↔ K8s 相似度: {sim_docker_k8s:.4f}")    # 更高
print(f"Docker ↔ Nginx 相似度: {sim_docker_nginx:.4f}")  # 更低
```

> `embed_documents()` 内部自动分批处理，单次调用最多支持 2048 条文本。

## 四、向量存储: Milvus

==Milvus=={blue} 是开源高性能向量数据库，专为万亿级向量检索设计。支持多种索引算法（IVF、HNSW 等）、元数据过滤、混合检索，非常适合生产级 RAG 应用。

### 1. 环境准备

使用 Docker 快速启动 Milvus Standalone（单机版），适合开发和小规模生产：

```bash
# 下载 Milvus Standalone docker-compose 配置
wget https://github.com/milvus-io/milvus/releases/download/v2.4.0/milvus-standalone-docker-compose.yml -O docker-compose.yml

# 启动 Milvus（etcd + minio + milvus 三个服务）
docker compose up -d

# 验证服务状态
docker compose ps
# 三个服务状态均为 healthy 即就绪
```

安装 Python SDK：

```bash
pip install pymilvus langchain-milvus
```

### 2. 连接与 Collection 初始化

`MilvusClient` 管理连接，`Collection` 类比关系数据库的表——包含向量字段、标量字段和索引配置。

```python{3-6,9-13,16-24}
from pymilvus import MilvusClient, DataType
from langchain_openai import OpenAIEmbeddings

# 1. 连接 Milvus
client = MilvusClient(uri="http://localhost:19530")
print(f"集合列表: {client.list_collections()}")

# 2. 定义 Collection Schema
if "rag_demo" not in client.list_collections():
    client.create_collection(
        collection_name="rag_demo",
        dimension=512,  # 与嵌入模型输出维度一致
        metric_type="COSINE",  # 相似度度量: L2 / IP / COSINE
        auto_id=True,  # 主键自动生成
    )

print(f"集合 'rag_demo' 已就绪")
```

::: warning
`dimension` 必须与嵌入模型输出的向量维度严格一致。OpenAI `text-embedding-3-small` 如指定 `dimensions=512` 则填 512，否则填 1536。维度不匹配会插入失败。
:::

### 3. 存储文档与相似度检索

LangChain 的 `Milvus` 向量存储封装了 `from_documents()` 和 `similarity_search()` 方法，让文档入库和检索变得简洁：

::: code-group
```python{3,9-10,12-13,15-16,18-22,28,31-37,39} [完整流水线: 加载 → 切分 → 嵌入 → 入库 → 检索]
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_milvus import Milvus

# ===== 步骤 1~2：加载 + 切分 =====
loader = TextLoader("./data/company_faq.txt", encoding="utf-8")
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)
chunks = text_splitter.split_documents(docs)
print(f"切分为 {len(chunks)} 个 chunk")

# ===== 步骤 3~4：嵌入 + 存储 =====
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=512)

vector_store = Milvus.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="rag_demo",
    connection_args={"uri": "http://localhost:19530"},
    drop_old=False,  # True 则每次重建集合
)

print(f"已入库 {len(chunks)} 条文档向量")

# ===== 步骤 5：相似度检索 =====
query = "公司的年假政策是怎样的？"
results = vector_store.similarity_search(
    query=query,
    k=3,  # 返回最相似的 top-K 条结果
)

for i, doc in enumerate(results):
    print(f"\n--- 检索结果 {i+1} ---")
    print(f"内容: {doc.page_content[:150]}...")
    print(f"来源: {doc.metadata.get('source')}")
```
```python{3-6,8-13,15} [带元数据过滤的检索]
# 转换为 Retriever 后支持更灵活的检索配置
retriever = vector_store.as_retriever(
    search_type="similarity",  # 相似度检索
    search_kwargs={
        "k": 3,
        # 元数据过滤：只检索指定分类的文档
        "expr": "category == 'policy' or category == 'hr'",
    },
)

query = "年假可以累积到下一年吗？"
filtered_results = retriever.invoke(query)

print(f"过滤后检索到 {len(filtered_results)} 条结果")
for i, doc in enumerate(filtered_results):
    print(f"[{i+1}] {doc.metadata.get('category')} | {doc.page_content[:100]}...")
```
:::

| 检索参数 | 说明 |
|----------|------|
| `k` | 返回的 top-K 条相似文档，默认 4 |
| `search_type` | `"similarity"`（默认，余弦相似度）、`"mmr"`（最大边际相关，增加结果多样性） |
| `expr` | 标量过滤表达式，语法类似 SQL WHERE，支持 `==`、`!=`、`in`、`like` 等运算符 |
| `score_threshold` | 相似度阈值，低于此值的结果丢弃（仅 `similarity_score_threshold` 模式可用） |

## 五、接入 ChatModel 生成回答

检索完成后，将相关文档拼接进提示词，交给 ChatModel 生成最终回答：

```python{3,6-11,14-20,22-24,26-28}
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 检索相关文档
query = "年假怎么申请？"
retrieved_docs = vector_store.similarity_search(query, k=3)

# 拼接检索上下文
context = "\n\n".join([doc.page_content for doc in retrieved_docs])

# 构建 RAG 提示词
prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个知识库助手。请仅根据以下提供的文档内容回答问题。
如果文档中没有相关信息，请明确说"根据现有文档，无法回答该问题"。

==相关文档==
{context}"""),
    ("user", "{question}"),
])

# 生成回答
model = ChatOpenAI(model="gpt-4o-mini")
chain = prompt | model

response = chain.invoke({
    "context": context,
    "question": query,
})

print(f"问题: {query}")
print(f"回答: {response.content}")
```

::: tip 提示词设计要点
RAG 提示词的核心约束有三条：
1. **明确信息来源**：要求模型"仅根据提供的文档回答"，减少幻觉
2. **诚实兜底**：文档无相关信息时明确告知，而非编造
3. **保留引用**：必要时要求模型注明引用来源，方便人工核对
:::

## 小结

本文覆盖了 RAG 完整流水线的四个核心环节：

- ==文档加载器==：TextLoader / CSVLoader / JSONLoader 覆盖常见本地数据格式，所有 Loader 统一输出 `Document` 对象
- ==文本切分器==：`RecursiveCharacterTextSplitter` 按分隔符优先级递归切分，`chunk_size` 和 `chunk_overlap` 是决定检索质量的核心参数
- ==嵌入模型==：`embed_query()` 向量化用户提问，`embed_documents()` 批量向量化文档，通过 LangChain 统一接口自由切换模型厂商
- ==Milvus 向量存储==：`from_documents()` 一键入库，`similarity_search()` 相似度检索，`as_retriever()` 支持元数据过滤和 MMR 多样性检索

掌握这条流水线，就能从零搭建一个可用的企业知识库问答系统。下一步可以探索 **MMR 检索**（增加结果多样性）、**多轮检索**（粗筛 + 精排）和 **RAG + Agent**（检索作为工具嵌入 Agent 决策循环）等进阶方向。

:::info 📖 相关资源
- [LangChain RAG 教程](https://python.langchain.com/docs/tutorials/rag/) — 官方 RAG 快速入门
- [LangChain Document Loaders](https://python.langchain.com/docs/how_to/#document-loaders) — 所有内置 Loader 汇总
- [RecursiveCharacterTextSplitter API](https://python.langchain.com/api_reference/text_splitters/character/langchain_text_splitters.character.RecursiveCharacterTextSplitter.html) — 切分器完整参数参考
- [LangChain Embeddings](https://python.langchain.com/docs/concepts/embedding_models/) — 嵌入模型概念与使用
- [Milvus 官方文档](https://milvus.io/docs/zh/overview.md) — 向量数据库中文文档
- [pymilvus GitHub](https://github.com/milvus-io/pymilvus) — Milvus Python SDK
- [langchain-milvus 集成](https://python.langchain.com/docs/integrations/vectorstores/milvus/) — LangChain × Milvus 集成文档
:::
