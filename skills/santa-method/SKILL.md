---
name: santa-method
description: "多agent对抗性验证，带收敛循环。在输出发布前，两个独立审查agent必须都通过。"
origin: "Ronald Skelton - 创始人，RapportScore.ai"
---

# Santa Method

多agent对抗性验证框架。列一个清单，检查两遍。如果是调皮的，修复直到它是乖的。

核心洞察：单个agent审查自己的输出时，
具有相同的偏见、知识差距和产生输出的系统性错误。
两个没有共享上下文的独立审查员打破了这种失败模式。

## 何时激活

在以下情况下调用此skill：
- 输出将被发布、部署或由最终用户消费
- 必须执行合规、监管或品牌约束
- 代码在没有人工审查的情况下发布到生产环境
- 内容准确性很重要（技术文档、教育材料、客户面向的文案）
- 规模化批量生成，抽查会错过系统性模式
- 幻觉风险升高（声明、统计、API 引用、法律语言）

对于内部草稿、探索性研究或具有确定性验证的任务
（为那些使用构建/测试/ lint 管道）不要使用。

## 架构

```
┌─────────────┐
│  GENERATOR   │  阶段 1：列一个清单
│  (Agent A)   │  产生可交付成果
└──────┬───────┘
       │ output
       ▼
┌──────────────────────────────┐
│     DUAL INDEPENDENT REVIEW   │  阶段 2：检查两遍
│                                │
│  ┌───────────┐ ┌───────────┐  │  两个agent，相同评分标准，
│  │ Reviewer B │ │ Reviewer C │  │  无共享上下文
│  └─────┬─────┘ └─────┬─────┘  │
│        │              │        │
└────────┼──────────────┼────────┘
         │              │
         ▼              ▼
┌──────────────────────────────┐
│        VERDICT GATE           │  阶段 3：调皮还是乖
│                                │
│  B 通过 AND C 通过 → 乖  │  两者都必须通过。
│  否则 → 调皮           │  没有例外。
└──────┬──────────────┬─────────┘
       │              │
    乖           调皮
       │              │
       ▼              ▼
   [ 发布 ]    ┌─────────────┐
               │  FIX CYCLE   │  阶段 4：修复直到乖
               │              │
               │ iteration++  │  收集所有标记。
               │ if i > MAX:  │  修复所有问题。
               │   escalate   │  重新运行两个审查agent。
               │ else:        │  循环直到收敛。
               │   goto Ph.2  │
               └──────────────┘
```

## 阶段详情

### 阶段 1：列一个清单（生成）

执行主要任务。对你的正常生成workflow process没有变化。
Santa Method 是一个生成后验证层，而非生成策略。

```python
# 生成器正常运行
output = generate(task_spec)
```

### 阶段 2：检查两遍（独立双重审查）

并行生成两个审查agent。关键不变量：

1. **上下文隔离** — 两个审查agent都看不到对方的评估
2. **相同的评分标准** — 两者收到相同的评估标准
3. **相同的输入** — 两者都收到原始规范和生成的输出
4. **结构化输出** — 每个返回类型化裁决，而非散文

```python
REVIEWER_PROMPT = """
你是一个独立的质检审查员。你没有看到过对这个输出的任何其他审查。

## 任务规范
{task_spec}

## 正在审查的输出
{output}

## 评估评分标准
{rubric}

## 说明
对照每个评分标准评估输出。对每个：
- 通过：标准完全满足，无问题
- 失败：发现具体问题（引用具体问题）

以结构化 JSON 形式返回你的评估：
{
  "verdict": "PASS" | "FAIL",
  "checks": [
    {"criterion": "...", "result": "PASS|FAIL", "detail": "..."}
  ],
  "critical_issues": ["..."],   # 必须修复的阻止因素
  "suggestions": ["..."]         # 非阻止改进
}

要严格。你的工作是发现问题，不是批准。
"""
```

```python
# 并行生成审查agent（Claude Code 子agent）
review_b = Agent(prompt=REVIEWER_PROMPT.format(...), description="Santa Reviewer B")
review_c = Agent(prompt=REVIEWER_PROMPT.format(...), description="Santa Reviewer C")

# 两者同时运行——互不可见
```

