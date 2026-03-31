---
paths:
  - "**/*.swift"
  - "**/Package.swift"
---
# Swift 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 Swift 特定内容。

## Protocol-Oriented Design

定义小型、聚焦的 protocol。使用 protocol extensions 提供共享默认实现：

```swift
protocol Repository: Sendable {
    associatedtype Item: Identifiable & Sendable
    func find(by id: Item.ID) async throws -> Item?
    func save(_ item: Item) async throws
}
```

## Value Types

- 使用 `struct` 作为数据传输对象和模型
- 使用带关联值的 `enum` 建模不同状态：

```swift
enum LoadState<T: Sendable>: Sendable {
    case idle
    case loading
    case loaded(T)
    case failed(Error)
}
```

## Actor Pattern

使用 actor 管理共享可变状态，而非锁或 dispatch queues：

```swift
actor Cache<Key: Hashable & Sendable, Value: Sendable> {
    private var storage: [Key: Value] = [:]

    func get(_ key: Key) -> Value? { storage[key] }
    func set(_ key: Key, value: Value) { storage[key] = value }
}
```

## Dependency Injection

使用默认参数注入 protocol——生产使用默认值，测试注入 mock：

```swift
struct UserService {
    private let repository: any UserRepository

    init(repository: any UserRepository = DefaultUserRepository()) {
        self.repository = repository
    }
}
```

## 参考

参见 skill: `swift-actor-persistence` 获取基于 actor 的持久化模式。
参见 skill: `swift-protocol-di-testing` 获取基于 protocol 的 DI 和测试。
