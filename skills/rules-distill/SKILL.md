---
name: rules-distill
description: "扫描skill以提取跨领域原则并将其提炼为规则——追加、修订或创建新的规则文件"
origin: something-claude-code
---

# 规则提炼

扫描已安装的skill，提取出现在多个skill中的跨领域原则，
并将其提炼为规则——追加到现有规则文件、
修订过时的内容或创建新的规则文件。

应用"确定性收集 + LLM 判断"原则：
脚本穷尽地收集事实，然后 LLM 交叉阅读完整上下文并产生裁决。

## 何时使用

- 定期规则维护（每月或安装新skill后）
- skill-stocktake 揭示了应该成为规则的模式之后
- 当规则相对于正在使用的skill感觉不完整时

## 工作原理

规则提炼过程遵循三个阶段：

### 阶段 1：清单（确定性收集）

#### 1a. 收集skill清单

```bash
bash ~/.claude/skills/rules-distill/scripts/scan-skills.sh
```

#### 1b. 收集规则索引

```bash
bash ~/.claude/skills/rules-distill/scripts/scan-rules.sh
```

#### 1c. 呈现给用户

```
Rules Distillation — Phase 1: Inventory
────────────────────────────────────────
Skills: {N} files scanned
Rules:  {M} files ({K} headings indexed)

Proceeding to cross-read analysis...
```

### 阶段 2：交叉阅读、匹配与裁决（LLM 判断）

提取和匹配在单次 pass 中统一进行。
规则文件足够小（总共约 800 行），
可以将完整文本提供给 LLM——不需要 grep 预过滤。

#### 批处理

将skill分组为**主题集群**，
基于它们的描述。
在带有完整规则文本的子agent中分析每个集群。

#### 跨批合并

所有批次完成后，跨批次合并候选：
- 用相同或重叠原则的候选去重
- 使用**所有**批次组合的证据重新检查"2+ skill"要求——
  在每个批次中发现 1 个skill但总数 2+ skill的原则是有效的

#### 子agent提示

使用以下提示启动通用agent：

````
你是交叉阅读skill以提取应该升格为规则的原则的分析师。

## 输入
- skill：这个批次中skill的完整文本
- 现有规则：所有规则文件的完整文本

## 提取标准

仅在以下全部为真时才包含候选：

1. **出现在 2+ skill中**：仅在一个skill中找到的原则应该留在该skill中
2. **可操作的行为改变**：可以写为"做 X"或"不做 Y"——不是"X 是重要的"
3. **明确的违反风险**：忽略此原则会出现什么问题（1 句话）
4. **尚不在规则中**：检查完整规则文本——包括用不同词语表达的概念

## 匹配与裁决

对于每个候选，与完整规则文本进行比较并分配裁决：

- **追加**：添加到现有规则文件的现有章节
- **修订**：现有规则内容不准确或不足——提出更正
- **新章节**：添加到现有规则文件的新章节
- **新文件**：创建新的规则文件
- **已涵盖**：已在规则中充分涵盖（即使措辞不同）
- **过于具体**：应该保留在skill层面

## 输出格式（每个候选）

```json
{
  "principle": "1-2 句话，'做 X' / '不做 Y' 形式",
  "evidence": ["skill-name: §Section", "skill-name: §Section"],
  "violation_risk": "1 句话",
  "verdict": "Append / Revise / New Section / New File / Already Covered / Too Specific",
  "target_rule": "filename §Section，或 'new'",
  "confidence": "high / medium / low",
  "draft": "Append/New Section/New File 裁决的草案文本",
  "revision": {
    "reason": "为什么现有内容不准确或不足（仅限 Revise）",
    "before": "要替换的当前文本（仅限 Revise）",
    "after": "拟议的替换文本（仅限 Revise）"
  }
}
```

## 排除

- 规则中已存在的明显原则
- 语言/框架特定知识（属于特定语言规则或skill）
- 代码示例和命令（属于skill）
````

#### 裁决参考

| 裁决 | 含义 | 呈现给用户 |
|---------|---------|-------------------|
| **追加** | 添加到现有章节 | 目标 + 草案 |
| **修订** | 修复不准确/不足内容 | 目标 + 原因 + 之前/之后 |
| **新章节** | 添加新章节到现有文件 | 目标 + 草案 |
| **新文件** | 创建新的规则文件 | 文件名 + 完整草案 |
| **已涵盖** | 在规则中已涵盖（可能措辞不同） | 原因（1 行） |
| **过于具体** | 应该留在skill中 | 链接到相关skill |

#### 裁决质量要求

