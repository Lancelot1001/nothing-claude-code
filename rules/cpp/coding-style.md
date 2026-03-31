---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.h"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.c"
  - "**/CMakeLists.txt"
  - "**/*.cmake"
---
# C++ 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 C++ 特定内容。

## 标准

- **C++17/20/23**：优先使用现代 C++ 特性
- **RAII**：资源获取即初始化，替代手动 `malloc`/`free`
- **Smart Pointers**：优先使用 `std::unique_ptr` 和 `std::shared_ptr`，避免原始 `new`/`delete`
- **Value Semantics**：值传递而非指针传递，除非需要共享所有权

## 现代 C++ 特性

- 使用 `std::optional` 表示可能无值的情况
- 使用 `std::variant` 替代联合体
- 使用范围 `for` 循环替代原始指针遍历
- 使用 `[[nodiscard]]` 标记不应忽略的返回值

## 命名

- 类型/类：`PascalCase`
- 函数/变量：`snake_case`
- 常量：`kPascalCase` 或 `SCREAMING_SNAKE_CASE`
- 模板参数：`PascalCase`

## 参考

参见 skill: `cpp-patterns` 获取全面的 C++ 惯用模式和最佳实践。
