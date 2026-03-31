---
name: instinct-status
description: 显示已学习的 instinct（项目 + 全局）及置信度
command: true
---

# Instinct Status 命令

显示当前项目已学习的 instinct 加上全局 instinct，按领域分组并显示置信度。

## 实现

使用插件根路径运行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未设置（手动安装），使用：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

## 使用方法

```
/instinct-status
```

## 执行步骤

1. 检测当前项目上下文（git remote/path hash）
2. 从 `~/.claude/homunculus/projects/<project-id>/instincts/` 读取项目 instinct
3. 从 `~/.claude/homunculus/instincts/` 读取全局 instinct
4. 合并（ID 冲突时项目覆盖全局）
5. 按领域显示，包含置信度条和观察统计

## 输出格式

```
============================================================
  INSTINCT 状态 - 共 12 个
============================================================

  项目：my-app (a1b2c3d4e5f6)
  项目 instinct：8
  全局 instinct： 4

## 项目范围 (my-app)
  ### workflow (3)
    ███████░░░  70%  grep-before-edit [项目]
              触发：修改代码时

## 全局（适用于所有项目）
  ### 安全 (2)
    █████████░  85%  validate-user-input [全局]
              触发：处理用户输入时
```
