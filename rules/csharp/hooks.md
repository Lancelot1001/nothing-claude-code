---
paths:
  - "**/*.cs"
  - "**/*.csx"
  - "**/*.cake"
  - "**/*.sln"
  - "**/*.csproj"
---
# C# Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 C# 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **dotnet format**：编辑 `.cs` 文件后自动格式化
- **dotnet build**：验证修改后代码编译通过
- **dotnet test**：运行相关测试

## 警告

- 标记未使用的 `using` 引用
- 标记未使用的私有方法
