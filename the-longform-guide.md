# Everything Claude Code 详细指南

---

> **前置条件**：本指南基于 [Everything Claude Code 简明指南](./the-shortform-guide.md)。如果尚未设置 skills、hooks、subagents、MCP 和插件，请先阅读简明指南。

在简明指南中，我涵盖了基础设置：skills 和 commands、hooks、subagents、MCP、插件，以及构成有效 Claude Code 工作流骨干的配置模式。

这份详细指南深入探讨将高效会话与浪费性会话区分开来的技术。主题包括：token 经济、内存持久化、验证模式、并行化策略，以及构建可重用工作流的复利效应。

---

## 技巧与窍门

### 某些 MCP 是可替代的，替代后能释放上下文窗口

对于版本控制（GitHub）、数据库（Supabase）、部署（Vercel、Railway）等 MCP——大多数这些平台已经有强大的 CLI，MCP 本质上只是包装它们。MCP 是一个不错的包装器，但有代价。

为了让 CLI 功能更像 MCP 而实际上不使用 MCP（以及随之而来的上下文窗口缩减），考虑将功能捆绑到 skills 和 commands 中。

示例：不要始终加载 GitHub MCP，创建一个包装了 `gh pr create` 及你首选选项的 `/gh-pr` command。

---

## 重要内容

### 上下文与内存管理

为了跨会话共享内存，一个 skill 或 command 总结并检查进度，然后保存到 `.claude` 文件夹中的 `.tmp` 文件，并在会话结束前追加到其中，这是最佳选择。第二天它可以使用这些作为上下文，从中断处继续。

**战略性清除上下文：**

一旦制定了计划并清除了上下文，你就可以从计划开始工作。这在你积累了大量与执行无关的探索上下文时很有用。

**高级：动态系统提示注入**

不要只把所有内容放在每次会话都会加载的 CLAUDE.md 或 `.claude/rules/` 中，使用 CLI 标志动态注入上下文。

```bash
claude --system-prompt "$(cat memory.md)"
```

**实用设置：**

```bash
# 日常开发
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR 审查模式
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# 研究/探索模式
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

---

### 持续学习 / 内存

如果你不得不重复一个提示多次，而 Claude 遇到了相同的问题或给出了你之前听过的回答——这些模式必须追加到 skills 中。

**问题：** 浪费的 token、浪费的上下文、浪费的时间。

**解决方案：** 当 Claude Code 发现非平凡的东西时——调试技术、变通方法、某些项目特定模式——它将该知识保存为一个新的 skill。

---

### Token 优化

**主要策略：Subagent 架构**

优化你使用的工具和 subagent 架构，委托足够完成任务的尽可能便宜的模型。

**模型选择快速参考：**

| 任务类型 | 模型 | 原因 |
| ------------------------- | ------ | ------------------------------------------ |
| 探索/搜索 | Haiku | 快速、便宜、找文件足够好 |
| 简单编辑 | Haiku | 单文件更改、清晰指令 |
| 多文件实现 | Sonnet | 编程最佳平衡 |
| 复杂架构 | Opus | 需要深度推理 |
| PR 审查 | Sonnet | 理解上下文、捕捉细微差别 |
| 安全分析 | Opus | 不能漏掉漏洞 |
| 写文档 | Haiku | 结构简单 |
| 调试复杂 Bug | Opus | 需要将整个系统记在脑中 |

90% 的编码任务默认使用 Sonnet。当首次尝试失败、任务跨越 5+ 个文件、架构决策或安全关键代码时，升级到 Opus。

---

## 并行化

在多 Claude 终端设置中分叉会话时，确保分叉中的操作和原始会话的作用域定义良好。代码更改方面争取最小重叠。

**我的首选模式：**

主聊天用于代码更改，分叉用于关于代码库及其当前状态的问题，或对外部服务的研究。

**用于并行实例的 Git Worktrees：**

```bash
# 创建 worktrees 用于并行工作
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b
git worktree add ../project-refactor refactor-branch

# 每个 worktree 有自己的 Claude 实例
cd ../project-feature-a && claude
```

---

## 基础工作

**双实例启动模式：**

对于我自己的工作流管理，我喜欢用一个空仓库启动 2 个打开的 Claude 实例。

**实例 1：脚手架 Agent**
- 铺设脚手架和基础工作
- 创建项目结构
- 设置配置（CLAUDE.md、rules、agents）

**实例 2：深度研究 Agent**
- 连接到所有服务、网络搜索
- 创建详细 PRD
- 创建架构 mermaid 图表

---

## Agent 与 Sub-Agent 最佳实践

**Sub-Agent 上下文问题：**

Sub-agents 存在是为了通过返回摘要而非倾倒所有内容来节省上下文。但编排器有 sub-agent 缺乏的语义上下文。sub-agent 只知道字面查询，不知道请求背后的目的。

**迭代检索模式：**

1. 编排器评估每个 sub-agent 返回
2. 在接受之前问后续问题
3. Sub-agent 回到源，获取答案，返回
4. 循环直到足够（最多 3 轮）

**带顺序阶段的编排器：**

```markdown
Phase 1: RESEARCH (use Explore agent) → research-summary.md
Phase 2: PLAN (use planner agent) → plan.md
Phase 3: IMPLEMENT (use tdd-guide agent) → code changes
Phase 4: REVIEW (use code-reviewer agent) → review-comments.md
Phase 5: VERIFY (use build-error-resolver if needed) → done or loop back
```

---

## 里程碑

一周内 GitHub 星标超过 25,000！

---

## 资源

**Agent 编排：**
- claude-flow — 社区构建的企业编排平台，带 54+ 专业 agents

**官方：**
- Anthropic Academy: anthropic.skilljar.com

---

*两本指南中涵盖的所有内容都在 GitHub 上提供：[everything-claude-code](https://github.com/affaan-m/everything-claude-code)*
