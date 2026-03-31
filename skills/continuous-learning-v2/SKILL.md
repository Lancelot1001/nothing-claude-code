---
name: continuous-learning-v2
description: 基于本能的学习系统，通过 hooks 观察会话，创建带置信度评分的原子本能，并将其演化为skill/命令/agent。v2.1 添加了项目范围的本能以防止跨项目污染。
origin: something-claude-code
version: 2.1.0
---

# 持续学习 v2.1 - 基于本能的架构

一个高级学习系统，通过原子"本能"——带置信度评分的小型学习行为——将你的 Claude Code 会话转化为可复用知识。

**v2.1** 添加了**项目范围的本能**——React 模式留在你的 React 项目中，Python 约定留在你的 Python 项目中，而通用模式（如"始终验证输入"）在全球范围内共享。

## 何时激活

- 设置从 Claude Code 会话自动学习
- 通过 hooks 配置基于本能的行为提取
- 调整学习行为的置信度阈值
- 查看、导出或导入本能库
- 将本能演化为完整skill、命令或agent
- 管理项目范围 vs 全局本能
- 将本能从项目提升到全局范围

## v2.1 新特性

| 特性 | v2.0 | v2.1 |
|---------|------|------|
| 存储 | 全局（~/.claude/homunculus/） | 项目范围（projects/<hash>/） |
| 范围 | 所有本能无处不在 | 项目范围 + 全局 |
| 检测 | 无 | git remote URL / repo 路径 |
| 提升 | 不适用 | 在 2+ 项目中看到时项目 → 全局 |
| 命令 | 4 个（status/evolve/export/import） | 6 个（+promote/projects） |
| 跨项目 | 污染风险 | 默认隔离 |

## v2 新特性（对比 v1）

| 特性 | v1 | v2 |
|---------|----|----|
| 观察 | Stop hook（会话结束） | PreToolUse/PostToolUse（100% 可靠） |
| 分析 | 主上下文 | 后台agent（Haiku） |
| 粒度 | 完整skill | 原子"本能" |
| 置信度 | 无 | 0.3-0.9 加权 |
| 演化 | 直接到skill | 本能 → 集群 → skill/命令/agent |
| 共享 | 无 | 导出/导入本能 |

## 本能模型

本能是一个小型学习行为：

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
scope: project
project_id: "a1b2c3d4e5f6"
project_name: "my-react-app"
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional on 2025-01-15
```

**属性：**
- **原子性** -- 一个触发器，一个动作
- **置信度加权** -- 0.3 = 试探性，0.9 = 几乎确定
- **领域标记** -- 代码风格、测试、git、调试、workflow等
- **证据支持** -- 跟踪创建它的观察
- **范围感知** -- `project`（默认）或 `global`

## 工作原理

```
会话活动（在 git 仓库中）
      |
      | Hooks 捕获 prompts + 工具使用（100% 可靠）
      | + 检测项目上下文（git remote / repo 路径）
      v
+---------------------------------------------+
|  projects/<project-hash>/observations.jsonl  |
|   (prompts, tool calls, outcomes, project)   |
+---------------------------------------------+
      |
      | 观察者agent读取（后台，Haiku）
      v
+---------------------------------------------+
|          模式检测                           |
|   * 用户纠正 -> 本能                        |
|   * 错误解决方案 -> 本能                     |
|   * 重复workflow -> 本能                      |
|   * 范围决策：项目还是全局？                 |
+---------------------------------------------+
      |
      | 创建/更新
      v
+---------------------------------------------+
|  projects/<project-hash>/instincts/personal/ |
|   * prefer-functional.yaml (0.7) [项目]     |
|   * use-react-hooks.yaml (0.9) [项目]        |
+---------------------------------------------+
|  instincts/personal/  (全局)               |
|   * always-validate-input.yaml (0.85) [全局] |
|   * grep-before-edit.yaml (0.6) [全局]       |
+---------------------------------------------+
      |
      | /evolve 集群 + /promote
      v
+---------------------------------------------+
|  projects/<hash>/evolved/ (项目范围)         |
|  evolved/ (全局)                            |
|   * commands/new-feature.md                 |
|   * skills/testing-workflow.md              |
|   * agents/refactor-specialist.md           |
+---------------------------------------------+
```

## 项目检测

系统自动检测当前项目：

1. **`CLAUDE_PROJECT_DIR` 环境变量**（最高优先级）
2. **`git remote get-url origin`** -- 哈希生成便携式项目 ID（同一仓库在不同机器上获得相同 ID）
3. **`git rev-parse --show-toplevel`** -- 使用 repo 路径回退（机器特定）
4. **全局回退** -- 如果未检测到项目，本能进入全局范围

每个项目获得一个 12 字符的哈希 ID（例如 `a1b2c3d4e5f6`）。注册表文件位于 `~/.claude/homunculus/projects.json`，将 ID 映射到人类可读名称。

## 快速开始

### 1. 启用观察 Hooks

添加到你的 `~/.claude/settings.json`。

**如果作为插件安装**（推荐）：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh"
      }]
    }]
  }
}
```

**如果手动安装到 `~/.claude/skills`**：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh"
      }]
    }]
  }
}
```

### 2. 初始化目录结构

系统首次使用时自动创建目录，但你也可以手动创建：

```bash
# 全局目录
mkdir -p ~/.claude/homunculus/{instincts/{personal,inherited},evolved/{agents,skills,commands},projects}

