---
description: 增量修复 Go 构建错误、go vet 警告和 linter 问题。调用 go-build-resolver agent进行最小化、精确的修复。
---

# Go 构建与修复

此命令调用 **go-build-resolver** agent来以最小化变更增量修复 Go 构建错误。

## 此命令做什么

1. **运行诊断**：执行 `go build`、`go vet`、`staticcheck`
2. **解析错误**：按文件分组并按严重性排序
3. **增量修复**：一次处理一个错误
4. **验证每个修复**：每次更改后重新运行构建
5. **报告摘要**：显示已修复的内容和剩余内容

## 使用场景

在以下情况使用 `/go-build`：
- `go build ./...` 失败并报错
- `go vet ./...` 报告问题
- `golangci-lint run` 显示警告
- 模块依赖损坏
- 拉取导致构建中断的更改后

## 运行的诊断命令

```bash
# 主要构建检查
go build ./...

# 静态分析
go vet ./...

# 扩展 linting（如果可用）
staticcheck ./...
golangci-lint run

# 模块问题
go mod verify
go mod tidy -v
```

## 示例会话

```text
用户：/go-build

agent：
# Go 构建解决

## 初始诊断

```bash
$ go build ./...
internal/service/user.go:25:15: undefined: UserRepository
internal/handler/api.go:42:9: cannot use x (type string) as type int
internal/handler/api.go:58:2: missing return at end of function
```

发现 3 个错误。

## 修复 1：未定义标识符

文件：internal/service/user.go:25
错误：undefined: UserRepository
原因：缺少 import

```go
// 添加 import
import "project/internal/repository"

// 更改
var repo UserRepository
// 为
var repo repository.UserRepository
```

```bash
$ go build ./...
# 剩余 2 个错误
```

## 修复 2：类型不匹配

文件：internal/handler/api.go:42
错误：cannot use x (type string) as type int

```go
// 更改
count := params.Get("count")
// 为
countStr := params.Get("count")
count, _ := strconv.Atoi(countStr)
```

```bash
$ go build ./...
# 剩余 1 个错误
```

## 修复 3：缺少返回

文件：internal/handler/api.go:58
错误：missing return at end of function

```go
func GetUser(id string) (*User, error) {
    if id == "" {
        return nil, ErrInvalidID
    }
    user := findUser(id)
    // 添加缺少的 return
    return user, nil
}
```

```bash
$ go build ./...
# 构建成功！
```

## 最终验证

```bash
$ go vet ./...
# 无问题

$ go test ./...
ok      project/internal/service   0.015s
ok      project/internal/handler   0.023s
```

## 摘要

| 指标 | 数量 |
|--------|-------|
| 修复的构建错误 | 3 |
| 修复的 vet 警告 | 0 |
| 修改的文件 | 2 |
| 剩余问题 | 0 |

构建状态：通过：成功
```

## 修复的常见错误

| 错误 | 典型修复 |
|-------|-------------|
| `undefined: X` | 添加 import 或修复拼写错误 |
| `cannot use X as Y` | 类型转换或修复赋值 |
| `missing return` | 添加 return 语句 |
| `X does not implement Y` | 添加缺失的方法 |
| `import cycle` | 重组包 |
| `declared but not used` | 删除或使用变量 |
| `cannot find package` | `go get` 或 `go mod tidy` |

## 修复策略

1. **先处理构建错误** - 代码必须能编译
2. **其次处理 vet 警告** - 修复可疑构造
3. **然后处理 lint 警告** - 样式和最佳实践
4. **一次一个修复** - 验证每个更改
5. **最小化更改** - 不重构，只修复

## 停止条件

agent在以下情况下停止并报告：
- 同一错误在 3 次尝试后仍然存在
- 修复引入了更多错误
- 需要架构更改
- 缺少外部依赖

## 相关命令

- `/go-test` - 构建成功后运行测试
- `/go-review` - 审查代码质量
- `/verify` - 完整验证循环

## 相关

- agent：`agents/go-build-resolver.md`
- skill：`skills/golang-patterns/`
