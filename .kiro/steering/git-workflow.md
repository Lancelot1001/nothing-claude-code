---
inclusion: auto
description: Git workflow guidelines for conventional commits and pull request process
---

# Git 工作流

## Commit 消息格式

```
<type>: <description>

<optional body>
```

类型：feat、fix、refactor、docs、test、chore、perf、ci

注：归因通过 ~/.claude/settings.json 全局禁用。

## Pull Request 工作流

创建 PR 时：
1. 分析完整提交历史（而非仅最新提交）
2. 使用 `git diff [base-branch]...HEAD` 查看所有变更
3. 起草全面的 PR 总结
4. 包含带 TODOs 的测试计划
5. 新分支使用 `-u` 标志推送

> 完整的开发流程（规划、TDD、代码审查）参见开发工作流规则。
