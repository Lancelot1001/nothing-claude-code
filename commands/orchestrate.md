---
description: 多agentworkflow process的顺序和 tmux/worktree 编排指导。
---

# Orchestrate 命令

复杂任务的顺序agentworkflow process。

## 使用方法

`/orchestrate [workflow类型] [任务描述]`

## workflow类型

### feature
完整功能实现workflow process：
```
planner -> tdd-guide -> code-reviewer -> security-reviewer
```

### bugfix
错误调查和修复workflow process：
```
planner -> tdd-guide -> code-reviewer
```

### refactor
安全重构workflow process：
```
architect -> code-reviewer -> tdd-guide
```

### security
安全重点审查：
```
security-reviewer -> code-reviewer -> architect
```

## 执行模式

对于workflow process中的每个agent：

1. **调用agent**，包含前一个agent的上下文
2. **收集输出**作为结构化交接文档
3. **传递给**链中的下一个agent
4. **聚合结果**到最终报告

## 交接文档格式

agent之间创建交接文档：

```markdown
## 交接： [上一个agent] -> [下一个agent]

### 上下文
[完成内容的摘要]

### 发现
[关键发现或决策]

### 修改的文件
[触及的文件列表]

### 开放问题
[下一个agent需要解决的项目]

### 建议
[建议的后续步骤]
```

## 示例：功能workflow process

```
/orchestrate feature "添加用户认证"
```

执行：

1. **Planner agent**
   - 分析需求
   - 创建实施计划
   - 识别依赖
   - 输出：`交接：planner -> tdd-guide`

2. **TDD Guide agent**
   - 读取 planner 交接
   - 先写测试
   - 实现以通过测试
   - 输出：`交接：tdd-guide -> code-reviewer`

3. **Code Reviewer agent**
   - 审查实现
   - 检查问题
   - 建议改进
   - 输出：`交接：code-reviewer -> security-reviewer`

4. **Security Reviewer agent**
   - 安全审计
   - 漏洞检查
   - 最终批准
   - 输出：最终报告

## 最终报告格式

```
编排报告
====================
workflow process：feature
任务：添加用户认证
agent：planner -> tdd-guide -> code-reviewer -> security-reviewer

摘要
-------
[一段摘要]

agent输出
-------------
Planner：[摘要]
TDD Guide：[摘要]
Code Reviewer：[摘要]
Security Reviewer：[摘要]

修改的文件
-------------
[所有修改文件的列表]

测试结果
------------
[测试通过/失败摘要]

安全状态
---------------
[安全发现]

建议
--------------
[发布 / 需要工作 / 阻塞]
```

## 并行执行

对于独立检查，并行运行agent：

```markdown
### 并行阶段
同时运行：
- code-reviewer（质量）
- security-reviewer（安全）
- architect（设计）

### 合并结果
将输出合并为单一报告
```

对于需要独立 git worktree 的外部 tmux-pane 工作者，使用 `node scripts/orchestrate-worktrees.js plan.json --execute`。内置编排模式保持在进程内；辅助脚本用于长时间运行或跨 harness 的会话。

当工作者需要查看主 checkout 中的脏文件或未跟踪的本地文件时，将 `seedPaths` 添加到计划文件。ECC 仅在 `git worktree add` 之后将这些选定路径覆盖到每个工作者 worktree 中，保持分支隔离的同时仍暴露进行中的本地脚本、计划或文档。

```json
{
  "sessionName": "workflow-e2e",
  "seedPaths": [
    "scripts/orchestrate-worktrees.js",
    "scripts/lib/tmux-worktree-orchestrator.js",
    ".claude/plan/workflow-e2e-test.json"
  ],
  "workers": [
    { "name": "docs", "task": "更新编排文档。" }
  ]
}
```

要导出实时 tmux/worktree 会话的控制平面快照，运行：

```bash
node scripts/orchestration-status.js .claude/plan/workflow-visual-proof.json
```

快照包括会话活动、tmux pane 元数据、工作者状态、目标、种子覆盖和最近交接摘要，采用 JSON 格式。

## 操作员指挥中心交接

当workflow跨越多个会话、worktree 或 tmux pane 时，在最终交接中附加控制平面块：

```markdown
控制平面
-------------
会话：
- 活动会话 ID 或别名
- 每个活动工作者的分支 + worktree 路径
- tmux pane 或分离会话名称（如果适用）

差异：
- git status 摘要
- 触及文件的 git diff --stat
- 合并/冲突风险说明

批准：
- 待处理用户批准
- 等待确认的阻止步骤

遥测：
- 最后活动时间戳或空闲信号
- 预计 token 或成本偏差
- hooks 或审查者引发的策略事件
```

这使 planner、实施者、审查者和循环工作者从操作员界面都能清晰可见。

## 参数

$ARGUMENTS：
- `feature <描述>` - 完整功能workflow process
- `bugfix <描述>` - Bug 修复workflow process
- `refactor <描述>` - 重构workflow process
- `security <描述>` - 安全审查workflow process
- `custom <agent> <描述>` - 自定义agent序列

## 自定义workflow process示例

```
/orchestrate custom "architect,tdd-guide,code-reviewer" "重新设计缓存层"
```

## 提示

1. **复杂功能从 planner 开始**
2. **合并前始终包含 code-reviewer**
3. **认证/支付/PII 使用 security-reviewer**
4. **保持交接简洁** - 专注于下一个agent需要的内容
5. **需要时间隔运行验证**
