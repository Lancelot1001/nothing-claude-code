# Everything Claude Code (ECC) — Agent 指令

这是一个**生产级 AI 编程插件**，提供 30 个专业 agent、136 个 skill、60 个 command，以及自动化 hook 工作流。

**版本：** 1.9.0

## 核心原则

1. **Agent 优先** — 将领域任务委托给专业 agent
2. **TDD** — 实现前先写测试，要求 80%+ 覆盖率
3. **安全第一** — 绝不妥协安全；验证所有输入
4. **不可变性** — 始终创建新对象，不修改现有对象
5. **先规划后执行** — 写代码前先规划复杂功能

## 可用 Agent

| Agent | 用途 | 使用时机 |
|-------|---------|-------------|
| planner | 实施规划 | 复杂功能、重构 |
| architect | 系统设计与可扩展性 | 架构决策 |
| tdd-guide | 测试驱动开发 | 新功能、Bug 修复 |
| code-reviewer | 代码质量与可维护性 | 写完/修改代码后 |
| security-reviewer | 漏洞检测 | 提交前、敏感代码 |
| build-error-resolver | 修复构建/类型错误 | 构建失败时 |
| e2e-runner | Playwright E2E 测试 | 关键用户流程 |
| refactor-cleaner | 死代码清理 | 代码维护 |
| doc-updater | 文档与代码地图更新 | 更新文档 |
| docs-lookup | 文档与 API 参考研究 | 库/API 文档问题 |
| cpp-reviewer | C++ 代码审查 | C++ 项目 |
| cpp-build-resolver | C++ 构建错误 | C++ 构建失败 |
| go-reviewer | Go 代码审查 | Go 项目 |
| go-build-resolver | Go 构建错误 | Go 构建失败 |
| kotlin-reviewer | Kotlin 代码审查 | Kotlin/Android/KMP 项目 |
| kotlin-build-resolver | Kotlin/Gradle 构建错误 | Kotlin 构建失败 |
| database-reviewer | PostgreSQL/Supabase 专家 | Schema 设计、查询优化 |
| python-reviewer | Python 代码审查 | Python 项目 |
| java-reviewer | Java 和 Spring Boot 代码审查 | Java/Spring Boot 项目 |
| java-build-resolver | Java/Maven/Gradle 构建错误 | Java 构建失败 |
| chief-of-staff | 沟通分类与起草 | 多渠道邮件、Slack、 LINE、Messenger |
| loop-operator | 自主循环执行 | 安全运行循环、监控停滞、干预 |
| harness-optimizer | Harness 配置调优 | 可靠性、成本、吞吐量 |
| rust-reviewer | Rust 代码审查 | Rust 项目 |
| rust-build-resolver | Rust 构建错误 | Rust 构建失败 |
| pytorch-build-resolver | PyTorch 运行时/CUDA/训练错误 | PyTorch 构建/训练失败 |
| typescript-reviewer | TypeScript/JavaScript 代码审查 | TypeScript/JavaScript 项目 |

## Agent 编排

无需用户提示主动使用 agent：
- 复杂功能请求 → **planner**
- 刚写完/修改了代码 → **code-reviewer**
- Bug 修复或新功能 → **tdd-guide**
- 架构决策 → **architect**
- 安全敏感代码 → **security-reviewer**
- 多渠道沟通分类 → **chief-of-staff**
- 自主循环/循环监控 → **loop-operator**
- Harness 配置可靠性与成本 → **harness-optimizer**

独立操作使用并行执行——同时启动多个 agent。

## 安全指南

**提交前必须检查：**
- 不含硬编码秘密（API key、密码、token）
- 所有用户输入已验证
- SQL 注入防护（参数化查询）
- XSS 防护（HTML 净化）
- CSRF 保护已启用
- 身份认证/授权已验证
- 所有端点有速率限制
- 错误消息不泄露敏感数据

