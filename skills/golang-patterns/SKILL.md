---
name: golang-patterns
description: 用于构建健壮、高效和可维护 Go 应用程序的习惯性 Go 模式、最佳实践和约定。
origin: something-claude-code
---

# Go 开发模式

用于构建健壮、高效和可维护应用程序的习惯性 Go 模式和最佳实践。

## 何时激活

- 编写新的 Go 代码
- 审查 Go 代码
- 重构现有 Go 代码
- 设计 Go 包/模块

## 核心原则

### 1. 简单性和清晰性

Go 偏向简单性而非技巧性。代码应该显而易见且易于阅读。

```go
// 好：清晰直接
func GetUser(id string) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// 差：过度技巧性
func GetUser(id string) (*User, error) {
    return func() (*User, error) {
        if u, e := db.FindUser(id); e == nil {
            return u, nil
        } else {
            return nil, e
        }
    }()
}
```

### 2. 让零值有用

设计类型使其零值无需初始化即可直接使用。

```go
// 好：零值有用
type Counter struct {
    mu    sync.Mutex
    count int // 零值是 0，可直接使用
}

func (c *Counter) Inc() {
    c.mu.Lock()
    c.count++
    c.mu.Unlock()
}

// 好：bytes.Buffer 零值可用
var buf bytes.Buffer
buf.WriteString("hello")

// 差：需要初始化
type BadCounter struct {
    counts map[string]int // nil map 会 panic
}
```

### 3. 接受接口，返回结构体

函数应接受接口参数并返回具体类型。

```go
// 好：接受接口，返回具体类型
func ProcessData(r io.Reader) (*Result, error) {
    data, err := io.ReadAll(r)
    if err != nil {
        return nil, err
    }
    return &Result{Data: data}, nil
}

// 差：返回接口（不必要的隐藏实现细节）
func ProcessData(r io.Reader) (io.Reader, error) {
    // ...
}
```

## 错误处理模式

### 带上下文的错误包装

```go
// 好：用上下文包装错误
func LoadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("load config %s: %w", path, err)
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parse config %s: %w", path, err)
    }

    return &cfg, nil
}
```

### 自定义错误类型

```go
// 定义领域特定错误
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}

// 常用情况的哨兵错误
var (
    ErrNotFound     = errors.New("resource not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrInvalidInput = errors.New("invalid input")
)
```

### 使用 errors.Is 和 errors.As 进行错误检查

```go
func HandleError(err error) {
    // 检查特定错误
    if errors.Is(err, sql.ErrNoRows) {
        log.Println("No records found")
        return
    }

    // 检查错误类型
    var validationErr *ValidationError
    if errors.As(err, &validationErr) {
        log.Printf("Validation error on field %s: %s",
            validationErr.Field, validationErr.Message)
        return
    }

    // 未知错误
    log.Printf("Unexpected error: %v", err)
}
```

### 绝不忽略错误

```go
// 差：用空标识符忽略错误
result, _ := doSomething()

// 好：处理或显式记录忽略原因
result, err := doSomething()
if err != nil {
    return err
}

// 可接受：当错误真的无关紧要时（很少见）
_ = writer.Close() // 最大努力清理，错误在其他地方记录
```

## 并发模式

### Worker Pool

```go
func WorkerPool(jobs <-chan Job, results chan<- Result, numWorkers int) {
    var wg sync.WaitGroup

    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- process(job)
            }
        }()
    }

    wg.Wait()
    close(results)
}
```

### 用于取消和超时的 Context

```go
func FetchWithTimeout(ctx context.Context, url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("fetch %s: %w", url, err)
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}
```

### 优雅关闭

```go
func GracefulShutdown(server *http.Server) {
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    <-quit
    log.Println("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exited")
}
```

### 用于协调 Goroutine 的 errgroup

```go
import "golang.org/x/sync/errgroup"

func FetchAll(ctx context.Context, urls []string) ([][]byte, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([][]byte, len(urls))

    for i, url := range urls {
        i, url := i, url // 捕获循环变量
        g.Go(func() error {
            data, err := FetchWithTimeout(ctx, url)
            if err != nil {
                return err
            }
            results[i] = data
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
```

### 避免 Goroutine 泄漏

```go
// 差：如果 context 取消，goroutine 泄漏
func leakyFetch(ctx context.Context, url string) <-chan []byte {
    ch := make(chan []byte)
    go func() {
        data, _ := fetch(url)
        ch <- data // 如果没有接收者永远阻塞
    }()
    return ch
}

// 好：正确处理取消
func safeFetch(ctx context.Context, url string) <-chan []byte {
    ch := make(chan []byte, 1) // 有缓冲 channel
    go func() {
        data, err := fetch(url)
        if err != nil {
            return
        }
        select {
        case ch <- data:
        case <-ctx.Done():
        }
    }()
    return ch
}
```

## 接口设计

### 小而专注的接口

```go
// 好：单方法接口
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// 按需组合接口
type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}
```

### 在使用处定义接口

```go
// 在消费方包中，而非提供方
package service

// UserStore 定义此服务需要什么
type UserStore interface {
    GetUser(id string) (*User, error)
    SaveUser(user *User) error
}

type Service struct {
    store UserStore
}

// 具体实现可以在另一个包中
// 它不需要知道这个接口
```

### 使用类型断言的可选行为

```go
type Flusher interface {
    Flush() error
}

func WriteAndFlush(w io.Writer, data []byte) error {
    if _, err := w.Write(data); err != nil {
        return err
    }

    // 如果支持则刷新
    if f, ok := w.(Flusher); ok {
        return f.Flush()
    }
    return nil
}
```

