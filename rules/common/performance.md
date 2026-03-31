# 性能规则

## 模型选择

### 模型对比

| 模型 | 适用场景 | 成本 | 速度 |
|------|---------|------|------|
| **Haiku** | 简单任务、快速操作 | 低 | 快 |
| **Sonnet** | 通用开发、中等复杂度 | 中 | 中 |
| **Opus** | 复杂推理、大规模重构 | 高 | 慢 |

### 选择指南

```typescript
// 简单/重复任务 → Haiku
// 示例：格式化代码、简单查找、重命名变量

// 通用开发 → Sonnet
// 示例：写新功能、代码审查、小型重构

// 复杂系统 → Opus
// 示例：系统设计、复杂重构、多文件架构变更
```

### `/model-route` 命令

```bash
# 自动路由任务到合适的模型
/model-route "修复这个 Bug"
# → 建议使用 Sonnet

/model-route "设计微服务架构"
# → 建议使用 Opus
```

---

## 上下文管理

### 上下文窗口

- 典型上下文窗口：**200k tokens**
- 压缩后可能只有：**70k tokens**
- **危险区域**：最后 20%

### 管理原则

```
大重构和多文件功能 → 避免使用最后 20% 的上下文
低敏感度任务 → 可以容忍更高利用率
```

### 优化策略

1. **早点压缩**
   ```bash
   # 当上下文超过 70% 时考虑压缩
   /checkpoint  # 标记检查点
   /compact     # 手动触发压缩
   ```

2. **减少探索**
   ```bash
   /context-budget  # 分析 Token 使用
   # 找出开销最大的部分
   ```

3. **使用子agent**
   - 并行执行减少主上下文负担
   - 子agent结果汇总到主agent

---

## MCP 管理

### 上下文窗口杀手

**启用太多 MCP 会严重影响上下文窗口！**

- 配置 20-30 个 MCP
- 每个项目启用 **少于 10 个**
- 活跃工具 **少于 80 个**

### 最佳实践

```json
// ~/.claude.json 项目配置
{
  "mcpServers": {
    // 全部配置在这里
  },
  "projects": {
    "my-project": {
      "disabledMcpServers": ["unused-mcp-1", "unused-mcp-2"]
    }
  }
}
```

### 检查 MCP 状态

```bash
# 查看当前 MCP
/mcp

# 禁用未使用的 MCP
# 在 /plugins 界面或通过项目配置
```

---

## 构建性能

### 构建错误排查

```bash
# 使用专门的agent
/build-fix

# 增量修复
# 1. 修复一个错误
# 2. 验证
# 3. 重复
```

### 并行构建

```bash
# 使用 --jobs 参数
npm run build -- --jobs 4

# 或使用 turbo/buildool
turbo build --parallel
```

---

## 增量操作

### 文件操作

```bash
# 避免一次性处理大量文件
# 改为分批处理

# 示例：大重构
batch 1: 重构核心模块（10个文件）
batch 2: 更新依赖模块（10个文件）
batch 3: 更新测试文件（10个文件）
```

### 检查点策略

```bash
# 完成每个批次后保存检查点
/checkpoint "完成核心模块重构"

# 这样如果需要回滚，可以定位到具体批次
```

---

## 缓存和复用

### 避免重复工作

```bash
# 使用 /resume-session 恢复之前的会话
/resume-session

# 使用子agent缓存结果
# 子agent完成的工作会被记住
```

### 长期任务

```bash
# 使用 tmux 保持会话
tmux new -s dev
# Claude 在 tmux 中运行
# 可以 detach/reattach

# 或使用 /loop-start
/loop-start "检查构建状态" --interval 5m
```

---

## 监控和诊断

### `/context-budget`

```bash
/context-budget
# 输出：
# - Token 使用统计
# - 最高开销来源
# - 优化建议
```

### `/harness-audit`

```bash
/harness-audit
# 输出：
# - 配置可靠性评估
# - 成本优化建议
# - 吞吐量建议
```
