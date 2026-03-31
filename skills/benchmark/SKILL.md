---
name: benchmark
description: 使用此skill来测量性能基准线、在 PR 前后检测性能回归，以及比较技术栈替代方案。
origin: something-claude-code
---

# 基准测试 — 性能基准与回归检测

## 何时使用

- 在 PR 前后测量性能影响
- 为项目建立性能基准线
- 当用户反馈「感觉变慢了」
- 上线前 — 确保达到性能目标
- 将你的技术栈与替代方案进行比较

## 工作原理

### 模式 1：页面性能

通过浏览器 MCP 测量真实的浏览器指标：

```
1. 导航到每个目标 URL
2. 测量 Core Web Vitals：
   - LCP（Largest Contentful Paint，最大内容绘制）— 目标 < 2.5s
   - CLS（Cumulative Layout Shift，累计布局偏移）— 目标 < 0.1
   - INP（Interaction to Next Paint，交互到下一绘制）— 目标 < 200ms
   - FCP（First Contentful Paint，首次内容绘制）— 目标 < 1.8s
   - TTFB（Time to First Byte，首字节时间）— 目标 < 800ms
3. 测量资源大小：
   - 页面总重量（目标 < 1MB）
   - JS 包大小（目标 < 200KB gzip 后）
   - CSS 大小
   - 图片重量
   - 第三方脚本重量
4. 统计网络请求数量
5. 检查渲染阻塞资源
```

### 模式 2：API 性能

对 API 端点进行基准测试：

```
1. 对每个端点发起 100 次请求
2. 测量：p50、p95、p99 延迟
3. 跟踪：响应大小、状态码
4. 负载测试：10 个并发请求
5. 与 SLA 目标比较
```

### 模式 3：构建性能

测量开发反馈循环：

```
1. 冷构建时间
2. 热重载时间（HMR）
3. 测试套件执行时间
4. TypeScript 检查时间
5. Lint 时间
6. Docker 构建时间
```

### 模式 4：前后对比

在变更前后运行以测量影响：

```
/benchmark baseline    # 保存当前指标
# ... 进行变更 ...
/benchmark compare     # 与基准线比较
```

输出：
```
| 指标 | 之前 | 之后 | 变化 | 判断 |
|--------|--------|-------|-------|---------|
| LCP | 1.2s | 1.4s | +200ms | 警告 |
| Bundle | 180KB | 175KB | -5KB | ✓ 更好 |
| Build | 12s | 14s | +2s | 警告 |
```

## 输出

将基准线存储为 JSON 文件在 `.ecc/benchmarks/` 目录中。纳入 Git 版本控制，团队共享基准线。

## 集成

- CI：在每个 PR 上运行 `/benchmark compare`
- 与 `/canary-watch` 配合用于部署后监控
- 与 `/browser-qa` 配合用于完整的发货前检查清单
