---
name: springboot-security
description: Java Spring Boot 服务的身份验证/授权、验证、CSRF、密钥、安全头、速率限制和依赖项安全最佳实践。
origin: something-claude-code
---

# Spring Boot 安全审查

在添加身份验证、处理输入、创建端点或处理密钥时使用。

## 何时激活

- 添加身份验证（JWT、OAuth2、基于会话）
- 实现授权（@PreAuthorize、基于角色的访问）
- 验证用户输入（Bean Validation、自定义验证器）
- 配置 CORS、CSRF 或安全头
- 管理密钥（Vault、环境变量）
- 添加速率限制或暴力破解防护
- 扫描依赖项的 CVE

## 身份验证

- 优先使用无状态 JWT 或带撤销列表的不透明令牌
- 使用 `httpOnly`、`Secure`、`SameSite=Strict` cookies 进行会话
- 使用 `OncePerRequestFilter` 或资源服务器验证令牌

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      Authentication auth = jwtService.authenticate(token);
      SecurityContextHolder.getContext().setAuthentication(auth);
    }
    chain.doFilter(request, response);
  }
}
```

## 授权

- 启用方法安全：`@EnableMethodSecurity`
- 使用 `@PreAuthorize("hasRole('ADMIN')")` 或 `@PreAuthorize("@authz.canEdit(#id)")`
- 默认拒绝；仅暴露所需的范围

```java
@RestController
@RequestMapping("/api/admin")
public class AdminController {

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/users")
  public List<UserDto> listUsers() {
    return userService.findAll();
  }

  @PreAuthorize("@authz.isOwner(#id, authentication)")
  @DeleteMapping("/users/{id}")
  public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    userService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
```

## 输入验证

- 在控制器上使用带 `@Valid` 的 Bean Validation
- 在 DTO 上应用约束：`@NotBlank`、`@Email`、`@Size`、自定义验证器
- 渲染前使用白名单清理任何 HTML

```java
// 错误：无验证
@PostMapping("/users")
public User createUser(@RequestBody UserDto dto) {
  return userService.create(dto);
}

// 正确：已验证的 DTO
public record CreateUserDto(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email String email,
    @NotNull @Min(0) @Max(150) Integer age
) {}

@PostMapping("/users")
public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserDto dto) {
  return ResponseEntity.status(HttpStatus.CREATED)
      .body(userService.create(dto));
}
```

## SQL 注入防护

- 使用 Spring Data repositories 或参数化查询
- 对于原生查询，使用 `:param` 绑定；永远不要拼接字符串

```java
// 错误：原生查询中的字符串拼接
@Query(value = "SELECT * FROM users WHERE name = '" + name + "'", nativeQuery = true)

// 正确：参数化原生查询
@Query(value = "SELECT * FROM users WHERE name = :name", nativeQuery = true)
List<User> findByName(@Param("name") String name);

// 正确：Spring Data 派生查询（自动参数化）
List<User> findByEmailAndActiveTrue(String email);
```

## 密码编码

- 始终使用 BCrypt 或 Argon2 哈希密码 — 永远不要存储明文
- 使用 `PasswordEncoder` bean，而非手动哈希

```java
@Bean
public PasswordEncoder passwordEncoder() {
  return new BCryptPasswordEncoder(12); // cost factor 12
}

// 在服务中
public User register(CreateUserDto dto) {
  String hashedPassword = passwordEncoder.encode(dto.password());
  return userRepository.save(new User(dto.email(), hashedPassword));
}
```

## CSRF 防护

- 对于浏览器会话应用，保持 CSRF 启用；在表单/头中包含令牌
- 对于使用 Bearer 令牌的纯 API，禁用 CSRF 并依赖无状态身份验证

```java
http
  .csrf(csrf -> csrf.disable())
  .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

## 密钥管理

- 源代码中不要包含密钥；从环境或 vault 加载
- 保持 `application.yml` 无凭据；使用占位符
- 定期轮换令牌和数据库凭据

```yaml
# 错误：在 application.yml 中硬编码
spring:
  datasource:
    password: mySecretPassword123

# 正确：环境变量占位符
spring:
  datasource:
    password: ${DB_PASSWORD}

# 正确：Spring Cloud Vault 集成
spring:
  cloud:
    vault:
      uri: https://vault.example.com
      token: ${VAULT_TOKEN}
```

## 安全头

```java
http
  .headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
      .policyDirectives("default-src 'self'"))
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
    .xssProtection(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)));
```

## CORS 配置

- 在安全过滤器级别配置 CORS，而非每个控制器
- 限制允许的来源 — 在生产环境中永远不要使用 `*`

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
  CorsConfiguration config = new CorsConfiguration();
  config.setAllowedOrigins(List.of("https://app.example.com"));
  config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
  config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
  config.setAllowCredentials(true);
  config.setMaxAge(3600L);

  UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
  source.registerCorsConfiguration("/api/**", config);
  return source;
}

// 在 SecurityFilterChain 中：
http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
```

## 速率限制

- 在昂贵的端点上应用 Bucket4j 或网关级限制
- 在突发时记录和告警；返回 429 并带重试提示

```java
// 使用 Bucket4j 进行每个端点的速率限制
@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  private Bucket createBucket() {
    return Bucket.builder()
        .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
        .build();
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    String clientIp = request.getRemoteAddr();
    Bucket bucket = buckets.computeIfAbsent(clientIp, k -> createBucket());

    if (bucket.tryConsume(1)) {
      chain.doFilter(request, response);
    } else {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
    }
  }
}
```

## 依赖项安全

- 在 CI 中运行 OWASP Dependency Check / Snyk
- 保持 Spring Boot 和 Spring Security 为受支持的版本
- 在发现已知 CVE 时使构建失败

## 日志记录和 PII

- 永远不要记录密钥、令牌、密码或完整的 PAN 数据
- 脱敏敏感字段；使用结构化 JSON 日志

## 文件上传

- 验证大小、内容类型和扩展名
- 存储在 web 根目录外；如需要则扫描

## 发布前检查清单

- [ ] 身份验证令牌已正确验证和过期
- [ ] 每个敏感路径都有授权保护
- [ ] 所有输入已验证和清理
- [ ] 无字符串拼接的 SQL
- [ ] CSRF 姿态符合应用类型
- [ ] 密钥已外部化；无提交
- [ ] 安全头已配置
- [ ] API 上启用了速率限制
- [ ] 依赖项已扫描且为最新
- [ ] 日志中无敏感数据

**记住**：默认拒绝、验证输入、最小权限、首先安全配置。
