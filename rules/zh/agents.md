# Agent 编排

## 可用 Agent

位于 `~/.claude/agents/`：

| Agent | 用途 | 使用时机 |
|-------|------|---------|
| planner | 实施规划 | 复杂功能、重构 |
| architect | 系统设计 | 架构决策 |
| tdd-guide | 测试驱动开发 | 新功能、Bug 修复 |
| code-reviewer | 代码审查 | 写完代码后 |
| security-reviewer | 安全分析 | 提交前 |
| build-error-resolver | 修复构建错误 | 构建失败时 |
| e2e-runner | E2E 测试 | 关键用户流程 |
| refactor-cleaner | 死代码清理 | 代码维护 |
| doc-updater | 文档 | 更新文档 |
| rust-reviewer | Rust 代码审查 | Rust 项目 |

## 主动使用 Agent

无需用户提示：
1. 复杂功能请求 — 使用 **planner** agent
2. 代码刚写完/修改 — 使用 **code-reviewer** agent
3. Bug 修复或新功能 — 使用 **tdd-guide** agent
4. 架构决策 — 使用 **architect** agent

## 并行任务执行

**始终**使用并行 Task 执行独立操作：

```markdown
# 好：并行执行
并行启动 3 个 agent：
1. Agent 1：认证模块安全分析
2. Agent 2：缓存系统性能审查
3. Agent 3：工具类型检查

# 差：不必要时串行
先 agent 1，然后 agent 2，然后 agent 3
```

## 多视角分析

复杂问题使用分角色 subagent：
- 事实审查员
- 高级工程师
- 安全专家
- 一致性审查员
- 冗余检查员
