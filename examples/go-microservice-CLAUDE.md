# Go 微服务 — 项目 CLAUDE.md

> Go 微服务 + PostgreSQL + gRPC + Docker 的真实示例。
> 复制到项目根目录并为你的服务定制。

## 项目概述

**技术栈：** Go 1.22+、PostgreSQL、gRPC + REST (grpc-gateway)、Docker、sqlc（类型安全 SQL）、Wire（依赖注入）

**架构：** 清晰架构，分 domain、repository、service 和 handler 层。gRPC 作为主要传输，REST 网关用于外部客户端。

## 关键规则

### Go 约定

- 遵循 Effective Go 和 Go Code Review Comments 指南
- 使用 `errors.New` / `fmt.Errorf` 加 `%w` 包装——绝不字符串匹配错误
- 不使用 `init()` 函数——在 `main()` 或构造函数中显式初始化
- 无全局可变状态——通过构造函数传递依赖
- Context 必须是第一个参数并在所有层中传播

### 数据库

- 所有查询放在 `queries/` 作为纯 SQL——sqlc 生成类型安全的 Go 代码
- 迁移在 `migrations/` 中使用 golang-migrate——绝不直接修改数据库
- 使用 `pgx.Tx` 的事务处理多步操作
- 所有查询使用参数化占位符（`$1`、`$2`）——绝不字符串格式化

### 错误处理

- 返回错误，不 panic——panic 仅用于真正不可恢复的情况
- 用上下文包装错误：`fmt.Errorf("creating user: %w", err)`
- 在 `domain/errors.go` 中定义业务逻辑的哨兵错误
- 在 handler 层将领域错误映射到 gRPC 状态码

```go
// Domain layer — sentinel errors
var (
    ErrUserNotFound  = errors.New("user not found")
    ErrEmailTaken    = errors.New("email already registered")
)

// Handler layer — map to gRPC status
func toGRPCError(err error) error {
    switch {
    case errors.Is(err, domain.ErrUserNotFound):
        return status.Error(codes.NotFound, err.Error())
    case errors.Is(err, domain.ErrEmailTaken):
        return status.Error(codes.AlreadyExists, err.Error())
    default:
        return status.Error(codes.Internal, "internal error")
    }
}
```

### 代码风格

- 代码或注释中不用 emoji
- 导出类型和函数必须有文档注释
- 函数保持在 50 行以内——提取辅助函数
- 所有有多情况的逻辑使用表驱动测试
- 偏好 `struct{}` 用于信号通道，而非 `bool`

## 文件结构

```
cmd/
  server/
    main.go              # 入口点、Wire 注入、优雅关闭
internal/
  domain/                # 业务类型和接口
    user.go              # User 实体和 repository 接口
    errors.go            # 哨兵错误
  service/               # 业务逻辑
    user_service.go
    user_service_test.go
  repository/            # 数据访问（sqlc 生成 + 自定义）
    postgres/
      user_repo.go
      user_repo_test.go  # 使用 testcontainers 的集成测试
  handler/              # gRPC + REST 处理器
    grpc/
      user_handler.go
    rest/
      user_handler.go
  config/                # 配置加载
    config.go
proto/                   # Protobuf 定义
  user/v1/
    user.proto
queries/                 # sqlc 的 SQL 查询
  user.sql
migrations/              # 数据库迁移
  001_create_users.up.sql
  001_create_users.down.sql
```

## 关键模式

### Repository 接口

```go
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    FindByID(ctx context.Context, id uuid.UUID) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id uuid.UUID) error
}
```

### 带依赖注入的服务

```go
type UserService struct {
    repo   domain.UserRepository
    hasher PasswordHasher
    logger *slog.Logger
}

func NewUserService(repo domain.UserRepository, hasher PasswordHasher, logger *slog.Logger) *UserService {
    return &UserService{repo: repo, hasher: hasher, logger: logger}
}

func (s *UserService) Create(ctx context.Context, req CreateUserRequest) (*domain.User, error) {
    existing, err := s.repo.FindByEmail(ctx, req.Email)
    if err != nil && !errors.Is(err, domain.ErrUserNotFound) {
        return nil, fmt.Errorf("checking email: %w", err)
    }
    if existing != nil {
        return nil, domain.ErrEmailTaken
    }

    hashed, err := s.hasher.Hash(req.Password)
    if err != nil {
        return nil, fmt.Errorf("hashing password: %w", err)
    }

    user := &domain.User{
        ID:       uuid.New(),
        Name:     req.Name,
        Email:    req.Email,
        Password: hashed,
    }
    if err := s.repo.Create(ctx, user); err != nil {
        return nil, fmt.Errorf("creating user: %w", err)
    }
    return user, nil
}
```

### 表驱动测试

```go
func TestUserService_Create(t *testing.T) {
    tests := []struct {
        name    string
        req     CreateUserRequest
        setup   func(*MockUserRepo)
        wantErr error
    }{
        {
            name: "valid user",
            req:  CreateUserRequest{Name: "Alice", Email: "alice@example.com", Password: "secure123"},
            setup: func(m *MockUserRepo) {
                m.On("FindByEmail", mock.Anything, "alice@example.com").Return(nil, domain.ErrUserNotFound)
                m.On("Create", mock.Anything, mock.Anything).Return(nil)
            },
            wantErr: nil,
        },
        {
            name: "duplicate email",
            req:  CreateUserRequest{Name: "Alice", Email: "taken@example.com", Password: "secure123"},
            setup: func(m *MockUserRepo) {
                m.On("FindByEmail", mock.Anything, "taken@example.com").Return(&domain.User{}, nil)
            },
            wantErr: domain.ErrEmailTaken,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            repo := new(MockUserRepo)
            tt.setup(repo)
            svc := NewUserService(repo, &bcryptHasher{}, slog.Default())

            _, err := svc.Create(context.Background(), tt.req)

            if tt.wantErr != nil {
                assert.ErrorIs(t, err, tt.wantErr)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## 环境变量

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/myservice?sslmode=disable

# gRPC
GRPC_PORT=50051
REST_PORT=8080

# Auth
JWT_SECRET=           # 生产环境从 vault 加载
TOKEN_EXPIRY=24h

# Observability
LOG_LEVEL=info        # debug, info, warn, error
OTEL_ENDPOINT=        # OpenTelemetry collector
```

## 测试策略

```bash
/go-test             # Go TDD 工作流
/go-review           # Go 代码审查
/go-build            # 修复构建错误
```

### 测试命令

```bash
# 单元测试（快速，无外部依赖）
go test ./internal/... -short -count=1

# 集成测试（需要 Docker 用于 testcontainers）
go test ./internal/repository/... -count=1 -timeout 120s

# 带覆盖率的所有测试
go test ./... -coverprofile=coverage.out -count=1
go tool cover -func=coverage.out  # summary
go tool cover -html=coverage.out  # browser

# 竞态检测器
go test ./... -race -count=1
```

## ECC 工作流

```bash
# 规划
/plan "Add rate limiting to user endpoints"

# 开发
/go-test                  # Go 特定模式的 TDD

# 审查
/go-review                # Go 惯用模式、错误处理、并发
/security-scan            # 秘密和漏洞

# 合并前
go vet ./...
staticcheck ./...
```

## Git 工作流

- `feat:` 新功能，`fix:` bug 修复，`refactor:` 代码更改
- 从 `main` 创建功能分支，需要 PR
- CI：`go vet`、`staticcheck`、`go test -race`、`golangci-lint`
- 部署：CI 中构建 Docker 镜像，部署到 Kubernetes
