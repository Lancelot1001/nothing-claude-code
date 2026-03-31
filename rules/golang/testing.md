---
paths:
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
---
# Go 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 Go 特定内容。

## 框架

使用标准 `go test` 配合 **table-driven tests**。

## 竞态检测

始终使用 `-race` 标志运行：

```bash
go test -race ./...
```

## 覆盖率

```bash
go test -cover ./...
```

## 参考

参见 skill: `golang-testing` 获取详细的 Go 测试模式和辅助工具。
