---
paths:
  - "**/*.swift"
  - "**/Package.swift"
---
# Swift Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Swift 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **SwiftFormat**：编辑 `.swift` 文件后自动格式化
- **SwiftLint**：编辑 `.swift` 文件后运行 lint 检查
- **swift build**：编辑后类型检查修改过的包

## 警告

标记 `print()` 语句——生产代码使用 `os.Logger` 或结构化日志。