### 评分标准设计

评分标准是最重要的输入。模糊的评分标准产生模糊的审查。
每个标准必须有一个客观的通过/失败条件。

| 标准 | 通过条件 | 失败信号 |
|-----------|---------------|----------------|
| 事实准确性 | 所有声明可依据源材料或常识验证 | 编造的统计、错误的版本号、不存在的 API |
| 无幻觉 | 无捏造的实体、引用、URL 或引用 | 链接到不存在的页面、无来源的引用 |
| 完整性 | 规范中的每个要求都被处理 | 缺少章节、跳过边缘情况、覆盖不完整 |
| 合规性 | 通过所有项目特定约束 | 使用了禁用术语、语气违规、监管不合规 |
| 内部一致性 | 输出内无矛盾 | A 节说 X，B 节说不是 X |
| 技术正确性 | 代码编译/运行，算法合理 | 语法错误、逻辑错误、错误的复杂度声明 |

#### 特定领域评分标准扩展

**内容/营销：**
- 品牌语调遵守
- 满足 SEO 要求（关键词密度、元标签、结构）
- 无竞争对手商标滥用
- CTA 存在且正确链接

**代码：**
- 类型安全（无 `any` 泄漏，正确的空处理）
- 错误处理覆盖
- 安全（代码中无密钥、输入验证、注入预防）
- 新路径的测试覆盖

**合规敏感（受监管、法律、金融）：**
- 无结果保证或无依据的声明
- 存在所需免责声明
- 仅使用批准的术语
- 适当的管辖区域语言

### 阶段 3：调皮还是乖（裁决门控）

```python
def santa_verdict(review_b, review_c):
    """两者都必须通过。没有部分信用。"""
    if review_b.verdict == "PASS" and review_c.verdict == "PASS":
        return "乖"  # 发布

    # 合并两个审查agent的标记，去重
    all_issues = dedupe(review_b.critical_issues + review_c.critical_issues)
    all_suggestions = dedupe(review_b.suggestions + review_c.suggestions)

    return "调皮", all_issues, all_suggestions
```

为什么两者都必须通过：如果只有一个审查agentcatch到一个问题，
那个问题是真实的。另一个审查agent的盲点正是 Santa Method 存在要消除的失败模式。

### 阶段 4：修复直到乖（收敛循环）

```python
MAX_ITERATIONS = 3

for iteration in range(MAX_ITERATIONS):
    verdict, issues, suggestions = santa_verdict(review_b, review_c)

    if verdict == "乖":
        log_santa_result(output, iteration, "passed")
        return ship(output)

    # 修复所有关键问题（建议是可选的）
    output = fix_agent.execute(
        output=output,
        issues=issues,
        instruction="Fix ONLY the flagged issues. Do not refactor or add unrequested changes."
    )

    # 在修复后的输出上重新运行两个审查agent（新的agent，无前一轮记忆）
    review_b = Agent(prompt=REVIEWER_PROMPT.format(output=output, ...))
    review_c = Agent(prompt=REVIEWER_PROMPT.format(output=output, ...))

# 耗尽迭代——升级
log_santa_result(output, MAX_ITERATIONS, "escalated")
escalate_to_human(output, issues)
```

关键：每轮审查使用**新的agent**。
审查agent不能保留前一轮的记忆，因为之前的上下文会产生锚定偏见。

## 实现模式

### 模式 A：Claude Code 子agent（推荐）

子agent提供真正的上下文隔离。每个审查agent是一个独立进程，无共享状态。

```bash
# 在 Claude Code 会话中，使用 Agent 工具生成审查agent
# 两个agent并行运行以提高速度
```

```python
# Agent 工具调用的伪代码
reviewer_b = Agent(
    description="Santa Review B",
    prompt=f"Review this output for quality...\n\nRUBRIC:\n{rubric}\n\nOUTPUT:\n{output}"
)
reviewer_c = Agent(
    description="Santa Review C",
    prompt=f"Review this output for quality...\n\nRUBRIC:\n{rubric}\n\nOUTPUT:\n{output}"
)
```

