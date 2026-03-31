---
name: springboot-verification
description: "Spring Boot 项目的验证循环：构建、静态分析、带覆盖率的测试、安全扫描，以及发布或 PR 前的差异审查。"
origin: nothing-claude-code
---

# Spring Boot 验证循环

在 PR 前、重大更改后和部署前运行。

## 何时激活

- 为 Spring Boot 服务打开 pull request 之前
- 主要重构或依赖升级后
- 对 staging 或 production 进行预部署验证
- 运行完整的 build → lint → test → security scan 管道
- 验证测试覆盖率是否达到阈值

## 第一阶段：构建

```bash
mvn -T 4 clean verify -DskipTests
# 或
./gradlew clean assemble -x test
```

如果构建失败，停止并修复。

## 第二阶段：静态分析

Maven（常用插件）：
```bash
mvn -T 4 spotbugs:check pmd:check checkstyle:check
```

Gradle（如果已配置）：
```bash
./gradlew checkstyleMain pmdMain spotbugsMain
```

## 第三阶段：测试 + 覆盖率

```bash
mvn -T 4 test
mvn jacoco:report   # 验证 80%+ 覆盖率
# 或
./gradlew test jacocoTestReport
```

报告：
- 测试总数、通过/失败数
- 覆盖率 %（行/分支）

### 单元测试

使用 mock 依赖隔离测试服务逻辑：

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserRepository userRepository;
  @InjectMocks private UserService userService;

  @Test
  void createUser_validInput_returnsUser() {
    var dto = new CreateUserDto("Alice", "alice@example.com");
    var expected = new User(1L, "Alice", "alice@example.com");
    when(userRepository.save(any(User.class))).thenReturn(expected);

    var result = userService.create(dto);

    assertThat(result.name()).isEqualTo("Alice");
    verify(userRepository).save(any(User.class));
  }

  @Test
  void createUser_duplicateEmail_throwsException() {
    var dto = new CreateUserDto("Alice", "existing@example.com");
    when(userRepository.existsByEmail(dto.email())).thenReturn(true);

    assertThatThrownBy(() -> userService.create(dto))
        .isInstanceOf(DuplicateEmailException.class);
  }
}
```

### 使用 Testcontainers 的集成测试

使用真实数据库而非 H2 进行测试：

```java
@SpringBootTest
@Testcontainers
class UserRepositoryIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
      .withDatabaseName("testdb");

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired private UserRepository userRepository;

  @Test
  void findByEmail_existingUser_returnsUser() {
    userRepository.save(new User("Alice", "alice@example.com"));

    var found = userRepository.findByEmail("alice@example.com");

    assertThat(found).isPresent();
    assertThat(found.get().getName()).isEqualTo("Alice");
  }
}
```

### 使用 MockMvc 的 API 测试

使用完整 Spring 上下文测试控制器层：

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

  @Autowired private MockMvc mockMvc;
  @MockBean private UserService userService;

  @Test
  void createUser_validInput_returns201() throws Exception {
    var user = new UserDto(1L, "Alice", "alice@example.com");
    when(userService.create(any())).thenReturn(user);

    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name": "Alice", "email": "alice@example.com"}
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Alice"));
  }

  @Test
  void createUser_invalidEmail_returns400() throws Exception {
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name": "Alice", "email": "not-an-email"}
                """))
        .andExpect(status().isBadRequest());
  }
}
```

## 第四阶段：安全扫描

```bash
# 依赖项 CVE
mvn org.owasp:dependency-check-maven:check
# 或
./gradlew dependencyCheckAnalyze

# 源代码中的密钥
grep -rn "password\s*=\s*\"" src/ --include="*.java" --include="*.yml" --include="*.properties"
grep -rn "sk-\|api_key\|secret" src/ --include="*.java" --include="*.yml"

# Git 历史中的密钥
git secrets --scan  # 如果已配置
```

### 常见安全发现

```
# 检查 System.out.println（改用 logger）
grep -rn "System\.out\.print" src/main/ --include="*.java"

# 检查响应中的原始异常消息
grep -rn "e\.getMessage()" src/main/ --include="*.java"

# 检查通配符 CORS
grep -rn "allowedOrigins.*\*" src/main/ --include="*.java"
```

## 第五阶段：Lint/格式化（可选门槛）

```bash
mvn spotless:apply   # 如果使用 Spotless 插件
./gradlew spotlessApply
```

## 第六阶段：差异审查

```bash
git diff --stat
git diff
```

检查清单：
- 无遗留调试日志（`System.out`、无保护的 `log.debug`）
- 有意义的错误和 HTTP 状态码
- 需要的地方有事务和验证
- 配置更改已记录

## 输出模板

```
VERIFICATION REPORT
===================
Build:     [PASS/FAIL]
Static:    [PASS/FAIL] (spotbugs/pmd/checkstyle)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (CVE findings: N)
Diff:      [X files changed]

Overall:   [READY / NOT READY]

Issues to Fix:
1. ...
2. ...
```

## 持续模式

- 在重大更改或长会话中每 30–60 分钟重新运行各阶段
- 保持短循环：`mvn -T 4 test` + spotbugs 以快速反馈

**记住**：快速反馈胜于后期惊讶。保持门槛严格 — 在生产系统中将警告视为缺陷。
