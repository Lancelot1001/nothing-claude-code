---
name: claude-devfleet
description: 通过 Claude DevFleet 编排多agent编码任务 — 项目规划、在隔离的 worktree 中分配并行agent、监控进度以及读取结构化报告。
origin: something-claude-code
---

# Claude DevFleet 多agent编排

## 何时使用

当你需要分配多个 Claude Code agent并行处理编码任务时使用此skill。每个agent在具有完整工具的隔离 git worktree 中运行。

需要运行中的 Claude DevFleet 实例通过 MCP 连接：
```bash
claude mcp add devfleet --transport http http://localhost:18801/mcp
```

## 工作原理

```
用户 → "构建带认证和测试的 REST API"
  ↓
plan_project(prompt) → project_id + mission DAG
  ↓
向用户展示计划 → 获得批准
  ↓
dispatch_mission(M1) → agent 1 在 worktree 中生成
  ↓
M1 完成 → 自动合并 → 自动分配 M2（取决于 M1）
  ↓
M2 完成 → 自动合并
  ↓
get_report(M2) → files_changed, what_done, errors, next_steps
  ↓
向用户报告
```

### 工具

| 工具 | 用途 |
|------|---------|
| `plan_project(prompt)` | AI 将描述分解为带有链式任务的项目 |
| `create_project(name, path?, description?)` | 手动创建项目，返回 `project_id` |
| `create_mission(project_id, title, prompt, depends_on?, auto_dispatch?)` | 添加任务。`depends_on` 是任务 ID 字符串列表（例如 `["abc-123"]`）。设置 `auto_dispatch=true` 以在依赖满足时自动启动。 |
| `dispatch_mission(mission_id, model?, max_turns?)` | 在任务上启动agent |
| `cancel_mission(mission_id)` | 停止运行中的agent |
| `wait_for_mission(mission_id, timeout_seconds?)` | 阻塞直到任务完成（见下方注释） |
| `get_mission_status(mission_id)` | 非阻塞地检查任务进度 |
| `get_report(mission_id)` | 读取结构化报告（更改的文件、测试、错误、下一步） |
| `get_dashboard()` | 系统概览：运行中的agent、统计、最近活动 |
| `list_projects()` | 浏览所有项目 |
| `list_missions(project_id, status?)` | 列出项目中的任务 |

> **关于 `wait_for_mission` 的注释：** 这会阻塞对话最多 `timeout_seconds` 秒（默认 600）。对于长时间运行的任务，优先选择每 30-60 秒用 `get_mission_status` 轮询，而不是阻塞，这样用户可以看到进度更新。

### workflow process：规划 → 分配 → 监控 → 报告

1. **规划**：调用 `plan_project(prompt="...")` → 返回 `project_id` + 带有 `depends_on` 链和 `auto_dispatch=true` 的任务列表。
2. **展示计划**：向用户呈现任务标题、类型和依赖链。
3. **分配**：在根任务（空的 `depends_on`）上调用 `dispatch_mission(mission_id=<first_mission_id>)`。剩余任务在其依赖完成时自动分配（因为 `plan_project` 为它们设置了 `auto_dispatch=true`）。
4. **监控**：调用 `get_mission_status(mission_id=...)` 或 `get_dashboard()` 检查进度。
5. **报告**：任务完成时调用 `get_report(mission_id=...)`。与用户分享亮点。

### 并发性

DevFleet 默认最多运行 3 个并发agent（可通过 `DEVFLEET_MAX_AGENTS` 配置）。当所有槽位满时，带有 `auto_dispatch=true` 的任务在任务观察器中排队，并在槽位空闲时自动分配。检查 `get_dashboard()` 获取当前槽位使用情况。

## 示例

### 全自动：规划和启动

1. `plan_project(prompt="...")` → 显示带有任务和依赖的计划。
2. 分配第一个任务（`depends_on` 为空的那个）。
3. 剩余任务在依赖解决时自动分配（它们有 `auto_dispatch=true`）。
4. 报告返回项目 ID 和任务数量，让用户知道启动了哪些。
5. 定期用 `get_mission_status` 或 `get_dashboard()` 轮询，直到所有任务达到终止状态（`completed`、`failed` 或 `cancelled`）。
6. 对每个终止任务调用 `get_report(mission_id=...)` — 总结成功并用错误和下一步标注失败。

### 手动：逐步控制

1. `create_project(name="My Project")` → 返回 `project_id`。
2. 为第一个（根）任务调用 `create_mission(project_id=project_id, title="...", prompt="...", auto_dispatch=true)` → 捕获 `root_mission_id`。
   为每个后续任务调用 `create_mission(project_id=project_id, title="...", prompt="...", auto_dispatch=true, depends_on=["<root_mission_id>"])`。
3. 在第一个任务上调用 `dispatch_mission(mission_id=...)` 启动链。
4. 完成后 `get_report(mission_id=...)`。

### 带审查的顺序执行

1. `create_project(name="...")` → 获取 `project_id`。
2. `create_mission(project_id=project_id, title="Implement feature", prompt="...")` → 获取 `impl_mission_id`。
3. `dispatch_mission(mission_id=impl_mission_id)`，然后用 `get_mission_status` 轮询直到完成。
4. `get_report(mission_id=impl_mission_id)` 审查结果。
5. `create_mission(project_id=project_id, title="Review", prompt="...", depends_on=[impl_mission_id], auto_dispatch=true)` — 由于依赖已满足，自动启动。

## 指南

- 除非用户说继续，否则始终在分配前与用户确认计划。
- 报告状态时包含任务标题和 ID。
- 如果任务失败，在重试前阅读其报告。
- 在批量分配前检查 `get_dashboard()` 获取agent槽位可用性。
- 任务依赖形成 DAG — 不要创建循环依赖。
- 每个agent在隔离的 git worktree 中运行并在完成时自动合并。如果发生合并冲突，更改保留在agent的 worktree 分支上以便手动解决。
- 手动创建任务时，如果你希望它们在依赖完成时自动触发，始终设置 `auto_dispatch=true`。没有此标志，任务将保持 `draft` 状态。
