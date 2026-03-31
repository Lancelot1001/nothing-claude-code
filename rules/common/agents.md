# 子agent规则

## agent概览

子agent是有限范围的任务处理器，可以委托复杂任务让它处理。

---

## agent列表

| agent | 用途 | 使用时机 |
|------|------|---------|
| `planner` | 实施规划 | 复杂功能、重构 |
| `architect` | 系统设计 | 架构决策 |
| `tdd-guide` | 测试驱动开发 | 新功能、Bug修复 |
| `code-reviewer` | 代码质量和安全 | 写完/修改代码后 |
| `security-reviewer` | 漏洞检测 | 提交前、敏感代码 |
| `build-error-resolver` | 构建/类型错误 | 构建失败时 |
| `e2e-runner` | Playwright E2E | 关键用户流程 |
| `refactor-cleaner` | 死代码清理 | 代码维护 |
| `doc-updater` | 文档和代码图 | 更新文档 |
| `docs-lookup` | 文档和 API 研究 | 库/API 文档问题 |

### 语言特定agent

| agent | 用途 |
|------|------|
| `python-reviewer` | Python 代码审查 |
| `go-reviewer` | Go 代码审查 |
| `go-build-resolver` | Go 构建错误 |
| `rust-reviewer` | Rust 代码审查 |
| `rust-build-resolver` | Rust 构建错误 |
| `cpp-reviewer` | C++ 代码审查 |
| `cpp-build-resolver` | C++ 构建错误 |
| `kotlin-reviewer` | Kotlin 代码审查 |
| `kotlin-build-resolver` | Kotlin 构建错误 |
| `typescript-reviewer` | TypeScript 代码审查 |

### 专业agent

| agent | 用途 |
|------|------|
| `database-reviewer` | PostgreSQL/Supabase 专家 |
| `java-reviewer` | Java/Spring Boot 审查 |
| `java-build-resolver` | Java 构建错误 |
| `chief-of-staff` | 多渠道通信整理 |
| `loop-operator` | 自主循环执行 |
| `harness-optimizer` | 配置调优 |

---

## 何时使用agent

### 主动使用agent

| 场景 | agent |
|------|------|
| 复杂功能请求 | `planner` |
| 刚写完/修改代码 | `code-reviewer` |
| Bug 修复或新功能 | `tdd-guide` |
| 架构决策 | `architect` |
| 安全敏感代码 | `security-reviewer` |
| 多渠道通信整理 | `chief-of-staff` |
| 自主循环/循环监控 | `loop-operator` |
| 配置可靠性和成本 | `harness-optimizer` |

---

## agent格式

### 文件结构

```
~/.claude/agents/
├── planner.md           # 命名必须与文件名匹配
├── architect.md
├── tdd-guide.md
├── code-reviewer.md
└── ...
```

### Frontmatter 格式

```markdown
---
name: code-reviewer
description: 审查代码的质量、安全性和可维护性
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

你是一名高级代码审查员...
```

### 必需字段

| 字段 | 说明 |
|------|------|
| `name` | agent名称（小写中划线） |
| `description` | 清晰描述何时调用 |
| `tools` | 允许使用的工具 |
| `model` | 使用的模型 |

---

## 并行执行

独立操作可以并行执行：

```bash
# 启动多个agent同时工作
Agent: code-reviewer
Agent: tdd-guide
Agent: doc-updater
```

### 示例场景

- 多个文件的代码审查可以并行
- 单元测试和集成测试可以并行
- 文档更新和代码重构可以并行

---

## agent通信

### 传递上下文

```markdown
Agent: planner

任务：为电商系统设计订单处理模块

要求：
- 支持多种支付方式
- 订单状态机
- 库存扣减策略
- 参考现有的用户模块结构
```

### 接收agent结果

agent完成任务后，会将结果返回给主agent，主agent继续协调后续步骤。

---

## 最佳实践

### 作用域限制

为每个agent设置明确的工具权限：

```markdown
# 安全审查agent - 只读访问
---
name: security-reviewer
tools: ["Read", "Grep", "Glob"]
model: opus
---

# E2E 测试agent - 可以运行命令
---
name: e2e-runner
tools: ["Read", "Write", "Bash"]
model: sonnet
---
```

### 避免上下文泄漏

agent之间传递信息时：
- 使用结构化输出
- 明确标记关键发现
- 总结而非复制全部内容

### agent链

复杂任务可以链式调用：

```
planner → tdd-guide → code-reviewer → e2e-runner
```

---

## agent vs 直接执行

| 任务 | 推荐方式 |
|------|---------|
| 简单文件编辑 | 直接执行 |
| 代码审查 | `code-reviewer` agent |
| 多文件重构 | `planner` + `refactor-cleaner` |
| 新功能开发 | `planner` + `tdd-guide` |
| 安全审计 | `security-reviewer` agent |
| 复杂系统设计 | `architect` agent |
