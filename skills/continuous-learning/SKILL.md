---
name: continuous-learning
description: 自动从 Claude Code 会话中提取可复用模式，并将其保存为已学skill供将来使用。
origin: something-claude-code
---

# 持续学习skill

在 Claude Code 会话结束时自动评估，提取可保存为已学skill的可复用模式。

## 何时激活

- 设置从 Claude Code 会话自动提取模式
- 配置会话评估的 Stop hook
- 在 `~/.claude/skills/learned/` 中查看或策展已学skill
- 调整提取阈值或模式类别
- 比较 v1（这个）和 v2（基于本能的）方法

## 工作原理

此skill作为 **Stop hook** 在每个会话结束时运行：

1. **会话评估**：检查会话是否有足够的消息（默认：10+）
2. **模式检测**：从会话中识别可提取的模式
3. **skill提取**：将有用模式保存到 `~/.claude/skills/learned/`

## 配置

编辑 `config.json` 进行自定义：

```json
{
  "min_session_length": 10,
  "extraction_threshold": "medium",
  "auto_approve": false,
  "learned_skills_path": "~/.claude/skills/learned/",
  "patterns_to_detect": [
    "error_resolution",
    "user_corrections",
    "workarounds",
    "debugging_techniques",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## 模式类型

| 模式 | 描述 |
|---------|-------------|
| `error_resolution` | 特定错误是如何解决的 |
| `user_corrections` | 用户纠正中的模式 |
| `workarounds` | 框架/库怪癖的解决方案 |
| `debugging_techniques` | 有效的调试方法 |
| `project_specific` | 项目特定的约定 |

## Hook 设置

添加到你的 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning/evaluate-session.sh"
      }]
    }]
  }
}
```

## 为什么使用 Stop Hook？

- **轻量级**：在会话结束时运行一次
- **非阻塞**：不会给每条消息增加延迟
- **完整上下文**：可访问完整会话记录

## 相关

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - 持续学习部分
- `/learn` 命令 - 会话中手动模式提取

---

## 比较说明（2025 年 1 月研究）

### vs Homunculus

Homunculus v2 采用更复杂的方法：

| 特性 | 我们的方法 | Homunculus v2 |
|---------|--------------|---------------|
| 观察 | Stop hook（会话结束时） | PreToolUse/PostToolUse hooks（100% 可靠） |
| 分析 | 主上下文 | 后台agent（Haiku） |
| 粒度 | 完整skill | 原子"本能" |
| 置信度 | 无 | 0.3-0.9 加权 |
| 演化 | 直接到skill | 本能 → 集群 → skill/命令/agent |
| 共享 | 无 | 导出/导入本能 |

**来自 homunculus 的关键洞察：**
> "v1 依赖skill进行观察。skill是概率性的——它们触发率约为 50-80%。v2 使用 hooks 进行观察（100% 可靠），并使用本能作为学习行为的原子单位。"

### 潜在的 v2 增强

1. **基于本能的学习** - 带置信度评分的更小、原子行为
2. **后台观察者** - 并行分析的 Haiku agent
3. **置信度衰减** - 本能如果被反驳会失去置信度
4. **领域标记** - 代码风格、测试、git、调试等
5. **演化路径** - 将相关本能聚类为skill/命令

参见：`docs/continuous-learning-v2-spec.md` 完整规格。
