---
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/pom.xml"
  - "**/build.gradle.kts"
  - "**/settings.gradle.kts"
---
# Kotlin 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 Kotlin 特定内容。

## 依赖注入（Koin）

```kotlin
val appModule = module {
    single { UserRepository(get()) }
    single { UserService(get()) }
}
```

## ViewModel（Android）

```kotlin
class UserViewModel(
    private val getUserUseCase: GetUserUseCase
) : ViewModel() {

    private val _state = MutableStateFlow<UserState>(UserState.Loading)
    val state: StateFlow<UserState> = _state.asStateFlow()

    fun loadUser(id: Long) {
        viewModelScope.launch {
            _state.value = UserState.Loading
            getUserUseCase(id)
                .onSuccess { _state.value = UserState.Success(it) }
                .onFailure { _state.value = UserState.Error(it.message) }
        }
    }
}
```

## UseCase 模式

```kotlin
class GetUserUseCase(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(userId: Long): Result<User> {
        return userRepository.findById(userId)?.let { Result.success(it) }
            ?: Result.failure(NotFoundException("User not found"))
    }
}
```

## Coroutines

- 使用 `suspend` 函数处理异步操作
- 使用 `Flow` 处理数据流
- 使用 `Dispatchers.IO` 进行 I/O 操作

```kotlin
suspend fun fetchUsers(): List<User> = withContext(Dispatchers.IO) {
    api.getUsers()
}
```

## 参考

参见 skill: `kotlin-coroutines` 获取全面的 Kotlin 模式。
