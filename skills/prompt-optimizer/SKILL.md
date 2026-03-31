---
name: prompt-optimizer
description: >-
  分析原始提示词，识别意图和不足，匹配 ECC 组件
  （skill/命令/agent/钩子），输出可直接粘贴使用的优化后提示词。
  仅提供咨询建议——不会执行实际任务。
  当用户说"优化prompt"、"改进prompt"、"怎么写prompt"、
  "帮我优化这个指令"或其英文等价表达时触发。
  当用户想要直接执行任务，或说"just do it"或"直接做"时，
  不要触发。当用户说"优化代码"、"优化性能"、"optimize performance"、
  "optimize this code"时也不要触发——这些是重构/性能任务，
  不是提示词优化。
origin: something-claude-code
metadata:
  author: YannJY02
  version: "1.0.0"
---

# 提示词优化器

分析草稿提示词，进行批评性审视，匹配到 ECC 生态系统组件，
并输出用户可以直接粘贴使用的完整优化后提示词。

## 何时使用

- 用户说"optimize this prompt"、"improve my prompt"、"rewrite this prompt"
- 用户说"help me write a better prompt for..."
- 用户说"what's the best way to ask Claude Code to..."
- 用户说"优化prompt"、"改进prompt"、"怎么写prompt"、"帮我优化这个指令"
- 用户粘贴了一个草稿提示词并请求反馈或增强
- 用户说"I don't know how to prompt for this"
- 用户说"how should I use ECC for..."
- 用户显式调用了 `/prompt-optimize`

### 不适用场景

- 用户想要直接执行任务（直接执行即可）
- 用户说"优化代码"、"优化性能"、"optimize this code"、"optimize performance"——这些是重构任务，不是提示词优化
- 用户询问 ECC 配置（改用 `configure-ecc`）
- 用户想要skill清单（改用 `skill-stocktake`）
- 用户说"just do it"或"直接做"

## 工作原理

**仅提供咨询——不执行用户的任务。**

不要写代码、创建文件、运行命令或采取任何实现操作。
你唯一的输出是分析加上优化后的提示词。

如果用户说"just do it"、"直接做"或"don't optimize, just execute"，
不要在这个skill内切换到实现模式。告诉用户此skill只生成优化后的提示词，
如果他们想要执行，请引导他们提出正常的任务请求。

按顺序运行这个六阶段流程。按下面的输出格式呈现结果。

### 分析流程

### 阶段 0：项目检测

在分析提示词之前，检测当前项目上下文：

1. 检查工作目录中是否存在 `CLAUDE.md`——阅读它以了解项目约定
2. 从项目文件中检测技术栈：
   - `package.json` → Node.js / TypeScript / React / Next.js
   - `go.mod` → Go
   - `pyproject.toml` / `requirements.txt` → Python
   - `Cargo.toml` → Rust
   - `build.gradle` / `pom.xml` → Java / Kotlin / Spring Boot
   - `Package.swift` → Swift
   - `Gemfile` → Ruby
   - `composer.json` → PHP
   - `*.csproj` / `*.sln` → .NET
   - `Makefile` / `CMakeLists.txt` → C / C++
   - `cpanfile` / `Makefile.PL` → Perl
3. 记录检测到的技术栈，供阶段 3 和阶段 4 使用

如果没有找到项目文件（例如，提示词是抽象的或用于新项目），
跳过检测并在阶段 4 中标记为"技术栈未知"。

### 阶段 1：意图检测

将用户的任务分类到一个或多个类别中：

| 类别 | 关键词 | 示例 |
|----------|-------------|---------|
| 新功能 | build, create, add, implement, 创建, 实现, 添加 | "Build a login page" |
| 缺陷修复 | fix, broken, not working, error, 修复, 报错 | "Fix the auth flow" |
| 重构 | refactor, clean up, restructure, 重构, 整理 | "Refactor the API layer" |
| 研究 | how to, what is, explore, investigate, 怎么, 如何 | "How to add SSO" |
| 测试 | test, coverage, verify, 测试, 覆盖率 | "Add tests for the cart" |
| 审查 | review, audit, check, 审查, 检查 | "Review my PR" |
| 文档 | document, update docs, 文档 | "Update the API docs" |
| 基础设施 | deploy, CI, docker, database, 部署, 数据库 | "Set up CI/CD pipeline" |
| 设计 | design, architecture, plan, 设计, 架构 | "Design the data model" |

