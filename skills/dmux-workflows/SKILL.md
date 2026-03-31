---
name: dmux-workflows
description: 使用 dmux（AI agent的 tmux 面板管理器）进行多agent编排。在 Claude Code、Codex、OpenCode 和其他 harness 之间并行agentworkflow process的模式。在并行运行多个agent会话或协调多agent开发workflow process时使用。
origin: nothing-claude-code
---

# dmux workflow process

使用 dmux（一个用于agent harness 的 tmux 面板管理器）编排并行 AI agent会话。

## 何时激活

- 并行运行多个agent会话
- 跨 Claude Code、Codex 和其他 harness 协调工作
- 从分而治之并行性中受益的复杂任务
- 用户说"并行运行"、"分割这项工作"、"使用 dmux"或"多agent"

## 什么是 dmux

dmux 是一个基于 tmux 的编排工具，用于管理 AI agent面板：
- 按 `n` 创建一个带提示的新面板
- 按 `m` 将面板输出合并回主会话
- 支持：Claude Code、Codex、OpenCode、Cline、Gemini、Qwen

**安装：** 在审查包后从其仓库安装 dmux。参见 [github.com/standardagents/dmux](https://github.com/standardagents/dmux)

## 快速入门

```bash
# Start dmux session
dmux

# Create agent panes (press 'n' in dmux, then type prompt)
# Pane 1: "Implement the auth middleware in src/auth/"
# Pane 2: "Write tests for the user service"
# Pane 3: "Update API documentation"

# Each pane runs its own agent session
# Press 'm' to merge results back
```

## workflow process模式

### 模式 1：研究 + 实现

将研究和实现分成并行轨道：

```
Pane 1 (Research): "Research best practices for rate limiting in Node.js.
  Check current libraries, compare approaches, and write findings to
  /tmp/rate-limit-research.md"

Pane 2 (Implement): "Implement rate limiting middleware for our Express API.
  Start with a basic token bucket, we'll refine after research completes."

# After Pane 1 completes, merge findings into Pane 2's context
```

### 模式 2：多文件功能

跨独立文件并行工作：

```
Pane 1: "Create the database schema and migrations for the billing feature"
Pane 2: "Build the billing API endpoints in src/api/billing/"
Pane 3: "Create the billing dashboard UI components"

# Merge all, then do integration in main pane
```

### 模式 3：测试 + 修复循环

在一个面板中运行测试，在另一个面板中修复：

```
Pane 1 (Watcher): "Run the test suite in watch mode. When tests fail,
  summarize the failures."

Pane 2 (Fixer): "Fix failing tests based on the error output from pane 1"
```

### 模式 4：跨 Harness

为不同任务使用不同的 AI 工具：

```
Pane 1 (Claude Code): "Review the security of the auth module"
Pane 2 (Codex): "Refactor the utility functions for performance"
Pane 3 (Claude Code): "Write E2E tests for the checkout flow"
```

### 模式 5：代码审查流水线

并行审查视角：

```
Pane 1: "Review src/api/ for security vulnerabilities"
Pane 2: "Review src/api/ for performance issues"
Pane 3: "Review src/api/ for test coverage gaps"

# Merge all reviews into a single report
```

## 最佳实践

1. **Independent tasks only.** Don't parallelize tasks that depend on each other's output.
2. **Clear boundaries.** Each pane should work on distinct files or concerns.
3. **Merge strategically.** Review pane output before merging to avoid conflicts.
4. **Use git worktrees.** For file-conflict-prone work, use separate worktrees per pane.
5. **Resource awareness.** Each pane uses API tokens — keep total panes under 5-6.

## Git Worktree 集成

For tasks that touch overlapping files:

```bash
# Create worktrees for isolation
git worktree add -b feat/auth ../feature-auth HEAD
git worktree add -b feat/billing ../feature-billing HEAD

# Run agents in separate worktrees
# Pane 1: cd ../feature-auth && claude
# Pane 2: cd ../feature-billing && claude

# Merge branches when done
git merge feat/auth
git merge feat/billing
```

## 互补工具

| 工具 | 功能 | 何时使用 |
|------|-------------|-------------|
| **dmux** | 用于agent的 tmux 面板管理 | 并行agent会话 |
| **Superset** | 10+ 并行agent的终端 IDE | 大规模编排 |
| **Claude Code Task 工具** | 进程内子agent生成 | 会话内的程序化并行 |
| **Codex 多agent** | 内置agent角色 | Codex 特定的并行工作 |

## ECC 助手

ECC now includes a helper for external tmux-pane orchestration with separate git worktrees:

```bash
node scripts/orchestrate-worktrees.js plan.json --execute
```

Example `plan.json`:

```json
{
  "sessionName": "skill-audit",
  "baseRef": "HEAD",
  "launcherCommand": "codex exec --cwd {worktree_path} --task-file {task_file}",
  "workers": [
    { "name": "docs-a", "task": "Fix skills 1-4 and write handoff notes." },
    { "name": "docs-b", "task": "Fix skills 5-8 and write handoff notes." }
  ]
}
```

The helper:
- Creates one branch-backed git worktree per worker
- Optionally overlays selected `seedPaths` from the main checkout into each worker worktree
- Writes per-worker `task.md`, `handoff.md`, and `status.md` files under `.orchestration/<session>/`
- Starts a tmux session with one pane per worker
- Launches each worker command in its own pane
- Leaves the main pane free for the orchestrator

Use `seedPaths` when workers need access to dirty or untracked local files that are not yet part of `HEAD`, such as local orchestration scripts, draft plans, or docs:

```json
{
  "sessionName": "workflow-e2e",
  "seedPaths": [
    "scripts/orchestrate-worktrees.js",
    "scripts/lib/tmux-worktree-orchestrator.js",
    ".claude/plan/workflow-e2e-test.json"
  ],
  "launcherCommand": "bash {repo_root}/scripts/orchestrate-codex-worker.sh {task_file} {handoff_file} {status_file}",
  "workers": [
    { "name": "seed-check", "task": "Verify seeded files are present before starting work." }
  ]
}
```

## 故障排除

- **Pane not responding:** Switch to the pane directly or inspect it with `tmux capture-pane -pt <session>:0.<pane-index>`.
- **Merge conflicts:** Use git worktrees to isolate file changes per pane.
- **High token usage:** Reduce number of parallel panes. Each pane is a full agent session.
- **tmux not found:** Install with `brew install tmux` (macOS) or `apt install tmux` (Linux).
