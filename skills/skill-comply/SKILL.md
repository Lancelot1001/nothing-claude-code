---
name: skill-comply
description: 可视化skill、规则和agent定义是否被真正遵循 — 在 3 个提示严格级别自动生成场景、运行agent、对行为序列分类，并报告带有完整工具调用时间线的合规率。
origin: something-claude-code
tools: Read, Bash
---

# skill-comply：自动化合规性测量

通过以下方式衡量编码agent是否真正遵循skill、规则或agent定义：
1. 从任意 .md 文件自动生成预期行为序列（规范）
2. 自动生成严格程度递减的场景（支持性 → 中立 → 竞争）
3. 运行 `claude -p` 并通过 stream-json 捕获工具调用追踪
4. 使用 LLM（而非正则表达式）对工具调用进行规范步骤分类
5. 确定性地检查时间顺序
6. 生成包含规范、提示和时间线的自包含报告

## 支持的目标

- **skill**（`skills/*/SKILL.md`）：workflowskill，如 search-first、TDD 指南
- **规则**（`rules/common/*.md`）：强制性规则，如 testing.md、security.md、git-workflow.md
- **agent定义**（`agents/*.md`）：agent是否在预期时被调用（内部workflow验证尚未支持）

## 何时激活

- 用户运行 `/skill-comply <path>`
- 用户问"这条规则是否真的被遵循了？"
- 添加新规则/skill后，验证agent合规性
- 作为质量维护的一部分定期运行

## 使用方法

```bash
# 完整运行
uv run python -m scripts.run ~/.claude/rules/common/testing.md

# 试运行（无成本，仅生成规范和场景）
uv run python -m scripts.run --dry-run ~/.claude/skills/search-first/SKILL.md

# 自定义模型
uv run python -m scripts.run --gen-model haiku --model sonnet <path>
```

## 核心概念：提示独立性

衡量即使提示没有明确支持时，skill/规则是否被遵循。

## 报告内容

报告是自包含的，包含：
1. 预期行为序列（自动生成的规范）
2. 场景提示（在每个严格级别询问的内容）
3. 每个场景的合规分数
4. 带有 LLM 分类标签的工具调用时间线

### 高级功能（可选）

对于熟悉钩子的用户，报告还包含对低合规步骤的钩子提升建议。这是信息性的 — 主要价值在于合规性可见性本身。
