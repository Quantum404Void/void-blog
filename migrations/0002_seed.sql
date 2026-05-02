INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('about', '关于 void.dev', '一个程序员的技术折腾记录，不定期更新，不限定领域，只要值得写就写。', '## whoami

```bash
$ whoami
王宇 | Software Engineer

$ cat /proc/self/status | grep -i name
Name: 好奇心驱动的工程师

$ history | grep -c "折腾"
无数次
```

喜欢研究技术背后的原理，也喜欢把东西做出来、做好用。

## 这里写什么

没有固定方向。碰到值得记的就写，包括但不限于：

- **系统与底层**：操作系统、驱动、通信协议、性能调优
- **桌面应用**：Windows/Linux 跨平台、Electron、C++/Qt
- **前端工程**：Vue3、Vite+、现代工具链、TypeScript
- **AI Agent**：LLM 工具链、自动化工作流、记忆系统
- **网络与工具**：代理协议、开发效率工具
- **算法**：不为刷题，为理解

不灌水，不追热点，不水文章。

## 联系

有问题或想聊，欢迎：

- GitHub: [Quantum505Void](https://github.com/Quantum505Void)
- 邮箱: [moke521_wang@163.com](mailto:moke521_wang@163.com)

## 本站技术栈

```bash
$ cat package.json | jq ''.dependencies | keys[]''
"astro"         # v6 — Islands 架构
"tailwindcss"   # v4 — CSS-first 配置
"vue"           # v3 — 交互 Islands
"mermaid"       # 流程图
"chart.js"      # 动态图表
"pagefind"      # 全文搜索
```

[源码在 GitHub](https://github.com/Quantum505Void/void-blog) — MIT 协议，随便用。', '2026-04-30', '["intro","meta"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('ai-agent-memory', 'AI Agent 的记忆系统：从上下文窗口到长期记忆', '深入拆解 AI Agent 的四种记忆类型、上下文窗口压缩策略、RAG 向量检索原理，以及三种典型失败模式和工程选型建议。', 'import Chart from ''../../components/Chart.vue''

export const embeddingRadarData = {
  labels: [''延迟'', ''成本效益'', ''隐私'', ''质量'', ''维护简便''],
  datasets: [
    {
      label: ''本地'',
      data: [5, 5, 5, 3, 2],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(0,212,255,0.9)'',
    },
    {
      label: ''云端'',
      data: [2, 2, 1, 5, 5],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,0,170,0.9)'',
    },
  ],
}

export const embeddingRadarOptions = {
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: { display: false, stepSize: 1 },
      grid: { color: ''rgba(136,136,170,0.25)'' },
      angleLines: { color: ''rgba(136,136,170,0.25)'' },
      pointLabels: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 11 } },
    },
  },
}

你有没有遇到过这种情况：和 AI 聊了很长的上下文之后，它突然"忘记"了前面说过的事情——不是因为它不聪明，而是因为它的记忆系统到达了物理上限。

记忆是 Agent 区别于普通 LLM 调用的核心能力之一。但"记忆"在工程上远比听起来复杂。

---

## 四种记忆类型

认知科学把人类记忆分为工作记忆、情节记忆、语义记忆等类型。AI Agent 的记忆系统有类似的分层：

### 1. In-context Memory（短期/工作记忆）

最基础的记忆形式——就是模型的**上下文窗口（Context Window）**。

- 容量：GPT-4 128K tokens，Claude 3.5 200K tokens，Gemini 1.5 Pro 1M tokens
- 速度：最快，直接参与推理
- 持久性：**零**，会话结束即消失
- 本质：把需要"记住"的内容全部塞进 prompt

这是 Agent 的默认记忆模式，也是最大的瓶颈所在。

### 2. External DB Memory（长期记忆）

把信息持久化到外部存储，需要时检索回来。

- **向量数据库**（Pinecone、Weaviate、Chroma、Qdrant）：语义检索
- **传统数据库**（PostgreSQL、Redis）：精确查询
- **文件系统**：结构化文档存储

这是 RAG（Retrieval-Augmented Generation）的基础。

### 3. Episodic Memory（情节记忆）

记录"发生过什么"——具体的交互历史、任务执行轨迹。

类比人类：你不记得所有知识是怎么学到的，但你记得"上周我做了一个项目，遇到了这个问题，用这个方法解决了"。

Agent 的情节记忆通常存储：
- 过去的对话摘要
- 任务执行日志
- 错误和修复记录

### 4. Semantic Memory（语义记忆）

长期积累的**知识和事实**，不依附于具体情节。

类比人类：你知道"Python 的 GIL 是什么"，但你不记得是什么时候学的。

Agent 的语义记忆通常是：
- 微调进模型权重（最彻底，但昂贵）
- 知识库文档（通过 RAG 访问）
- 系统提示中的固定知识

---

## 上下文窗口：本质限制与压缩策略

即使是 1M tokens 的超长上下文，也有用完的一天。更实际的问题是：长上下文不仅有容量限制，还有**推理质量下降**的问题。

研究表明，当关键信息被埋在超长上下文的中间时，模型表现会显著变差（"Lost in the Middle"现象）。

### 常见压缩策略

**滑动窗口（Sliding Window）**

```
[系统提示] [最近 N 轮对话] → 超出部分直接丢弃
```

最简单粗暴。缺点：丢失的信息无法恢复。适合对话连贯性要求不高的场景。

**摘要压缩（Summary Compression）**

```
当上下文超过阈值时：
旧对话 → LLM 生成摘要 → 摘要替换原始对话
```

保留了语义信息，损失了细节。适合长对话的渐进式压缩。

**重要性排序（Importance Ranking）**

```
对上下文中的每段信息打分 → 保留高分内容 → 丢弃低分内容
```

可以基于规则（包含关键词）或模型评分。更精细，但计算开销大。

**层级记忆（Hierarchical Memory）**

```
工作记忆（最近 N 轮）
    ↓ 定期 consolidate
情节记忆（摘要 + 关键事件）
    ↓ 提炼
语义记忆（核心知识/偏好）
```

模拟人类记忆的自然层级。MemGPT 是这一思路的代表实现。

---

## RAG：用向量数据库实现外部记忆

RAG（Retrieval-Augmented Generation）是当前最主流的 Agent 长期记忆方案。

### 工作原理

**写入阶段（Indexing）**：

```
原始文档（PDF/网页/代码）
    ↓ 切片（Chunking）
文本块（512 tokens 左右）
    ↓ Embedding 模型
向量（1536 维浮点数组）
    ↓ 写入
向量数据库（存储向量 + 原始文本）
```

**检索阶段（Retrieval）**：

```
用户查询："Python 如何处理并发？"
    ↓ 同一 Embedding 模型
查询向量
    ↓ cosine similarity 计算
向量数据库返回 top-k 最相似文本块
    ↓ 注入上下文
[系统提示 + 检索到的文档 + 用户问题] → LLM
```

### Embedding 的本质

Embedding 把文本映射到高维向量空间，**语义相近的文本在向量空间中距离更近**。

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer(''BAAI/bge-m3'')  # 支持中文的模型

texts = [
    "Python 处理并发的方式",
    "如何用 asyncio 写异步代码",
    "今天天气真好"
]

embeddings = model.encode(texts)
# embeddings[0] 和 embeddings[1] 的余弦相似度会远高于和 embeddings[2]
```

Cosine similarity 公式：

```
similarity(A, B) = (A · B) / (|A| × |B|)
```

值域 [-1, 1]，1 表示完全相同，0 表示无关，-1 表示相反。

---

## 记忆写入时机：何时 Consolidate

不是所有信息都值得存入长期记忆。关键决策点：

| 触发条件 | 写入内容 | 存储类型 |
|----------|----------|----------|
| 用户明确说"记住这个" | 原始信息 | 情节/语义记忆 |
| 任务成功完成 | 执行摘要 + 关键决策 | 情节记忆 |
| 发现用户偏好/习惯 | 偏好描述 | 语义记忆 |
| 上下文窗口达到 70% | 旧对话摘要 | 情节记忆 |
| 遇到错误并修复 | 错误模式 + 修复方法 | 语义记忆 |

**不应该写入**：中间推理步骤、临时变量、冗余信息。

---

## 三种典型失败模式

### 失败模式 1：记忆爆炸（Memory Explosion）

症状：把所有东西都写进长期记忆，没有淘汰机制，检索结果越来越噪。

根本原因：缺少**重要性评估**和**过期清理**机制。

解决：设置 TTL（Time To Live），低相关度内容定期清理；写入时评估重要性得分。

### 失败模式 2：记忆遗忘（Memory Amnesia）

症状：明明存了信息，需要时却检索不到。

常见原因：
- Chunking 策略不当（上下文被切断在块边界）
- 查询和文档的 embedding 语义漂移（问法和存法不一致）
- top-k 值太小，相关内容排在 k 之后被截断

解决：调整 chunk 大小和重叠度；使用 HyDE（Hypothetical Document Embedding）增强查询；增大 top-k 后用 reranker 精选。

### 失败模式 3：记忆污染（Memory Poisoning）

症状：错误信息被存入记忆，后续推理被持续误导。

场景：Agent 执行失败但误判为成功，把错误结论写入记忆；用户故意输入误导信息。

解决：写入长期记忆前增加验证步骤；高风险信息标记置信度；支持记忆修正机制。

---

## 工程选型：本地 Embedding vs 云端 API

| 维度 | 本地（sentence-transformers） | 云端（OpenAI / 智谱 / 硅基流动） |
|------|-------------------------------|----------------------------------|
| 延迟 | 低（GPU 上 \<10ms/chunk） | 高（网络 RTT + 排队，50–200ms） |
| 成本 | 一次性硬件投入 | 按 token 计费 |
| 隐私 | 完全本地，数据不出境 | 数据上传第三方 |
| 质量 | 中文：BGE-M3 ≈ OpenAI ada-002 | OpenAI text-embedding-3-large 最强 |
| 维护 | 需要自己管理模型更新 | 零维护 |

<Chart client:only="vue" type="radar" data={embeddingRadarData} options={embeddingRadarOptions} height={260} />

**推荐组合**：

- 隐私敏感 / 本地部署：`BAAI/bge-m3` + Qdrant（本地 Docker）
- 快速原型 / 质量优先：OpenAI `text-embedding-3-small` + Pinecone
- 中文场景 + 性价比：智谱 embedding-3 + Chroma

```python
# 本地方案示例
from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer(''BAAI/bge-m3'')
client = chromadb.Client()
collection = client.create_collection("agent_memory")

def remember(text: str, metadata: dict):
    embedding = model.encode(text).tolist()
    collection.add(
        documents=[text],
        embeddings=[embedding],
        metadatas=[metadata],
        ids=[f"mem_{hash(text)}"]
    )

def recall(query: str, top_k: int = 5) -> list[str]:
    query_embedding = model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )
    return results[''documents''][0]
```

---

## 总结

Agent 的记忆系统是一个工程问题，不只是 API 调用问题。设计时需要回答：

1. 哪些信息需要长期保存？（重要性评估）
2. 如何在需要时找到它？（检索策略）
3. 如何防止记忆腐烂和污染？（生命周期管理）

没有完美的记忆系统，只有适合当前任务的记忆系统。从最简单的滑动窗口开始，按需增加复杂度——这是最务实的工程路径。', '2026-04-30', '["AI","agent","RAG","memory"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('ai-agent-what-is', '什么是 AI Agent？从 LLM 到自主执行', 'LLM 本身是无状态问答机，Agent 是什么让它’动’起来的？本文深入解析 Agent 的四个核心能力、ReAct 框架、工具调用原理，以及主流框架横向对比。', 'import Mermaid from ''../../components/Mermaid.astro''
import Chart from ''../../components/Chart.vue''

export const paradigmRadarData = {
  labels: [''适应性'', ''可靠性'', ''工具能力'', ''控制灵活性''],
  datasets: [
    {
      label: ''Chatbot'',
      data: [1, 5, 2, 1],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(0,212,255,0.9)'',
    },
    {
      label: ''Workflow'',
      data: [2, 5, 3, 2],
      backgroundColor: ''rgba(57,255,20,0.2)'',
      borderColor: ''rgba(57,255,20,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(57,255,20,0.9)'',
    },
    {
      label: ''Agent'',
      data: [5, 2, 5, 5],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,0,170,0.9)'',
    },
  ],
}

export const paradigmRadarOptions = {
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: { display: false, stepSize: 1 },
      grid: { color: ''rgba(136,136,170,0.25)'' },
      angleLines: { color: ''rgba(136,136,170,0.25)'' },
      pointLabels: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 11 } },
    },
  },
}

export const frameworkBarData = {
  labels: [''LangChain'', ''LlamaIndex'', ''AutoGen'', ''OpenClaw'', ''Dify''],
  datasets: [
    {
      label: ''上手难度'',
      data: [3, 3, 2, 4, 5],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
    },
    {
      label: ''工具生态'',
      data: [5, 4, 3, 3, 4],
      backgroundColor: ''rgba(57,255,20,0.2)'',
      borderColor: ''rgba(57,255,20,0.9)'',
      borderWidth: 2,
    },
    {
      label: ''社区活跃度'',
      data: [5, 4, 4, 3, 3],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
    },
  ],
}

export const frameworkBarOptions = {
  indexAxis: ''y'',
  scales: {
    x: {
      ticks: { color: ''#8888aa'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    },
    y: {
      ticks: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { display: false },
      border: { display: false },
    },
  },
}

第一次接触 AI 的人，大概都会感叹：这玩意儿真聪明。但用久了你会发现一个根本限制——它只会**说**，不会**做**。

你问它"帮我发封邮件"，它会给你写好草稿，然后说"你可以把这段文字复制到邮件客户端发送"。

这就是 LLM 和 Agent 的核心区别。

---

## LLM 是什么：一台无状态的预测机器

大语言模型的本质是一个条件概率函数：给定一段文本，预测下一个 token 最可能是什么。它没有记忆（每次对话都是从零开始），没有持久状态，更没有办法主动触发任何副作用。

```
输入 tokens → Transformer 前向传播 → 输出 tokens
```

这个过程是纯函数式的——相同输入（温度为 0 时）得到相同输出，不会对外部世界产生任何影响。

那么，Agent 是什么让 LLM "动"起来的？

---

## Agent 的四个核心能力

一个完整的 AI Agent 围绕 LLM 构建了四层能力：

### 1. 感知（Perception）

Agent 能接收多种形式的输入：文字、图片、文件内容、网页、API 返回值、代码执行结果……

这不是 LLM 原生支持的——需要一层**输入处理管道**，把外部世界的信号转换成 token 序列送给模型。

### 2. 记忆（Memory）

LLM 的上下文窗口是它唯一的"工作记忆"。一旦超出窗口大小，早期信息就被截断了。

Agent 通过外部存储（向量数据库、文件、KV store）实现长期记忆，并在需要时检索相关内容注入上下文。

### 3. 规划（Planning）

面对一个复杂任务，LLM 需要把它分解成可执行的步骤。这包括：

- **任务分解**：把"帮我整理这份报告"拆成若干子任务
- **自我反思**：执行结果不符合预期时，重新规划
- **依赖管理**：哪些步骤可以并行，哪些必须串行

### 4. 行动（Action / Tool Use）

这是最关键的一环。Agent 通过**工具调用**与外部世界交互：

- 读写文件
- 执行代码
- 调用 API
- 浏览网页
- 发送消息

工具调用把 LLM 从"只会说"变成了"能做"。

---

## ReAct：驱动 Agent 运转的核心框架

ReAct（Reasoning + Acting）是目前最主流的 Agent 执行框架，2022 年由 Google 提出。

其核心思路是让 LLM 在**推理**和**行动**之间交替循环：

```
Thought: 我需要知道今天的天气，让我调用天气 API
Action: get_weather(city="上海")
Observation: {"temp": 22, "condition": "晴"}
Thought: 天气不错，现在我可以回答用户了
Answer: 上海今天晴天，22°C，适合出行
```

每一轮：
1. **Thought**：模型输出推理过程（Chain-of-Thought）
2. **Action**：模型决定调用哪个工具，参数是什么
3. **Observation**：工具执行结果反馈给模型
4. 循环直到任务完成或达到最大步数

这个循环的关键洞察是：**让模型先想清楚再行动，行动结果再反哺思考**。

<Mermaid code={`
flowchart TD
    U([用户输入]) --> T[Thought\n推理意图]
    T --> D{需要工具?}
    D -- 是 --> A[Action\n调用工具]
    A --> O[Observation\n获得结果]
    O --> T
    D -- 否 --> R([输出答案])
    style U fill:#1e1e30,stroke:#00ff88,color:#e8e8f0
    style R fill:#1e1e30,stroke:#00ff88,color:#e8e8f0
    style T fill:#13131f,stroke:#00d4ff,color:#e8e8f0
    style A fill:#13131f,stroke:#b44cff,color:#e8e8f0
    style O fill:#13131f,stroke:#b44cff,color:#e8e8f0
    style D fill:#0f0f1a,stroke:#00d4ff,color:#e8e8f0
`} />

---

## Tool Use 原理：Function Calling

工具调用在技术上是怎么实现的？以 OpenAI 的 Function Calling 为例：

```json
// 工具描述（JSON Schema）
{
  "name": "read_file",
  "description": "读取本地文件内容",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "文件路径，绝对路径或相对路径"
      }
    },
    "required": ["path"]
  }
}
```

你把工具描述（一组 JSON Schema）和用户消息一起发给模型，模型如果判断需要用工具，会返回一个结构化的调用指令：

```json
{
  "tool_calls": [{
    "function": {
      "name": "read_file",
      "arguments": "{\"path\": \"/tmp/report.txt\"}"
    }
  }]
}
```

你的代码负责实际执行这个调用，把结果作为 `tool` 角色消息返回给模型，模型继续推理。

**模型本身并不执行任何代码**——它只是输出结构化的"意图"，宿主程序负责执行。

---

## Agent vs Chatbot vs Workflow

这三个词经常被混用，但有本质区别：

| 维度 | Chatbot | Workflow | Agent |
|------|---------|----------|-------|
| 控制流 | 单轮问答 | 预定义流程 | 动态规划 |
| 工具调用 | 无或有限 | 固定步骤 | 自主决策 |
| 适应性 | 低 | 低 | 高 |
| 可靠性 | 高 | 高 | 较低 |
| 适用场景 | 问答/创作 | ETL/自动化 | 复杂开放任务 |

Workflow 适合**已知流程**的自动化——你知道第一步做什么、第二步做什么。  
Agent 适合**未知路径**的任务——你只知道目标，具体怎么达到由模型决定。

<Chart client:only="vue" type="radar" data={paradigmRadarData} options={paradigmRadarOptions} height={260} />

---

## 一个完整执行例子：文件操作 Agent

任务：「找出 `/tmp/logs/` 下所有包含 ERROR 的日志文件，统计每个文件的错误数量，写成报告」

```
用户: 找出 /tmp/logs/ 下所有包含 ERROR 的日志文件，统计每个文件的错误数量，写成报告

[Thought] 我需要先列出 /tmp/logs/ 目录下的所有文件
[Action] list_directory(path="/tmp/logs/")
[Observation] ["app.log", "access.log", "error.log", "worker.log"]

[Thought] 现在逐个检查哪些文件包含 ERROR
[Action] search_in_file(path="/tmp/logs/app.log", pattern="ERROR")
[Observation] 找到 23 处匹配

[Action] search_in_file(path="/tmp/logs/access.log", pattern="ERROR")
[Observation] 找到 0 处匹配

[Action] search_in_file(path="/tmp/logs/error.log", pattern="ERROR")
[Observation] 找到 157 处匹配

[Action] search_in_file(path="/tmp/logs/worker.log", pattern="ERROR")
[Observation] 找到 8 处匹配

[Thought] access.log 没有 ERROR，其他三个有。现在生成报告。
[Action] write_file(path="/tmp/error_report.md", content="# 错误统计报告\n...")
[Observation] 文件写入成功

[Answer] 报告已生成至 /tmp/error_report.md，共 3 个文件包含错误：
- error.log: 157 处
- app.log: 23 处  
- worker.log: 8 处
```

整个过程中，**模型决定了执行路径**，而不是程序员预先写好的固定流程。

---

## 主流框架横向对比

| 框架 | 语言 | 定位 | 工具生态 | 上手难度 |
|------|------|------|----------|----------|
| **LangChain** | Python/JS | 全栈 Agent 框架 | 极丰富（600+ 集成） | 中，文档庞杂 |
| **LlamaIndex** | Python | 以 RAG/数据为核心 | 丰富（侧重数据连接） | 中 |
| **AutoGen** | Python | 多 Agent 对话框架 | 中等 | 较高，概念多 |
| **OpenClaw** | Node.js | 本地 Agent 运行时 | 中（插件/技能体系） | 低，配置驱动 |
| **Dify** | Python | 可视化低代码平台 | 丰富（含工作流） | 低，GUI 操作 |

**选型建议**：
- 快速原型 / 非技术团队 → **Dify**
- Python 重度用户，RAG 场景 → **LlamaIndex**
- 复杂多 Agent 协作 → **AutoGen**
- 本地私有化、系统集成 → **OpenClaw**
- 最广泛生态 → **LangChain**（但注意 API 频繁变动）

<Chart client:only="vue" type="bar" data={frameworkBarData} options={frameworkBarOptions} height={280} />

> **注**：上图为作者主观评分（1=最低，5=最高），仅供参考。上手难度、工具生态、社区活跃度随版本迭代持续变化，以各框架官方文档为准。

---

## 总结

LLM 是 Agent 的大脑，但光有大脑还不够。Agent 是在 LLM 外面包了一层**执行环境**：

```
外部世界 ←→ [工具层] ←→ [记忆层] ←→ [规划层] ←→ LLM
```

ReAct 循环驱动这个系统持续运转，直到任务完成。

理解 Agent 的关键认知转变是：**从「问答」到「委托」**。你不再是在和一个聊天机器人对话，而是在给一个能动的执行者下达目标。', '2026-04-30', '["AI","agent","LLM"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('algorithm-binary-search', '二分查找：永远写不对？记住这个模板', '彻底搞清楚二分查找的边界问题：闭区间和左闭右开两套模板、三道经典 LeetCode 题目完整 C++ 实现，以及二分答案的进阶思路。', '二分查找是每个程序员都"会"但总写错的算法。

不是概念不懂——找中点、比大小、缩范围，谁都明白。问题在于：`left <= right` 还是 `left < right`？`mid + 1` 还是 `mid`？退出循环后要不要再检查一次？

死记硬背不可靠。真正的解法是**理解每套模板背后的不变式**，然后推导出所有边界条件。

---

## 为什么总写错

根本原因是**区间语义不统一**。

二分查找维护一个搜索区间，每次把目标缩小到区间的一半。但"区间"有两种表示方法：
- **闭区间** `[left, right]`：两端都可能是答案
- **左闭右开** `[left, right)`：`right` 是开边界，不在搜索范围内

这两种表示导致循环条件、`mid` 更新方式、终止后的处理全都不一样。混用就出 bug。

**选一套，理解它，用到底。**

---

## 模板一：闭区间 `[left, right]`

```cpp
int binarySearch(vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;  // 闭区间 [left, right]

    while (left <= right) {  // 注意：<=，因为 left==right 时区间 [left,left] 仍有一个元素
        int mid = left + (right - left) / 2;  // 防止 (left+right) 溢出

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;   // target 在右半部分，[mid+1, right]
        } else {
            right = mid - 1;  // target 在左半部分，[left, mid-1]
        }
    }

    return -1;  // 未找到
}
```

**关键推导**：
- `while (left <= right)`：当 `left > right` 时区间为空，退出
- `left = mid + 1`：已经确认 `nums[mid] < target`，`mid` 不可能是答案，所以直接排除
- `right = mid - 1`：同理，`mid` 不可能是答案

适合：**确定性查找**（找到就返回，找不到返回 -1）

---

## 模板二：左闭右开 `[left, right)`

```cpp
int binarySearch(vector<int>& nums, int target) {
    int left = 0, right = nums.size();  // 左闭右开 [left, right)

    while (left < right) {  // 注意：<，因为 left==right 时区间为空
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;  // target 在 [mid+1, right)
        } else {
            right = mid;     // target 在 [left, mid)，注意不是 mid-1
        }
    }

    return -1;
}
```

**关键推导**：
- `right = nums.size()`（而不是 `size - 1`），因为右端是开区间
- `while (left < right)`：`left == right` 时区间为空
- `right = mid`（不是 `mid - 1`）：因为右端是开区间，`mid` 本来就不在搜索范围内

这个模板在**寻找边界**时更自然，退出循环后 `left` 就是插入位置。

---

## 例题 1：标准二分（LeetCode 704）

> 给定升序整数数组 nums 和目标值 target，返回 target 的下标，不存在返回 -1。

直接套闭区间模板：

```cpp
class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = (int)nums.size() - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }

        return -1;
    }
};
```

---

## 例题 2：搜索插入位置（LeetCode 35）

> 给定排序数组和目标值，在数组中找到目标值并返回下标。如果不存在，返回它将被按顺序插入的位置。

这道题要找的是**第一个 ≥ target 的位置**，用左闭右开模板最顺手：

```cpp
class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int left = 0, right = (int)nums.size();  // 插入位置可以是末尾，所以 right 取 size

        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] < target) {
                left = mid + 1;   // target 在右边
            } else {
                right = mid;      // nums[mid] >= target，mid 可能就是答案，不排除
            }
        }

        // 循环结束时 left == right，就是插入位置
        return left;
    }
};
```

**走一遍**：`nums = [1,3,5,6], target = 5`

```
left=0, right=4
mid=2, nums[2]=5 >= 5, right=2
left=0, right=2
mid=1, nums[1]=3 < 5, left=2
left=2, right=2, 退出
返回 2 ✓
```

---

## 例题 3：查找第一个和最后一个位置（LeetCode 34）

> 在排序数组中找到目标值的第一个和最后一个位置，不存在返回 `[-1, -1]`。

这是二分的经典进阶：找**左边界**和**右边界**。

```cpp
class Solution {
public:
    // 找第一个 >= target 的位置（左边界）
    int lowerBound(vector<int>& nums, int target) {
        int left = 0, right = (int)nums.size();
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] < target) left = mid + 1;
            else right = mid;  // nums[mid] >= target，保留
        }
        return left;  // 第一个 >= target 的位置
    }

    vector<int> searchRange(vector<int>& nums, int target) {
        int first = lowerBound(nums, target);

        // 检查 first 是否有效
        if (first == (int)nums.size() || nums[first] != target) {
            return {-1, -1};
        }

        // 最后一个 target 的位置 = 第一个 > target 的位置 - 1
        int last = lowerBound(nums, target + 1) - 1;

        return {first, last};
    }
};
```

**核心技巧**：把找右边界转化为「找 `target+1` 的左边界然后 -1」，这样只需要一个 `lowerBound` 函数。

---

## 二分答案：不只是找元素

二分查找不只能用在数组上——**任何具有单调性的答案空间**都可以二分。

思路：不是在数组中找某个值，而是把「答案」本身作为搜索对象。

**例：木材切割问题**

> 给定 n 根木材的长度，需要切出 k 根长度为 L 的木材。找最大可行的 L。

暴力：枚举所有可能的 L（1 到 max），检查能否切出 k 根 → O(max × n)

二分答案：L 越大，能切出的根数越少（单调性）→ 对 L 进行二分

```cpp
// 判断给定长度 L，能切出多少根
long long countPieces(vector<int>& logs, long long L) {
    long long count = 0;
    for (int log : logs) count += log / L;
    return count;
}

int maxLength(vector<int>& logs, int k) {
    long long left = 1, right = *max_element(logs.begin(), logs.end());
    long long ans = 0;

    while (left <= right) {
        long long mid = left + (right - left) / 2;
        if (countPieces(logs, mid) >= k) {
            ans = mid;       // mid 可行，尝试更大
            left = mid + 1;
        } else {
            right = mid - 1;  // mid 不可行，缩小
        }
    }

    return (int)ans;
}
```

**二分答案的适用判断**：
1. 答案在某个范围内
2. 存在单调性：答案越大（或越小），某个条件越难（或越容易）满足
3. 有一个 O(n) 或更快的 `check(x)` 函数

经典题型：最小化最大值、最大化最小值、K 个分组的最优切分。

---

## 两套模板对比

| | 闭区间 `[l, r]` | 左闭右开 `[l, r)` |
|--|--|--|
| 初始化 | `right = n - 1` | `right = n` |
| 循环条件 | `left <= right` | `left < right` |
| 缩小右边界 | `right = mid - 1` | `right = mid` |
| 退出后 | 未找到返回 -1 | `left` 即插入/边界位置 |
| 适合 | 精确查找 | 边界查找、插入位置 |

**记忆口诀**：左闭右开时，右端永远是「未来的 right」，所以 `right = mid`（不减 1）；退出后 left 就是答案位置，不需要额外检查。

---

## 总结

二分查找的边界问题有且只有一个解法：**选定区间语义，严格遵守不变式**。

- 闭区间：`[left, right]` 都可能是答案，循环条件 `<=`，更新时两端都要 ±1
- 左闭右开：`right` 是边界外，循环条件 `<`，更新 right 时直接赋 `mid`

选一套，理解为什么，剩下的推导就会水到渠成。', '2026-04-30', '["算法","二分查找","leetcode","cpp"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('algorithm-number-complement', '整数的补数：位运算掩码解法', 'LeetCode 476 题，用掩码 XOR 实现整数补数，附 C++/Python/Java 三种实现及补数与补码的区别', '## 题目

> 对整数的二进制表示取反（0 变 1，1 变 0），再转换为十进制，得到该整数的**补数**。  
> 例如：5 的二进制是 `101`，取反后 `010` = 2，所以 5 的补数是 2。  
> 注意：不含前导零。给定 `1 <= num < 2^31`，输出其补数。

## 思路

直觉是逐位翻转，但更优雅的方法是构造一个**掩码 mask**：

1. 找到 `num` 的最高有效位，构造一个同等位数全为 `1` 的掩码。
2. `num XOR mask` 即为补数（因为 `x XOR 1 = ~x`，`x XOR 0 = x`）。

例如 `num = 5`（二进制 `101`）：
- mask = `111`（十进制 7）
- `5 XOR 7 = 101 XOR 111 = 010 = 2` ✓

**如何构造 mask？**

```
mask 从 1 开始，不断左移并 OR，直到 mask >= num：
mask = 1
while mask < num:
    mask = (mask << 1) | 1

