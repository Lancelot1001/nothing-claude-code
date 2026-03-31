# 为 Everything Claude Code 贡献

感谢您的贡献！本仓库是 Claude Code 用户的社区资源。

## 目录

- [我们需要什么](#我们需要什么)
- [快速开始](#快速开始)
- [贡献 Skills](#贡献-skills)
- [贡献 Agents](#贡献-agents)
- [贡献 Hooks](#贡献-hooks)
- [贡献 Commands](#贡献-commands)
- [MCP 和文档（如 Context7）](#mcp-和文档如-context7)
- [跨 Harness 和翻译](#跨-harness-和翻译)
- [Pull Request 流程](#pull-request-流程)

---

## 我们需要什么

### Agents
处理特定任务良好的新 agent：
- 语言特定审查器（Python、Go、Rust）
- 框架专家（Django、Rails、Laravel、Spring）
- DevOps 专家（Kubernetes、Terraform、CI/CD）
- 领域专家（ML pipelines、数据工程、移动端）

### Skills
workflow 定义和领域知识：
- 语言最佳实践
- 框架模式
- 测试策略
- 架构指南

### Hooks
有用的自动化：
- Linting/格式化 hook
- 安全检查
- 验证 hook
- 通知 hook

### Commands
调用有用 workflow 的 slash command：
- 部署命令
- 测试命令
- 代码生成命令

---

## 快速开始

```bash
# 1. Fork 并克隆
gh repo fork affaan-m/everything-claude-code --clone
cd everything-claude-code

# 2. 创建分支
git checkout -b feat/my-contribution

# 3. 添加您的贡献（见下文各节）

# 4. 本地测试
cp -r skills/my-skill ~/.claude/skills/  # for skills
# 然后用 Claude Code 测试

# 5. 提交 PR
git add . && git commit -m "feat: add my-skill" && git push -u origin feat/my-contribution
```

---

## 贡献 Skills

Skills 是 Claude Code 根据上下文加载的知识模块。

> **完整指南：** 关于创建有效 skill 的详细指导，见 [Skill Development Guide](docs/SKILL-DEVELOPMENT-GUIDE.md)。涵盖：
> - Skill 架构与分类
> - 编写有效的含示例内容
> - 最佳实践和常见模式
> - 测试与验证
> - 完整示例库

### 目录结构

```
skills/
└── your-skill-name/
    └── SKILL.md
```

### SKILL.md 模板

```markdown
---
name: your-skill-name
description: 在 skill 列表中显示的简要描述，用于自动激活
origin: ECC
---

# Your Skill Title

简要概述此 skill 涵盖的内容。

## 何时激活

描述 Claude 应使用此 skill 的场景。这对自动激活至关重要。

## 核心概念

解释关键模式和指南。

## 代码示例

\`\`\`typescript
// 包含实用的、可粘贴的示例
function example() {
  // 良好注释的代码
}
\`\`\`

## 反模式

展示不应该做的示例。

## 最佳实践

- 可操作的指南
- 应该做和不应该做
- 要避免的常见陷阱

## 相关 Skills

链接到互补的 skills（例如 `related-skill-1`、`related-skill-2`）。
```

### Skill 分类

| 分类 | 用途 | 示例 |
|----------|---------|----------|
| **语言标准** | 惯用语、约定、最佳实践 | `python-patterns`、`golang-patterns` |
| **框架模式** | 框架特定指导 | `django-patterns`、`nextjs-patterns` |
| **Workflow** | 分步流程 | `tdd-workflow`、`refactoring-workflow` |
| **领域知识** | 专业领域 | `security-review`、`api-design` |
| **工具集成** | 工具/库使用 | `docker-patterns`、`supabase-patterns` |
| **模板** | 项目特定 skill 模板 | `project-guidelines-example` |

### Skill 检查清单

- [ ] 聚焦一个领域/技术（不过于宽泛）
- [ ] 包含"何时激活"部分用于自动激活
- [ ] 包含实用的、可粘贴的代码示例
- [ ] 展示反模式（不应该做什么）
- [ ] 低于 500 行（最多 800）
- [ ] 使用清晰的章节标题
- [ ] 用 Claude Code 测试过
- [ ] 链接到相关 skills
- [ ] 不含敏感数据（API key、token、路径）

### 示例 Skills

| Skill | 分类 | 用途 |
|-------|----------|---------|
| `coding-standards/` | 语言标准 | TypeScript/JavaScript 模式 |
| `frontend-patterns/` | 框架模式 | React 和 Next.js 最佳实践 |
| `backend-patterns/` | 框架模式 | API 和数据库模式 |
| `security-review/` | 领域知识 | 安全检查清单 |
| `tdd-workflow/` | Workflow | 测试驱动开发流程 |
| `project-guidelines-example/` | 模板 | 项目特定 skill 模板 |

---

## 贡献 Agents

Agents 是通过 Task 工具调用的专业助手。

### 文件位置

```
agents/your-agent-name.md
```

### Agent 模板

```markdown
---
name: your-agent-name
description: 此 agent 做什么以及 Claude 何时调用它。要具体！
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

You are a [role] specialist.

## Your Role

- 主要职责
- 次要职责
- 你不做什么（边界）

## Workflow

### Step 1: Understand
你如何处理任务。

### Step 2: Execute
你如何执行工作。

### Step 3: Verify
你如何验证结果。

## Output Format

你返回给用户的内容。

## Examples

### Example: [Scenario]
Input: [用户提供什么]
Action: [你做什么]
Output: [你返回什么]
```

### Agent 字段

| 字段 | 描述 | 选项 |
|-------|-------------|---------|
| `name` | 小写、中划线分隔 | `code-reviewer` |
| `description` | 用于决定何时调用 | 要具体！ |
| `tools` | 仅需要哪些 | `Read, Write, Edit, Bash, Grep, Glob, WebFetch, Task`，或 MCP 工具名（如 agent 使用 MCP 时的 `mcp__context7__resolve-library-id`、`mcp__context7__query-docs`） |
| `model` | 复杂度级别 | `haiku`（简单）、`sonnet`（编程）、`opus`（复杂） |

### 示例 Agents

| Agent | 用途 |
|-------|---------|
| `tdd-guide.md` | 测试驱动开发 |
| `code-reviewer.md` | 代码审查 |
| `security-reviewer.md` | 安全扫描 |
| `build-error-resolver.md` | 修复构建错误 |

---

## 贡献 Hooks

Hooks 是由 Claude Code 事件触发的自动行为。

### 文件位置

```
hooks/hooks.json
```

### Hook 类型

| 类型 | 触发器 | 用途 |
|------|---------|----------|
| `PreToolUse` | 工具运行前 | 验证、警告、阻止 |
| `PostToolUse` | 工具运行后 | 格式化、检查、通知 |
| `SessionStart` | 会话开始时 | 加载上下文 |
| `Stop` | 会话结束时 | 清理、审计 |

### Hook 格式

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"rm -rf /\"",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[Hook] BLOCKED: Dangerous command' && exit 1"
          }
        ],
        "description": "Block dangerous rm commands"
      }
    ]
  }
}
```

### Matcher 语法

```javascript
// 匹配特定工具
tool == "Bash"
tool == "Edit"
tool == "Write"

// 匹配输入模式
tool_input.command matches "npm install"
tool_input.file_path matches "\\.tsx?$"

// 组合条件
tool == "Bash" && tool_input.command matches "git push"
```

### Hook 示例

```json
// 在 tmux 外阻止开发服务器
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"npm run dev\"",
  "hooks": [{"type": "command", "command": "echo 'Use tmux for dev servers' && exit 1"}],
  "description": "Ensure dev servers run in tmux"
}

// 编辑 TypeScript 后自动格式化
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.tsx?$\"",
  "hooks": [{"type": "command", "command": "npx prettier --write \"$file_path\""}],
  "description": "Format TypeScript files after edit"
}

// git push 前提醒
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"git push\"",
  "hooks": [{"type": "command", "command": "echo '[Hook] Review changes before pushing'"}],
  "description": "Reminder to review before push"
}
```

### Hook 检查清单

- [ ] Matcher 是具体的（不太宽泛）
- [ ] 包含清晰的错误/信息消息
- [ ] 使用正确的退出码（`exit 1` 阻止，`exit 0` 允许）
- [ ] 经过充分测试
- [ ] 有描述

---

## 贡献 Commands

Commands 是用户通过 `/command-name` 调用的操作。

### 文件位置

```
commands/your-command.md
```

### Command 模板

```markdown
---
description: 在 /help 中显示的简要描述
---