## 包组织

### 标准项目布局

```text
myproject/
├── cmd/
│   └── myapp/
│       └── main.go           # 入口点
├── internal/
│   ├── handler/              # HTTP 处理器
│   ├── service/              # 业务逻辑
│   ├── repository/           # 数据访问
│   └── config/               # 配置
├── pkg/
│   └── client/               # 公共 API 客户端
├── api/
│   └── v1/                   # API 定义（proto、OpenAPI）
├── testdata/                 # 测试固件
├── go.mod
├── go.sum
└── Makefile
```

### 包命名

```go
// 好：短、小写、无下划线
package http
package json
package user

// 差：冗长、混合大小写或多余
package httpHandler
package json_parser
package userService // 多余的 'Service' 后缀
```

### 避免包级状态

```go
// 差：全局可变状态
var db *sql.DB

func init() {
    db, _ = sql.Open("postgres", os.Getenv("DATABASE_URL"))
}

// 好：依赖注入
type Server struct {
    db *sql.DB
}

func NewServer(db *sql.DB) *Server {
    return &Server{db: db}
}
```

## 结构体设计

### 函数式选项模式

```go
type Server struct {
    addr    string
    timeout time.Duration
    logger  *log.Logger
}

type Option func(*Server)

func WithTimeout(d time.Duration) Option {
    return func(s *Server) {
        s.timeout = d
    }
}

func WithLogger(l *log.Logger) Option {
    return func(s *Server) {
        s.logger = l
    }
}

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{
        addr:    addr,
        timeout: 30 * time.Second, // 默认
        logger:  log.Default(),    // 默认
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// 使用
server := NewServer(":8080",
    WithTimeout(60*time.Second),
    WithLogger(customLogger),
)
```

### 嵌入实现组合

```go
type Logger struct {
    prefix string
}

func (l *Logger) Log(msg string) {
    fmt.Printf("[%s] %s\n", l.prefix, msg)
}

type Server struct {
    *Logger // 嵌入 - Server 获取 Log 方法
    addr    string
}

func NewServer(addr string) *Server {
    return &Server{
        Logger: &Logger{prefix: "SERVER"},
        addr:   addr,
    }
}

// 使用
s := NewServer(":8080")
s.Log("Starting...") // 调用嵌入的 Logger.Log
```

## 内存和性能

### 已知大小时预分配切片

```go
// 差：多次增长切片
func processItems(items []Item) []Result {
    var results []Result
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}

// 好：单次分配
func processItems(items []Item) []Result {
    results := make([]Result, 0, len(items))
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}
```

### 对频繁分配使用 sync.Pool

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func ProcessRequest(data []byte) []byte {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()

    buf.Write(data)
    // 处理...
    return buf.Bytes()
}
```

### 避免循环中字符串拼接

```go
// 差：创建许多字符串分配
func join(parts []string) string {
    var result string
    for _, p := range parts {
        result += p + ","
    }
    return result
}

// 好：使用 strings.Builder 单次分配
func join(parts []string) string {
    var sb strings.Builder
    for i, p := range parts {
        if i > 0 {
            sb.WriteString(",")
        }
        sb.WriteString(p)
    }
    return sb.String()
}

// 最好：使用标准库
func join(parts []string) string {
    return strings.Join(parts, ",")
}
```

## Go 工具集成

### 必要命令

```bash
# 构建和运行
go build ./...
go run ./cmd/myapp

# 测试
go test ./...
go test -race ./...
go test -cover ./...

# 静态分析
go vet ./...
staticcheck ./...
golangci-lint run

# 模块管理
go mod tidy
go mod verify

# 格式化
gofmt -w .
goimports -w .
```

### 推荐 Linter 配置 (.golangci.yml)

```yaml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - misspell
    - unconvert
    - unparam

linters-settings:
  errcheck:
    check-type-assertions: true
  govet:
    check-shadowing: true

issues:
  exclude-use-default: false
```

## 快速参考：Go 惯用法

| 惯用法 | 描述 |
|--------|------|
| 接受接口，返回结构体 | 函数接受接口参数，返回具体类型 |
| 错误是值 | 将错误作为一级值处理，而非异常 |
| 不要通过共享内存通信 | 使用 channel 进行 goroutine 间的协调 |
| 让零值有用 | 类型应无需显式初始化即可工作 |
| 一点拷贝好过一点依赖 | 避免不必要的外部依赖 |
| 清晰好过技巧 | 优先考虑可读性而非技巧性 |
| gofmt 不是任何人的最爱但都是朋友 | 始终使用 gofmt/goimports 格式化 |
| 早返回 | 先处理错误，保持快乐路径不缩进 |

## 应避免的反模式

```go
// 差：在长函数中使用 naked returns
func process() (result int, err error) {
    // ... 50 行 ...
    return // 返回什么？
}

// 差：使用 panic 进行控制流
func GetUser(id string) *User {
    user, err := db.Find(id)
    if err != nil {
        panic(err) // 不要这样做
    }
    return user
}

// 差：在结构体中传递 context
type Request struct {
    ctx context.Context // Context 应该是第一个参数
    ID  string
}

// 好：Context 作为第一个参数
func ProcessRequest(ctx context.Context, id string) error {
    // ...
}

// 差：混合值和指针接收器
type Counter struct{ n int }
func (c Counter) Value() int { return c.n }    // 值接收器
func (c *Counter) Increment() { c.n++ }        // 指针接收器
// 选择一种风格并保持一致
```

**记住**：Go 代码应该在最好的意义上无聊——可预测、一致且易于理解。当有疑问时，保持简单。
