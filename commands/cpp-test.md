---
description: 强制执行 C++ 的 TDD workflow process。先写 GoogleTest 测试，再实现。用 gcov/lcov 验证覆盖率。
---

# C++ TDD 命令

此命令使用 GoogleTest/GoogleMock 和 CMake/CTest 强制执行 C++ 代码的测试驱动开发方法论。

## 此命令做什么

1. **定义接口**：首先搭建类/函数签名
2. **编写测试**：创建全面的 GoogleTest 测试用例（红色）
3. **运行测试**：验证测试因正确原因失败
4. **实现代码**：编写最小化代码通过（绿色）
5. **重构**：在保持测试绿色的情况下改进
6. **检查覆盖率**：确保 80%+ 覆盖率

## 使用场景

在以下情况使用 `/cpp-test`：
- 实现新的 C++ 函数或类
- 为现有代码添加测试覆盖率
- 修复 bug（先写失败的测试）
- 构建关键业务逻辑
- 学习 C++ 中的 TDD workflow process

## TDD 循环

```
红色     → 编写失败的 GoogleTest 测试
绿色   → 实现最小化代码通过
重构 → 改进代码，测试保持绿色
重复  → 下一个测试用例
```

## 示例会话

````
用户：/cpp-test 我需要一个验证电子邮件地址的函数

agent：
# TDD 会话：邮箱验证器

## 步骤 1：定义接口

```cpp
// validator/email.hpp
#pragma once
#include <string>
#include <expected>

enum class EmailError {
    Empty,
    InvalidFormat
};

std::expected<void, EmailError> validate_email(const std::string& email);
```

## 步骤 2：编写测试（红色）

```cpp
// validator/email_test.cpp
#include <gtest/gtest.h>
#include "email.hpp"

TEST(ValidateEmail, AcceptsSimpleEmail) {
    auto result = validate_email("user@example.com");
    EXPECT_TRUE(result.has_value());
}

TEST(ValidateEmail, AcceptsSubdomain) {
    EXPECT_TRUE(validate_email("user@mail.example.com").has_value());
}

TEST(ValidateEmail, AcceptsPlus) {
    EXPECT_TRUE(validate_email("user+tag@example.com").has_value());
}

TEST(ValidateEmail, RejectsEmpty) {
    auto result = validate_email("");
    ASSERT_FALSE(result.has_value());
    EXPECT_EQ(result.error(), EmailError::Empty);
}

TEST(ValidateEmail, RejectsNoAtSign) {
    EXPECT_FALSE(validate_email("userexample.com").has_value());
}

TEST(ValidateEmail, RejectsNoDomain) {
    EXPECT_FALSE(validate_email("user@").has_value());
}

TEST(ValidateEmail, RejectsNoLocalPart) {
    EXPECT_FALSE(validate_email("@example.com").has_value());
}
```

## 步骤 3：运行测试 - 验证失败

```bash
$ cmake --build build && ctest --test-dir build --output-on-failure

1/1 Test #1: email_validator_test .....***Failed
    --- undefined reference to `validate_email`

失败
```

✓ 测试按预期失败（未实现）。

## 步骤 4：实现最小化代码（绿色）

```cpp
// validator/email.cpp
#include "email.hpp"
#include <regex>

std::expected<void, EmailError> validate_email(const std::string& email) {
    if (email.empty()) {
        return std::unexpected(EmailError::Empty);
    }
    static const std::regex pattern(R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})");
    if (!std::regex_match(email, pattern)) {
        return std::unexpected(EmailError::InvalidFormat);
    }
    return {};
}
```

## 步骤 5：运行测试 - 验证通过

```bash
$ cmake --build build && ctest --test-dir build --output-on-failure

1/1 Test #1: email_validator_test .....   Passed    0.01 sec

100% tests passed.
```

✓ 所有测试通过！

## 步骤 6：检查覆盖率

```bash
$ cmake -DCMAKE_CXX_FLAGS="--coverage" -B build && cmake --build build
$ ctest --test-dir build
$ lcov --capture --directory build --output-file coverage.info
$ lcov --list coverage.info

validator/email.cpp     | 100%
```

✓ 覆盖率：100%

## TDD 完成！
````

## 测试模式

### 基本测试
```cpp
TEST(SuiteName, TestName) {
    EXPECT_EQ(add(2, 3), 5);
    EXPECT_NE(result, nullptr);
    EXPECT_TRUE(is_valid);
    EXPECT_THROW(func(), std::invalid_argument);
}
```

### Fixtures
```cpp
class DatabaseTest : public ::testing::Test {
protected:
    void SetUp() override { db_ = create_test_db(); }
    void TearDown() override { db_.reset(); }
    std::unique_ptr<Database> db_;
};

TEST_F(DatabaseTest, InsertsRecord) {
    db_->insert("key", "value");
    EXPECT_EQ(db_->get("key"), "value");
}
```

### 参数化测试
```cpp
class PrimeTest : public ::testing::TestWithParam<std::pair<int, bool>> {};

TEST_P(PrimeTest, ChecksPrimality) {
    auto [input, expected] = GetParam();
    EXPECT_EQ(is_prime(input), expected);
}

INSTANTIATE_TEST_SUITE_P(Primes, PrimeTest, ::testing::Values(
    std::make_pair(2, true),
    std::make_pair(4, false),
    std::make_pair(7, true)
));
```

## 覆盖率命令

```bash
# 带覆盖率构建
cmake -DCMAKE_CXX_FLAGS="--coverage" -DCMAKE_EXE_LINKER_FLAGS="--coverage" -B build

# 运行测试
cmake --build build && ctest --test-dir build

# 生成覆盖率报告
lcov --capture --directory build --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage_html
```

## 覆盖率目标

| 代码类型 | 目标 |
|-----------|--------|
| 关键业务逻辑 | 100% |
| 公共 API | 90%+ |
| 通用代码 | 80%+ |
| 生成代码 | 排除 |

## TDD 最佳实践

**做：**
- 先写测试，再写任何实现
- 每次更改后运行测试
- 适当使用 `EXPECT_*`（继续）而非 `ASSERT_*`（停止）
- 测试行为，而非实现细节
- 包含边缘情况（空、null、最大值、边界条件）

**不做：**
- 在测试之前写实现
- 跳过红色阶段
- 直接测试私有方法（通过公共 API 测试）
- 在测试中使用 `sleep`
- 忽略不稳定的测试

## 相关命令

- `/cpp-build` - 修复构建错误
- `/cpp-review` - 实现后审查代码
- `/verify` - 运行完整验证循环

## 相关

- skill：`skills/cpp-testing/`
- skill：`skills/tdd-workflow/`
