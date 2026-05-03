import subprocess
import json

def run_cmd(cmd, cwd='/home/void/文档/project/void-blog'):
    r = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'void-blog-posts', '--remote', '--command', cmd],
        cwd=cwd, capture_output=True, text=True
    )
    print("STDOUT:", r.stdout[-500:])
    print("STDERR:", r.stderr[-300:])
    return r.returncode == 0

# ============================================================
# 文章一：anthropics/skills
# ============================================================

article1_content = """# anthropics/skills：Anthropic 官方 Agent Skills 仓库解析

Anthropic 在 GitHub 上维护着一个名为 [anthropics/skills](https://github.com/anthropics/skills) 的仓库，目前已获得 127k stars、14.9k forks。这不是一个普通的工具库，而是一套**让 Claude 具备可扩展能力的标准化规范**。

## 什么是 Agent Skills？

官方给出的定义非常简洁：

> Skills are folders of instructions, scripts, and resources that Claude loads dynamically.

Skills 是文件夹，而不是代码包。里面装的是**指令、脚本和资源**，Claude 在需要的时候动态加载。这个设计理念很重要：不是让 Claude 调用 API，而是让 Claude 读懂"该怎么做"的说明书。

这种设计背后有一个深刻的洞察：LLM 的能力瓶颈不在于不会推理，而在于**不知道当前任务应该遵循什么规范、调用什么工具、按照什么流程走**。Skills 就是填补这个空白的机制。

## 仓库结构

anthropics/skills 仓库分为三个核心部分：

```
anthropics/skills/
├── skills/          # 17 个示例 skill，直接可用
├── spec/            # SKILL.md 格式规范文档
└── template/        # 创建新 skill 的起始模板
```

### skills/ 目录：17 个示例

官方提供了以下 17 个示例 skill，覆盖了从创意设计到工程开发的多个场景：

| Skill | 用途 |
|-------|------|
| `algorithmic-art` | 算法生成艺术作品 |
| `brand-guidelines` | 品牌规范管理 |
| `canvas-design` | Canvas 画布设计 |
| `claude-api` | Claude API 使用指南 |
| `doc-coauthoring` | 文档协作写作 |
| `docx` | Word 文档生成 |
| `frontend-design` | 前端设计规范 |
| `internal-comms` | 内部沟通写作 |
| `mcp-builder` | MCP server 开发 |
| `pdf` | PDF 文件处理 |
| `pptx` | PowerPoint 生成 |
| `skill-creator` | 创建新 skill |
| `slack-gif-creator` | Slack GIF 制作 |
| `theme-factory` | 主题设计工厂 |
| `web-artifacts-builder` | Web 制品构建 |
| `webapp-testing` | Web 应用测试 |
| `xlsx` | Excel 文件处理 |

值得注意的是，许可证方面，大多数 skill 采用 **Apache 2.0** 协议开源，但部分文档类 skill 是 **source-available**（可见但有限制），使用前需要确认。

### spec/ 目录：规范文档

spec 目录定义了 SKILL.md 的标准格式，是整个 skills 生态系统的"宪法"。

### template/ 目录：起始模板

提供了一个最小化的 skill 模板，用于快速创建新 skill。

## SKILL.md 格式详解

每个 skill 的核心是一个 `SKILL.md` 文件。格式如下：

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[具体指令内容]

## Examples

[示例用法]

## Guidelines

[使用规范和限制]
```

### Frontmatter 字段

YAML frontmatter 中 `name` 和 `description` 是**必填字段**：

- **`name`**：skill 的唯一标识符，用于引用和安装
- **`description`**：这是最关键的字段——**它是 agent 决定是否调用这个 skill 的唯一依据**

这里有一个微妙但极其重要的设计：description 不是给人看的文档，而是给 Claude 看的**调用判断依据**。当 Claude 面对一个任务时，它会扫描所有已安装 skill 的 description，根据语义匹配决定是否加载某个 skill。

这意味着一个好的 description 需要：
1. 准确描述 skill 能做什么
2. 清晰说明在什么情况下应该使用
3. 也可以说明什么情况下**不**应该使用（negative examples）

### 正文部分

SKILL.md 的正文是给 Claude 的操作指令，通常包含：
- **核心能力说明**：这个 skill 能做什么
- **工作流程**：步骤化的操作指南
- **示例**：具体的输入输出示例
- **约束条件**：禁止事项和边界情况

## 三个精选 Skill 解析

### 1. webapp-testing：决策树驱动的测试自动化

`webapp-testing` skill 教 Claude 使用 Playwright 进行 Web 应用自动化测试。它的设计亮点是**决策树结构**：

```
收到测试任务
├── 有测试框架？
│   ├── 是 → 集成到现有框架
│   └── 否 → 初始化 Playwright
├── 有 spec 文件？
│   ├── 是 → 读懂再写
│   └── 否 → 从零创建
└── 运行后失败？
    ├── selector 问题 → 用 locator 策略
    └── 异步问题 → 加 waitFor
```

这种决策树设计让 Claude 面对任意测试场景时都有清晰的行动路径，而不是"随机应变"。

### 2. mcp-builder：MCP Server 开发完整指南

`mcp-builder` skill 是构建 [Model Context Protocol](https://modelcontextprotocol.io) server 的详细指南。它涵盖：

- MCP 协议基础（Tools、Resources、Prompts 三种能力）
- TypeScript SDK 使用方式
- 标准 server 结构模板
- 常见工具类型的实现模式（文件操作、API 调用、数据库查询）
- 调试和测试方法

这个 skill 本身就是一个"教 Claude 教别人"的设计——它让 Claude 具备了指导开发者构建 MCP 服务的能力。

### 3. skill-creator：用 skill 创建 skill

`skill-creator` 是 anthropics/skills 中最元级别的 skill——它教 Claude 如何**创建新的 skill**。

它包含：
- SKILL.md 格式规范的详细说明
- 好的 description 怎么写（以及常见错误）
- 指令编写的最佳实践
- skill 的测试方法

这种递归设计体现了 Anthropic 的一个思路：让 skill 系统能够自我增殖和完善。

## 三种使用方式

### 方式一：Claude Code Plugin（推荐）

如果你在使用 Claude Code（即 claude.ai 的代码模式），可以通过插件市场安装：

```bash
# 添加 anthropics/skills 作为插件源
/plugin marketplace add anthropics/skills

# 安装示例 skill 集合
/plugin install example-skills@anthropic-agent-skills
```

安装后，Claude Code 会自动感知这些 skill，并在相关任务时动态加载。

### 方式二：Claude.ai 界面

Claude.ai 已经对付费用户开放了自定义 skill 功能。你可以：
1. 在 Claude.ai 的设置中找到"Skills"选项
2. 上传你的 SKILL.md 文件
3. Claude 在对话中会自动检测并使用已安装的 skill

### 方式三：API 集成

通过 Anthropic 的 Skills API，可以在自己的应用中集成 skill：

```python
# Skills API Quickstart 示例
import anthropic

client = anthropic.Anthropic()

# 在 system prompt 中注入 skill 内容
with open('skills/webapp-testing/SKILL.md', 'r') as f:
    skill_content = f.read()

response = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=4096,
    system=f"You have access to the following skill:\\n\\n{skill_content}",
    messages=[{"role": "user", "content": "请帮我写一个登录页面的 E2E 测试"}]
)
```

## 设计洞察

### 1. Description 是 agent 的感知器官

整个 skill 系统中最核心的设计决策是：**description 是 agent 选择 skill 的唯一依据**。

这不是偶然的设计，而是深思熟虑的架构选择：
- 它迫使 skill 作者写出精准的语义描述
- 它让 Claude 的 skill 选择过程透明可预测
- 它与 RAG 系统的"检索"逻辑一脉相承

### 2. 黑盒调用脚本

skills 中包含的脚本（Python、Shell 等）是**黑盒调用**的。Claude 不会去读懂脚本的实现细节，它只需要知道"在什么情况下调用这个脚本，传什么参数，期望什么输出"。

这是一个重要的设计原则：**把执行逻辑下沉到脚本，把决策逻辑留给 LLM**。

### 3. 明确的禁止事项

优秀的 skill 不只告诉 Claude 能做什么，还明确说明**不能做什么**。比如 `webapp-testing` 中会说明：
- 不要修改被测试的应用代码
- 不要在没有确认的情况下删除测试文件
- 不要假设测试环境的状态

这种负向约束对 LLM 尤其重要——因为 LLM 天然倾向于"尽力完成任务"，有时候会越权操作。

## 如何写一个好的 Skill

基于 anthropics/skills 的设计模式，总结几条写好 skill 的原则：

**1. Description 第一**
description 写好了，skill 成功了一半。要能在 2-3 句话内说清楚：这个 skill 做什么、什么时候用、不适合用在哪里。

**2. 流程要有分支**
真实任务不是线性的。好的 skill 用决策树覆盖各种情况，而不是假设只有"happy path"。

**3. 具体胜于抽象**
"用合适的方式处理文件"不如"用 Python pathlib 读取文件，encoding 用 utf-8"。LLM 面对具体指令时表现更稳定。

**4. 约束要明确**
告诉 Claude 什么不能做，和告诉它什么能做同样重要。

**5. 用示例说话**
一个好的 input/output 示例，胜过三段解释文字。

---

anthropics/skills 仓库的意义不只在于提供了 17 个现成工具，更在于它定义了一套**可复用、可分发的 agent 能力规范**。随着 Skills 生态的发展，我们可能会看到一个类似 npm 的 skill 市场——任何人都可以发布自己的 skill，任何 Claude 都可以安装使用。

这是 AI 能力模块化的开始。"""

