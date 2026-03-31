---
description: 全面审查 Go 代码的惯用模式、并发安全性、错误处理和安全性。调用 go-reviewer agent。
---

# Go 代码审查

此命令调用 **go-reviewer** agent进行全面的 Go 特定代码审查。

## 此命令做什么

1. **识别 Go 变更**：通过 `git diff` 找到修改的 `.go` 文件
2. **运行静态分析**：执行 `go vet`、`staticcheck` 和 `golangci-lint`
3. **安全扫描**：检查 SQL 注入、命令注入、竞态条件
4. **并发审查**：分析 goroutine 安全、channel 使用、互斥锁模式
5. **惯用 Go 检查**：验证代码遵循 Go 约定和最佳实践
6. **生成报告**：按严重性分类问题

## 使用场景

在以下情况使用 `/go-review`：
- 编写或修改 Go 代码后
- 提交 Go 更改前
- 审查包含 Go 代码的拉取请求
- 加入新的 Go 代码库
- 学习惯用 Go 模式

## 审查类别

### 严重（必须修复）
- SQL/命令注入漏洞
- 没有同步的竞态条件
- Goroutine 泄漏
- 硬编码凭证
- 不安全的指针使用
- 关键路径中忽略的错误

### 高（应该修复）
- 缺少带上下文的错误包装
- Panic 而非错误返回
- 上下文未传播
- 导致死锁的无缓冲 channel
- 接口未满足错误
- 缺少互斥锁保护

### 中等（考虑）
- 非惯用代码模式
- 导出缺少 godoc 注释
- 低效的字符串连接
- Slice 未预分配
- 未使用表驱动测试

## 运行的自动检查

```bash
# 静态分析
go vet ./...

# 高级检查（如果安装）
staticcheck ./...
golangci-lint run

# 竞态检测
go build -race ./...

# 安全漏洞
govulncheck ./...
```

## 示例用法

```text
用户：/go-review

agent：
# Go 代码审查报告

## 审查的文件
- internal/handler/user.go（已修改）
- internal/service/auth.go（已修改）

## 静态分析结果
✓ go vet：无问题
✓ staticcheck：无问题

## 发现的问题

[严重] 竞态条件
文件：internal/service/auth.go:45
问题：共享 map 在无同步的情况下访问
```go
var cache = map[string]*Session{}  // 并发访问！

func GetSession(id string) *Session {
    return cache[id]  // 竞态条件
}
```
修复：使用 sync.RWMutex 或 sync.Map
```go
var (
    cache   = map[string]*Session{}
    cacheMu sync.RWMutex
)

func GetSession(id string) *Session {
    cacheMu.RLock()
    defer cacheMu.RUnlock()
    return cache[id]
}
```

[高] 缺少错误上下文
文件：internal/handler/user.go:28
问题：返回的错误没有上下文
```go
return err  // 无上下文
```
修复：用上下文包装
```go
return fmt.Errorf("get user %s: %w", userID, err)
```

## 摘要
- 严重：1
- 高：1
- 中等：0

建议：失败：阻止合并，直到严重问题修复
```

## 批准标准

| 状态 | 条件 |
|--------|-----------|
| 通过：批准 | 无严重或高问题 |
| 警告：警告 | 只有中等问题（谨慎合并） |
| 失败：阻止 | 发现严重或高问题 |

## 与其他命令的集成

- 先使用 `/go-test` 确保测试通过
- 如果有构建错误使用 `/go-build`
- 提交前使用 `/go-review`
- 使用 `/code-review` 处理非 Go 特定问题

## 相关

- agent：`agents/go-reviewer.md`
- skill：`skills/golang-patterns/`、`skills/golang-testing/`