### 阶段 2：范围评估

如果阶段 0 检测到项目，使用代码库大小作为信号。否则，
仅根据提示词描述进行估计，并标记估计为不确定。

| 范围 | 启发式判断 | 协调方式 |
|-------|-----------|---------------|
| TRIVIAL（微小） | 单文件，< 50 行 | 直接执行 |
| LOW（低） | 单个组件或模块 | 单个命令或skill |
| MEDIUM（中） | 多个组件，同一领域 | 命令链 + /verify |
| HIGH（高） | 跨领域，5+ 文件 | 先 /plan，再分阶段执行 |
| EPIC（巨型） | 多会话，多 PR，架构转变 | 使用 blueprint skill进行多会话规划 |

### 阶段 3：ECC 组件匹配

将意图 + 范围 + 技术栈（来自阶段 0）映射到特定的 ECC 组件。

#### 按意图类型

| 意图 | 命令 | skill | agent |
|--------|----------|--------|--------|
| 新功能 | /plan, /tdd, /code-review, /verify | tdd-workflow, verification-loop | planner, tdd-guide, code-reviewer |
| 缺陷修复 | /tdd, /build-fix, /verify | tdd-workflow | tdd-guide, build-error-resolver |
| 重构 | /refactor-clean, /code-review, /verify | verification-loop | refactor-cleaner, code-reviewer |
| 研究 | /plan | search-first, iterative-retrieval | — |
| 测试 | /tdd, /e2e, /test-coverage | tdd-workflow, e2e-testing | tdd-guide, e2e-runner |
| 审查 | /code-review | security-review | code-reviewer, security-reviewer |
| 文档 | /update-docs, /update-codemaps | — | doc-updater |
| 基础设施 | /plan, /verify | docker-patterns, deployment-patterns, database-migrations | architect |
| 设计（中等-高） | /plan | — | planner, architect |
| 设计（巨型） | — | blueprint（作为skill调用） | planner, architect |

#### 按技术栈

| 技术栈 | 添加的skill | agent |
|------------|--------------|-------|
| Python / Django | django-patterns, django-tdd, django-security, django-verification, python-patterns, python-testing | python-reviewer |
| Go | golang-patterns, golang-testing | go-reviewer, go-build-resolver |
| Spring Boot / Java | springboot-patterns, springboot-tdd, springboot-security, springboot-verification, java-coding-standards, jpa-patterns | code-reviewer |
| Kotlin / Android | kotlin-coroutines-flows, compose-multiplatform-patterns, android-clean-architecture | kotlin-reviewer |
| TypeScript / React | frontend-patterns, backend-patterns, coding-standards | code-reviewer |
| Swift / iOS | swiftui-patterns, swift-concurrency-6-2, swift-actor-persistence, swift-protocol-di-testing | code-reviewer |
| PostgreSQL | postgres-patterns, database-migrations | database-reviewer |
| Perl | perl-patterns, perl-testing, perl-security | code-reviewer |
| C++ | cpp-coding-standards, cpp-testing | code-reviewer |
| 其他/未列出 | coding-standards（通用） | code-reviewer |

### 阶段 4：缺失上下文检测

扫描提示词中缺失的关键信息。检查每个项目，
标记阶段 0 是否自动检测到它，或者用户必须提供：

- [ ] **技术栈** — 阶段 0 检测到了，还是需要用户指定？
- [ ] **目标范围** — 是否提到了文件、目录或模块？
- [ ] **验收标准** — 如何知道任务完成了？
- [ ] **错误处理** — 是否处理了边界情况和失败模式？
- [ ] **安全要求** — 认证、输入验证、密钥管理？
- [ ] **测试期望** — 单元测试、集成测试、E2E？
- [ ] **性能约束** — 负载、延迟、资源限制？
- [ ] **UI/UX 要求** — 设计规范、响应式、无障碍？（如果是前端）
- [ ] **数据库变更** — 模式、迁移、索引？（如果有数据层）
- [ ] **现有模式** — 要遵循的参考文件或约定？
- [ ] **范围边界** — 什么不要做？

