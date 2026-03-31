---
name: configure-ecc
description: Everything Claude Code 的交互式安装程序——引导用户选择并安装skill和规则到用户级或项目级目录，验证路径，并可选地优化已安装的文件。
origin: nothing-claude-code
---

# 配置 Everything Claude Code（ECC）

Everything Claude Code 项目的交互式分步安装向导。使用 `AskUserQuestion` 引导用户选择性地安装skill和规则，然后验证正确性并提供优化选项。

## 何时激活

- 用户说 "configure ecc"、"install ecc"、"setup everything claude code" 或类似的话
- 用户想要从这个项目选择性地安装skill或规则
- 用户想要验证或修复现有的 ECC 安装
- 用户想要优化已安装的skill或规则以适应他们的项目

## 前置条件

此skill必须在激活前对 Claude Code 可用。有两种引导方式：
1. **通过插件**：`/plugin install everything-claude-code` — 插件会自动加载此skill
2. **手动**：将此skill复制到 `~/.claude/skills/configure-ecc/SKILL.md`，然后通过说 "configure ecc" 来激活

---

## 步骤 0：克隆 ECC 仓库

在任何安装之前，将最新的 ECC 源码克隆到 `/tmp`：

```bash
rm -rf /tmp/everything-claude-code
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/everything-claude-code
```

设置 `ECC_ROOT=/tmp/everything-claude-code` 作为所有后续复制操作的源。

如果克隆失败（网络问题等），使用 `AskUserQuestion` 询问用户提供现有 ECC 克隆的本地路径。

---

## 步骤 1：选择安装级别

使用 `AskUserQuestion` 询问用户安装位置：

```
Question: "ECC 组件应该安装到哪里？"
Options:
  - "用户级（~/.claude/）" — "适用于您所有的 Claude Code 项目"
  - "项目级（.claude/）" — "仅适用于当前项目"
  - "两者都安装" — "通用/共享项目用户级，项目特定项目项目级"
```

将选择存储为 `INSTALL_LEVEL`。设置目标目录：
- 用户级：`TARGET=~/.claude`
- 项目级：`TARGET=.claude`（相对于当前项目根目录）
- 两者都安装：`TARGET_USER=~/.claude`，`TARGET_PROJECT=.claude`

如果目标目录不存在则创建：
```bash
mkdir -p $TARGET/skills $TARGET/rules
```

---

## 步骤 2：选择并安装skill

### 2a：选择范围（核心 vs 小众）

默认为**核心（推荐给新用户）**——复制 `.agents/skills/*` 加上 `skills/search-first/` 用于研究优先的workflow。此捆绑包涵盖工程、评估、验证、安全、战略压缩、前端设计，以及 Anthropic 跨职能skill（article-writing、content-engine、market-research、frontend-slides）。

使用 `AskUserQuestion`（单选）：
```
Question: "仅安装核心skill，还是包含小众/框架包？"
Options:
  - "仅核心（推荐）" — "tdd、e2e、evals、verification、research-first、security、frontend patterns、compacting、跨职能 Anthropic skill"
  - "核心 + 选定的小众" — "在核心之后添加框架/领域特定skill"
  - "仅小众" — "跳过核心，安装特定框架/领域skill"
Default: 仅核心
```

如果用户选择小众或核心 + 小众，继续下面的类别选择，并且只包含他们选择的小众skill。

### 2b：选择skill类别

以下是 7 个可选的类别组。随后的详细确认列表涵盖 8 个类别中的 45 个skill，外加 1 个独立模板。使用 `AskUserQuestion` 和 `multiSelect: true`：

```
Question: "您想安装哪些skill类别？"
Options:
  - "框架与语言" — "Django、Laravel、Spring Boot、Go、Python、Java、前端、后端模式"
  - "数据库" — "PostgreSQL、ClickHouse、JPA/Hibernate 模式"
  - "workflow与质量" — "TDD、verification、learning、security review、compaction"
  - "研究与 API" — "Deep research、Exa search、Claude API 模式"
  - "社交与内容分发" — "X/Twitter API、content-engine 跨发布"
  - "媒体生成" — "fal.ai image/video/audio 配合 VideoDB"
  - "编排" — "dmux 多agentworkflow"
  - "所有skill" — "安装所有可用的skill"
```

