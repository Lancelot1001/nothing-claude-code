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
# C++ 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 C++ 特定内容。

## 内存安全

- 避免原始指针——使用 smart pointers
- 禁止 `malloc`/`free`——使用 RAII 管理的资源
- 避免 `memcpy` 处理非 POD 类型
- 使用 `std::array` 或 `std::vector` 替代原始数组

## 缓冲区溢出

- 使用 `std::string` 替代 `char*` 字符串
- 使用 `std::vector::at()` 而非 `operator[]` 进行边界检查
- 避免 `gets()`、`sprintf()`、`strcpy()` 等不安全函数

## 整数安全

- 避免整数溢出——使用 `std::int64_t` 进行计算
- 检查除法和取模运算的除零情况
- 使用 `-ftrapv` 启用整数溢出陷阱（Debug 构建）

## Sanitizers

在 AddressSanitizer、UndefinedBehaviorSanitizer、MemorySanitizer 下测试：

```bash
cmake -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined"
cmake --build . -- -j$(nproc)
./your_tests
```

## 参考

参见 skill: `cpp-patterns` 获取更多 C++ 安全编码实践。
