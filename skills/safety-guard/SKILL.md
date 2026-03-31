---
name: safety-guard
description: 在生产系统上工作或自主运行agent时，使用此skill防止破坏性操作。
origin: something-claude-code
---

# Safety Guard — 防止破坏性操作

## 何时使用

- 在生产系统上工作时
- 当agent自主运行（全自动模式）时
- 当你想将编辑限制在特定目录时
- 在敏感操作期间（迁移、部署、数据更改）

## 工作原理

三种保护模式：

### 模式 1：谨慎模式

在实际执行前拦截破坏性命令并发出警告：

```
监视的模式：
- rm -rf（特别是 /、~ 或项目根目录）
- git push --force
- git reset --hard
- git checkout .（放弃所有更改）
- DROP TABLE / DROP DATABASE
- docker system prune
- kubectl delete
- chmod 777
- sudo rm
- npm publish（意外发布）
- 任何带 --no-verify 的命令
```

检测到时：显示命令的作用，请求确认，建议更安全的替代方案。

### 模式 2：冻结模式

将文件编辑锁定到特定目录树：

```
/safety-guard freeze src/components/
```

`src/components/` 之外的任何 Write/Edit 都会被阻止并附带解释。
当希望agent专注于一个区域而不触及无关代码时很有用。

### 模式 3：守卫模式（谨慎模式 + 冻结模式）

两种保护同时激活。自主agent的最大安全性。

```
/safety-guard guard --dir src/api/ --allow-read-all
```

agent可以读取任何内容，但只能写入 `src/api/`。
破坏性命令在所有地方都被阻止。

### 解除

```
/safety-guard off
```

## 实现

使用 PreToolUse 钩子拦截 Bash、Write、Edit 和 MultiEdit 工具调用。
在允许执行之前，检查命令/路径与活动规则的匹配情况。

## 集成

- 为 `codex -a never` 会话默认启用
- 与 ECC 2.0 中的可观察性风险评分配对
- 将所有阻止的操作记录到 `~/.claude/safety-guard.log`