**如果缺少 3 个或更多关键项目**，在生成优化提示词之前，
向用户提出最多 3 个澄清问题。然后将答案整合到优化后的提示词中。

### 阶段 5：workflow和模型推荐

确定此提示词在开发生命周期中的位置：

```
研究 → 规划 → 实现（TDD） → 审查 → 验证 → 提交
```

对于中等及以上范围的任务，始终从 /plan 开始。对于巨型任务，使用 blueprint skill。

**模型推荐**（包含在输出中）：

| 范围 | 推荐模型 | 理由 |
|-------|------------------|-----------|
| TRIVIAL-LOW | Sonnet 4.6 | 快速、经济，适合简单任务 |
| MEDIUM | Sonnet 4.6 | 最佳编码模型，适合标准工作 |
| HIGH | Sonnet 4.6（主）+ Opus 4.6（规划） | Opus 用于架构，Sonnet 用于实现 |
| EPIC | Opus 4.6（蓝图）+ Sonnet 4.6（执行） | 深度推理用于多会话规划 |

**多提示词拆分**（用于 HIGH/EPIC 范围）：

对于超出单个会话的任务，拆分为顺序提示词：
- 提示词 1：研究 + 规划（使用 search-first skill，然后 /plan）
- 提示词 2-N：每个提示词实现一个阶段（每个以 /verify 结束）
- 最终提示词：跨所有阶段的集成测试 + /code-review
- 使用 /save-session 和 /resume-session 在会话之间保留上下文

---

## 输出格式

按此精确结构呈现分析。使用与用户输入相同的语言进行回复。

### 第一部分：提示词诊断

**优势：** 列出原始提示词做得好的地方。

**问题：**

| 问题 | 影响 | 建议修复 |
|-------|--------|---------------|
| （问题） | （后果） | （如何修复） |

**需要澄清：** 用户应回答的编号问题列表。
如果阶段 0 自动检测到了答案，则说明该答案，而不是提问。

### 第二部分：推荐的 ECC 组件

| 类型 | 组件 | 用途 |
|------|-----------|---------|
| 命令 | /plan | 编码前先规划架构 |
| skill | tdd-workflow | TDD 方法论指导 |
| agent | code-reviewer | 实施后审查 |
| 模型 | Sonnet 4.6 | 适用于此范围 |

### 第三部分：优化后的提示词——完整版

在一个带围栏的代码块内呈现完整的优化提示词。
提示词必须是独立的，可以直接复制粘贴。包括：
- 带上下文的清晰任务描述
- 技术栈（检测到或指定的）
- 在正确的workflow阶段调用 /command
- 验收标准
- 验证步骤
- 范围边界（什么不要做）

对于引用 blueprint 的项目，写："使用 blueprint skill来..."
（不是 `/blueprint`，因为 blueprint 是skill，不是命令）。

### 第四部分：优化后的提示词——快速版

供有经验的 ECC 用户使用的紧凑版本。按意图类型变化：

| 意图 | 快速模式 |
|--------|--------------|
| 新功能 | `/plan [feature]. /tdd to implement. /code-review. /verify.` |
| 缺陷修复 | `/tdd — 写一个针对 [bug] 的失败测试。修复到绿色。/verify.` |
| 重构 | `/refactor-clean [scope]. /code-review. /verify.` |
| 研究 | `使用 search-first skill研究 [topic]。根据发现 /plan。` |
| 测试 | `/tdd [module]. /e2e 针对关键流程。/test-coverage.` |
| 审查 | `/code-review。然后使用 security-reviewer agent。` |
| 文档 | `/update-docs。/update-codemaps。` |
| EPIC | `使用 blueprint skill规划"[objective]"。使用 /verify 门控执行各阶段。` |

### 第五部分：增强理由

| 增强 | 理由 |
|-------------|--------|
| （添加了什么） | （为什么重要） |

### 页脚

> 不是你需要的？告诉我需要调整什么，或者如果你想要执行而不是提示词优化，
> 提出一个正常的任务请求。

---

## 示例

### 触发示例

- "Optimize this prompt for ECC"
- "Rewrite this prompt so Claude Code uses the right commands"
- "帮我优化这个指令"
- "How should I prompt ECC for this task?"

