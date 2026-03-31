---
name: verification-loop
description: "Claude Code 会话的综合验证系统"
origin: nothing-claude-code
---

# 验证循环skill

Claude Code 会话的综合验证系统。

## 何时使用

调用此skill：
- 完成功能或重大代码更改后
- 创建 PR 之前
- 当你想确保质量门通过时
- 重构之后

## 验证阶段

### 阶段 1：构建验证
```bash
# Check if project builds
npm run build 2>&1 | tail -20
# OR
pnpm build 2>&1 | tail -20
```

如果构建失败，停止并修复后再继续。

### 阶段 2：类型检查
```bash
# TypeScript projects
npx tsc --noEmit 2>&1 | head -30

# Python projects
pyright . 2>&1 | head -30
```

报告所有类型错误。修复关键错误后再继续。

### 阶段 3：Lint 检查
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

### 阶段 4：测试套件
```bash
# Run tests with coverage
npm run test -- --coverage 2>&1 | tail -50

# Check coverage threshold
# Target: 80% minimum
```

Report:
- Total tests: X
- Passed: X
- Failed: X
- Coverage: X%

### 阶段 5：安全扫描
```bash
# Check for secrets
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" . 2>/dev/null | head -10

# Check for console.log
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### 阶段 6：Diff 审查
```bash
# Show what changed
git diff --stat
git diff HEAD~1 --name-only
```

Review each changed file for:
- Unintended changes
- Missing error handling
- Potential edge cases

## 输出格式

运行所有阶段后，生成验证报告：

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

## 连续模式

对于长时间会话，每 15 分钟或重大更改后运行验证：

```markdown
Set a mental checkpoint:
- After completing each function
- After finishing a component
- Before moving to next task

Run: /verify
```

## 与钩子的集成

此skill补充 PostToolUse 钩子但提供更深入的验证。
钩子立即捕获问题；此skill提供全面审查。
