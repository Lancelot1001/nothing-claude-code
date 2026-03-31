---
paths:
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
---
# Go 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Go 特定内容。

## Secret Management

```go
apiKey := os.Getenv("OPENAI_API_KEY")
if apiKey == "" {
    log.Fatal("OPENAI_API_KEY not configured")
}
```

## 安全扫描

- 使用 **gosec** 进行静态安全分析：
  ```bash
  gosec ./...
  ```

## Context 与超时

始终使用 `context.Context` 控制超时：

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```
