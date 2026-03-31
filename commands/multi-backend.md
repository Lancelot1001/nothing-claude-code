# 后端 - 后端优先开发

后端优先workflow process（研究 → 构思 → 规划 → 执行 → 优化 → 审查），Codex 主导。

## 使用方法

```bash
/backend <后端任务描述>
```

## 上下文

- 后端任务：$ARGUMENTS
- Codex 主导，Gemini 作为辅助参考
- 适用于：API 设计、算法实现、数据库优化、业务逻辑

## 你的角色

你是**后端编排器**，协调多模型协作以完成服务器端任务（研究 → 构思 → 规划 → 执行 → 优化 → 审查）。

**协作模型**：
- **Codex** – 后端逻辑、算法（**后端权威，可信**）
- **Gemini** – 前端视角（**后端意见仅供参考**）
- **Claude（自身）** – 编排、规划、执行、交付

---

## 多模型调用规范

**调用语法**：

```
# 新会话调用
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend codex - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <增强的需求（或 $ARGUMENTS 如果未增强）>
Context: <之前阶段的项目上下文和分析>
</TASK>
OUTPUT: 预期输出格式
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "简要描述"
})

# 恢复会话调用
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend codex resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <增强的需求（或 $ARGUMENTS 如果未增强）>
Context: <之前阶段的项目上下文和分析>
</TASK>
OUTPUT: 预期输出格式
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "简要描述"
})
```

**角色提示**：

| 阶段 | Codex |
|-------|-------|
| 分析 | `~/.claude/.ccg/prompts/codex/analyzer.md` |
| 规划 | `~/.claude/.ccg/prompts/codex/architect.md` |
| 审查 | `~/.claude/.ccg/prompts/codex/reviewer.md` |

**会话重用**：每次调用返回 `SESSION_ID: xxx`，使用 `resume xxx` 用于后续阶段。在阶段 2 保存 `CODEX_SESSION`，在阶段 3 和 5 使用 `resume`。

---

## 沟通指南

1. 以模式标签 `[Mode: X]` 开始响应，初始为 `[Mode: Research]`
2. 遵循严格顺序：`研究 → 构思 → 规划 → 执行 → 优化 → 审查`
3. 需要时使用 `AskUserQuestion` 工具进行用户交互（例如确认/选择/批准）

---

## 核心workflow process

### 阶段 0：提示增强（可选）

`[Mode: Prepare]` - 如果 ace-tool MCP 可用，调用 `mcp__ace-tool__enhance_prompt`，**将原始 $ARGUMENTS 替换为增强结果用于后续 Codex 调用**。如果不可用，使用 `$ARGUMENTS` 原样。

### 阶段 1：研究

`[Mode: Research]` - 理解需求并收集上下文

1. **代码检索**（如果 ace-tool MCP 可用）：调用 `mcp__ace-tool__search_context` 检索现有 API、数据模型、服务架构。如果不可用，使用内置工具：`Glob` 用于文件发现，`Grep` 用于符号/API 搜索，`Read` 用于上下文收集，`Task`（探索agent）用于更深入的探索。
2. 需求完整性评分（0-10）：>=7 继续，<7 停止并补充

### 阶段 2：构思

`[Mode: Ideation]` - Codex 主导的分析

**必须调用 Codex**（遵循上面的调用规范）：
- ROLE_FILE：`~/.claude/.ccg/prompts/codex/analyzer.md`
- 需求：增强的需求（或 $ARGUMENTS 如果未增强）
- 上下文：阶段 1 的项目上下文
- OUTPUT：技术可行性分析、推荐解决方案（至少 2 个）、风险评估

**保存 SESSION_ID**（`CODEX_SESSION`）用于后续阶段重用。

输出解决方案（至少 2 个），等待用户选择。

### 阶段 3：规划

`[Mode: Plan]` - Codex 主导的规划

**必须调用 Codex**（使用 `resume <CODEX_SESSION>` 重用会话）：
- ROLE_FILE：`~/.claude/.ccg/prompts/codex/architect.md`
- 需求：用户选择的解决方案
- 上下文：阶段 2 的分析结果
- OUTPUT：文件结构、函数/类设计、依赖关系

Claude 综合计划，在用户批准后保存到 `.claude/plan/task-name.md`。

### 阶段 4：实现

`[Mode: Execute]` - 代码开发

- 严格遵循批准的计划
- 遵循现有项目代码标准
- 确保错误处理、安全性、性能优化

### 阶段 5：优化

`[Mode: Optimize]` - Codex 主导的审查

**必须调用 Codex**（遵循调用规范）：
- ROLE_FILE：`~/.claude/.ccg/prompts/codex/reviewer.md`
- 需求：审查以下后端代码更改
- 上下文：git diff 或代码内容
- OUTPUT：安全性、性能、错误处理、API 合规性问题列表

整合审查反馈，在用户确认后执行优化。

### 阶段 6：质量审查

`[Mode: Review]` - 最终评估

- 对照计划检查完成情况
- 运行测试验证功能
- 报告问题和建议

---

## 关键规则

1. **Codex 后端意见可信**
2. **Gemini 后端意见仅供参考**
3. 外部模型**零文件系统写入权限**
4. Claude 处理所有代码写入和文件操作
