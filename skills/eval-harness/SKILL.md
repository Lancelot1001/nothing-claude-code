---
name: eval-harness
description: 用于 Claude Code 会话的形式化评估框架，实现评估驱动开发（EDD）原则
origin: nothing-claude-code
tools: Read, Write, Edit, Bash, Grep, Glob
---

# 评估工具skill

用于 Claude Code 会话的形式化评估框架，实现评估驱动开发（EDD）原则。

## 何时激活

- 为 AI 辅助workflow process设置评估驱动开发（EDD）
- 定义 Claude Code 任务完成的标准
- 使用 pass@k 指标衡量agent可靠性
- 为提示或agent更改创建回归测试套件
- 在模型版本间对agent性能进行基准测试

## 理念

评估驱动开发将评估视为"AI 开发的单元测试"：
- 在实现之前定义预期行为
- 在开发过程中持续运行评估
- 追踪每次更改的回归
- 使用 pass@k 指标进行可靠性测量

## 评估类型

### 能力评估
测试 Claude 是否能做到以前做不到的事情：
```markdown
[CAPABILITY EVAL: feature-name]
Task: Description of what Claude should accomplish
Success Criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Criterion 3
Expected Output: Description of expected result
```

### 回归评估
确保更改不会破坏现有功能：
```markdown
[REGRESSION EVAL: feature-name]
Baseline: SHA or checkpoint name
Tests:
  - existing-test-1: PASS/FAIL
  - existing-test-2: PASS/FAIL
  - existing-test-3: PASS/FAIL
Result: X/Y passed (previously Y/Y)
```

## 评分器类型

### 1. 基于代码的评分器
使用代码进行确定性检查：
```bash
# Check if file contains expected pattern
grep -q "export function handleAuth" src/auth.ts && echo "PASS" || echo "FAIL"

# Check if tests pass
npm test -- --testPathPattern="auth" && echo "PASS" || echo "FAIL"

# Check if build succeeds
npm run build && echo "PASS" || echo "FAIL"
```

### 2. 基于模型的评分器
使用 Claude 评估开放式输出：
```markdown
[MODEL GRADER PROMPT]
Evaluate the following code change:
1. Does it solve the stated problem?
2. Is it well-structured?
3. Are edge cases handled?
4. Is error handling appropriate?

Score: 1-5 (1=poor, 5=excellent)
Reasoning: [explanation]
```

### 3. 人工评分器
标记以进行人工审查：
```markdown
[HUMAN REVIEW REQUIRED]
Change: Description of what changed
Reason: Why human review is needed
Risk Level: LOW/MEDIUM/HIGH
```

## 指标

### pass@k
"在 k 次尝试中至少一次成功"
- pass@1：首次尝试成功率
- pass@3：3 次尝试内成功
- 典型目标：pass@3 > 90%

### pass^k
"所有 k 次试验都成功"
- 更高的可靠性标准
- pass^3：连续 3 次成功
- 用于关键路径

## 评估workflow process

### 1. 定义（编码之前）
```markdown
## EVAL DEFINITION: feature-xyz

### Capability Evals
1. Can create new user account
2. Can validate email format
3. Can hash password securely

### Regression Evals
1. Existing login still works
2. Session management unchanged
3. Logout flow intact

### Success Metrics
- pass@3 > 90% for capability evals
- pass^3 = 100% for regression evals
```

### 2. 实现
编写代码以通过定义的评估。

### 3. 评估
```bash
# Run capability evals
[Run each capability eval, record PASS/FAIL]

# Run regression evals
npm test -- --testPathPattern="existing"

# Generate report
```

### 4. 报告
```markdown
EVAL REPORT: feature-xyz
========================

Capability Evals:
  create-user:     PASS (pass@1)
  validate-email:  PASS (pass@2)
  hash-password:   PASS (pass@1)
  Overall:         3/3 passed

Regression Evals:
  login-flow:      PASS
  session-mgmt:    PASS
  logout-flow:     PASS
  Overall:         3/3 passed

Metrics:
  pass@1: 67% (2/3)
  pass@3: 100% (3/3)

Status: READY FOR REVIEW
```

## 集成模式

### 实现之前
```
/eval define feature-name
```
Creates eval definition file at `.claude/evals/feature-name.md`

### 实现期间
```
/eval check feature-name
```
Runs current evals and reports status

### 实现之后
```
/eval report feature-name
```
Generates full eval report

## 评估存储

Store evals in project:
```
.claude/
  evals/
    feature-xyz.md      # Eval definition
    feature-xyz.log     # Eval run history
    baseline.json       # Regression baselines
```

## 最佳实践

1. **Define evals BEFORE coding** - Forces clear thinking about success criteria
2. **Run evals frequently** - Catch regressions early
3. **Track pass@k over time** - Monitor reliability trends
4. **Use code graders when possible** - Deterministic > probabilistic
5. **Human review for security** - Never fully automate security checks
6. **Keep evals fast** - Slow evals don't get run
7. **Version evals with code** - Evals are first-class artifacts

## 示例：添加身份验证

```markdown
## EVAL: add-authentication

### Phase 1: Define (10 min)
Capability Evals:
- [ ] User can register with email/password
- [ ] User can login with valid credentials
- [ ] Invalid credentials rejected with proper error
- [ ] Sessions persist across page reloads
- [ ] Logout clears session

Regression Evals:
- [ ] Public routes still accessible
- [ ] API responses unchanged
- [ ] Database schema compatible

### Phase 2: Implement (varies)
[Write code]

### Phase 3: Evaluate
Run: /eval check add-authentication

### Phase 4: Report
EVAL REPORT: add-authentication
==============================
Capability: 5/5 passed (pass@3: 100%)
Regression: 3/3 passed (pass^3: 100%)
Status: SHIP IT
```

## 产品评估（v1.8）

当行为质量不能仅通过单元测试捕获时，使用产品评估。

### 评分器类型

1. 代码评分器（确定性断言）
2. 规则评分器（正则/模式约束）
3. 模型评分器（LLM 作为评判的评分标准）
4. 人工评分器（对模糊输出的人工裁决）

### pass@k 指导

- `pass@1`：直接可靠性
- `pass@3`：在受控重试下的实际可靠性
- `pass^3`：稳定性测试（所有 3 次运行都必须通过）

建议阈值：
- 能力评估：pass@3 >= 0.90
- 回归评估：发布关键路径的 pass^3 = 1.00

### 评估反模式

- 对已知评估示例过度拟合提示
- 仅测量快乐路径输出
- 在追逐通过率时忽略成本和延迟漂移
- 在发布门控中允许不稳定的评分器

### 最小评估产物布局

- `.claude/evals/<feature>.md` 定义
- `.claude/evals/<feature>.log` 运行历史
- `docs/releases/<version>/eval-summary.md` 发布快照