// 或等价地：
mask = (1 << bit_length(num)) - 1
```

## 为什么不能直接用 `~num`

C++ 里 `~` 是**按位取反**，会翻转整数的**全部 32 位**（或 64 位），包括前导零。

```cpp
int num = 5;        // 0000 0000 0000 0000 0000 0000 0000 0101
int result = ~num;  // 1111 1111 1111 1111 1111 1111 1111 1010
// result = -6（有符号整数，补码表示）
```

题目要求的是只翻转**有效位**（去掉前导零的那几位），所以 `~5` 得到 `-6`，不是 `2`。

这就是掩码方案存在的意义：先把无效的高位都遮掉，只对有效位做 XOR。

```cpp
// num = 5: 有效位是 3 位（101）
// mask = 111 = 7
// num ^ mask = 101 ^ 111 = 010 = 2  ✅
// ~num       = ...11111010 = -6     ❌
```

## 实现

### C++

```cpp
class Solution {
public:
    int findComplement(int num) {
        // 构造掩码：找到 num 的最高位，mask 全为 1
        unsigned int mask = 1;
        while (mask < (unsigned int)num) {
            mask = (mask << 1) | 1;
        }
        return num ^ mask;
    }
};
```

**更优雅的写法**：用 `__builtin_clz`（GCC/Clang 内置，Count Leading Zeros）：

```cpp
class Solution {
public:
    int findComplement(int num) {
        // __builtin_clz(num) 返回 32 位整数中前导零的个数
        // 32 - clz = 有效位数
        // (1 << 有效位数) - 1 就是全 1 掩码
        int mask = (1 << (32 - __builtin_clz(num))) - 1;
        return num ^ mask;
    }
};
```

例：`num = 5`（二进制 `101`）
- `__builtin_clz(5)` = 29（64 位环境是 61，这里按 32 位讨论）
- `32 - 29 = 3`（有效位数）
- `(1 << 3) - 1 = 7`（`0111`，全 1 掩码）
- `5 ^ 7 = 2` ✅

> **注意**：`__builtin_clz(0)` 是未定义行为，题目保证 `num >= 1`，所以安全。

### Python

```python
class Solution:
    def findComplement(self, num: int) -> int:
        # bit_length() 返回二进制表示的位数（不含前导零）
        # 例：(5).bit_length() = 3
        mask = (1 << num.bit_length()) - 1
        return num ^ mask
```

Python 整数是任意精度，没有 32 位截断问题，`bit_length()` 天然只算有效位，非常干净。

### Java

```java
class Solution {
    public int findComplement(int num) {
        // Integer.highestOneBit 找最高位，构造掩码
        int mask = Integer.highestOneBit(num);
        mask = (mask << 1) - 1; // 例如 highestOneBit(5)=4，(4<<1)-1=7
        return num ^ mask;
    }
}
```

## 复杂度

- **时间**：O(log n)，循环次数等于 num 的二进制位数。`__builtin_clz` / `bit_length()` 方案是 O(1)。
- **空间**：O(1)。

## 补数 vs 补码

这两个概念容易混淆：

| | 定义 | 例子（8 位） |
|--|------|------------|
| **补数**（本题）| 二进制取反，不含前导零 | 5 (`101`) → 2 (`010`) |
| **反码** | 所有位取反（含符号位） | 5 (`00000101`) → `11111010` |
| **补码** | 反码 + 1，用于表示负数 | -5 的补码 = `11111011` |

本题的"补数"只对有效位取反，和计算机组成原理里的补码是不同概念。

## 举一反三：同类位运算题

掌握了掩码 + XOR 的思路，以下题型都是变体：

| 题目 | 核心技巧 |
|------|---------|
| [LeetCode 461 - 汉明距离](https://leetcode.cn/problems/hamming-distance/) | `x ^ y` 后数 1 的个数 |
| [LeetCode 191 - 位 1 的个数](https://leetcode.cn/problems/number-of-1-bits/) | `x & (x-1)` 循环消最低位 |
| [LeetCode 136 - 只出现一次的数字](https://leetcode.cn/problems/single-number/) | `x ^ x = 0`，全部 XOR 消掉成对的数 |
| [LeetCode 260 - 只出现一次的数字 III](https://leetcode.cn/problems/single-number-iii/) | 差异位分组，各组 XOR |
| [LeetCode 693 - 交替位二进制数](https://leetcode.cn/problems/binary-number-with-alternating-bits/) | `n & (n >> 1)` 判断相邻位是否相同 |
| [LeetCode 1009 - 十进制整数的反码](https://leetcode.cn/problems/complement-of-base-10-integer/) | 本题完全相同，只是描述不同 |

## 位运算常用技巧速查

这些技巧在算法题中反复出现，背下来：

| 操作 | 表达式 | 说明 |
|------|--------|------|
| 消去最低位的 1 | `x & (x - 1)` | 用于统计 1 的个数（Brian Kernighan 算法） |
| 取最低位的 1 | `x & (-x)` | 等价于 `x & (~x + 1)`，lowbit，树状数组核心 |
| 判断 2 的幂 | `x > 0 && (x & (x-1)) == 0` | 2 的幂只有一个 1 |
| 交换两数（无临时变量）| `a ^= b; b ^= a; a ^= b` | 有趣但不推荐用于生产 |
| 相同则为 0 | `x ^ x = 0` | XOR 消除相同元素的基础 |
| 任何数与 0 XOR | `x ^ 0 = x` | XOR 的恒等元 |
| 取第 k 位 | `(x >> k) & 1` | 判断第 k 位是 0 还是 1 |
| 置第 k 位为 1 | `x \| (1 << k)` | 位掩码 OR |
| 清第 k 位为 0 | `x & ~(1 << k)` | 位掩码 AND NOT |
| 翻转第 k 位 | `x ^ (1 << k)` | 位掩码 XOR |
| 算有效位数 | `32 - __builtin_clz(x)`（C++）| 本题核心 |

## 延伸

同类题：[LeetCode 1009 - 十进制整数的反码](https://leetcode.cn/problems/complement-of-base-10-integer/)，本质相同，只是题目描述方式不同。

位运算的本质是**把整数的二进制表示当作一个布尔数组来批量操作**。掌握掩码构造、XOR 的特性（自反、消除）、以及 `x & (x-1)` 这三个基本操作，80% 的位运算题都能迎刃而解。', '2021-03-08', '["算法","位运算","leetcode"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('algorithm-sliding-window', '滑动窗口算法：从暴力到 O(n) 的思维跃迁', '系统讲解滑动窗口算法的核心模板、适用题型，配合三道经典 LeetCode 题目的完整 C++ 实现，彻底理解双指针收缩思路。', 'import Chart from ''../../components/Chart.vue''

export const complexityData = {
  labels: [''n=10'', ''n=100'', ''n=500'', ''n=1000'', ''n=5000''],
  datasets: [
    {
      label: ''O(n) 滑动窗口'',
      data: [10, 100, 500, 1000, 5000],
      borderColor: ''rgba(0,212,255,1)'',
      backgroundColor: ''rgba(0,212,255,0.15)'',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: ''rgba(0,212,255,1)'',
      pointRadius: 4,
    },
    {
      label: ''O(n²) 暴力枚举'',
      data: [100, 10000, 250000, 1000000, 25000000],
      borderColor: ''rgba(255,0,170,1)'',
      backgroundColor: ''rgba(255,0,170,0.12)'',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: ''rgba(255,0,170,1)'',
      pointRadius: 4,
    }
  ]
}

export const complexityOptions = {
  scales: {
    x: {
      ticks: { color: ''#8888aa'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    },
    y: {
      type: ''logarithmic'',
      ticks: { color: ''#8888aa'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    }
  }
}

有一类题，暴力解法显而易见，O(n²) 甚至 O(n³)，但总觉得有更好的办法——答案往往是滑动窗口。

滑动窗口的本质是一种**避免重复计算**的思维：通过维护一个可伸缩的区间 `[left, right]`，用 O(1) 的代价在每次移动时更新状态，把嵌套循环压缩成单次遍历。

**直觉上的差距有多大？** 下图展示随输入规模增长，两种算法的操作次数对比（对数坐标）：

<Chart client:only="vue" type="line" data={complexityData} options={complexityOptions} height={260} />

当 n=5000 时，暴力枚举需要 2500 万次操作，而滑动窗口只需要 5000 次——差距达 **5000 倍**。

---

## 什么题型适合滑动窗口

记住这几个关键词：

- **连续子数组或子串**（不能跳跃，必须连续）
- **求最长 / 最短 / 恰好满足某条件**
- **条件可以随窗口扩缩而增量更新**（加一个元素、减一个元素，状态好维护）

典型不适用场景：需要选不连续元素（用 DP）、全局排序后处理（用排序+双指针）。

---

## 双指针收缩模板

所有滑动窗口题都能套进这个框架：

```cpp
int left = 0;
// window 是窗口的状态，可以是哈希表、计数器等
// 具体类型根据题目定

for (int right = 0; right < n; right++) {
    // 1. 把 s[right] 加入窗口
    window.add(s[right]);

    // 2. 判断是否需要收缩左边界
    while (window 不满足条件) {
        // 把 s[left] 移出窗口
        window.remove(s[left]);
        left++;
    }

    // 3. 此时窗口 [left, right] 满足条件，更新答案
    ans = max(ans, right - left + 1);  // 或其他逻辑
}
```

关键逻辑：
- `right` 只向右移动，负责**扩张**窗口
- `left` 在需要时向右移动，负责**收缩**窗口
- 每个元素最多进出窗口一次，总时间复杂度 O(n)

---

## 例题 1：最长无重复子串（LeetCode 3）

> 给定字符串 s，找出其中不含重复字符的最长子串的长度。

**分析**：窗口内不能有重复字符。当 `right` 指向的字符已经在窗口中时，收缩左边界直到重复消除。

```cpp
#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> window;  // 字符 → 出现次数
        int left = 0, ans = 0;

        for (int right = 0; right < (int)s.size(); right++) {
            char c = s[right];
            window[c]++;  // 扩张：加入右边界字符

            // 窗口内出现重复，收缩左边界
            while (window[c] > 1) {
                window[s[left]]--;
                left++;
            }

            // 此时 [left, right] 无重复字符
            ans = max(ans, right - left + 1);
        }

        return ans;
    }
};
```

**走一遍示例**：`s = "abcabcbb"`

```
right=0, c=''a'': window={a:1}, 无重复, ans=1
right=1, c=''b'': window={a:1,b:1}, 无重复, ans=2
right=2, c=''c'': window={a:1,b:1,c:1}, 无重复, ans=3
right=3, c=''a'': window={a:2,...}, 收缩: 移除s[0]=''a'', left=1, ans=3
right=4, c=''b'': window={b:2,...}, 收缩: 移除s[1]=''b'', left=2, ans=3
...
最终 ans=3（"abc"）
```

时间复杂度 O(n)，空间 O(字符集大小)。

---

## 例题 2：长度最小的子数组（LeetCode 209）

> 给定正整数数组 nums 和正整数 target，找出满足其和 ≥ target 的最小长度连续子数组。若不存在，返回 0。

**分析**：求最短满足条件的窗口。当窗口和 ≥ target 时，尝试收缩左边界（看能不能更短）。

```cpp
#include <vector>
#include <climits>
using namespace std;

class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int n = nums.size();
        int left = 0, sum = 0;
        int ans = INT_MAX;

        for (int right = 0; right < n; right++) {
            sum += nums[right];  // 扩张：加入右边界元素

            // 窗口和 >= target，尝试收缩
            while (sum >= target) {
                ans = min(ans, right - left + 1);  // 更新最小长度
                sum -= nums[left];  // 收缩：移除左边界元素
                left++;
            }
        }

        return (ans == INT_MAX) ? 0 : ans;
    }
};
```

**注意与例题 1 的差异**：
- 例题 1 是「窗口不满足条件时收缩」
- 例题 2 是「窗口满足条件时收缩」（因为要找最小窗口）

这是两种不同的收缩策略，根据题目要求选择：

| 目标 | 收缩时机 | 更新答案时机 |
|------|----------|--------------|
| 最长满足条件 | 不满足时收缩 | 收缩后（满足时）更新 |
| 最短满足条件 | 满足时收缩 | 收缩前（满足时）更新 |

---

## 例题 3：找所有字母异位词（LeetCode 438）

> 给定字符串 s 和 p，找出 s 中所有 p 的异位词的起始索引。

**分析**：固定窗口大小为 `p.size()`，窗口内字符频率与 p 完全一致时记录答案。

```cpp
#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        vector<int> ans;
        if (s.size() < p.size()) return ans;

        // need: p 中每个字符需要的数量
        // window: 当前窗口中每个字符的数量
        vector<int> need(26, 0), window(26, 0);
        for (char c : p) need[c - ''a'']++;

        int left = 0;
        int valid = 0;  // 窗口中满足 need 的字符种数

        for (int right = 0; right < (int)s.size(); right++) {
            int c = s[right] - ''a'';
            window[c]++;
            // 如果这个字符恰好达到需要的数量，valid++
            if (window[c] == need[c]) valid++;

            // 窗口大小超过 p，收缩左边界
            if (right - left + 1 > (int)p.size()) {
                int l = s[left] - ''a'';
                // 收缩前检查 valid 是否会减少
                if (window[l] == need[l]) valid--;
                window[l]--;
                left++;
            }

            // 所有字符种数都满足
            if (valid == 26) {
                // 实际上只需要 need 中非零的字符都满足
                // 这里用更简洁的向量比较
            }
        }

        // 更简洁的实现：直接比较向量
        return findAnagramsClean(s, p);
    }

    vector<int> findAnagramsClean(string s, string p) {
        vector<int> ans;
        int sn = s.size(), pn = p.size();
        if (sn < pn) return ans;

        vector<int> pCount(26, 0), sCount(26, 0);
        for (char c : p) pCount[c - ''a'']++;

        // 初始化第一个窗口
        for (int i = 0; i < pn; i++) sCount[s[i] - ''a'']++;
        if (sCount == pCount) ans.push_back(0);

        // 滑动窗口
        for (int i = pn; i < sn; i++) {
            sCount[s[i] - ''a'']++;           // 加入右端新字符
            sCount[s[i - pn] - ''a'']--;      // 移出左端旧字符
            if (sCount == pCount) ans.push_back(i - pn + 1);
        }

        return ans;
    }
};
```

固定大小窗口更简单：每次右移一格，同时左端也移除一个元素，窗口大小始终为 `pn`。

---

## 滑动窗口 vs 前缀和 vs 双指针

这三种技术经常让人困惑，核心区分：

| 技术 | 适用场景 | 关键特征 |
|------|----------|----------|
| **滑动窗口** | 连续子数组，条件可增量维护 | 窗口大小可变，O(n) |
| **前缀和** | 任意区间和的快速查询 | 预处理 O(n)，查询 O(1) |
| **双指针（对撞）** | 有序数组，找两个数之和 | 一头一尾向中间逼近 |

**判断用哪个**：

- 需要查询任意区间 `[l, r]` 的和 → **前缀和**
- 有序数组，找满足条件的两个元素 → **对撞双指针**
- 连续区间，且状态能随窗口扩缩增量更新 → **滑动窗口**

滑动窗口本质上也是双指针，只是两个指针都从左向右移动（而非对撞）。

---

## 小结

滑动窗口的思维跃迁在于：

**暴力**：枚举所有 `[i, j]` 区间，每次从头计算 → O(n²) 或更差  
**优化**：维护一个窗口，扩张和收缩时增量更新状态 → O(n)

关键是找到窗口状态的**增量维护方式**——能加一个元素、减一个元素，且每次 O(1)。一旦满足这个条件，滑动窗口就能用。

遇到连续子数组/子串类问题，先问自己：「如果我维护一个 `[left, right]` 的窗口，状态如何随右端扩张和左端收缩而更新？」答得出来，就能用滑动窗口。', '2026-04-30', '["算法","滑动窗口","leetcode","cpp"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('cef-lnk2038-iterator-debug-level', 'CEF LNK2038：解决 _ITERATOR_DEBUG_LEVEL 不匹配错误', '分析 CEF（Chromium Embedded Framework）集成时出现的 LNK2038 _ITERATOR_DEBUG_LEVEL 链接错误，从根本原因到解决方案的完整指南。', '## 错误现象

在将 CEF（Chromium Embedded Framework）集成到 Visual Studio 项目后，链接阶段报错：

```
libcef_dll_wrapper.lib(cef_logging.obj) : error LNK2038: 检测到"_ITERATOR_DEBUG_LEVEL"的不匹配项:
    值"0"不匹配值"2"(your_project.obj 中)
```

或者反过来：

```
libcef_dll_wrapper.lib(cef_logging.obj) : error LNK2038: 检测到"_ITERATOR_DEBUG_LEVEL"的不匹配项:
    值"2"不匹配值"0"(your_project.obj 中)
```

可能还伴随着：

```
error LNK2038: 检测到"RuntimeLibrary"的不匹配项:
    值"MDd_DynamicDebug"不匹配值"MD_DynamicRelease"
```

## 根本原因

### _ITERATOR_DEBUG_LEVEL 是什么

`_ITERATOR_DEBUG_LEVEL` 是 MSVC STL 的一个内部宏，控制 STL 迭代器的调试级别：

| 值 | 含义 | 对应配置 |
|----|------|---------|
| 0 | 无迭代器调试 | Release 模式 |
| 1 | 基础检查 | Release（部分）|
| 2 | 完整调试检查 | Debug 模式 |

这个值由**运行时库（Runtime Library）**类型自动决定：

```
/MTd 或 /MDd（Debug 运行时）→ _ITERATOR_DEBUG_LEVEL = 2
/MT  或 /MD （Release 运行时）→ _ITERATOR_DEBUG_LEVEL = 0
```

### 不匹配的本质

CEF 预编译库（`libcef_dll_wrapper.lib`）是用特定的运行时库编译的。如果你的项目配置的运行时库与 CEF 不一致，链接器会检测到 `_ITERATOR_DEBUG_LEVEL` 不匹配并拒绝链接。

常见的不匹配场景：

```
你的项目：Debug 配置 → /MDd → IDL=2
CEF 库：   Release 编译 → /MD  → IDL=0   ← 不匹配！
```

或：

```
你的项目：/MT（静态链接）
CEF 库：  /MD（动态链接）  ← 运行时库类型不匹配！
```

## 解决方案

### 方法一：让项目运行时库与 CEF 一致（推荐）

首先确认你使用的 CEF 包是 Debug 版还是 Release 版：

CEF 二进制分发包通常包含两个库目录：
```
cef_binary_xxx/
├── Debug/
│   └── libcef_dll_wrapper.lib   ← Debug 版，IDL=2，/MDd
└── Release/
    └── libcef_dll_wrapper.lib   ← Release 版，IDL=0，/MD
```

然后在 Visual Studio 项目属性中调整运行时库：

**项目属性 → C/C++ → 代码生成 → 运行库**

| 你链接的 CEF 版本 | 应设置的运行库 |
|-----------------|--------------|
| Debug 版 CEF    | `/MDd`（多线程调试 DLL）|
| Release 版 CEF  | `/MD`（多线程 DLL）|

通常的最佳做法：

```
Debug 配置   → 链接 cef/Debug/libcef_dll_wrapper.lib   + /MDd
Release 配置 → 链接 cef/Release/libcef_dll_wrapper.lib + /MD
```

### 方法二：检查附加库目录配置

常见错误：Debug/Release 两个配置都指向同一个 CEF 库目录：

```
# 错误：Debug 配置也用了 Release 版 lib
附加库目录: $(CEF_ROOT)\Release   ← Debug 配置下这样是错的！

# 正确：使用 VS 条件变量区分
附加库目录: $(CEF_ROOT)\$(Configuration)
# 这会自动解析为 CEF_ROOT\Debug 或 CEF_ROOT\Release
```

在项目属性的"附加库目录"中使用 `$(Configuration)` 宏自动匹配。

### 方法三：通过 CMake 配置（CMake 项目）

```cmake
# CMakeLists.txt

# 根据 Debug/Release 选择对应的 CEF 库
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(CEF_LIB_DIR "${CEF_ROOT}/Debug")
    # 确保运行时库匹配
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreadedDebugDLL")
else()
    set(CEF_LIB_DIR "${CEF_ROOT}/Release")
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreadedDLL")
endif()

target_link_directories(your_target PRIVATE ${CEF_LIB_DIR})
target_link_libraries(your_target PRIVATE libcef_dll_wrapper.lib)
```

## 快速诊断

遇到 LNK2038 时，快速定位不匹配点：

```
# 查看 CEF lib 的编译参数
dumpbin /directives path\to\libcef_dll_wrapper.lib | findstr "RuntimeLibrary"
dumpbin /directives path\to\libcef_dll_wrapper.lib | findstr "ITERATOR"
```

或在 Visual Studio 的链接器输出中启用详细日志：

**项目属性 → 链接器 → 常规 → 显示进度 → 显示所有进度消息（/VERBOSE）**

## 其他常见 LNK2038 变种

同样的问题机制还会引发：

| 不匹配项 | 常见原因 |
|---------|---------|
| `RuntimeLibrary` | `/MT` vs `/MD` 混用 |
| `_SECURE_SCL` | 安全 STL 检查开关不一致 |
| `_HAS_ITERATOR_DEBUGGING` | 迭代器调试开关不一致 |

**核心原则：所有要链接在一起的目标文件和库，必须使用相同的运行时库类型编译。**

## 总结

1. LNK2038 `_ITERATOR_DEBUG_LEVEL` 不匹配 = Debug/Release 运行时库混用
2. CEF 预编译库分 Debug 和 Release 两个版本，必须与项目配置对应
3. 用 `$(Configuration)` 宏让项目属性自动选择正确版本
4. CMake 项目用 `CMAKE_MSVC_RUNTIME_LIBRARY` 统一控制', '2024-05-07', '["C++","CEF","Visual Studio","链接错误"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('cpp-random-design-patterns', 'C++ 设计模式实战：RAII、观察者、工厂', '用现代 C++（C++17/20）实现三种高频设计模式：RAII 资源管理、观察者模式事件系统、工厂模式插件架构。每种模式给出问题场景、实现代码和真实工程案例。', '设计模式不是装饰——是经过验证的**问题解决方案**。

这篇文章聚焦三种在 C++ 工程中最常见、最容易被误用的模式：RAII、观察者、工厂。每种模式都从一个具体的工程痛点出发，给出现代 C++ 的实现，并结合真实场景说明为什么这么做。

---

## RAII：资源获取即初始化

### 问题场景

你在写 HID 设备管理，需要打开设备句柄，做一些操作，最后关闭。最初的写法大概是这样：

```cpp
// ❌ 危险写法：多个出口，每个都要记得 CloseHandle
HANDLE hDevice = CreateFile(devicePath, GENERIC_READ | GENERIC_WRITE, ...);
if (hDevice == INVALID_HANDLE_VALUE) return false;

if (!HidD_GetAttributes(hDevice, &attributes)) {
    CloseHandle(hDevice);  // 记得关
    return false;
}

// 如果这里抛异常呢？句柄泄漏！
processDevice(hDevice);

CloseHandle(hDevice);  // 正常路径才会执行到
return true;
```

函数有 3 个出口，每个都要手写 `CloseHandle`。一旦中间抛了异常，或者新同事加了一个 early return，句柄就泄漏了。

### RAII 包装器实现

解决方案是把资源的生命周期绑定到对象的生命周期——对象析构时资源自动释放：

```cpp
#include <windows.h>
#include <functional>
#include <stdexcept>

// 通用 RAII 包装器：接受任意清理函数
class ScopeGuard {
public:
    explicit ScopeGuard(std::function<void()> cleanup)
        : cleanup_(std::move(cleanup)), active_(true) {}

    ~ScopeGuard() {
        if (active_) cleanup_();
    }

    // 提前解除（不再清理，所有权转移时使用）
    void dismiss() { active_ = false; }

    // 禁止拷贝
    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;

private:
    std::function<void()> cleanup_;
    bool active_;
};

// 专用 HID 设备句柄包装器
class HidDeviceHandle {
public:
    explicit HidDeviceHandle(const wchar_t* devicePath) {
        handle_ = CreateFileW(
            devicePath,
            GENERIC_READ | GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            nullptr,
            OPEN_EXISTING,
            FILE_FLAG_OVERLAPPED,
            nullptr
        );
        if (handle_ == INVALID_HANDLE_VALUE) {
            throw std::runtime_error("Failed to open HID device");
        }
    }

    ~HidDeviceHandle() {
        if (handle_ != INVALID_HANDLE_VALUE) {
            CloseHandle(handle_);
        }
    }

    // 移动语义：所有权转移
    HidDeviceHandle(HidDeviceHandle&& other) noexcept
        : handle_(other.handle_) {
        other.handle_ = INVALID_HANDLE_VALUE;
    }

    HidDeviceHandle& operator=(HidDeviceHandle&& other) noexcept {
        if (this != &other) {
            if (handle_ != INVALID_HANDLE_VALUE) CloseHandle(handle_);
            handle_ = other.handle_;
            other.handle_ = INVALID_HANDLE_VALUE;
        }
        return *this;
    }

    // 禁止拷贝（句柄不能共享所有权）
    HidDeviceHandle(const HidDeviceHandle&) = delete;
    HidDeviceHandle& operator=(const HidDeviceHandle&) = delete;

    HANDLE get() const { return handle_; }
    bool valid() const { return handle_ != INVALID_HANDLE_VALUE; }

private:
    HANDLE handle_ = INVALID_HANDLE_VALUE;
};
```

### 裸指针 vs unique_ptr vs 自定义 RAII

```cpp
// ❌ 裸指针：手动管理，容易泄漏
HANDLE h = OpenDevice();
// ... 中间任何异常或 return 都会泄漏
CloseHandle(h);

// ✅ unique_ptr + 自定义 deleter：适合有 delete-like 清理函数的资源
auto deleter = [](HANDLE* p) { if (*p != INVALID_HANDLE_VALUE) CloseHandle(*p); };
std::unique_ptr<HANDLE, decltype(deleter)> hGuard(&h, deleter);

// ✅ 自定义 RAII 类：推荐方案，语义最清晰
{
    HidDeviceHandle device(L"\\\\.\\HID#...#...#{...}");
    // 任意操作，任意路径退出，句柄都会被 ~HidDeviceHandle() 关闭
    HIDD_ATTRIBUTES attrs;
    HidD_GetAttributes(device.get(), &attrs);
}  // 这里自动 CloseHandle
```

### 工程案例：多资源同时管理

```cpp
bool initializeDevice(const wchar_t* path) {
    try {
        HidDeviceHandle device(path);

        // 互斥锁也可以 RAII：std::lock_guard
        std::mutex mtx;
        std::lock_guard<std::mutex> lock(mtx);

        // 临时缓冲区
        auto buffer = std::make_unique<uint8_t[]>(1024);

        // 所有资源在 try 块结束时自动释放
        // 无需任何手动清理代码
        return HidD_SetFeature(device.get(), buffer.get(), 1024);

    } catch (const std::exception& e) {
        // device 析构已经关闭句柄，这里只需处理错误逻辑
        logError(e.what());
        return false;
    }
}
```

**RAII 的本质**：用 C++ 对象的确定性析构（deterministic destruction）替代手动资源管理。任何需要"成对操作"（open/close、lock/unlock、malloc/free）的资源，都适合用 RAII 包装。

---

## 观察者模式：类型安全事件系统

### 问题场景

设备管理器需要在设备插拔时通知多个组件：UI 要刷新列表，日志模块要记录，业务层要更新状态。最简单（也最糟糕）的做法是在设备管理器里直接调用这些组件：

```cpp
// ❌ 紧耦合：设备管理器知道太多东西
class DeviceManager {
    void onDeviceArrival() {
        ui_.refreshList();      // 依赖 UI
        logger_.logEvent(...);  // 依赖 Logger
        bizLayer_.update(...);  // 依赖业务层
    }
};
```

添加新订阅者需要修改 `DeviceManager`，违反开闭原则，而且单元测试极其困难。

### 基于 std::function 的类型安全事件系统

```cpp
#include <functional>
#include <unordered_map>
#include <vector>
#include <string>
#include <typeindex>
#include <any>

// 事件基类（用于类型擦除）
struct EventBase {
    virtual ~EventBase() = default;
};

// 具体事件类型
struct DeviceArrivalEvent : EventBase {
    std::string devicePath;
    uint16_t vendorId;
    uint16_t productId;
};

struct DeviceRemovalEvent : EventBase {
    std::string devicePath;
};

struct DeviceDataEvent : EventBase {
    std::string devicePath;
    std::vector<uint8_t> data;
};

// 类型安全事件总线
class EventBus {
public:
    // 订阅：返回 token，用于取消订阅
    template<typename EventT>
    int subscribe(std::function<void(const EventT&)> handler) {
        auto key = std::type_index(typeid(EventT));
        int token = nextToken_++;
        handlers_[key].push_back({
            token,
            [handler](const EventBase& e) {
                handler(static_cast<const EventT&>(e));
            }
        });
        return token;
    }

    // 取消订阅
    template<typename EventT>
    void unsubscribe(int token) {
        auto key = std::type_index(typeid(EventT));
        auto it = handlers_.find(key);
        if (it == handlers_.end()) return;
        auto& vec = it->second;
        vec.erase(
            std::remove_if(vec.begin(), vec.end(),
                [token](const auto& h) { return h.token == token; }),
            vec.end()
        );
    }

    // 发布事件
    template<typename EventT>
    void publish(const EventT& event) {
        auto key = std::type_index(typeid(EventT));
        auto it = handlers_.find(key);
        if (it == handlers_.end()) return;
        // 拷贝一份，防止回调中修改 handlers_
        auto handlers = it->second;
        for (const auto& h : handlers) {
            h.fn(event);
        }
    }

private:
    struct HandlerEntry {
        int token;
        std::function<void(const EventBase&)> fn;
    };
    std::unordered_map<std::type_index, std::vector<HandlerEntry>> handlers_;
    int nextToken_ = 0;
};

// 全局事件总线（实际项目中可用依赖注入）
inline EventBus& getEventBus() {
    static EventBus bus;
    return bus;
}
```

### 使用：设备插拔事件广播

```cpp
// 设备管理器：只负责发布事件，不知道谁在监听
class DeviceManager {
public:
    void onHotplugArrival(const std::string& path, uint16_t vid, uint16_t pid) {
        // 发布事件，其他组件自行处理
        getEventBus().publish(DeviceArrivalEvent{path, vid, pid});
    }

    void onHotplugRemoval(const std::string& path) {
        getEventBus().publish(DeviceRemovalEvent{path});
    }
};

