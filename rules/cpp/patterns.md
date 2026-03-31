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
# C++ 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 C++ 特定内容。

## RAII

资源获取即初始化——在构造函数中获取资源，在析构函数中释放：

```cpp
class FileHandler {
public:
    explicit FileHandler(const std::string& path) : file_(std::fopen(path.c_str(), "r")) {
        if (!file_) throw std::runtime_error("failed to open file");
    }
    ~FileHandler() { if (file_) std::fclose(file_); }
private:
    std::FILE* file_;
};
```

## Rule of Five / Rule of Zero

- 如果类需要自定义析构函数、拷贝构造函数、拷贝赋值运算符、移动构造函数或移动赋值运算符中的任何一个，通常需要全部五个
- 优先遵循 Rule of Zero：使用 smart pointers 和容器，让编译器生成特殊成员函数

## 值语义

优先值传递，使用 `std::move` 转移所有权：

```cpp
void process(std::vector<int> data) { /* copy */ }
void process(std::vector<int>&& data) { /* move */ }
```

## 参考

参见 skill: `cpp-patterns` 获取全面的 C++ 惯用模式。
