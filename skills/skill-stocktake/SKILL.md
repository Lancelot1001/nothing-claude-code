---
description: "在审计 Claude skill和命令的质量时使用。支持快速扫描（仅扫描已更改的skill）和完整盘点了模式，通过顺序子agent批量评估。"
origin: nothing-claude-code
---

# skill-stocktake

斜杠命令（`/skill-stocktake`）使用质量检查清单 + AI 整体判断审计所有 Claude skill和命令。支持两种模式：用于最近更改skill的快速扫描，和用于完整审查的完整盘点。

## 范围

该命令针对**相对于调用目录**的以下路径：

| 路径 | 描述 |
|------|------|
| `~/.claude/skills/` | 全局skill（所有项目） |
| `{cwd}/.claude/skills/` | 项目级skill（如果目录存在） |

**在第 1 阶段开始时，命令明确列出找到并扫描的路径。**

### 针对特定项目

要包含项目级skill，请从该项目的根目录运行：

```bash
cd ~/path/to/my-project
/skill-stocktake
```

如果项目没有 `.claude/skills/` 目录，则仅评估全局skill和命令。

## 模式

| 模式 | 触发条件 | 持续时间 |
|------|---------|---------|
| 快速扫描 | `results.json` 存在（默认） | 5–10 分钟 |
| 完整盘点 | `results.json` 不存在，或 `/skill-stocktake full` | 20–30 分钟 |

**结果缓存：** `~/.claude/skills/skill-stocktake/results.json`

## 快速扫描流程

仅重新评估自上次运行以来已更改的skill（5–10 分钟）。

1. 读取 `~/.claude/skills/skill-stocktake/results.json`
2. 运行：`bash ~/.claude/skills/skill-stocktake/scripts/quick-diff.sh \
         ~/.claude/skills/skill-stocktake/results.json`
   （项目目录从 `$PWD/.claude/skills` 自动检测；仅在需要时显式传递）
3. 如果输出为 `[]`：报告"自上次运行以来无更改"并停止
4. 使用相同的第 2 阶段标准仅重新评估那些已更改的文件
5. 从之前的结果中保留未更改的skill
6. 仅输出差异
7. 运行：`bash ~/.claude/skills/skill-stocktake/scripts/save-results.sh \
         ~/.claude/skills/skill-stocktake/results.json <<< "$EVAL_RESULTS"`

## 完整盘点流程

### 第一阶段 — 清单

运行：`bash ~/.claude/skills/skill-stocktake/scripts/scan.sh`

该脚本枚举skill文件、提取 frontmatter 并收集 UTC mtime。
项目目录从 `$PWD/.claude/skills` 自动检测；仅在需要时显式传递。
从脚本输出呈现扫描摘要和清单表：

```
Scanning:
  ✓ ~/.claude/skills/         (17 files)
  ✗ {cwd}/.claude/skills/    (not found — global skills only)
```

| skill | 7天使用 | 30天使用 | 描述 |
|-------|--------|---------|-------------|

### 第二阶段 — 质量评估

使用完整清单和检查清单启动 Agent 工具子agent（**通用agent**）：

```text
Agent(
  subagent_type="general-purpose",
  prompt="
根据检查清单评估以下skill清单。

[INVENTORY]

[CHECKLIST]

为每个skill返回 JSON：
{ \"verdict\": \"Keep\"|\"Improve\"|\"Update\"|\"Retire\"|\"Merge into [X]\", \"reason\": \"...\" }
"
)
```

子agent读取每个skill、应用检查清单并返回每个skill的 JSON：

`{ "verdict": "Keep"|"Improve"|"Update"|"Retire"|"Merge into [X]", "reason": "..." }`

**分块指导：** 每次子agent调用处理约 20 个skill以保持上下文可管理。在每个分块后将中间结果保存到 `results.json`（`status: "in_progress"`）。

所有skill评估完成后：设置 `status: "completed"`，进入第三阶段。

**恢复检测：** 如果在启动时发现 `status: "in_progress"`，从第一个未评估的skill恢复。

每个skill根据以下检查清单进行评估：

