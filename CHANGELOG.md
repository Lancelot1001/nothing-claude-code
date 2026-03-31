# 更新日志

## 1.9.0 - 2026-03-20

### 亮点

- 选择性安装架构，带 manifest 驱动的管道和 SQLite 状态存储。
- 语言覆盖扩展到 10+ 个生态，新增 6 个 agent 和语言特定规则。
- Observer 可靠性加固：内存节流、沙箱修复、5 层循环防护。
- 自我改进 skills 基础：skill 演进和会话适配器。

### 新增 Agents

- `typescript-reviewer` — TypeScript/JavaScript 代码审查专家 (#647)
- `pytorch-build-resolver` — PyTorch 运行时、CUDA 和训练错误解决 (#549)
- `java-build-resolver` — Maven/Gradle 构建错误解决 (#538)
- `java-reviewer` — Java 和 Spring Boot 代码审查 (#528)
- `kotlin-reviewer` — Kotlin/Android/KMP 代码审查 (#309)
- `kotlin-build-resolver` — Kotlin/Gradle 构建错误 (#309)
- `rust-reviewer` — Rust 代码审查 (#523)
- `rust-build-resolver` — Rust 构建错误解决 (#523)
- `docs-lookup` — 文档和 API 参考研究 (#529)

### 新增 Skills

- `pytorch-patterns` — PyTorch 深度学习工作流 (#550)
- `documentation-lookup` — API 参考和库文档研究 (#529)
- `bun-runtime` — Bun 运行时模式 (#529)
- `nextjs-turbopack` — Next.js Turbopack 工作流 (#529)
- `mcp-server-patterns` — MCP server 设计模式 (#531)
- `data-scraper-agent` — AI 驱动的公共数据收集 (#503)
- `team-builder` — 团队组成 skill (#501)
- `ai-regression-testing` — AI 回归测试工作流 (#433)
- `claude-devfleet` — 多 agent 编排 (#505)
- `blueprint` — 多会话构建规划
- `everything-claude-code` — 自引用的 ECC skill (#335)
- `prompt-optimizer` — Prompt 优化 skill (#418)
- 8 个 Evo 操作领域 skills (#290)
- 3 个 Laravel skills (#420)
- VideoDB skills (#301)

### 新增 Commands

- `/docs` — 文档查询 (#530)
- `/aside` — 附带对话 (#407)
- `/prompt-optimize` — Prompt 优化 (#418)
- `/resume-session`、`/save-session` — 会话管理
- `learn-eval` 改进：基于检查清单的全面裁决

### 新增 Rules

- Java 语言规则 (#645)
- PHP 规则包 (#389)
- Perl 语言规则和 skills（模式、安全、测试）
- Kotlin/Android/KMP 规则 (#309)
- C++ 语言支持 (#539)
- Rust 语言支持 (#523)

### 基础设施

- 选择性安装架构，带 manifest 解析（`install-plan.js`、`install-apply.js`）(#509, #512)
- SQLite 状态存储，带查询 CLI 用于跟踪已安装组件 (#510)
- 结构化会话记录的会话适配器 (#511)
- 自我改进 skills 的 Skill 演进基础 (#514)
- 带确定性评分的编排 harness (#524)
- CI 中的目录计数强制 (#525)
- 所有 109 个 skills 的安装 manifest 验证 (#537)
- PowerShell 安装器包装 (#532)
- 通过 `--target antigravity` 标志支持 Antigravity IDE (#332)
- Codex CLI 自定义脚本 (#336)

### Bug 修复

- 解决跨 6 个文件的 19 个 CI 测试失败 (#519)
- 修复安装管道、编排器和修复中的 8 个测试失败 (#564)
- Observer 内存爆炸问题：节流、重入防护、尾部采样 (#536)
- Observer 沙箱 Haiku 调用访问修复 (#661)
- Worktree 项目 ID 不匹配修复 (#665)
- Observer 延迟启动逻辑 (#508)
- Observer 5 层循环防护 (#399)
- Hook 可移植性和 Windows .cmd 支持
- Biome hook 优化 — 消除 npx 开销 (#359)
- InsAIts 安全 hook 改为可选 (#370)
- Windows spawnSync 导出修复 (#431)
- Instinct CLI 的 UTF-8 编码修复 (#353)
- Hook 中的秘密清理 (#348)

### 翻译

- 韩语 (ko-KR) 翻译 — README、agents、commands、skills、rules (#392)
- 中文 (zh-CN) 文档同步 (#428)

### 致谢

- @ymdvsymd — observer 沙箱和 worktree 修复
- @pythonstrup — biome hook 优化
- @Nomadu27 — InsAIts 安全 hook
- @hahmee — 韩语翻译
- @zdocapp — 中文翻译同步
- @cookiee339 — Kotlin 生态
- @pangerlkr — CI 工作流修复
- @0xrohitgarg — VideoDB skills
- @nocodemf — Evo 操作 skills
- @swarnika-cmd — 社区贡献

## 1.8.0 - 2026-03-04

### 亮点

- 首个 Harness 优先版本，专注于可靠性、评估规范和自主循环操作。
- Hook 运行时现在支持基于配置文件的控制和定向 hook 禁用。
- NanoClaw v2 新增模型路由、skill 热加载、分支、搜索、压缩、导出和指标。

### 核心

- 新增命令：`/harness-audit`、`/loop-start`、`/loop-status`、`/quality-gate`、`/model-route`。
- 新增 skills：
  - `agent-harness-construction`
  - `agentic-engineering`
  - `ralphinho-rfc-pipeline`
  - `ai-first-engineering`
  - `enterprise-agent-ops`
  - `nanoclaw-repl`
  - `continuous-agent-loop`
- 新增 agents：
  - `harness-optimizer`
  - `loop-operator`

### Hook 可靠性

- 修复带健壮回退搜索的 SessionStart 根解析。
- 将会话摘要持久化移至 `Stop`，此处有 transcript payload。
- 新增 quality-gate 和 cost-tracker hooks。
- 用专用脚本文件替换脆弱的内联 hook 单行命令。
- 新增 `ECC_HOOK_PROFILE` 和 `ECC_DISABLED_HOOKS` 控制。

### 跨平台

- 改进文档警告逻辑中 Windows 安全路径处理。
- 加固 observer 循环行为以避免非交互式挂起。

### 说明

- `autonomous-loops` 作为兼容别名保留一个版本；`continuous-agent-loop` 是规范名称。

### 致谢

- 灵感来自 [zarazhangrui](https://github.com/zarazhangrui)
- homunculus 灵感来自 [humanplane](https://github.com/humanplane)
