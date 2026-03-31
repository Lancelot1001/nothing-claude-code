---
name: team-builder
description: 用于组合和调度并行团队的交互式agent选择器
origin: something-claude-code
---

# 团队构建器

用于按需浏览和组合agent团队的交互式菜单。支持平面或领域子目录agent集合。

## 何时使用

- 您有多个agent角色（markdown 文件），想要选择使用哪些来处理任务
- 您想要组合来自不同领域（例如安全 + SEO + 架构）的临时团队
- 您想在决定之前浏览可用的agent

## 前置条件

agent文件必须是包含角色提示的 markdown 文件（身份、规则、workflow、交付物）。第一个 `# 标题` 用作agent名称，第一段作为描述。

支持平面和子目录两种布局：

**子目录布局** — 领域从文件夹名称推断：

```
agents/
├── engineering/
│   ├── security-engineer.md
│   └── software-architect.md
├── marketing/
│   └── seo-specialist.md
└── sales/
    └── discovery-coach.md
```

**平面布局** — 领域从共享的文件名前缀推断。当前缀被 2 个或更多文件共享时才算作领域。具有唯一前缀的文件归入"通用"。注意：该算法在第一个 `-` 处分割，因此多词领域（例如 `product-management`）应改用子目录布局：

```
agents/
├── engineering-security-engineer.md
├── engineering-software-architect.md
├── marketing-seo-specialist.md
├── marketing-content-strategist.md
├── sales-discovery-coach.md
└── sales-outbound-strategist.md
```

## 配置

按顺序探测agent目录并合并结果：

1. `./agents/**/*.md` + `./agents/*.md` — 项目本地agent（两种深度）
2. `~/.claude/agents/**/*.md` + `~/.claude/agents/*.md` — 全局agent（两种深度）

来自所有位置的结果按agent名称合并和去重。项目本地agent优先于具有相同名称的全局agent。如果用户指定，可以改用自定义路径。

## 工作原理

### 步骤 1：发现可用agent

使用上述探测顺序 glob agent目录。排除 README 文件。对于找到的每个文件：
- **子目录布局：** 从父文件夹名称提取领域
- **平面布局：** 收集所有文件名前缀（第一个 `-` 之前的文本）。前缀仅在出现在 2 个或更多文件名中时才算作领域（例如 `engineering-security-engineer.md` 和 `engineering-software-architect.md` 都以 `engineering` 开头 → 工程领域）。具有唯一前缀的文件（例如 `code-reviewer.md`、`tdd-guide.md`）归入"通用"
- 从第一个 `# 标题` 提取agent名称。如果未找到标题，则从文件名派生名称（去除 `.md`，将连字符替换为空格，标题大小写）
- 从标题后的第一段提取一行摘要

如果在探测所有位置后未找到agent文件，通知用户："未找到agent文件。检查了：[探测的路径列表]。预期：这些目录中的 markdown 文件。"然后停止。

### 步骤 2：呈现领域菜单

```
Available agent domains:
1. Engineering — Software Architect, Security Engineer
2. Marketing — SEO Specialist
3. Sales — Discovery Coach, Outbound Strategist

Pick domains or name specific agents (e.g., "1,3" or "security + seo"):
```

- 跳过没有agent的领域（空目录）
- 显示每个领域的agent数量

### 步骤 3：处理选择

接受灵活输入：
- 数字："1,3" 选择所有工程和销售agent
- 名称："security + seo" 对发现的agent进行模糊匹配
- "all from engineering" 选择该领域中的每个agent

如果选择了超过 5 个agent，按字母顺序列出并要求用户缩小范围："您选择了 N 个agent（最多 5 个）。选择要保留的，或说 'first 5' 使用前五个按字母顺序。"

确认选择：
```
Selected: Security Engineer + SEO Specialist
What should they work on? (describe the task):
```

### 步骤 4：并行生成agent

1. 读取每个选定agent的 markdown 文件
2. 如果任务描述尚未提供，提示输入
3. 使用 Agent 工具并行生成所有agent：
   - `subagent_type: "general-purpose"`
   - `prompt: "{agent file content}\n\nTask: {task description}"`
   - 每个agent独立运行 — 不需要agent间通信
4. 如果agent失败（错误、超时或空输出），内联记录失败（例如"Security Engineer: failed — [reason]"），并继续处理成功agent的结果

### 步骤 5：综合结果

收集所有输出并呈现统一报告：
- 按agent分组的结果
- 突出显示综合部分：
  - agent之间的一致意见
  - 建议之间的冲突或紧张关系
  - 推荐的 next steps

如果仅选择了 1 个agent，跳过综合直接呈现输出。

## 规则

- **仅动态发现。** 永远不要硬编码agent列表。目录中的新文件会自动出现在菜单中。
- **每个团队最多 5 个agent。** 超过 5 个会产生递减回报和过多的 token 使用。在选择时强制执行。
- **并行调度。** 所有agent同时运行 — 使用 Agent 工具的并行调用模式。
- **并行 Agent 调用，而非 TeamCreate。** 此skill使用并行 Agent 工具调用进行独立工作。TeamCreate（用于多agent对话的 Claude Code 工具）仅在agent必须辩论或相互响应时才需要。

## 示例

```
User: team builder

Claude:
Available agent domains:
1. Engineering (2) — Software Architect, Security Engineer
2. Marketing (1) — SEO Specialist
3. Sales (4) — Discovery Coach, Outbound Strategist, Proposal Strategist, Sales Engineer
4. Support (1) — Executive Summary

Pick domains or name specific agents:

User: security + seo

Claude:
Selected: Security Engineer + SEO Specialist
What should they work on?

User: Review my Next.js e-commerce site before launch

[Both agents spawn in parallel, each applying their specialty to the codebase]

Claude:
## Security Engineer Findings
- [findings...]

## SEO Specialist Findings
- [findings...]

## Synthesis
Both agents agree on: [...]
Tension: Security recommends CSP that blocks inline styles, SEO needs inline schema markup. Resolution: [...]
Next steps: [...]
```
