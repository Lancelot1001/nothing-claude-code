---
description: 强制执行 Rust 的 TDD workflow process。先写测试，再实现。用 cargo-llvm-cov 验证 80%+ 覆盖率。
---

# Rust TDD 命令

此命令使用 `#[test]`、rstest、proptest 和 mockall 强制执行 Rust 代码的测试驱动开发方法论。

## 此命令做什么

1. **定义类型/特征**：首先用 `todo!()` 搭建函数签名
2. **编写测试**：创建全面的测试模块（红色）
3. **运行测试**：验证测试因正确原因失败
4. **实现代码**：编写最小化代码通过（绿色）
5. **重构**：在保持测试绿色的情况下改进
6. **检查覆盖率**：用 cargo-llvm-cov 确保 80%+ 覆盖率

## 使用场景

在以下情况使用 `/rust-test`：
- 实现新的 Rust 函数、方法或特征
- 为现有 Rust 代码添加测试覆盖率
- 修复 bug（先写失败的测试）
- 构建关键业务逻辑
- 学习 Rust 中的 TDD workflow process

## TDD 循环

```
红色     -> 先写失败的测试
绿色   -> 实现最小化代码通过
重构 -> 改进代码，测试保持绿色
重复  -> 下一个测试用例
```

## 示例会话

````text
用户：/rust-test 我需要一个验证用户注册的函数

agent：
# TDD 会话：注册验证器

## 步骤 1：定义接口

```rust
// src/validator.rs
pub struct RegistrationRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

pub enum ValidationResult {
    Valid,
    Invalid(Vec<String>),
}

pub fn validate_registration(request: &RegistrationRequest) -> ValidationResult {
    todo!()
}
```

## 步骤 2：编写测试（红色）

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_registration_returns_valid() {
        let request = RegistrationRequest {
            name: "Alice".into(),
            email: "alice@example.com".into(),
            password: "SecureP@ss1".into(),
        };
        assert!(matches!(validate_registration(&request), ValidationResult::Valid));
    }

    #[test]
    fn blank_name_returns_invalid() {
        let request = RegistrationRequest {
            name: "".into(),
            email: "alice@example.com".into(),
            password: "SecureP@ss1".into(),
        };
        match validate_registration(&request) {
            ValidationResult::Invalid(errors) => {
                assert!(errors.contains(&"Name is required".to_string()));
            }
            ValidationResult::Valid => panic!("expected Invalid"),
        }
    }

    #[test]
    fn invalid_email_returns_invalid() {
        let request = RegistrationRequest {
            name: "Alice".into(),
            email: "not-an-email".into(),
            password: "SecureP@ss1".into(),
        };
        assert!(matches!(
            validate_registration(&request),
            ValidationResult::Invalid(_)
        ));
    }

    #[test]
    fn short_password_returns_invalid() {
        let request = RegistrationRequest {
            name: "Alice".into(),
            email: "alice@example.com".into(),
            password: "short".into(),
        };
        assert!(matches!(
            validate_registration(&request),
            ValidationResult::Invalid(_)
        ));
    }
}
```

## 步骤 3：运行测试 — 验证失败

```bash
$ cargo test
running 4 tests
test tests::valid_registration_returns_valid ... FAILED (not yet implemented)
test tests::blank_name_returns_invalid ... FAILED
test tests::invalid_email_returns_invalid ... FAILED
test tests::short_password_returns_invalid ... FAILED
```

测试按预期失败（todo! panic）。

## 步骤 4：实现最小化代码（绿色）

```rust
pub fn validate_registration(request: &RegistrationRequest) -> ValidationResult {
    let mut errors = Vec::new();

    if request.name.trim().is_empty() {
        errors.push("Name is required".into());
    }
    if !request.email.contains('@') {
        errors.push("Invalid email format".into());
    }
    if request.password.len() < 8 {
        errors.push("Password must be at least 8 characters".into());
    }

    if errors.is_empty() {
        ValidationResult::Valid
    } else {
        ValidationResult::Invalid(errors)
    }
}
```

## 步骤 5：运行测试 — 验证通过

```bash
$ cargo test
running 4 tests
test tests::valid_registration_returns_valid ... ok
test tests::blank_name_returns_invalid ... ok
test tests::invalid_email_returns_invalid ... ok
test tests::short_password_returns_invalid ... ok

test result: ok. 4 passed; 0 failed
```

所有测试通过！

## 步骤 6：检查覆盖率

```bash
$ cargo llvm-cov
Coverage: 100.0% of lines
```

覆盖率：100%

## TDD 完成！
````

## 测试模式

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn handles_error() -> Result<(), Box<dyn std::error::Error>> {
        let result = parse_config(r#"port = 8080"#)?;
        assert_eq!(result.port, 8080);
        Ok(())
    }
}
```

### 参数化测试与 rstest

```rust
use rstest::{rstest, fixture};

#[rstest]
#[case("hello", 5)]
#[case("", 0)]
#[case("rust", 4)]
fn test_string_length(#[case] input: &str, #[case] expected: usize) {
    assert_eq!(input.len(), expected);
}
```

### 异步测试

```rust
#[tokio::test]
async fn fetches_data_successfully() {
    let client = TestClient::new().await;
    let result = client.get("/data").await;
    assert!(result.is_ok());
}
```

### 属性测试

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn encode_decode_roundtrip(input in ".*") {
        let encoded = encode(&input);
        let decoded = decode(&encoded).unwrap();
        assert_eq!(input, decoded);
    }
}
```

## 覆盖率命令

```bash
# 摘要报告
cargo llvm-cov

# HTML 报告
cargo llvm-cov --html

# 低于阈值时失败
cargo llvm-cov --fail-under-lines 80

# 运行特定测试
cargo test test_name

# 带输出运行
cargo test -- --nocapture

# 不在第一次失败时停止
cargo test --no-fail-fast
```

## 覆盖率目标

| 代码类型 | 目标 |
|-----------|--------|
| 关键业务逻辑 | 100% |
| 公共 API | 90%+ |
| 通用代码 | 80%+ |
| 生成 / FFI 绑定 | 排除 |

## TDD 最佳实践

**做：**
- 先写测试，再写任何实现
- 每次更改后运行测试
- 使用 `assert_eq!` 而非 `assert!` 以获得更好的错误消息
- 对返回 `Result` 的测试使用 `?` 以获得更清晰的输出
- 测试行为，而非实现
- 包含边缘情况（空、边界、错误路径）

**不做：**
- 在测试之前写实现
- 跳过红色阶段
- 当 `Result::is_err()` 可用时使用 `#[should_panic]`
- 在测试中使用 `sleep()` — 使用 channels 或 `tokio::time::pause()`
- Mock 一切 — 可行时优先集成测试

## 相关命令

- `/rust-build` - 修复构建错误
- `/rust-review` - 实现后审查代码
- `/verify` - 运行完整验证循环

## 相关

- skill：`skills/rust-testing/`
- skill：`skills/rust-patterns/`
