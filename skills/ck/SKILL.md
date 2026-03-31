---
name: ck
description: Claude Code 的持久化项目记忆。自动在会话开始时加载项目上下文，使用 git 活动跟踪会话，并写入原生记忆。命令运行确定性的 Node.js 脚本 — 行为在模型版本间保持一致。
origin: something-claude-code
version: 2.0.0
author: sreedhargs89
repo: https://github.com/sreedhargs89/context-keeper
---

# ck — 上下文守护者

你是**上下文守护者**助手。当用户调用任何 `/ck:*` 命令时，
运行相应的 Node.js 脚本并原样向用户展示其 stdout。
脚本位于：`~/.claude/skills/ck/commands/`（将 `~` 展开为 `$HOME`）。

---

## 数据布局

```
~/.claude/ck/
├── projects.json              ← 路径 → {名称，contextDir，lastUpdated}
└── contexts/<名称>/
    ├── context.json           ← 事实来源（结构化 JSON，v2）
    └── CONTEXT.md             ← 生成视图 — 不要手动编辑
```

---

## 命令

### `/ck:init` — 注册项目
```bash
node "$HOME/.claude/skills/ck/commands/init.mjs"
```
脚本输出带自动检测信息的 JSON。将其作为确认草案呈现：
```
以下是我发现的 — 确认或编辑任何内容：
项目：     <名称>
描述：     <描述>
技术栈：       <技术栈>
目标：        <目标>
不做事项：     <约束或"无">
仓库：        <仓库或"无">
```
等待用户批准。应用任何编辑。然后将确认的 JSON 管道到 save.mjs --init：
```bash
echo '<确认的-json>' | node "$HOME/.claude/skills/ck/commands/save.mjs" --init
```
确认的 JSON schema：`{"name":"...","path":"...","description":"...","stack":["..."],"goal":"...","constraints":["..."],"repo":"..." }`

---

### `/ck:save` — 保存会话状态
**这是唯一需要 LLM 分析的命令。** 分析当前对话：
- `summary`：一句话，最多 10 个词，完成的内容
- `leftOff`：正在积极处理的内容（特定文件/功能/bug）
- `nextSteps`：具体下一步的有序数组
- `decisions`：本次会话所做决策的 `{what, why}` 数组
- `blockers`：当前阻塞因素的数组（无则为空数组）
- `goal`：更新的目标字符串**仅当本次会话有变化时**，否则省略

向用户显示草案摘要：`"Session: '<summary>' — save this? (yes / edit)"`
等待确认。然后管道到 save.mjs：
```bash
echo '<json>' | node "$HOME/.claude/skills/ck/commands/save.mjs"
```
JSON schema（精确）：`{"summary":"...","leftOff":"...","nextSteps":["..."],"decisions":[{"what":"...","why":"..."}],"blockers":["..."]}`
原样展示脚本的 stdout 确认。

---

### `/ck:resume [名称|编号]` — 完整简报
```bash
node "$HOME/.claude/skills/ck/commands/resume.mjs" [参数]
```
原样展示输出。然后问：「从这里继续？还是有什么变化？」
如果用户报告变化 → 立即运行 `/ck:save`。

---

### `/ck:info [名称|编号]` — 快速快照
```bash
node "$HOME/.claude/skills/ck/commands/info.mjs" [参数]
```
原样展示输出。不需要后续问题。

---

### `/ck:list` — 组合视图
```bash
node "$HOME/.claude/skills/ck/commands/list.mjs"
```
原样展示输出。如果用户回复数字或名称 → 运行 `/ck:resume`。

---

### `/ck:forget [名称|编号]` — 移除项目
首先解析项目名称（必要时运行 `/ck:list`）。
问：`"这将永久删除 '<名称>' 的上下文。确定吗？（yes/no）"`
如果是：
```bash
node "$HOME/.claude/skills/ck/commands/forget.mjs" [名称]
```
原样展示确认。

---

### `/ck:migrate` — 将 v1 数据转换为 v2
```bash
node "$HOME/.claude/skills/ck/commands/migrate.mjs"
```
先做试运行：
```bash
node "$HOME/.claude/skills/ck/commands/migrate.mjs" --dry-run
```
原样展示输出。将所有 v1 CONTEXT.md + meta.json 文件迁移到 v2 context.json。
原始文件备份为 `meta.json.v1-backup` — 什么都不删除。

---

## SessionStart 钩子

`~/.claude/skills/ck/hooks/session-start.mjs` 处的钩子必须在
`~/.claude/settings.json` 中注册以在会话开始时自动加载项目上下文：

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node \"~/.claude/skills/ck/hooks/session-start.mjs\"" }] }
    ]
  }
}
```

该钩子每会话注入约 100 个 token（紧凑的 5 行摘要）。它还检测未保存的会话、自上次保存以来的 git 活动以及与 CLAUDE.md 的目标不匹配。

---

## 规则
- 在 Bash 调用中始终将 `~` 展开为 `$HOME`。
- 命令不区分大小写：`/CK:SAVE`、`/ck:save`、`/Ck:Save` 都有效。
- 如果脚本以代码 1 退出，将其 stdout 显示为错误消息。
- 永远不要直接编辑 `context.json` 或 `CONTEXT.md` — 始终使用脚本。
- 如果 `projects.json` 格式错误，告诉用户并提供将其重置为 `{}` 的选项。
