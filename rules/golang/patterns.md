---
paths:
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
---
# Go 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 Go 特定内容。

## Functional Options

```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func NewServer(opts ...Option) *Server {
    s := &Server{port: 8080}
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

## Small Interfaces

在**使用处**定义 interface，而非在实现处定义。

## Dependency Injection

使用构造函数注入依赖：

```go
func NewUserService(repo UserRepository, logger Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}
```

## 参考

参见 skill: `golang-patterns` 获取全面的 Go 模式，包括并发、错误处理和包组织。
