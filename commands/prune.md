---
name: prune
description: 删除超过 30 天未晋升的待处理 instinct
command: true
---

# 修剪待处理 Instinct

删除已自动生成但从未审查或晋升的过期待处理 instinct。

## 实现

使用插件根路径运行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" prune
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未设置（手动安装）：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py prune
```

## 使用方法

```
/prune                    # 删除超过 30 天的 instinct
/prune --max-age 60      # 自定义年龄阈值（天）
/prune --dry-run         # 预览而不删除
```
