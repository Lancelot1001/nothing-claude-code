---
paths:
  - "**/*.cs"
  - "**/*.csx"
  - "**/*.cake"
  - "**/*.sln"
  - "**/*.csproj"
---
# C# 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 C# 特定内容。

## Secret Management

- 绝不将密钥、密码或 token 硬编码
- 使用环境变量或 .NET Secret Manager（开发环境）
- 生产环境使用 Azure Key Vault、AWS Secrets Manager 或类似服务

```csharp
var apiKey = Environment.GetEnvironmentVariable("API_KEY");
if (string.IsNullOrEmpty(apiKey))
    throw new InvalidOperationException("API_KEY not configured");
```

## SQL 注入防护

- 始终使用参数化查询
- 使用 Entity Framework Core 的 LINQ 查询
- 避免字符串拼接构建 SQL

```csharp
// GOOD
var user = await context.Users
    .FirstOrDefaultAsync(u => u.Email == email);

// BAD — SQL 注入风险
var user = await context.Database
    .SqlQueryRaw($"SELECT * FROM users WHERE email = '{email}'");
```

## 输入验证

- 使用 Data Annotations 或 FluentValidation
- 在 API 层验证所有输入
- 失败时返回明确的错误消息

## 依赖安全

- 定期运行 `dotnet list package --outdated` 检查过时依赖
- 使用 `dotnet restore --audit` 检查安全漏洞
- 最小化依赖数量

## 参考

参见 skill: `csharp-dotnet-patterns` 获取更多 .NET/C# 安全实践。
