---
paths:
  - "**/*.swift"
  - "**/Package.swift"
---
# Swift 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Swift 特定内容。

## 格式化

- **SwiftFormat**：自动格式化，**SwiftLint**：风格检查
- Xcode 16+ 自带 `swift-format` 作为替代

## 不可变性

- 优先使用 `let` 而非 `var`——定义一切为 `let`，仅在编译器要求时改为 `var`
- 默认使用值语义 `struct`；仅在需要标识或引用语义时使用 `class`

## 命名

遵循 [Apple API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)：

- 使用点处的清晰度——省略不必要的词
- 方法和属性按其角色命名，而非其类型
- 常量使用 `static let` 而非全局常量

## 错误处理

使用 typed throws（Swift 6+）和模式匹配：

```swift
func load(id: String) throws(LoadError) -> Item {
    guard let data = try? read(from: path) else {
        throw .fileNotFound(id)
    }
    return try decode(data)
}
```

## 并发

启用 Swift 6 严格并发检查。优先使用：

- `Sendable` 值类型穿越隔离边界
- Actor 用于共享可变状态
- 结构化并发（`async let`、`TaskGroup`）而非非结构化 `Task {}`
