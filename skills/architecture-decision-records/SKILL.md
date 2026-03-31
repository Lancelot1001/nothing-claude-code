---
name: architecture-decision-records
description: 将 Claude Code 会话期间做出的架构决策捕获为结构化的 ADR。自动检测决策时刻，记录上下文、考虑的替代方案和理由。维护 ADR 日志，以便未来的开发者理解代码库为何如此构建
origin: nothing-claude-code
---

# 架构决策记录

在编码会话期间实时捕获架构决策。决策不再只存在于 Slack 帖子、PR 评论或某人的记忆中，此skill生成的 ADR 文档与代码共存。

## 何时激活

- 用户明确说"让我们记录这个决策"或"记为 ADR"
- 用户在重大替代方案之间做出选择（框架、库、模式、数据库、API 设计）
- 用户说"我们决定..."或"我们选择 X 而不是 Y 的原因是..."
- 用户问"为什么我们选择 X？"（读取现有 ADR）
- 在规划阶段讨论架构权衡时

## ADR 格式

使用 Michael Nygard 提出的轻量级 ADR 格式，针对 AI 辅助开发进行了调整：

```markdown
# ADR-NNNN: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: proposed | accepted | deprecated | superseded by ADR-NNNN
**Deciders**: [who was involved]

## Context

What is the issue that we're seeing that is motivating this decision or change?

[2-5 sentences describing the situation, constraints, and forces at play]

## Decision

What is the change that we're proposing and/or doing?

[1-3 sentences stating the decision clearly]

## Alternatives Considered

### Alternative 1: [Name]
- **Pros**: [benefits]
- **Cons**: [drawbacks]
- **Why not**: [specific reason this was rejected]

### Alternative 2: [Name]
- **Pros**: [benefits]
- **Cons**: [drawbacks]
- **Why not**: [specific reason this was rejected]

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
- [benefit 1]
- [benefit 2]

### Negative
- [trade-off 1]
- [trade-off 2]

### Risks
- [risk and mitigation]
```

## workflow process

### 捕获新 ADR

当检测到决策时刻时：

1. **初始化（仅首次）**——如果 `docs/adr/` 不存在，在创建目录之前请求用户确认，创建包含索引表头的 `README.md`（见下面的 ADR 索引格式），以及用于手动使用的空白 `template.md`。未经明确同意不要创建文件。
2. **识别决策**——提取正在做出的核心架构选择
3. **收集上下文**——是什么问题促使了这个决定？存在什么约束？
4. **记录替代方案**——考虑了哪些其他选项？为什么被拒绝？
5. **说明后果**——权衡是什么？什么变得更容易/更难？
6. **分配编号**——扫描 `docs/adr/` 中现有的 ADR 并递增
7. **确认并写入**——将草案 ADR 呈现给用户审查。仅在获得明确批准后才写入 `docs/adr/NNNN-decision-title.md`。如果用户拒绝，在不写入任何文件的情况下丢弃草案。
8. **更新索引**——追加到 `docs/adr/README.md`

### 读取现有 ADR

当用户问"为什么我们选择 X？"时：

1. 检查 `docs/adr/` 是否存在——如果不存在，回复："此项目中未找到 ADR。你想开始记录架构决策吗？"
2. 如果存在，扫描 `docs/adr/README.md` 索引以查找相关条目
3. 读取匹配的 ADR 文件并呈现 Context 和 Decision 部分
4. 如果未找到匹配，回复："未找到该决策的 ADR。你想现在记录一个吗？"

### ADR 目录结构

```
docs/
└── adr/
    ├── README.md              ← index of all ADRs
    ├── 0001-use-nextjs.md
    ├── 0002-postgres-over-mongo.md
    ├── 0003-rest-over-graphql.md
    └── template.md            ← blank template for manual use
```

### ADR Index Format

```markdown
# Architecture Decision Records

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-use-nextjs.md) | Use Next.js as frontend framework | accepted | 2026-01-15 |
| [0002](0002-postgres-over-mongo.md) | PostgreSQL over MongoDB for primary datastore | accepted | 2026-01-20 |
| [0003](0003-rest-over-graphql.md) | REST API over GraphQL | accepted | 2026-02-01 |
```

## 决策检测信号

注意对话中表明架构决策的这些模式：

**明确信号**
- "我们选择 X 吧"
- "我们应该使用 X 而不是 Y"
- "这个权衡是值得的，因为..."
- "把这个记为 ADR"

**隐含信号**（建议记录 ADR——未经用户确认不要自动创建）
- 比较两个框架或库并得出结论
- 对数据库模式设计选择给出明确理由
- 在架构模式之间选择（单体 vs 微服务、REST vs GraphQL）
- 决定认证/授权策略
- 在评估替代方案后选择部署基础设施

## 什么使 ADR 优秀

### 应该做
- **要具体**——"使用 Prisma ORM"而非"使用 ORM"
- **记录原因**——理由比内容更重要
- **包含被拒绝的替代方案**——未来的开发者需要知道考虑了哪些
- **诚实陈述后果**——每个决策都有权衡
- **保持简短**——ADR 应该可以在 2 分钟内读完
- **使用现在时**——"我们使用 X"而非"我们将使用 X"

### 不应该做
- 记录琐碎决策——变量命名或格式选择不需要 ADR
- 写长文——如果 context 部分超过 10 行，就太长了
- 省略替代方案——"我们只是选了它"不是有效的理由
- 在不标注的情况下追溯——如果要记录过去的决策，注明原始日期
- 让 ADR 过期——被取代的决策应引用其替代者

## ADR 生命周期

```
proposed → accepted → [deprecated | superseded by ADR-NNNN]
```

- **proposed**：决策正在讨论中，尚未承诺
- **accepted**：决策生效并被遵循
- **deprecated**：决策不再相关（例如功能被移除）
- **superseded**：更新的 ADR 取代了这个（始终链接替代者）

## 值得记录决策的类别

| 类别 | 示例 |
|----------|---------|
| **技术选择** | 框架、语言、数据库、云提供商 |
| **架构模式** | 单体 vs 微服务、事件驱动、CQRS |
| **API 设计** | REST vs GraphQL、版本策略、认证机制 |
| **数据建模** | 模式设计、规范化决策、缓存策略 |
| **基础设施** | 部署模型、CI/CD 管道、监控堆栈 |
| **安全** | 认证策略、加密方法、密钥管理 |
| **测试** | 测试框架、覆盖率目标、E2E vs 集成平衡 |
| **流程** | 分支策略、审查流程、发布节奏 |

## 与其他skill的集成

- **规划器智能体**：当规划器提出架构更改时，建议创建 ADR
- **代码审查智能体**：标记引入架构更改但没有相应 ADR 的 PR
