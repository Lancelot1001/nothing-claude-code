---
paths:
  - "**/*.swift"
  - "**/Package.swift"
---
# Swift 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Swift 特定内容。

## Secret Management

- 使用 **Keychain Services** 存储敏感数据（token、密码、密钥）——绝不使用 `UserDefaults`
- 使用环境变量或 `.xcconfig` 文件存储构建时 secret
- 绝不将 secret 硬编码到源代码——反编译工具可轻易提取

```swift
let apiKey = ProcessInfo.processInfo.environment["API_KEY"]
guard let apiKey, !apiKey.isEmpty else {
    fatalError("API_KEY not configured")
}
```

## 传输安全

- App Transport Security (ATS) 默认启用——不要禁用
- 为关键端点使用证书锁定
- 验证所有服务器证书

## 输入验证

- 在显示前净化所有用户输入以防止注入
- 使用 `URL(string:)` 带验证而非强制解包
- 处理外部来源（API、深链接、剪贴板）的数据前先验证
