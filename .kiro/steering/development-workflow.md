---
inclusion: auto
description: Development workflow guidelines for planning, TDD, code review, and commit pipeline
---

# 开发工作流

> 本规则继承 git 工作流规则，包含 git 操作之前的完整功能开发流程。

功能实现工作流描述了开发管道：规划、TDD、代码审查，然后提交到 git。

## 功能实现工作流

1. **先规划**
   - 使用 **planner** agent 创建实现计划
   - 识别依赖和风险
   - 分解为多个阶段

2. **TDD 方法**
   - 使用 **tdd-guide** agent
   - 先写测试（RED）
   - 实现通过测试（GREEN）
   - 重构（IMPROVE）
   - 验证 80%+ 覆盖率

3. **代码审查**
   - 写完代码后立即使用 **code-reviewer** agent
   - 解决 CRITICAL 和 HIGH 问题
   - 尽可能修复 MEDIUM 问题

4. **提交并推送**
   - 详细的 commit 消息
   - 遵循约定式提交格式
   - 参见 git 工作流规则的 commit 消息格式和 PR 流程
