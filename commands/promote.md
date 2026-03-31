---
name: promote
description: 将项目范围的 instinct 晋升到全局范围
command: true
---

# Promote 命令

在 continuous-learning-v2 中将 instinct 从项目范围晋升到全局范围。

## 实现

使用插件根路径运行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" promote [instinct-id] [--force] [--dry-run]
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未设置（手动安装）：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py promote [instinct-id] [--force] [--dry-run]
```

## 使用方法

```bash
/promote                      # 自动检测晋升候选
/promote --dry-run            # 预览自动晋升候选
/promote --force              # 无提示晋升所有合格候选
/promote grep-before-edit     # 从当前项目晋升一个特定的 instinct
```

## 执行步骤

1. 检测当前项目
2. 如果提供了 `instinct-id`，仅晋升该 instinct（如果在当前项目中存在）
3. 否则，找出现在至少 2 个项目中出现且满足置信度阈值的跨项目候选
4. 将晋升的 instinct 写入 `~/.claude/homunculus/instincts/personal/`，并设置 `scope: global`
