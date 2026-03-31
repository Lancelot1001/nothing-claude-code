---
name: git-workflow
description: Git workflow模式，包括分支策略、提交约定、merge 与 rebase 的对比、冲突解决和团队协作开发最佳实践。
origin: something-claude-code
---

# Git workflow模式

Git 版本控制、分支策略和协作开发的最佳实践。

## 何时激活

- 为新项目设置 Git workflow
- 决定分支策略（GitFlow、基于主干的开发、GitHub flow）
- 编写提交消息和 PR 描述
- 解决合并冲突
- 管理发布和版本标签
- 让新团队成员熟悉 Git 实践

## 分支策略

### GitHub Flow（简单，推荐大多数场景）

最适合持续部署和小到中型团队。

```
main (protected, always deployable)
  │
  ├── feature/user-auth      → PR → merge to main
  ├── feature/payment-flow   → PR → merge to main
  └── fix/login-bug          → PR → merge to main
```

**规则：**
- `main` 始终可部署
- 从 `main` 创建特性分支
- 准备好审查时打开 Pull Request
- 审批且 CI 通过后，合并到 `main`
- 合并后立即部署

### 基于主干的开发（高速度团队）

最适合有强 CI/CD 和特性标志的团队。

```
main (trunk)
  │
  ├── short-lived feature (1-2 days max)
  ├── short-lived feature
  └── short-lived feature
```

**规则：**
- 每个人提交到 `main` 或极短命的分支
- 特性标志隐藏未完成的工作
- 合并前 CI 必须通过
- 每天部署多次

### GitFlow（复杂，发布周期驱动）

最适合计划性发布和企业项目。

```
main (production releases)
  │
  └── develop (integration branch)
        │
        ├── feature/user-auth
        ├── feature/payment
        │
        ├── release/1.0.0    → merge to main and develop
        │
        └── hotfix/critical  → merge to main and develop
```

**规则：**
- `main` 仅包含生产就绪代码
- `develop` 是集成分支
- 特性分支从 `develop` 创建，合并回 `develop`
- 发布分支从 `develop` 创建，合并到 `main` 和 `develop`
- 热修复分支从 `main` 创建，合并到 `main` 和 `develop`

### 何时使用哪个

| 策略 | 团队规模 | 发布节奏 | 最适合 |
|------|----------|----------|--------|
| GitHub Flow | 任意 | 持续 | SaaS、Web 应用、创业公司 |
| 基于主干 | 5 人以上有经验 | 多次/天 | 高速度团队、特性标志 |
| GitFlow | 10 人以上 | 计划性 | 企业、受监管行业 |

## 提交消息

### 约定式提交格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 类型

| 类型 | 用于 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): add OAuth2 login` |
| `fix` | Bug 修复 | `fix(api): handle null response in user endpoint` |
| `docs` | 文档 | `docs(readme): update installation instructions` |
| `style` | 格式，无代码变更 | `style: fix indentation in login component` |
| `refactor` | 代码重构 | `refactor(db): extract connection pool to module` |
| `test` | 添加/更新测试 | `test(auth): add unit tests for token validation` |
| `chore` | 维护任务 | `chore(deps): update dependencies` |
| `perf` | 性能改进 | `perf(query): add index to users table` |
| `ci` | CI/CD 变更 | `ci: add PostgreSQL service to test workflow` |
| `revert` | 撤销之前的提交 | `revert: revert "feat(auth): add OAuth2 login"` |

### 好 vs 坏示例

```
# 差：模糊，无上下文
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "WIP"

# 好：清晰、具体、解释原因
git commit -m "fix(api): retry requests on 503 Service Unavailable

The external API occasionally returns 503 errors during peak hours.
Added exponential backoff retry logic with max 3 attempts.

Closes #123"
```

### 提交消息模板

在仓库根目录创建 `.gitmessage`：

```
# <type>(<scope>): <subject>
# # Types: feat, fix, docs, style, refactor, test, chore, perf, ci, revert
# # Scope: api, ui, db, auth, etc.
# # Subject: imperative mood, no period, max 50 chars
#
# [optional body] - explain why, not what
# [optional footer] - Breaking changes, closes #issue
```

启用：`git config commit.template .gitmessage`

## Merge vs Rebase

### Merge（保留历史）

```bash
# 创建一个合并提交
git checkout main
git merge feature/user-auth

# 结果：
# *   merge commit
# |\
# | * feature commits
# |/
# * main commits
```

**使用场景：**
- 将特性分支合并到 `main`
- 你想保留精确历史
- 多人在该分支上工作
- 该分支已推送且其他人可能已基于它工作

### Rebase（线性历史）

```bash
# 将特性提交重写到目标分支
git checkout feature/user-auth
git rebase main

# 结果：
# * feature commits (rewritten)
# * main commits
```

**使用场景：**
- 用最新的 `main` 更新你的本地特性分支
- 你想要线性、干净的历史
- 该分支仅在本地（未推送）
- 你是在该分支上唯一工作的人

### Rebase workflow

```bash
# 用最新的 main 更新特性分支（在 PR 前）
git checkout feature/user-auth
git fetch origin
git rebase origin/main

