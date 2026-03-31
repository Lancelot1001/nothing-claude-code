---
paths:
  - "**/*.cs"
  - "**/*.csx"
  - "**/*.cake"
  - "**/*.sln"
  - "**/*.csproj"
---
# C# 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 C# 特定内容。

## 框架

- **xUnit**：主测试框架
- **FluentAssertions**：更可读的断言
- **Moq**：mock 框架
- **Testcontainers**：集成测试的 Docker 容器

## 命名约定

```
[Fact]
public void UserService_CreateUser_WithValidData_ReturnsUser()
[Theory]
[InlineData("", "email@example.com")]
[InlineData("name", "")]
public void UserService_CreateUser_WithInvalidData_Throws(string name, string email)
```

## 测试隔离

每个测试创建 fresh instances——使用 fixture 管理共享资源。

## Testcontainers

```csharp
using var container = new PostgreSQLBuilder()
    .WithImage("postgres:15")
    .Build();
await container.StartAsync();
var connectionString = container.GetConnectionString();
```

## 覆盖率

```bash
dotnet test --collect:"XPlat Code Coverage"
```

## 参考

参见 skill: `csharp-dotnet-patterns` 获取更多 .NET/C# 测试模式。
