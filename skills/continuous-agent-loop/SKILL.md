---
name: continuous-agent-loop
description: 带质量门、评估和恢复控制的连续自主agent循环模式。
origin: something-claude-code
---

# 连续agent循环

这是 v1.8+ 规范的循环skill名称。它在保持一个版本兼容性的同时取代了 `autonomous-loops`。

## 循环选择流程

```text
开始
  |
  +-- 需要严格的 CI/PR 控制？ -- 是 --> continuous-pr
  |
  +-- 需要 RFC 分解？ -- 是 --> rfc-dag
  |
  +-- 需要探索性并行生成？ -- 是 --> infinite
  |
  +-- 默认 --> sequential
```

## 组合模式

推荐的生产堆栈：
1. RFC 分解（`ralphinho-rfc-pipeline`）
2. 质量门（`plankton-code-quality` + `/quality-gate`）
3. 评估循环（`eval-harness`）
4. 会话持久化（`nanoclaw-repl`）

## 失败模式

- 循环空转而没有可衡量的进展
- 使用相同根本原因的重复重试
- 合并队列停滞
- 成本因无限升级而漂移

## 恢复

- 冻结循环
- 运行 `/harness-audit`
- 将范围缩小到失败的单元
- 使用明确的验收标准重放
