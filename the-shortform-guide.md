# The Shorthand Guide to Everything Claude Code

---

**Been an avid Claude Code user since the experimental rollout in Feb, and won the Anthropic x Forum Ventures hackathon with [zenith.chat](https://zenith.chat) alongside [@DRodriguezFX](https://x.com/DRodriguezFX) - completely using Claude Code.**

Here's my complete setup after 10 months of daily use: skills, hooks, subagents, MCPs, plugins, and what actually works.

---

## Skills and Commands

Skills operate like rules, constricted to certain scopes and workflows. They're shorthand to prompts when you need to execute a particular workflow.

After a long session of coding with Opus 4.5, you want to clean out dead code and loose .md files? Run `/refactor-clean`. Need testing? `/tdd`, `/e2e`, `/test-coverage`. Skills can also include codemaps - a way for Claude to quickly navigate your codebase without burning context on exploration.

Commands are skills executed via slash commands. They overlap but are stored differently:

- **Skills**: `~/.claude/skills/` - broader workflow definitions
- **Commands**: `~/.claude/commands/` - quick executable prompts

---

## Hooks

Hooks are trigger-based automations that fire on specific events. Unlike skills, they're constricted to tool calls and lifecycle events.

**Hook Types:**

1. **PreToolUse** - Before a tool executes (validation, reminders)
2. **PostToolUse** - After a tool finishes (formatting, feedback loops)
3. **UserPromptSubmit** - When you send a message
4. **Stop** - When Claude finishes responding
5. **PreCompact** - Before context compaction
6. **Notification** - Permission requests

**Example: tmux reminder before long-running commands**

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

**Pro tip:** Use the `hookify` plugin to create hooks conversationally instead of writing JSON manually.

---

## Subagents

Subagents are processes your orchestrator (main Claude) can delegate tasks to with limited scopes. They can run in background or foreground, freeing up context for the main agent.

Subagents work nicely with skills - a subagent capable of executing a subset of your skills can be delegated tasks and use those skills autonomously. They can also be sandboxed with specific tool permissions.

---

## Rules and Memory

Your `.rules` folder holds `.md` files with best practices Claude should ALWAYS follow. Two approaches:

1. **Single CLAUDE.md** - Everything in one file (user or project level)
2. **Rules folder** - Modular `.md` files grouped by concern

---

## MCPs (Model Context Protocol)

MCPs connect Claude to external services directly. Not a replacement for APIs - it's a prompt-driven wrapper around them, allowing more flexibility in navigating information.

**Example:** Supabase MCP lets Claude pull specific data, run SQL directly upstream without copy-paste.

**CRITICAL: Context Window Management**

Be picky with MCPs. I keep all MCPs in user config but **disable everything unused**.

Rule of thumb: Have 20-30 MCPs in config, but keep under 10 enabled / under 80 tools active.

---

## Plugins

Plugins package tools for easy installation instead of tedious manual setup. A plugin can be a skill + MCP combined, or hooks/tools bundled together.

---

## Tips and Tricks

### Keyboard Shortcuts

- `Ctrl+U` - Delete entire line
- `!` - Quick bash command prefix
- `@` - Search for files
- `/` - Initiate slash commands
- `Shift+Enter` - Multi-line input
- `Tab` - Toggle thinking display
- `Esc Esc` - Interrupt Claude / restore code

### Parallel Workflows

- **Fork** (`/fork`) - Fork conversations to do non-overlapping tasks in parallel
- **Git Worktrees** - For overlapping parallel Claudes without conflicts

### tmux for Long-Running Commands

Stream and watch logs/bash processes Claude runs.

---

## Key Takeaways

1. **Don't overcomplicate** - treat configuration like fine-tuning, not architecture
2. **Context window is precious** - disable unused MCPs and plugins
3. **Parallel execution** - fork conversations, use git worktrees
4. **Automate the repetitive** - hooks for formatting, linting, reminders
5. **Scope your subagents** - limited tools = focused execution

---

## References

- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode)
- [Memory System](https://code.claude.com/docs/en/memory)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [MCP Overview](https://code.claude.com/docs/en/mcp-overview)

---

**Note:** This is a subset of detail. See the [Longform Guide](./the-longform-guide.md) for advanced patterns.
