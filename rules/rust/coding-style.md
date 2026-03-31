---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---
# Rust 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Rust 特定内容。

## 格式化

- **rustfmt**：强制格式化——提交前始终运行 `cargo fmt`
- **clippy**：lint 检查——`cargo clippy -- -D warnings`（将警告视为错误）
- 4 空格缩进（rustfmt 默认）
- 最大行宽：100 字符（rustfmt 默认）

## 不可变性

Rust 变量默认不可变——拥抱这一特性：

- 默认使用 `let`；仅在需要可变时使用 `let mut`
- 优先返回新值而非原地修改
- 当函数可能需要分配时使用 `Cow<'_, T>`

## 命名

遵循标准 Rust 约定：
- 函数、方法、变量、模块、crate：`snake_case`
- 类型、trait、枚举、类型参数：`PascalCase`（UpperCamelCase）
- 常量和静态变量：`SCREAMING_SNAKE_CASE`
- 生命周期：短小写（`'a`, `'de`）——复杂情况用描述性名称（`'input`）

## 所有权与借用

- 默认使用借用（`&T`）；仅在需要存储或消费时获取所有权
- 理解根本原因前不随意 clone 来满足借用检查器
- 函数参数优先接受 `&str` 而非 `String`、`&[T]` 而非 `Vec<T>`
- 构造函数需要拥有 `String` 时使用 `impl Into<String>`

## 错误处理

- 使用 `Result<T, E>` 和 `?` 进行传播——生产代码中绝不使用 `unwrap()`
- **Libraries**：使用 `thiserror` 定义类型化错误
- **Applications**：使用 `anyhow` 获取灵活的错误上下文
- 使用 `.with_context(|| format!("failed to ..."))?` 添加上下文
- 测试和真正不可达的状态保留 `unwrap()` / `expect()`

## 迭代器优于循环

优先使用迭代器链进行转换；复杂控制流使用循环：

```rust
// GOOD — 声明式，可组合
let active_emails: Vec<&str> = users.iter()
    .filter(|u| u.is_active)
    .map(|u| u.email.as_str())
    .collect();

// GOOD — 带 early return 的复杂逻辑循环
for user in &users {
    if let Some(verified) = verify_email(&user.email)? {
        send_welcome(&verified)?;
    }
}
```

## 模块组织

按领域组织，而非按类型：

```text
src/
├── main.rs
├── lib.rs
├── auth/           # 领域模块
│   ├── mod.rs
│   ├── token.rs
│   └── middleware.rs
├── orders/         # 领域模块
│   ├── mod.rs
│   ├── model.rs
│   └── service.rs
└── db/             # 基础设施
    ├── mod.rs
    └── pool.rs
```

## 可见性

- 默认 private；使用 `pub(crate)` 进行内部共享
- 仅将属于 crate 公共 API 的部分标记为 `pub`
- 从 `lib.rs` 重新导出公共 API

## 参考

参见 skill: `rust-patterns` 获取全面的 Rust 惯用模式和最佳实践。
