# Hooks 规则

## Hook 类型

| 类型 | 触发时机 | 用途 |
|------|---------|------|
| `PreToolUse` | 工具执行前 | 验证、提醒 |
| `PostToolUse` | 工具执行后 | 格式化、反馈 |
| `UserPromptSubmit` | 发送消息时 | 预处理 |
| `Stop` | Claude 响应完成 | 检查、整理 |
| `PreCompact` | 上下文压缩前 | 状态保存 |
| `Notification` | 权限请求 | 确认 |

---

## Hook 配置格式

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn)\"",
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] 建议使用 tmux 保持会话' >&2; fi"
        }
      ]
    }
  ]
}
```

---

## Matcher 语法

### 常用匹配条件

```json
// 匹配工具名称
"tool == \"Edit\""

// 匹配文件类型
"file_path matches \"\\\\.(ts|tsx|js|jsx)$\""

// 匹配命令内容
"command matches \"npm run\""

// 组合条件
"tool == \"Edit\" && file_path matches \"\\\\.ts$\""
```

### 常用变量

| 变量 | 说明 |
|------|------|
| `tool` | 工具名称 |
| `tool_input` | 工具输入参数 |
| `file_path` | 文件路径 |
| `command` | Bash 命令 |

---

## 常用 Hook 示例

### 1. 格式化 Hook

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
      "hooks": [
        {
          "type": "command",
          "command": "npx prettier --write \"$file_path\""
        }
      ]
    }
  ]
}
```

### 2. 构建检查 Hook

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && file_path matches \"\\\\.(ts|tsx)$\"",
      "hooks": [
        {
          "type": "command",
          "command": "npx tsc --noEmit \"$file_path\""
        }
      ]
    }
  ]
}
```

### 3. console.log 检查

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\"",
      "hooks": [
        {
          "type": "command",
          "command": "grep -n 'console\\\\.log' \"$file_path\" && echo '[Hook] 发现 console.log，请移除' >&2"
        }
      ]
    }
  ]
}
```

### 4. Git 推送提醒

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && command matches \"git push\"",
      "hooks": [
        {
          "type": "command",
          "command": "echo '[Hook] 推送前请确认：1) 测试通过 2) 无敏感信息'"
        }
      ]
    }
  ]
}
```

---

## Hook 开发指南

### 原则

- **保持简洁** — Hook 脚本不超过 200 行
- **快速执行** — 阻塞 Hook 应在 200ms 内完成
- **优雅退出** — 非关键错误应 `exit 0`
- **清晰日志** — 错误消息应包含 `[HookName]` 前缀

### 异步 Hook

```json
{
  "matcher": "tool == \"Bash\" && command matches \"npm test\"",
  "async": true,
  "timeout": 30000,
  "hooks": [
    {
      "type": "command",
      "command": "npm test -- --coverage"
    }
  ]
}
```

### 状态管理

```javascript
// Hook 可以使用文件存储状态
const stateFile = path.join(os.homedir(), '.claude', 'hook-state.json');

function readState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state));
}
```

---

## 常用 Hook 场景

### 1. 会话持久化

```json
{
  "Stop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node ~/.claude/scripts/save-session.js"
        }
      ]
    }
  ]
}
```

### 2. 提交前检查

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && command matches \"git commit\"",
      "hooks": [
        {
          "type": "command",
          "command": "npm test"
        },
        {
          "type": "command",
          "command": "npx lint-staged"
        }
      ]
    }
  ]
}
```

### 3. 上下文压缩建议

```json
{
  "PreCompact": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node ~/.claude/scripts/analyze-context.js"
        }
      ]
    }
  ]
}
```

---

## 调试 Hook

```bash
# 查看 Hook 输出
# Hook 的 stderr 输出会显示在 Claude Code 中

# 测试 Matcher
node -e "
const matcher = 'tool == \"Edit\" && file_path matches \"\\\\.ts$\"';
const input = { tool: 'Edit', tool_input: { file_path: 'test.ts' } };
console.log(eval(matcher));
"
```
