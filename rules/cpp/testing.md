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
# C++ 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 C++ 特定内容。

## 框架

使用 **GoogleTest** 作为测试框架。

## 覆盖率

使用 **lcov** 生成覆盖率报告：

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="--coverage" \
  -DCMAKE_EXE_LINKER_FLAGS="--coverage"
cmake --build build
./build/your_tests
lcov --capture --directory build --output-file coverage.info
genhtml coverage.info --output-directory coverage_html
```

## CMake/CTest

使用 CTest 作为测试运行器：

```bash
cmake --build build
ctest --output-on-failure
```

## 参考

参见 skill: `cpp-patterns` 获取全面的 C++ 测试模式。
