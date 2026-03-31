---
paths:
  - "**/*.cs"
  - "**/*.csx"
  - "**/*.cake"
  - "**/*.sln"
  - "**/*.csproj"
---
# C# 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 C# 特定内容。

## .NET 约定

- 遵循 Microsoft .NET 编码约定
- 使用 **文件结构组织**（每类一个文件）
- 使用 `nameof()` 避免字符串字面量
- 使用 `using static` 导入静态成员

## 可空类型

- 启用可空引用类型：`#nullable enable`
- 在引用类型后使用 `?` 表示可为 null
- 使用 null 合并运算符 `??` 和 null 条件运算符 `?.`

## Async 模式

- 优先使用 `async`/`await` 而非阻塞式等待
- 使用 `Task.Run()` 将 CPU 密集型操作移到线程池
- 避免 `async void`——仅用于事件处理器

## 命名

- 方法/属性：`PascalCase`
- 局部变量/参数：`camelCase`
- 常量：`PascalCase`
- 私有字段：`camelCase` 或 `_camelCase`（依团队约定）

## 参考

参见 skill: `csharp-dotnet-patterns` 获取全面的 .NET/C# 模式。
