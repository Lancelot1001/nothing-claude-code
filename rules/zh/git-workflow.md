# Git 工作流

## 提交格式

```
<type>: <描述>

<可选的详细说明>
```

**类型**：`feat`、`fix`、`refactor`、`docs`、`test`、`chore`、`perf`、`ci`

## Pull Request 工作流

创建 PR 时：
1. 分析完整提交历史（不仅是最新提交）
2. 使用 `git diff [base-branch]...HEAD` 查看所有变更
3. 起草全面的 PR 摘要
4. 包含测试计划
5. 新分支用 `-u` 标志推送

> 完整的开发流程（规划、TDD、代码审查）见 [development-workflow.md](./development-workflow.md)。