### 2c：确认各个skill

对于每个选定的类别，打印下面的完整skill列表，并让用户确认或取消选择特定skill。如果列表超过 4 项，将列表打印为文本，并使用 `AskUserQuestion` 添加"安装所有列出的"选项和"其他"供用户粘贴特定名称。

**类别：框架与语言（21 个skill）**

| skill | 描述 |
|-------|-------------|
| `backend-patterns` | 后端架构、API 设计、Node.js/Express/Next.js 服务端最佳实践 |
| `coding-standards` | TypeScript、JavaScript、React、Node.js 通用编码标准 |
| `django-patterns` | Django 架构、REST API（DRF）、ORM、缓存、信号、中间件 |
| `django-security` | Django 安全：认证、CSRF、SQL 注入、XSS 防护 |
| `django-tdd` | Django 测试：pytest-django、factory_boy、mocking、coverage |
| `django-verification` | Django 验证循环：迁移、linting、测试、安全扫描 |
| `laravel-patterns` | Laravel 架构模式：路由、控制器、Eloquent、队列、缓存 |
| `laravel-security` | Laravel 安全：认证、策略、CSRF、批量赋值、限流 |
| `laravel-tdd` | Laravel 测试：PHPUnit 和 Pest、工厂、fakes、coverage |
| `laravel-verification` | Laravel 验证：linting、静态分析、测试、安全扫描 |
| `frontend-patterns` | React、Next.js、状态管理、性能、UI 模式 |
| `frontend-slides` | 零依赖 HTML 演示文稿、样式预览、PPTX 转 Web |
| `golang-patterns` | 惯用 Go 模式、健壮 Go 应用程序的约定 |
| `golang-testing` | Go 测试：表驱动测试、子测试、基准测试、模糊测试 |
| `java-coding-standards` | Spring Boot Java 编码标准：命名、不可变性、Optional、streams |
| `python-patterns` | Python 惯用法、PEP 8、类型提示、最佳实践 |
| `python-testing` | Python 测试：pytest、TDD、fixtures、mocking、参数化 |
| `springboot-patterns` | Spring Boot 架构、REST API、分层服务、缓存、异步 |
| `springboot-security` | Spring Security：认证/授权、验证、CSRF、密钥、限流 |
| `springboot-tdd` | Spring Boot TDD：JUnit 5、Mockito、MockMvc、Testcontainers |
| `springboot-verification` | Spring Boot 验证：构建、静态分析、测试、安全扫描 |

**类别：数据库（3 个skill）**

| skill | 描述 |
|-------|-------------|
| `clickhouse-io` | ClickHouse 模式、查询优化、分析、数据工程 |
| `jpa-patterns` | JPA/Hibernate 实体设计、关系、查询优化、事务 |
| `postgres-patterns` | PostgreSQL 查询优化、模式设计、索引、安全 |

**类别：workflow与质量（8 个skill）**

| skill | 描述 |
|-------|-------------|
| `continuous-learning` | 从会话中自动提取可复用模式作为已学skill |
| `continuous-learning-v2` | 基于本能的学习，带置信度评分，可演化为skill/命令/agent |
| `eval-harness` | 评估驱动开发（EDD）的正式评估框架 |
| `iterative-retrieval` | 子agent上下文问题的渐进式上下文优化 |
| `security-review` | 安全清单：认证、输入、密钥、API、支付功能 |
| `strategic-compact` | 在逻辑间隔建议手动上下文压缩 |
| `tdd-workflow` | 强制 TDD，80%+ 覆盖率：单元、集成、E2E |
| `verification-loop` | 验证和质量循环模式 |

**类别：商业与内容（5 个skill）**

| skill | 描述 |
|-------|-------------|
| `article-writing` | 使用笔记、示例或源文档以给定风格进行长篇写作 |
| `content-engine` | 多平台社交内容、脚本和再利用workflow |
| `market-research` | 溯源的市场、竞争对手、基金和技术研究 |
| `investor-materials` | 路演稿、单页资料、投资者备忘录和财务模型 |
| `investor-outreach` | 个性化投资者冷邮件、热情介绍和跟进 |

