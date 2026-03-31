# Everything Claude Code 简明指南

---

**从 2 月的实验性推出以来一直是热情的 Claude Code 用户，并与 [@DRodriguezFX](https://x.com/DRodriguezFX) 一起凭借 [zenith.chat](https://zenith.chat) 在 Anthropic x Forum Ventures 黑客松中获奖——完全使用 Claude Code。**

经过 10 个月的日常使用，这是我完整的设置：skills、hooks、subagents、MCP、插件，以及真正有效的配置。

---

## Skills 和 Commands

Skills 像规则一样运作，受限于特定作用域和工作流。当你需要执行特定工作流时，它们是 prompts 的简写形式。

经过使用 Opus 4.5 进行了长时间的编码后，想要清理死代码和松散的 .md 文件？运行 `/refactor-clean`。需要测试？`/tdd`、`/e2e`、`/test-coverage`。Skills 还可以包含 codemaps——一种让 Claude 快速导航代码库而不消耗上下文进行探索的方式。

Commands 是通过 slash command 执行的 skills。它们有重叠，但存储方式不同：

- **Skills**: `~/.claude/skills/` — 更广泛的工作流定义
- **Commands**: `~/.claude/commands/` — 快速可执行的 prompts

---

## Hooks

Hooks 是在特定事件上触发的基于触发器的自动化。与 skills 不同，它们受限于工具调用和生命周期事件。

**Hook 类型：**

1. **PreToolUse** — 工具执行前（验证、提醒）
2. **PostToolUse** — 工具完成后（格式化、反馈循环）
3. **UserPromptSubmit** — 你发送消息时
4. **Stop** — Claude 完成响应时
5. **PreCompact** — 上下文压缩前
6. **Notification** — 权限请求

**示例：长时间运行命令前的 tmux 提醒**

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn|cargo|pytest)\"",
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux for session persistence' >&2; fi"
        }
      ]
    }
  ]
}
```

**专业提示：** 使用 `hookify` 插件通过对话方式创建 hooks，而非手动编写 JSON。

---

## Subagents

Subagents 是你的编排器（主 Claude）可以将任务委托给有限作用域的进程。它们可以在后台或前台运行，为主 agent 释放上下文。

Subagents 与 skills 配合得很好——能够执行部分 skills 子集的 subagent 可以被委托任务并自主使用这些 skills。它们也可以用特定工具权限进行沙箱化。

---

## Rules 和 Memory

你的 `.rules` 文件夹包含 Claude 应始终遵循的最佳实践的 `.md` 文件。两种方法：

1. **单一 CLAUDE.md** — 所有内容在一个文件中（用户或项目级别）
2. **Rules 文件夹** — 按关注点分组的模块化 `.md` 文件

---

## MCPs (Model Context Protocol)

MCP 将 Claude 直接连接到外部服务。不是 API 的替代品——它是围绕它们构建的 prompt 驱动的包装器，在导航信息方面提供更多灵活性。

**示例：** Supabase MCP 让 Claude 拉取特定数据，直接在上游运行 SQL，无需复制粘贴。

**关键：上下文窗口管理**

对 MCP 要挑剔。我将所有 MCP 放在用户配置中但**禁用所有未使用的**。

经验法则：配置中放 20-30 个 MCP，但保持启用少于 10 个 / 活跃工具少于 80 个。

---

## Plugins

Plugins 将工具打包以便轻松安装，而非繁琐的手动设置。plugin 可以是 skill + MCP 的组合，或捆绑在一起的 hooks/工具。

---

## 技巧与窍门

### 键盘快捷键

- `Ctrl+U` — 删除整行
- `!` — 快速 bash 命令前缀
- `@` — 搜索文件
- `/` — 启动 slash commands
- `Shift+Enter` — 多行输入
- `Tab` — 切换 thinking 显示
- `Esc Esc` — 打断 Claude / 恢复代码

### 并行工作流

- **Fork** (`/fork`) — 分叉对话以并行执行不重叠的任务
- **Git Worktrees** — 用于无冲突的并行 Claude 重叠工作

### tmux 用于长时间运行命令

流式传输和监视 Claude 运行的日志/bash 进程。

---

## 关键要点

1. **不要过度复杂** — 把配置像微调而非架构
2. **上下文窗口很珍贵** — 禁用未使用的 MCP 和插件
3. **并行执行** — 分叉对话，使用 git worktrees
4. **自动化重复工作** — hooks 用于格式化、lint、提醒
5. **限定 subagents 作用域** — 有限工具 = 专注执行

---

## 参考

- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode)
- [Memory System](https://code.claude.com/docs/en/memory)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [MCP Overview](https://code.claude.com/docs/en/mcp-overview)

---

**注意：** 这是细节的子集。高级模式见[详细指南](./the-longform-guide.md)。
