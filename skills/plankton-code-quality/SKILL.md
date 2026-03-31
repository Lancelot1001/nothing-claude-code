---
name: plankton-code-quality
description: "Write-time code quality enforcement using Plankton — auto-formatting, linting, and Claude-powered fixes on every file edit via hooks."
origin: something-claude-code
---

# Plankton 代码质量skill

Plankton（Credit: @alxfazio）集成参考，一个用于 Claude Code 的写入时代码质量强制系统。Plankton 通过 PostToolUse hooks 在每次文件编辑时运行格式化工具和 linter，然后生成 Claude 子进程来修复 agent 未捕获的违规。

## 何时使用

- 你想在每次文件编辑时自动格式化和 lint（而不仅仅是提交时）
- 你需要防御 agents 修改 linter 配置以通过而非修复代码
- 你想要分级模型路由来修复（Haiku 处理简单样式、Sonnet 处理逻辑、Opus 处理类型）
- 你使用多种语言（Python、TypeScript、Shell、YAML、JSON、TOML、Markdown、Dockerfile）

## 工作原理

### 三阶段架构

每次 Claude Code 编辑或写入文件时，Plankton 的 `multi_linter.sh` PostToolUse hook 运行：

```
阶段 1：自动格式化（静默）
├─ 运行格式化工具（ruff format、biome、shfmt、taplo、markdownlint）
├─ 静默修复 40-50% 的问题
└─ 不向主 agent 输出

阶段 2：收集违规（JSON）
├─ 运行 linter 并收集无法自动修复的违规
├─ 返回结构化 JSON：{line, column, code, message, linter}
└─ 仍不向主 agent 输出

阶段 3：委托 + 验证
├─ 使用违规 JSON 生成 claude -p 子进程
├─ 根据违规复杂度路由到模型层级：
│   ├─ Haiku：格式化、导入、样式（E/W/F 代码）——120s 超时
│   ├─ Sonnet：复杂度、重构（C901、PLR 代码）——300s 超时
│   └─ Opus：类型系统、深度推理（unresolved-attribute）——600s 超时
├─ 重新运行阶段 1+2 以验证修复
└─ 退出码 0 表示干净，退出码 2 表示仍有违规（报告给主 agent）
```

### 主 agent 看到什么

| 场景 | agent 看到 | Hook 退出码 |
|----------|-----------|-----------|
| 无违规 | 无 | 0 |
| 子进程全部修复 | 无 | 0 |
| 子进程后仍有违规 | `[hook] N violation(s) remain` | 2 |
| 建议（重复、旧工具） | `[hook:advisory] ...` | 0 |

主 agent 只看到子进程无法修复的问题。大多数质量问题透明解决。

### 配置保护（防御规则游戏）

LLM 会修改 `.ruff.toml` 或 `biome.json` 以禁用规则而非修复代码。Plankton 通过三层阻止：

1. **PreToolUse hook**——`protect_linter_configs.sh` 在发生前阻止对所有 linter 配置的编辑
2. **Stop hook**——`stop_config_guardian.sh` 在会话结束时通过 `git diff` 检测配置变更
3. **受保护文件列表**——`.ruff.toml`、`biome.json`、`.shellcheckrc`、`.yamllint`、`.hadolint.yaml` 等

### 包管理器强制

Bash 上的 PreToolUse hook 阻止传统包管理器：
- `pip`、`pip3`、`poetry`、`pipenv` → 阻止（使用 `uv`）
- `npm`、`yarn`、`pnpm` → 阻止（使用 `bun`）
- 允许例外：`npm audit`、`npm view`、`npm publish`

## 设置

### 快速开始

> **注意：** Plankton 需要从其仓库手动安装。安装前请审查代码。

```bash
# 安装核心依赖
brew install jaq ruff uv

# 安装 Python linter
uv sync --all-extras

# 启动 Claude Code——hooks 自动激活
claude
```

无需安装命令，无插件配置。当你在 Plankton 目录中运行 Claude Code 时，`.claude/settings.json` 中的 hooks 会自动被拾取。

### 按项目集成

在你自己的项目中使用 Plankton hooks：

1. 复制 `.claude/hooks/` 目录到你的项目
2. 复制 `.claude/settings.json` hook 配置
3. 复制 linter 配置文件（`.ruff.toml`、`biome.json` 等）
4. 为你的语言安装 linter

### 语言特定依赖

