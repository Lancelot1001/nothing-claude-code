---
paths:
  - "**/*.java"
  - "**/*.kt"
  - "**/pom.xml"
  - "**/build.gradle"
  - "**/build.gradle.kts"
  - "**/settings.gradle"
---
# Java Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Java 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **google-java-format**：编辑 `.java` 文件后自动格式化
- **checkstyle**：代码风格检查
- **Maven build**（`mvn compile`）或 **Gradle build**（`./gradlew build`）：验证编译

## Maven Hook

```json
{
  "tool": "Bash",
  "description": "Run Maven compile",
  "command": "mvn compile -q"
}
```

## Gradle Hook

```json
{
  "tool": "Bash",
  "description": "Run Gradle compile",
  "command": "./gradlew compileJava --quiet"
}
```
