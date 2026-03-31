---
description: 增量修复 Kotlin/Gradle 构建错误、编译器警告和依赖问题。调用 kotlin-build-resolver agent进行最小化、精确的修复。
---

# Kotlin 构建与修复

此命令调用 **kotlin-build-resolver** agent来以最小化变更增量修复 Kotlin 构建错误。

## 此命令做什么

1. **运行诊断**：执行 `./gradlew build`、`detekt`、`ktlintCheck`
2. **解析错误**：按文件分组并按严重性排序
3. **增量修复**：一次处理一个错误
4. **验证每个修复**：每次更改后重新运行构建
5. **报告摘要**：显示已修复的内容和剩余内容

## 使用场景

在以下情况使用 `/kotlin-build`：
- `./gradlew build` 失败并报错
- Kotlin 编译器报告错误
- `./gradlew detekt` 报告违规
- Gradle 依赖解析失败
- 拉取导致构建中断的更改后

## 运行的诊断命令

```bash
# 主要构建检查
./gradlew build 2>&1

# 静态分析
./gradlew detekt 2>&1 || echo "detekt not configured"
./gradlew ktlintCheck 2>&1 || echo "ktlint not configured"

# 依赖问题
./gradlew dependencies --configuration runtimeClasspath 2>&1 | head -100

# 可选的深度刷新（当缓存或依赖元数据有问题时）
./gradlew build --refresh-dependencies
```

## 示例会话

````text
用户：/kotlin-build

agent：
# Kotlin 构建解决

## 初始诊断

```bash
$ ./gradlew build
e: src/main/kotlin/com/example/service/UserService.kt:25:15 Unresolved reference: UserRepository
e: src/main/kotlin/com/example/routes/UserRoutes.kt:42:9 Type mismatch: inferred type is String but Int was expected
e: src/main/kotlin/com/example/routes/UserRoutes.kt:58:5 'when' expression must be exhaustive
```

发现 3 个错误。

## 修复 1：无法解析的引用

文件：src/main/kotlin/com/example/service/UserService.kt:25
错误：Unresolved reference: UserRepository
原因：缺少 import

```kotlin
// 添加 import
import com.example.repository.UserRepository
```

```bash
$ ./gradlew build
# 剩余 2 个错误
```

## 修复 2：类型不匹配

文件：src/main/kotlin/com/example/routes/UserRoutes.kt:42
错误：Type mismatch: inferred type is String but Int was expected

```kotlin
// 更改
val count = call.parameters["count"]
// 为
val count = call.parameters["count"]?.toIntOrNull()
    ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid count")
```

```bash
$ ./gradlew build
# 剩余 1 个错误
```

## 修复 3：非穷举 When

文件：src/main/kotlin/com/example/routes/UserRoutes.kt:58
错误：'when' expression must be exhaustive

```kotlin
// 添加缺失的分支
when (user.role) {
    Role.ADMIN -> handleAdmin(user)
    Role.USER -> handleUser(user)
    Role.MODERATOR -> handleModerator(user) // 添加
}
```

```bash
$ ./gradlew build
# 构建成功！
```

## 最终验证

```bash
$ ./gradlew detekt
# 无问题

$ ./gradlew test
# 所有测试通过
```

## 摘要

| 指标 | 数量 |
|--------|-------|
| 修复的构建错误 | 3 |
| 修复的 Detekt 问题 | 0 |
| 修改的文件 | 2 |
| 剩余问题 | 0 |

构建状态：通过：成功
````

## 修复的常见错误

| 错误 | 典型修复 |
|-------|-------------|
| `Unresolved reference: X` | 添加 import 或依赖 |
| `Type mismatch` | 修复类型转换或赋值 |
| `'when' must be exhaustive` | 添加缺失的 sealed class 分支 |
| `Suspend function can only be called from coroutine` | 添加 `suspend` 修饰符 |
| `Smart cast impossible` | 使用本地 `val` 或 `let` |
| `None of the following candidates is applicable` | 修复参数类型 |
| `Could not resolve dependency` | 修复版本或添加仓库 |

## 修复策略

1. **先处理构建错误** - 代码必须能编译
2. **其次处理 Detekt 违规** - 修复代码质量问题
3. **然后处理 ktlint 警告** - 修复格式
4. **一次一个修复** - 验证每个更改
5. **最小化更改** - 不重构，只修复

## 停止条件

agent在以下情况下停止并报告：
- 同一错误在 3 次尝试后仍然存在
- 修复引入了更多错误
- 需要架构更改
- 缺少外部依赖

## 相关命令

- `/kotlin-test` - 构建成功后运行测试
- `/kotlin-review` - 审查代码质量
- `/verify` - 完整验证循环

## 相关

- agent：`agents/kotlin-build-resolver.md`
- skill：`skills/kotlin-patterns/`
