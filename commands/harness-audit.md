# Harness Audit 命令

运行确定性仓库 harness 审计并返回优先级记分卡。

## 使用方法

`/harness-audit [scope] [--format text|json] [--root path]`

- `scope`（可选）：`repo`（默认）、`hooks`、`skills`、`commands`、`agents`
- `--format`：输出样式（`text` 默认，`json` 用于自动化）
- `--root`：审计指定路径而非当前工作目录

## 确定性引擎

始终运行：

```bash
node scripts/harness-audit.js <scope> --format <text|json> [--root <path>]
```

此脚本是评分和检查的真实来源。不要发明额外的维度或临时分数。

Rubric 版本：`2026-03-30`。

脚本计算 7 个固定类别（每个归一化为 `0-10`）：

1. 工具覆盖
2. 上下文效率
3. 质量门禁
4. 内存持久化
5. 评估覆盖
6. 安全护栏
7. 成本效率

分数来自明确的文件/规则检查，对同一提交可复现。
脚本默认审计当前工作目录，并自动检测目标是 ECC 仓库本身还是使用 ECC 的消费项目。

## 输出契约

返回：

1. `overall_score` / `max_score`（`repo` 为 70；范围审计更小）
2. 类别分数和具体发现
3. 失败检查及确切文件路径
4. 确定性输出的前 3 个操作（`top_actions`）
5. 建议接下来应用的 ECC skill

## 检查清单

- 直接使用脚本输出；不要手动重新评分。
- 如果请求 `--format json`，返回脚本 JSON 原样。
- 如果请求 text，总结失败检查和 top actions。
- 包含来自 `checks[]` 和 `top_actions[]` 的确切文件路径。

## 示例结果

```text
Harness Audit (repo): 66/70
- 工具覆盖：10/10 (10/10 分)
- 上下文效率：9/10 (9/10 分)
- 质量门禁：10/10 (10/10 分)

前 3 个操作：
1) [安全护栏] 在 hooks/hooks.json 中添加提示/工具预检安全护栏。(hooks/hooks.json)
2) [工具覆盖] 同步 commands/harness-audit.md 和 .opencode/commands/harness-audit.md。(.opencode/commands/harness-audit.md)
3) [评估覆盖] 增加 scripts/hooks/lib 的自动化测试覆盖率。(tests/)
```

## 参数

$ARGUMENTS：
- `repo|hooks|skills|commands|agents`（可选范围）
- `--format text|json`（可选输出格式）
