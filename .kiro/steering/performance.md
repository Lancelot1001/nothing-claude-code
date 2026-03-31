---
inclusion: auto
description: Performance optimization guidelines including model selection strategy, context window management, and build troubleshooting
---

# 性能优化

## 模型选择策略

**Claude Haiku 4.5**（Sonnet 90% 的能力，1/3 的成本）：
- 频繁调用的轻量级 agents
- 结对编程和代码生成
- 多 agent 系统中的 worker agents

**Claude Sonnet 4.5**（最佳编码模型）：
- 主要开发工作
- 编排多 agent 工作流
- 复杂编码任务

**Claude Opus 4.5**（最深推理）：
- 复杂架构决策
- 最大推理需求
- 研究和分析任务

## Context Window 管理

避免在 context window 的最后 20% 进行：
- 大规模重构
- 跨多文件的功能实现
- 调试复杂交互

低 context 敏感度任务：
- 单文件编辑
- 独立工具创建
- 文档更新
- 简单 bug 修复

## Extended Thinking

Extended thinking 在 Kiro 中默认启用，为内部推理保留 tokens。

需要深度推理的复杂任务：
1. 确保 extended thinking 已启用
2. 使用结构化方法进行规划
3. 使用多轮评审进行彻底分析
4. 使用 sub-agents 获取不同视角

## 构建故障排除

构建失败时：
1. 使用 build-error-resolver agent
2. 分析错误消息
3. 增量修复
4. 每次修复后验证
