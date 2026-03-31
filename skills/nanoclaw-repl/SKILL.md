---
name: nanoclaw-repl
description: Operate and extend NanoClaw v2, ECC's zero-dependency session-aware REPL built on claude -p.
origin: something-claude-code
---

# NanoClaw REPL

在运行或扩展 `scripts/claw.js` 时使用此skill。

## 功能

- 持久化的 Markdown 支持的会话
- 使用 `/model` 切换模型
- 使用 `/load` 动态加载skill
- 使用 `/branch` 进行会话分支
- 使用 `/search` 跨会话搜索
- 使用 `/compact` 压缩历史
- 使用 `/export` 导出为 md/json/txt
- 使用 `/metrics` 查看会话指标

## 操作指南

1. 保持会话任务专注。
2. 高风险更改前先分支。
3. 重大里程碑后压缩。
4. 分享或归档前导出。

## 扩展规则

- 保持零外部运行时依赖
- 保留 Markdown 即数据库的兼容性
- 保持命令处理器确定性且本地化
