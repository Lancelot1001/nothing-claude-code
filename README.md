# something-claude-code — Claude Code 中文配置指南

基于 [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) 的中文本地化配置，为中文开发者提供完整的 Claude Code 操作指南。

---

## 什么是 Claude Code？

Claude Code 是 [claude.ai/code](https://claude.ai/code) 提供的命令行工具，让你可以用自然语言与 Claude 协作编程。它能帮你：

- 编写、修改、重构代码
- 运行测试和构建
- 解释代码逻辑
- 修复 Bug

**在终端中输入 `claude` 即可启动。**

---

## 快速开始

### 第一步：安装 Claude Code

```bash
# macOS/Linux
npm install -g @anthropic-ai/claude-code

# 或使用 brew
brew install claude-code

# Windows 用户请参考官方文档
# https://docs.claude.com
```

### 第二步：复制配置文件

```bash
# 创建配置目录
mkdir -p ~/.claude/rules/common
mkdir -p ~/.claude/agents
mkdir -p ~/.claude/commands

# 复制规则（必须）
cp -r rules/common/*.md ~/.claude/rules/common/

# 复制 agents（推荐）
cp agents/*.md ~/.claude/agents/

# 复制 commands（推荐）
cp commands/*.md ~/.claude/commands/
```

### 第三步：开始对话

```bash
# 启动 Claude Code
claude
```

---

## 项目结构

```
something-claude-code/
├── README.md              # 本文件 - 项目介绍
├── CLAUDE.md              # 项目指引
├── 快速参考.md            # 命令速查表
├── 核心原则.md            # 核心开发理念
├── rules/                 # 规则集
│   ├── common/            # 通用规则
│   │   ├── coding-style.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   ├── git-workflow.md
│   │   ├── hooks.md
│   │   ├── agents.md
│   │   └── performance.md
│   ├── golang/            # Go 规则
│   ├── cpp/               # C++ 规则
│   ├── csharp/            # C# 规则
│   ├── java/              # Java 规则
│   ├── kotlin/            # Kotlin 规则
│   ├── perl/              # Perl 规则
│   ├── php/               # PHP 规则
│   ├── python/            # Python 规则
│   ├── rust/              # Rust 规则
│   ├── swift/            # Swift 规则
│   └── typescript/         # TypeScript/JavaScript 规则
├── .claude/               # Claude Code 配置
│   └── commands/           # 工作流命令
│       ├── add-language-rules.md
│       ├── database-migration.md
│       └── feature-development.md
├── .kiro/                  # Kiro 模板
│   └── steering/           # Steering 模板
│       ├── coding-style.md
│       ├── dev-mode.md
│       ├── development-workflow.md
│       ├── git-workflow.md
│       ├── golang-patterns.md
│       ├── lessons-learned.md
│       ├── patterns.md
│       ├── performance.md
│       ├── python-patterns.md
│       ├── research-mode.md
│       ├── review-mode.md
│       ├── security.md
│       ├── swift-patterns.md
│       ├── testing.md
│       ├── typescript-patterns.md
│       └── typescript-security.md
├── agents/                # Agent 定义
├── commands/              # 斜杠命令
└── skills/               # Skill 定义
```

---

## 核心概念

### 命令（Commands）

在 Claude Code 中输入 `/` 开头的内容叫「斜杠命令」，用于触发特定功能。

```
/plan        → 规划新功能
/tdd         → 测试驱动开发
/code-review → 代码审查
/build-fix   → 修复构建错误
```

### agents

agents 是专业化的 AI 助手，专门处理特定任务：

| agent | 职责 |
|-------|------|
| planner | 分析需求，制定实施计划 |
| code-reviewer | 代码质量和安全审查 |
| tdd-guide | 指导测试驱动开发 |
| security-reviewer | 漏洞检测 |
| database-reviewer | 数据库审查 |
| performance-optimizer | 性能优化 |

### skills

skills 是特定领域的知识和 workflow 定义，涵盖：

- **编程语言**：Python、Java、Go、Rust、Perl、Swift/Kotlin、C++、C#、PHP、TypeScript
- **框架**：Django、Spring Boot、Laravel、Next.js
- **工具**：Docker、PostgreSQL、ClickHouse
- **方法论**：TDD、安全审查、代码质量

### 规则（Rules）

规则是给 Claude 的永久指令，告诉它如何工作：

- `rules/common/` — 通用规则（所有语言都适用）
  - `coding-style.md` — 不可变性、文件组织、命名规范
  - `security.md` — 输入验证、秘密管理、CSRF/XSS防护
  - `testing.md` — TDD、覆盖率要求、测试类型
  - `git-workflow.md` — 提交格式、分支策略
  - `hooks.md` — Hook 配置格式
  - `performance.md` — 模型选择、Context 管理
  - `patterns.md` — 设计模式、skeleton projects
  - `agents.md` — 何时委托给 subagents
- `rules/<lang>/` — 语言特定规则（按需安装）
  - `coding-style.md` — 该语言的编码风格
  - `hooks.md` — 该语言的工具链 Hooks
  - `patterns.md` — 该语言的惯用模式
  - `security.md` — 该语言的安全实践
  - `testing.md` — 该语言的测试框架

### Steering 模板

`.kiro/steering/` 目录包含 Kiro 引擎使用的模板文件：

- **核心模板**：`coding-style`、`security`、`testing`、`patterns`、`performance`
- **模式模板**：`development-workflow`、`git-workflow`
- **上下文模板**：`dev-mode`、`research-mode`、`review-mode`、`lessons-learned`
- **语言模板**：`golang-patterns`、`python-patterns`、`swift-patterns`、`typescript-patterns`、`typescript-security`

---

## 常用命令

### 核心 workflow

| 命令 | 说明 | 使用时机 |
|------|------|---------|
| `/plan` | 规划实现步骤 | 开始新功能前 |
| `/tdd` | 测试驱动开发 | 写代码时 |
| `/code-review` | 代码审查 | 写完代码后 |
| `/build-fix` | 修复构建错误 | 构建失败时 |
| `/verify` | 运行完整验证 | 提交前 |

### 会话管理

| 命令 | 说明 |
|------|------|
| `/save-session` | 保存当前工作进度 |
| `/resume-session` | 恢复之前的工作 |
| `/checkpoint` | 标记检查点 |
| `/learn-eval` | 提取学到的东西 |

### 循环任务

| 命令 | 说明 |
|------|------|
| `/loop-start` | 启动循环任务 |
| `/loop-stop` | 停止循环任务 |

---

## 开发流程

### 1. 规划新功能

```
你: /plan 添加用户登录功能

Claude: 我来规划一下...
- 分析需求
- 识别风险
- 制定分步计划
- 等待你确认

你: yes（确认计划）
Claude: 开始实施...
```

### 2. 测试驱动开发（TDD）

```
你: /tdd

Claude: 我们开始 TDD：
1. 先写测试（会失败）
2. 再写最小代码（让测试通过）
3. 重构改进
```

### 3. 代码审查

```
你: /code-review

Claude: 我来审查代码...
- 检查安全问题
- 检查代码质量
- 给出修复建议
```

---

## 关键原则

### 不可变性（重要！）

**始终创建新对象，绝不修改现有对象。**

```javascript
// 错误
user.name = '新名字';

// 正确
const updatedUser = { ...user, name: '新名字' };
```

### 文件组织

- 多个小文件 > 少量大文件
- 典型 200-400 行，最多 800 行
- 按功能/领域组织，而非按类型

### 测试要求

**最低覆盖率：80%**

- 单元测试 — 独立函数
- 集成测试 — API、数据库
- E2E 测试 — 关键用户流程

---

## workflow process 对照表

| 场景 | 命令 |
|------|------|
| 开始新功能 | `/plan` 先规划，然后 `/tdd` |
| 写完代码 | `/code-review` |
| 构建失败 | `/build-fix` |
| 需要查文档 | `/docs <库名>` |
| 会话结束 | `/save-session` |
| 明天继续 | `/resume-session` |
| 上下文太重 | `/context-budget` |
| 提取学到的东西 | `/learn-eval` |
| 重复任务 | `/loop-start` |

---

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+U` | 删除整行 |
| `!` | 快速执行 bash 命令 |
| `@` | 搜索文件 |
| `/` | 触发斜杠命令 |
| `Shift+Enter` | 多行输入 |
| `Tab` | 切换思考显示 |
| `Esc Esc` | 中断 Claude / 恢复代码 |

---

## 安全检查清单

提交代码前必须确认：

- [ ] 无硬编码密钥（API密钥、密码、Token）
- [ ] 所有用户输入已验证
- [ ] SQL注入防护（参数化查询）
- [ ] XSS防护（净化HTML）
- [ ] CSRF保护已启用
- [ ] 认证/授权已验证
- [ ] 错误消息不泄露敏感数据

---

## 术语说明

本项目在中文语境下保留以下英文术语：

| 术语 | 说明 |
|------|------|
| agent | 专业化的 AI 助手 |
| skill | 特定领域的知识和 workflow |
| hook | 触发器，自动执行的操作 |
| workflow | 工作流程 |
| prompt | 提示词 |
| token | Token |
| model | AI 模型 |
| API | 应用程序接口 |
| CLI | 命令行工具 |
| TDD | 测试驱动开发 |
| Repository | 仓储模式 |
| DI | 依赖注入 |

---

## 故障排除

### Claude 不认识斜杠命令

确保配置文件已正确复制：

```bash
ls ~/.claude/commands/  # 应该看到很多 .md 文件
```

### 命令不工作

尝试重启 Claude Code：

```bash
# 退出当前会话
/exit

# 重新启动
claude
```

---

## 相关资源

- [Claude Code 官方文档](https://docs.claude.com)
- [ECC 原版英文文档](https://github.com/affaan-m/everything-claude-code)

---

## 项目统计

- **11** 种语言规则（C++、C#、Go、Java、Kotlin、Perl、PHP、Python、Rust、Swift、TypeScript）
- **16** 个 Steering 模板
- **3** 个工作流命令
- **6** 个通用规则

