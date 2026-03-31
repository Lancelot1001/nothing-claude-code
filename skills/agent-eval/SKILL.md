---
name: agent-eval
description: 对编码智能体（Claude Code、Aider、Codex等）在自定义任务上进行头对头比较，通过通过率、成本、时间和一致性指标进行评估
origin: something-claude-code
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Agent Eval skill

一款轻量级 CLI 工具，用于在可复现的任务上对编码智能体进行头对头比较。每个"哪个编码智能体最好？"的比较都是凭感觉进行的——这款工具将其系统化。

## 何时激活

- 在自己的代码库上对编码智能体（Claude Code、Aider、Codex等）进行比较
- 在采用新工具或新模型前评估智能体性能
- 当智能体更新模型或工具时运行回归检查
- 为团队提供有数据支撑的智能体选择决策

## 安装

> **注意：** 在审查源码后，从其仓库安装 agent-eval。

## 核心概念

### YAML 任务定义

以声明方式定义任务。每个任务指定要做什么、涉及哪些文件，以及如何判断成功：

```yaml
name: add-retry-logic
description: Add exponential backoff retry to the HTTP client
repo: ./my-project
files:
  - src/http_client.py
prompt: |
  Add retry logic with exponential backoff to all HTTP requests.
  Max 3 retries. Initial delay 1s, max delay 30s.
judge:
  - type: pytest
    command: pytest tests/test_http_client.py -v
  - type: grep
    pattern: "exponential_backoff|retry"
    files: src/http_client.py
commit: "abc1234"  # pin to specific commit for reproducibility
```

### Git Worktree 隔离

每次智能体运行都使用独立的 git worktree——无需 Docker。这提供了可复现的隔离，确保智能体之间不会相互干扰或破坏主仓库。

### 收集的指标

| 指标 | 衡量内容 |
|--------|-----------------|
| 通过率 | 智能体产生的代码是否通过评判？ |
| 成本 | 每个任务的 API 支出（如有） |
| 时间 | 完成的挂钟秒数 |
| 一致性 | 重复运行中的通过率（例如 3/3 = 100%） |

## workflow process

### 1. 定义任务

创建 `tasks/` 目录，每个任务一个 YAML 文件：

```bash
mkdir tasks
# Write task definitions (see template above)
```

### 2. 运行智能体

针对你的任务执行智能体：

```bash
agent-eval run --task tasks/add-retry-logic.yaml --agent claude-code --agent aider --runs 3
```

每次运行：
1. 从指定提交创建新的 git worktree
2. 将提示词交给智能体
3. 运行评判标准
4. 记录通过/失败、成本和时间

### 3. 比较结果

生成比较报告：

```bash
agent-eval report --format table
```

```
Task: add-retry-logic (3 runs each)
┌──────────────┬───────────┬────────┬────────┬─────────────┐
│ Agent        │ Pass Rate │ Cost   │ Time   │ Consistency │
├──────────────┼───────────┼────────┼────────┼─────────────┤
│ claude-code  │ 3/3       │ $0.12  │ 45s    │ 100%        │
│ aider        │ 2/3       │ $0.08  │ 38s    │  67%        │
└──────────────┴───────────┴────────┴────────┴─────────────┘
```

## 评判类型

### 基于代码（确定性）

```yaml
judge:
  - type: pytest
    command: pytest tests/ -v
  - type: command
    command: npm run build
```

### 基于模式

```yaml
judge:
  - type: grep
    pattern: "class.*Retry"
    files: src/**/*.py
```

### 基于模型（LLM 作为评判）

```yaml
judge:
  - type: llm
    prompt: |
      Does this implementation correctly handle exponential backoff?
      Check for: max retries, increasing delays, jitter.
```

## 最佳实践

- **从 3-5 个任务开始**——代表你的实际工作负载，而非玩具示例
- **每个智能体至少运行 3 次试验**——捕捉方差，智能体是非确定性的
- **在任务 YAML 中固定提交**——使结果在数天/数周内可复现
- **每个任务至少包含一个确定性评判**（测试、构建）——LLM 评判会增加噪音
- **同时跟踪成本和通过率**——95% 的智能体成本是 10 倍可能不是正确选择
- **对任务定义进行版本管理**——它们是测试固件，像代码一样对待

## 链接

- 仓库：[github.com/joaquinhuigomez/agent-eval](https://github.com/joaquinhuigomez/agent-eval)
