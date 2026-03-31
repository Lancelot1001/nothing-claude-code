---
name: blueprint
description: >-
  将一句话目标转化为多会话、多agent工程项目的分步构建计划。每一步都包含
  独立的上下文简报，使新agent可以冷启动执行。包括对抗性审查门、依赖图、
  并行步骤检测、反模式目录和计划变更协议。
  触发时机：用户请求复杂多 PR 任务或需要多个会话的工作的计划、蓝图或路线图时。
  不触发时机：任务可以在单个 PR 内完成或需要少于 3 次工具调用，或者用户说「直接做」。
origin: something-claude-code
---

# 蓝图 — 构建计划生成器

将一句话目标转化为任何编码agent都可以冷启动执行的分步构建计划。

## 何时使用

- 将大型功能分解为多个具有明确依赖顺序的 PR
- 规划跨越多个会话的重构或迁移
- 跨子agent协调并行workflow
- 任何会话间上下文丢失会导致返工的任务

**不要用于**可以在单个 PR 内完成的任务、少于 3 次工具调用的任务，或者当用户说「直接做」时。

## 工作原理

蓝图运行 5 阶段管道：

1. **研究** — 预检检查（git、gh auth、remote、默认分支），然后读取项目结构、现有计划和记忆文件以收集上下文。
2. **设计** — 将目标分解为适合单个 PR 的步骤（通常 3-12 步）。为每一步分配依赖边、并行/串行顺序、模型层级（最强 vs 默认）以及回滚策略。
3. **起草** — 将独立的 Markdown 计划文件写入 `plans/` 目录。每一步都包含上下文简报、任务列表、验证命令和退出标准 — 使新agent无需阅读先前步骤即可执行任何步骤。
4. **审查** — 将对抗性审查委托给最强模型的子agent（例如 Opus），依据检查清单和反模式目录进行审查。在定稿前修复所有关键发现。
5. **注册** — 保存计划、更新记忆索引，并向用户展示步骤数量和并行性摘要。

蓝图自动检测 git/gh 的可用性。有了 git + GitHub CLI，它会生成完整的分支/PR/CI workflow计划。没有时，它会切换到直接模式（原地编辑，无分支）。

## 示例

### 基本用法

```
/blueprint myapp "migrate database to PostgreSQL"
```

生成 `plans/myapp-migrate-database-to-postgresql.md`，包含类似以下步骤：
- 步骤 1：添加 PostgreSQL 驱动和连接配置
- 步骤 2：为每个表创建迁移脚本
- 步骤 3：更新仓库层以使用新驱动
- 步骤 4：添加针对 PostgreSQL 的集成测试
- 步骤 5：移除旧的数据库代码和配置

### 多agent项目

```
/blueprint chatbot "extract LLM providers into a plugin system"
```

生成一个计划，在可能的情况下包含并行步骤（例如，「实现 Anthropic 插件」和「实现 OpenAI 插件」在插件接口步骤完成后并行运行），模型层级分配（接口设计步骤用最强模型，实现用默认模型），以及每步后验证的不变量（例如，「所有现有测试通过」、「核心代码中无提供者导入」）。

## 关键特性

- **冷启动执行** — 每一步都包含独立的上下文简报。无需先前上下文。
- **对抗性审查门** — 每个计划都由最强模型的子agent根据涵盖完整性、依赖正确性和反模式检测的检查清单进行审查。
- **分支/PR/CI workflow** — 内置于每一步。当 git/gh 缺失时优雅降级到直接模式。
- **并行步骤检测** — 依赖图识别没有共享文件或输出依赖的步骤。
- **计划变更协议** — 步骤可以通过正式协议和审计跟踪进行拆分、插入、跳过、重排序或放弃。
- **零运行时风险** — 纯 Markdown skill。整个仓库只包含 `.md` 文件 — 无钩子、无 shell 脚本、无可执行代码、无 `package.json`、无构建步骤。除 Claude Code 原生的 Markdown skill加载器外，安装或调用时什么都不运行。

## 安装

此skill随 Everything Claude Code 一起提供。安装 ECC 时无需单独安装。

### 完整 ECC 安装

如果你从 ECC 仓库检出工作，使用以下命令验证skill是否存在：

```bash
test -f skills/blueprint/SKILL.md
```

后续更新时，更新前先审查 ECC diff：

```bash
cd /path/to/everything-claude-code
git fetch origin main
git log --oneline HEAD..origin/main       # 更新前审查新提交
git checkout <reviewed-full-sha>          # 固定到特定已审查的提交
```

### 独立 vendored 安装

如果你只在完整 ECC 安装之外 vendoring 此skill，将已审查的文件从 ECC 仓库复制到 `~/.claude/skills/blueprint/SKILL.md`。Vendored 副本没有 git remote，因此通过从已审查的 ECC 提交重新复制文件来更新，而不是运行 `git pull`。

## 要求

- Claude Code（用于 `/blueprint` 斜杠命令）
- Git + GitHub CLI（可选 — 启用完整的分支/PR/CI workflow；蓝图检测到缺失时自动切换到直接模式）

## 来源

灵感来自 antbotlab/blueprint — 上游项目和参考设计。
