---
name: projects
description: 列出已知项目及其 instinct 统计
command: true
---

# Projects 命令

列出项目注册表条目和每个项目的 instinct/观察计数，用于 continuous-learning-v2。

## 实现

使用插件根路径运行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" projects
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未设置（手动安装）：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py projects
```

## 使用方法

```bash
/projects
```

## 执行步骤

1. 读取 `~/.claude/homunculus/projects.json`
2. 对于每个项目，显示：
   - 项目名称、id、根目录、远程
   - 个人和继承的 instinct 计数
   - 观察事件计数
   - 最后访问时间戳
3. 还显示全局 instinct 总计
