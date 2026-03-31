# 规则目录

本目录包含 Claude Code 的通用规则。

## 安装

将本目录复制到你的 Claude 配置：

```bash
mkdir -p ~/.claude/rules
cp -r something-claude-code/rules/common ~/.claude/rules/
```

## 规则文件

| 文件 | 说明 |
|------|------|
| `coding-style.md` | 编码风格：不可变性、文件组织、命名规范 |
| `security.md` | 安全规则：输入验证、秘密管理、CSRF/XSS防护 |
| `testing.md` | 测试规则：TDD、覆盖率要求、测试类型 |
| `git-workflow.md` | Git workflow：提交格式、分支策略 |
| `hooks.md` | Hook 规则：触发器类型、配置格式 |
| `agents.md` | 子agent规则：agent列表、使用时机 |
| `performance.md` | 性能规则：模型选择、上下文管理 |
| `patterns.md` | 设计模式：Repository 模式、API 响应格式、Skeleton Projects |
| `code-review.md` | 代码审查标准：审查流程、严重级别、常见问题 |
| `development-workflow.md` | 开发工作流：研究规划、TDD、代码审查流程 |

## 规则格式

每个 `.md` 文件包含：
- 核心原则说明
- 代码示例
- 最佳实践
- 常见错误

## 扩展

可以添加语言特定规则：

```
~/.claude/rules/
├── common/           # 通用规则
├── cpp/             # C++ 特定
├── csharp/          # C# 特定
├── golang/          # Go 特定
├── java/            # Java 特定
├── kotlin/          # Kotlin 特定
├── perl/            # Perl 特定
├── php/             # PHP 特定
├── python/          # Python 特定
├── rust/            # Rust 特定
├── swift/           # Swift 特定
├── typescript/       # TypeScript/JavaScript 特定
└── ...
```