# 解决任何冲突
# 测试仍应通过

# 强制推送（仅当你唯一贡献者时）
git push --force-with-lease origin feature/user-auth
```

### 何时不使用 Rebase

```
# 切勿 rebase 以下分支：
- 已推送到共享仓库的分支
- 其他人已基于其工作的分支
- 受保护分支（main、develop）
- 已合并的分支

# 原因：Rebase 重写历史，会破坏其他人的工作
```

## Pull Request workflow

### PR 标题格式

```
<type>(<scope>): <description>

示例：
feat(auth): add SSO support for enterprise users
fix(api): resolve race condition in order processing
docs(api): add OpenAPI specification for v2 endpoints
```

### PR 描述模板

```markdown
## 是什么

简要描述此 PR 做什么。

## 为什么

解释动机和背景。

## 如何

值得强调的关键实现细节。

## 测试

- [ ] 单元测试已添加/更新
- [ ] 集成测试已添加/更新
- [ ] 已执行手动测试

## 截图（如适用）

UI 变更的前后截图。

## 检查清单

- [ ] 代码遵循项目风格指南
- [ ] 已完成自审
- [ ] 为复杂逻辑添加了注释
- [ ] 文档已更新
- [ ] 无新警告引入
- [ ] 测试在本地通过
- [ ] 相关 issues 已关联

Closes #123
```

### 代码审查清单

**对于审查者：**

- [ ] 代码是否解决了声明的问题？
- [ ] 有未处理的边界情况吗？
- [ ] 代码可读且可维护吗？
- [ ] 有足够的测试吗？
- [ ] 有安全问题吗？
- [ ] 提交历史干净吗（需要时压缩）？

**对于作者：**

- [ ] 请求审查前已完成自审
- [ ] CI 通过（测试、lint、类型检查）
- [ ] PR 大小合理（理想 <500 行）
- [ ] 关联单个特性/修复
- [ ] 描述清楚解释变更

## 冲突解决

### 识别冲突

```bash
# 合并前检查冲突
git checkout main
git merge feature/user-auth --no-commit --no-ff

# 如果有冲突，Git 会显示：
# CONFLICT (content): Merge conflict in src/auth/login.ts
# Automatic merge failed; fix conflicts and then commit the result.
```

### 解决冲突

```bash
# 查看冲突文件
git status

# 在文件中查看冲突标记
# <<<<<<< HEAD
# content from main
# =======
# content from feature branch
# >>>>>>> feature/user-auth

# 选项 1：手动解决
# 编辑文件，移除标记，保留正确内容

# 选项 2：使用合并工具
git mergetool

# 选项 3：接受某一端
git checkout --ours src/auth/login.ts    # 保留 main 版本
git checkout --theirs src/auth/login.ts  # 保留特性分支版本

# 解决后，暂存并提交
git add src/auth/login.ts
git commit
```

### 冲突预防策略

```bash
# 1. 保持特性分支小且短命
# 2. 频繁 rebase 到 main
git checkout feature/user-auth
git fetch origin
git rebase origin/main

# 3. 与团队沟通触碰共享文件
# 4. 使用特性标志而非长命分支
# 5. 及时审查和合并 PR
```

## 分支管理

### 命名约定

```
# 特性分支
feature/user-authentication
feature/JIRA-123-payment-integration

# Bug 修复
fix/login-redirect-loop
fix/456-null-pointer-exception

# 热修复（生产问题）
hotfix/critical-security-patch
hotfix/database-connection-leak

# 发布
release/1.2.0
release/2024-01-hotfix

# 实验/概念验证
experiment/new-caching-strategy
poc/graphql-migration
```

### 分支清理

```bash
# 删除已合并的本地分支
git branch --merged main | grep -v "^\*\|main" | xargs -n 1 git branch -d

# 删除已删除远程分支的远程追踪引用
git fetch -p

# 删除本地分支
git branch -d feature/user-auth  # 安全删除（仅在已合并时）
git branch -D feature/user-auth  # 强制删除

# 删除远程分支
git push origin --delete feature/user-auth
```

### Stash workflow

```bash
# 保存进行中的工作
git stash push -m "WIP: user authentication"

# 列出 stash
git stash list

# 应用最近的 stash
git stash pop

# 应用特定 stash
git stash apply stash@{2}

# 删除 stash
git stash drop stash@{0}
```

## 发布管理

### 语义化版本

```
MAJOR.MINOR.PATCH

MAJOR：破坏性变更
MINOR：新功能，向后兼容
PATCH：Bug 修复，向后兼容

示例：
1.0.0 → 1.0.1 (patch: bug 修复)
1.0.1 → 1.1.0 (minor: 新功能)
1.1.0 → 2.0.0 (major: 破坏性变更)
```

### 创建发布

```bash
# 创建注解标签
git tag -a v1.2.0 -m "Release v1.2.0

Features:
- Add user authentication
- Implement password reset

Fixes:
- Resolve login redirect issue

Breaking Changes:
- None"

