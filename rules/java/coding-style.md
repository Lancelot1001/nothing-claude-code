---
paths:
  - "**/*.java"
  - "**/*.kt"
  - "**/pom.xml"
  - "**/build.gradle"
  - "**/build.gradle.kts"
  - "**/settings.gradle"
---
# Java 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Java 特定内容。

## 标准

- 遵循 Oracle/Java SE 编码约定
- Java 17+：优先使用 modern Java 特性

## Modern Java 特性

### Records

用于不可变数据载体：

```java
public record UserDTO(String name, String email, int age) {}
```

### Sealed Types

限制类层次结构：

```java
public sealed interface Shape permits Circle, Rectangle, Square {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
```

### Optional

用于可能无值的情况：

```java
Optional<String> name = user.getName();
String displayName = name.orElse("Anonymous");
```

### Streams

链式集合操作：

```java
List<String> activeEmails = users.stream()
    .filter(User::isActive)
    .map(User::getEmail)
    .toList();
```

## 命名

- 类/接口：`PascalCase`
- 方法/变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`

## Immutability

- 优先使用 `final` 字段
- 使用 `List.of()`, `Set.of()`, `Map.of()` 创建不可变集合
- 使用 Builder 模式处理复杂对象构造

## 参考

参见 skill: `java-spring-patterns` 获取全面的 Java 模式。