# Command Name

## Purpose

此 command 做什么。

## Usage

\`\`\`
/your-command [args]
\`\`\`

## Workflow

1. 第一步
2. 第二步
3. 最后一步

## Output

用户收到什么。
```

### 示例 Commands

| Command | 用途 |
|---------|---------|
| `commit.md` | 创建 git 提交 |
| `code-review.md` | 审查代码变更 |
| `tdd.md` | TDD 工作流 |
| `e2e.md` | E2E 测试 |

---

## MCP 和文档（如 Context7）

Skills 和 agents 可以使用 **MCP (Model Context Protocol)** 工具来拉取最新数据，而非仅依赖训练数据。这对文档尤其有用。

- **Context7** 是一个 MCP server，暴露 `resolve-library-id` 和 `query-docs`。当用户问及库、框架或 API 时使用它，使回答反映当前文档和代码示例。
- 贡献依赖实时文档的 **skills**（如设置、API 用法）时，描述如何使用相关 MCP 工具（如解析库 ID，然后查询文档），并指向 `documentation-lookup` skill 或 Context7 作为模式。
- 贡献回答文档/API 问题的 **agents** 时，在 agent 的 tools 中包含 Context7 MCP 工具名（如 `mcp__context7__resolve-library-id`、`mcp__context7__query-docs`），并记录 resolve → query 工作流。
- **mcp-configs/mcp-servers.json** 包含一个 Context7 条目；用户在 harness（如 Claude Code、Cursor）中启用它，以使用 `skills/documentation-lookup/` 中的 documentation-lookup skill 和 `/docs` command。