**类别：研究与 API（3 个skill）**

| skill | 描述 |
|-------|-------------|
| `deep-research` | 使用 firecrawl 和 exa MCP 进行多源深度研究，带引文报告 |
| `exa-search` | 通过 Exa MCP 进行神经网络搜索，用于网络、代码、公司和人员研究 |
| `claude-api` | Anthropic Claude API 模式：消息、流式调用、工具使用、视觉、批次、Agent SDK |

**类别：社交与内容分发（2 个skill）**

| skill | 描述 |
|-------|-------------|
| `x-api` | X/Twitter API 集成：发帖、主题帖、搜索和分析 |
| `crosspost` | 多平台内容分发，带平台原生适配 |

**类别：媒体生成（2 个skill）**

| skill | 描述 |
|-------|-------------|
| `fal-ai-media` | 通过 fal.ai MCP 统一 AI 媒体生成（图像、视频、音频） |
| `video-editing` | AI 辅助视频编辑：剪辑、结构和增强真实 footage |

**类别：编排（1 个skill）**

| skill | 描述 |
|-------|-------------|
| `dmux-workflows` | 使用 dmux 进行多agent编排，用于并行agent会话 |

**独立skill**

| skill | 描述 |
|-------|-------------|
| `project-guidelines-example` | 创建项目特定skill的模板 |

### 2d：执行安装

对于每个选定的skill，复制整个skill目录：
```bash
cp -r $ECC_ROOT/skills/<skill-name> $TARGET/skills/
```

注意：`continuous-learning` 和 `continuous-learning-v2` 有额外的文件（config.json、hooks、scripts）——确保复制整个目录，而不仅仅是 SKILL.md。

---

## 步骤 3：选择并安装规则

使用 `AskUserQuestion` 和 `multiSelect: true`：

```
Question: "您想安装哪些规则集？"
Options:
  - "通用规则（推荐）" — "语言无关原则：编码风格、git workflow、测试、安全等（8 个文件）"
  - "TypeScript/JavaScript" — "TS/JS 模式、hooks、使用 Playwright 测试（5 个文件）"
  - "Python" — "Python 模式、pytest、black/ruff 格式化（5 个文件）"
  - "Go" — "Go 模式、表驱动测试、gofmt/staticcheck（5 个文件）"
```

执行安装：
```bash
# 通用规则（平铺复制到 rules/）
cp -r $ECC_ROOT/rules/common/* $TARGET/rules/

# 语言特定规则（平铺复制到 rules/）
cp -r $ECC_ROOT/rules/typescript/* $TARGET/rules/   # 如果选中
cp -r $ECC_ROOT/rules/python/* $TARGET/rules/        # 如果选中
cp -r $ECC_ROOT/rules/golang/* $TARGET/rules/        # 如果选中
```

**重要**：如果用户选择了任何语言特定规则但没有选择通用规则，请警告他们：
> "语言特定规则扩展了通用规则。没有通用规则可能会导致覆盖不完整。是否也安装通用规则？"

---

## 步骤 4：安装后验证

安装后，执行以下自动检查：

### 4a：验证文件存在

列出所有已安装的文件并确认它们存在于目标位置：
```bash
ls -la $TARGET/skills/
ls -la $TARGET/rules/
```

### 4b：检查路径引用

扫描所有已安装的 `.md` 文件中的路径引用：
```bash
grep -rn "~/.claude/" $TARGET/skills/ $TARGET/rules/
grep -rn "../common/" $TARGET/rules/
grep -rn "skills/" $TARGET/skills/
```

**对于项目级安装**，标记任何对 `~/.claude/` 路径的引用：
- 如果skill引用 `~/.claude/settings.json` — 这通常没问题（设置始终是用户级的）
- 如果skill引用 `~/.claude/skills/` 或 `~/.claude/rules/` — 如果仅在项目级安装可能会出问题
- 如果skill按名称引用另一个skill — 检查被引用的skill也已安装

