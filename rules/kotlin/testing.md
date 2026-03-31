---
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/pom.xml"
  - "**/build.gradle.kts"
  - "**/settings.gradle.kts"
---
# Kotlin 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 Kotlin 特定内容。

## 框架

- **kotlin.test**：Kotlin 原生测试库
- **MockK**：Kotlin 专用 mock 框架
- **Turbine**：Flow 测试
- **Room**/**SQLDelight** 测试：使用 in-memory 数据库

## kotlin.test

```kotlin
class UserServiceTest {
    @Test
    fun `creates user with valid email`() = runTest {
        val service = UserService(userRepository)
        val result = service.createUser("test@example.com", "Alice")
        assertEquals("Alice", result.name)
    }

    @Test
    fun `rejects invalid email`() = runTest {
        val service = UserService(userRepository)
        assertFailsWith<IllegalArgumentException> {
            service.createUser("invalid", "Bob")
        }
    }
}
```

## Flow 测试（Turbine）

```kotlin
@Test
fun `emits users from repository`() = runTest {
    val repository = FakeUserRepository(listOf(User("test@example.com")))
    val flow = repository.observeUsers()

    turbineTest {
        expectItem().email == "test@example.com"
        expectComplete()
    }
}
```

## Room 测试

```kotlin
@get:Rule
val roomRule = Room.inMemoryDatabaseRule()

@Test
fun `insert and query user`() = run {
    val db = roomRule.db
    db.userDao().insert(User(email = "test@example.com"))
    val user = db.userDao().findByEmail("test@example.com")
    assertEquals("test@example.com", user?.email)
}
```

## 参考

参见 skill: `kotlin-coroutines` 获取更多 Kotlin 测试模式。