**秘密管理：** 绝不硬编码秘密。使用环境变量或秘密管理器。启动时验证所需秘密。立即轮换任何暴露的秘密。

**发现安全问题：** 停止 → 使用 security-reviewer agent → 修复严重问题 → 轮换暴露的秘密 → 检查代码库是否有类似问题。

## 编码风格

**不可变性（关键）：** 始终创建新对象，不修改。返回应用了更改的新副本。

**文件组织：** 多小文件优于少大文件。典型 200-400 行，最多 800 行。按功能/领域组织，非按类型。高内聚，低耦合。

**错误处理：** 每层都处理错误。UI 代码中提供用户友好的消息。服务端记录详细上下文。绝不静默吞掉错误。

**输入验证：** 在系统边界验证所有用户输入。使用基于 schema 的验证。快速失败并给出清晰消息。绝不信任外部数据。

**代码质量检查清单：**
- 函数小（<50 行），文件聚焦（<800 行）
- 无深层嵌套（>4 层）
- 适当错误处理，无硬编码值
- 可读性好，命名清晰

## 测试要求

**最低覆盖率：80%**

测试类型（全部需要）：
1. **单元测试** — 独立函数、工具、组件
2. **集成测试** — API 端点、数据库操作
3. **E2E 测试** — 关键用户流程

**TDD 工作流（强制）：**
1. 先写测试（RED）— 测试应失败
2. 写最小实现（GREEN）— 测试应通过
3. 重构（IMPROVE）— 验证覆盖率 80%+

故障排除：检查测试隔离 → 验证 mock → 修复实现（不修测试，除非测试本身有误）。

## 开发工作流

1. **规划** — 使用 planner agent，识别依赖和风险，分阶段
2. **TDD** — 使用 tdd-guide agent，先写测试，实现，重构
3. **审查** — 立即使用 code-reviewer agent，解决严重/高风险问题
4. **在正确位置保存知识**
   - 个人调试笔记、偏好和临时上下文 → auto memory
   - 团队/项目知识（架构决策、API 变更、runbook）→ 项目现有文档结构
   - 如果当前任务已产出相关文档或代码注释，不在其他地方重复相同信息
   - 如果没有明显的项目文档位置，先询问再创建新顶级文件
5. **提交** — 约定式提交格式，全面的 PR 摘要

## Git 工作流

**提交格式：** `<type>: <description>` — 类型：feat, fix, refactor, docs, test, chore, perf, ci

**PR 工作流：** 分析完整提交历史 → 起草全面摘要 → 包含测试计划 → 使用 `-u` 标志推送。

## 架构模式

**API 响应格式：** 一致的外包装，包含成功指示器、数据负载、错误消息和分页元数据。

**Repository 模式：** 将数据访问封装在标准接口后（findAll、findById、create、update、delete）。业务逻辑依赖抽象接口，而非存储机制。

**骨架项目：** 搜索久经考验的模板，使用并行 agent 评估（安全、可扩展性、相关性），克隆最佳匹配，在可靠结构中迭代。

## 性能

**上下文管理：** 避免在最后 20% 的上下文窗口中做大重构和多文件功能。低敏感度任务（单次编辑、文档、简单修复）容忍更高利用率。

**构建故障排除：** 使用 build-error-resolver agent → 分析错误 → 逐步修复 → 每次修复后验证。

## 项目结构

```
agents/          — 30 个专业 subagent
skills/          — 136 个 workflow skill 和领域知识
commands/        — 60 个 slash command
hooks/           — 基于触发器的自动化
rules/           — 始终遵循的指南（common + per-language）
scripts/         — 跨平台 Node.js 工具
mcp-configs/     — 14 个 MCP server 配置
tests/           — 测试套件
```

## 成功指标

- 所有测试通过，覆盖率 80%+
- 无安全漏洞
- 代码可读、可维护
- 性能可接受
- 用户需求已满足
