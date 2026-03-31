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
# C++ Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 C++ 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **clang-format**：编辑 `.cpp`/`.hpp` 后自动格式化
- **clang-tidy**：编辑后运行 lint 检查
- **cppcheck**：静态分析

## 构建 Hooks

- **cmake**：运行 `cmake --build` 或 `make` 验证修改
- 标记 `make` 或 `ninja` 构建失败——确保代码编译通过
