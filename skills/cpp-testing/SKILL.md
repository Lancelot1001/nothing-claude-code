---
name: cpp-testing
description: 仅在编写/更新/修复 C++ 测试、配置 GoogleTest/CTest、诊断失败或flaky 测试、或添加覆盖率/ sanitizer 时使用。
origin: nothing-claude-code
---

# C++ 测试（agentskill）

面向agent的现代 C++（C++17/20）测试workflow，使用 GoogleTest/GoogleMock 和 CMake/CTest。

## 何时使用

- 编写新的 C++ 测试或修复现有测试
- 为 C++ 组件设计单元/集成测试覆盖
- 添加测试覆盖率、CI 门控或回归保护
- 配置 CMake/CTest workflow以实现一致执行
- 调查测试失败或 flaky 行为
- 启用 sanitizer 以进行内存/竞争诊断

### 何时不使用

- 在没有测试更改的情况下实现新产品功能
- 与测试覆盖率或失败无关的大规模重构
- 在没有测试回归验证的情况下进行性能调优
- 非 C++ 项目或非测试任务

## 核心概念

- **TDD 循环**：red → green → refactor（先测试，最小修复，然后清理）。
- **隔离**：优先使用依赖注入和 fake 而不是全局状态。
- **测试布局**：`tests/unit`、`tests/integration`、`tests/testdata`。
- **Mocks vs fakes**：mock 用于交互，fake 用于有状态行为。
- **CTest 发现**：使用 `gtest_discover_tests()` 进行稳定的测试发现。
- **CI 信号**：先运行子集，然后用 `--output-on-failure` 运行完整套件。

## TDD workflow

遵循 RED → GREEN → REFACTOR 循环：

1. **RED**：编写一个捕获新行为的失败测试
2. **GREEN**：实现最小的更改使其通过
3. **REFACTOR**：在测试保持绿色时清理

```cpp
// tests/add_test.cpp
#include <gtest/gtest.h>

int Add(int a, int b); // 由生产代码提供。

TEST(AddTest, AddsTwoNumbers) { // RED
  EXPECT_EQ(Add(2, 3), 5);
}

// src/add.cpp
int Add(int a, int b) { // GREEN
  return a + b;
}

// REFACTOR：一旦测试通过就简化/重命名
```

## 代码示例

### 基本单元测试（gtest）

```cpp
// tests/calculator_test.cpp
#include <gtest/gtest.h>

int Add(int a, int b); // 由生产代码提供。

TEST(CalculatorTest, AddsTwoNumbers) {
    EXPECT_EQ(Add(2, 3), 5);
}
```

### Fixture（gtest）

```cpp
// tests/user_store_test.cpp
// 伪代码存根：用项目类型替换 UserStore/User。
#include <gtest/gtest.h>
#include <memory>
#include <optional>
#include <string>

struct User { std::string name; };
class UserStore {
public:
    explicit UserStore(std::string /*path*/) {}
    void Seed(std::initializer_list<User> /*users*/) {}
    std::optional<User> Find(const std::string &/*name*/) { return User{"alice"}; }
};

class UserStoreTest : public ::testing::Test {
protected:
    void SetUp() override {
        store = std::make_unique<UserStore>(":memory:");
        store->Seed({{"alice"}, {"bob"}});
    }

    std::unique_ptr<UserStore> store;
};

TEST_F(UserStoreTest, FindsExistingUser) {
    auto user = store->Find("alice");
    ASSERT_TRUE(user.has_value());
    EXPECT_EQ(user->name, "alice");
}
```

### Mock（gmock）

```cpp
// tests/notifier_test.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <string>

class Notifier {
public:
    virtual ~Notifier() = default;
    virtual void Send(const std::string &message) = 0;
};

class MockNotifier : public Notifier {
public:
    MOCK_METHOD(void, Send, (const std::string &message), (override));
};

class Service {
public:
    explicit Service(Notifier &notifier) : notifier_(notifier) {}
    void Publish(const std::string &message) { notifier_.Send(message); }

private:
    Notifier &notifier_;
};

TEST(ServiceTest, SendsNotifications) {
    MockNotifier notifier;
    Service service(notifier);

    EXPECT_CALL(notifier, Send("hello")).Times(1);
    service.Publish("hello");
}
```

### CMake/CTest 快速入门

