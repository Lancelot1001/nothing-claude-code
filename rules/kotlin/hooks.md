---
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/pom.xml"
  - "**/build.gradle.kts"
  - "**/settings.gradle.kts"
---
# Kotlin Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Kotlin 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **ktfmt**：编辑 `.kt` 文件后自动格式化
- **ktlint**：代码风格检查
- **Gradle build**（`./gradlew build`）：验证编译

## Gradle Hook

```json
{
  "tool": "Bash",
  "description": "Run Kotlin compile",
  "command": "./gradlew compileKotlin --quiet"
}
```
