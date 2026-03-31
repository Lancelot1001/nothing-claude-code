---
description: 增量修复 Rust 构建错误、借用检查器问题和依赖问题。调用 rust-build-resolver agent进行最小化、精确的修复。
---

# Rust 构建与修复

此命令调用 **rust-build-resolver** agent来以最小化变更增量修复 Rust 构建错误。

## 此命令做什么

1. **运行诊断**：执行 `cargo check`、`cargo clippy`、`cargo fmt --check`
2. **解析错误**：识别错误代码和受影响的文件
3. **增量修复**：一次处理一个错误
4. **验证每个修复**：每次更改后重新运行 `cargo check`
5. **报告摘要**：显示已修复的内容和剩余内容

## 使用场景

在以下情况使用 `/rust-build`：
- `cargo build` 或 `cargo check` 失败并报错
- `cargo clippy` 报告警告
- 借用检查器或生命周期错误阻止编译
- Cargo 依赖解析失败
- 拉取导致构建中断的更改后

## 运行的诊断命令

```bash
# 主要构建检查
cargo check 2>&1

# Lints 和建议
cargo clippy -- -D warnings 2>&1

# 格式化检查
cargo fmt --check 2>&1

# 依赖问题
cargo tree --duplicates

# 安全审计（如果可用）
if command -v cargo-audit >/dev/null; then cargo audit; else echo "cargo-audit not installed"; fi
```

## 示例会话

````text
用户：/rust-build

agent：
# Rust 构建解决

## 初始诊断

```bash
$ cargo check
error[E0502]: cannot borrow `map` as mutable because it is also borrowed as immutable
  --> src/service/cache.rs:25:5
error[E0308]: mismatched types
  --> src/handler/api.rs:42:12
error[E0425]: cannot find value `db` in this scope
  --> src/handler/api.rs:58:9
```

发现 3 个错误。

## 修复 1：借用检查器错误

文件：src/service/cache.rs:25
错误：E0502 — cannot borrow `map` as mutable because also borrowed as immutable
原因：可变插入期间不可变借用仍然有效

```rust
// 更改：重构以在可变访问前结束不可变借用
if !map.contains_key("key") {
    map.insert("key".into(), default);
}
```

```bash
$ cargo check
# 剩余 2 个错误
```

## 修复 2：类型不匹配

文件：src/handler/api.rs:42
错误：E0308 — mismatched types: expected `usize`, found `&str`

```rust
// 更改
let count = params.get("count");
// 为
let count: usize = params.get("count")
    .and_then(|s| s.parse().ok())
    .unwrap_or(0);
```

```bash
$ cargo check
# 剩余 1 个错误
```

## 修复 3：未解析的名称

文件：src/handler/api.rs:58
错误：E0425 — cannot find value `db` in this scope
原因：缺少 import

```rust
// 添加
use crate::db;
```

```bash
$ cargo check
# 构建成功！
```

## 最终验证

```bash
$ cargo clippy -- -D warnings
# 无警告

$ cargo test
running 6 tests
test service::cache::tests::test_insert ... ok
test service::cache::tests::test_get ... ok
test handler::api::tests::test_parse_count ... ok
test handler::api::tests::test_missing_count ... ok
test handler::api::tests::test_db_import ... ok
test handler::api::tests::test_response ... ok

test result: ok. 6 passed; 0 failed; 0 ignored
```

## 摘要

| 指标 | 数量 |
|--------|-------|
| 修复的构建错误 | 3 |
| 修复的 Clippy 警告 | 0 |
| 修改的文件 | 2 |
| 剩余问题 | 0 |

构建状态：成功
````

## 修复的常见错误

| 错误 | 典型修复 |
|-------|-------------|
| `cannot borrow as mutable` | 重构以先结束不可变借用；仅在合理时 clone |
| `does not live long enough` | 使用自有类型或添加生命周期注解 |
| `cannot move out of` | 重构以获取所有权；仅作为最后手段 clone |
| `mismatched types` | 添加 `.into()`、`as` 或显式转换 |
| `trait X not implemented` | 添加 `#[derive(Trait)]` 或手动实现 |
| `unresolved import` | 添加到 Cargo.toml 或修复 `use` 路径 |
| `cannot find value` | 添加 import 或修复路径 |

## 修复策略

1. **先处理构建错误** - 代码必须能编译
2. **其次处理 Clippy 警告** - 修复可疑构造
3. **然后处理格式化** - `cargo fmt` 合规
4. **一次一个修复** - 验证每个更改
5. **最小化更改** - 不重构，只修复

## 停止条件

agent在以下情况下停止并报告：
- 同一错误在 3 次尝试后仍然存在
- 修复引入了更多错误
- 需要架构更改
- 借用检查器错误需要重新设计数据所有权

## 相关命令

- `/rust-test` - 构建成功后运行测试
- `/rust-review` - 审查代码质量
- `/verify` - 完整验证循环

## 相关

- agent：`agents/rust-build-resolver.md`
- skill：`skills/rust-patterns/`
