---
description: 全面审查 Kotlin 代码的惯用模式、空安全、协程安全性和安全性。调用 kotlin-reviewer agent。
---

# Kotlin 代码审查

此命令调用 **kotlin-reviewer** agent进行全面的 Kotlin 特定代码审查。

## 此命令做什么

1. **识别 Kotlin 变更**：通过 `git diff` 找到修改的 `.kt` 和 `.kts` 文件
2. **运行构建和静态分析**：执行 `./gradlew build`、`detekt`、`ktlintCheck`
3. **安全扫描**：检查 SQL 注入、命令注入、硬编码密钥
4. **空安全审查**：分析 `!!` 使用、平台类型处理、不安全转换
5. **协程审查**：检查结构化并发、调度器使用、取消
6. **生成报告**：按严重性分类问题

## 使用场景

在以下情况使用 `/kotlin-review`：
- 编写或修改 Kotlin 代码后
- 提交 Kotlin 更改前
- 审查包含 Kotlin 代码的拉取请求
- 加入新的 Kotlin 代码库
- 学习惯用 Kotlin 模式

## 审查类别

### 严重（必须修复）
- SQL/命令注入漏洞
- 无正当理由的强制解包 `!!`
- 平台类型空安全违规
- GlobalScope 使用（结构化并发违规）
- 硬编码凭证
- 不安全反序列化

### 高（应该修复）
- 可用不可变时使用可变状态
- 协程上下文中的阻塞调用
- 长循环中缺少取消检查
- sealed 类型上非穷举的 `when`
- 大函数（>50 行）
- 深嵌套（>4 层）

### 中等（考虑）
- 非惯用 Kotlin（Java 风格模式）
- 缺少尾随逗号
- 作用域函数误用或嵌套
- 大集合链缺少 Sequence
- 冗余显式类型

## 运行的自动检查

```bash
# 构建检查
./gradlew build

# 静态分析
./gradlew detekt

# 格式检查
./gradlew ktlintCheck

# 测试
./gradlew test
```

## 示例用法

````text
用户：/kotlin-review

agent：
# Kotlin 代码审查报告

## 审查的文件
- src/main/kotlin/com/example/service/UserService.kt（已修改）
- src/main/kotlin/com/example/routes/UserRoutes.kt（已修改）

## 静态分析结果
✓ 构建：成功
✓ detekt：无问题
警告：ktlint：2 个格式警告

## 发现的问题

[严重] 强制解包空安全
文件：src/main/kotlin/com/example/service/UserService.kt:28
问题：在可空仓库结果上使用 !!
```kotlin
val user = repository.findById(id)!!  // NPE 风险
```
修复：使用带错误处理的安全调用
```kotlin
val user = repository.findById(id)
    ?: throw UserNotFoundException("User $id not found")
```

[高] GlobalScope 使用
文件：src/main/kotlin/com/example/routes/UserRoutes.kt:45
问题：使用 GlobalScope 破坏结构化并发
```kotlin
GlobalScope.launch {
    notificationService.sendWelcome(user)
}
```
修复：使用调用方的协程作用域
```kotlin
launch {
    notificationService.sendWelcome(user)
}
```

## 摘要
- 严重：1
- 高：1
- 中等：0

建议：失败：阻止合并，直到严重问题修复
````

## 批准标准

| 状态 | 条件 |
|--------|-----------|
| 通过：批准 | 无严重或高问题 |
| 警告：警告 | 只有中等问题（谨慎合并） |
| 失败：阻止 | 发现严重或高问题 |

## 与其他命令的集成

- 先使用 `/kotlin-test` 确保测试通过
- 如果有构建错误使用 `/kotlin-build`
- 提交前使用 `/kotlin-review`
- 使用 `/code-review` 处理非 Kotlin 特定问题

## 相关

- agent：`agents/kotlin-reviewer.md`
- skill：`skills/kotlin-patterns/`、`skills/kotlin-testing/`