---

## 跨 Harness 和翻译

### Skill 子集（Codex 和 Cursor）

ECC 为其他 harness 附带 skill 子集：

- **Codex:** `.agents/skills/` — 在 `agents/openai.yaml` 中列出的 skills 由 Codex 加载。
- **Cursor:** `.cursor/skills/` — skill 子集捆绑用于 Cursor。

当你**添加应在 Codex 或 Cursor 上可用的新 skill** 时：

1. 按通常方式将 skill 添加到 `skills/your-skill-name/`。
2. 如果应在 **Codex** 上可用，添加到 `.agents/skills/`（复制 skill 目录或添加引用），并在需要时确保在 `agents/openai.yaml` 中引用它。
3. 如果应在 **Cursor** 上可用，按 Cursor 的布局添加到 `.cursor/skills/` 下。

检查这些目录中的现有 skills 以了解预期结构。保持这些子集同步是手动的；如果更新了它们，请在 PR 中说明。

### 翻译

翻译位于 `docs/` 下（如 `docs/zh-CN`、`docs/zh-TW`、`docs/ja-JP`）。如果更改了已翻译的 agents、commands 或 skills，请考虑更新相应的翻译文件，或开 issue 以便维护者或翻译人员更新。

---

## Pull Request 流程

### 1. PR 标题格式

```
feat(skills): add rust-patterns skill
feat(agents): add api-designer agent
feat(hooks): add auto-format hook
fix(sills): update React patterns
docs: improve contributing guide
```

### 2. PR 描述

```markdown
## Summary
你添加的内容及原因。

## Type
- [ ] Skill
- [ ] Agent
- [ ] Hook
- [ ] Command

## Testing
你如何测试的。

## Checklist
- [ ] 遵循格式指南
- [ ] 用 Claude Code 测试过
- [ ] 无敏感信息（API key、路径）
- [ ] 描述清晰
```

### 3. 审查流程

1. 维护者在 48 小时内审查
2. 如有请求则处理反馈
3. 批准后合并到 main

---

## 指南

### 应该做
- 保持贡献聚焦且模块化
- 包含清晰描述
- 提交前测试
- 遵循现有模式
- 记录依赖

### 不应该做
- 包含敏感数据（API key、token、路径）
- 添加过于复杂或小众的配置
- 提交未经测试的贡献
- 创建现有功能的重复

---

## 文件命名

- 使用小写和中划线：`python-reviewer.md`
- 要有描述性：`tdd-workflow.md` 而非 `workflow.md`
- 文件名与名称匹配

---

## 有问题？

- **Issues:** [github.com/affaan-m/everything-claude-code/issues](https://github.com/affaan-m/everything-claude-code/issues)
- **X/Twitter:** [@affaanmustafa](https://x.com/affaanmustafa)

---

感谢贡献！让我们一起构建一个出色的资源。