```
- [ ] 已检查与其他skill的内容重叠
- [ ] 已检查与 MEMORY.md / CLAUDE.md 的重叠
- [ ] 已验证技术引用的时效性（如果存在工具名称 / CLI 标志 / API，请使用 WebSearch）
- [ ] 已考虑使用频率
```

裁决标准：

| 裁决 | 含义 |
|---------|---------|
| Keep | 有用且最新 |
| Improve | 值得保留，但需要具体改进 |
| Update | 引用的技术已过时（使用 WebSearch 验证） |
| Retire | 质量低、过期或成本不对称 |
| Merge into [X] | 与另一个skill实质性重叠；命名合并目标 |

评估是**整体 AI 判断** — 不是数字评分表。指导维度：
- **可操作性**：代码示例、命令或让您立即采取行动的步骤
- **范围契合**：名称、触发器和内容一致；不过宽也不过窄
- **独特性**：价值不能被 MEMORY.md / CLAUDE.md / 另一个skill替代
- **时效性**：技术引用在当前环境中有效

**理由质量要求** — `reason` 字段必须是自包含的且能支持决策：
- 不要单独写"未更改" — 始终重述核心证据
- 对于 **Retire**：说明（1）发现了什么具体缺陷，（2）什么替代方案满足相同需求
  - 错误：`"已被替代"`
  - 正确：`"disable-model-invocation: true 已设置；已被 continuous-learning-v2 替代，后者涵盖所有相同模式加置信度评分。没有剩余独特内容。"`
- 对于 **Merge**：命名目标并描述要整合什么内容
  - 错误：`"与 X 重叠"`
  - 正确：`"42 行薄内容；chatlog-to-article 的第 4 步已涵盖相同workflow。将'article angle'提示作为该skill的注释整合。"`
- 对于 **Improve**：描述需要的具体更改（哪个部分、什么操作、目标大小如果相关）
  - 错误：`"太长"`
  - 正确：`"276 行；'框架比较'部分（L80–140）与 ai-era-architecture-principles 重复；删除它以达到约 150 行。"`
- 对于 **Keep**（快速扫描中仅 mtime 更改）：重述原始裁决理由，不要写"未更改"
  - 错误：`"未更改"`
  - 正确：`"mtime 已更新但内容未更改。独特的 Python 引用由 rules/python/ 明确导入；未发现重叠。"`

### 第三阶段 — 摘要表

| skill | 7天使用 | 裁决 | 理由 |
|-------|--------|---------|--------|

### 第四阶段 — 整合

1. **Retire / Merge**：在确认之前为每个文件呈现详细理由：
   - 发现了什么具体问题（重叠、过时、损坏的引用等）
   - 什么替代方案涵盖相同功能（对于 Retire：哪个现有skill/规则；对于 Merge：目标文件以及要整合什么内容）
   - 删除的影响（任何依赖的skill、MEMORY.md 引用或受影响的workflow）
2. **Improve**：呈现带有理由的具体改进建议：
   - 要更改什么以及为什么（例如，"将 430→200 行精简，因为 X/Y 部分与 python-patterns 重复"）
   - 由用户决定是否采取行动
3. **Update**：呈现已检查来源的更新内容
4. 检查 MEMORY.md 行数；如果 >100 行建议压缩

## 结果文件模式

`~/.claude/skills/skill-stocktake/results.json`：

**`evaluated_at`**：必须设置为评估完成时的实际 UTC 时间。
通过 Bash 获取：`date -u +%Y-%m-%dT%H:%M:%SZ`。永远不要使用仅日期的近似值如 `T00:00:00Z`。

```json
{
  "evaluated_at": "2026-02-21T10:00:00Z",
  "mode": "full",
  "batch_progress": {
    "total": 80,
    "evaluated": 80,
    "status": "completed"
  },
  "skills": {
    "skill-name": {
      "path": "~/.claude/skills/skill-name/SKILL.md",
      "verdict": "Keep",
      "reason": "Concrete, actionable, unique value for X workflow",
      "mtime": "2026-01-15T08:30:00Z"
    }
  }
}
```

## 注意事项

- 评估是盲目的：相同的检查清单适用于所有skill，无论来源如何（ECC、自编写、自动提取）
- 归档/删除操作始终需要用户明确确认
- 不按skill来源进行裁决分支
