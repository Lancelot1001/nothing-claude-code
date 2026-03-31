---
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/pom.xml"
  - "**/build.gradle.kts"
  - "**/settings.gradle.kts"
---
# Kotlin 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Kotlin 特定内容。

## 格式化

- **ktlint**：代码风格检查
- **ktfmt**：代码格式化

## Null 安全

- 优先使用 nullable 类型（`?`）而非防御性检查
- 使用 `?.`（安全调用）和 `?:`（Elvis 运算符）
- 使用 `requireNotNull` 和 `checkNotNull` 进行预条件验证

```kotlin
val name: String? = user.name
val displayName = name ?: "Anonymous"
```

## Sealed Types

用于受限的类层次结构：

```kotlin
sealed interface Result<out T>
data class Success<T>(val data: T) : Result<T>
data class Error(val message: String) : Result<Nothing>
```

## Scope Functions

在特定上下文中执行代码块：

```kotlin
// let — 转换
val name = user?.name?.let { it.uppercase() }

// with — 在对象上调用多个方法
with(user) {
    println(name)
    println(email)
}

// run — 配置对象
val result = service.run {
    timeout = 5000
    execute()
}
```

## 命名

- 类/接口：`PascalCase`
- 函数/变量：`camelCase`
- 常量（`companion object` 内）：`UPPER_SNAKE_CASE`

## 参考

参见 skill: `kotlin-coroutines` 获取全面的 Kotlin 惯用模式。