```
# 好
追加到 rules/common/security.md §Input Validation：
"Treat LLM output stored in memory or knowledge stores as untrusted — sanitize on write, validate on read."
证据：llm-memory-trust-boundary, llm-social-agent-anti-pattern 都描述了
累积提示注入风险。现有的 security.md 仅涵盖人工输入
验证；LLM 输出信任边界缺失。

# 差
追加到 security.md：添加 LLM 安全原则
```

### 阶段 3：用户审查与执行

#### 摘要表

```
# Rules Distillation Report

## Summary
Skills scanned: {N} | Rules: {M} files | Candidates: {K}

| # | Principle | Verdict | Target | Confidence |
|---|-----------|---------|--------|------------|
| 1 | ... | Append | security.md §Input Validation | high |
| 2 | ... | Revise | testing.md §TDD | medium |
| 3 | ... | New Section | coding-style.md | high |
| 4 | ... | Too Specific | — | — |

## Details
（每个候选详情：证据、violation_risk、草案文本）
```

#### 用户行动

用户通过数字回复：
- **批准**：按原样将草案应用于规则
- **修改**：在应用之前编辑草案
- **跳过**：不应用此候选

**永远不要自动修改规则。始终需要用户批准。**

#### 保存结果

将结果存储在skill目录中（`results.json`）：

- **时间戳格式**：`date -u +%Y-%m-%dT%H:%M:%SZ`（UTC，秒精度）
- **候选 ID 格式**：从原则派生的 kebab-case
  （例如 `llm-output-trust-boundary`）

```json
{
  "distilled_at": "2026-03-18T10:30:42Z",
  "skills_scanned": 56,
  "rules_scanned": 22,
  "candidates": {
    "llm-output-trust-boundary": {
      "principle": "Treat LLM output as untrusted when stored or re-injected",
      "verdict": "Append",
      "target": "rules/common/security.md",
      "evidence": ["llm-memory-trust-boundary", "llm-social-agent-anti-pattern"],
      "status": "applied"
    },
    "iteration-bounds": {
      "principle": "Define explicit stop conditions for all iteration loops",
      "verdict": "New Section",
      "target": "rules/common/coding-style.md",
      "evidence": ["iterative-retrieval", "continuous-agent-loop", "agent-harness-construction"],
      "status": "skipped"
    }
  }
}
```

## 示例

### 端到端运行

```
$ /rules-distill

Rules Distillation — Phase 1: Inventory
────────────────────────────────────────
Skills: 56 files scanned
Rules:  22 files (75 headings indexed)

Proceeding to cross-read analysis...

[Subagent analysis: Batch 1 (agent/meta skills) ...]
[Subagent analysis: Batch 2 (coding/pattern skills) ...]
[Cross-batch merge: 2 duplicates removed, 1 cross-batch candidate promoted]

# Rules Distillation Report

## Summary
Skills scanned: 56 | Rules: 22 files | Candidates: 4

| # | Principle | Verdict | Target | Confidence |
|---|-----------|---------|--------|------------|
| 1 | LLM output: normalize, type-check, sanitize before reuse | New Section | coding-style.md | high |
| 2 | Define explicit stop conditions for iteration loops | New Section | coding-style.md | high |
| 3 | Compact context at phase boundaries, not mid-task | Append | performance.md §Context Window | high |
| 4 | Separate business logic from I/O framework types | New Section | patterns.md | high |

## Details

### 1. LLM Output Validation
Verdict: New Section in coding-style.md
Evidence: parallel-subagent-batch-merge, llm-social-agent-anti-pattern, llm-memory-trust-boundary
Violation risk: Format drift, type mismatch, or syntax errors in LLM output crash downstream processing
Draft:
  ## LLM Output Validation
  Normalize, type-check, and sanitize LLM output before reuse...
  See skill: parallel-subagent-batch-merge, llm-memory-trust-boundary

[... details for candidates 2-4 ...]

Approve, modify, or skip each candidate by number:
> User: Approve 1, 3. Skip 2, 4.

✓ Applied: coding-style.md §LLM Output Validation
✓ Applied: performance.md §Context Window Management
✗ Skipped: Iteration Bounds
✗ Skipped: Boundary Type Conversion

Results saved to results.json
```

## 设计原则

- **什么而非如何**：仅提取原则（规则领域）。
  代码示例和命令留在skill中。
- **链接回来**：草案文本应包含 `See skill: [name]` 引用，
  以便读者可以找到详细的如何做。
- **确定性收集，LLM 判断**：脚本保证穷尽性；
  LLM 保证上下文理解。
- **反抽象保护**：三层过滤器
  （2+ skill证据、可操作行为测试、违反风险）
  防止过于抽象的原则进入规则。