```cmake
# CMakeLists.txt (excerpt)
cmake_minimum_required(VERSION 3.20)
project(example LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
# Prefer project-locked versions. If using a tag, use a pinned version per project policy.
set(GTEST_VERSION v1.17.0) # Adjust to project policy.
FetchContent_Declare(
  googletest
  # Google Test framework (official repository)
  URL https://github.com/google/googletest/archive/refs/tags/${GTEST_VERSION}.zip
)
FetchContent_MakeAvailable(googletest)

add_executable(example_tests
  tests/calculator_test.cpp
  src/calculator.cpp
)
target_link_libraries(example_tests GTest::gtest GTest::gmock GTest::gtest_main)

enable_testing()
include(GoogleTest)
gtest_discover_tests(example_tests)
```

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j
ctest --test-dir build --output-on-failure
```

## 运行测试

```bash
ctest --test-dir build --output-on-failure
ctest --test-dir build -R ClampTest
ctest --test-dir build -R "UserStoreTest.*" --output-on-failure
```

```bash
./build/example_tests --gtest_filter=ClampTest.*
./build/example_tests --gtest_filter=UserStoreTest.FindsExistingUser
```

## 调试失败

1. 使用 gtest 过滤器重新运行单个失败测试。
2. 在失败断言周围添加作用域日志。
3. 启用 sanitizer 后重新运行。
4. 一旦根本原因修复，扩展到完整套件。

## 覆盖率

优先使用目标级设置而不是全局标志。

```cmake
option(ENABLE_COVERAGE "Enable coverage flags" OFF)

if(ENABLE_COVERAGE)
  if(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    target_compile_options(example_tests PRIVATE --coverage)
    target_link_options(example_tests PRIVATE --coverage)
  elseif(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(example_tests PRIVATE -fprofile-instr-generate -fcoverage-mapping)
    target_link_options(example_tests PRIVATE -fprofile-instr-generate)
  endif()
endif()
```

GCC + gcov + lcov：

```bash
cmake -S . -B build-cov -DENABLE_COVERAGE=ON
cmake --build build-cov -j
ctest --test-dir build-cov
lcov --capture --directory build-cov --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage
```

Clang + llvm-cov：

```bash
cmake -S . -B build-llvm -DENABLE_COVERAGE=ON -DCMAKE_CXX_COMPILER=clang++
cmake --build build-llvm -j
LLVM_PROFILE_FILE="build-llvm/default.profraw" ctest --test-dir build-llvm
llvm-profdata merge -sparse build-llvm/default.profraw -o build-llvm/default.profdata
llvm-cov report build-llvm/example_tests -instr-profile=build-llvm/default.profdata
```

## Sanitizer

```cmake
option(ENABLE_ASAN "Enable AddressSanitizer" OFF)
option(ENABLE_UBSAN "Enable UndefinedBehaviorSanitizer" OFF)
option(ENABLE_TSAN "Enable ThreadSanitizer" OFF)

if(ENABLE_ASAN)
  add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address)
endif()
if(ENABLE_UBSAN)
  add_compile_options(-fsanitize=undefined -fno-omit-frame-pointer)
  add_link_options(-fsanitize=undefined)
endif()
if(ENABLE_TSAN)
  add_compile_options(-fsanitize=thread)
  add_link_options(-fsanitize=thread)
endif()
```

## Flaky 测试防护

- 永远不要使用 `sleep` 进行同步；使用条件变量或 latch。
- 使临时目录每个测试唯一，并始终清理它们。
- 避免在单元测试中使用真实时间、网络或文件系统依赖。
- 对随机输入使用确定性种子。

## 最佳实践

### 做法

- 保持测试确定性和隔离
- 优先使用依赖注入而不是全局变量
- 对前置条件使用 `ASSERT_*`，对多次检查使用 `EXPECT_*`
- 在 CTest 标签或目录中分离单元测试与集成测试
- 在 CI 中运行 sanitizer 以进行内存和竞争检测

### 禁止做法

- 不要在单元测试中依赖真实时间或网络
- 当可以使用条件变量时不要使用 sleep 进行同步
- 不要对简单值对象过度 mock
- 不要对非关键日志使用脆弱的字符串匹配

### 常见陷阱

- **使用固定临时路径** → 为每个测试生成唯一临时目录并清理它们。
- **依赖墙上时钟时间** → 注入时钟或使用 fake 时间源。
- **Flaky 并发测试** → 使用条件变量/latch 和有界等待。
- **隐藏的全局状态** → 在 fixture 中重置全局状态或移除全局变量。
- **过度 mock** → 对有状态行为优先使用 fake，仅对交互进行 mock。
- **缺少 sanitizer 运行** → 在 CI 中添加 ASan/UBSan/TSan 构建。
- **仅在 debug 构建上覆盖率** → 确保覆盖率目标使用一致的标志。

## 可选附录：模糊测试 / 属性测试

仅在项目已经支持 LLVM/libFuzzer 或属性测试库时使用。

- **libFuzzer**：最适合几乎没有 I/O 的纯函数。
- **RapidCheck**：属性测试以验证不变量。

最小 libFuzzer 工具（伪代码：替换 ParseConfig）：

```cpp
#include <cstddef>
#include <cstdint>
#include <string>

extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    std::string input(reinterpret_cast<const char *>(data), size);
    // ParseConfig(input); // 项目函数
    return 0;
}
```

## GoogleTest 的替代品

- **Catch2**：仅头文件，富有表现力的匹配器
- **doctest**：轻量级，最小编译开销
