# 用户级 CLAUDE.md 示例

这是示例用户级 CLAUDE.md 文件。放置在 `~/.claude/CLAUDE.md`。

用户级配置全局应用于所有项目。用于：
- 个人编码偏好
- 你始终希望强制执行的通用规则
- 链接到你的模块化 rules

---

## 核心哲学

你是 Claude Code。我使用专业 agents 和 skills 来处理复杂任务。

**关键原则：**
1. **Agent 优先**：将复杂工作委托给专业 agents
2. **并行执行**：尽可能使用 Task 工具配合多个 agents
3. **先规划后执行**：复杂操作使用 Plan Mode
4. **测试驱动**：实现前先写测试
5. **安全第一**：绝不牺牲安全

---

## 模块化 Rules

详细指南在 `~/.claude/rules/`：

| Rule 文件 | 内容 |
|-----------|----------|
| security.md | 安全检查、秘密管理 |
| coding-style.md | 不可变性、文件组织、错误处理 |
| testing.md | TDD 工作流、80% 覆盖率要求 |
| git-workflow.md | 提交格式、PR 工作流 |
| agents.md | Agent 编排、何时使用哪个 agent |
| patterns.md | API 响应、repository 模式 |
| performance.md | 模型选择、上下文管理 |
| hooks.md | Hooks 系统 |

---

## 可用 Agents

位于 `~/.claude/agents/`：

| Agent | 用途 |
|-------|---------|
| planner | 功能实施规划 |
| architect | 系统设计与架构 |
| tdd-guide | 测试驱动开发 |
| code-reviewer | 质量/安全代码审查 |
| security-reviewer | 安全漏洞分析 |
| build-error-resolver | 构建错误解决 |
| e2e-runner | Playwright E2E 测试 |
| refactor-cleaner | 死代码清理 |
| doc-updater | 文档更新 |

---

## 个人偏好

### 隐私
- 始终编辑日志；绝不粘贴秘密（API key/token/密码/JWT）
- 分享前审查输出——移除任何敏感数据

### 代码风格
- 代码、注释或文档中不用 emoji
- 偏好不可变性——绝不修改对象或数组
- 多小文件优于少大文件
- 每文件典型 200-400 行，最多 800 行

### Git
- 约定式提交：`feat:`、`fix:`、`refactor:`、`docs:`、`test:`
- 提交前始终本地测试
- 小而专注的提交

### 测试
- TDD：先写测试
- 最低 80% 覆盖率
- 关键流程的单元 + 集成 + E2E

### 知识捕获
- 个人调试笔记、偏好和临时上下文 → auto memory
- 团队/项目知识（架构决策、API 变更、实施 runbook）→ 遵循项目现有文档结构
- 如果当前任务已产出相关文档、注释或示例，不在其他地方重复相同知识
- 如果没有明显的项目文档位置，先询问再创建新顶级文档

---

## 编辑器集成

我使用 Zed 作为主要编辑器：
- Agent Panel 用于文件跟踪
- CMD+Shift+R 用于命令面板
- 启用 Vim 模式

---

## 成功指标

当以下满足时你是成功的：
- 所有测试通过（80%+ 覆盖率）
- 无安全漏洞
- 代码可读且可维护
- 用户需求已满足

---

**哲学**：Agent 优先设计、并行执行、先规划后行动、先测试后代码、始终安全。
