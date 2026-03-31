# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

This is a Chinese localization of [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code), providing Chinese developers with a complete Claude Code setup guide.

This repository is itself a Claude Code configuration — use `/init` in any new project to apply these rules.

## 项目结构

- `scripts/install-core.sh` — 核心配置一键安装脚本
- `配置索引.md` — 配置分类完整索引
- `缺失检查报告.md` — 与 ECC 差异分析
- `rules/common/` — 通用规则（7 必装 + 4 可选）
- `rules/<lang>/` — 11 种语言规则（每种 5 个）
- `commands/` — 70+ 斜杠命令
- `.claude/commands/` — 官方工作流命令（feature-development, database-migration, add-language-rules）
- `.kiro/steering/` — Steering 模板（16 个）
- `agents/` — 30 个专业 Agent
- `AGENTS.md` — Agent 完整列表

## 常用命令

| 场景 | 命令 |
|------|------|
| 开始新功能 | `/plan` 先规划，再 `/tdd` 测试驱动 |
| 写完代码 | `/code-review` 代码审查 |
| 构建失败 | `/build-fix` 自动修复 |
| 添加新语言规则 | `/add-language-rules` |
| 需要文档 | `/docs <库名>` 查文档 |
| 会话结束 | `/save-session` 或 `/learn-eval` |
| 继续工作 | `/resume-session` 恢复会话 |
| 上下文太重 | `/context-budget` 分析后 `/checkpoint` |
| 重复任务 | `/loop-start` 启动循环 |

## 核心原则

1. **不可变性** — 创建新对象，绝不修改现有对象
2. **Agent 优先** — 领域任务委托给专业 Agent
3. **测试驱动** — 先写测试，再实现，80%+ 覆盖率
4. **安全第一** — 不在安全问题上妥协
5. **先规划后执行** — 复杂功能先规划再写代码

## Agent 编排

| Agent | 用途 | 使用时机 |
|-------|------|---------|
| planner | 实施规划 | 复杂功能、重构 |
| tdd-guide | 测试驱动开发 | 新功能、Bug 修复 |
| code-reviewer | 代码质量与安全 | 写完/修改代码后 |
| security-reviewer | 漏洞检测 | 提交前、敏感代码 |
| build-error-resolver | 修复构建错误 | 构建失败时 |

## 开发流程

1. `/plan` — 识别依赖和风险，分阶段进行
2. `/tdd` — 先写测试，再实现
3. `/code-review` — 立即审查，解决严重/高风险问题
4. 保存知识到正确位置
5. 遵循约定式提交格式

## 安全检查清单

提交前必须确认：
- 无硬编码密钥（API key、密码、Token）
- 所有用户输入已验证
- SQL 注入防护（参数化查询）
- XSS 防护（HTML 净化）
- CSRF 保护已启用

## 配置验证

This is a configuration-only project. No build commands needed for this repo itself.

## 相关资源

- [ECC 原版英文文档](https://github.com/affaan-m/everything-claude-code)
- [Claude Code 官方文档](https://docs.claude.com)
- [配置索引](./配置索引.md) — 完整配置分类
- [缺失检查报告](./缺失检查报告.md) — 与 ECC 差异分析