article2_content = """# Karpathy 的 LLM 编码批评与 CLAUDE.md 最佳实践

Andrej Karpathy 在 X（前 Twitter）上的一条帖子，催生了一个 107k stars 的 GitHub 仓库。

[forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) 由 Jiayuan（forrestchang，同时是 Multica 项目作者）创建，将 Karpathy 对 AI 编程工具的犀利批评提炼成了四条 CLAUDE.md 规则。这个仓库的核心问题是：**为什么现在的 AI 编程助手总是让人抓狂？怎么修？**

## Karpathy 为什么批评现在的 AI 编程工具

Karpathy 不是在无脑批评，他本人就是 AI 领域最顶尖的工程师之一，曾在 OpenAI 担任研究科学家，也是特斯拉 Autopilot 的前负责人。他的批评来自真实的使用体验，每一条都戳在痛点上。

他的原始帖子（@karpathy，推文 ID：2015883857489522876）中写道：

> "The models make wrong assumptions on your behalf and just run along with them without checking. They don't manage their confusion, don't seek clarifications, don't surface inconsistencies, don't present tradeoffs, don't push back when they should."

翻译过来是：模型会替你做错误的假设，然后一路往下跑，也不检查。它们不管理自己的困惑，不主动寻求澄清，不指出矛盾，不呈现权衡，不在该抵抗的时候抵抗。

这句话精准描述了我们都遇到过的场景：你给了一个模糊的需求，AI 没问你就开始写代码，写了一大堆，但方向错了。

## 四个典型问题

Karpathy 归纳了 AI 编程助手的几个核心问题：

### 问题一：乱猜假设，不求确认

> "The models make wrong assumptions on your behalf and just run along with them without checking."

LLM 非常擅长"看起来在执行任务"。当需求不清晰时，它不会停下来问，而是选择一个看起来合理的解释，然后全速运行。这种"自信执行"的风格在需求明确时是优点，在需求模糊时是灾难。

### 问题二：过度设计，代码膨胀

> "They really like to overcomplicate code and APIs, bloat abstractions, don't clean up dead code... implement a bloated construction over 1000 lines when 100 would do."

AI 有一种奇怪的本能：把简单的事情做复杂。100 行能解决的问题，它可能给你写 1000 行，附带一堆你没要求的抽象层、工厂模式、策略模式。这不是能力的体现，是认知过载的副产品——LLM 见过太多"企业级代码"，把复杂度当作质量的代理指标。

### 问题三：误伤无关代码

> "They still sometimes change/remove comments and code they don't sufficiently understand as side effects, even if orthogonal to the task."

这是最让开发者头疼的问题之一。你叫 AI 修一个 bug，它顺手删了几行注释、改了几个变量名，理由是"优化了可读性"。在代码库中这是极其危险的行为——你不知道哪些看起来无关的改动会引发连锁反应。

### 问题四：目标不清，循环失控

Karpathy 也看到了 LLM 的潜力所在：

> "LLMs are exceptionally good at looping until they meet specific goals... Don't tell it what to do, give it success criteria and watch it go."

LLM 特别擅长"为了达成目标反复迭代"。但如果你给的是模糊的操作指令而不是清晰的成功标准，这个循环能力反而会变成失控的来源。

## CLAUDE.md 四条原则逐一解析

forrestchang 将 Karpathy 的观察提炼为四条可操作的规则，写进了一个 `CLAUDE.md` 文件。

### 原则一：Think Before Coding（先想后写）

**对应问题**：乱猜假设，不求确认

**核心内容**：
- 在写代码之前，显式声明你对任务的理解和假设
- 如果存在歧义，**主动问清楚**，不要自己脑补
- 列出多个可能的实现方案及其权衡，再决定用哪个

这条规则改变了 LLM 的默认行为模式——从"接到任务立刻执行"变成"先理解，再执行"。

实际上，这也是好的软件工程师的习惯：在键盘上敲第一行代码之前，先在脑子里（或者白板上）把问题想清楚。

**效果**：让 AI 暴露它的假设，你可以在它走错之前纠正。

### 原则二：Simplicity First（简单优先）

**对应问题**：过度设计，代码膨胀

**核心内容**：
- 写最简单的能解决问题的代码
- 不要实现没有被明确要求的功能
- 不要添加未被要求的抽象层
- 不要"顺手"重构

这条规则直接对抗 LLM 的"复杂化冲动"。它的哲学来源是 YAGNI（You Aren't Gonna Need It）和 UNIX 哲学：每个模块只做一件事，做好这一件事。

**效果**：得到更短、更直接的代码，更容易 review，更容易维护。

### 原则三：Surgical Changes（外科手术式修改）

**对应问题**：误伤无关代码

**核心内容**：
- 只修改任务直接要求修改的代码
- 不要"顺便"修改看起来不相关的东西
- 不要删除你没有完全理解的注释或代码
- 如果发现了其他需要修改的地方，报告出来，不要自行修改

"外科手术式"这个比喻很精准：外科医生做手术，只处理目标部位，绝对不会因为"发现旁边有个不好看的地方"就顺手切掉。

**效果**：代码库的意外变动大幅减少，diff 更干净，review 更容易。

### 原则四：Goal-Driven Execution（目标驱动执行）

**对应问题**：目标不清，循环失控（以及正向利用 LLM 的循环能力）

**核心内容**：
- 把任务转化为**可验证的成功标准**
- 给 LLM 目标，而不是步骤
- 让它自主决定如何达成目标
- 通过测试用例、断言、具体的输出格式来定义"完成"

这条规则是四条中最反直觉的，也是最有力量的。

Karpathy 说得很清楚："Don't tell it what to do, give it success criteria and watch it go."（不要告诉它做什么，给它成功标准，然后看它运行。）

比较两种指令方式：

**指令式（不推荐）**：
> "先读取 users 表，然后过滤出 active=true 的用户，然后按 created_at 排序，然后取前 10 条，然后格式化成 JSON..."

**目标式（推荐）**：
> "返回最近注册的 10 个活跃用户，格式为 JSON 数组，每个元素包含 id、name、email 字段。用 pytest 测试：给定测试数据库有 20 个用户（15 活跃），函数应返回长度为 10 的数组，且所有元素的 active 字段为 true。"

第二种方式利用了 LLM 的循环能力：它会不断尝试，直到写出通过测试的代码。

**效果**：释放 LLM 的 agent 能力，同时用可验证的目标约束其行为。

## 如何安装和使用

### 方式一：Claude Code Plugin

```bash
/plugin marketplace add forrestchang/andrej-karpathy-skills
```

安装后，这些规则会自动注入到 Claude Code 的系统 prompt 中。

### 方式二：单项目 CLAUDE.md

在项目根目录添加 `CLAUDE.md` 文件：

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
```

Claude Code 会自动读取项目根目录的 `CLAUDE.md`，将其内容作为额外的系统指令。

### 方式三：Cursor 规则文件

对于 Cursor 用户：

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/karpathy-guidelines.mdc https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
```

Cursor 的 `.mdc` 规则文件和 CLAUDE.md 在功能上是等价的——都是"给 AI 看的行为约束文件"。

## 和 anthropics/skills 的关系

理解这两个仓库的关系，有助于更清晰地认识"给 Claude 的指令文件"这个生态：

| | anthropics/skills | forrestchang/andrej-karpathy-skills |
|--|--|--|
| **目标** | 能力增强 | 行为约束 |
| **内容** | 教 Claude 怎么做特定任务 | 规范 Claude 的编码行为模式 |
| **类比** | 技能培训课程 | 职业道德准则 |
| **适用范围** | 特定任务场景 | 所有编码任务 |

两者都是"给 Claude 的指令文件"，但层次不同：
- anthropics/skills 是**领域知识**：我要做 Web 测试，加载 `webapp-testing` skill
- karpathy-skills 是**行为规范**：我在做任何编码任务，都应该遵守这四条原则

两者可以叠加使用，互不冲突。

## 为什么"给成功标准"比"给指令"更有效

Goal-Driven Execution 是这套规则中最值得深入思考的部分。

**指令式指导的问题**在于：它要求人类提前想好所有细节，然后把思维过程翻译成 AI 能理解的步骤序列。这既耗时，又容易出错——你的步骤描述一旦有歧义，AI 会按照它自己的理解执行，而不是你的意图。

**目标式指导的优势**在于：
1. **降低认知负担**：你只需要想清楚"什么算完成"，不需要想清楚"怎么完成"
2. **利用 LLM 的规划能力**：LLM 其实很擅长把目标分解成步骤，这是它的强项
3. **可验证性**：成功标准是客观的，测试要么通过要么不通过，没有"差不多完成"

这和 OKR 的思路很像：定义关键结果（Key Results），而不是指定行动步骤（Action Items）。

## 踩坑提醒

这套规则非常有用，但有几个需要注意的地方：

**1. 偏保守，简单任务不必全套用**

"Think Before Coding"要求 AI 先列出假设和方案，对于简单任务会显得冗余。如果你只是要它写一个格式化日期的工具函数，直接要结果更高效。

**2. "Surgical Changes"可能让 AI 错过明显问题**

有时候你叫 AI 修 bug，顺路发现了一个明显的代码质量问题，但"Surgical Changes"原则会让它保持沉默。解决办法是：在任务描述中加一句"如果你发现其他潜在问题，请报告但不要自行修改"。

**3. 目标式指导需要你能描述"成功"**

Goal-Driven Execution 的前提是你知道什么是成功。如果你自己也不确定想要什么结果（探索性任务），这条原则就不太适用。

**4. 不同工具的支持程度不同**

这套规则最适合 Claude Code，因为 Claude Code 原生支持 `CLAUDE.md`。在 ChatGPT、Gemini 等工具中使用，需要手动复制粘贴规则内容到 system prompt。

---

Karpathy 的批评和 forrestchang 的 CLAUDE.md 提醒我们：**工具的能力和工具的行为是两回事**。LLM 已经具备了强大的编码能力，但如果没有正确的行为约束，这个能力就像一辆没有方向盘的赛车——跑得很快，但不知道会撞到哪里。

四条原则的本质是：**把 AI 从"急于完成任务的执行者"变成"谨慎推理的协作者"**。这不是限制 AI 的能力，而是让能力发挥在正确的方向上。"""

