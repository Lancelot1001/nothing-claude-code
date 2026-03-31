---
paths:
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
---
# Go 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Go 特定内容。

## 格式化

- **gofmt** 和 **goimports** 是强制要求——无需讨论代码风格

## 设计原则

- 接受 interface，返回 struct
- 保持 interface 小型化（1-3 个方法）

## 错误处理

始终使用上下文包装错误：

```go
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}
```

## 参考

参见 skill: `golang-patterns` 获取全面的 Go 惯用模式和最佳实践。
