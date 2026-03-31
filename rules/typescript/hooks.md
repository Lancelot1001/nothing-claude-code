---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 TypeScript/JavaScript 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **Prettier**：编辑 JS/TS 文件后自动格式化
- **TypeScript check**：编辑 `.ts`/`.tsx` 文件后运行 `tsc`
- **console.log warning**：编辑的文件中标记 `console.log`

## Stop Hooks

- **console.log audit**：会话结束前检查所有修改过的文件中的 `console.log`