# 推送标签到远程
git push origin v1.2.0

# 列出标签
git tag -l

# 删除标签
git tag -d v1.2.0
git push origin --delete v1.2.0
```

### 生成变更日志

```bash
# 从提交生成变更日志
git log v1.1.0..v1.2.0 --oneline --no-merges

# 或使用 conventional-changelog
npx conventional-changelog -i CHANGELOG.md -s
```

## Git 配置

### 必要配置

```bash
# 用户身份
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 默认分支名
git config --global init.defaultBranch main

# 拉取行为（rebase 而非 merge）
git config --global pull.rebase true

# 推送行为（仅推送当前分支）
git config --global push.default current

# 自动纠正拼写错误
git config --global help.autocorrect 1

# 更好的 diff 算法
git config --global diff.algorithm histogram

# 彩色输出
git config --global color.ui auto
```

### 有用的别名

```bash
# 添加到 ~/.gitconfig
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --oneline --graph --all
    amend = commit --amend --no-edit
    wip = commit -m "WIP"
    undo = reset --soft HEAD~1
    contributors = shortlog -sn
```

### Gitignore 模式

```gitignore
# 依赖
node_modules/
vendor/

# 构建输出
dist/
build/
*.o
*.exe

# 环境文件
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS 文件
.DS_Store
Thumbs.db

# 日志
*.log
logs/

# 测试覆盖率
coverage/

# 缓存
.cache/
*.tsbuildinfo
```

## 常见workflow

### 开始新特性

```bash
# 1. 更新 main 分支
git checkout main
git pull origin main

# 2. 创建特性分支
git checkout -b feature/user-auth

# 3. 编写变更并提交
git add .
git commit -m "feat(auth): implement OAuth2 login"

# 4. 推送到远程
git push -u origin feature/user-auth

# 5. 在 GitHub/GitLab 创建 Pull Request
```

### 用新变更更新 PR

```bash
# 1. 进行额外变更
git add .
git commit -m "feat(auth): add error handling"

# 2. 推送更新
git push origin feature/user-auth
```

### 与上游同步 Fork

```bash
# 1. 添加上游远程（一次）
git remote add upstream https://github.com/original/repo.git

# 2. 获取上游
git fetch upstream

# 3. 将 upstream/main 合并到你的 main
git checkout main
git merge upstream/main

# 4. 推送到你的 fork
git push origin main
```

### 撤销错误

```bash
# 撤销上次提交（保留变更）
git reset --soft HEAD~1

# 撤销上次提交（丢弃变更）
git reset --hard HEAD~1

# 撤销已推送到远程的上次提交
git revert HEAD
git push origin main

# 撤销特定文件变更
git checkout HEAD -- path/to/file

# 修复上次提交消息
git commit --amend -m "New message"

# 将遗忘的文件添加到上次提交
git add forgotten-file
git commit --amend --no-edit
```

## Git Hooks

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 运行 linting
npm run lint || exit 1

# 运行测试
npm test || exit 1

# 检查密钥
if git diff --cached | grep -E '(password|api_key|secret)'; then
    echo "Possible secret detected. Commit aborted."
    exit 1
fi
```

### Pre-Push Hook

```bash
#!/bin/bash
# .git/hooks/pre-push

# 运行完整测试套件
npm run test:all || exit 1

# 检查 console.log 语句
if git diff origin/main | grep -E 'console\.log'; then
    echo "Remove console.log statements before pushing."
    exit 1
fi
```

## 反模式

```
# 差：直接提交到 main
git checkout main
git commit -m "fix bug"

# 好：使用特性分支和 PR

# 差：提交密钥
git add .env  # 包含 API 密钥

# 好：添加到 .gitignore，使用环境变量

# 差：巨型 PR（1000+ 行）
# 好：拆分为更小、聚焦的 PR

# 差："Update" 提交消息
git commit -m "update"
git commit -m "fix"

# 好：描述性消息
git commit -m "fix(auth): resolve redirect loop after login"

# 差：重写公共历史
git push --force origin main

# 好：对公共分支使用 revert
git revert HEAD

# 差：长命特性分支（数周/数月）
# 好：保持分支短（数天），频繁 rebase

# 差：提交生成的文件
git add dist/
git add node_modules/

# 好：添加到 .gitignore
```

## 快速参考

| 任务 | 命令 |
|------|------|
| 创建分支 | `git checkout -b feature/name` |
| 切换分支 | `git checkout branch-name` |
| 删除分支 | `git branch -d branch-name` |
| 合并分支 | `git merge branch-name` |
| Rebase 分支 | `git rebase main` |
| 查看历史 | `git log --oneline --graph` |
| 查看变更 | `git diff` |
| 暂存变更 | `git add .` 或 `git add -p` |
| 提交 | `git commit -m "message"` |
| 推送 | `git push origin branch-name` |
| 拉取 | `git pull origin branch-name` |
| Stash | `git stash push -m "message"` |
| 撤销上次提交 | `git reset --soft HEAD~1` |
| Revert 提交 | `git revert HEAD` |