# 项目目录在 hook 首次在 git 仓库中运行时自动创建
```

### 3. 使用本能命令

```bash
/instinct-status     # 显示已学本能（项目 + 全局）
/evolve              # 将相关本能聚类为skill/命令
/instinct-export     # 导出本能到文件
/instinct-import     # 从他人导入本能
/promote             # 将项目本能提升到全局范围
/projects            # 列出所有已知项目及其本能数量
```

## 命令

| 命令 | 描述 |
|---------|-------------|
| `/instinct-status` | 显示所有本能（项目范围 + 全局）及置信度 |
| `/evolve` | 将相关本能聚类为skill/命令，建议提升 |
| `/instinct-export` | 导出本能（可按范围/领域过滤） |
| `/instinct-import <file>` | 导入本能并控制范围 |
| `/promote [id]` | 将项目本能提升到全局范围 |
| `/projects` | 列出所有已知项目及其本能数量 |

## 配置

编辑 `config.json` 以控制后台观察者：

```json
{
  "version": "2.1",
  "observer": {
    "enabled": false,
    "run_interval_minutes": 5,
    "min_observations_to_analyze": 20
  }
}
```

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `observer.enabled` | `false` | 启用后台观察者agent |
| `observer.run_interval_minutes` | `5` | 观察者分析观察结果的频率 |
| `observer.min_observations_to_analyze` | `20` | 分析运行前的最小观察数 |

其他行为（观察捕获、本能阈值、项目范围、提升标准）通过 `instinct-cli.py` 和 `observe.sh` 中的代码默认值配置。

## 文件结构

```
~/.claude/homunculus/
+-- identity.json           # 你的 profile，技术水平
+-- projects.json           # 注册表：project hash -> name/path/remote
+-- observations.jsonl      # 全局观察（回退）
+-- instincts/
|   +-- personal/           # 全局自动学习的本能
|   +-- inherited/          # 全局导入的本能
+-- evolved/
|   +-- agents/             # 全局生成的agent
|   +-- skills/             # 全局生成的skill
|   +-- commands/           # 全局生成的命令
+-- projects/
    +-- a1b2c3d4e5f6/       # 项目哈希（来自 git remote URL）
    |   +-- project.json    # 每个项目的元数据镜像（id/name/root/remote）
    |   +-- observations.jsonl
    |   +-- observations.archive/
    |   +-- instincts/
    |   |   +-- personal/   # 项目特定自动学习的
    |   |   +-- inherited/  # 项目特定导入的
    |   +-- evolved/
    |       +-- skills/
    |       +-- commands/
    |       +-- agents/
    +-- f6e5d4c3b2a1/       # 另一个项目
        +-- ...
```

## 范围决策指南

| 模式类型 | 范围 | 示例 |
|-------------|-------|---------|
| 语言/框架约定 | **项目** | "使用 React hooks"、"遵循 Django REST 模式" |
| 文件结构偏好 | **项目** | "测试在 `__tests__`/"、"组件在 src/components/" |
| 代码风格 | **项目** | "使用函数式风格"、"首选 dataclasses" |
| 错误处理策略 | **项目** | "使用 Result 类型处理错误" |
| 安全实践 | **全局** | "验证用户输入"、"净化 SQL" |
| 通用最佳实践 | **全局** | "先写测试"、"始终处理错误" |
| 工具workflow偏好 | **全局** | "编辑前先 Grep"、"写入前先读取" |
| Git 实践 | **全局** | "约定式提交"、"小而专注的提交" |

## 本能提升（项目 → 全局）

当相同的本能在多个项目中以高置信度出现时，它是提升到全局范围的候选者。

**自动提升标准：**
- 相同本能 ID 在 2+ 个项目中
- 平均置信度 >= 0.8

**如何提升：**

```bash
# 提升特定本能
python3 instinct-cli.py promote prefer-explicit-errors

# 自动提升所有符合条件的本能
python3 instinct-cli.py promote

# 预览而不更改
python3 instinct-cli.py promote --dry-run
```

`/evolve` 命令也会建议提升候选者。

## 置信度评分

置信度随时间演化：

| 评分 | 含义 | 行为 |
|-------|---------|----------|
| 0.3 | 试探性 | 建议但不强制 |
| 0.5 | 中等 | 在相关时应用 |
| 0.7 | 强 | 自动批准应用 |
| 0.9 | 几乎确定 | 核心行为 |

**置信度增加**当：
- 模式被重复观察
- 用户不纠正建议的行为
- 其他来源的类似本能同意

**置信度降低**当：
- 用户明确纠正行为
- 模式在延长期间未被观察
- 出现矛盾证据

## 为什么使用 Hooks 而不是skill进行观察？

> "v1 依赖skill进行观察。skill是概率性的——它们根据 Claude 的判断触发率约为 50-80%。"

Hooks **100%** 确定性地触发。这意味着：
- 每个工具调用都被观察
- 没有模式被遗漏
- 学习是全面的

## 向后兼容

v2.1 与 v2.0 和 v1 完全兼容：
- `~/.claude/homunculus/instincts/` 中现有的全局本能仍作为全局本能工作
- v1 中现有的 `~/.claude/skills/learned/` skill仍然有效
- Stop hook 仍然运行（但现在也会输入到 v2）
- 渐进迁移：并行运行两者

## 隐私

- 观察结果**本地**保存在你的机器上
- 项目范围的本能按项目隔离
- 只有**本能**（模式）可以导出——不是原始观察
- 不共享任何实际代码或会话内容
- 你控制导出和提升的内容

## 相关

- [ECC-Tools GitHub App](https://github.com/apps/ecc-tools) - 从仓库历史生成本能
- Homunculus - 启发了 v2 基于本能架构的社区项目（原子观察、置信度评分、本能演化管道）
- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - 持续学习部分

---

*基于本能的学习：一次一个项目地教 Claude 你的模式。*
