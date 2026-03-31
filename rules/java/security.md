---
paths:
  - "**/*.java"
  - "**/*.kt"
  - "**/pom.xml"
  - "**/build.gradle"
  - "**/build.gradle.kts"
  - "**/settings.gradle"
---
# Java 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Java 特定内容。

## Secret Management

- 绝不将密钥硬编码
- 使用环境变量或 Spring Cloud Config、HashiCorp Vault
- 生产使用云服务商密钥管理（AWS Secrets Manager、Azure Key Vault）

```java
String apiKey = System.getenv("API_KEY");
if (apiKey == null || apiKey.isBlank()) {
    throw new IllegalStateException("API_KEY not configured");
}
```

## SQL 注入防护

- 使用 PreparedStatement 参数化查询
- 使用 JPA 的 `@Query` 带命名参数
- 避免字符串拼接构建 SQL

```java
// GOOD
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// BAD — SQL 注入风险
@Query("SELECT u FROM User u WHERE u.email = '" + email + "'")
```

## 输入验证

- 使用 Bean Validation（JSR-380）：`@NotBlank`、`@NotNull`、`@Email`
- 在 Controller 层验证所有输入
- 失败时返回明确的错误消息

## OWASP

遵循 OWASP Top 10：

- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A07: Identification and Authentication Failures

## 依赖安全

- 使用 `mvn dependency:analyze` 或 ` OWASP Dependency Check`
- 定期更新依赖
- 启用 Gradle 的 dependency locking

## 参考

参见 skill: `java-spring-patterns` 获取更多 Java 安全实践。