### 模式 B：顺序内联（后备）

当子agent不可用时，用显式上下文重置模拟隔离：

1. 生成输出
2. 新上下文："你是审查员 1。仅对照此评分标准评估。发现问题。"
3. 逐字记录发现
4. 完全清除上下文
5. 新上下文："你是审查员 2。仅对照此评分标准评估。发现问题。"
6. 比较两个审查，修复，重复

子agent模式严格优越——内联模拟在审查之间存在上下文泄漏风险。

### 模式 C：批量采样

对于大型批次（100+ 项目），对每个项目进行完整 Santa 成本过高。
使用分层采样：

1. 在批次随机样本（10-15%，最少 5 个项目）上运行 Santa
2. 按类型（幻觉、合规性、完整性等）对失败进行分类
3. 如果出现系统性模式，将有针对性的修复应用到整个批次
4. 重新采样并验证修复后的批次
5. 继续直到干净样本通过

```python
import random

def santa_batch(items, rubric, sample_rate=0.15):
    sample = random.sample(items, max(5, int(len(items) * sample_rate)))

    for item in sample:
        result = santa_full(item, rubric)
        if result.verdict == "调皮":
            pattern = classify_failure(result.issues)
            items = batch_fix(items, pattern)  # 修复所有匹配模式的项
            return santa_batch(items, rubric)   # 重新采样

    return items  # 干净样本 → 发布批次
```

## 失败模式和缓解

| 失败模式 | 症状 | 缓解 |
|-------------|---------|------------|
| 无限循环 | 审查agent在修复后不断发现新问题 | 最大迭代次数上限（3）。升级。 |
| 橡皮图章 | 两个审查agent通过一切 | 对抗性提示："你的工作是发现问题，不是批准。" |
| 主观漂移 | 审查agent标记风格偏好，而非错误 | 带有客观通过/失败条件的严格评分标准 |
| 修复回归 | 修复问题 A 引入问题 B | 每轮新审查agent catch 回归 |
| 审查agent一致偏见 | 两个审查agent错过相同内容 | 通过独立性缓解，不能消除。对于关键输出，添加第三个审查agent或人工抽查。 |
| 成本爆炸 | 大输出上迭代过多 | 批量采样模式。每个验证周期的预算上限。 |

## 与其他skill的集成

| skill | 关系 |
|-------|-------------|
| Verification Loop | 用于确定性检查（构建、lint、测试）。Santa 用于语义检查（准确性、幻觉）。先运行 verification-loop，再运行 Santa。 |
| Eval Harness | Santa Method 结果进入评估指标。跟踪跨 Santa 运行的 pass@k 以随时间衡量生成器质量。 |
| Continuous Learning v2 | Santa 发现成为本能。相同标准上的重复失败 → 学习行为避免该模式。 |
| Strategic Compact | 在压缩之前运行 Santa。不要在验证中途失去审查上下文。 |

## 指标

跟踪这些以衡量 Santa Method 有效性：

- **首次通过率**：在第 1 轮通过 Santa 的输出百分比（目标：>70%）
- **平均收敛迭代次数**：到"乖"的平均轮数（目标：<1.5）
- **问题分类**：失败类型分布（幻觉 vs. 完整性 vs. 合规性）
- **审查agent一致率**：两个审查agent都标记 vs. 仅一个标记的问题百分比
  （低一致率 = 评分标准需要收紧）
- **逃逸率**：发布后发现 Santa 应该 catch 的问题（目标：0）

## 成本分析

Santa Method 每个验证周期约花费生成代币成本的 2-3 倍。
对于大多数高风险输出，这是值得的：

```
Santa 成本 = (生成代币) + 2×(每轮审查代币) × (平均轮数)
不使用 Santa 的成本 = (声誉损害) + (纠正努力) + (信任侵蚀)
```

对于批量操作，采样模式将成本降低到全验证的约 15-20%，
同时 catch >90% 的系统性问题。
