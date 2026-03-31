---
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/pom.xml"
  - "**/build.gradle.kts"
  - "**/settings.gradle.kts"
---
# Kotlin 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Kotlin 特定内容。

## Secret Management

- 绝不将密钥硬编码
- Android：使用 `EncryptedSharedPreferences`
- 服务器：使用环境变量或密钥管理服务

```kotlin
val apiKey = System.getenv("API_KEY")
    ?: throw IllegalStateException("API_KEY not configured")
```

## SQL 注入防护

- 使用参数化查询
- 使用 Room 的 `@Query` 带参数绑定

```kotlin
@Query("SELECT * FROM users WHERE email = :email")
suspend fun findByEmail(email: String): User?
```

## 输入验证

- 使用 Kotlin  Contracts 或注解（`@Size`、`@Email`）
- 使用 `require()` 和 `check()` 进行预条件验证

## Certificate Pinning

Android 应用中为关键端点配置证书锁定。

## Android 特定

- 绝不将敏感数据存储在普通 SharedPreferences
- 使用 `Jetpack Security` 加密敏感数据
- 遵循 OWASP Mobile Top 10

## 参考

参见 skill: `kotlin-coroutines` 获取更多 Kotlin 安全实践。
