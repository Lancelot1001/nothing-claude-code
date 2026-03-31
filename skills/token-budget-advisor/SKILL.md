---
name: token-budget-advisor
description: >-
  在回答之前为用户提供关于响应深度的知情选择。当用户明确想要控制响应长度、深度或 token 预算时使用此skill。
  当出现以下情况时触发："token budget"、"token count"、"token usage"、"token limit"、"response length"、"answer depth"、"short version"、"brief answer"、"detailed answer"、"exhaustive answer"、"respuesta corta vs larga"、"cuántos tokens"、"ahorrar tokens"、"responde al 50%"、"dame la versión corta"、"quiero controlar cuánto usas"，或用户明确要求控制答案大小或深度的明确变体。
  当出现以下情况时不触发：用户已在当前会话中指定了级别（保持它）、请求明显是单词答案，或"token"指的是 auth/session/payment token 而非响应大小。
origin: nothing-claude-code
---

# Token 预算顾问（TBA）

在 Claude 回答之前拦截响应流程，为用户提供关于响应深度的选择。

## 何时使用

- 用户想要控制回答的长度或详细程度
- 用户提到 token、预算、深度或响应长度
- 用户说"short version"、"tldr"、"brief"、"al 25%"、"exhaustive" 等
- 用户想要提前选择深度/详细程度的任何时候

**不要触发**当：用户已在本次会话中设置了级别（静默保持），或者答案trivial地只有一行。

## 工作原理

### 第 1 步——估算输入 token

使用仓库的规范 context-budget 启发式来心算提示的 token 数量。

使用与 [context-budget](../context-budget/SKILL.md) 相同的校准指导：

- 散文：`words × 1.3`
- 代码密集型或混合/代码块：`chars / 4`

对于混合内容，使用主要内容类型并保持估算启发式。

### 第 2 步——按复杂度估算响应大小

对提示进行分类，然后应用乘数范围以获得完整响应窗口：

| 复杂度   | 乘数范围 | 示例提示                                      |
|--------------|------------------|------------------------------------------------------|
| 简单       | 3× – 8×          | "什么是 X？"、是/否、单一事实                   |
| 中等       | 8× – 20×         | "X 是如何工作的？"                                  |
| 中高       | 10× – 25×        | 带上下文的代码请求                           |
| 复杂       | 15× – 40×        | 多部分分析、比较、架构                         |
| 创意       | 10× – 30×        | 故事、散文、叙事写作                              |

响应窗口 = `input_tokens × mult_min` 到 `input_tokens × mult_max`（但不要超过模型配置的最大输出 token 限制）。

### 第 3 步——呈现深度选项

在回答之前使用实际估算数字呈现此块：

```
正在分析你的提示...

输入：约 [N] tokens  |  类型：[type]  |  复杂度：[level]  |  语言：[lang]

选择你的深度级别：

[1] 必要   (25%)  ->  约 [tokens]   仅直接答案，无序言
[2] 中等   (50%)  ->  约 [tokens]   答案 + 上下文 + 1 个示例
[3] 详细   (75%)  ->  约 [tokens]   完整答案及替代方案
[4] 详尽  (100%)  ->  约 [tokens]   一切，无限制

选择哪个级别？（1-4 或说"25% 深度"、"50% 深度"、"75% 深度"、"100% 深度"）

精度：启发式估算约 85-90% 准确度（±15%）。
```

级别 token 估算（在响应窗口内）：
- 25%  → `min + (max - min) × 0.25`
- 50%  → `min + (max - min) × 0.50`
- 75%  → `min + (max - min) × 0.75`
- 100% → `max`

### 第 4 步——以选定级别回应

| 级别            | 目标长度       | 包含                                             | 省略                                              |
|------------------|---------------------|-----------------------------------------------------|---------------------------------------------------|
| 25% 必要    | 最多 2-4 句   | 直接答案、关键结论                       | 上下文、示例、细微差别、替代方案           |
| 50% 中等     | 1-3 段落      | 答案 + 必要上下文 + 1 个示例              | 深度分析、边缘情况、参考文献             |
| 75% 详细     | 结构化响应 | 多个示例、利弊、替代方案          | 极端边缘情况、详尽参考文献         |
| 100% 详尽  | 无限制      | 一切——完整分析、所有代码、所有视角 | 无                                        |

## 快捷方式——跳过问题

如果用户已经发出级别信号，立即以该级别回应，不询问：

| 他们说的                                      | 级别 |
|----------------------------------------------------|-------|
| "1" / "25% depth" / "short version" / "brief answer" / "tldr"  | 25%   |
| "2" / "50% depth" / "moderate depth" / "balanced answer"        | 50%   |
| "3" / "75% depth" / "detailed answer" / "thorough answer"       | 75%   |
| "4" / "100% depth" / "exhaustive answer" / "full deep dive"     | 100%  |

如果用户在会话早期设置了级别，**静默保持**以供后续响应，除非他们更改。

## 精度说明

此skill使用启发式估算——没有真正的 tokenizer。准确度约 85-90%，方差 ±15%。始终显示免责声明。

## 示例

### 触发

- "先给我简短版本。"
- "你的回答会使用多少 tokens？"
- "以 50% 深度回应。"
- "我想要详尽的答案，不是摘要。"
- "Dame la version corta y luego la detallada."

### 不触发

- "什么是 JWT token？"
- "结账流程使用 payment token。"
- "这是正常的吗？"
- "完成重构。"
- 用户已为会话选择深度后的后续问题

## 来源

来自 [TBA — Claude Code 的 Token 预算顾问](https://github.com/Xabilimon1/Token-Budget-Advisor-Claude-Code-) 的独立skill。
原始项目也附带了 Python 估算脚本，但此仓库保持skill自包含且仅使用启发式。