### 示例 1：模糊的中文提示词（检测到项目）

**用户输入：**
```
帮我写一个用户登录页面
```

**阶段 0 检测到：** `package.json`，Next.js 15，TypeScript，Tailwind CSS

**优化后的提示词（完整版）：**
```
使用项目现有技术栈（Next.js 15 + TypeScript + Tailwind CSS）实现用户登录页面。

技术要求：
- 沿用项目现有的组件结构和路由约定
- 表单验证使用项目中已有的验证方案（检查是否已用 Zod/Yup/其他）
- 认证方式：沿用项目现有认证方案（如无，默认 JWT）
- 包含：邮箱/密码登录表单、表单验证、错误提示、加载状态、响应式布局

workflow：
1. /plan 先规划组件结构和认证流程，参考现有页面的模式
2. /tdd 测试先行：编写登录表单的单元测试和认证流程的集成测试
3. 实现登录页面和认证逻辑
4. /code-review 审查实现
5. /verify 验证所有测试通过且页面正常渲染

安全要求：
- 密码不明文传输
- 防止暴力破解（rate limiting）
- XSS 防护
- CSRF token

验收标准：
- 所有测试通过，覆盖率 80%+
- 页面在移动端和桌面端正常渲染
- 登录成功跳转到 dashboard，失败显示错误信息

不要做：
- 不要实现注册页面
- 不要实现忘记密码功能
- 不要修改现有的路由结构
```

### 示例 2：中等复杂的英文提示词

**用户输入：**
```
Add a REST API endpoint for user profile updates with validation
```

**阶段 0 检测到：** `go.mod`，Go 1.22，Chi router

**优化后的提示词（完整版）：**
```
Add a REST API endpoint for user profile updates (PATCH /api/users/:id).

Tech stack: Go 1.22 + Chi router (detected from project)

Requirements:
- PATCH /api/users/:id — partial update of user profile
- Input validation for fields: name, email, avatar_url, bio
- Auth: require valid token, users can only update own profile
- Return 200 with updated user on success
- Return 400 with validation errors on invalid input
- Return 401/403 for auth failures
- Follow existing API patterns in the codebase

Workflow:
1. /plan the endpoint structure, middleware chain, and validation logic
2. /tdd — write table-driven tests for success, validation failure, auth failure, not-found
3. Implement following existing handler patterns
4. /go-review
5. /verify — run full test suite, confirm no regressions

Do not:
- Modify existing endpoints
- Change the database schema (use existing user table)
- Add new dependencies without checking existing ones first (use search-first skill)
```

### 示例 3：EPIC 项目

**用户输入：**
```
Migrate our monolith to microservices
```

**优化后的提示词（完整版）：**
```
Use the blueprint skill to plan: "Migrate monolith to microservices architecture"

Before executing, answer these questions in the blueprint:
1. Which domain boundaries exist in the current monolith?
2. Which service should be extracted first (lowest coupling)?
3. Communication pattern: REST APIs, gRPC, or event-driven (Kafka/RabbitMQ)?
4. Database strategy: shared DB initially or database-per-service from start?
5. Deployment target: Kubernetes, Docker Compose, or serverless?

The blueprint should produce phases like:
- Phase 1: Identify service boundaries and create domain map
- Phase 2: Set up infrastructure (API gateway, service mesh, CI/CD per service)
- Phase 3: Extract first service (strangler fig pattern)
- Phase 4: Verify with integration tests, then extract next service
- Phase N: Decommission monolith

Each phase = 1 PR, with /verify gates between phases.
Use /save-session between phases. Use /resume-session to continue.
Use git worktrees for parallel service extraction when dependencies allow.

Recommended: Opus 4.6 for blueprint planning, Sonnet 4.6 for phase execution.
```

---

## 相关组件

| 组件 | 何时参考 |
|-----------|------------------|
| `configure-ecc` | 用户尚未设置 ECC |
| `skill-stocktake` | 审计已安装的组件（使用而不是硬编码目录） |
| `search-first` | 优化提示词中的研究阶段 |
| `blueprint` | EPIC 范围的优化提示词（作为skill调用，不是命令） |
| `strategic-compact` | 长会话上下文管理 |
| `cost-aware-llm-pipeline` | Token 优化建议 |
