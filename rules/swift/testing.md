---
paths:
  - "**/*.swift"
  - "**/Package.swift"
---
# Swift 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 Swift 特定内容。

## 框架

新测试使用 **Swift Testing**（`import Testing`）。使用 `@Test` 和 `#expect`：

```swift
@Test("User creation validates email")
func userCreationValidatesEmail() throws {
    #expect(throws: ValidationError.invalidEmail) {
        try User(email: "not-an-email")
    }
}
```

## 测试隔离

每个测试获取新实例——在 `init` 中设置，在 `deinit` 中清理。测试间无共享可变状态。

## 参数化测试

```swift
@Test("Validates formats", arguments: ["json", "xml", "csv"])
func validatesFormat(format: String) throws {
    let parser = try Parser(format: format)
    #expect(parser.isValid)
}
```

## 覆盖率

```bash
swift test --enable-code-coverage
```

## 参考

参见 skill: `swift-protocol-di-testing` 获取基于 protocol 依赖注入和 Swift Testing mock 模式。
