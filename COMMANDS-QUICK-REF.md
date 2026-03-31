# 命令速查表

> 59 个 slash command 全局安装。在任意 Claude Code 会话中输入 `/` 即可调用。

---

## 核心工作流

| Command | 功能 |
|---------|-------------|
| `/plan` | 重述需求，评估风险，编写分步实施计划 — **在触碰代码之前等待确认** |
| `/tdd` | 强制测试驱动开发：搭建接口 → 写失败测试 → 实现 → 验证 80%+ 覆盖率 |
| `/code-review` | 对变更文件的全面代码质量、安全性和可维护性审查 |
| `/build-fix` | 检测并修复构建错误 — 自动委托给正确的 build-resolver agent |
| `/verify` | 运行完整验证循环：构建 → lint → 测试 → 类型检查 |
| `/quality-gate` | 对照项目标准进行质量门检查 |

---

## 测试

| Command | 功能 |
|---------|-------------|
| `/tdd` | 通用 TDD 工作流（任意语言） |
| `/e2e` | 生成并运行 Playwright 端到端测试，捕获截图/视频/traces |
| `/test-coverage` | 报告测试覆盖率，识别缺口 |
| `/go-test` | Go 的 TDD 工作流（表驱动，`go test -cover` 达到 80%+） |
| `/kotlin-test` | Kotlin 的 TDD（Kotest + Kover） |
| `/rust-test` | Rust 的 TDD（cargo test，集成测试） |
| `/cpp-test` | C++ 的 TDD（GoogleTest + gcov/lcov） |

---

## 代码审查

| Command | 功能 |
|---------|-------------|
| `/code-review` | 通用代码审查 |
| `/python-review` | Python — PEP 8、类型提示、安全、惯用模式 |
| `/go-review` | Go — 惯用模式、并发安全、错误处理 |
| `/kotlin-review` | Kotlin — 空安全、协程安全、清晰架构 |
| `/rust-review` | Rust — 所有权、生命周期、unsafe 用法 |
| `/cpp-review` | C++ — 内存安全、现代惯用模式、并发 |

---

## 构建修复

| Command | 功能 |
|---------|-------------|
| `/build-fix` | 自动检测语言并修复构建错误 |
| `/go-build` | 修复 Go 构建错误和 `go vet` 警告 |
| `/kotlin-build` | 修复 Kotlin/Gradle 编译器错误 |
| `/rust-build` | 修复 Rust 构建 + 借用检查器问题 |
| `/cpp-build` | 修复 C++ CMake 和链接器问题 |
| `/gradle-build` | 修复 Android / KMP 的 Gradle 错误 |

---

## 规划与架构

| Command | 功能 |
|---------|-------------|
| `/plan` | 含风险评估的实施计划 |
| `/multi-plan` | 多模型协作规划 |
| `/multi-workflow` | 多模型协作开发 |
| `/multi-backend` | 后端优先的多模型开发 |
| `/multi-frontend` | 前端优先的多模型开发 |
| `/multi-execute` | 多模型协作执行 |
| `/orchestrate` | tmux/worktree 多 agent 编排指南 |
| `/devfleet` | 通过 DevFleet 编排并行 Claude Code agent |

---

## 会话管理

| Command | 功能 |
|---------|-------------|
| `/save-session` | 将当前会话状态保存到 `~/.claude/session-data/` |
| `/resume-session` | 从规范会话存储加载最近保存的会话，从中断处继续 |
| `/sessions` | 浏览、搜索和管理会话历史，别名来自 `~/.claude/session-data/`（同时从 `~/.claude/sessions/` 读取旧数据） |
| `/checkpoint` | 在当前会话中标记检查点 |
| `/aside` | 快速回答附带问题，不丢失当前任务上下文 |
| `/context-budget` | 分析上下文窗口使用情况 — 找出 token 开销，优化 |

---

## 学习与改进

| Command | 功能 |
|---------|-------------|
| `/learn` | 从当前会话提取可重用模式 |
| `/learn-eval` | 提取模式 + 保存前自我评估质量 |
| `/evolve` | 分析学到的 instinct，建议改进的 skill 结构 |
| `/promote` | 将项目范围的 instinct 提升为全局范围 |
| `/instinct-status` | 显示所有学到的 instinct（项目 + 全局）及置信度分数 |
| `/instinct-export` | 将 instinct 导出到文件 |
| `/instinct-import` | 从文件或 URL 导入 instinct |
| `/skill-create` | 分析本地 git 历史 → 生成可重用 skill |
| `/skill-health` | Skill 组合健康仪表板及分析 |
| `/rules-distill` | 扫描 skill，提取横切原则，归入 rules |

---

## 重构与清理

| Command | 功能 |
|---------|-------------|
| `/refactor-clean` | 移除死代码，合并重复项，清理结构 |
| `/prompt-optimize` | 分析草稿 prompt 并输出优化后的 ECC 增强版本 |

---

## 文档与研究

| Command | 功能 |
|---------|-------------|
| `/docs` | 通过 Context7 查询当前库/API 文档 |
| `/update-docs` | 更新项目文档 |
| `/update-codemaps` | 重新生成代码库的代码地图 |

---

## 循环与自动化

| Command | 功能 |
|---------|-------------|
| `/loop-start` | 在间隔上启动重复 agent 循环 |
| `/loop-status` | 检查运行中循环的状态 |
| `/claw` | 启动 NanoClaw v2 — 持久化 REPL，支持模型路由、skill 热加载、分支和指标 |

---

## 项目与基础设施

| Command | 功能 |
|---------|-------------|
| `/projects` | 列出已知项目及其 instinct 统计 |
| `/harness-audit` | 审计 agent harness 配置的可靠性和成本 |
| `/eval` | 运行评估 harness |
| `/model-route` | 将任务路由到正确的模型（Haiku / Sonnet / Opus） |
| `/pm2` | PM2 进程管理器初始化 |
| `/setup-pm` | 配置包管理器（npm / pnpm / yarn / bun） |

---

## 快速决策指南

```
开始新功能？                → 先 /plan，再 /tdd
刚写完代码？               → /code-review
构建坏了？                 → /build-fix
需要实时文档？             → /docs <库名>
会话即将结束？             → /save-session 或 /learn-eval
第二天继续？               → /resume-session
上下文太重？               → /context-budget 然后 /checkpoint
想提取学到的知识？         → /learn-eval 然后 /evolve
运行重复任务？             → /loop-start
```