// UI 组件：订阅感兴趣的事件
class DeviceListView {
public:
    DeviceListView() {
        arrivalToken_ = getEventBus().subscribe<DeviceArrivalEvent>(
            [this](const DeviceArrivalEvent& e) {
                addDeviceItem(e.devicePath, e.vendorId, e.productId);
            }
        );
        removalToken_ = getEventBus().subscribe<DeviceRemovalEvent>(
            [this](const DeviceRemovalEvent& e) {
                removeDeviceItem(e.devicePath);
            }
        );
    }

    ~DeviceListView() {
        // 析构时取消订阅，防止悬空回调
        getEventBus().unsubscribe<DeviceArrivalEvent>(arrivalToken_);
        getEventBus().unsubscribe<DeviceRemovalEvent>(removalToken_);
    }

private:
    int arrivalToken_;
    int removalToken_;
    void addDeviceItem(const std::string&, uint16_t, uint16_t) { /* ... */ }
    void removeDeviceItem(const std::string&) { /* ... */ }
};

// 日志模块：独立订阅，DeviceManager 完全不知道它的存在
class DeviceLogger {
public:
    DeviceLogger() {
        token_ = getEventBus().subscribe<DeviceArrivalEvent>(
            [](const DeviceArrivalEvent& e) {
                printf("[LOG] Device arrived: %s (VID=%04X PID=%04X)\n",
                    e.devicePath.c_str(), e.vendorId, e.productId);
            }
        );
    }
    ~DeviceLogger() {
        getEventBus().unsubscribe<DeviceArrivalEvent>(token_);
    }
private:
    int token_;
};
```

### 与 Qt Signal/Slot 对比

| 特性 | Qt Signal/Slot | 本文事件总线 |
|------|---------------|-------------|
| 类型安全 | ✅（编译期） | ✅（模板） |
| 跨线程 | ✅（内置队列连接） | ❌（需额外处理） |
| 依赖 | Qt MOC 预处理器 | 纯标准库 |
| 运行时开销 | 中等（元对象系统） | 低（std::function） |
| 动态订阅/取消 | ✅ | ✅ |
| 适用场景 | Qt 应用 | 无 Qt 依赖的 C++ 项目 |

**观察者模式的核心价值**：发布者和订阅者互不依赖，可以独立演化、独立测试。增加新的监听者无需修改任何现有代码。

---

## 工厂模式：注册表式插件架构

### 问题场景

你的应用需要处理多种协议（HID、USB Bulk、Serial、BLE），每种协议对应不同的处理器类。最直观的写法是 if-else：

```cpp
// ❌ 每次新增协议都要修改这里
std::unique_ptr<ProtocolHandler> createHandler(const std::string& type) {
    if (type == "hid")    return std::make_unique<HidHandler>();
    if (type == "serial") return std::make_unique<SerialHandler>();
    if (type == "ble")    return std::make_unique<BleHandler>();
    return nullptr;
}
```

随着协议类型增多，这个函数会无限膨胀，而且每次改动都要触碰核心代码。

### 注册表式工厂（自注册）

让每个处理器类**自己注册**到工厂，工厂完全不知道具体类型：

```cpp
#include <memory>
#include <string>
#include <unordered_map>
#include <functional>
#include <stdexcept>

// 抽象基类
class ProtocolHandler {
public:
    virtual ~ProtocolHandler() = default;
    virtual bool open(const std::string& path) = 0;
    virtual void close() = 0;
    virtual std::vector<uint8_t> read() = 0;
    virtual bool write(const std::vector<uint8_t>& data) = 0;
    virtual std::string type() const = 0;
};

// 工厂注册表
class HandlerFactory {
public:
    using Creator = std::function<std::unique_ptr<ProtocolHandler>()>;

    static HandlerFactory& instance() {
        static HandlerFactory factory;
        return factory;
    }

    // 注册创建函数
    void registerHandler(const std::string& type, Creator creator) {
        registry_[type] = std::move(creator);
    }

    // 创建实例
    std::unique_ptr<ProtocolHandler> create(const std::string& type) const {
        auto it = registry_.find(type);
        if (it == registry_.end()) {
            throw std::runtime_error("Unknown handler type: " + type);
        }
        return it->second();
    }

    // 查询已注册类型
    std::vector<std::string> registeredTypes() const {
        std::vector<std::string> types;
        for (const auto& [key, _] : registry_) types.push_back(key);
        return types;
    }

private:
    std::unordered_map<std::string, Creator> registry_;
};

// 自注册辅助类模板
template<typename T>
class AutoRegister {
public:
    explicit AutoRegister(const std::string& type) {
        HandlerFactory::instance().registerHandler(
            type,
            []() -> std::unique_ptr<ProtocolHandler> {
                return std::make_unique<T>();
            }
        );
    }
};

// 自注册宏（简化样板代码）
#define REGISTER_HANDLER(ClassName, TypeName) \
    static AutoRegister<ClassName> _autoReg_##ClassName{TypeName}
```

### 具体处理器实现（自注册）

```cpp
// hid_handler.cpp
class HidHandler : public ProtocolHandler {
public:
    bool open(const std::string& path) override {
        handle_ = CreateFileA(path.c_str(), GENERIC_READ | GENERIC_WRITE,
                              FILE_SHARE_READ | FILE_SHARE_WRITE,
                              nullptr, OPEN_EXISTING, 0, nullptr);
        return handle_ != INVALID_HANDLE_VALUE;
    }

    void close() override {
        if (handle_ != INVALID_HANDLE_VALUE) {
            CloseHandle(handle_);
            handle_ = INVALID_HANDLE_VALUE;
        }
    }

    std::vector<uint8_t> read() override {
        std::vector<uint8_t> buf(65);
        DWORD bytesRead = 0;
        ReadFile(handle_, buf.data(), 65, &bytesRead, nullptr);
        buf.resize(bytesRead);
        return buf;
    }

    bool write(const std::vector<uint8_t>& data) override {
        DWORD written = 0;
        return WriteFile(handle_, data.data(), data.size(), &written, nullptr);
    }

    std::string type() const override { return "hid"; }

private:
    HANDLE handle_ = INVALID_HANDLE_VALUE;
};

// 在 .cpp 文件全局作用域自动注册（程序启动时执行）
REGISTER_HANDLER(HidHandler, "hid");

// serial_handler.cpp（同理，自包含，不修改工厂）
class SerialHandler : public ProtocolHandler {
    // ... 实现
    std::string type() const override { return "serial"; }
};
REGISTER_HANDLER(SerialHandler, "serial");
```

### 使用工厂

```cpp
// 调用方完全不依赖具体类型
void connectToDevice(const std::string& type, const std::string& path) {
    auto handler = HandlerFactory::instance().create(type);
    if (!handler->open(path)) {
        throw std::runtime_error("Failed to open device");
    }
    // handler 是 unique_ptr，RAII 保证 close
}

// 动态加载配置（从 JSON/命令行读取类型字符串）
void loadDevicesFromConfig(const std::vector<DeviceConfig>& configs) {
    for (const auto& cfg : configs) {
        try {
            auto handler = HandlerFactory::instance().create(cfg.type);
            handler->open(cfg.path);
            // ...
        } catch (const std::exception& e) {
            fprintf(stderr, "Failed to create handler for %s: %s\n",
                    cfg.type.c_str(), e.what());
        }
    }
}
```

### C++17 if constexpr 与 std::variant 在工厂中的应用

工厂模式结合 `std::variant` 可以在**编译期**消除运行时分支，适合类型集合固定的场景：

```cpp
#include <variant>

// 已知类型集合（编译期固定）
using HandlerVariant = std::variant<HidHandler, SerialHandler, BleHandler>;

// 根据枚举创建变体（编译期分派）
enum class HandlerType { Hid, Serial, Ble };

HandlerVariant createHandlerVariant(HandlerType type) {
    switch (type) {
        case HandlerType::Hid:    return HidHandler{};
        case HandlerType::Serial: return SerialHandler{};
        case HandlerType::Ble:    return BleHandler{};
    }
    std::unreachable();  // C++23，C++17 用 __builtin_unreachable()
}

// std::visit + if constexpr：针对不同类型执行不同逻辑
void processHandler(HandlerVariant& handler) {
    std::visit([](auto& h) {
        using T = std::decay_t<decltype(h)>;

        if constexpr (std::is_same_v<T, HidHandler>) {
            // HID 特有操作：设置报告描述符
            h.setReportDescriptor();
        } else if constexpr (std::is_same_v<T, BleHandler>) {
            // BLE 特有操作：配对
            h.startPairing();
        } else {
            // 通用操作
            h.open("/dev/ttyUSB0");
        }
    }, handler);
}
```

**variant 工厂 vs 注册表工厂的选择**：

| 场景 | 推荐方案 |
|------|---------|
| 类型集合固定，编译期已知 | `std::variant` + `if constexpr` |
| 类型集合动态扩展（插件系统） | 注册表工厂 |
| 需要运行时字符串映射（配置文件） | 注册表工厂 |
| 性能极敏感，无虚函数开销 | `std::variant` |

---

## 三种模式的协同

这三种模式在实际项目中往往配合使用：

```
工厂模式
  └─ 创建具体的 ProtocolHandler（RAII 包装底层句柄）
       └─ 发布事件到 EventBus（观察者）
            ├─ UI 订阅 → 刷新设备列表
            ├─ Logger 订阅 → 记录日志
            └─ Monitor 订阅 → 更新状态机
```

- **RAII** 确保资源不泄漏，不论执行路径如何
- **观察者** 解耦生产者和消费者，两侧可独立变化
- **工厂** 隔离创建逻辑，调用方不依赖具体类型

这不是理论，是在 HID 设备管理、协议层抽象、UI 事件系统中被反复验证过的工程实践。', '2026-05-01', '["cpp","设计模式","c++17","工程"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('cpp-random-mt19937', 'C++ 现代随机数生成：用 mt19937 彻底告别 rand()', '深入讲解为什么 rand() 不够用，以及如何用 C++11 的 <random> 库正确生成高质量随机数，涵盖 mt19937、各种分布和线程安全。', 'import Chart from ''../../components/Chart.vue''

export const randRadarData = {
  labels: [''分布质量'', ''可读性'', ''线程安全'', ''种子质量'', ''分布灵活性''],
  datasets: [
    {
      label: ''rand()'',
      data: [2, 2, 1, 1, 1],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,0,170,0.9)'',
    },
    {
      label: ''mt19937'',
      data: [5, 5, 4, 5, 5],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(0,212,255,0.9)'',
    },
  ],
}

export const randRadarOptions = {
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: { display: false, stepSize: 1 },
      grid: { color: ''rgba(136,136,170,0.25)'' },
      angleLines: { color: ''rgba(136,136,170,0.25)'' },
      pointLabels: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 11 } },
    },
  },
}

C++ 里生成随机数，很多人第一反应是 `rand()`。但在实际项目中，`rand()` 几乎是一个"应该被遗忘"的函数。C++11 引入的 `<random>` 库提供了一套工业级的随机数解决方案，本文带你彻底搞清楚怎么用。

---

## 为什么 `rand()` 不够用

### 1. 固定种子，结果可预测

```cpp
srand(42);
for (int i = 0; i < 5; ++i)
    std::cout << rand() << " ";
// 每次运行输出完全相同
```

很多人用 `srand(time(NULL))` 来解决这个问题，但 `time()` 精度只到秒——同一秒内启动的多个进程会得到完全相同的序列。

### 2. 范围限制，分布不均

```cpp
// 生成 [0, 99] 的随机数
int r = rand() % 100;
```

这行代码有个经典问题：`RAND_MAX` 通常是 32767，不能被 100 整除，导致小数字出现概率略高于大数字。数据量大时，这个偏差会被放大。

### 3. 线程不安全

`rand()` 内部维护全局状态，多线程同时调用会产生数据竞争，结果不可预期。

### 4. 质量差

`rand()` 通常基于线性同余生成器（LCG），统计质量较差，不适合科学计算、模拟或密码学相关场景。

---

## C++11 `<random>` 的正确打开方式

`<random>` 库的设计把**随机引擎**和**分布**分开，这是它最核心的思想：

- **引擎（Engine）**：负责产生均匀分布的原始随机比特
- **分布（Distribution）**：把原始比特变换成你需要的数学分布

```cpp
#include <iostream>
#include <random>

int main() {
    // 1. 用硬件熵源生成真随机种子
    std::random_device rd;
    
    // 2. 用种子初始化 mt19937 引擎
    std::mt19937 gen(rd());
    
    // 3. 定义分布：整数均匀分布 [1, 65535]
    std::uniform_int_distribution<int> dis(1, 65535);
    
    // 4. 生成随机数
    for (int i = 0; i < 5; ++i) {
        std::cout << dis(gen) << " ";
    }
    std::cout << "\n";
    
    return 0;
}
```

---

## random_device：硬件熵源

`std::random_device` 是一个非确定性随机数生成器，通常来自操作系统的熵池（Linux 下是 `/dev/urandom`，Windows 下是 `CryptGenRandom`）。

```cpp
std::random_device rd;
unsigned int seed = rd(); // 每次调用返回一个随机数
```

**注意**：`random_device` 在某些嵌入式平台或旧 MinGW 编译器上可能退化为伪随机数生成器（质量与 rand() 无异）。可以通过检查 `rd.entropy()` 是否为 0 来判断：

```cpp
std::random_device rd;
if (rd.entropy() == 0) {
    // 退化模式，用其他种子策略
    std::cerr << "警告：random_device 不支持真随机，使用时间戳作为备选种子\n";
}
```

在大多数 Linux/macOS/MSVC 环境下不需要担心这个问题。

---

## mt19937：最常用的伪随机引擎

`std::mt19937` 基于 **Mersenne Twister** 算法（1997 年提出），有以下特点：

- 周期极长：$2^{19937} - 1$
- 通过了大多数统计随机性测试
- 速度快，适合大量生成
- 32 位版本 `mt19937`，64 位版本 `mt19937_64`

```cpp
// 32 位引擎
std::mt19937 gen32(seed);

// 64 位引擎（适合需要大随机数的场景）
std::mt19937_64 gen64(seed);
```

**初始化种子的最佳实践**：单个 `random_device` 值已经够用，如果追求极高质量，可以用 `seed_seq` 用多个值初始化：

```cpp
std::random_device rd;
std::seed_seq seed_seq{rd(), rd(), rd(), rd(), rd()};
std::mt19937 gen(seed_seq);
```

---

## 常用分布类型

### 整数均匀分布

```cpp
std::uniform_int_distribution<int> dis(1, 100); // [1, 100] 闭区间
int r = dis(gen);
```

### 浮点均匀分布

```cpp
std::uniform_real_distribution<double> dis(0.0, 1.0); // [0.0, 1.0)
double r = dis(gen);
```

### 正态分布（高斯分布）

```cpp
// 均值 0，标准差 1
std::normal_distribution<double> dis(0.0, 1.0);
double r = dis(gen);
```

适用于模拟噪声、物理量波动等场景。

### 伯努利分布（抛硬币）

```cpp
// 70% 概率为 true
std::bernoulli_distribution dis(0.7);
bool result = dis(gen);
```

### 泊松分布

```cpp
// 平均每分钟 4 次事件
std::poisson_distribution<int> dis(4.0);
int events = dis(gen);
```

### 离散分布（自定义权重）

```cpp
// 三个选项，权重分别为 1, 2, 3（概率 1/6, 2/6, 3/6）
std::discrete_distribution<int> dis({1, 2, 3});
int choice = dis(gen); // 返回 0, 1 或 2
```

---

## 线程安全注意事项

`mt19937` 和分布对象**都不是线程安全的**，不能在多线程中共享。

### 方案一：每线程独立引擎（推荐）

```cpp
#include <thread>
#include <random>

void worker(int thread_id) {
    // 每个线程独立的引擎，用线程 id 区分种子
    std::random_device rd;
    std::mt19937 gen(rd() ^ (thread_id * 0x12345678));
    std::uniform_int_distribution<int> dis(1, 100);
    
    for (int i = 0; i < 10; ++i) {
        std::cout << dis(gen) << " ";
    }
}
```

### 方案二：thread_local 存储

```cpp
thread_local std::mt19937 gen(std::random_device{}());

int random_int(int lo, int hi) {
    std::uniform_int_distribution<int> dis(lo, hi);
    return dis(gen);
}
```

`thread_local` 让每个线程拥有自己的 `gen` 实例，安全且高效。

### 方案三：互斥锁（不推荐，性能差）

```cpp
std::mutex mtx;
std::mt19937 gen(std::random_device{}());

int random_int_safe(int lo, int hi) {
    std::lock_guard<std::mutex> lock(mtx);
    std::uniform_int_distribution<int> dis(lo, hi);
    return dis(gen);
}
```

---

## 完整工具函数示例

```cpp
#include <random>
#include <stdexcept>

// 线程安全的随机工具（thread_local 方案）
namespace rng {

// 获取线程本地引擎
inline std::mt19937& engine() {
    thread_local std::mt19937 gen(std::random_device{}());
    return gen;
}

// 生成整数 [lo, hi]
inline int randint(int lo, int hi) {
    if (lo > hi) throw std::invalid_argument("lo > hi");
    std::uniform_int_distribution<int> dis(lo, hi);
    return dis(engine());
}

// 生成浮点数 [lo, hi)
inline double randf(double lo = 0.0, double hi = 1.0) {
    std::uniform_real_distribution<double> dis(lo, hi);
    return dis(engine());
}

// 以概率 p 返回 true
inline bool chance(double p) {
    std::bernoulli_distribution dis(p);
    return dis(engine());
}

} // namespace rng

// 使用
int main() {
    for (int i = 0; i < 10; ++i) {
        std::cout << rng::randint(1, 6) << " "; // 模拟骰子
    }
    std::cout << "\n";
    
    if (rng::chance(0.3)) {
        std::cout << "30% 概率触发！\n";
    }
    
    return 0;
}
```

---

## 小结

| 对比项 | `rand()` | `<random>` |
|--------|----------|------------|
| 分布质量 | 差 | 高（可选） |
| 指定分布 | 需手动换算 | 内置多种分布 |
| 线程安全 | 否 | 手动管理（thread_local） |
| 种子质量 | 差（time） | 好（random_device） |
| 可读性 | 低 | 高 |

<Chart client:only="vue" type="radar" data={randRadarData} options={randRadarOptions} height={260} />

从 C++11 开始，`<random>` 已经完全可以替代 `rand()`。下次写随机数相关代码时，记得用 `mt19937` + 对应分布，彻底告别那个"能用但很糟"的老朋友。', '2023-05-26', '["cpp","c++11","random"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('csharp-sendmessage-cpp', 'C# 通过 SendMessage 向 C++ 窗口发送消息与字符串', '使用 P/Invoke 调用 user32.dll 的 SendMessage，从 C# 发送自定义 WM_USER 消息及字符串指针给 C++ 原生窗口，并在 C++ 侧正确接收和转换。', '## 背景

在 Windows 桌面开发中，C# 应用（WPF/WinForms）有时需要与同机运行的 C++ 原生程序通信。`SendMessage` 是最直接的进程内/跨进程 IPC 方式之一，尤其适合：

- C# 插件/前端 + C++ 核心引擎的混合架构
- 托管代码调用无法用 COM 或命名管道改造的老旧 C++ 模块
- 简单的命令/通知信号（不需要传大量数据）

## P/Invoke 声明

```csharp
using System;
using System.Runtime.InteropServices;

public class NativeMessaging
{
    // 导入 user32.dll 中的 SendMessage
    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = false)]
    private static extern IntPtr SendMessage(
        IntPtr hWnd,   // 目标窗口句柄
        uint   Msg,    // 消息 ID
        IntPtr wParam, // 附加参数 1
        IntPtr lParam  // 附加参数 2
    );

    // WM_USER = 0x0400，自定义消息从此偏移
    private const uint WM_USER = 0x0400;
    private const uint WM_MY_COMMAND    = WM_USER + 1;
    private const uint WM_MY_STRING_MSG = WM_USER + 2;
}
```

## 发送简单数值消息

```csharp
// 发送一个枚举命令（整数值放在 wParam 或 lParam）
public static void SendCommand(IntPtr hWnd, int commandCode)
{
    // wParam 传命令码，lParam 不用
    IntPtr result = SendMessage(hWnd, WM_MY_COMMAND,
                                new IntPtr(commandCode),
                                IntPtr.Zero);

    Console.WriteLine($"SendMessage returned: {result}");
}
```

## 发送字符串

字符串需要先 Marshal 到非托管内存，再将指针传给 C++：

```csharp
public static void SendStringToNative(IntPtr hWnd, string text)
{
    // 将托管字符串编码为 ANSI（char*）
    IntPtr pStr = Marshal.StringToHGlobalAnsi(text);

    try
    {
        // 将字符串指针作为 wParam 传递
        // lParam 可传附加标记或保留为 0
        SendMessage(hWnd, WM_MY_STRING_MSG, pStr, IntPtr.Zero);
    }
    finally
    {
        // 必须释放！Marshal.StringToHGlobalAnsi 在非托管堆分配内存
        // SendMessage 是同步的，C++ 侧在此行返回前已处理完毕
        Marshal.FreeHGlobal(pStr);
    }
}
```

> **重要**：`SendMessage` 是**同步**的——它会等 C++ 的 `WndProc` 处理完消息后才返回。因此在 `finally` 中释放内存是安全的，C++ 已经完成了对字符串内容的读取。

## C++ 接收方

```cpp
// 对应的消息 ID
constexpr UINT WM_MY_COMMAND    = WM_USER + 1;
constexpr UINT WM_MY_STRING_MSG = WM_USER + 2;

LRESULT CALLBACK WndProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    switch (uMsg)
    {
    case WM_MY_COMMAND:
    {
        // wParam 就是命令码（整数）
        int code = static_cast<int>(wParam);

        switch (code)
        {
        case 1: /* 处理命令 1 */ break;
        case 2: /* 处理命令 2 */ break;
        }
        return 0;
    }

    case WM_MY_STRING_MSG:
    {
        // wParam 是指向 ANSI 字符串的指针
        // 注意：该指针由 C# 分配，SendMessage 返回后会被释放
        // 所以必须在此函数内完成读取，不能保存指针！
        LPCSTR pStr = reinterpret_cast<LPCSTR>(wParam);

        // 立即拷贝到本地变量
        CString cstr(pStr);          // MFC CString（自动转宽字节）
        std::string stdStr(pStr);    // 或 std::string

        // 使用字符串
        AfxMessageBox(cstr);         // 仅示例，生产代码勿用阻塞 UI
        return 0;
    }
    }

    return DefWindowProc(hWnd, uMsg, wParam, lParam);
}
```

## 跨进程注意事项

上述方案适用于**同进程**（例如 C++ DLL 被 C# 加载）或**同机跨进程**。

跨进程时，`wParam`/`lParam` 中的指针**无法直接跨进程访问**（虚拟地址空间隔离）。解决方案：

| 方案 | 适用场景 |
|------|---------|
| `WM_COPYDATA` | 跨进程传递数据的官方消息 |
| 共享内存 | 大量数据，高频次 |
| 命名管道 / Socket | 通用 IPC，推荐现代方案 |

### WM_COPYDATA 示例（跨进程字符串）

```csharp
// C# 发送方
[StructLayout(LayoutKind.Sequential)]
private struct COPYDATASTRUCT
{
    public IntPtr dwData;
    public int    cbData;
    public IntPtr lpData;
}

public static void SendStringCrossProcess(IntPtr hWnd, string text)
{
    byte[] bytes = System.Text.Encoding.UTF8.GetBytes(text + "\0");
    IntPtr pData = Marshal.AllocHGlobal(bytes.Length);
    Marshal.Copy(bytes, 0, pData, bytes.Length);

    var cds = new COPYDATASTRUCT
    {
        dwData = new IntPtr(1),   // 自定义类型标记
        cbData = bytes.Length,
        lpData = pData
    };

    IntPtr pCds = Marshal.AllocHGlobal(Marshal.SizeOf(cds));
    Marshal.StructureToPtr(cds, pCds, false);

    SendMessage(hWnd, 0x004A /* WM_COPYDATA */, IntPtr.Zero, pCds);

    Marshal.FreeHGlobal(pCds);
    Marshal.FreeHGlobal(pData);
}
```

```cpp
// C++ 接收方
case WM_COPYDATA:
{
    auto* cds = reinterpret_cast<COPYDATASTRUCT*>(lParam);
    if (cds->dwData == 1)
    {
        // lpData 是系统复制的副本，直接使用，无生命周期问题
        std::string text(reinterpret_cast<char*>(cds->lpData),
                         cds->cbData - 1); // 去掉 null terminator
    }
    return TRUE;
}
```

## 总结

- 同进程：`SendMessage` + `Marshal.StringToHGlobalAnsi` → C++ 侧直接 `reinterpret_cast<LPCSTR>` 读取
- 必须在 `finally` 释放 Marshal 分配的内存（`SendMessage` 同步返回后已安全）
- C++ 侧接收后立即拷贝字符串，不要保存原始指针
- 跨进程场景改用 `WM_COPYDATA`，系统会自动复制内存区域', '2023-06-09', '["C#","C++","Windows","互操作","PInvoke"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('data-structures-fundamentals', '数据结构基础：从数组到红黑树', '系统梳理常用数据结构的核心原理、时间复杂度和适用场景。数组、链表、栈、队列、哈希表、二叉树、堆、图，每种结构附实现要点和 C++ 代码片段。', 'import Chart from ''../../components/Chart.vue''

export const lookupComplexityData = {
  labels: [''数组'', ''链表'', ''哈希表'', ''BST(平衡)'', ''堆'', ''图(BFS)''],
  datasets: [
    {
      label: ''平均查找复杂度（1=O(1), 2=O(log n), 3=O(n)）'',
      data: [1, 3, 1, 2, 2, 3],
      backgroundColor: [
        ''rgba(0,212,255,0.7)'',
        ''rgba(255,0,170,0.7)'',
        ''rgba(0,255,128,0.7)'',
        ''rgba(255,200,0,0.7)'',
        ''rgba(180,0,255,0.7)'',
        ''rgba(255,100,0,0.7)'',
      ],
      borderColor: [
        ''rgba(0,212,255,1)'',
        ''rgba(255,0,170,1)'',
        ''rgba(0,255,128,1)'',
        ''rgba(255,200,0,1)'',
        ''rgba(180,0,255,1)'',
        ''rgba(255,100,0,1)'',
      ],
      borderWidth: 2,
    },
  ],
}

export const lookupComplexityOptions = {
  indexAxis: ''y'',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const map = { 1: ''O(1)'', 2: ''O(log n)'', 3: ''O(n)'' }
          return ` ${map[ctx.raw] || ctx.raw}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        stepSize: 1,
        callback: (val) => ({ 1: ''O(1)'', 2: ''O(log n)'', 3: ''O(n)'' }[val] || val),
      },
      min: 0,
      max: 3.5,
    },
  },
}

选数据结构不是为了背面试题——是为了**做出正确的工程决策**。

用错了数据结构，代码不会报错，但会慢。慢到你追不上来。

一个真实案例：某游戏引擎在每帧遍历 `std::list<Entity>` 做碰撞检测，改成 `std::vector` 之后帧率翻倍，原因是链表节点在内存里不连续，CPU cache miss 代价在高频循环里被放大了数十倍。

数据结构的价值在于：**同样的逻辑，不同的结构，性能可以差 100 倍**。

---

## 数组 Array

**核心思路**：连续内存块，下标直接寻址。静态数组大小固定；动态数组（`std::vector`）在容量不足时以 2x 因子扩容，均摊 O(1) push_back。

| 操作 | 时间复杂度 |
|------|-----------|
| 随机访问（按下标） | O(1) |
| 尾部插入（均摊） | O(1) |
| 中间插入 / 删除 | O(n) |
| 搜索（无序） | O(n) |

**Cache Locality 优势**：数组元素在内存中紧密排列，CPU 预取一次缓存行（64 bytes）可以装下多个元素。链表节点散落各处，每次指针跳转都可能触发 cache miss，在密集遍历场景下代价极高。

```cpp
#include <vector>
#include <algorithm>

// 动态数组：预分配容量避免频繁扩容
std::vector<int> v;
v.reserve(1000);           // 预分配，不改变 size
v.push_back(42);           // O(1) 均摊
v.insert(v.begin(), 0);    // O(n)，头插代价高

// 随机访问
int x = v[3];              // O(1)，不检查边界
int y = v.at(3);           // O(1)，抛 out_of_range

// 排序后二分查找
std::sort(v.begin(), v.end());
bool found = std::binary_search(v.begin(), v.end(), 42);  // O(log n)
```

**适用场景**：
- 频繁随机访问、下标遍历
- 数据量可预估，需要 cache 友好的密集计算（矩阵、图像像素）
- 作为其他结构（堆、哈希表槽）的底层存储

---

## 链表 Linked List

**核心思路**：节点通过指针串联，无需连续内存。单链表每节点存 `next`，双链表额外存 `prev`，支持 O(1) 双向删除。

| 操作 | 时间复杂度 |
|------|-----------|
| 随机访问 | O(n) |
| 头 / 尾插入（已知位置） | O(1) |
| 中间插入（已知迭代器） | O(1) |
| 搜索 | O(n) |

**list vs vector 的权衡**：

```cpp
#include <list>

std::list<int> lst = {1, 2, 3, 4, 5};

// 在已知迭代器位置插入是 O(1)
auto it = std::find(lst.begin(), lst.end(), 3);
lst.insert(it, 99);   // 在 3 前面插入 99，不移动其他元素

// 删除也是 O(1)（已知迭代器）
lst.erase(it);        // 删除 3

// splice：O(1) 把另一个 list 的元素移过来，不拷贝
std::list<int> other = {10, 20};
lst.splice(lst.end(), other);  // 把 other 全部接到 lst 末尾
```

**何时选 `std::list` 而不是 `std::vector`**：
- 需要在容器中间**频繁插入/删除**，且持有迭代器不失效（如 LRU Cache 实现）
- 使用 `splice` 做 O(1) 节点转移（如任务调度队列）

**何时坚持用 `std::vector`**：
- 几乎所有顺序遍历场景——cache locality 优势通常超过 list 的插入优势
- 数据量 < 几百个元素时，vector 搜索甚至比 map 快（SIMD 顺序扫描）

---

## 栈 Stack

**核心思路**：LIFO（Last In First Out）。只操作栈顶，push/pop 均 O(1)。

| 操作 | 时间复杂度 |
|------|-----------|
| push / pop | O(1) |
| peek（查看栈顶） | O(1) |

