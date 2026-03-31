---
paths:
  - "**/*.cs"
  - "**/*.csx"
  - "**/*.cake"
  - "**/*.sln"
  - "**/*.csproj"
---
# C# 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 C# 特定内容。

## API 响应格式

使用 `record` 定义一致的响应：

```csharp
public record ApiResponse<T>(
    bool Success,
    T? Data,
    string? Error
);
```

## Repository 接口

定义标准数据访问操作：

```csharp
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<IReadOnlyList<User>> GetAllAsync();
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(int id);
}
```

## 依赖注入

在 `Program.cs` 中注册服务：

```csharp
builder.Services.AddScoped<IUserRepository, SqlUserRepository>();
builder.Services.AddScoped<IEmailService, SendGridEmailService>();
```

## 参考

参见 skill: `csharp-dotnet-patterns` 获取全面的 .NET/C# 模式。
