---
description: 全面审查 Rust 代码的所有权、生命周期、错误处理、不安全使用和惯用模式。调用 rust-reviewer agent。
---

# Rust 代码审查

此命令调用 **rust-reviewer** agent进行全面的 Rust 特定代码审查。

## 此命令做什么

1. **验证自动检查**：运行 `cargo check`、`cargo clippy -- -D warnings`、`cargo fmt --check` 和 `cargo test` — 任何失败则停止
2. **识别 Rust 变更**：通过 `git diff HEAD~1`（或 PR 的 `git diff main...HEAD`）找到修改的 `.rs` 文件
3. **运行安全审计**：如果可用，执行 `cargo audit`
4. **安全扫描**：检查不安全使用、命令注入、硬编码密钥
5. **所有权审查**：分析不必要的 clone、生命周期问题、借用模式
6. **生成报告**：按严重性分类问题

## 使用场景

在以下情况使用 `/rust-review`：
- 编写或修改 Rust 代码后
- 提交 Rust 更改前
- 审查包含 Rust 代码的拉取请求
- 加入新的 Rust 代码库
- 学习惯用 Rust 模式

## 审查类别

### 严重（必须修复）
- 生产代码路径中未检查的 `unwrap()`/`expect()`
- 没有 `// SAFETY:` 注释记录不变量的 `unsafe`
- 查询中字符串插值的 SQL 注入
- `std::process::Command` 中未验证输入的命令注入
- 硬编码凭证
- 通过原始指针的使用后释放

### 高（应该修复）
- 不必要的 `.clone()` 以满足借用检查器
- `&str` 或 `impl AsRef<str>` 足够时使用 `String` 参数
- 异步上下文中的阻塞（`std::thread::sleep`、`std::fs`）
- 共享类型缺少 `Send`/`Sync` 约束
- 业务关键枚举上的通配符 `_ =>` 匹配
- 大函数（>50 行）

### 中等（考虑）
- 热路径中不必要的分配
- 已知大小时缺少 `with_capacity`
- 无正当理由抑制 clippy 警告
- 公共 API 缺少 `///` 文档
- 在可能忽略值的非 `must_use` 返回类型上考虑 `#[must_use]`

## 运行的自动检查

```bash
# 构建门禁（审查前必须通过）
cargo check

# Lints 和建议
cargo clippy -- -D warnings

# 格式化
cargo fmt --check

# 测试
cargo test

# 安全审计（如果可用）
if command -v cargo-audit >/dev/null; then cargo audit; else echo "cargo-audit not installed"; fi
```

## 示例用法

````text
用户：/rust-review

agent：
# Rust 代码审查报告

## 审查的文件
- src/service/user.rs（已修改）
- src/handler/api.rs（已修改）

## 静态分析结果
- 构建：成功
- Clippy：无警告
- 格式化：通过
- 测试：全部通过

## 发现的问题

[严重] 生产路径中未检查的 unwrap
文件：src/service/user.rs:28
问题：在数据库查询结果上使用 `.unwrap()`
```rust
let user = db.find_by_id(id).unwrap();  // 缺失用户时 panic
```
修复：用上下文传播错误
```rust
let user = db.find_by_id(id)
    .context("failed to fetch user")?;
```

[高] 不必要的 Clone
文件：src/handler/api.rs:45
问题：Clone String 以满足借用检查器
```rust
let name = user.name.clone();
process(&user, &name);
```
修复：重构以避免 clone
```rust
let result = process_name(&user.name);
use_user(&user, result);
```

## 摘要
- 严重：1
- 高：1
- 中等：0

建议：阻止合并，直到严重问题修复
````

## 批准标准

| 状态 | 条件 |
|--------|--------|
| 批准 | 无严重或高问题 |
| 警告 | 只有中等问题（谨慎合并） |
| 阻止 | 发现严重或高问题 |

## 与其他命令的集成

- 先使用 `/rust-test` 确保测试通过
- 如果有构建错误使用 `/rust-build`
- 提交前使用 `/rust-review`
- 使用 `/code-review` 处理非 Rust 特定问题

## 相关

- agent：`agents/rust-reviewer.md`
- skill：`skills/rust-patterns/`、`skills/rust-testing/`