**Call Stack 类比**：函数调用天然是栈结构——调用函数时压栈（保存局部变量 + 返回地址），返回时弹栈。递归爆栈（stack overflow）就是压栈次数超出系统限制。

```cpp
#include <stack>
#include <string>
#include <stdexcept>

// 括号匹配：经典栈应用
bool isValid(const std::string& s) {
    std::stack<char> st;
    for (char c : s) {
        if (c == ''('' || c == ''['' || c == ''{'') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if (c == '')'' && top != ''('') return false;
            if (c == '']'' && top != ''['') return false;
            if (c == ''}'' && top != ''{'') return false;
        }
    }
    return st.empty();
}

// 单调栈：O(n) 解决"下一个更大元素"
std::vector<int> nextGreater(const std::vector<int>& nums) {
    int n = nums.size();
    std::vector<int> res(n, -1);
    std::stack<int> st;  // 存下标
    for (int i = 0; i < n; i++) {
        while (!st.empty() && nums[i] > nums[st.top()]) {
            res[st.top()] = nums[i];
            st.pop();
        }
        st.push(i);
    }
    return res;
}
```

**适用场景**：括号/表达式解析、DFS 迭代实现、撤销/重做（Undo/Redo）、函数调用模拟。

---

## 队列 Queue

**核心思路**：FIFO（First In First Out）。队尾入队，队头出队，均 O(1)。双端队列（deque）两端都可操作。

| 操作 | 时间复杂度 |
|------|-----------|
| enqueue（push_back） | O(1) |
| dequeue（pop_front） | O(1) |
| peek | O(1) |

```cpp
#include <queue>
#include <vector>

// BFS 模板：图的层序遍历
void bfs(int start, const std::vector<std::vector<int>>& adj) {
    int n = adj.size();
    std::vector<bool> visited(n, false);
    std::queue<int> q;

    visited[start] = true;
    q.push(start);

    while (!q.empty()) {
        int node = q.front(); q.pop();
        // 处理 node
        for (int neighbor : adj[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
}
```

**适用场景**：BFS、任务调度（先来先服务）、消息队列、滑动窗口（配合 `std::deque`）。

---

## 哈希表 Hash Table

**核心思路**：通过哈希函数将 key 映射到数组槽，实现近似 O(1) 的增删查。冲突解决主要有两种策略：

- **链地址法（Chaining）**：每个槽是链表，`std::unordered_map` 采用此方案
- **开放地址法（Open Addressing）**：冲突时探测其他槽，cache 友好但删除复杂

| 操作 | 平均 | 最坏（哈希碰撞退化） |
|------|------|---------------------|
| 插入 | O(1) | O(n) |
| 删除 | O(1) | O(n) |
| 查找 | O(1) | O(n) |

**Load Factor（负载因子）**：`元素数 / 槽数`。`unordered_map` 默认最大 load factor 为 1.0，超过时触发 rehash（扩容 + 重新哈希），代价 O(n)。

```cpp
#include <unordered_map>
#include <string>

// 词频统计
std::unordered_map<std::string, int> freq;
std::string words[] = {"hello", "world", "hello", "cpp"};
for (const auto& w : words) {
    freq[w]++;   // 不存在则默认构造为 0
}

// 预分配桶，减少 rehash
freq.reserve(1000);          // 至少 1000 个桶
freq.max_load_factor(0.7f);  // 提前触发扩容，减少碰撞

// 遍历
for (const auto& [key, val] : freq) {
    // key: "hello"=2, "world"=1, "cpp"=1
}

// 自定义哈希（用于自定义 key 类型）
struct PairHash {
    size_t operator()(const std::pair<int,int>& p) const {
        return std::hash<int>{}(p.first) ^ (std::hash<int>{}(p.second) << 32);
    }
};
std::unordered_map<std::pair<int,int>, int, PairHash> grid;
```

**适用场景**：O(1) 查找（缓存、去重）、词频/计数、图的邻接表、两数之和类问题。

**注意**：哈希表无序，需要有序遍历时用 `std::map`（红黑树）。

---

## 时间复杂度汇总

<Chart client:only="vue" type="bar" data={lookupComplexityData} options={lookupComplexityOptions} height={240} />

---

## 二叉搜索树 BST

**核心思路**：左子树所有节点 < 根 < 右子树所有节点。中序遍历输出有序序列。

| 操作 | 平均 | 最坏（退化为链表） |
|------|------|-------------------|
| 插入 | O(log n) | O(n) |
| 删除 | O(log n) | O(n) |
| 查找 | O(log n) | O(n) |

**退化问题**：按有序序列插入时，BST 退化为链表，所有操作变 O(n)。这是 AVL 树和红黑树的动机。

```cpp
struct TreeNode {
    int val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
    TreeNode(int v) : val(v) {}
};

// BST 插入
TreeNode* insert(TreeNode* root, int val) {
    if (!root) return new TreeNode(val);
    if (val < root->val)
        root->left = insert(root->left, val);
    else if (val > root->val)
        root->right = insert(root->right, val);
    return root;
}

// 中序遍历（输出有序序列）
void inorder(TreeNode* root, std::vector<int>& result) {
    if (!root) return;
    inorder(root->left, result);
    result.push_back(root->val);
    inorder(root->right, result);
}
```

---

## AVL 树 vs 红黑树

两者都是**自平衡 BST**，保证树高 O(log n)，但平衡策略不同：

| 特性 | AVL 树 | 红黑树 |
|------|--------|--------|
| 平衡条件 | 左右子树高度差 ≤ 1（严格） | 5 条颜色规则（宽松） |
| 查找性能 | 略优（树更矮） | 略差 |
| 插入 / 删除旋转次数 | 多 | 少（最多 3 次旋转） |
| 适合场景 | 读多写少 | 读写均衡 |

**为什么 `std::map` / `std::set` 用红黑树**：
标准库容器需要同时支持高效插入、删除、查找。红黑树的插入/删除旋转次数有严格上界（插入最多 2 次，删除最多 3 次），而 AVL 树在删除时可能需要 O(log n) 次旋转。对于通用容器，红黑树在修改操作上更稳定。

```cpp
#include <map>
#include <set>

// std::map 底层红黑树，有序，O(log n) 操作
std::map<std::string, int> scores;
scores["Alice"] = 95;
scores["Bob"] = 87;

// 范围查询（利用有序性）
auto it = scores.lower_bound("Alice");  // >= "Alice" 的第一个

// std::set：唯一有序集合
std::set<int> nums = {3, 1, 4, 1, 5, 9};  // 自动去重并排序
// 结果：{1, 3, 4, 5, 9}
```

---

## 堆 Heap

**核心思路**：完全二叉树，用数组存储（节点 i 的左孩子为 2i+1，右孩子为 2i+2）。最大堆保证父节点 ≥ 子节点，根节点是最大值。

| 操作 | 时间复杂度 |
|------|-----------|
| 插入（push） | O(log n) |
| 删除最大值（pop） | O(log n) |
| 查看最大值（peek） | O(1) |
| 建堆（heapify） | O(n) |

**Heapify O(n) 建堆原理**：从最后一个非叶节点向上 sift-down，大部分节点在树的底部高度小，总代价收敛到 O(n)（而非 n 次 O(log n) 插入的 O(n log n)）。

```cpp
#include <queue>
#include <vector>
#include <functional>  // std::greater

// 最大堆（默认）
std::priority_queue<int> maxHeap;
maxHeap.push(3);
maxHeap.push(1);
maxHeap.push(4);
int top = maxHeap.top();  // 4
maxHeap.pop();

// 最小堆
std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;

// 自定义比较（按第二元素排序）
using P = std::pair<int, int>;
auto cmp = [](const P& a, const P& b) { return a.second > b.second; };
std::priority_queue<P, std::vector<P>, decltype(cmp)> pq(cmp);

// 手动 heapify（从无序数组 O(n) 建堆）
std::vector<int> arr = {3, 1, 4, 1, 5, 9, 2, 6};
std::make_heap(arr.begin(), arr.end());  // 最大堆，O(n)
std::sort_heap(arr.begin(), arr.end()); // 堆排序，O(n log n)
```

**适用场景**：Top-K 问题、Dijkstra 最短路、任务调度（优先级队列）、中位数维护（双堆）。

---

## 图 Graph

**核心思路**：节点（Vertex）+ 边（Edge）。存储方式影响空间和遍历效率：

| 存储方式 | 空间 | 查询边是否存在 | 遍历邻居 |
|---------|------|---------------|---------|
| 邻接矩阵 | O(V²) | O(1) | O(V) |
| 邻接表 | O(V+E) | O(degree) | O(degree) |

**选择原则**：稠密图（E 接近 V²）用矩阵；稀疏图（E 远小于 V²，如路网、社交网络）用邻接表。

```cpp
#include <vector>
#include <queue>
#include <stack>

// 邻接表建图
int V = 6;
std::vector<std::vector<int>> adj(V);
auto addEdge = [&](int u, int v) {
    adj[u].push_back(v);
    adj[v].push_back(u);  // 无向图
};

// BFS：最短路径（无权图）
std::vector<int> bfsShortestPath(int src, int dst) {
    std::vector<int> dist(V, -1);
    std::vector<int> parent(V, -1);
    std::queue<int> q;

    dist[src] = 0;
    q.push(src);

    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                parent[v] = u;
                q.push(v);
            }
        }
    }

    // 回溯路径
    std::vector<int> path;
    for (int v = dst; v != -1; v = parent[v])
        path.push_back(v);
    std::reverse(path.begin(), path.end());
    return path;
}

// DFS：迭代实现（避免递归栈溢出）
void dfsIterative(int start) {
    std::vector<bool> visited(V, false);
    std::stack<int> st;

    st.push(start);
    while (!st.empty()) {
        int u = st.top(); st.pop();
        if (visited[u]) continue;
        visited[u] = true;
        // 处理 u
        for (int v : adj[u]) {
            if (!visited[v]) st.push(v);
        }
    }
}
```

**适用场景**：
- BFS：最短路径（无权）、层序遍历、连通分量
- DFS：拓扑排序、强连通分量、迷宫/路径搜索
- 带权图：Dijkstra（非负权）、Bellman-Ford（含负权）

---

## 选型速查表

| 场景 | 推荐数据结构 | 原因 |
|------|------------|------|
| 频繁随机访问，顺序遍历 | `std::vector` | cache 友好，O(1) 随机访问 |
| 频繁中间插入/删除，持有迭代器 | `std::list` | O(1) 插删（已知位置） |
| LIFO、表达式解析、DFS | `std::stack` | 语义清晰，底层 deque |
| BFS、任务队列 | `std::queue` | FIFO 语义 |
| O(1) 查找，无序 | `std::unordered_map` | 哈希 O(1) 均摊 |
| 有序遍历，范围查询 | `std::map` / `std::set` | 红黑树，有序 O(log n) |
| Top-K，优先调度 | `std::priority_queue` | 堆，O(log n) push/pop |
| 最短路径，连通性 | 邻接表 + BFS/Dijkstra | 稀疏图 O(V+E) |
| 数学矩阵，稠密图 | 二维 `std::vector` | 邻接矩阵 O(1) 查边 |
| 区间查询，前缀和 | Segment Tree / BIT | O(log n) 区间操作 |

---

