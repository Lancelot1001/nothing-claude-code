---
name: search-first
description: 先研究后编码的workflow process。在编写自定义代码之前，先搜索现有工具、库和模式。调用研究agent。
origin: something-claude-code
---

# /search-first — 先研究再编码

系统化"在实施前先搜索现有解决方案"的workflow process。

## 触发

在以下情况下使用此skill：
- 开始一个可能有现有解决方案的新功能
- 添加依赖或集成
- 用户要求"添加 X 功能"，而你正要写代码
- 在创建新的工具、辅助函数或抽象之前

## workflow process

```
┌─────────────────────────────────────────────┐
│  1. 需求分析                                │
│     定义需要什么功能                           │
│     识别语言/框架约束                         │
├─────────────────────────────────────────────┤
│  2. 并行搜索（研究agent）                       │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│     │  npm /   │ │  MCP /   │ │  GitHub / │  │
│     │  PyPI    │ │  Skills  │ │  Web      │  │
│     └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────┤
│  3. 评估                                      │
│     对候选方案评分（功能性、维护、               │
│     社区、文档、许可证、依赖）                  │
├─────────────────────────────────────────────┤
│  4. 决策                                      │
│     ┌─────────┐  ┌──────────┐  ┌─────────┐  │
│     │  采用    │  │  扩展     │  │  构建   │  │
│     │ as-is   │  │  /包装    │  │  自定义  │  │
│     └─────────┘  └──────────┘  └─────────┘  │
├─────────────────────────────────────────────┤
│  5. 实施                                      │
│     安装包 / 配置 MCP /                        │
│     编写最少的自定义代码                        │
└─────────────────────────────────────────────┘
```

## 决策矩阵

| 信号 | 行动 |
|--------|--------|
| 完全匹配，维护良好，MIT/Apache | **采用** — 直接安装和使用 |
| 部分匹配，良好基础 | **扩展** — 安装 + 编写薄包装器 |
| 多个弱匹配 | **组合** — 组合 2-3 个小包 |
| 没找到合适的 | **构建** — 写自定义，但基于研究 |

## 如何使用

### 快速模式（内联）

在编写工具或添加功能之前， mentally 运行：

0. 仓库中已存在吗？→ 先 `rg` 相关模块/测试
1. 这是常见问题吗？→ 搜索 npm/PyPI
2. 有提供此功能的 MCP 吗？→ 检查 `~/.claude/settings.json` 和搜索
3. 有提供此功能的skill吗？→ 检查 `~/.claude/skills/`
4. 有 GitHub 实现/模板吗？→ 在写新代码之前运行 GitHub 代码搜索以查找维护良好的 OSS

### 完整模式（agent）

对于非平凡的功能，启动研究agent：

```
Task(subagent_type="general-purpose", prompt="
  Research existing tools for: [DESCRIPTION]
  Language/framework: [LANG]
  Constraints: [ANY]

  Search: npm/PyPI, MCP servers, Claude Code skills, GitHub
  Return: Structured comparison with recommendation
")
```

## 按类别的搜索快捷方式

### 开发工具
- Linting → `eslint`, `ruff`, `textlint`, `markdownlint`
- 格式化 → `prettier`, `black`, `gofmt`
- 测试 → `jest`, `pytest`, `go test`
- Pre-commit → `husky`, `lint-staged`, `pre-commit`

### AI/LLM 集成
- Claude SDK → Context7 获取最新文档
- 提示管理 → 检查 MCP 服务器
- 文档处理 → `unstructured`, `pdfplumber`, `mammoth`

### 数据与 API
- HTTP 客户端 → `httpx` (Python), `ky`/`got` (Node)
- 验证 → `zod` (TS), `pydantic` (Python)
- 数据库 → 先检查 MCP 服务器

### 内容与发布
- Markdown 处理 → `remark`, `unified`, `markdown-it`
- 图片优化 → `sharp`, `imagemin`

## 集成点

### 与规划agent
规划agent应在阶段 1（架构评审）之前调用研究者：
- 研究者识别可用工具
- 规划者将其纳入实施计划
- 避免计划中"重新发明轮子"

### 与架构agent
架构agent应为以下内容咨询研究者：
- 技术栈决策
- 集成模式发现
- 现有参考架构

### 与迭代检索skill
结合进行渐进式发现：
- 循环 1：广泛搜索（npm、PyPI、MCP）
- 循环 2：详细评估顶级候选
- 循环 3：测试与项目约束的兼容性

## 示例

### 示例 1："添加死链接检查"
```
需求：检查 markdown 文件中的断链
搜索：npm "markdown dead link checker"
发现：textlint-rule-no-dead-link（评分：9/10）
行动：采用 — npm install textlint-rule-no-dead-link
结果：零自定义代码，经过实战验证的解决方案
```

### 示例 2："添加 HTTP 客户端包装器"
```
需求：带重试和超时处理的有弹性 HTTP 客户端
搜索：npm "http client retry", PyPI "httpx retry"
发现：got (Node) 带重试插件，httpx (Python) 内置重试
行动：采用 — 直接使用 got/httpx 配置重试
结果：零自定义代码，生产验证库
```

### 示例 3："添加配置文件 linter"
```
需求：根据模式验证项目配置文件
搜索：npm "config linter schema", "json schema validator cli"
发现：ajv-cli（评分：8/10）
行动：采用 + 扩展 — 安装 ajv-cli，编写项目特定模式
结果：1 个包 + 1 个模式文件，无自定义验证逻辑
```

## 反模式

- **直接写代码**：不检查是否存在就编写工具
- **忽略 MCP**：不检查 MCP 服务器是否已提供该能力
- **过度定制**：如此沉重地包装库使其失去优势
- **依赖膨胀**：为一个小功能安装一个大包
