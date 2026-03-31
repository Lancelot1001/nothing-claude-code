---
paths:
  - "**/*.pl"
  - "**/*.pm"
  - "**/*.t"
---
# Perl Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Perl 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **perltidy**：编辑 `.pl`/`.pm` 文件后自动格式化
- **perlcritic**：代码审查

## 警告

- 标记裸 `use strict` 缺失
- 标记 `our` 声明的未使用变量
