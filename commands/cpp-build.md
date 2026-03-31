---
description: 增量修复 C++ 构建错误、CMake 问题和链接器问题。调用 cpp-build-resolver agent进行最小化、精确的修复。
---

# C++ 构建与修复

此命令调用 **cpp-build-resolver** agent来以最小化变更增量修复 C++ 构建错误。

## 此命令做什么

1. **运行诊断**：执行 `cmake --build`、`clang-tidy`、`cppcheck`
2. **解析错误**：按文件分组并按严重性排序
3. **增量修复**：一次处理一个错误
4. **验证每个修复**：每次更改后重新运行构建
5. **报告摘要**：显示已修复的内容和剩余内容

## 使用场景

在以下情况使用 `/cpp-build`：
- `cmake --build build` 失败并报错
- 链接器错误（未定义引用、多重定义）
- 模板实例化失败
- 包含/依赖问题
- 拉取导致构建中断的更改后

## 运行的诊断命令

```bash
# CMake 配置
cmake -B build -S .

# 构建
cmake --build build 2>&1 | head -100

# 静态分析（如果可用）
clang-tidy src/*.cpp -- -std=c++17
cppcheck --enable=all src/
```

## 示例会话

```text
用户：/cpp-build

agent：
# C++ 构建解决

## 初始诊断

```bash
$ cmake --build build
src/service/user.cpp:25:15: error: use of undeclared identifier 'UserRepository'
src/handler/api.cpp:42:9: error: no matching function for call to 'process'
src/handler/api.cpp:58:1: error: non-void function does not return a value
```

发现 3 个错误。

## 修复 1：未声明的标识符

文件：src/service/user.cpp:25
错误：use of undeclared identifier 'UserRepository'
原因：缺少 include

```cpp
// 添加 include
#include "repository/user_repository.hpp"
```

```bash
$ cmake --build build
# 剩余 2 个错误
```

## 修复 2：没有匹配的函数

文件：src/handler/api.cpp:42
错误：no matching function for call to 'process'

```cpp
// 更改
process(params.get("count"));
// 为
process(std::stoi(params.get("count")));
```

```bash
$ cmake --build build
# 剩余 1 个错误
```

## 修复 3：缺少返回

文件：src/handler/api.cpp:58
错误：non-void function does not return a value

```cpp
std::optional<User> getUser(const std::string& id) {
    if (id.empty()) {
        return std::nullopt;
    }
    auto user = findUser(id);
    // 添加缺少的 return
    return user;
}
```

```bash
$ cmake --build build
# 构建成功！
```

## 最终验证

```bash
$ ctest --test-dir build --output-on-failure
Test project build
    1/5 Test #1: unit_tests ........   Passed    0.02 sec
    2/5 Test #2: integration_tests    Passed    0.15 sec
All tests passed.
```

## 摘要

| 指标 | 数量 |
|--------|-------|
| 修复的构建错误 | 3 |
| 修复的链接器错误 | 0 |
| 修改的文件 | 2 |
| 剩余问题 | 0 |

构建状态：通过：成功
```

## 修复的常见错误

| 错误 | 典型修复 |
|-------|-------------|
| `undeclared identifier` | 添加 `#include` 或修复拼写错误 |
| `no matching function` | 修复参数类型或添加重载 |
| `undefined reference` | 链接库或添加实现 |
| `multiple definition` | 使用 `inline` 或移到 .cpp |
| `incomplete type` | 用 `#include` 替换前向声明 |
| `no member named X` | 修复成员名称或 include |
| `cannot convert X to Y` | 添加适当的类型转换 |
| `CMake Error` | 修复 CMakeLists.txt 配置 |

## 修复策略

1. **先处理编译错误** - 代码必须能编译
2. **其次处理链接器错误** - 解决未定义的引用
3. **然后处理警告** - 用 `-Wall -Wextra` 修复
4. **一次一个修复** - 验证每个更改
5. **最小化更改** - 不重构，只修复

## 停止条件

agent在以下情况下停止并报告：
- 同一错误在 3 次尝试后仍然存在
- 修复引入了更多错误
- 需要架构更改
- 缺少外部依赖

## 相关命令

- `/cpp-test` - 构建成功后运行测试
- `/cpp-review` - 审查代码质量
- `/verify` - 完整验证循环

## 相关

- agent：`agents/cpp-build-resolver.md`
- skill：`skills/cpp-coding-standards/`
