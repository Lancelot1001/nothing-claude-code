---
paths:
  - "**/*.java"
  - "**/*.kt"
  - "**/pom.xml"
  - "**/build.gradle"
  - "**/build.gradle.kts"
  - "**/settings.gradle"
---
# Java 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 Java 特定内容。

## Repository 模式

数据访问抽象：

```java
public interface UserRepository {
    Optional<User> findById(Long id);
    List<User> findAll();
    User save(User user);
    void delete(Long id);
}
```

## Service Layer

业务逻辑：

```java
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findAll().stream()
            .filter(u -> u.getEmail().equals(email))
            .findFirst();
    }
}
```

## Constructor Injection

通过构造函数注入依赖（Spring 推荐）：

```java
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;

    public OrderService(OrderRepository orderRepository, PaymentGateway paymentGateway) {
        this.orderRepository = orderRepository;
        this.paymentGateway = paymentGateway;
    }
}
```

## DTO 映射

使用 MapStruct 进行类型映射：

```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO toDTO(User user);
    User toEntity(UserDTO dto);
}
```

## 参考

参见 skill: `java-spring-patterns` 获取全面的 Java 模式。
