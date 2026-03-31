# 中文规则集

本目录包含完整的中文 Claude Code 规则集，安装后可让 Claude Code 完全使用中文思考和回复。

## 安装

```bash
# 创建目录
mkdir -p ~/.claude/rules/zh

# 复制所有中文规则
cp *.md ~/.claude/rules/zh/
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `coding-style.md` | 编码风格：不可变性、文件组织、命名规范 |
| `security.md` | 安全规范：输入验证、秘密管理、注入防护 |
| `testing.md` | 测试要求：TDD、覆盖率要求、测试类型 |
| `git-workflow.md` | Git 工作流：提交格式、分支策略 |
| `hooks.md` | Hook 配置格式 |
| `agents.md` | Agent 编排指南 |
| `patterns.md` | 设计模式、骨架项目 |
| `performance.md` | 性能优化：上下文管理、模型选择 |
| `development-workflow.md` | 开发流程：研究、规划、TDD、审查 |

## 与英文规则的关系

- `rules/common/` — 英文规则，给 Claude Code 的默认指令
- `rules/zh/` — 中文规则，中文项目建议安装

两者可以同时安装，Claude 会根据项目语言自动选择。
