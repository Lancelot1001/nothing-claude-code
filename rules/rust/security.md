---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---
# Rust 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Rust 特定内容。

## Secret Management

- 绝不将 API key、token 或凭证硬编码到源代码
- 使用环境变量：`std::env::var("API_KEY")`
- 启动时缺失必需 secret 时快速失败
- 将 `.env` 文件加入 `.gitignore`

```rust
// BAD
const API_KEY: &str = "sk-abc123...";

// GOOD — 带早期验证的环境变量
fn load_api_key() -> anyhow::Result<String> {
    std::env::var("PAYMENT_API_KEY")
        .context("PAYMENT_API_KEY must be set")
}
```

## SQL 注入防护

- 始终使用参数化查询——绝不使用字符串格式化用户输入
- 使用带绑定参数的 query builder 或 ORM（sqlx、diesel、sea-orm）

```rust
// BAD — SQL 注入 via format string
let query = format!("SELECT * FROM users WHERE name = '{name}'");
sqlx::query(&query).fetch_one(&pool).await?;

// GOOD — 使用 sqlx 的参数化查询
// 占位符语法因后端而异：Postgres: $1  |  MySQL: ?  |  SQLite: $1
sqlx::query("SELECT * FROM users WHERE name = $1")
    .bind(&name)
    .fetch_one(&pool)
    .await?;
```

## 输入验证

- 在系统边界处理所有用户输入
- 使用类型系统强制不变式（newtype 模式）
- 解析，不要验证——在边界处将非结构化数据转换为类型化 struct
- 用清晰的错误消息拒绝无效输入

```rust
// 解析，不要验证——无效状态不可表示
pub struct Email(String);

impl Email {
    pub fn parse(input: &str) -> Result<Self, ValidationError> {
        let trimmed = input.trim();
        let at_pos = trimmed.find('@')
            .filter(|&p| p > 0 && p < trimmed.len() - 1)
            .ok_or_else(|| ValidationError::InvalidEmail(input.to_string()))?;
        let domain = &trimmed[at_pos + 1..];
        if trimmed.len() > 254 || !domain.contains('.') {
            return Err(ValidationError::InvalidEmail(input.to_string()));
        }
        // 生产环境请使用验证过的 email crate（如 `email_address`）
        Ok(Self(trimmed.to_string()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}
```

## Unsafe Code

- 最小化 `unsafe` 块——优先使用安全抽象
- 每个 `unsafe` 块必须有 `// SAFETY:` 注释说明不变量
- 绝不使用 `unsafe` 绕过借用检查器的便利
- 审查时标记所有 `unsafe` 代码——无正当理由时为红旗
- 优先使用围绕 C 库的 `safe` FFI 包装器

```rust
// GOOD — 安全注释记录所有必需的不变量
let widget: &Widget = {
    // SAFETY: `ptr` 是非空的、对齐的、指向已初始化的 Widget，
    // 并且在其生命周期内不存在可变引用或变化。
    unsafe { &*ptr }
};

// BAD — 无安全理由
unsafe { &*ptr }
```

## Dependency Security

- 运行 `cargo audit` 扫描依赖中的已知 CVE
- 运行 `cargo deny check` 检查许可和 advisory 合规
- 使用 `cargo tree` 审查传递依赖
- 保持依赖更新——设置 Dependabot 或 Renovate
- 最小化依赖数量——添加前评估

```bash
# 安全审计
cargo audit

# 拒绝 advisory、重复版本和受限许可
cargo deny check

# 检查依赖树
cargo tree
cargo tree -d  # 仅显示重复项
```

## Error Messages

- 绝不将内部路径、栈追踪或数据库错误暴露在 API 响应中
- 服务端记录详细错误；向客户端返回通用消息
- 使用 `tracing` 或 `log` 进行结构化服务端日志

```rust
// 将错误映射到适当的状态码和通用消息
//（示例使用 axum；根据你的框架调整响应类型）
match order_service.find_by_id(id) {
    Ok(order) => Ok((StatusCode::OK, Json(order))),
    Err(ServiceError::NotFound(_)) => {
        tracing::info!(order_id = id, "order not found");
        Err((StatusCode::NOT_FOUND, "Resource not found"))
    }
    Err(e) => {
        tracing::error!(order_id = id, error = %e, "unexpected error");
        Err((StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"))
    }
}
```

## 参考

参见 skill: `rust-patterns` 获取 unsafe 代码指南和所有权模式。
参见 skill: `security-review` 获取通用安全检查清单。