### 4c：检查skill之间的交叉引用

有些skill会引用其他skill。验证这些依赖关系：
- `django-tdd` 可能引用 `django-patterns`
- `laravel-tdd` 可能引用 `laravel-patterns`
- `springboot-tdd` 可能引用 `springboot-patterns`
- `continuous-learning-v2` 引用 `~/.claude/homunculus/` 目录
- `python-testing` 可能引用 `python-patterns`
- `golang-testing` 可能引用 `golang-patterns`
- `crosspost` 引用 `content-engine` 和 `x-api`
- `deep-research` 引用 `exa-search`（互补的 MCP 工具）
- `fal-ai-media` 引用 `videodb`（互补的媒体skill）
- `x-api` 引用 `content-engine` 和 `crosspost`
- 语言特定规则引用 `common/` 对应物

### 4d：报告问题

对于发现的每个问题，报告：
1. **文件**：包含问题引用的文件
2. **行号**：行号
3. **问题**：出了什么问题（例如，"引用了 ~/.claude/skills/python-patterns 但 python-patterns 未安装"）
4. **建议修复**：该怎么做（例如，"安装 python-patterns skill"或"更新路径到 .claude/skills/"）

---

## 步骤 5：优化已安装的文件（可选）

使用 `AskUserQuestion`：

```
Question: "您想优化已安装的文件以适应您的项目吗？"
Options:
  - "优化skill" — "删除无关部分、调整路径、定制技术栈"
  - "优化规则" — "调整覆盖目标、添加项目特定模式、自定义工具配置"
  - "两者都优化" — "全面优化所有已安装的文件"
  - "跳过" — "保持原样"
```

### 如果优化skill：
1. 读取每个已安装的 SKILL.md
2. 询问用户他们项目的技术栈是什么（如果尚不知道）
3. 对于每个skill，建议删除无关部分
4. 在安装目标（而不是源仓库）原地编辑 SKILL.md 文件
5. 修复步骤 4 中发现的任何路径问题

### 如果优化规则：
1. 读取每个已安装的规则 .md 文件
2. 询问用户的偏好：
   - 测试覆盖率目标（默认 80%）
   - 首选格式化工具
   - Git workflow约定
   - 安全要求
3. 在安装目标原地编辑规则文件

**关键**：仅修改安装目标中的文件（`$TARGET/`），永远不要修改源 ECC 仓库中的文件（`$ECC_ROOT/`）。

---

## 步骤 6：安装摘要

清理 `/tmp` 中的克隆仓库：

```bash
rm -rf /tmp/everything-claude-code
```

然后打印摘要报告：

```
## ECC 安装完成

### 安装目标
- 级别：[用户级 / 项目级 / 两者]
- 路径：[目标路径]

### 已安装的skill（[数量]）
- skill-1, skill-2, skill-3, ...

### 已安装的规则（[数量]）
- common（8 个文件）
- typescript（5 个文件）
- ...

### 验证结果
- 发现 [数量] 个问题，修复了 [数量] 个
- [列出任何剩余问题]

### 已应用的优化
- [列出所做的更改，或"无"]
```

---

## 故障排除

### "skill未被 Claude Code 拾取"
- 验证skill目录包含 `SKILL.md` 文件（而不仅仅是松散的 .md 文件）
- 对于用户级：检查 `~/.claude/skills/<skill-name>/SKILL.md` 是否存在
- 对于项目级：检查 `.claude/skills/<skill-name>/SKILL.md` 是否存在

### "规则不工作"
- 规则是平铺文件，不在子目录中：`$TARGET/rules/coding-style.md`（正确）vs `$TARGET/rules/common/coding-style.md`（平铺安装时错误）
- 安装规则后重启 Claude Code

### "项目级安装后的路径引用错误"
- 有些skill假设 `~/.claude/` 路径。运行步骤 4 验证以查找并修复这些问题。
- 对于 `continuous-learning-v2`，`~/.claude/homunculus/` 目录始终是用户级的——这是预期的，不是错误。
