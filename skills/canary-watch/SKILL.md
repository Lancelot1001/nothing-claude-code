---
name: canary-watch
description: 使用此skill在部署、合并或依赖升级后监控已部署 URL 的回归情况。
origin: nothing-claude-code
---

# 金丝雀监控 — 部署后监控

## 何时使用

- 部署到生产环境或 staging 后
- 合并有风险的 PR 后
- 当你想验证一个修复是否真正修复了问题
- 发布窗口期间的持续监控
- 依赖升级后

## 工作原理

监控已部署 URL 的回归情况。循环运行，直到被停止或监控窗口过期。

### 监控内容

```
1. HTTP 状态 — 页面是否返回 200？
2. 控制台错误 — 之前没有的新错误？
3. 网络故障 — API 调用失败、5xx 响应？
4. 性能 — LCP/CLS/INP 相对基准线的回归？
5. 内容 — 关键元素是否消失？（h1、nav、footer、CTA）
6. API 健康 — 关键端点是否在 SLA 内响应？
```

### 监控模式

**快速检查**（默认）：单次通过，报告结果
```
/canary-watch https://myapp.com
```

**持续监控**：每 N 分钟检查一次，持续 M 小时
```
/canary-watch https://myapp.com --interval 5m --duration 2h
```

**对比模式**：比较 staging 和生产环境
```
/canary-watch --compare https://staging.myapp.com https://myapp.com
```

### 告警阈值

```yaml
critical:  # 立即告警
  - HTTP 状态不等于 200
  - 控制台错误数 > 5（仅新错误）
  - LCP > 4s
  - API 端点返回 5xx

warning:   # 在报告中标记
  - LCP 比基准线增加 > 500ms
  - CLS > 0.1
  - 新的控制台警告
  - 响应时间 > 2 倍基准线

info:      # 仅记录
  - 轻微性能变化
  - 新网络请求（添加了第三方脚本？）
```

### 通知

当超过关键阈值时：
- 桌面通知（macOS/Linux）
- 可选：Slack/Discord webhook
- 记录到 `~/.claude/canary-watch.log`

## 输出

```markdown
## 金丝雀报告 — myapp.com — 2026-03-23 03:15 PST

### 状态：健康 ✓

| 检查项 | 结果 | 基准线 | 变化 |
|-------|--------|----------|-------|
| HTTP | 200 ✓ | 200 | — |
| 控制台错误 | 0 ✓ | 0 | — |
| LCP | 1.8s ✓ | 1.6s | +200ms |
| CLS | 0.01 ✓ | 0.01 | — |
| API /health | 145ms ✓ | 120ms | +25ms |

### 未检测到回归。部署干净。
```

## 集成

配合使用：
- `/browser-qa` 用于部署前验证
- 钩子：作为 `git push` 的 PostToolUse 钩子添加，以在部署后自动检查
- CI：在 GitHub Actions 中的部署步骤后运行
