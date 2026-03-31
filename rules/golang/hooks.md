---
paths:
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
---
# Go Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Go 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **gofmt/goimports**：编辑 `.go` 文件后自动格式化
- **go vet**：编辑 `.go` 文件后运行静态分析
- **staticcheck**：对修改过的包运行扩展静态检查
