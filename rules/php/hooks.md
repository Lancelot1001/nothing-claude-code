---
paths:
  - "**/*.php"
---
# PHP Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 PHP 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **Pint**：编辑 `.php` 文件后自动格式化
- **PHPStan**：静态分析
- **Psalm**：类型检查

## Composer Hook

```json
{
  "tool": "Bash",
  "description": "Run PHPStan analyze",
  "command": "./vendor/bin/phpstan analyze src --level=max"
}
```

## 警告

- 标记缺少 `declare(strict_types=1)` 的文件
- 标记未使用的 `use` 导入