| 语言 | 必需 | 可选 |
|----------|----------|----------|
| Python | `ruff`、`uv` | `ty`（类型）、`vulture`（死代码）、`bandit`（安全） |
| TypeScript/JS | `biome` | `oxlint`、`semgrep`、`knip`（死导出） |
| Shell | `shellcheck`、`shfmt` | — |
| YAML | `yamllint` | — |
| Markdown | `markdownlint-cli2` | — |
| Dockerfile | `hadolint` (>= 2.12.0) | — |
| TOML | `taplo` | — |
| JSON | `jaq` | — |

## 与 ECC 配合

### 互补，不重叠

| 关注点 | ECC | Plankton |
|---------|-----|----------|
| 代码质量强制 | PostToolUse hooks（Prettier、tsc） | PostToolUse hooks（20+ linter + 子进程修复） |
| 安全扫描 | AgentShield、security-reviewer agent | Bandit（Python）、Semgrep（TypeScript） |
| 配置保护 | — | PreToolUse 阻止 + Stop hook 检测 |
| 包管理器 | 检测 + 设置 | 强制（阻止传统 PM） |
| CI 集成 | — | git 预提交 hooks |
| 模型路由 | 手动（`/model opus`） | 自动（违规复杂度 → 层级） |

### 建议组合

1. 将 ECC 安装为你的插件（agents、skills、commands、rules）
2. 添加 Plankton hooks 进行写入时质量强制
3. 使用 AgentShield 进行安全审计
4. 使用 ECC 的验证循环作为 PR 前的最终关卡

### 避免 Hook 冲突

如果同时运行 ECC 和 Plankton hooks：
- ECC 的 Prettier hook 和 Plankton 的 biome 格式化工具可能在 JS/TS 文件上冲突
- 解决方案：使用 Plankton 时禁用 ECC 的 Prettier PostToolUse hook（Plankton 的 biome 更全面）
- 两者可以在不同文件类型上共存（ECC 处理 Plankton 未覆盖的部分）

## 配置参考

Plankton 的 `.claude/hooks/config.json` 控制所有行为：

```json
{
  "languages": {
    "python": true,
    "shell": true,
    "yaml": true,
    "json": true,
    "toml": true,
    "dockerfile": true,
    "markdown": true,
    "typescript": {
      "enabled": true,
      "js_runtime": "auto",
      "biome_nursery": "warn",
      "semgrep": true
    }
  },
  "phases": {
    "auto_format": true,
    "subprocess_delegation": true
  },
  "subprocess": {
    "tiers": {
      "haiku":  { "timeout": 120, "max_turns": 10 },
      "sonnet": { "timeout": 300, "max_turns": 10 },
      "opus":   { "timeout": 600, "max_turns": 15 }
    },
    "volume_threshold": 5
  }
}
```

**关键设置：**
- 禁用你不使用的语言以加速 hooks
- `volume_threshold`——违规数超过此值自动升级到更高模型层级
- `subprocess_delegation: false`——完全跳过阶段 3（仅报告违规）

## 环境覆盖

| 变量 | 用途 |
|----------|---------|
| `HOOK_SKIP_SUBPROCESS=1` | 跳过阶段 3，直接报告违规 |
| `HOOK_SUBPROCESS_TIMEOUT=N` | 覆盖层级超时 |
| `HOOK_DEBUG_MODEL=1` | 记录模型选择决策 |
| `HOOK_SKIP_PM=1` | 绕过包管理器强制 |

## 参考

- Plankton（Credit: @alxfazio）
- Plankton REFERENCE.md——完整架构文档（Credit: @alxfazio）
- Plankton SETUP.md——详细安装指南（Credit: @alxfazio）

## ECC v1.8 新增

### 可复制 Hook Profile

设置严格质量行为：

```bash
export ECC_HOOK_PROFILE=strict
export ECC_QUALITY_GATE_FIX=true
export ECC_QUALITY_GATE_STRICT=true
```

### 语言关卡表

- TypeScript/JavaScript：首选 Biome，Prettier 作为后备
- Python：Ruff format/check
- Go：gofmt

### 配置篡改防护

在质量强制期间，标记同一迭代中配置文件的变更：

- `biome.json`、`.eslintrc*`、`prettier.config*`、`tsconfig.json`、`pyproject.toml`

如果配置被更改以抑制违规，需要在合并前进行显式审查。

### CI 集成模式

在 CI 中使用与本地 hooks 相同的命令：

1. 运行格式化程序检查
2. 运行 lint/类型检查
3. 在严格模式下快速失败
4. 发布修复摘要

### 健康指标

追踪：
- 被关卡标记的编辑
- 平均修复时间
- 按类别划分的重复违规
- 由于关卡失败导致的合并阻塞
