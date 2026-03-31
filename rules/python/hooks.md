---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Python 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **black/ruff**：编辑 `.py` 文件后自动格式化
- **mypy/pyright**：编辑 `.py` 文件后运行类型检查

## 警告

- 标记 `print()` 语句——生产代码使用 `logging` 模块
