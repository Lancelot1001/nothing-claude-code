---
name: swift-protocol-di-testing
description: 基于协议的依赖注入以实现可测试的 Swift 代码 — 使用专注协议和 Swift Testing 模拟文件系统、网络和外部 API。
origin: something-claude-code
---

# Swift 基于协议的依赖注入以实现测试

通过将外部依赖（文件系统、网络、iCloud）抽象到小型、专注的协议后来使 Swift 代码可测试的模式。实现无需 I/O 的确定性测试。

## 何时激活

- 编写访问文件系统、网络或外部 API 的 Swift 代码
- 需要测试错误处理路径而不触发真实失败
- 构建跨环境（应用、测试、SwiftUI 预览）工作的模块
- 使用 Swift 并发（actors、Sendable）设计可测试架构

## 核心模式

### 1. 定义小型、专注的协议

每个协议处理一个外部关注点。

```swift
// File system access
public protocol FileSystemProviding: Sendable {
    func containerURL(for purpose: Purpose) -> URL?
}

// File read/write operations
public protocol FileAccessorProviding: Sendable {
    func read(from url: URL) throws -> Data
    func write(_ data: Data, to url: URL) throws
    func fileExists(at url: URL) -> Bool
}

// Bookmark storage (e.g., for sandboxed apps)
public protocol BookmarkStorageProviding: Sendable {
    func saveBookmark(_ data: Data, for key: String) throws
    func loadBookmark(for key: String) throws -> Data?
}
```

### 2. 创建默认（生产）实现

```swift
public struct DefaultFileSystemProvider: FileSystemProviding {
    public init() {}

    public func containerURL(for purpose: Purpose) -> URL? {
        FileManager.default.url(forUbiquityContainerIdentifier: nil)
    }
}

public struct DefaultFileAccessor: FileAccessorProviding {
    public init() {}

    public func read(from url: URL) throws -> Data {
        try Data(contentsOf: url)
    }

    public func write(_ data: Data, to url: URL) throws {
        try data.write(to: url, options: .atomic)
    }

    public func fileExists(at url: URL) -> Bool {
        FileManager.default.fileExists(atPath: url.path)
    }
}
```

### 3. 为测试创建 Mock 实现

```swift
public final class MockFileAccessor: FileAccessorProviding, @unchecked Sendable {
    public var files: [URL: Data] = [:]
    public var readError: Error?
    public var writeError: Error?

    public init() {}

    public func read(from url: URL) throws -> Data {
        if let error = readError { throw error }
        guard let data = files[url] else {
            throw CocoaError(.fileReadNoSuchFile)
        }
        return data
    }

    public func write(_ data: Data, to url: URL) throws {
        if let error = writeError { throw error }
        files[url] = data
    }

    public func fileExists(at url: URL) -> Bool {
        files[url] != nil
    }
}
```

### 4. 用默认参数注入依赖

生产代码使用默认值；测试注入 mock。

```swift
public actor SyncManager {
    private let fileSystem: FileSystemProviding
    private let fileAccessor: FileAccessorProviding

    public init(
        fileSystem: FileSystemProviding = DefaultFileSystemProvider(),
        fileAccessor: FileAccessorProviding = DefaultFileAccessor()
    ) {
        self.fileSystem = fileSystem
        self.fileAccessor = fileAccessor
    }

    public func sync() async throws {
        guard let containerURL = fileSystem.containerURL(for: .sync) else {
            throw SyncError.containerNotAvailable
        }
        let data = try fileAccessor.read(
            from: containerURL.appendingPathComponent("data.json")
        )
        // Process data...
    }
}
```

### 5. 使用 Swift Testing 编写测试

```swift
import Testing

@Test("Sync manager handles missing container")
func testMissingContainer() async {
    let mockFileSystem = MockFileSystemProvider(containerURL: nil)
    let manager = SyncManager(fileSystem: mockFileSystem)

    await #expect(throws: SyncError.containerNotAvailable) {
        try await manager.sync()
    }
}

@Test("Sync manager reads data correctly")
func testReadData() async throws {
    let mockFileAccessor = MockFileAccessor()
    mockFileAccessor.files[testURL] = testData

    let manager = SyncManager(fileAccessor: mockFileAccessor)
    let result = try await manager.loadData()

    #expect(result == expectedData)
}

@Test("Sync manager handles read errors gracefully")
func testReadError() async {
    let mockFileAccessor = MockFileAccessor()
    mockFileAccessor.readError = CocoaError(.fileReadCorruptFile)

    let manager = SyncManager(fileAccessor: mockFileAccessor)

    await #expect(throws: SyncError.self) {
        try await manager.sync()
    }
}
```

## 最佳实践

- **单一职责**：每个协议应该处理一个关注点 — 不要创建有很多方法的"上帝协议"
- **Sendable 符合**：当协议跨 actor 边界使用时是必需的
- **默认参数**：让生产代码默认使用真实实现；只有测试需要指定 mock
- **错误模拟**：设计带有可配置错误属性的 mock 以测试失败路径
- **只 mock 边界**：Mock 外部依赖（文件系统、网络、API），而非内部类型

## 应避免的反模式

- 创建覆盖所有外部访问的单一大型协议
- Mock 没有外部依赖的内部类型
- 使用 `#if DEBUG` 条件编译而非适当的依赖注入
- 在与 actors 一起使用时忘记 `Sendable` 符合
- 过度设计：如果一个类型没有外部依赖，它不需要协议

## 何时使用

- 任何接触文件系统、网络或外部 API 的 Swift 代码
- 测试在真实环境中难以触发的错误处理路径
- 构建需要在应用、测试和 SwiftUI 预览上下文中工作的模块
- 使用需要可测试架构的 Swift 并发（actors、结构化并发）的应用
