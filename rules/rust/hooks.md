---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---
# Rust Hooks

> 本文件继承 [common/hooks.md](../common/hooks.md)，包含 Rust 特定内容。

## PostToolUse Hooks

在 `~/.claude/settings.json` 中配置：

- **cargo fmt**：编辑 `.rs` 文件后自动格式化
- **cargo clippy**：编辑 Rust 文件后运行 lint 检查
- **cargo check**：修改后验证编译（比 `cargo build` 更快）