理解了这些结构的本质，再看算法题或工程代码，会有一种"看穿骨架"的感觉——不是在背答案，是在做选择。', '2026-05-01', '["数据结构","算法","cpp","基础"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('duilib-static-build', '正确编译 Duilib 静态库：避免 ATL 依赖和链接错误', '详解如何用 DuiLib_Static.vcxproj 编译 Duilib 静态库，解决 VARIANT 未定义、Unicode 配置不匹配和 ATL 依赖等常见问题。', 'Duilib 是一个轻量级的 Windows 界面库，常用于制作带自定义皮肤的桌面程序。编译它的静态库版本时，有几个坑非常容易踩，本文把完整流程和常见错误一次讲清楚。

> ⚠️ **注意**：Duilib 原仓库（[duilib/duilib](https://github.com/duilib/duilib)）自 2019 年后已基本停止维护。新项目建议考虑更活跃的替代方案，如 [DuiLib_Ultimate](https://github.com/qdtroy/DuiLib_Ultimate)、[DirectUI](https://github.com/miao-zhen/DirectUI) 或直接使用 Qt/WinUI 3。本文内容适用于需要维护存量 Duilib 项目的场景。

---

## 为什么要用静态库

Duilib 有两种使用方式：

- **DLL 动态库**：程序体积小，但分发时需要附带 `.dll` 文件
- **静态库**：将 Duilib 代码直接编译进 exe，单文件分发，无运行时依赖

对于要分发给用户的桌面程序，静态库几乎是更优选择。

---

## 编译步骤

### 1. 打开正确的工程文件

Duilib 仓库里有多个 `.vcxproj`，要用静态库版本：

```
DuiLib\DuiLib_Static.vcxproj
```

不要用 `DuiLib.vcxproj`（那是 DLL 版本）。

### 2. 复制 .filters 文件（重要）

Visual Studio 需要 `.vcxproj.filters` 文件来显示项目文件树结构。如果没有 `.filters` 文件，VS 可能报错或无法加载：

```
DuiLib\DuiLib_Static.vcxproj.filters
```

如果该文件不存在，从 `DuiLib.vcxproj.filters` 复制一份并重命名。

### 3. 选择正确的编译配置

Duilib 静态库有四个配置：

| 配置名 | 字符集 | 说明 |
|--------|--------|------|
| Debug | 多字节 | 调试，多字节 |
| Release | 多字节 | 发布，多字节 |
| UnicodeDebug | Unicode | 调试，Unicode |
| UnicodeRelease | Unicode | 发布，Unicode |

**新项目默认用 Unicode**，因此选 **UnicodeDebug** 或 **UnicodeRelease**。

> ⚠️ **关键**：你的主项目字符集必须与 Duilib 静态库的字符集**完全一致**，否则链接时会出现符号不匹配。

点击 **生成 → 生成 DuiLib_Static**，等待编译完成，产出 `DuiLib.lib`。

---

## 新建测试项目

### 配置包含目录和库目录

在主项目属性中：

1. **C/C++ → 常规 → 附加包含目录**：添加 Duilib 根目录
2. **链接器 → 常规 → 附加库目录**：添加 `DuiLib\lib` 或你的输出目录
3. **链接器 → 输入 → 附加依赖项**：添加 `DuiLib.lib`

还需要链接 Windows 基础库：

```
DuiLib.lib
imm32.lib
shlwapi.lib
```

---

## 必须添加：ATL 依赖

编译主项目时，经常会遇到这样的错误：

```
error C2079: ''tagVARIANT::bstrVal'' uses undefined struct ''tagBSTR''
error C2065: ''VARIANT'': undeclared identifier
```

这是因为 Duilib 内部使用了 `VARIANT`、`BSTR` 等 COM 类型，这些定义来自 ATL 头文件，但默认的 Win32 项目不包含 ATL。

### 解决方案：在 stdafx.h 中添加 ATL 头文件

```cpp
// stdafx.h（预编译头文件）

// 防止 ATL CString 构造函数的警告
#define _ATL_CSTRING_EXPLICIT_CONSTRUCTORS

// ATL 基础（提供 COM 支持）
#include <atlbase.h>

// ATL 字符串（提供 CString，替代 MFC 版本）
#include <atlstr.h>
```

放在其他 `#include` 之前，重新编译即可解决 `VARIANT` 未定义的问题。

### 为什么需要 ATL

- `atlbase.h`：提供 COM 智能指针（`CComPtr`）、`VARIANT` 封装等
- `atlstr.h`：提供独立于 MFC 的 `CString` 实现
- `VARIANT` 是 COM 的核心数据类型，`BSTR` 是 COM 字符串类型，Duilib 的脚本引擎和属性系统用到了它们

---

## Unicode vs 多字节配置匹配

这是**最常见的链接错误来源**之一。

### 错误现象

```
error LNK2019: unresolved external symbol "public: static class ATL::CStringT<wchar_t,...>"
```

或者链接成功但运行时乱码。

### 根本原因

Unicode 配置下，`CString` 是 `CStringW`（`wchar_t`），多字节配置下是 `CStringA`（`char`）。如果 Duilib 用 Unicode 编译，但主项目用多字节，两边的符号表不匹配。

### 解决方法

确保**主项目**的字符集与 Duilib 一致：

1. 右键主项目 → 属性 → 常规 → 字符集
2. 改为 **使用 Unicode 字符集**（对应 UnicodeDebug/UnicodeRelease）

或者将整个解决方案的字符集统一：

- 菜单 → 生成 → 批生成，检查所有项目配置是否一致

---

## 常见链接错误排查

### 错误 1：LNK2001 无法解析的外部符号

```
error LNK2001: unresolved external symbol _DuiLib_xxx
```

**原因**：库路径未正确配置，或 `.lib` 文件未添加到附加依赖项。

**排查**：确认 `DuiLib.lib` 存在于配置的库目录，且已加入附加依赖项。

### 错误 2：LNK2038 检测到不匹配项

```
error LNK2038: mismatch detected for ''_ITERATOR_DEBUG_LEVEL'': value ''2'' doesn''t match value ''0''
```

**原因**：Debug 版主项目链接了 Release 版 Duilib 库（或反之）。

**解决**：确保 Debug 配置链接 Debug 版本的 `.lib`，Release 同理。可在属性中针对不同配置指定不同的库路径。

### 错误 3：LIBCMT 与 MSVCRT 冲突

```
warning LNK4098: defaultlib ''LIBCMT'' conflicts with use of other libs
```

**原因**：运行时库类型不一致。

**解决**：统一运行时库设置（C/C++ → 代码生成 → 运行库），项目和 Duilib 必须一致：

| 配置 | 运行时库 |
|------|---------|
| Debug + 动态 | `/MDd` |
| Release + 动态 | `/MD` |
| Debug + 静态 | `/MTd` |
| Release + 静态 | `/MT` |

---

## 完整 stdafx.h 示例

```cpp
// stdafx.h

#pragma once

// 防止 Windows 头文件包含不常用的内容
#define WIN32_LEAN_AND_MEAN

// Windows 最低版本要求（Vista+）
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0600
#endif

// ATL 配置（必须在 ATL 头文件之前）
#define _ATL_CSTRING_EXPLICIT_CONSTRUCTORS
#define _ATL_NO_AUTOMATIC_NAMESPACE

#include <atlbase.h>
#include <atlstr.h>

// Duilib 主头文件
#include "UIlib.h"

using namespace DuiLib;
```

---

## 总结

编译 Duilib 静态库的关键要点：

1. 使用 `DuiLib_Static.vcxproj`，复制 `.filters` 文件
2. 字符集选 **Unicode**（UnicodeDebug / UnicodeRelease）
3. 主项目也必须用 Unicode，并与 Duilib 的 Debug/Release 配置对应
4. `stdafx.h` 中加 `atlbase.h` 和 `atlstr.h`，定义 `_ATL_CSTRING_EXPLICIT_CONSTRUCTORS`
5. 附加依赖项加上 `imm32.lib` 和 `shlwapi.lib`', '2022-08-24', '["cpp","duilib","windows","mfc"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('electron-ipc-types', 'Electron IPC 类型安全：从 any 到完全类型化', '用 TypeScript 泛型封装 Electron IPC，彻底消灭 any，preload 契约集中管理', '## 问题

Electron IPC 的默认写法是这样的：

```typescript
// main.ts — 地狱
ipcMain.handle(''get-config'', async () => { /* ... */ })

// renderer — 更地狱
const result = await ipcRenderer.invoke(''get-config'') // any
```

字符串 channel 名散落全项目，参数类型全是 `any`，重构时改了 main 忘改 renderer，
运行时才发现。这不是工程，这是赌博。

## 解决思路

定义一个**中心契约**，所有 IPC channel 的入参和返回值都在这里声明。

```typescript
// src/shared/ipc-contract.ts

export interface IpcContract {
  // invoke 风格：请求-响应
  ''config:get'': {
    request: void
    response: AppConfig
  }
  ''config:set'': {
    request: Partial<AppConfig>
    response: { ok: boolean; error?: string }
  }
  ''device:list'': {
    request: void
    response: DeviceInfo[]
  }
  ''device:connect'': {
    request: { vid: number; pid: number }
    response: { ok: boolean }
  }
}

// 主进程推送给渲染进程的事件（单向）
export interface IpcEvents {
  ''device:status-changed'': { connected: boolean; deviceId?: string }
  ''config:updated'': AppConfig
  ''log:line'': { level: ''info'' | ''warn'' | ''error''; message: string }
}
```

两个接口分开：`IpcContract` 用于 `invoke`（双向），`IpcEvents` 用于主进程 `→` 渲染进程的单向推送。

## 类型化 invoke 封装

### 渲染侧（preload 里）

```typescript
// src/preload/bridge.ts
import { contextBridge, ipcRenderer } from ''electron''
import type { IpcContract, IpcEvents } from ''../shared/ipc-contract''

type InvokeChannel = keyof IpcContract
type Req<C extends InvokeChannel> = IpcContract[C][''request'']
type Res<C extends InvokeChannel> = IpcContract[C][''response'']

// invoke 封装：request 为 void 时不需要传参
const invoke = <C extends InvokeChannel>(
  channel: C,
  ...args: Req<C> extends void ? [] : [Req<C>]
): Promise<Res<C>> => ipcRenderer.invoke(channel, ...args)
```

### 主进程侧（双端类型安全）

主进程的 `ipcMain.handle` 也可以用同样的泛型约束，让两端都受类型保护：

```typescript
// src/main/ipc-handler.ts
import { ipcMain } from ''electron''
import type { IpcContract } from ''../shared/ipc-contract''

type InvokeChannel = keyof IpcContract
type Req<C extends InvokeChannel> = IpcContract[C][''request'']
type Res<C extends InvokeChannel> = IpcContract[C][''response'']

// 类型化的 handle 封装
function handle<C extends InvokeChannel>(
  channel: C,
  handler: (req: Req<C>) => Promise<Res<C>> | Res<C>
) {
  ipcMain.handle(channel, (_event, req) => handler(req))
}

// 使用：channel 名和参数类型全部受约束
handle(''config:get'', async () => {
  return loadConfig() // 返回类型必须匹配 AppConfig ✅
})

handle(''config:set'', async (req) => {
  // req 类型是 Partial<AppConfig>，不是 any ✅
  await saveConfig(req)
  return { ok: true }
})

handle(''device:connect'', async ({ vid, pid }) => {
  // 解构直接有类型提示 ✅
  const ok = await connectDevice(vid, pid)
  return { ok }
})
```

## 事件推送（on/send）的类型化

`invoke` 是请求-响应模型。但有些场景是**主进程主动推送**给渲染进程：设备状态变化、后台任务进度、日志流……这需要用 `ipcMain.emit` + `webContents.send` + `ipcRenderer.on`。

### 主进程：发送事件

```typescript
// src/main/events.ts
import { BrowserWindow } from ''electron''
import type { IpcEvents } from ''../shared/ipc-contract''

type EventChannel = keyof IpcEvents

// 类型化的 send 封装
function sendToRenderer<C extends EventChannel>(
  win: BrowserWindow,
  channel: C,
  payload: IpcEvents[C]
) {
  win.webContents.send(channel, payload)
}

// 使用示例
sendToRenderer(mainWindow, ''device:status-changed'', { connected: true, deviceId: ''abc'' })
// payload 类型受 IpcEvents 约束，传错会报错 ✅
```

### 渲染侧：监听事件（也在 preload 里封装）

```typescript
// preload 里加上 on 封装
import type { IpcEvents } from ''../shared/ipc-contract''

type EventChannel = keyof IpcEvents

const on = <C extends EventChannel>(
  channel: C,
  listener: (payload: IpcEvents[C]) => void
): (() => void) => {
  // 包一层让返回值是"取消订阅"函数，方便组件 onUnmounted 清理
  const wrapped = (_event: Electron.IpcRendererEvent, payload: IpcEvents[C]) =>
    listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.off(channel, wrapped)
}
```

## 完整的 preload.ts

把 `invoke` 和 `on` 都通过 `contextBridge` 暴露出去：

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from ''electron''
import type { IpcContract, IpcEvents } from ''../shared/ipc-contract''

type InvokeChannel = keyof IpcContract
type Req<C extends InvokeChannel> = IpcContract[C][''request'']
type Res<C extends InvokeChannel> = IpcContract[C][''response'']

type EventChannel = keyof IpcEvents

const bridge = {
  // 请求-响应
  invoke<C extends InvokeChannel>(
    channel: C,
    ...args: Req<C> extends void ? [] : [Req<C>]
  ): Promise<Res<C>> {
    return ipcRenderer.invoke(channel, ...args)
  },

  // 主进程推送事件订阅，返回取消函数
  on<C extends EventChannel>(
    channel: C,
    listener: (payload: IpcEvents[C]) => void
  ): () => void {
    const wrapped = (_: Electron.IpcRendererEvent, payload: IpcEvents[C]) =>
      listener(payload)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.off(channel, wrapped)
  },
}

contextBridge.exposeInMainWorld(''bridge'', bridge)

// 全局类型声明（配合 tsconfig paths 或放在 global.d.ts）
declare global {
  interface Window {
    bridge: typeof bridge
  }
}
```

在 Vue 组件里使用：

```typescript
// DeviceStatus.vue
import { ref, onMounted, onUnmounted } from ''vue''

const connected = ref(false)
let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = window.bridge.on(''device:status-changed'', ({ connected: c }) => {
    connected.value = c
    // payload 类型完整推断，无需断言 ✅
  })
})

onUnmounted(() => {
  unsubscribe?.() // 清理，避免内存泄漏
})
```

## 运行时验证：为什么仅靠 TypeScript 不够

TypeScript 的类型检查只在**编译期**有效。IPC 跨越进程边界，数据以序列化形式传输——渲染进程发来的数据在主进程眼里就是一个 JSON 反序列化结果，编译器管不到。

攻击场景：恶意扩展或 XSS 注入代码直接调用 `ipcRenderer.invoke(''config:set'', { evil: ''...'' })`，绕过 TypeScript，主进程收到的是任意 payload。

解决方案：用 **[Zod](https://github.com/colinhacks/zod)** 在主进程侧做运行时 schema 验证。

```typescript
// src/shared/ipc-schemas.ts
import { z } from ''zod''

export const IpcSchemas = {
  ''config:set'': z.object({
    theme: z.enum([''light'', ''dark'']).optional(),
    language: z.string().optional(),
    autoUpdate: z.boolean().optional(),
  }),
  ''device:connect'': z.object({
    vid: z.number().int().min(0).max(0xffff),
    pid: z.number().int().min(0).max(0xffff),
  }),
} satisfies Partial<Record<keyof IpcContract, z.ZodTypeAny>>
```

在 `handle` 封装里加入验证层：

```typescript
// src/main/ipc-handler.ts（加了验证的版本）
import { IpcSchemas } from ''../shared/ipc-schemas''

function handle<C extends InvokeChannel>(
  channel: C,
  handler: (req: Req<C>) => Promise<Res<C>> | Res<C>
) {
  ipcMain.handle(channel, async (_event, req) => {
    // 如果有 schema，先验证
    const schema = IpcSchemas[channel as keyof typeof IpcSchemas]
    if (schema) {
      const result = schema.safeParse(req)
      if (!result.success) {
        // 验证失败返回错误，而不是崩溃
        console.error(`[IPC] Invalid payload for ${channel}:`, result.error.flatten())
        throw new Error(`Invalid IPC payload: ${channel}`)
      }
      req = result.data // 用 zod 解析后的值（已过滤多余字段）
    }
    return handler(req)
  })
}
```

这样就形成了**双重保险**：TypeScript 在编译期保护开发体验，Zod 在运行时保护主进程安全。

## 使用效果

```typescript
// renderer — 完全类型化
const config = await window.bridge.invoke(''config:get'')
//    ^? AppConfig  ✅

await window.bridge.invoke(''device:connect'', { vid: 0x1234, pid: 0x5678 })
//                                            ^? { vid: number; pid: number } ✅

await window.bridge.invoke(''config:get'', { wrong: true })
//                                        ^? TS Error: 应为 void ✅

await window.bridge.invoke(''nonexistent-channel'')
//                          ^? TS Error: 不在 IpcContract 里 ✅
```

## 小结

| 层次 | 工具 | 作用 |
|------|------|------|
| 契约定义 | `IpcContract` + `IpcEvents` | 单一事实来源，所有 channel 在这里 |
| 编译期检查 | TypeScript 泛型 | channel 名、参数、返回值全部类型安全 |
| 运行时验证 | Zod schema | 防止恶意或异常 payload 进入主进程 |
| 清理机制 | `on()` 返回取消函数 | 配合 Vue `onUnmounted` 防内存泄漏 |

10 分钟的前期投入，换来整个项目 IPC 层零 `any`，重构时 TS 报错直接定位，主进程也不再裸奔。', '2026-04-25', '["electron","typescript","ipc","vue"]', 0);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('element-plus-popover-hide', '手动关闭多个 el-popover（不用 v-model:visible）', '通过 ref + Reflect.get 调用 hide() 方法手动关闭 Element Plus Popover，解释 Vue3 Proxy 导致无法直接调用实例方法的原因。', '## 问题背景

列表里每一行都有一个 `el-popover`，点击行内按钮弹出，点击确认/取消后关闭。

最直觉的做法是用 `v-model:visible` 绑定一个布尔值数组：

```vue
<el-popover
  v-for="(item, index) in list"
  :key="item.id"
  v-model:visible="popoverVisible[index]"
  trigger="click"
/>
```

这样每一行都需要一个独立的响应式变量，而且打开一个 popover 时还要手动关闭其他的，逻辑变复杂。

更麻烦的是，有时候 popover 是在子组件里渲染的，`visible` 的状态要通过 props/emit 传来传去，不值得。

**想要的效果**：直接拿到组件实例，调用它的 `hide()` 方法，不维护任何 visible 状态。

---

## 方案一：单个 popover，ref + hide()

先看最简单的情况——只有一个 popover。

```vue
<template>
  <el-popover
    ref="popoverRef"
    :width="260"
    trigger="click"
    popper-class="modify-popover"
  >
    <template #default>
      <p>确认要修改吗？</p>
      <el-button size="small" @click="handleConfirm">确认</el-button>
      <el-button size="small" @click="closePopover">取消</el-button>
    </template>
    <template #reference>
      <el-button>修改</el-button>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from ''vue''
import { ElPopover } from ''element-plus''

const popoverRef = ref<InstanceType<typeof ElPopover>>()

function closePopover() {
  // ❌ 直接调用报错：popoverRef.value.hide is not a function
  // popoverRef.value?.hide()

  // ✅ 正确写法：通过 Reflect.get 取出方法再调用
  const instance = popoverRef.value
  if (instance) {
    Reflect.get(instance, ''hide'').call(instance)
  }
}

function handleConfirm() {
  // 做业务逻辑...
  closePopover()
}
</script>
```

---

## 为什么不能直接调 .hide()？

这是 Vue3 响应式系统的副作用。

Vue3 用 `Proxy` 实现响应式，当你把组件实例存进 `ref()` 时，它被套了一层 Proxy：

```
ref.value → Proxy → 真实组件实例
```

Proxy 会拦截属性访问。Element Plus 的 `hide` 方法定义在组件暴露的接口上，而通过 Proxy 访问时，这个方法并不在 Proxy 的拦截白名单里（或者方法内部的 `this` 指向出现了问题）。

直接 `popoverRef.value.hide()` 有时候确实能访问到函数，但调用时 `this` 已经不是原始实例了，导致内部访问 `this.xxx` 失败。

`Reflect.get(target, key)` 的作用是**绕开 Proxy 的拦截，直接从目标对象上取属性**，然后用 `.call(instance)` 把 `this` 绑定回真实实例。

```ts
// 等价于：在原始对象上取 hide，再以 instance 为 this 调用它
const hideFn = Reflect.get(instance, ''hide'')
hideFn.call(instance)
```

---

## 方案二：多个 popover，ref 数组

列表场景下，需要存多个 popover 实例。

```vue
<template>
  <div v-for="(item, index) in list" :key="item.id" class="list-item">
    <span>{{ item.name }}</span>

    <el-popover
      :ref="(el) => setPopoverRef(el, index)"
      :width="260"
      trigger="click"
    >
      <template #default>
        <p>确认修改「{{ item.name }}」？</p>
        <div class="popover-actions">
          <el-button size="small" type="primary" @click="handleConfirm(index)">
            确认
          </el-button>
          <el-button size="small" @click="closePopover(index)">取消</el-button>
        </div>
      </template>
      <template #reference>
        <el-button size="small">修改</el-button>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from ''vue''
import { ElPopover } from ''element-plus''

interface ListItem {
  id: number
  name: string
}

const list = ref<ListItem[]>([
  { id: 1, name: ''项目 A'' },
  { id: 2, name: ''项目 B'' },
  { id: 3, name: ''项目 C'' },
])

// 用对象（而不是数组）存 ref，避免列表增删时索引错位
const popoverRefs = ref<Record<number, InstanceType<typeof ElPopover>>>({})

function setPopoverRef(el: unknown, index: number) {
  if (el) {
    popoverRefs.value[index] = el as InstanceType<typeof ElPopover>
  } else {
    // el 为 null 时说明组件已卸载，清理引用
    delete popoverRefs.value[index]
  }
}

function closePopover(index: number) {
  const instance = popoverRefs.value[index]
  if (!instance) return
  Reflect.get(instance, ''hide'').call(instance)
}

function handleConfirm(index: number) {
  const item = list.value[index]
  console.log(''确认修改：'', item.name)
  // 业务逻辑...
  closePopover(index)
}
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.popover-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
```

### 为什么用对象而不是数组

```ts
// ❌ 用数组的问题：列表删除第 1 项后，索引全部错位
const popoverRefs = ref<InstanceType<typeof ElPopover>[]>([])

// ✅ 用对象存，key 是稳定的 index（或更好：item.id）
const popoverRefs = ref<Record<number, InstanceType<typeof ElPopover>>>({})
```

如果列表项有稳定的 `id`，把 key 换成 `item.id` 更可靠：

```ts
function setPopoverRef(el: unknown, id: number) {
  if (el) {
    popoverRefs.value[id] = el as InstanceType<typeof ElPopover>
  } else {
    delete popoverRefs.value[id]
  }
}
```

---

## 完整示例：带关闭其他 popover 的版本

点击某一行时，先关闭所有已打开的 popover，再让当前的弹出（避免多个同时展示）：

```vue
<template>
  <el-table :data="tableData">
    <el-table-column prop="name" label="名称" />
    <el-table-column label="操作" width="120">
      <template #default="{ row, $index }">
        <el-popover
          :ref="(el) => setPopoverRef(el, row.id)"
          placement="left"
          :width="200"
          trigger="click"
          @show="closeOthers(row.id)"
        >
          <template #default>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row, $index)"
            >
              确认删除
            </el-button>
          </template>
          <template #reference>
            <el-button type="text" size="small">删除</el-button>
          </template>
        </el-popover>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ref } from ''vue''
import { ElPopover, ElMessage } from ''element-plus''

const tableData = ref([
  { id: 1, name: ''记录 A'' },
  { id: 2, name: ''记录 B'' },
  { id: 3, name: ''记录 C'' },
])

const popoverRefs = ref<Record<number, InstanceType<typeof ElPopover>>>({})

function setPopoverRef(el: unknown, id: number) {
  if (el) {
    popoverRefs.value[id] = el as InstanceType<typeof ElPopover>
  } else {
    delete popoverRefs.value[id]
  }
}

// 关闭除 excludeId 之外的所有 popover
function closeOthers(excludeId: number) {
  for (const [id, instance] of Object.entries(popoverRefs.value)) {
    if (Number(id) !== excludeId && instance) {
      Reflect.get(instance, ''hide'').call(instance)
    }
  }
}

function handleDelete(row: { id: number; name: string }, index: number) {
  // 关闭当前 popover
  Reflect.get(popoverRefs.value[row.id], ''hide'').call(popoverRefs.value[row.id])
  tableData.value.splice(index, 1)
  ElMessage.success(`已删除：${row.name}`)
}
</script>
```

`@show` 事件在 popover 打开时触发，此时关闭其他的，体验上比较自然。

---

## 小结

| 场景 | 方案 |
|------|------|
| 单个 popover，手动关闭 | `ref` + `Reflect.get(instance, ''hide'').call(instance)` |
| 多个 popover，关闭指定一个 | `ref` 对象（key 用 id）+ 同上 |
| 打开一个时关闭其他 | `@show` 事件里遍历关闭其他实例 |

核心是两点：
1. 不要维护 `visible` 数组，复杂度不值得。
2. 直接 `.hide()` 因为 Vue3 Proxy 可能失效，用 `Reflect.get` 绕过去。', '2024-10-25', '["vue","element-plus","vue3"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('exe-dll-single-package', '将 EXE 和 DLL 打包成单一可执行文件', '介绍两种将 exe 和依赖 dll 打包成单文件的方案：Enigma Virtual Box 和 WinRAR 自解压，适合发布 Windows 桌面程序时简化分发流程。', '发布一个 Windows 桌面程序时，经常遇到这种情况：主程序是一个 `app.exe`，但旁边还跟着一堆 `.dll`、资源文件、配置文件……发给别人一个文件夹，既不专业，也容易出现"少了某个 dll"的问题。

本文介绍两种把所有文件打包成**单一 `.exe`** 的方案，各有适用场景。

---

## 方案一：Enigma Virtual Box（推荐）

[Enigma Virtual Box](https://enigmaprotector.com/en/aboutvb.html) 是一款专为 Windows 程序设计的虚拟化打包工具，免费且不改变程序逻辑，是最推荐的方式。

### 工作原理

它将 DLL、资源文件等嵌入 EXE 内部，运行时在内存中虚拟文件系统里解压，程序对文件的访问被透明拦截，无需落盘。

### 操作步骤

1. **下载安装** Enigma Virtual Box，官网免费下载。
2. **打开主界面**，在 *Enter Input File Name* 中选择你的主 `exe`。
3. *Enter Output File Name* 填写输出路径（如 `app_packed.exe`）。
4. 点击 **Add** → *Add Files*，选中所有需要打包的 `.dll` 和资源文件。
   - 如果有子目录，可用 *Add Folder* 保留目录结构。
5. 确认文件列表无误后，点击 **Process**，等待完成。
6. 用输出的单文件测试，确认程序运行正常。

### 优缺点

| 优点 | 缺点 |
|------|------|
| 不落盘，运行速度快 | 打包较大的程序时，体积会明显增加 |
| 透明拦截，无需修改代码 | 部分杀毒软件可能误报（见注意事项） |
| 支持目录结构保留 | 不支持 64 位驱动级 DLL |
| 免费无限制 | — |

---

## 方案二：WinRAR 自解压

如果你手边没有 Enigma Virtual Box，或者程序还附带配置文件、数据文件等，可以用 WinRAR 制作自解压包。

### 操作步骤

1. 选中所有文件（`exe`、`dll`、资源文件等），**右键 → 添加到压缩文件**。
2. 压缩格式选 **RAR**（ZIP 格式不支持自解压高级选项）。
3. 勾选 **创建自解压格式压缩文件**，此时输出会变成 `.exe`。
4. 切换到 **高级** 选项卡，点击 **自解压选项**：
   - **常规** → *解压后运行*：填入主程序名称，如 `app.exe`
   - **高级** → *解压路径*：推荐选择 **%TEMP%** 或 **%AppData%** 下的子目录
   - **模式** → 选择 **全部隐藏**（静默解压）并勾选 **解包到临时文件夹**
   - **文本和图标** → 可自定义图标和提示文字
5. 确认设置后点击确定，生成最终的 `.exe`。

### 优缺点

| 优点 | 缺点 |
|------|------|
| 无需额外工具，WinRAR 即可 | 每次运行都要解压到临时目录，启动慢 |
| 适合包含大量资源文件的场景 | 临时文件夹残留，不够干净 |
| 可自定义解压界面和图标 | 压缩包结构被打开后可提取 |

---

## 两种方案对比

| 维度 | Enigma Virtual Box | WinRAR 自解压 |
|------|--------------------|--------------|
| 启动速度 | 快（内存虚拟化） | 慢（需解压） |
| 安全性 | 文件不落盘 | 文件会写到 TEMP 目录 |
| 适用文件类型 | DLL 为主 | 任意文件 |
| 是否需要安装工具 | 需安装 EVB | 需安装 WinRAR |
| 代码改动 | 无 | 无 |

**推荐逻辑**：

- 只有 DLL 依赖 → 用 **Enigma Virtual Box**
- 有大量资源/数据文件，且允许启动慢一点 → 用 **WinRAR 自解压**

---

## 注意事项

### 临时目录残留（WinRAR 方案）

自解压包解压后，文件通常留在 `%TEMP%\RarSFX*` 目录。如果主程序异常退出，不会自动清理。可以在程序退出时主动清理临时目录，或在自解压选项里设置"运行后删除临时文件"。

### 杀毒软件误报

两种方案生成的单文件都**容易被杀毒软件误报**，原因是：

- 自解压 EXE 是恶意软件的常用手段，行为特征相似
- 虚拟化打包会混淆程序结构，与加壳程序特征重叠

解决方式：
1. 用正规代码签名证书对输出文件签名（推荐）
2. 向杀软厂商提交白名单申请
3. 告知用户信任并添加例外

### 工作目录问题

打包后的程序运行时，当前工作目录（CWD）可能不是 EXE 所在目录，而是调用者目录或临时目录。如果程序依赖相对路径读取文件，需要在程序启动时主动设置：

```cpp
// 获取 exe 所在目录并设置为工作目录
#include <windows.h>
#include <string>

void SetWorkDirToExeDir() {
    TCHAR path[MAX_PATH];
    GetModuleFileName(NULL, path, MAX_PATH);
    
    // 去掉文件名，保留目录
    std::wstring dir(path);
    dir = dir.substr(0, dir.find_last_of(L"\\/"));
    
    SetCurrentDirectory(dir.c_str());
}
```

在 `WinMain` 或 `main` 开头调用即可。

### 64 位兼容性

Enigma Virtual Box 对纯 Win32/Win64 用户态 DLL 支持良好，但不支持内核驱动（`.sys`）或 COM 注册的 DLL。如果你的程序依赖注册表 COM 对象，打包后可能失效，需要单独处理。

---

通过以上两种方式，可以把散乱的 exe + dll 整合成一个干净的单文件，大幅降低用户部署难度。对于正式发布的商业软件，建议搭配代码签名证书一起使用，避免被安全软件拦截。', '2023-05-26', '["windows","cpp","工具"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('git-out-of-memory', '解决 git 报错：Fatal: Out of memory, malloc failed', '分析 git 大仓库操作时出现 Out of memory malloc failed 的根本原因，通过调整 pack.windowMemory、http.postBuffer 和 git repack 彻底解决。', '## 问题现象

在执行 `git clone`、`git push` 或 `git gc` 等操作时，终端抛出：

```
Fatal: Out of memory, malloc failed (tried to allocate 42446849 bytes)
```

或类似：

```
error: pack-objects died with strange error
fatal: the remote end hung up unexpectedly
```

这个错误让人迷惑——服务器明明有几 GB 内存，为什么 git 会 OOM？

## 根本原因分析

### git 的打包机制（packfile）

git 不是逐文件存储的，而是将对象打包成 `.pack` 文件以节省空间。打包时会进行**delta 压缩**：找出相似对象，只存储差异。

delta 压缩的效果越好，需要加载到内存中的"滑动窗口"就越大：

```
pack.windowMemory（默认：0 = 无限制）
    ↓
git 尝试分配尽可能大的内存窗口
    ↓
系统内存不足 / 32位进程地址空间限制
    ↓
malloc 失败 → Fatal: Out of memory
```

### http.postBuffer 过小

`git push` 通过 HTTP(S) 推送时，默认的 `http.postBuffer` 只有 **1MB**。推送大文件或大批量提交时，git 需要一次性缓冲整个 packfile，超出限制就会报错：

```
error: RPC failed; HTTP 413 curl 22 The requested URL returned error: 413
```

或：

```
fatal: the remote end hung up unexpectedly
```

## 解决方案

### 步骤 1：限制打包内存窗口

```bash
git config --global pack.windowMemory 256m
```

这告诉 git 在 delta 压缩时，每个滑动窗口最多使用 256MB 内存，防止无限申请导致 OOM。

也可以同时限制并发线程使用的内存：

```bash
git config --global pack.packSizeLimit 256m   # 单个 pack 文件最大尺寸
git config --global pack.threads 1            # 限制并发打包线程数（内存紧张时）
```

### 步骤 2：增大 HTTP 推送缓冲区

```bash
# 将报错中 "tried to allocate N bytes" 的 N 设为上限，或直接设一个较大值
git config --global http.postBuffer 52428800   # 50MB
# 或者报错里的具体值
git config --global http.postBuffer 42446849
```

### 步骤 3：重新打包仓库

如果本地仓库已经积累了大量松散对象，执行 `repack` 重新整理：

```bash
# 重新打包，并自动清理不可达对象
git repack -a -d -f --depth=250 --window=250
```

参数说明：
- `-a`：将所有对象打入新 pack（包括已打包的）
- `-d`：删除多余的旧 pack 文件
- `-f`：强制重新 delta 压缩
- `--depth=250`：delta 链最大深度
- `--window=250`：比较窗口大小（影响压缩率与内存用量，内存紧张可调小）

## 完整修复流程

```bash
# 1. 全局配置（一次性，永久生效）
git config --global pack.windowMemory 256m
git config --global http.postBuffer 52428800

# 2. 清理当前仓库（可选，针对已有问题仓库）
cd /path/to/your/repo
git gc --aggressive --prune=now

# 3. 如果 gc 也 OOM，改用更保守的参数
git repack -a -d --depth=100 --window=100
```

## 验证配置

```bash
# 查看当前全局 git 配置
git config --global --list | grep -E "pack|http"
```

输出应包含：

```
pack.windowmemory=256m
http.postbuffer=52428800
```

## 其他可能原因

| 现象 | 可能原因 | 解决方案 |
|------|---------|---------|
| clone 大仓库时 OOM | 单次获取 pack 太大 | `git clone --depth=1`（浅克隆）|
| push 时 413 错误 | 服务端限制请求体大小 | 联系管理员调大 Nginx `client_max_body_size` |
| Windows 32 位 git | 进程地址空间限制 | 换用 64 位 Git for Windows |
| CI 容器内存过小 | 容器限额 512MB 以下 | 增大容器内存或用浅克隆 |

## 延伸：仓库瘦身

如果仓库因历史大文件而体积异常，除了调参外，还可以从根本上清除：

```bash
# 找出最大的对象
git rev-list --objects --all | \
  git cat-file --batch-check=''%(objecttype) %(objectname) %(objectsize) %(rest)'' | \
  sort -k3 -n | tail -20

# 用 BFG Repo Cleaner 删除大文件历史
java -jar bfg.jar --strip-blobs-bigger-than 100M .
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```', '2024-01-31', '["Git","性能","故障排查"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('hid-hotplug', 'HID 设备热插拔检测：从 udev 到 node-hid', '在 Linux 上用 node-hid + usb 库实现可靠的 USB HID 设备热插拔检测，踩坑记录', 'import Chart from ''../../components/Chart.vue''

export const solutionCompareData = {
  labels: [''实现复杂度'', ''CPU 占用'', ''可靠性'', ''跨平台'', ''无需 root''],
  datasets: [
    {
      label: ''udev + inotify'',
      data: [4, 1, 5, 1, 1],
      backgroundColor: ''rgba(255,0,170,0.25)'',
      borderColor: ''rgba(255,0,170,0.8)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,0,170,1)'',
      pointRadius: 4,
    },
    {
      label: ''node-hid polling'',
      data: [1, 5, 3, 5, 5],
      backgroundColor: ''rgba(255,165,0,0.2)'',
      borderColor: ''rgba(255,165,0,0.8)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,165,0,1)'',
      pointRadius: 4,
    },
    {
      label: ''usb 库事件'',
      data: [3, 1, 4, 3, 5],
      backgroundColor: ''rgba(57,255,20,0.2)'',
      borderColor: ''rgba(57,255,20,0.8)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(57,255,20,1)'',
      pointRadius: 4,
    },
    {
      label: ''usb + node-hid 组合 ✅'',
      data: [4, 1, 5, 4, 5],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(0,212,255,1)'',
      pointRadius: 4,
    },
  ]
}

export const solutionCompareOptions = {
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: {
        display: false,
        stepSize: 1,
      },
      grid: { color: ''rgba(136,136,170,0.25)'' },
      angleLines: { color: ''rgba(136,136,170,0.25)'' },
      pointLabels: {
        color: ''#c8c8d8'',
        font: { family: ''JetBrains Mono'', size: 11 },
      },
    }
  }
}

## 背景

做键盘配置工具时，需要实时检测 HID 设备插拔。
看起来很简单，实际上坑不少。

## 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| `udev` rules + inotify | 内核级，可靠 | 需要 root 权限规则 |
| `node-hid` polling | 简单 | CPU 占用高 |
| `usb` 库事件 | 无需 root，跨平台 | 依赖 libusb |
| `usb` + `node-hid` 组合 | 最佳实践 ✅ | 需要两个依赖 |

**四种方案综合评分对比：**

<Chart client:only="vue" type="radar" data={solutionCompareData} options={solutionCompareOptions} height={280} />

> 分数 1-5，越高越好。CPU 占用邠分评为高分（占用越低 → 得分越高）。

## 基础实现

```typescript
import usb from ''usb''
import HID from ''node-hid''

const TARGET_VID = 0x1234
const TARGET_PID = 0x5678

function findDevice() {
  return HID.devices().find(
    d => d.vendorId === TARGET_VID && d.productId === TARGET_PID
  )
}

// usb 库监听插拔事件，比 polling 高效得多
usb.on(''attach'', (device) => {
  const desc = device.deviceDescriptor
  if (desc.idVendor === TARGET_VID && desc.idProduct === TARGET_PID) {
    // 插入后等 100ms 让系统枚举完毕，再尝试打开
    setTimeout(() => {
      const info = findDevice()
      if (info) openDevice(info)
    }, 100)
  }
})

usb.on(''detach'', (device) => {
  const desc = device.deviceDescriptor
  if (desc.idVendor === TARGET_VID && desc.idProduct === TARGET_PID) {
    closeDevice()
  }
})
```

## 完整的 DeviceManager 类

裸监听够用，但生产环境需要处理：设备偶尔断连、重连失败、多次重试……把这些逻辑封装进 `DeviceManager`，对外只暴露状态事件。

```typescript
// src/main/device-manager.ts
import { EventEmitter } from ''events''
import usb from ''usb''
import HID from ''node-hid''

interface DeviceManagerEvents {
  connected: (devicePath: string) => void
  disconnected: () => void
  data: (report: Buffer) => void
  error: (err: Error) => void
}

export class DeviceManager extends EventEmitter {
  private vid: number
  private pid: number
  private device: HID.HID | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempt = 0
  private readonly MAX_RETRY = 8
  private destroyed = false

  constructor(vid: number, pid: number) {
    super()
    this.vid = vid
    this.pid = pid

    usb.on(''attach'', this.onAttach)
    usb.on(''detach'', this.onDetach)
  }

  // 指数退避：100ms → 200ms → 400ms → ... 最大 ~12.8s
  private get retryDelay(): number {
    return Math.min(100 * 2 ** this.reconnectAttempt, 12800)
  }

  private onAttach = (usbDevice: usb.Device) => {
    const { idVendor, idProduct } = usbDevice.deviceDescriptor
    if (idVendor !== this.vid || idProduct !== this.pid) return

    // 清掉之前的重连 timer（插拔快时可能有残留）
    this.clearReconnectTimer()
    this.reconnectAttempt = 0

    // 等内核枚举完毕
    this.scheduleOpen(100)
  }

  private onDetach = (usbDevice: usb.Device) => {
    const { idVendor, idProduct } = usbDevice.deviceDescriptor
    if (idVendor !== this.vid || idProduct !== this.pid) return

    this.close()
    this.emit(''disconnected'')
  }

  private scheduleOpen(delayMs: number) {
    this.reconnectTimer = setTimeout(() => this.tryOpen(), delayMs)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private tryOpen() {
    if (this.destroyed) return

    const info = HID.devices().find(
      d => d.vendorId === this.vid && d.productId === this.pid
    )

    if (!info || !info.path) {
      // 还没枚举好，按指数退避继续重试
      this.reconnectAttempt++
      if (this.reconnectAttempt <= this.MAX_RETRY) {
        console.warn(
          `[DeviceManager] Device not found, retry ${this.reconnectAttempt}/${this.MAX_RETRY} in ${this.retryDelay}ms`
        )
        this.scheduleOpen(this.retryDelay)
      } else {
        this.emit(''error'', new Error(''Device not found after max retries''))
      }
      return
    }

    try {
      this.device = new HID.HID(info.path)
      this.reconnectAttempt = 0
      this.startReadLoop()
      this.emit(''connected'', info.path)
    } catch (err) {
      // 打开失败也退避重试（比如权限问题短暂未就绪）
      this.reconnectAttempt++
      if (this.reconnectAttempt <= this.MAX_RETRY) {
        this.scheduleOpen(this.retryDelay)
      } else {
        this.emit(''error'', err instanceof Error ? err : new Error(String(err)))
      }
    }
  }

  private startReadLoop() {
    if (!this.device) return

    // node-hid 异步读取：注册 data/error 回调，不阻塞主线程
    this.device.on(''data'', (data: Buffer) => {
      this.emit(''data'', data)
    })

    this.device.on(''error'', (err: Error) => {
      // 设备被拔出时会触发 error，这是正常流程
      this.close()
      this.emit(''disconnected'')
    })
  }

  open() {
    // 主动打开（应用启动时调用一次）
    this.tryOpen()
  }

  close() {
    this.clearReconnectTimer()
    if (this.device) {
      try { this.device.close() } catch {}
      this.device = null
    }
  }

  destroy() {
    this.destroyed = true
    this.close()
    usb.off(''attach'', this.onAttach)
    usb.off(''detach'', this.onDetach)
    this.removeAllListeners()
  }
}
```

使用：

```typescript
// src/main/index.ts
const manager = new DeviceManager(0x1234, 0x5678)

manager.on(''connected'', (path) => console.log(''已连接:'', path))
manager.on(''disconnected'', () => console.log(''已断开''))
manager.on(''data'', (buf) => handleReport(buf))
manager.on(''error'', (err) => console.error(''HID 错误:'', err))

manager.open() // 启动时尝试首次打开

// 应用退出时
app.on(''before-quit'', () => manager.destroy())
```

## 数据接收循环：64 字节 HID 报告

HID 设备通讯的基本单位是**报告（Report）**，通常是 64 字节（含 1 字节 report ID）。

上面的 `startReadLoop` 用了 node-hid 的**异步事件模式**（推荐）。但也有同步阻塞读的用法——要小心：

```typescript
// ❌ 同步阻塞读：会卡住 Node.js 主线程
function blockingReadLoop(device: HID.HID) {
  while (true) {
    const data = device.readSync() // 阻塞直到有数据
    processReport(data)
  }
}

// ✅ 异步非阻塞：用 on(''data'') 回调
function asyncReadLoop(device: HID.HID) {
  device.on(''data'', (data: Buffer) => {
    // data.length 通常是 64（含 report ID 填充）
    const reportId = data[0]
    const payload = data.slice(1) // 实际数据从第 2 字节开始
    processReport(reportId, payload)
  })
}

function processReport(reportId: number, payload: Buffer) {
  switch (reportId) {
    case 0x01: // 按键事件
      handleKeyEvent(payload)
      break
    case 0x02: // 状态响应
      handleStatusResponse(payload)
      break
    default:
      console.warn(`Unknown report ID: 0x${reportId.toString(16)}`)
  }
}
```

如果需要**发送数据**（Feature Report 或 Output Report）：

```typescript
// 发送 64 字节报告（第一字节是 report ID，通常是 0x00）
function sendReport(device: HID.HID, reportId: number, data: number[]) {
  const report = [reportId, ...data]
  // 不足 64 字节的补零
  while (report.length < 65) report.push(0) // node-hid 要求总长度包括 report ID
  device.write(report)
}
```

## Windows 上的差异

Windows 的 USB 事件机制与 Linux/macOS 有本质不同：

| | Linux | macOS | Windows |
|--|-------|-------|---------|
| 底层机制 | udev netlink | IOKit | `WM_DEVICECHANGE` 消息 |
| `usb` 库支持 | ✅ libusb | ✅ libusb | ⚠️ 部分支持 |
| HID 独占 | 否（hidraw） | 否 | 是（内核驱动独占） |

**Windows 主要坑：**

1. **`usb` 库事件不可靠**：libusb 在 Windows 上依赖 WinUSB/libusbK 驱动，但 HID 设备默认用 `hid.sys`，两者冲突，`usb.on(''attach'')` 可能根本不触发。

2. **HID 独占问题**：Windows 的 HID 驱动独占设备，有时候 `new HID.HID(path)` 会因为系统或其他应用已持有句柄而失败。

3. **推荐 Windows 方案**：不依赖 `usb` 库事件，改用轮询 + 短间隔：

```typescript
// Windows 专用：轮询方案（每 500ms 扫一次设备列表）
class WindowsDeviceWatcher {
  private timer: NodeJS.Timeout | null = null
  private knownPaths = new Set<string>()

  start(vid: number, pid: number, onAttach: (path: string) => void, onDetach: (path: string) => void) {
    this.timer = setInterval(() => {
      const current = new Set(
        HID.devices()
          .filter(d => d.vendorId === vid && d.productId === pid && d.path)
          .map(d => d.path!)
      )

      // 新增
      for (const p of current) {
        if (!this.knownPaths.has(p)) onAttach(p)
      }
      // 移除
      for (const p of this.knownPaths) {
        if (!current.has(p)) onDetach(p)
      }

      this.knownPaths = current
    }, 500)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
  }
}
```

跨平台判断：

```typescript
const watcher = process.platform === ''win32''
  ? new WindowsDeviceWatcher()
  : new UsbEventWatcher() // 用 usb 库
```

## 多设备管理

同 VID/PID 的多个设备怎么区分？靠 `path` 或 `serialNumber`。

```typescript
// 用 Map<path, HID.HID> 管理多个设备
class MultiDeviceManager {
  private devices = new Map<string, HID.HID>()

  openAll(vid: number, pid: number) {
    const infos = HID.devices().filter(
      d => d.vendorId === vid && d.productId === pid && d.path
    )

    for (const info of infos) {
      if (!info.path || this.devices.has(info.path)) continue

      try {
        const device = new HID.HID(info.path)
        this.devices.set(info.path, device)

        console.log(
          `已打开设备: path=${info.path} serial=${info.serialNumber ?? ''(无序列号)''}`
        )

        device.on(''data'', (data) => this.onData(info.path!, data))
        device.on(''error'', () => this.onError(info.path!))
      } catch (err) {
        console.error(`打开设备失败: ${info.path}`, err)
      }
    }
  }

  private onData(path: string, data: Buffer) {
    // 用 path 区分是哪个设备来的数据
    console.log(`[${path}] 收到报告:`, data.toString(''hex''))
  }

  private onError(path: string) {
    const device = this.devices.get(path)
    try { device?.close() } catch {}
    this.devices.delete(path)
    console.warn(`设备断开: ${path}`)
  }

  closeAll() {
    for (const [path, device] of this.devices) {
      try { device.close() } catch {}
    }
    this.devices.clear()
  }
}
```

> **注意**：`serialNumber` 不是所有设备都有，廉价设备可能是空字符串。优先用 `path`，它在单次系统会话内是唯一的；重启后 `path` 可能变，这时候才需要靠 `serialNumber`。

## 踩坑

### 1. 枚举竞争

`attach` 事件触发时，`HID.devices()` 可能还找不到设备（内核还在枚举）。
解决：加 100~200ms 延迟，必要时用指数退避重试（见 `DeviceManager`）。

### 2. Linux udev 权限

默认普通用户无法访问 `/dev/hidraw*`。
需要添加 udev rule：

```bash
# /etc/udev/rules.d/99-hid.rules
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="1234", ATTRS{idProduct}=="5678", MODE="0666"
```

重载规则：`sudo udevadm control --reload-rules && sudo udevadm trigger`

### 3. Electron 沙箱冲突

`node-hid` 需要 Node.js native module 权限，Electron 的 `sandbox: true` 会拦截。
方案：在 **main process** 里跑 HID 逻辑，通过 IPC 传给 renderer。永远不要在 renderer 里直接调 native module。

## 结论

`usb` 事件 + `node-hid` 操作 + `DeviceManager` 封装（含指数退避重连），加上 IPC 隔离，这套组合在生产环境用了半年，没出问题。Windows 上要额外做轮询回退。', '2026-04-28', '["cpp","hid","linux","nodejs","electron"]', 0);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('load-balancing-algorithms', '负载均衡算法完全指南：从轮询到一致性哈希', '系统梳理静态与动态负载均衡算法，涵盖轮询、随机、权重、IP Hash、一致性 Hash、最少连接、最快响应等，并对比 Nginx、Dubbo、Spring Cloud LoadBalancer 的实现差异。', 'import Chart from ''../../components/Chart.vue''

export const weightedDistData = {
  labels: [''节点 A (weight=3)'', ''节点 B (weight=1)'', ''节点 C (weight=2)''],
  datasets: [{
    label: ''请求占比 %'',
    data: [50, 16.7, 33.3],
    backgroundColor: [
      ''rgba(0,212,255,0.75)'',
      ''rgba(255,0,170,0.75)'',
      ''rgba(57,255,20,0.75)'',
    ],
    borderColor: [
      ''rgba(0,212,255,1)'',
      ''rgba(255,0,170,1)'',
      ''rgba(57,255,20,1)'',
    ],
    borderWidth: 1,
  }]
}

export const weightedDistOptions = {
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.raw}%`
      }
    }
  },
  scales: {
    x: {
      ticks: { color: ''#8888aa'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    },
    y: {
      min: 0,
      max: 60,
      ticks: {
        color: ''#8888aa'',
        font: { family: ''JetBrains Mono'', size: 10 },
        callback: (v) => v + ''%''
      },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    }
  }
}

export const algoSupportData = {
  labels: [''轮询'', ''加权轮询'', ''随机'', ''IP Hash'', ''URL Hash'', ''一致性Hash'', ''最少连接'', ''故障重试''],
  datasets: [
    {
      label: ''Nginx'',
      data: [5, 5, 5, 5, 5, 5, 5, 5],
      backgroundColor: ''rgba(0,212,255,0.7)'',
      borderColor: ''rgba(0,212,255,1)'',
      borderWidth: 1,
      borderRadius: 3,
    },
    {
      label: ''Dubbo'',
      data: [5, 5, 5, 0, 0, 5, 5, 5],
      backgroundColor: ''rgba(57,255,20,0.7)'',
      borderColor: ''rgba(57,255,20,1)'',
      borderWidth: 1,
      borderRadius: 3,
    },
    {
      label: ''Spring Cloud LB'',
      data: [5, 2, 5, 0, 0, 0, 0, 5],
      backgroundColor: ''rgba(180,0,255,0.7)'',
      borderColor: ''rgba(180,0,255,1)'',
      borderWidth: 1,
      borderRadius: 3,
    },
  ]
}

export const algoSupportOptions = {
  plugins: {
    legend: {
      labels: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 11 } }
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const labels = [''✖️ 不支持'', '''', '''', '''', ''⚠️ 需自定义'', ''✅ 支持'']
          return ` ${ctx.dataset.label}: ${ctx.raw === 5 ? ''✅ 支持'' : ctx.raw === 2 ? ''⚠️ 需自定义'' : ''❌ 不支持''}`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 9 }, maxRotation: 30 },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      display: false,
      min: 0,
      max: 6,
    }
  }
}

## 什么是负载均衡

负载均衡（Load Balancing）是指将客户端请求按照某种策略分发到多个后端服务节点，目标是：

- **避免单点过载**：防止某一节点 CPU/内存耗尽
- **提升整体吞吐**：充分利用集群资源
- **容灾与高可用**：节点故障时自动剔除，流量转移

负载均衡分为两大类：**静态算法**（不考虑节点实时状态）和**动态算法**（根据节点当前负载调度）。

---

## 静态负载均衡算法

### 1. 轮询（Round Robin）

最简单的算法：请求依次分发给每个节点，循环往复。

```
请求序列: 1  2  3  4  5  6
节点:     A  B  C  A  B  C
```

**优点**：实现简单，分布均匀（假设节点同质）  
**缺点**：不考虑节点性能差异和请求处理时长

**Nginx 配置**：

```nginx
upstream backend {
    server 192.168.1.10;
    server 192.168.1.11;
    server 192.168.1.12;
    # 默认就是轮询
}
```

---

### 2. 随机（Random）

每次请求随机选择一个节点。大量请求下，统计上接近均匀分布。

**优点**：无状态，实现最简  
**缺点**：小请求量时分布不均

---

### 3. 加权轮询（Weighted Round Robin）

根据节点处理能力分配权重，权重越高分得请求越多。

```
节点 A: weight=3, 节点 B: weight=1, 节点 C: weight=2
请求分配: A A A B C C A A A B C C ...
```

**适用场景**：集群中机器配置不均等（高配机器分更多流量）

```nginx
upstream backend {
    server 192.168.1.10 weight=3;
    server 192.168.1.11 weight=1;
    server 192.168.1.12 weight=2;
}
```

**weight=3:1:2 的实际请求分配比例：**

<Chart client:only="vue" type="bar" data={weightedDistData} options={weightedDistOptions} height={200} />

---

### 4. IP Hash

对客户端 IP 取哈希，映射到固定节点。同一 IP 的请求始终路由到同一后端。

```
hash(client_ip) % server_count = 目标节点索引
```

**优点**：天然实现会话保持（Session Sticky），无需额外 Session 共享  
**缺点**：节点增减时映射变化，大量 Session 失效；NAT 场景下多用户共享 IP 导致负载不均

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.10;
    server 192.168.1.11;
}
```

---

### 5. URL Hash

对请求 URL 取哈希，相同 URL 路由到同一节点。

**适用场景**：缓存服务器集群——同一资源固定落在同一节点，提升缓存命中率  
**缺点**：热点 URL 可能导致某节点过载

```nginx
upstream backend {
    hash $request_uri consistent;
    server 192.168.1.10;
    server 192.168.1.11;
}
```

---

### 6. 一致性哈希（Consistent Hashing）

普通哈希的问题：增减节点时，`hash(key) % N` 的 N 变化，几乎所有 key 都需要重新映射。

一致性哈希将所有节点和 key 映射到同一个圆环（0 ~ 2³²），key 顺时针找到的第一个节点即为目标节点。

```
          0
    ┌─────┼─────┐
  A(90°)  │   C(270°)
          │
        B(180°)

key_hash=120° → 顺时针 → C(270°)
key_hash=200° → 顺时针 → C(270°)
key_hash=300° → 顺时针 → A(90° + 360°)
```

**优点**：增减节点时只影响相邻区间，平均只有 `1/N` 的 key 需要迁移  
**缺点**：节点少时容易分布不均；引入**虚拟节点**（每个物理节点映射多个点）可解决

---

## 动态负载均衡算法

### 7. 最少连接（Least Connections）

将新请求发送给当前**活跃连接数最少**的节点。

```
节点 A: 活跃连接 100  → 不选
节点 B: 活跃连接 20   → 选择
节点 C: 活跃连接 55   → 不选
```

**优点**：自适应节点处理能力，长连接场景效果好（如 WebSocket）  
**缺点**：需要维护连接计数，有一定开销

```nginx
upstream backend {
    least_conn;
    server 192.168.1.10;
    server 192.168.1.11;
}
```

---

### 8. 加权最少连接（Weighted Least Connections）

综合权重和当前连接数：`score = connections / weight`，选 score 最小的节点。

---

### 9. 最快响应时间（Fastest Response）

选择**近期平均响应时间最短**的节点。需要负载均衡器持续采集各节点的响应时间。

**适用场景**：节点间网络延迟差异大（如多机房混合部署）

---

### 10. 预测（Predictive）

基于历史响应时间和当前趋势**预测**节点下一时刻的负载，选择预测负载最低的节点。

F5 BIG-IP 等商用产品支持此算法。

---

### 11. QoS 感知调度

根据请求的服务等级（优先级）调度，高优先级请求优先发送到性能最好的节点。多用于混合业务场景（在线请求 vs 批处理任务）。

---

## 高级策略

### 灰度发布（Canary Release）

通过权重或请求头将少量流量（1%~10%）路由到新版本节点，验证无误后逐步扩大。

```nginx
upstream backend {
    server prod.example.com  weight=9;
    server canary.example.com weight=1;
}
```

### 版本隔离

按请求头（如 `X-Version`）或 Cookie 将特定用户路由到指定版本，实现 AB 测试或内测。

### 故障隔离（Circuit Breaker）

节点连续失败超过阈值后，临时从轮询中摘除，避免雪崩。常与健康检查配合使用。

---

## 主流框架支持对比

> ⚠️ Netflix Ribbon 已于 2021 年进入维护模式，Spring Cloud 2020+ 默认切换为 **Spring Cloud LoadBalancer**。新项目不建议继续使用 Ribbon。

| 算法 | Nginx | Dubbo | Spring Cloud LoadBalancer |
|------|-------|-------|---------------------------|
| 轮询 | ✅ 默认 | ✅ | ✅ `RoundRobinLoadBalancer` |
| 加权轮询 | ✅ `weight` | ✅ | ⚠️ 需自定义 |
| 随机 | ✅ | ✅ | ✅ `RandomLoadBalancer` |
| IP Hash | ✅ `ip_hash` | ❌ | ❌ |
| URL Hash | ✅ `hash $uri` | ❌ | ❌ |
| 一致性 Hash | ✅ `consistent` | ✅ | ❌ |
| 最少连接 | ✅ `least_conn` | ✅ `LeastActiveLoadBalance` | ❌ |
| 故障重试 | ✅ `proxy_next_upstream` | ✅ | ✅ `RetryLoadBalancer` |

**三大框架算法支持对比：**

<Chart client:only="vue" type="bar" data={algoSupportData} options={algoSupportOptions} height={220} />

> 注：条形高度表示支持程度：满格=支持，半格=需自定义，空=不支持。

## 选型建议

| 场景 | 推荐算法 |
|------|---------|
| 无状态、同质节点 | 轮询 / 随机 |
| 节点配置差异大 | 加权轮询 |
| 需要 Session 保持 | IP Hash 或 一致性 Hash |
| 缓存集群 | URL Hash + 一致性 Hash |
| 长连接、异步任务 | 最少连接 |
| 多机房、跨地域 | 最快响应时间 |', '2023-11-15', '["分布式","负载均衡","Nginx","微服务"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('mfc-cstring-wparam', 'MFC 中 CString 与 WPARAM 之间的转换', '详解 MFC 消息传递中 CString 无法直接强转为 WPARAM 的原因，以及两种正确的转换方案，并介绍结构体指针传递的正确姿势。', '在 MFC 开发中，经常需要通过 `PostMessage` / `SendMessage` 在窗口之间传递数据。当数据是一个 `CString` 时，很多人会想当然地强转——但这样做几乎必然出现内存错误或数据丢失。

本文讲清楚为什么不能直接强转，以及两种正确的转换方案。

---

## 为什么不能直接强转

`PostMessage` / `SendMessage` 的签名是：

```cpp
BOOL PostMessage(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam);
```

`WPARAM` 和 `LPARAM` 本质上都是 `UINT_PTR`（指针大小的整数），用来传递整数值或指针。

`CString` 是一个**类对象**，不是简单的指针：

```cpp
CString str = _T("Hello");
// 错误写法：
PostMessage(hWnd, WM_MY_MSG, (WPARAM)(LPCTSTR)str, 0);
```

这行代码的问题在于：`(LPCTSTR)str` 确实能拿到字符串的内部缓冲区指针，但：

1. **`PostMessage` 是异步的**：消息加入队列后，当前函数返回，`str` 局部变量被销毁，那个指针就变成了悬空指针。
2. **对象不能直接塞进整数**：CString 的内存由 MFC 管理，跨消息边界传递裸指针是极不安全的。

---

## 方法一：AllocSysString / SysFreeString

`BSTR` 是 COM 标准的字符串类型，分配在 COM 堆上，生命周期独立管理，适合跨消息传递。

```cpp
// === 发送方 ===
CString strData = _T("要发送的内容");

// 分配 BSTR（COM 堆，不会随局部变量销毁）
BSTR bstr = strData.AllocSysString();

// 通过 LPARAM 传指针（WPARAM 传类型标识也可）
PostMessage(hTargetWnd, WM_MY_MSG, 0, (LPARAM)bstr);
// 注意：PostMessage 后不能再用 bstr，所有权已转移给接收方
```

```cpp
// === 接收方（消息处理函数）===
LRESULT CMyWnd::OnMyMsg(WPARAM wParam, LPARAM lParam) {
    BSTR bstr = (BSTR)lParam;
    
    // 从 BSTR 构造 CString
    CString str(bstr);
    
    // 用完后必须释放！否则内存泄漏
    SysFreeString(bstr);
    
    // 使用 str...
    AfxMessageBox(str);
    
    return 0;
}
```

**内存管理规则**：
- 发送方调用 `AllocSysString()` 分配，**分配后不再持有所有权**
- 接收方使用完毕后**必须调用 `SysFreeString()`** 释放
- 如果消息可能不被接收（如目标窗口已销毁），发送方需要自己释放

---

## 方法二：GetBuffer / ReleaseBuffer

这种方式是在发送前把 CString 的内容复制到一块动态分配的 `TCHAR` 数组，接收方读取后手动释放。

```cpp
// === 发送方 ===
CString strData = _T("要发送的内容");
int len = strData.GetLength() + 1; // +1 for null terminator

// 分配独立内存
TCHAR* buf = new TCHAR[len];
_tcscpy_s(buf, len, strData.GetString());

PostMessage(hTargetWnd, WM_MY_MSG, 0, (LPARAM)buf);
// 同样：所有权转移，不再使用 buf
```

```cpp
// === 接收方 ===
LRESULT CMyWnd::OnMyMsg(WPARAM wParam, LPARAM lParam) {
    TCHAR* buf = (TCHAR*)lParam;
    
    CString str(buf);
    
    // 释放内存
    delete[] buf;
    
    AfxMessageBox(str);
    return 0;
}
```

> 备注：`GetBuffer(0)` 的用法是让 CString 暴露内部缓冲区，配合 `ReleaseBuffer()` 使用。但用于消息传递时，不应直接传 CString 的内部缓冲区——应该**复制**到独立内存再传递。

---

## 两种方案对比

| 对比项 | AllocSysString | new TCHAR[] |
|--------|---------------|-------------|
| 内存来源 | COM 堆（SysAllocString） | C++ 堆（new） |
| 释放方式 | `SysFreeString()` | `delete[]` |
| 跨语言互操作 | 支持（COM 标准） | 仅限 C++ |
| 推荐场景 | 与 COM 组件交互 | 纯 MFC 项目内部 |

两种方式都能正确工作，纯 MFC 项目用 `new TCHAR[]` 更简单直接；如果项目涉及 COM 或 Automation，用 `BSTR` 更规范。

---

## 结构体传递：只能传指针

如果要传递结构体，原理相同——只能传指针，不能传值（整数塞不下一个结构体）：

```cpp
// 定义消息数据结构
struct MyMsgData {
    int type;
    int value;
    TCHAR text[256];
};

// === 发送方 ===
MyMsgData* data = new MyMsgData();
data->type = 1;
data->value = 42;
_tcscpy_s(data->text, _T("Hello"));

PostMessage(hTargetWnd, WM_MY_MSG, 0, (LPARAM)data);
```

```cpp
// === 接收方 ===
LRESULT CMyWnd::OnMyMsg(WPARAM wParam, LPARAM lParam) {
    MyMsgData* data = reinterpret_cast<MyMsgData*>(lParam);
    
    // 使用数据
    int val = data->value;
    CString text(data->text);
    
    // 释放
    delete data;
    
    return 0;
}
```

**结构体大小限制**：`WPARAM`/`LPARAM` 只能传一个指针。如果数据太大，就申请堆内存传指针，不要试图把结构体强行塞进整数。

---

## PostMessage vs SendMessage 的选择

这两个函数在字符串传递场景下有本质区别：

### SendMessage（同步）

```cpp
// 阻塞直到接收方处理完消息才返回
SendMessage(hTargetWnd, WM_MY_MSG, 0, (LPARAM)bstr);
// 这里 bstr 已经被接收方释放，不要再用
```

优点：可以用栈变量，因为消息处理完前函数不返回。但如果是跨线程 `SendMessage`，且两个线程有消息循环交互，可能死锁。

### PostMessage（异步）

```cpp
// 立刻返回，消息放入队列稍后处理
PostMessage(hTargetWnd, WM_MY_MSG, 0, (LPARAM)bstr);
// 此处 bstr 所有权已转移，不能再访问
```

优点：非阻塞，不会死锁。必须用堆内存，栈变量（局部变量）会在函数返回后被销毁，接收方读到的是垃圾。

**实践建议**：
- 同线程内通信 → `SendMessage` 更简单（可用局部 CString 直接传，不必堆分配）
- 跨线程通信 → 必须 `PostMessage` + 堆内存

---

## 总结

1. **不能直接把 CString 强转为 WPARAM**：指针悬空、对象不可序列化
2. **AllocSysString / SysFreeString**：COM 堆管理，适合与 COM 交互
3. **new / delete[]**：C++ 堆，纯 MFC 项目更简单
4. **结构体只能传指针**，接收方负责释放
5. **PostMessage 用堆内存，SendMessage 可以用栈**（同线程下）', '2022-11-25', '["mfc","cpp","windows"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('mfc-dpi-adaptive', 'MFC 界面自适应不同分辨率', 'MFC 对话框程序实现控件和字体随分辨率自动缩放的完整方案，附 DPI Awareness 配置说明', '## 背景

开发 MFC 对话框程序时，在开发机上布局好的界面，换一台分辨率不同的电脑就会出现控件错位、字体过大或过小的问题。原因是对话框控件的位置和尺寸在设计时是固定的像素值，不会自动跟随屏幕分辨率缩放。

## DPI Awareness

在解决自适应前，先理解 DPI 感知（DPI Awareness）。Windows 默认会对未声明 DPI 感知的程序做 bitmap 拉伸，导致界面模糊。建议在程序入口显式声明：

```cpp
// 在 WinMain 或 InitInstance 的最开始调用
SetProcessDPIAware(); // 需要 #include <windows.h>
```

或者在 manifest 中声明（更推荐的方式）：

```xml
<application xmlns="urn:schemas-microsoft-com:asm.v3">
  <windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
  </windowsSettings>
</application>
```

声明后 Windows 不再拉伸，但你需要自己处理缩放逻辑。

## 实现方案

核心思路：**记录初始尺寸，在窗口大小变化时按比例缩放所有控件**。

### 1. 在头文件中添加成员变量

```cpp
class CMyDlg : public CDialogEx {
    // ...
private:
    POINT m_oldSize;   // 记录对话框初始客户区尺寸
    CFont m_MainUIFont; // 字体自适应用
    void ReSize();     // 缩放函数
};
```

### 2. OnInitDialog 中记录初始尺寸并居中

```cpp
BOOL CMyDlg::OnInitDialog() {
    CDialogEx::OnInitDialog();

    // 记录初始客户区大小
    CRect rect;
    GetClientRect(&rect);
    m_oldSize.x = rect.Width();
    m_oldSize.y = rect.Height();

    // 获取屏幕可用区域（不含任务栏）
    int screenW = GetSystemMetrics(SM_CXFULLSCREEN);
    int screenH = GetSystemMetrics(SM_CYFULLSCREEN);

    // 居中显示
    CRect dlgRect;
    GetWindowRect(&dlgRect);
    int x = (screenW - dlgRect.Width()) / 2;
    int y = (screenH - dlgRect.Height()) / 2;
    MoveWindow(x, y, dlgRect.Width(), dlgRect.Height());

    return TRUE;
}
```

### 3. 实现 ReSize() 函数

```cpp
void CMyDlg::ReSize() {
    CRect clientRect;
    GetClientRect(&clientRect);

    // 计算新旧尺寸比例
    float scaleX = (float)clientRect.Width()  / m_oldSize.x;
    float scaleY = (float)clientRect.Height() / m_oldSize.y;

    // 遍历所有子控件
    HWND hChild = ::GetWindow(m_hWnd, GW_CHILD);
    while (hChild) {
        int ctrlId = ::GetDlgCtrlID(hChild);
        CRect ctrlRect;
        GetDlgItem(ctrlId)->GetWindowRect(&ctrlRect);
        ScreenToClient(&ctrlRect); // 转为客户区坐标

        // 按比例计算新位置和尺寸
        CRect newRect(
            (long)(ctrlRect.left   * scaleX),
            (long)(ctrlRect.top    * scaleY),
            (long)(ctrlRect.right  * scaleX),
            (long)(ctrlRect.bottom * scaleY)
        );
        GetDlgItem(ctrlId)->MoveWindow(newRect, TRUE);

        // 字体自适应（Static 和 Button 控件）
        char className[MAX_PATH] = {0};
        GetClassNameA(hChild, className, MAX_PATH);
        if (strcmp(className, "Static") == 0 || strcmp(className, "Button") == 0) {
            CFont* pFont = GetDlgItem(ctrlId)->GetFont();
            LOGFONT lf;
            pFont->GetLogFont(&lf);

            int newHeight = newRect.Height() * 4 / 5;
            lf.lfHeight = newHeight;

            CString text;
            GetDlgItem(ctrlId)->GetWindowText(text);
            int textLen = text.GetLength();
            // 防止字体过宽导致文字超出控件
            lf.lfWidth = (textLen > 0 && (textLen * 9) > newRect.Width())
                ? newRect.Width() / textLen
                : 9;

            m_MainUIFont.DeleteObject();
            m_MainUIFont.CreateFontIndirect(&lf);
            GetDlgItem(ctrlId)->SetFont(&m_MainUIFont);
            m_MainUIFont.Detach(); // 解除关联，防止 DeleteObject 影响控件
        }

        hChild = ::GetWindow(hChild, GW_HWNDNEXT);
    }

    // 更新记录的尺寸
    m_oldSize.x = clientRect.Width();
    m_oldSize.y = clientRect.Height();
}
```

### 4. 在 OnSize 中调用

```cpp
void CMyDlg::OnSize(UINT nType, int cx, int cy) {
    CDialogEx::OnSize(nType, cx, cy);

    // 避免初始化阶段（m_oldSize 未赋值）触发
    if (m_oldSize.x > 0 && m_oldSize.y > 0) {
        ReSize();
    }
}
```

## 常见坑

| 问题 | 原因 | 解决 |
|------|------|------|
| 首次触发 OnSize 时崩溃 | m_oldSize 未初始化，除以 0 | 在 OnInitDialog 之后才允许 ReSize |
| 字体越来越大 | 每次 ReSize 基于上一次缩放后的字体再缩放 | 重新从控件原始 LOGFONT 取，或单独记录初始字体大小 |
| Edit 控件字体不更新 | GetClassNameA 返回 "Edit"，未在判断里 | 按需加入 Edit 的字体处理 |
| 控件位置漂移 | ScreenToClient 在窗口移动后坐标不准 | 保证每次都重新 GetWindowRect + ScreenToClient |

## 延伸

如果项目对 DPI 支持要求更高，可以考虑用 Windows 10 引入的 Per-Monitor DPI Awareness v2（`DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2`），配合 `WM_DPICHANGED` 消息重新布局。不过 MFC 对此支持有限，现代项目更建议直接换 Qt 或 WinUI 3。', '2022-08-17', '["mfc","cpp","windows","dpi"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('mfc-drag-window', 'MFC 无标题栏窗口客户区拖动：三种方法对比', 'MFC 对话框去掉标题栏后如何实现拖动移动窗口，三种方案完整实现与适用场景分析', 'import Chart from ''../../components/Chart.vue''

export const dragRadarData = {
  labels: [''实现复杂度'', ''控件兼容性'', ''自定义自由度'', ''代码可读性'', ''稳定性''],
  datasets: [
    {
      label: ''OnNcHitTest'',
      data: [5, 2, 1, 5, 4],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(0,212,255,0.9)'',
    },
    {
      label: ''PostMessage法'',
      data: [4, 5, 3, 4, 5],
      backgroundColor: ''rgba(57,255,20,0.2)'',
      borderColor: ''rgba(57,255,20,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(57,255,20,0.9)'',
    },
    {
      label: ''手动MouseMove'',
      data: [1, 5, 5, 2, 4],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,0,170,0.9)'',
    },
  ],
}

export const dragRadarOptions = {
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: { display: false, stepSize: 1 },
      grid: { color: ''rgba(136,136,170,0.25)'' },
      angleLines: { color: ''rgba(136,136,170,0.25)'' },
      pointLabels: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 11 } },
    },
  },
}

## 背景

MFC 自定义皮肤或无边框窗口设计中，通常会隐藏系统标题栏（`WS_CAPTION` 样式去掉）。但没了标题栏，用户就无法拖动窗口移动位置。需要手动处理鼠标消息，模拟标题栏拖动行为。

以下三种方法都能实现，适用场景略有差异。

## 方法一：拦截 WM_NCHITTEST（最简洁）

Windows 在确定鼠标位于窗口哪个区域时，会发送 `WM_NCHITTEST` 消息。重写 `OnNcHitTest`，当鼠标在客户区时返回 `HTCAPTION`，让系统误以为鼠标在标题栏上，从而自动处理拖动。

```cpp
// .h 中声明
afx_msg LRESULT OnNcHitTest(CPoint point);

// .cpp 中实现
LRESULT CMyDlg::OnNcHitTest(CPoint point) {
    LRESULT hit = CDialogEx::OnNcHitTest(point);
    // 鼠标在客户区时，谎报为标题栏
    return (hit == HTCLIENT) ? HTCAPTION : hit;
}
```

**优点**：代码最少，系统处理一切（含双击最大化逻辑）。  
**缺点**：整个客户区都变成"标题栏"，客户区的右键菜单、双击等行为也会被系统接管，如果界面上有可交互控件，这些控件的点击可能会被拖动行为干扰。

**适用场景**：客户区没有可交互控件，或者只有特定区域允许拖动（可以用 `CRect::PtInRect` 限制范围）。

## 方法二：OnLButtonDown 发送系统消息（推荐）

在鼠标左键按下时，主动向系统发送 `WM_NCLBUTTONDOWN` 消息，让系统接管后续的拖动逻辑。

```cpp
void CMyDlg::OnLButtonDown(UINT nFlags, CPoint point) {
    CDialogEx::OnLButtonDown(nFlags, point);

    // 通知系统：鼠标在标题栏按下，请处理拖动
    PostMessage(WM_NCLBUTTONDOWN, HTCAPTION, MAKELPARAM(point.x, point.y));
    // 也可以用：SendMessage(WM_SYSCOMMAND, SC_MOVE | HTCAPTION, 0);
}
```

**优点**：只在 `LButtonDown` 时介入，不影响其他鼠标操作（右键、双击等不受影响）。  
**缺点**：对某些透明/分层窗口（`WS_EX_LAYERED`）可能有兼容性问题。

**适用场景**：大多数自定义皮肤窗口，是最常用的方案。

## 方法三：OnMouseMove 手动 MoveWindow

完全自己处理拖动逻辑：记录鼠标按下时的位置，在 `OnMouseMove` 中计算偏移量并移动窗口。

```cpp
// .h 中声明
bool  m_bDragging = false;
CPoint m_dragStart;

// .cpp 中实现
void CMyDlg::OnLButtonDown(UINT nFlags, CPoint point) {
    CDialogEx::OnLButtonDown(nFlags, point);
    m_bDragging = true;
    m_dragStart = point;
    SetCapture(); // 捕获鼠标，防止移出窗口后丢失消息
}

void CMyDlg::OnMouseMove(UINT nFlags, CPoint point) {
    if (m_bDragging && (nFlags & MK_LBUTTON)) {
        CPoint delta = point - m_dragStart;
        CRect wndRect;
        GetWindowRect(&wndRect);
        MoveWindow(
            wndRect.left + delta.x,
            wndRect.top  + delta.y,
            wndRect.Width(),
            wndRect.Height()
        );
        // 注意：不更新 m_dragStart，因为 point 是客户区坐标，窗口移动后保持一致
    }
    CDialogEx::OnMouseMove(nFlags, point);
}

void CMyDlg::OnLButtonUp(UINT nFlags, CPoint point) {
    CDialogEx::OnLButtonUp(nFlags, point);
    m_bDragging = false;
    ReleaseCapture();
}
```

**优点**：完全自主控制，可以加拖动范围限制、吸附到屏幕边缘等自定义逻辑。  
**缺点**：代码量最多，需要处理 `SetCapture`/`ReleaseCapture`，否则鼠标移出窗口后拖动会卡住。

**适用场景**：需要自定义拖动行为（限制范围、磁性吸附、拖动动画）。

## 三种方法对比

| 方法 | 代码量 | 控件交互 | 自定义空间 | 推荐场景 |
|------|--------|----------|------------|----------|
| OnNcHitTest | 最少 | 可能干扰 | 最小 | 全屏或无控件窗口 |
| OnLButtonDown + PostMessage | 少 | 不影响 | 小 | **通用场景（首选）** |
| OnMouseMove 手动 | 多 | 完全控制 | 最大 | 需要自定义拖动行为 |

<Chart client:only="vue" type="radar" data={dragRadarData} options={dragRadarOptions} height={260} />

> 分数 1-5，越高越好。实现复杂度取反，即代码越少得分越高。

## 注意事项

- **透明窗口**：使用 `WS_EX_LAYERED` + `SetLayeredWindowAttributes` 的透明窗口，方法二有时不生效，建议用方法三。
- **多显示器**：`MoveWindow` 的坐标是屏幕绝对坐标，跨显示器拖动正常工作。
- **子对话框**：如果是子窗口（非顶层），方法一/二移动的是父窗口，需注意层级关系。', '2022-08-16', '["mfc","cpp","windows"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('network-clash-config', 'Clash / Mihomo 配置详解：规则、策略组与分流', '深入解析 Clash/Mihomo 的核心配置结构，包括代理节点、策略组类型、规则优先级、DNS fake-ip 模式，以及一份实用的完整配置模板。', '## Clash / Mihomo 是什么

**Clash** 是一个规则驱动的代理客户端内核，**Mihomo**（原 Clash.Meta）是它目前最活跃的分支，支持更多协议和特性。大多数 GUI 客户端（Clash Verge Rev、OpenClash 等）底层跑的都是 Mihomo 内核。

> 注意：原版 Clash 仓库已于 2023 年 11 月删库，目前使用 Mihomo 内核。

---

## 配置文件结构

一份 Clash 配置由以下几个部分组成：

```yaml
# 基础设置
port: 7890          # HTTP 代理端口
socks-port: 7891    # SOCKS5 代理端口
mixed-port: 7892    # HTTP + SOCKS5 混合端口（推荐用这个）
allow-lan: false    # 是否允许局域网连接
mode: rule          # 代理模式：rule / global / direct
log-level: info

# DNS 配置
dns: ...

# 代理节点
proxies: ...

# 策略组
proxy-groups: ...

# 规则
rules: ...
```

---

## 代理模式

| 模式 | 行为 |
|------|------|
| `rule` | 按规则分流，国内直连，国外走代理（**日常使用**）|
| `global` | 全部走代理 |
| `direct` | 全部直连，相当于关闭代理 |

---

## 策略组类型

```yaml
proxy-groups:
  # 手动选择节点
  - name: "手动选择"
    type: select
    proxies:
      - "香港 01"
      - "日本 01"
      - DIRECT

  # 自动测速，选延迟最低的
  - name: "自动选择"
    type: url-test
    proxies:
      - "香港 01"
      - "日本 01"
    url: "https://www.gstatic.com/generate_204"
    interval: 300     # 每 5 分钟测速一次
    tolerance: 50     # 延迟差在 50ms 内不切换

  # 故障转移：第一个挂了自动换下一个
  - name: "故障转移"
    type: fallback
    proxies:
      - "香港 01"
      - "日本 01"
    url: "https://www.gstatic.com/generate_204"
    interval: 60

  # 负载均衡：多节点轮流用
  - name: "负载均衡"
    type: load-balance
    proxies:
      - "香港 01"
      - "香港 02"
    strategy: round-robin   # 或 consistent-hashing
```

---

## 规则类型

规则从上到下匹配，第一条命中则停止：

```yaml
rules:
  # 域名完整匹配
  - DOMAIN,example.com,DIRECT

  # 域名后缀匹配（最常用）
  - DOMAIN-SUFFIX,google.com,手动选择
  - DOMAIN-SUFFIX,github.com,手动选择

  # 域名关键词（慎用，容易误匹配）
  - DOMAIN-KEYWORD,youtube,手动选择

  # IP 段
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve

  # GeoIP 国家码（需要 geoip.dat 数据库）
  - GEOIP,CN,DIRECT
  - GEOIP,PRIVATE,DIRECT

  # 规则集（从 URL 加载，减少配置体积）
  - RULE-SET,reject,REJECT        # 广告拦截
  - RULE-SET,direct,DIRECT        # 国内直连
  - RULE-SET,proxy,手动选择       # 需要代理

  # 兜底规则，必须放最后
  - MATCH,手动选择
```

---

## DNS 配置

DNS 是 Clash 里最容易踩坑的部分。

### fake-ip 模式（推荐）

```yaml
dns:
  enable: true
  listen: 0.0.0.0:53
  ipv6: false
  enhanced-mode: fake-ip         # 关键配置
  fake-ip-range: 198.18.0.1/16  # 分配给域名的假 IP 段
  fake-ip-filter:                # 这些域名不用 fake-ip（NTP、局域网等）
    - "*.lan"
    - "*.local"
    - "time.*.com"
    - "+.ntp.org"
  nameserver:
    - 223.5.5.5      # 阿里 DNS（国内）
    - 119.29.29.29   # 腾讯 DNS（国内）
  fallback:
    - "https://1.1.1.1/dns-over-https"   # Cloudflare DoH（国外）
    - "https://8.8.8.8/dns-over-https"   # Google DoH（国外）
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
```

**fake-ip 原理**：Clash 拦截 DNS 请求，立即返回一个假 IP（如 `198.18.0.1`），同时记录"假 IP → 域名"的映射。当实际连接请求到来时，Clash 查表得到真实域名，再按规则决定走代理还是直连，代理节点负责解析真实域名。

好处：
- 消除 DNS 污染（国内 DNS 不会污染走代理的域名）
- 延迟更低（无需等待 DNS 解析）

### redir-host 模式

```yaml
enhanced-mode: redir-host
```

Clash 真正解析域名，得到 IP 后再匹配 `IP-CIDR` 规则。缺点：国内 DNS 可能污染域名，且多一次 DNS 往返。

---

## 完整配置示例

```yaml
mixed-port: 7890
allow-lan: false
mode: rule
log-level: warning
ipv6: false

dns:
  enable: true
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "+.ntp.org"
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - "https://1.1.1.1/dns-over-https"
  fallback-filter:
    geoip: true
    geoip-code: CN

proxies:
  - name: "香港 01"
    type: vless
    server: hk01.example.com
    port: 443
    uuid: "your-uuid-here"
    network: ws
    tls: true
    ws-opts:
      path: /ws
      headers:
        Host: hk01.example.com

proxy-groups:
  - name: "节点选择"
    type: select
    proxies: ["自动选择", "香港 01", DIRECT]

  - name: "自动选择"
    type: url-test
    proxies: ["香港 01"]
    url: "https://www.gstatic.com/generate_204"
    interval: 300

  - name: "广告拦截"
    type: select
    proxies: [REJECT, DIRECT]

rule-providers:
  reject:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt"
    path: ./ruleset/reject.yaml
    interval: 86400
  cn:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt"
    path: ./ruleset/cn.yaml
    interval: 86400
  proxy:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt"
    path: ./ruleset/proxy.yaml
    interval: 86400

rules:
  - RULE-SET,reject,广告拦截
  - RULE-SET,cn,DIRECT
  - RULE-SET,proxy,节点选择
  - GEOIP,CN,DIRECT
  - GEOIP,PRIVATE,DIRECT,no-resolve
  - MATCH,节点选择
```

---

## 常见问题

### DNS 泄露

症状：用代理访问 Google，但 DNS 请求走了国内服务器，暴露了访问意图。

解法：开启 fake-ip 模式 + 确保 `fallback` 里的 DNS 走代理（在 Clash Verge 里开启"系统代理"或 TUN 模式）。

### 某些 App 绕过 Clash

原因：App 直接使用 IP 硬编码或 DNS-over-HTTPS，不走系统代理。

解法：开启 **TUN 模式**（虚拟网卡，接管全局流量）：

```yaml
tun:
  enable: true
  stack: mixed      # gvisor / lwip / mixed（推荐）
  dns-hijack:
    - "any:53"
  auto-route: true
  auto-detect-interface: true
```

### 规则集更新失败

Clash Verge Rev 里手动点"更新规则集"，或检查 `rule-providers` 的 URL 是否可达。

---

## 规则集推荐

- [Loyalsoldier/clash-rules](https://github.com/Loyalsoldier/clash-rules)：国内最广泛使用的分流规则
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)：更细粒度的 App 级规则', '2026-04-30', '["网络","clash","代理","配置"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('network-proxy-vpn-guide', '代理与翻墙技术原理：从 HTTP 代理到现代协议', '深入解析代理与 VPN 的本质区别，梳理从 SOCKS5 到 Shadowsocks、V2Ray/Xray、Hysteria2 的协议演进，以及机场订阅的技术本质。', 'import Chart from ''../../components/Chart.vue''

export const protocolBarData = {
  labels: [''Shadowsocks'', ''V2Ray VMess'', ''VLESS+Reality'', ''Hysteria2'', ''Trojan''],
  datasets: [
    {
      label: ''速度'',
      data: [4, 3, 4, 5, 4],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
    },
    {
      label: ''抗封锁'',
      data: [1, 4, 5, 4, 4],
      backgroundColor: ''rgba(57,255,20,0.2)'',
      borderColor: ''rgba(57,255,20,0.9)'',
      borderWidth: 2,
    },
    {
      label: ''配置简便'',
      data: [5, 3, 3, 3, 3],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
    },
  ],
}

export const protocolBarOptions = {
  indexAxis: ''y'',
  scales: {
    x: {
      ticks: { color: ''#8888aa'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    },
    y: {
      ticks: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { display: false },
      border: { display: false },
    },
  },
}

## 代理 vs VPN：不是同一件事

很多人混用这两个词，但它们工作在不同的网络层：

| 维度 | 代理（Proxy） | VPN |
|------|--------------|-----|
| 工作层 | 应用层（L7）| 网络层（L3）|
| 覆盖范围 | 指定应用 / 浏览器 | 全局流量 |
| 协议感知 | 感知 HTTP/HTTPS | 不感知上层协议 |
| 延迟 | 较低 | 较高（封装开销）|
| 典型实现 | SOCKS5、HTTP Proxy | OpenVPN、WireGuard |
| 翻墙场景 | Clash、sing-box 分流 | 商业 VPN 服务 |

翻墙场景下，"机场 + 代理客户端"走的是**应用层代理**，不是传统 VPN。Clash 之类的工具做的是把系统流量接管后按规则分流，本质是增强版 SOCKS5/HTTP 代理。

---

## 协议演进

### SOCKS5（1996）

最基础的代理协议，无加密，支持 TCP/UDP，告诉代理服务器"帮我连接这个地址"。GFW 可轻松识别并封锁。

### Shadowsocks（2012）

clowwindy 设计，核心思路：**SOCKS5 流量 + 对称加密 + 混淆**。

```
Client → [SOCKS5 payload 加密（AES-256-GCM）] → SS Server → 目标
```

- 加密算法推荐：`aes-256-gcm`、`chacha20-ietf-poly1305`（AEAD 认证加密）
- 流量特征：随机噪声，GFW 早期无法识别
- 现状：流量特征已被 GFW 学习，纯 SS 容易被检测，需配合混淆

### V2Ray / Xray（2019+）

V2Ray 引入了**流量伪装**思路，Xray 是它的分支，性能更好。

核心：把代理流量伪装成正常 HTTPS 网站流量，过 GFW 检测时看起来像在访问某个网站。

```
Client → VLESS/VMess 流量
       → WebSocket / gRPC 传输
       → TLS 加密（SNI 指向正常域名）
       → CDN（可选，Cloudflare）
       → 落地服务器
```

**VLESS vs VMess**：
- VMess：有认证和加密，协议本身自带混淆
- VLESS：无内置加密（依赖外层 TLS），更轻量，配合 XTLS 性能更好
- 现在新配置推荐：**VLESS + Reality**（伪装成真实网站 TLS，无需自己的域名）

### Hysteria2（2023）

基于 **QUIC（UDP）** 的协议，模拟视频流量特征（BBR 拥塞控制 + 伪装成视频网站）。

优势：
- 在丢包率高的网络下性能极好（UDP 比 TCP 更耐丢包）
- 带宽利用率高，实测比 V2Ray 快 2-5 倍

劣势：UDP 在某些网络环境下被 QoS 限速；落地 VPS 需开放 UDP 端口。

### 协议对比

| 协议 | 速度 | 抗封锁 | 配置复杂度 | 推荐场景 |
|------|------|--------|-----------|---------|
| Shadowsocks | 快 | 弱 | 简单 | 已不推荐单独用 |
| V2Ray VMess | 中 | 强 | 中 | 稳定场景 |
| VLESS + Reality | 快 | 最强 | 中 | 推荐，无需域名 |
| Hysteria2 | 最快 | 强 | 中 | 网络质量差 / 追求速度 |
| Trojan | 快 | 强 | 中 | 有域名时的好选择 |

<Chart client:only="vue" type="bar" data={protocolBarData} options={protocolBarOptions} height={260} />

---

## 客户端工具

| 工具 | 平台 | 内核 | 特点 |
|------|------|------|------|
| **Clash Verge Rev** | Win/Mac/Linux | Mihomo | 最推荐，图形界面完善 |
| **sing-box** | 全平台 | 自研 | 支持协议最全，配置较复杂 |
| **V2rayN** | Windows | Xray | 老牌，轻量 |
| **Surge** | Mac/iOS | 自研 | 最强分流规则，贵 |
| **Shadowrocket** | iOS | 自研 | iOS 最流行，一次性付费 |
| **NekoBox** | Android | sing-box | Android 推荐 |

---

## 机场的本质

"机场"本质是一门**带宽批发转零售**的生意：

```
机场运营商
  → 批量购买境外 VPS（美国/香港/日本/新加坡）
  → 在 VPS 上部署代理服务端（Xray/sing-box）
  → 用面板工具（X-UI、3X-UI）管理用户
  → 按月/年售卖订阅，用户导入订阅链接
```

**订阅链接格式**：

```
# Clash 订阅：YAML 格式，包含节点列表 + 规则
https://your-airport.com/api/v1/client/subscribe?token=xxx

# 通用订阅：Base64 编码的节点 URI 列表
ss://base64==@host:port#name
vless://uuid@host:port?xxx#name
```

---

## 选机场的依据

- **不要选太便宜的**（月付 < 5 元）：要么跑路，要么卖流量数据
- **看落地 IP 质量**：用 [ipcheck.ing](https://ipcheck.ing) 检测是否被标记为代理/数据中心
- **看协议支持**：2025 年还只提供 SS 的机场建议放弃，起码要有 VLESS/Hysteria2
- **不存密码/隐私数据在流量里**：代理服务器可以看到未加密的流量，HTTPS 内容则看不到
- **备用节点**：主机场 + 一个备用，关键时刻不断网

---

## 延伸：WARP

Cloudflare WARP 是一个免费的基于 WireGuard 的工具，可以访问部分被墙内容（Twitter 等），但不稳定且速度有限。优势是不需要机场，直接用 Cloudflare 的网络。', '2026-04-30', '["网络","代理","协议"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('npm-electron-install-fix', '彻底解决 npm 安装 Electron 失败的问题', '分析 npm install electron 失败的根本原因（下载二进制超时/被墙），通过国内镜像（npmmirror）彻底解决，并介绍多种备选方案和常见错误排查。', 'import Chart from ''../../components/Chart.vue''

export const electronSolutionData = {
  labels: [''npmmirror镜像'', ''手动Mirror'', ''本地缓存'', ''离线包''],
  datasets: [
    {
      label: ''成功率'',
      data: [5, 4, 3, 5],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
    },
    {
      label: ''复杂度(越高越简单)'',
      data: [5, 4, 4, 2],
      backgroundColor: ''rgba(57,255,20,0.2)'',
      borderColor: ''rgba(57,255,20,0.9)'',
      borderWidth: 2,
    },
    {
      label: ''适用范围'',
      data: [5, 4, 3, 3],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
    },
  ],
}

export const electronSolutionOptions = {
  indexAxis: ''y'',
  scales: {
    x: {
      ticks: { color: ''#8888aa'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { color: ''rgba(30,30,48,0.8)'' },
      border: { display: false },
    },
    y: {
      ticks: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 10 } },
      grid: { display: false },
      border: { display: false },
    },
  },
}

## 为什么 npm install electron 总是失败

执行 `npm install --save-dev electron` 经常卡住，最终报错：

```
npm error code ETIMEDOUT
npm error errno ETIMEDOUT
...
RequestError: connect ETIMEDOUT 185.199.108.133:443
```

或：

```
Error: connect ECONNREFUSED 0.0.0.0:443
```

原因不是 npm 包本身的问题，而是 **Electron 的安装脚本会在 npm install 完成后，从 GitHub Releases 下载一个几十到一百多 MB 的二进制压缩包**（`electron-vX.X.X-linux-x64.zip` 或 `electron-vX.X.X-win32-x64.zip`）。

这个下载地址是：

```
https://github.com/electron/electron/releases/download/vX.X.X/...
```

在国内，GitHub Releases 的下载速度极慢甚至完全不可达，导致安装超时失败。

## 方案一：使用 cnpm（推荐快速解决）

`cnpm` 是淘宝/阿里维护的 npm 客户端，使用 `npmmirror.com` 作为源，同时代理了 Electron 的二进制文件：

```bash
# 1. 全局安装 cnpm，指向国内镜像
npm install -g cnpm --registry=https://registry.npmmirror.com

# 2. 用 cnpm 安装 Electron
cnpm install --save-dev electron
```

`cnpm` 会自动将 Electron 二进制的下载地址替换为 `https://npmmirror.com/mirrors/electron/`，速度快且稳定。

## 方案二：配置 ELECTRON_MIRROR 环境变量

不想换 npm 客户端的话，只需告诉 Electron 安装脚本去哪里下载二进制：

```bash
# Linux / macOS
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install --save-dev electron

# Windows PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install --save-dev electron

# Windows CMD
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install --save-dev electron
```

或者在项目根目录创建 `.npmrc` 文件，永久生效：

```ini
# .npmrc
electron_mirror=https://npmmirror.com/mirrors/electron/
```

## 方案三：全局配置 .npmrc（推荐持久化）

在用户主目录的 `~/.npmrc`（或 `%USERPROFILE%\.npmrc`）中添加：

```ini
registry=https://registry.npmmirror.com
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

之后所有项目的 `npm install electron` 都会走国内镜像，无需额外操作。

## 方案四：用 bun 或 pnpm（更现代的方式）

bun 和 pnpm 都内置了更好的网络处理，配合镜像更稳定：

```bash
# bun（自动用更快的并发下载）
bun add -d electron
# 配合环境变量
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ bun add -d electron

# pnpm（同样支持 .npmrc 的 electron_mirror）
pnpm add -D electron
```

## 方案五：手动下载后安装

网络实在不稳定时，可以手动下载二进制再安装：

```bash
# 1. 查看当前要安装的 Electron 版本
cat node_modules/electron/package.json | grep ''"version"''
# 或者先 npm install，让它下载 package，失败后手动补充二进制

# 2. 从 npmmirror 手动下载对应版本的 zip
# https://npmmirror.com/mirrors/electron/v28.2.0/electron-v28.2.0-linux-x64.zip

# 3. 将下载的 zip 放入缓存目录
mkdir -p ~/.electron
cp electron-v28.2.0-linux-x64.zip ~/.electron/

# 4. 设置 ELECTRON_SKIP_BINARY_DOWNLOAD 并重新安装（让脚本直接用缓存）
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --save-dev electron
```

## 常见报错速查

| 报错 | 原因 | 解决方案 |
|------|------|---------|
| `ETIMEDOUT` | GitHub 下载超时 | 配置 `ELECTRON_MIRROR` |
| `ECONNREFUSED` | 连接被拒绝 | 代理未配置或镜像地址错误 |
| `checksum mismatch` | 缓存文件损坏 | 清除 `~/.electron` 或 `~/.cache/electron` 重新下载 |
| `Unsupported platform` | 平台/架构不支持 | 检查 Node 和系统架构是否匹配 |
| Permission denied | 全局安装权限不足 | 用 `sudo` 或修复 npm 全局目录权限 |

<Chart client:only="vue" type="bar" data={electronSolutionData} options={electronSolutionOptions} height={240} />

## 验证安装成功

```bash
# 检查 electron 是否可执行
./node_modules/.bin/electron --version
# 输出示例：v28.2.0

# 或通过 npx
npx electron --version
```

## 延伸：electron-builder 也有类似问题

如果你使用 `electron-builder` 打包，它也会下载额外的工具链（`nsis`、`7za` 等）。同样在 `.npmrc` 中配置：

```ini
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```', '2024-03-01', '["Electron","npm","前端工具链","国内镜像"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('openclaw-vs-hermes-agent', 'OpenClaw vs Hermes Agent：两个本地优先 Agent 的设计差异', 'OpenClaw（Novita AI）和 Hermes Agent（Nous Research）都是本地运行的个人 AI Agent，但在记忆系统、技能学习、运行环境和模型生态上走了不同的路。深入对比两种架构的核心差异。', 'import Chart from ''../../components/Chart.vue''

export const compareRadarData = {
  labels: [''多模型支持'', ''技能自学习'', ''运行环境灵活性'', ''插件生态'', ''持久记忆'', ''开源程度''],
  datasets: [
    {
      label: ''OpenClaw'',
      data: [3, 2, 2, 5, 4, 2],
      backgroundColor: ''rgba(0,212,255,0.2)'',
      borderColor: ''rgba(0,212,255,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(0,212,255,1)'',
      pointRadius: 4,
    },
    {
      label: ''Hermes Agent'',
      data: [5, 5, 5, 3, 5, 5],
      backgroundColor: ''rgba(255,0,170,0.2)'',
      borderColor: ''rgba(255,0,170,0.9)'',
      borderWidth: 2,
      pointBackgroundColor: ''rgba(255,0,170,1)'',
      pointRadius: 4,
    },
  ]
}

export const compareRadarOptions = {
  scales: {
    r: {
      min: 0, max: 5,
      ticks: { display: false, stepSize: 1 },
      grid: { color: ''rgba(136,136,170,0.25)'' },
      angleLines: { color: ''rgba(136,136,170,0.25)'' },
      pointLabels: { color: ''#c8c8d8'', font: { family: ''JetBrains Mono'', size: 11 } },
    }
  }
}

> **注**：本文对比的 OpenClaw 为 Novita AI 的 OpenClaw Gateway 版本，Hermes Agent 为 Nous Research 的开源版本（MIT，v0.11.0）。两者均在持续迭代，以各自官方文档为准。

OpenClaw 和 Hermes Agent 是目前最接近的两个个人 AI Agent 框架——两者都跑在你自己的机器上，都支持 Telegram/Discord 等 IM 接入，都有持久记忆和定时任务。

但从更深的设计哲学来看，它们走了截然不同的路。一个是**配置驱动的 Gateway 生态**，另一个是**自我学习的闭环系统**。

---

## 先说清楚：两者都是本地优先

这一点经常被误解。**Hermes Agent 不是云服务**，它和 OpenClaw 一样，是一个你部署在自己服务器或本机上的进程。

```bash
# Hermes Agent 安装方式（Linux/macOS/WSL2）
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes setup
hermes gateway start  # 启动消息网关（Telegram/Discord/Slack...）
```

```bash
# OpenClaw 安装方式
npm install -g openclaw
openclaw gateway start
```

两者都是：安装 → 配置 → 跑一个本地 gateway 进程 → 通过 IM 或 CLI 与 Agent 交互。

---

## 背景

- **OpenClaw**：Novita AI 开发，Node.js 实现，插件/Skills 生态驱动，核心 Gateway 非开源
- **Hermes Agent**：Nous Research（知名开源 LLM 研究机构）开发，Python 实现，MIT 全开源，v0.11.0

两者都有相当的社区活跃度。Hermes 官方提供了 `hermes claw migrate` 命令，可以从 OpenClaw 迁移，说明两者确实面向同一类用户。

---

## 核心特性对比

| 维度 | OpenClaw | Hermes Agent |
|------|----------|--------------|
| 开发语言 | Node.js | Python |
| 开源协议 | 部分开源（Gateway 核心闭源） | MIT 全开源 |
| IM 渠道 | Discord/Telegram/Signal/微信等 | Telegram/Discord/Slack/WhatsApp/Signal/Email |
| 模型支持 | Anthropic/OpenAI/Gemini + GitHub Copilot | 200+ 模型（OpenRouter/Nous Portal/NVIDIA NIM/OpenAI 等） |
| 运行环境 | 本地进程 | 6 种终端后端（Local/Docker/SSH/Daytona/Singularity/Modal） |
| 技能系统 | SKILL.md 手写，配置驱动 | 任务完成后**自动生成技能**，运行中**自我改进** |
| 记忆系统 | 本地向量数据库（语义检索） | FTS5 全文检索 + LLM 摘要 + Honcho 用户建模 |
| 定时任务 | 内置 Cron 引擎 | 内置 Cron（自然语言配置） |
| 子 Agent | `sessions_spawn` 隔离运行 | 隔离子 Agent + Python RPC 脚本并行 |
| 研究功能 | 无 | 批量轨迹生成、Atropos RL 环境 |
| 迁移工具 | 无 | `hermes claw migrate`（从 OpenClaw 迁移） |

---

## 最大的差异：技能是手写的还是自学的

这是两者最根本的设计哲学分歧。

**OpenClaw 的 Skills** 是你手写的 SKILL.md 文件——描述某类任务的执行规范，Agent 根据用户意图选择。这个系统非常灵活，可以精确控制 Agent 的行为，但需要你主动维护。

**Hermes Agent 的 Skills** 是 Agent 在完成复杂任务后**自动创建**的，并且在后续使用中**自我改进**：

```
典型流程：
1. 你让 Agent 做了一件复杂的事
2. 任务完成后，Agent 自动提炼经验 → 生成一个 Skill
3. 下次遇到类似任务，直接调用这个 Skill（零上下文成本）
4. 每次调用后，Skill 会根据结果持续优化
```

官方把这称为"**闭合学习循环**"（closed learning loop）——Agent 随着使用时间越长，处理同类任务越高效。Hermes 还兼容 [agentskills.io](https://agentskills.io) 开放标准，可以导入社区分享的 Skills。

---

## 运行环境：本地进程 vs 六种后端

OpenClaw 的 Agent 直接跑在启动进程的机器上。

Hermes Agent 支持**六种终端后端**：

| 后端 | 特点 |
|------|------|
| Local | 直接在本机运行 |
| Docker | 容器隔离，更安全 |
| SSH | 在远程服务器上运行 |
| Daytona | 无服务器持久化，空闲时休眠（按需计费） |
| Singularity | HPC 环境，适合科研集群 |
| Modal | 无服务器，近乎零成本空闲 |

这意味着你可以在笔记本上通过 Telegram 发消息，而 Agent 实际的代码执行发生在云端 VM 上——手机断网不影响任务继续跑。

---

## 记忆系统的实现差异

两者都有持久记忆，但实现路径不同。

**OpenClaw**：本地向量数据库，支持语义搜索。MEMORY.md 作为主记忆文件，每日日志追加写入，可配置自动蒸馏。

**Hermes Agent**：三层结构：
1. **FTS5 全文检索**：精确关键词搜索历史对话
2. **LLM 摘要**：跨 Session 的语义召回
3. **Honcho 用户建模**：通过 [plastic-labs/honcho](https://github.com/plastic-labs/honcho) 构建用户模型，Agent 对你的了解随时间深化

---

## 模型生态

**OpenClaw** 通过 provider 插件接入模型，官方支持 Anthropic/OpenAI/Gemini，以及 GitHub Copilot 作为代理。

**Hermes Agent** 开箱支持 200+ 模型：

```bash
hermes model  # 交互式选择 provider 和模型
# 支持：Nous Portal / OpenRouter(200+) / NVIDIA NIM(Nemotron)
#       Xiaomi MiMo / z.ai/GLM / Kimi/Moonshot / MiniMax
#       HuggingFace / OpenAI / 自定义 OpenAI 兼容端点
```

切换模型不需要改代码：`hermes model set openrouter:deepseek/deepseek-r1`。

---

## 综合对比雷达图

> 分数代表各维度的相对侧重（1-5），数据来源于各自官方文档和 GitHub README，主观评分维度已标注。

<Chart client:only="vue" type="radar" data={compareRadarData} options={compareRadarOptions} height={280} />

---

## 怎么选

**选 OpenClaw，如果你：**
- 在 Node.js 生态更熟悉，或已有 OpenClaw 的使用经验
- 需要精确控制 Agent 行为（Skills 手写，可审计）
- 使用 Anthropic/OpenAI/Gemini 等主流 provider 已经足够
- 想要稳定的商业支持（Novita AI 背书）

**选 Hermes Agent，如果你：**
- 希望 Agent **自己学习**，减少手动维护 Skills 的成本
- 需要在**远程服务器/云环境**上运行 Agent 的执行环境
- 想要接入更多样的模型（OpenRouter 生态）
- 重视完全开源（MIT），可以审计和修改所有代码
- 对 NLP 研究感兴趣（Atropos RL 环境、轨迹生成）

**如果你现在用 OpenClaw，想试试 Hermes：**
```bash
hermes claw migrate  # 官方提供的迁移工具
```

---

## 小结

OpenClaw 和 Hermes Agent 是同一赛道的两个竞争者，不是"本地 Agent vs 云 API"的关系。

核心差异在于：OpenClaw 是**配置驱动**的 Gateway 生态，Skills 由用户定义；Hermes Agent 是**学习驱动**的闭环系统，Skills 由 Agent 自己积累。

前者更可控，后者更自主。哪个更适合你，取决于你希望在 Agent 的成长过程中扮演什么角色。', '2026-05-01', '["AI","agent","OpenClaw","LLM"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('pwa-install-update-button', 'PWA 踩坑：为什么安装按钮从来不出现', '从 beforeinstallprompt 到 Service Worker waiting，把 PWA 的安装与更新提示真正做对', '给博客加 PWA 的过程里踩了一个很经典的坑：**按钮在右上角，但永远是空的**。

## 问题在哪

加了 PWA 之后我以为会有个安装提示出现。结果什么都没有。

`registerType: ''autoUpdate''` 是最常见的配置，文档里也是这么写的：

```js
AstroPWA({
  registerType: ''autoUpdate'',  // ← 问题在这
})
```

这个模式下，Service Worker 一检测到新版本就**立刻静默接管**，用户完全没有感知。没有等待状态，没有 waiting worker，所以写的任何"点击刷新"按钮都永远不会触发。

## beforeinstallprompt 的条件

安装按钮靠 `beforeinstallprompt` 事件，但这个事件有严格的触发条件：

1. 网站必须满足 PWA 可安装标准（manifest + HTTPS + SW）
2. 用户**没有安装过**这个 PWA
3. 浏览器自己的启发式算法判断用户"有兴趣"（Chrome 通常要求访问两次）
4. 在 Chrome 地址栏已经有了安装入口的情况下不一定再触发

所以在本地 dev 环境几乎看不到，生产环境第一次访问也不一定出现。

## 正确做法

把 `registerType` 改成 `''prompt''`，同时处理两种状态：

```js
AstroPWA({
  registerType: ''prompt'',  // ← SW 找到新版本后进入 waiting，等待用户确认
  workbox: {
    skipWaiting: false,    // ← 不自动跳过，让用户手动触发
    clientsClaim: true,
  }
})
```

前端维护两个按钮：

```typescript
// 安装按钮：监听 beforeinstallprompt
window.addEventListener(''beforeinstallprompt'', (e) => {
  e.preventDefault()
  deferredPrompt = e
  installBtn.style.display = ''flex''
})

// 更新按钮：监听 SW waiting 状态
navigator.serviceWorker.ready.then((reg) => {
  if (reg.waiting) showUpdateBtn()  // 页面加载时已有 waiting worker
  
  reg.addEventListener(''updatefound'', () => {
    reg.installing?.addEventListener(''statechange'', () => {
      if (reg.installing?.state === ''installed'' && navigator.serviceWorker.controller) {
        showUpdateBtn()  // 新版本安装完成，等待接管
      }
    })
  })
})

// 用户点更新 → 发消息让 waiting worker 跳过等待
updateBtn.addEventListener(''click'', () => {
  reg.waiting?.postMessage({ type: ''SKIP_WAITING'' })
  location.reload()
})
```

这样：
- 未安装时右上角出现 `📱 安装`
- 部署了新版本后出现 `🔄 新版本`，点击刷新

## 为什么设计成这样

PWA 的更新模型是故意这么设计的：
- 旧的 SW 控制着当前所有打开的标签页
- 新 SW 安装完成后**不能直接接管**，必须等所有旧标签页关闭，或者调用 `skipWaiting`
- 如果强制 skipWaiting（`autoUpdate`），用户正在看的页面可能因为缓存版本切换出现资源 404

所以"等用户点一下"不是多此一举，是在保护用户体验。

## 验证方法

1. 打开 Chrome DevTools → Application → Service Workers
2. 部署新版后能看到 "waiting to activate" 状态
3. 点右上角 `🔄 新版本` → SW 接管 → 页面刷新到新版

或者直接 DevTools 里点 "Skip waiting" 模拟用户操作。', '2026-05-02', '["pwa","javascript","web","astro"]', 0);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('vite-vue3-ts-elementplus-pinia', '用 Vite+（vp）从零搭建 Vue3 + TypeScript + Element Plus + Pinia + Vue Router', '使用 Vite+ 统一工具链（vp）一条命令搭建 Vue3 全家桶，涵盖按需导入、Pinia store、路由配置，以及常见坑的解决方案。', '## 什么是 Vite+（vp）

[Vite+](https://viteplus.dev) 是 VoidZero 推出的统一 Web 工具链，把 Vite、Vitest、Oxlint、Rolldown、tsdown 集成到一个 `vp` 命令里。Node.js 版本管理、包管理器检测、dev/build/test 全部通过 `vp` 统一入口，不需要分别装多个工具。

```bash
# 安装（Linux / macOS）
curl -fsSL https://vite.plus | bash

# 验证
vp --version
```

---

## 1. 创建项目

`vp create vue` 底层调用 `create-vue`，支持交互式选项，一次性把 TypeScript、Pinia、Vue Router 全勾上：

```bash
# 交互式（推荐，会问你要不要 TS/Router/Pinia 等）
vp create vue

# 非交互式（全部选 yes，直接得到完整骨架）
vp create vue -- --ts --router --pinia --eslint --default
```

`create-vue` 生成的目录结构：

```
my-app/
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   │   └── index.ts          ← 已生成
│   ├── stores/
│   │   └── counter.ts        ← 已生成
│   ├── views/
│   ├── App.vue
│   └── main.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 2. 安装依赖

`vp install` 会自动检测项目里用的是 pnpm/bun/npm/yarn，无需手动指定：

```bash
cd my-app
vp install

# 追加 Element Plus
vp install element-plus @element-plus/icons-vue
vp install -D unplugin-auto-import unplugin-vue-components
```

---

## 3. Element Plus 按需导入

修改 `vite.config.ts`：

```ts
// vite.config.ts
import { defineConfig } from ''vite-plus''   // ← 用 vite-plus 的 defineConfig
import vue from ''@vitejs/plugin-vue''
import AutoImport from ''unplugin-auto-import/vite''
import Components from ''unplugin-vue-components/vite''
import { ElementPlusResolver } from ''unplugin-vue-components/resolvers''

export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Vue/Vue Router/Pinia Composition API，无需手写 import
    AutoImport({
      imports: [''vue'', ''vue-router'', ''pinia''],
      resolvers: [ElementPlusResolver()],
      dts: ''src/auto-imports.d.ts'',
    }),
    // 自动按需导入 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: ''src/components.d.ts'',
    }),
  ],
  resolve: {
    alias: { ''@'': ''/src'' },
  },
})
```

> **为什么用 `vite-plus` 的 `defineConfig` 而不是 `vite`？**
> `vite-plus` re-export 了 Vite 所有 API，同时扩展了 `test`/`lint`/`fmt` 等字段。两者兼容，项目迁移零成本。

**⚠️ Element Plus 样式丢失**

按需导入不会自动引入全局 CSS，在 `main.ts` 加一行兜底：

```ts
import ''element-plus/dist/index.css''
```

---

## 4. Pinia Store

Composition API 风格（推荐，类型推断最好）：

```ts
// src/stores/user.ts
import { defineStore } from ''pinia''

export const useUserStore = defineStore(''user'', () => {
  const token = ref(localStorage.getItem(''token'') ?? '''')
  const name  = ref('''')
  const isLoggedIn = computed(() => !!token.value)

  function login(t: string, n: string) {
    token.value = t
    name.value  = n
    localStorage.setItem(''token'', t)
  }

  function logout() {
    token.value = ''''
    name.value  = ''''
    localStorage.removeItem(''token'')
  }

  return { token, name, isLoggedIn, login, logout }
})
```

---

## 5. Vue Router

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from ''vue-router''

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: ''/'', redirect: ''/home'' },
    {
      path: ''/home'',
      component: () => import(''@/views/HomeView.vue''),
      meta: { title: ''首页'', requiresAuth: false },
    },
    {
      path: ''/dashboard'',
      component: () => import(''@/views/DashboardView.vue''),
      meta: { title: ''控制台'', requiresAuth: true },
    },
    {
      path: ''/:pathMatch(.*)*'',
      component: () => import(''@/views/NotFoundView.vue''),
    },
  ],
  scrollBehavior: (_, __, saved) => saved ?? { top: 0 },
})

// 路由守卫
router.beforeEach((to, _, next) => {
  // ✅ 在守卫内部调用 store，pinia 此时已经通过 app.use(pinia) 激活
  const userStore = useUserStore()
  document.title = (to.meta.title as string) ?? ''应用''
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: ''/login'', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
```

**⚠️ 守卫里用 Pinia 的正确姿势**

必须在守卫**函数内部**调用 `useXxxStore()`，不能在模块顶层调用——那时 `app.use(pinia)` 还没执行，会报 `getActivePinia was called with no active Pinia`。

---

## 6. main.ts 完整写法

```ts
// src/main.ts
import { createApp } from ''vue''
import { createPinia } from ''pinia''
import App from ''./App.vue''
import router from ''./router''
import ''element-plus/dist/index.css''
import * as Icons from ''@element-plus/icons-vue''

const app = createApp(App)

// pinia 必须在 router 之前注册，路由守卫才能正常使用 store
app.use(createPinia())
app.use(router)

// 全局注册 Element Plus 图标
Object.entries(Icons).forEach(([k, v]) => app.component(k, v))

app.mount(''#app'')
```

---

## 7. 日常开发命令（全用 vp）

```bash
vp dev          # 启动开发服务器（Vite HMR）
vp build        # 生产构建（Rolldown）
vp check        # lint + type-check + format 三合一
vp test         # 运行 Vitest 测试
vp install      # 安装依赖（自动检测包管理器）
```

---

## 常见坑速查

| 问题 | 原因 | 解法 |
|------|------|------|
| Element Plus 无样式 | 按需导入未引入全局 CSS | `import ''element-plus/dist/index.css''` |
| Pinia 守卫报错 | 模块顶层调用 store，pinia 未激活 | 守卫函数**内部**调用 `useXxxStore()` |
| TS 找不到组件类型 | `components.d.ts` 未加入 tsconfig | 加进 `include` |
| `vp` 命令找不到 | PATH 未配置 | `source ~/.bashrc` 或重开终端 |', '2024-08-27', '["vue","vite","typescript","element-plus","pinia","vite-plus"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('vmware-tools-install', '在 VMware 虚拟机中安装 open-vm-tools 完整指南', '详解 VMware Tools 的作用、open-vm-tools 与官方 VMware Tools 的区别，以及在 Ubuntu 虚拟机中安装并生效的完整步骤和常见问题排查。', '## 为什么需要 VMware Tools

安装 VMware 虚拟机后，如果不安装 VMware Tools，你会遇到：

- **分辨率固定**：窗口缩放后画面不跟随调整，只能显示 800×600 等固定分辨率
- **无法共享剪贴板**：宿主机和虚拟机之间 Ctrl+C / Ctrl+V 不互通
- **鼠标无缝切换失效**：切换鼠标焦点需要按 Ctrl+Alt
- **文件拖放不可用**：无法从宿主机拖文件到虚拟机桌面
- **时间同步问题**：虚拟机时钟可能与宿主机偏差

VMware Tools 是解决以上所有问题的官方客户端套件。

## open-vm-tools vs 官方 VMware Tools

| 对比项 | open-vm-tools | 官方 VMware Tools |
|--------|--------------|-------------------|
| 来源 | 开源（VMware 官方维护）| 闭源，随 VMware 软件分发 |
| 安装方式 | `apt install`，随系统更新 | 需要从 VMware 菜单挂载 ISO 安装 |
| 桌面支持 | `open-vm-tools-desktop`（需单独安装）| 集成 |
| 推荐场景 | Linux 客户机（Ubuntu/Debian/CentOS）| Windows 客户机 |
| VMware 官方态度 | **推荐**用于 Linux | 适用于 Windows |

**结论**：Linux 虚拟机优先使用 `open-vm-tools`，不需要从菜单挂载安装盘。

## 安装步骤

### 1. 更新软件包索引

```bash
sudo apt update && sudo apt upgrade -y
```

`upgrade` 确保现有包是最新状态，避免依赖冲突。

### 2. 安装 open-vm-tools

```bash
# 桌面环境（GNOME/KDE/Xfce 等图形界面）
sudo apt install open-vm-tools-desktop -y

# 无桌面的服务器环境（命令行 only）
sudo apt install open-vm-tools -y
```

`open-vm-tools-desktop` 包含了 `open-vm-tools` 的所有功能，并额外提供：
- SVGA 显示驱动（支持动态分辨率）
- 剪贴板共享（`vmware-user-suid-wrapper`）
- 拖放支持

### 3. 重启虚拟机

```bash
sudo reboot
```

重启后，VMware 界面底部状态栏会显示 "VMware Tools is running"，分辨率调整也会立即生效。

## 验证安装

```bash
# 检查服务状态
systemctl status open-vm-tools

# 查看版本
vmware-toolsd --version

# 检查 SVGA 驱动是否加载（桌面版）
lsmod | grep vmwgfx
```

正常输出示例：

```
● open-vm-tools.service - Service for virtual machines hosted on VMware
     Loaded: loaded (/lib/systemd/system/open-vm-tools.service; enabled)
     Active: active (running)
```

## 常见问题

### 剪贴板共享仍不工作

确认以下两点：

1. **VMware 设置里开启了共享**：虚拟机 → 设置 → 选项 → 客户机隔离 → 取消勾选"禁用…"
2. **服务正在运行**：

```bash
systemctl restart open-vm-tools
```

### 分辨率不能自动调整

有时需要手动启动用户级服务：

```bash
vmware-user-suid-wrapper &
```

或将其加入 `~/.profile` 自动启动：

```bash
echo "vmware-user-suid-wrapper &" >> ~/.profile
```

### 在 Wayland 会话下剪贴板不工作

Ubuntu 22.04+ 默认使用 Wayland，open-vm-tools 的剪贴板共享目前对 Wayland 支持不完整。临时解决方案：在登录界面切换为 **Xorg 会话**（点击右下角齿轮图标选择）。

### 包不存在：E: Package ''open-vm-tools-desktop'' has no installation candidate

这通常出现在 Ubuntu Server 版本（没有图形界面）。改装无桌面版：

```bash
sudo apt install open-vm-tools -y
```

## 卸载旧版 VMware Tools（如有）

如果之前通过 ISO 安装过官方 VMware Tools，需先卸载再安装 open-vm-tools：

```bash
# 检查是否存在旧安装
ls /usr/bin/vmware-uninstall-tools.pl

# 存在则卸载
sudo /usr/bin/vmware-uninstall-tools.pl
```

然后按上述步骤重新安装 `open-vm-tools`。', '2023-11-21', '["VMware","Linux","Ubuntu","虚拟机"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('win-cw2a-ca2w', 'ATL 字符串转换：CW2A 与 CA2W 完全指南', '详解 ATL 宏 CW2A/CA2W 在 Unicode 与 ANSI 之间的字符串转换用法、头文件依赖、USES_CONVERSION 宏的作用与常见陷阱。', '## 背景

Windows 应用从 Windows Vista 开始全面转向 Unicode（`wchar_t`/`WCHAR`），但仍存在大量场景需要在 Unicode（宽字节）与 ANSI（多字节/UTF-8）之间相互转换：

- 调用只支持 `char*` 的第三方库（如 SQLite、curl）
- 从注册表或文件读取 ANSI 字符串后传给 Unicode API
- 与 COM 接口交换 `BSTR` 和 `std::string`

ATL（Active Template Library）提供了一组轻量级转换宏，`CW2A` 和 `CA2W` 是其中最常用的两个。

## 头文件与依赖

```cpp
#include <atlbase.h>   // ATL 基础
#include <atlstr.h>    // CW2A / CA2W / CString 等字符串工具
```

在纯 Win32 项目（非 MFC）中，有时还需要：

```cpp
#include <atlconv.h>   // 早期 ATL 版本的转换宏
```

## USES_CONVERSION 宏

老版 ATL（ATL 3.x）的转换宏依赖栈上的临时变量，必须在函数体开头声明：

```cpp
void OldStyleFunction(LPCWSTR wide)
{
    USES_CONVERSION;           // 声明所需的局部变量
    LPCSTR ansi = W2A(wide);   // 老宏：W2A/A2W
    printf("%s\n", ansi);
}
```

**ATL 7.x（Visual Studio 2003+）之后，`CW2A`/`CA2W` 是类对象，不再需要 `USES_CONVERSION`。**

现代写法：

```cpp
void ModernFunction(LPCWSTR wide)
{
    // 直接用，无需 USES_CONVERSION
    CW2A ansi(wide);
    printf("%s\n", static_cast<LPCSTR>(ansi));
}
```

## CW2A：Unicode → ANSI/UTF-8

`CW2A` = **C**onvert **W**ide (Unicode) **to** **A**NSI

```cpp
#include <atlstr.h>

void DemoW2A()
{
    LPCWSTR wideStr = L"Hello, 世界";

    // 默认：使用系统 ANSI 代码页（CP_ACP）
    CW2A ansiStr(wideStr);
    printf("ANSI: %s\n", static_cast<LPCSTR>(ansiStr));

    // 显式指定 UTF-8（推荐！避免代码页问题）
    CW2A utf8Str(wideStr, CP_UTF8);
    printf("UTF-8: %s\n", static_cast<LPCSTR>(utf8Str));

    // 也可以传给只接受 std::string 的接口
    std::string stdStr(static_cast<LPCSTR>(utf8Str));
}
```

## CA2W：ANSI/UTF-8 → Unicode

`CA2W` = **C**onvert **A**NSI **to** **W**ide (Unicode)

```cpp
void DemoA2W()
{
    LPCSTR ansiStr = "Hello, World";

    // 默认：系统 ANSI 代码页
    CA2W wideStr(ansiStr);
    wprintf(L"Wide: %s\n", static_cast<LPCWSTR>(wideStr));

    // UTF-8 → Unicode（从文件、网络读取 UTF-8 内容时常用）
    LPCSTR utf8Data = u8"你好，世界";
    CA2W wideFromUtf8(utf8Data, CP_UTF8);
    wprintf(L"From UTF-8: %s\n", static_cast<LPCWSTR>(wideFromUtf8));

    // 转为 std::wstring
    std::wstring ws(static_cast<LPCWSTR>(wideFromUtf8));
}
```

## 与 CString 配合

MFC/ATL 项目中经常与 `CString`（`CStringA`/`CStringW`）互转：

```cpp
// CStringW → std::string (UTF-8)
CStringW cws = L"中文内容";
CW2A utf8(cws, CP_UTF8);
std::string result(utf8);

// std::string (UTF-8) → CStringW
std::string input = "UTF-8 content";
CA2W wide(input.c_str(), CP_UTF8);
CStringW output(wide);
```

## 完整转换速查表

| 宏/类 | 方向 | 代码页参数 |
|-------|------|-----------|
| `CW2A` | `wchar_t*` → `char*` | 第二参数，默认 `CP_ACP` |
| `CA2W` | `char*` → `wchar_t*` | 第二参数，默认 `CP_ACP` |
| `CW2AEX<N>` | 同上，栈缓冲区 N 字节 | 同上 |
| `CA2WEX<N>` | 同上，栈缓冲区 N 字节 | 同上 |
| `W2A`（老宏）| 同 `CW2A` | 需要 `USES_CONVERSION` |
| `A2W`（老宏）| 同 `CA2W` | 需要 `USES_CONVERSION` |

## 常见陷阱

### 1. 临时对象生命周期

`CW2A` 是一个栈对象。不要这样写：

```cpp
// ❌ 危险：临时对象析构，指针悬空
LPCSTR GetAnsi(LPCWSTR wide)
{
    return CW2A(wide); // 临时对象在此行结束后立即销毁！
}

// ✅ 正确：让调用方持有对象
CW2A GetAnsi(LPCWSTR wide)
{
    return CW2A(wide);
}
// 或者直接在调用处使用：
CW2A ansi(someWideStr);
SomeFunc(ansi); // 对象在整个表达式期间有效
```

### 2. 代码页一致性

混用 `CP_ACP` 和 `CP_UTF8` 会导致乱码。现代项目建议**始终使用 `CP_UTF8`**，并在 Visual Studio 项目属性中设置 `/utf-8` 编译选项。

### 3. nullptr 不安全

传入 `nullptr` 会导致断言或崩溃：

```cpp
// ✅ 安全写法
if (pWide != nullptr)
{
    CW2A ansi(pWide, CP_UTF8);
    // 使用 ansi
}
```

## 总结

- 现代 ATL（VS2003+）无需 `USES_CONVERSION`，直接用 `CW2A`/`CA2W`
- 强烈推荐指定 `CP_UTF8` 作为代码页，避免平台差异
- 注意 `CW2A` 是栈对象，不要返回其内部 `char*` 指针
- 头文件 `<atlstr.h>` 即可，`<atlconv.h>` 是旧接口', '2023-06-09', '["C++","Windows","ATL","字符串"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('win-postmessage-vector', 'Windows PostMessage 跨线程传递 std::vector 指针', '通过 PostMessage 在 Windows 消息队列中传递 std::vector 指针，使用 reinterpret_cast 将指针装入 LPARAM，并在接收方正确释放内存。', '## 背景

在 Windows GUI 应用中，UI 线程与工作线程之间经常需要交换数据。`PostMessage` 是异步消息投递的标准方式——但它的 `wParam` / `lParam` 只是两个指针大小的整数，无法直接容纳一个 `std::vector`。

常见需求场景：
- 后台线程采集数据，填充到 `std::vector<Item>`，通知 UI 线程刷新列表
- 工作线程批量处理结果，回调到主窗口

## 原理：指针即整数

`LPARAM` 在 64 位系统上是 8 字节整数，与指针大小相同。因此可以把堆上分配的 `std::vector*` 强转为 `LPARAM` 传递，接收方再强转回来。

```
PostMessage 发送方              消息队列              接收方 WndProc
─────────────────────     ────────────────     ─────────────────────
new vector<T>  ──(reinterpret_cast)──> LPARAM ──(reinterpret_cast)──> vector<T>*
                                                                          │
                                                                        使用完毕
                                                                          │
                                                                        delete ✓
```

## 发送方：分配并投递

```cpp
// 自定义消息 ID（WM_APP 之后是安全范围）
constexpr UINT WM_DATA_READY = WM_APP + 1;

void WorkerThread(HWND hMainWnd)
{
    // 1. 在堆上分配 vector（生命周期由接收方负责）
    auto* pData = new std::vector<std::string>();
    pData->push_back("item_1");
    pData->push_back("item_2");
    pData->push_back("item_3");

    // 2. reinterpret_cast 到 LPARAM（pointer → integer，同等大小）
    LPARAM lParam = reinterpret_cast<LPARAM>(pData);

    // 3. PostMessage 是异步的：本函数立即返回，不等窗口处理完
    //    注意：此后 *pData 的所有权已转移，不能再使用 pData！
    PostMessage(hMainWnd, WM_DATA_READY, 0, lParam);
}
```

## 接收方：还原并释放

```cpp
LRESULT CALLBACK WndProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    switch (uMsg)
    {
    case WM_DATA_READY:
    {
        // 1. 将 LPARAM 还原为指针
        auto* pData = reinterpret_cast<std::vector<std::string>*>(lParam);

        // 2. 使用数据
        for (const auto& s : *pData)
        {
            // 更新列表框、刷新 UI 等操作
            ::SendMessage(hListBox, LB_ADDSTRING, 0,
                          reinterpret_cast<LPARAM>(s.c_str()));
        }

        // 3. 释放堆内存——接收方负责 delete！
        delete pData;
        return 0;
    }
    // ... 其他消息处理
    }
    return DefWindowProc(hWnd, uMsg, wParam, lParam);
}
```

## 注意事项

### 1. 所有权转移必须明确

`PostMessage` 后发送方不得再访问该指针，所有权完全转移给接收方。推荐加一个注释或将局部变量设为 `nullptr`：

```cpp
PostMessage(hMainWnd, WM_DATA_READY, 0, reinterpret_cast<LPARAM>(pData));
pData = nullptr; // 明确放弃所有权
```

### 2. PostMessage 失败时内存泄漏

`PostMessage` 在消息队列满或窗口句柄无效时会返回 `FALSE`。必须处理这种情况：

```cpp
if (!PostMessage(hMainWnd, WM_DATA_READY, 0, reinterpret_cast<LPARAM>(pData)))
{
    // 发送失败，自己释放，避免泄漏
    delete pData;
    pData = nullptr;
}
```

### 3. SendMessage vs PostMessage

| 特性 | `SendMessage` | `PostMessage` |
|------|--------------|---------------|
| 执行方式 | 同步（等待处理完成）| 异步（投入队列立即返回）|
| 跨线程安全 | 是（会切换到目标线程）| 是 |
| 所有权 | 调用返回后指针仍有效 | 投递后指针不可再用 |

若同线程使用 `SendMessage`，调用返回后仍可 `delete`（不需要接收方释放），但跨线程异步场景必须用 `PostMessage` + 接收方 `delete`。

### 4. 更现代的替代方案

C++17 之后更推荐使用智能指针包裹或通过线程安全队列（如 `std::queue` + `std::mutex`）传数据，避免手动内存管理。但在与 MFC/WinAPI 深度集成的场景中，指针转型仍是最轻量的方案。

## 延伸：传递其他复杂类型

同样的技术可以用于任意堆分配类型：

```cpp
// 自定义结构体
struct TaskResult { int code; std::string message; };
auto* result = new TaskResult{200, "OK"};
PostMessage(hWnd, WM_TASK_DONE, 0, reinterpret_cast<LPARAM>(result));

// 接收方
auto* r = reinterpret_cast<TaskResult*>(lParam);
// ... 使用
delete r;
```

原理完全相同。关键是在代码中明确标注所有权归属，避免双重释放或内存泄漏。', '2023-05-26', '["C++","Windows","WinAPI"]', 1);
INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES ('win-startup-registry', 'C++ 实现程序开机自启动：注册表方式详解', '通过操作 Windows 注册表 Run 键实现程序开机自启动，包括 HKCU 与 HKLM 区别、完整封装代码、工作目录问题和 UAC 权限处理。', 'Windows 程序实现开机自启动有多种方式：任务计划程序、服务、启动文件夹，以及最常见的**注册表 Run 键**。注册表方式简单可靠，不需要管理员权限（HKCU 路径），是桌面程序自启动的首选方案。

---

## 注册表路径说明

Windows 有两个常用的自启动注册表路径：

### HKEY_CURRENT_USER（HKCU）

```
HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

- 仅对**当前用户**生效
- **不需要管理员权限**（普通用户可读写）
- 推荐用于普通桌面程序

### HKEY_LOCAL_MACHINE（HKLM）

```
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

- 对**所有用户**生效
- **需要管理员权限**（UAC 提权）
- 适用于系统级服务或需要全局自启的程序

一般来说，优先选 HKCU，除非明确需要所有用户都自启动。

---

## 完整封装代码

```cpp
#include <windows.h>
#include <tchar.h>
#include <string>

/**
 * 设置或取消程序开机自启动
 *
 * @param enable   true 表示启用自启，false 表示取消
 * @param appName  注册表键值名称（建议用程序名，唯一标识）
 * @param exePath  程序完整路径（留空时自动获取当前 exe 路径）
 * @return         操作是否成功
 */
bool SetAutoStart(bool enable, const TCHAR* appName, const TCHAR* exePath = nullptr) {
    const TCHAR* regPath = 
        _T("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run");
    
    HKEY hKey = nullptr;
    LONG result = RegOpenKeyEx(
        HKEY_CURRENT_USER,  // 改为 HKEY_LOCAL_MACHINE 则全局生效（需管理员）
        regPath,
        0,
        KEY_SET_VALUE,
        &hKey
    );
    
    if (result != ERROR_SUCCESS) {
        return false;
    }
    
    if (enable) {
        // 获取当前 exe 路径（如果未指定）
        TCHAR selfPath[MAX_PATH] = {0};
        if (exePath == nullptr) {
            GetModuleFileName(NULL, selfPath, MAX_PATH);
            exePath = selfPath;
        }
        
        // 写入注册表：值名称 = 程序路径
        result = RegSetValueEx(
            hKey,
            appName,
            0,
            REG_SZ,
            reinterpret_cast<const BYTE*>(exePath),
            static_cast<DWORD>((_tcslen(exePath) + 1) * sizeof(TCHAR))
        );
    } else {
        // 删除注册表值（取消自启）
        result = RegDeleteValue(hKey, appName);
        // ERROR_FILE_NOT_FOUND 表示本来就没有，也算成功
        if (result == ERROR_FILE_NOT_FOUND) {
            result = ERROR_SUCCESS;
        }
    }
    
    RegCloseKey(hKey);
    return result == ERROR_SUCCESS;
}

/**
 * 查询程序是否已设置自启动
 */
bool IsAutoStartEnabled(const TCHAR* appName) {
    const TCHAR* regPath = 
        _T("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run");
    
    HKEY hKey = nullptr;
    LONG result = RegOpenKeyEx(
        HKEY_CURRENT_USER,
        regPath,
        0,
        KEY_QUERY_VALUE,
        &hKey
    );
    
    if (result != ERROR_SUCCESS) return false;
    
    result = RegQueryValueEx(hKey, appName, nullptr, nullptr, nullptr, nullptr);
    RegCloseKey(hKey);
    
    return result == ERROR_SUCCESS;
}
```

### 使用示例

```cpp
int main() {
    const TCHAR* APP_NAME = _T("MyApp");
    
    // 启用自启动
    if (SetAutoStart(true, APP_NAME)) {
        MessageBox(NULL, _T("已设置开机自启动"), _T("提示"), MB_OK);
    }
    
    // 检查状态
    if (IsAutoStartEnabled(APP_NAME)) {
        // UI 上勾选"开机启动"复选框
    }
    
    // 取消自启动
    SetAutoStart(false, APP_NAME);
    
    return 0;
}
```

---

## 工作目录问题：必读！

自启动的程序由系统（`explorer.exe`）启动，**工作目录（CWD）不是 exe 所在目录**，通常是 `C:\Windows\System32`。

这会导致程序用相对路径读取配置文件、日志、资源时失败：

```cpp
// 这行代码在自启场景下会失败！
FILE* f = fopen("config.ini", "r"); // 实际查找 C:\Windows\System32\config.ini
```

### 解决方案：启动时主动设置工作目录

在程序入口（`WinMain` 或 `main`）的**第一行**加上：

```cpp
#include <windows.h>
#include <string>

void FixWorkingDirectory() {
    // 获取 exe 完整路径
    TCHAR exePath[MAX_PATH] = {0};
    GetModuleFileName(NULL, exePath, MAX_PATH);
    
    // 提取目录部分（去掉文件名）
    std::wstring dir(exePath);
    size_t pos = dir.find_last_of(L"\\/");
    if (pos != std::wstring::npos) {
        dir = dir.substr(0, pos);
    }
    
    // 设置工作目录
    SetCurrentDirectory(dir.c_str());
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int nCmdShow) {
    FixWorkingDirectory(); // 第一件事！
    
    // 现在相对路径就以 exe 目录为基准了
    // ...
}
```

这个问题**非常容易被忽略**，在开发机上调试时一切正常（因为 IDE 默认把工作目录设为项目目录），但自启后立刻出现各种文件找不到的 bug。

---

## UAC 权限问题

### HKCU 路径（无需提权）

操作 `HKEY_CURRENT_USER` 不需要管理员权限，直接调用即可。绝大多数桌面程序应该用这个路径。

### HKLM 路径（需要管理员权限）

如果你的程序必须使用 `HKEY_LOCAL_MACHINE`，需要确保以管理员身份运行：

**方法一**：在 manifest 中声明需要提权

```xml
<!-- app.manifest -->
<requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
```

这样启动程序时 Windows 会自动弹出 UAC 确认框。

**方法二**：运行时检测并提权重启

```cpp
bool IsRunAsAdmin() {
    BOOL isAdmin = FALSE;
    PSID adminGroup = nullptr;
    SID_IDENTIFIER_AUTHORITY ntAuthority = SECURITY_NT_AUTHORITY;
    
    if (AllocateAndInitializeSid(&ntAuthority, 2,
        SECURITY_BUILTIN_DOMAIN_RID, DOMAIN_ALIAS_RID_ADMINS,
        0, 0, 0, 0, 0, 0, &adminGroup)) {
        CheckTokenMembership(NULL, adminGroup, &isAdmin);
        FreeSid(adminGroup);
    }
    return isAdmin == TRUE;
}

void RelaunchAsAdmin() {
    TCHAR exePath[MAX_PATH];
    GetModuleFileName(NULL, exePath, MAX_PATH);
    
    ShellExecute(NULL, _T("runas"), exePath, NULL, NULL, SW_SHOWNORMAL);
    ExitProcess(0); // 退出当前进程
}
```

---

## 验证效果

设置完成后，可以通过以下方式验证：

1. **注册表编辑器**：`Win+R` → `regedit` → 导航到 `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`，确认键值存在。

2. **任务管理器**：`Ctrl+Shift+Esc` → 启动 → 确认程序出现在列表中（Windows 8+）。

3. **Autoruns 工具**（推荐）：Sysinternals 出品，能清晰显示所有自启项及其状态。

---

## 小结

| 路径 | 作用范围 | 是否需要管理员 |
|------|---------|-------------|
| HKCU\...\Run | 当前用户 | 否 |
| HKLM\...\Run | 所有用户 | 是 |

核心要点：
1. 优先用 HKCU，避免不必要的权限要求
2. **一定要在启动时调用 `SetCurrentDirectory`**，这是最常见的自启 bug 来源
3. 注册表键值名称要唯一，建议用程序名
4. 提供 UI 让用户可以主动开关自启，不要强制静默启用', '2022-12-26', '["windows","cpp","registry"]', 1);
