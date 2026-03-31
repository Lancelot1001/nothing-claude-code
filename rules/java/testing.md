---
paths:
  - "**/*.java"
  - "**/*.kt"
  - "**/pom.xml"
  - "**/build.gradle"
  - "**/build.gradle.kts"
  - "**/settings.gradle"
---
# Java 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 Java 特定内容。

## 框架

- **JUnit 5**（Jupiter）：主测试框架
- **AssertJ**：流畅的断言
- **Mockito**：mock 框架
- **Testcontainers**：集成测试的 Docker 容器

## 断言风格

```java
assertThat(user.getName()).isNotNull();
assertThat(user.getEmail()).isEqualTo("test@example.com");
assertThatThrownBy(() -> userService.create(null))
    .isInstanceOf(IllegalArgumentException.class)
    .hasMessage("User cannot be null");
```

## Mockito

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void findByEmail_WhenUserExists_ReturnsUser() {
        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(Optional.of(new User("test", "test@example.com")));

        Optional<User> result = userService.findByEmail("test@example.com");

        assertThat(result).isPresent();
    }
}
```

## Testcontainers

```java
@Testcontainers
class DatabaseIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Test
    void testConnection() {
        DataSource dataSource = DriverManager.getDataSource(postgres.getJdbcUrl());
        assertThat(dataSource.getConnection()).isNotNull();
    }
}
```

## Maven 覆盖率

```bash
mvn test jacoco:report
```

## 参考

参见 skill: `java-spring-patterns` 获取更多 Java 测试模式。
