---
paths:
  - "**/*.pl"
  - "**/*.pm"
  - "**/*.t"
---
# Perl 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Perl 特定内容。

## 标准

- **Perl 5.36+**：启用 `use v5.36` 使用现代特性
- **Moo** 或 **Moose**：面向对象编程
- **perltidy**：自动格式化
- **perlcritic**：代码审查

## Modern Perl

- 使用 `use strict` 和 `use warnings`
- 使用 `say` 替代 `print`
- 使用 `given/when` 智能匹配（Perl 5.10+）
- 使用 `state` 变量替代 `my` 声明的持久变量

## 命名

- 子程序：`sub_name`（下划线分隔）
- 包/类：`Module::Name`
- 变量：`$camelCase` 或 `$snake_case`（依约定）

## 参考

参见 skill: `perl` 获取更多 Perl 惯用模式。
