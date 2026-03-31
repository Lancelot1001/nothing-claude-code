---
description: 通过 Claude DevFleet 编排并行 Claude Code agent——从自然语言规划项目，在隔离的 worktree 中调度agent，监控进度，读取结构化报告。
---

# DevFleet — 多agent编排

通过 Claude DevFleet 编排并行 Claude Code agent。每个agent在隔离的 git worktree 中运行，具有完整工具。

需要 DevFleet MCP 服务器：`claude mcp add devfleet --transport http http://localhost:18801/mcp`

## 流程

```
用户描述项目
  → plan_project(prompt) → 带依赖的任务 DAG
  → 显示计划，获得批准
  → dispatch_mission(M1) → agent在工作区中生成
  → M1 完成 → 自动合并 → M2 自动调度（依赖于 M1）
  → M2 完成 → 自动合并
  → get_report(M2) → files_changed, what_done, errors, next_steps
  → 向用户报告摘要
```

## workflow process

1. **规划项目** 根据用户描述：

```
mcp__devfleet__plan_project(prompt="<用户描述>")
```

这返回一个带有链接任务的项目。向用户显示：
- 项目名称和 ID
- 每个任务：标题、类型、依赖
- 依赖 DAG（哪些任务阻塞哪些）

2. **等待用户批准** 然后再调度。清楚地显示计划。

3. **调度第一个任务**（没有 `depends_on` 的任务）：

```
mcp__devfleet__dispatch_mission(mission_id="<first_mission_id>")
```

剩余任务在其依赖完成后自动调度（因为 `plan_project` 创建它们时设置了 `auto_dispatch=true`）。当使用 `create_mission` 手动创建任务时，必须明确设置 `auto_dispatch=true` 才能获得此行为。

4. **监控进度** — 检查正在运行的内容：

```
mcp__devfleet__get_dashboard()
```

或检查特定任务：

```
mcp__devfleet__get_mission_status(mission_id="<id>")
```

对于长时间运行的任务，优先使用 `get_mission_status` 轮询而非 `wait_for_mission`，这样用户可以看到进度更新。

5. **读取报告** 每个完成任务的报告：

```
mcp__devfleet__get_report(mission_id="<mission_id>")
```

为每个达到终态的任务调用此方法。报告包含：files_changed、what_done、what_open、what_tested、what_untested、next_steps、errors_encountered。

## 所有可用工具

| 工具 | 用途 |
|------|---------|
| `plan_project(prompt)` | AI 将描述分解为带 `auto_dispatch=true` 的链接任务 |
| `create_project(name, path?, description?)` | 手动创建项目，返回 `project_id` |
| `create_mission(project_id, title, prompt, depends_on?, auto_dispatch?)` | 添加任务。`depends_on` 是任务 ID 字符串列表。 |
| `dispatch_mission(mission_id, model?, max_turns?)` | 启动agent |
| `cancel_mission(mission_id)` | 停止运行中的agent |
| `wait_for_mission(mission_id, timeout_seconds?)` | 阻塞直到完成（长时间任务优先使用轮询） |
| `get_mission_status(mission_id)` | 无阻塞检查进度 |
| `get_report(mission_id)` | 读取结构化报告 |
| `get_dashboard()` | 系统概览 |
| `list_projects()` | 浏览项目 |
| `list_missions(project_id, status?)` | 列出任务 |

## 指南

- 除非用户说"继续"，否则始终在调度前确认计划
- 报告状态时包含任务标题和 ID
- 如果任务失败，读取其报告以了解错误后再重试
- agent并发性可配置（默认：3）。超额任务排队并在插槽空闲时自动调度。检查 `get_dashboard()` 以了解插槽可用性。
- 依赖形成 DAG——永远不要创建循环依赖
- 每个agent完成后自动合并其 worktree。如果发生合并冲突，更改保留在工作区分支上以供手动解决。
