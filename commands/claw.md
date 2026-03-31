---
description: 启动 NanoClaw v2 — nothing-claude-code 的持久化、无依赖 REPL，支持模型路由、skill热加载、分支、压缩、导出和指标。
---

# Claw 命令

启动具有持久化 markdown 历史和操作控制的交互式 AI agent会话。

## 使用方法

```bash
node scripts/claw.js
```

或通过 npm：

```bash
npm run claw
```

## 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `CLAW_SESSION` | `default` | 会话名称（字母数字 + 连字符） |
| `CLAW_SKILLS` | *(空)* | 启动时加载的逗号分隔skill |
| `CLAW_MODEL` | `sonnet` | 会话的默认模型 |

## REPL 命令

```text
/help                          显示帮助
/clear                         清除当前会话历史
/history                       打印完整对话历史
/sessions                      列出已保存的会话
/model [名称]                  显示/设置模型
/load <skill名称>               热加载skill到上下文
/branch <会话名称>              分支当前会话
/search <查询>                 跨会话搜索查询
/compact                       压缩旧对话，保留最近的上下文
/export <md|json|txt> [路径]   导出会话
/metrics                       显示会话指标
exit                           退出
```

## 注意事项

- NanoClaw 保持零依赖。
- 会话存储在 `~/.claude/claw/<session>.md`。
- 压缩保留最近的对话并写入压缩头。
- 导出支持 markdown、JSON 对话和纯文本。
