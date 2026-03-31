---
description: 分析agent、skill、MCP 服务器和规则的上下文窗口使用情况，找出优化机会。有助于减少 token 开销并避免性能警告。
---

# 上下文预算优化器

分析 Claude Code 设置的上下文窗口消耗，并提供可操作的建议来降低 token 开销。

## 使用方法

```
/context-budget [--verbose]
```

- 默认：显示摘要和主要建议
- `--verbose`：按组件的完整细分

$ARGUMENTS

## 执行步骤

运行 **context-budget** skill（`skills/context-budget/SKILL.md`），输入以下内容：

1. 如果 `$ARGUMENTS` 中存在 `--verbose` 标志，则传递它
2. 假设上下文窗口为 200K（Claude Sonnet 默认值），除非用户另有指定
3. 遵循skill的四个阶段：清单 → 分类 → 检测问题 → 报告
4. 向用户输出格式化的上下文预算报告

skill处理所有扫描逻辑、token 估算、问题检测和报告格式化。
