# 我的 Claude Code 操作指南

这是我个人的 Claude Code 配置和操作指南，基于 Everything Claude Code (ECC) 汉化而来。

## 项目结构

```
nothing-claude-code/
├── README.md              # 项目介绍
├── CLAUDE.md              # 本文件 - 项目指引
├── 快速参考.md            # 命令速查表
├── 核心原则.md            # 核心开发理念
├── rules/                 # 规则集
│   ├── common/           # 通用规则
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── hooks.md
│   │   ├── patterns.md
│   │   ├── performance.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   └── agents.md
│   ├── cpp/              # C++ 规则
│   ├── csharp/           # C# 规则
│   ├── golang/           # Go 规则
│   ├── java/             # Java 规则
│   ├── kotlin/           # Kotlin 规则
│   ├── perl/             # Perl 规则
│   ├── php/              # PHP 规则
│   ├── python/           # Python 规则
│   ├── rust/             # Rust 规则
│   ├── swift/            # Swift 规则
│   └── typescript/       # TypeScript/JavaScript 规则
├── .claude/              # Claude Code 配置
│   └── commands/         # 工作流命令
├── .kiro/                # Kiro 模板
│   └── steering/          # Steering 模板
└── agents/              # Agent 定义（英文）
```

## 常用命令

| 场景 | 命令 |
|------|------|
| 开始新功能 | `/plan` 先规划，再 `/tdd` 测试驱动 |
| 写完代码 | `/code-review` 代码审查 |
| 构建失败 | `/build-fix` 自动修复 |
| 需要文档 | `/docs <库名>` 查文档 |
| 会话结束 | `/save-session` 或 `/learn-eval` |
| 继续工作 | `/resume-session` 恢复会话 |
| 上下文太重 | `/context-budget` 分析后 `/checkpoint` |
| 提取学到的东西 | `/learn-eval` 然后 `/evolve` |
| 重复任务 | `/loop-start` 启动循环 |

## 开发流程

1. **规划** — 使用 `/plan` 识别依赖和风险，分阶段进行
2. **TDD** — 使用 `/tdd`，先写测试，再实现
3. **审查** — 使用 `/code-review` 立即审查，解决严重/高风险问题
4. **保存** — 将知识保存到正确位置
5. **提交** — 遵循约定式提交格式

## 安全第一

- **绝不**硬编码密钥、密码、Token
- 所有用户输入必须验证
- SQL注入防护（参数化查询）
- XSS防护（HTML净化）
- CSRF保护
- 错误消息不泄露敏感数据

## 核心原则

1. **agent优先** — 领域任务委托给专业agent
2. **测试驱动** — 先写测试，80%+覆盖率
3. **安全第一** — 不在安全问题上妥协
4. **不可变性** — 创建新对象，不修改现有对象
5. **先规划后执行** — 复杂功能先规划再写代码

## 更多信息

- [快速参考](./快速参考.md) — 完整命令列表
- [核心原则](./核心原则.md) — 详细开发理念
