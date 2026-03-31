# Git workflow

## 提交格式

使用约定式提交（Conventional Commits）：

```
<类型>: <描述>

[可选正文]

[可选脚注]
```

### 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（不是修复也不是新功能） |
| `perf` | 性能改进 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

### 示例

```bash
# 功能提交
git commit -m "feat(用户): 添加邮箱验证功能"

# Bug 修复
git commit -m "fix(订单): 修复计算总价时精度丢失问题"

# 文档更新
git commit -m "docs: 更新 README 安装说明"

# 重构
git commit -m "refactor(支付): 重构支付流程解耦"

# 测试
git commit -m "test(购物车): 添加结算流程测试"

# 多行提交
git commit -m "fix(api): 修复用户查询接口超时问题

- 增加超时重试机制
- 添加请求日志
- 更新错误码定义"
```

---

## 分支命名

```bash
# 功能分支
feature/user-authentication
feature/payment-integration

# Bug 修复分支
fix/login-timeout
fix/cart-calculation

# 发布分支
release/v1.2.0

# 热修复分支
hotfix/security-patch
```

---

## workflow process

### 功能开发

```bash
# 1. 从 main 创建分支
git checkout -b feature/user-authentication

# 2. 开发并提交
git commit -m "feat(auth): 添加基础登录功能"
git commit -m "feat(auth): 添加注册功能"
git commit -m "feat(auth): 添加找回密码功能"

# 3. 推送分支
git push -u origin feature/user-authentication

# 4. 创建 PR
gh pr create --title "feat(用户): 添加用户认证功能" --body "
## 功能说明
- 添加用户注册
- 添加用户登录
- 添加找回密码

## 测试计划
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] E2E 测试通过
"
```

### Code Review

```bash
# 查看 PR 差异
gh pr diff

# 评论
gh pr comment -m "建议：可以使用 const 替代 let"

# 批准
gh pr review --approve

# 请求修改
gh pr review -c -m "需要修复安全问题"
```

### 合并

```bash
# 合并前确保通过所有检查
git checkout main
git pull origin main
git merge feature/user-authentication
git push origin main

# 或通过 PR 合并
gh pr merge
```

---

## 撤销操作

### 暂存撤销

```bash
# 撤销单个文件暂存
git restore --staged file.txt

# 撤销所有暂存
git restore --staged .
```

### 提交撤销

```bash
# 修改最后一次提交（未推送）
git commit --amend -m "新的提交消息"

# 添加漏提交的文件到上次提交
git add forgotten-file.txt
git commit --amend --no-edit

# 撤销上次提交（保留更改）
git reset --soft HEAD~1

# 撤销上次提交（不保留更改）
git reset --hard HEAD~1
```

---

## 子模块和 Worktree

### Git Worktree（并行开发）

```bash
# 创建 worktree
git worktree add ../feature-branch feature-branch

# 列出 worktrees
git worktree list

# 移除 worktree
git worktree remove ../feature-branch
```

### 使用场景

- 在不同功能间切换而不丢失工作
- 并行运行多个 Claude Code 实例
- 避免分支冲突

---

## 最佳实践

### 提交粒度

- 每个提交做**一件事**
- 提交应该是**原子的**
- 提交消息应该**清晰描述做了什么**

### 提交前检查

```bash
# 查看暂存区
git status

# 查看变更
git diff --staged

# 运行测试
npm test

# 检查提交格式
npx commitlint --from HEAD~1
```

### PR 描述模板

```markdown
## 变更类型
<!-- 功能 / 修复 / 重构 / 文档 -->

## 变更说明
<!-- 清楚地描述这次变更 -->

## 变更原因
<!-- 为什么需要这个变更 -->

## 测试计划
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] E2E 测试通过
- [ ] 手动测试（如果需要）

## 截图（如果适用）
<!-- UI 变更的截图 -->

## 相关 Issue
<!-- 关联的 issue -->
```

---

## 标签管理

```bash
# 创建标签
git tag -a v1.2.0 -m "版本 1.2.0：新增支付功能"

# 推送标签
git push origin v1.2.0

# 删除本地标签
git tag -d v1.2.0

# 删除远程标签
git push origin --delete v1.2.0
```
