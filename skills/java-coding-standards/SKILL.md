---
name: java-coding-standards
description: "Spring Boot 服务的 Java 编码规范：命名、不可变性、Optional 使用、流、异常、泛型和项目结构。"
origin: something-claude-code
---

# Java 编码规范

Spring Boot 服务中可读、可维护 Java（17+）代码的标准。

## 何时激活

- 在 Spring Boot 项目中编写或审查 Java 代码
- 强制执行命名、不可变性或异常处理约定
- 使用 records、sealed 类或模式匹配（Java 17+）
- 审查 Optional、流或泛型的使用
- 构建包和项目结构

## 核心原则

- 优先清晰而非巧妙
- 默认不可变；最小化共享可变状态
- 快速失败并抛出有意义的异常
- 一致的命名和包结构

## 命名

```java
// 通过：类/Records：PascalCase
public class MarketService {}
public record Money(BigDecimal amount, Currency currency) {}

// 通过：方法/字段：camelCase
private final MarketRepository marketRepository;
public Market findBySlug(String slug) {}

// 通过：常量：UPPER_SNAKE_CASE
private static final int MAX_PAGE_SIZE = 100;
```

## 不可变性

```java
// 通过：优先使用 records 和 final 字段
public record MarketDto(Long id, String name, MarketStatus status) {}

public class Market {
  private final Long id;
  private final String name;
  // 只提供 getter，不提供 setter
}
```

## Optional 使用

```java
// 通过：从 find* 方法返回 Optional
Optional<Market> market = marketRepository.findBySlug(slug);

// 通过：使用 Map/flatMap 而不是 get()
return market
    .map(MarketResponse::from)
    .orElseThrow(() -> new EntityNotFoundException("Market not found"));
```

## 流最佳实践

```java
// 通过：使用流进行转换，保持管道简短
List<String> names = markets.stream()
    .map(Market::name)
    .filter(Objects::nonNull)
    .toList();

// 失败：避免复杂的嵌套流；优先使用循环以提高清晰度
```

## 异常

- 对领域错误使用非受检异常；用上下文包装技术异常
- 创建特定领域的异常（如 `MarketNotFoundException`）
- 除非重新抛出/集中记录，否则避免宽泛的 `catch (Exception ex)`

```java
throw new MarketNotFoundException(slug);
```

## 泛型和类型安全

- 避免原始类型；声明泛型参数
- 对于可重用工具，优先使用有界泛型

```java
public <T extends Identifiable> Map<Long, T> indexById(Collection<T> items) { ... }
```

## 项目结构（Maven/Gradle）

```
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  util/
src/main/resources/
  application.yml
src/test/java/... (与 main 镜像)
```

## 格式化和风格

- 一致使用 2 或 4 个空格（项目标准）
- 每个文件一个公共顶层类型
- 保持方法简短且专注；提取辅助方法
- 成员顺序：常量、字段、构造函数、公共方法、protected、私有

## 应避免的代码味道

- 长参数列表 → 使用 DTO/构建器
- 深层嵌套 → 提前返回
- 魔法数字 → 命名常量
- 静态可变状态 → 优先使用依赖注入
- 静默捕获块 → 记录并行动或重新抛出

## 日志记录

```java
private static final Logger log = LoggerFactory.getLogger(MarketService.class);
log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);
```

## 空值处理

- 仅在不可避免时接受 `@Nullable`；否则使用 `@NonNull`
- 在输入上使用 Bean Validation（`@NotNull`、`@NotBlank`）

## 测试期望

- JUnit 5 + AssertJ 用于流式断言
- Mockito 用于模拟；尽可能避免部分模拟
- 优先使用确定性测试；不使用隐藏的 sleep

**记住**：保持代码有意、类型化且可观察。除非证明必要，否则优先考虑可维护性而非微优化。