# Insert article 1
slug1 = "anthropics-skills-guide"
title1 = "anthropics/skills：Anthropic 官方 Agent Skills 仓库解析"
desc1 = "Anthropic 官方开源的 Agent Skills 标准仓库，127k stars，解析 SKILL.md 规范、17 个示例 skill 的设计模式，以及如何在 Claude Code / Claude.ai / API 中使用"
tags1 = '["AI", "Claude", "agent", "skills"]'

safe1 = article1_content.replace("'", "''")
cmd1 = f"INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft, updated_at) VALUES ('{slug1}', '{title1}', '{desc1}', '{safe1}', '2026-05-03', '{tags1}', 0, datetime('now'))"

print("=== Inserting Article 1 ===")
print(f"Content length: {len(article1_content)} chars")
success1 = run_cmd(cmd1)
print(f"Success: {success1}")

# Insert article 2
slug2 = "karpathy-claude-code-guidelines"
title2 = "Karpathy 的 LLM 编码批评与 CLAUDE.md 最佳实践"
desc2 = "基于 Andrej Karpathy 对 LLM 编程助手的观察，forrestchang 提炼出一个 CLAUDE.md 文件，4 条原则解决 AI 编码的典型失控问题：乱猜假设、过度设计、乱改代码、目标不清"
tags2 = '["AI", "Claude", "Claude Code", "工程实践"]'

safe2 = article2_content.replace("'", "''")
cmd2 = f"INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft, updated_at) VALUES ('{slug2}', '{title2}', '{desc2}', '{safe2}', '2026-05-03', '{tags2}', 0, datetime('now'))"

print("\n=== Inserting Article 2 ===")
print(f"Content length: {len(article2_content)} chars")
success2 = run_cmd(cmd2)
print(f"Success: {success2}")

# Verify
print("\n=== Verifying ===")
run_cmd(f"SELECT slug, title, length(content) as content_len FROM posts WHERE slug IN ('{slug1}', '{slug2}')")
