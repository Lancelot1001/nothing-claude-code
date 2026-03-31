---
name: rust-patterns
description: Rust 惯用模式、所有权、错误处理、trait、并发以及构建安全、高性能应用程序的最佳实践。
origin: something-claude-code
---

# Rust 开发模式

Rust 惯用模式以及构建安全、高性能和可维护应用程序的最佳实践。

## 何时使用

- 编写新的 Rust 代码
- 审查 Rust 代码
- 重构现有 Rust 代码
- 设计 crate 结构和模块布局

## 工作原理

此skill在六个关键领域强制执行 Rust 惯用约定：
所有权和借用以在编译时防止数据竞争和内存错误；
`Result`/`?` 错误传播和 `thiserror` 用于库、`anyhow` 用于应用程序；
枚举和穷尽模式匹配使非法状态不可表示；
trait 和泛型用于零成本抽象；
通过 `Arc<Mutex<T>>`、通道和 async/await 进行安全并发；
以及按领域组织的最小 `pub` 表面。

## 核心原则

### 1. 所有权和借用

Rust 的所有权系统可在编译时防止数据竞争和内存错误。

```rust
// 好：不需要所有权时传递引用
fn process(data: &[u8]) -> usize {
    data.len()
}

// 好：仅在需要存储或消费时获取所有权
fn store(data: Vec<u8>) -> Record {
    Record { payload: data }
}

// 差：为了避免借用检查器而不必要地克隆
fn process_bad(data: &Vec<u8>) -> usize {
    let cloned = data.clone(); // 浪费——直接借用即可
    cloned.len()
}
```

### 使用 `Cow` 实现灵活所有权

```rust
use std::borrow::Cow;

fn normalize(input: &str) -> Cow<'_, str> {
    if input.contains(' ') {
        Cow::Owned(input.replace(' ', "_"))
    } else {
        Cow::Borrowed(input) // 无需更改时零成本
    }
}
```

## 错误处理

### 使用 `Result` 和 `?`——生产代码中永远不要 `unwrap()`

```rust
// 好：用上下文传播错误
use anyhow::{Context, Result};

fn load_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read config from {path}"))?;
    let config: Config = toml::from_str(&content)
        .with_context(|| format!("failed to parse config from {path}"))?;
    Ok(config)
}

// 差：错误时 panic
fn load_config_bad(path: &str) -> Config {
    let content = std::fs::read_to_string(path).unwrap(); // Panic!
    toml::from_str(&content).unwrap()
}
```

### 库错误用 `thiserror`，应用错误用 `anyhow`

```rust
// 库代码：结构化、类型化错误
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("record not found: {id}")]
    NotFound { id: String },
    #[error("connection failed")]
    Connection(#[from] std::io::Error),
    #[error("invalid data: {0}")]
    InvalidData(String),
}

// 应用代码：灵活的錯誤处理
use anyhow::{bail, Result};

fn run() -> Result<()> {
    let config = load_config("app.toml")?;
    if config.workers == 0 {
        bail!("worker count must be > 0");
    }
    Ok(())
}
```

### `Option` 组合器而非嵌套匹配

```rust
// 好：组合器链
fn find_user_email(users: &[User], id: u64) -> Option<String> {
    users.iter()
        .find(|u| u.id == id)
        .map(|u| u.email.clone())
}

// 差：深度嵌套匹配
fn find_user_email_bad(users: &[User], id: u64) -> Option<String> {
    match users.iter().find(|u| u.id == id) {
        Some(user) => match &user.email {
            email => Some(email.clone()),
        },
        None => None,
    }
}
```

## 枚举和模式匹配

### 将状态建模为枚举

```rust
// 好：不可能的状态不可表示
enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32 },
    Connected { session_id: String },
    Failed { reason: String, retries: u32 },
}

fn handle(state: &ConnectionState) {
    match state {
        ConnectionState::Disconnected => connect(),
        ConnectionState::Connecting { attempt } if *attempt > 3 => abort(),
        ConnectionState::Connecting { .. } => wait(),
        ConnectionState::Connected { session_id } => use_session(session_id),
        ConnectionState::Failed { retries, .. } if *retries < 5 => retry(),
        ConnectionState::Failed { reason, .. } => log_failure(reason),
    }
}
```

### 穷尽匹配——业务逻辑不用通配符

```rust
// 好：显式处理每个变体
match command {
    Command::Start => start_service(),
    Command::Stop => stop_service(),
    Command::Restart => restart_service(),
    // 添加新变体时强制处理
}

// 差：通配符隐藏新变体
match command {
    Command::Start => start_service(),
    _ => {} // 静默忽略 Stop、Restart 和未来变体
}
```

## Trait 和泛型

### 接受泛型，返回具体类型

```rust
// 好：泛型输入，具体输出
fn read_all(reader: &mut impl Read) -> std::io::Result<Vec<u8>> {
    let mut buf = Vec::new();
    reader.read_to_end(&mut buf)?;
    Ok(buf)
}

// 好：多个约束的 trait bounds
fn process<T: Display + Send + 'static>(item: T) -> String {
    format!("processed: {item}")
}
```

### Trait 对象用于动态分发

```rust
// 当需要异构集合或插件系统时使用
trait Handler: Send + Sync {
    fn handle(&self, request: &Request) -> Response;
}

struct Router {
    handlers: Vec<Box<dyn Handler>>,
}

// 当需要性能时使用泛型（单态化）
fn fast_process<H: Handler>(handler: &H, request: &Request) -> Response {
    handler.handle(request)
}
```

### Newtype 模式用于类型安全

```rust
// 好：不同类型防止参数混淆
struct UserId(u64);
struct OrderId(u64);

fn get_order(user: UserId, order: OrderId) -> Result<Order> {
    // 不能意外交换 user 和 order ID
    todo!()
}

// 差：容易交换参数
fn get_order_bad(user_id: u64, order_id: u64) -> Result<Order> {
    todo!()
}
```

## 结构体和数据建模

### 复杂构造用 Builder 模式

```rust
struct ServerConfig {
    host: String,
    port: u16,
    max_connections: usize,
}

impl ServerConfig {
    fn builder(host: impl Into<String>, port: u16) -> ServerConfigBuilder {
        ServerConfigBuilder { host: host.into(), port, max_connections: 100 }
    }
}

struct ServerConfigBuilder { host: String, port: u16, max_connections: usize }

impl ServerConfigBuilder {
    fn max_connections(mut self, n: usize) -> Self { self.max_connections = n; self }
    fn build(self) -> ServerConfig {
        ServerConfig { host: self.host, port: self.port, max_connections: self.max_connections }
    }
}

// 用法：ServerConfig::builder("localhost", 8080).max_connections(200).build()
```

## 迭代器和闭包

### 优先使用迭代器链而非手动循环

```rust
// 好：声明式、惰性、可组合
let active_emails: Vec<String> = users.iter()
    .filter(|u| u.is_active)
    .map(|u| u.email.clone())
    .collect();

// 差：命令式累积
let mut active_emails = Vec::new();
for user in &users {
    if user.is_active {
        active_emails.push(user.email.clone());
    }
}
```

### 使用类型注解的 `collect()`

```rust
// 收集为不同类型
let names: Vec<_> = items.iter().map(|i| &i.name).collect();
let lookup: HashMap<_, _> = items.iter().map(|i| (i.id, i)).collect();
let combined: String = parts.iter().copied().collect();

// 收集 Results——短路于第一个错误
let parsed: Result<Vec<i32>, _> = strings.iter().map(|s| s.parse()).collect();
```

## 并发

### `Arc<Mutex<T>>` 用于共享可变状态

```rust
use std::sync::{Arc, Mutex};

let counter = Arc::new(Mutex::new(0));
let handles: Vec<_> = (0..10).map(|_| {
    let counter = Arc::clone(&counter);
    std::thread::spawn(move || {
        let mut num = counter.lock().expect("mutex poisoned");
        *num += 1;
    })
}).collect();

for handle in handles {
    handle.join().expect("worker thread panicked");
}
```

### 通道用于消息传递

```rust
use std::sync::mpsc;

let (tx, rx) = mpsc::sync_channel(16); // 带背压的有界通道

for i in 0..5 {
    let tx = tx.clone();
    std::thread::spawn(move || {
        tx.send(format!("message {i}")).expect("receiver disconnected");
    });
}
drop(tx); // 关闭发送者以便 rx 迭代器终止

for msg in rx {
    println!("{msg}");
}
```

### 使用 Tokio 的 Async

```rust
use tokio::time::Duration;

async fn fetch_with_timeout(url: &str) -> Result<String> {
    let response = tokio::time::timeout(
        Duration::from_secs(5),
        reqwest::get(url),
    )
    .await
    .context("request timed out")?
    .context("request failed")?;

    response.text().await.context("failed to read body")
}

// 生成并发任务
async fn fetch_all(urls: Vec<String>) -> Vec<Result<String>> {
    let handles: Vec<_> = urls.into_iter()
        .map(|url| tokio::spawn(async move {
            fetch_with_timeout(&url).await
        }))
        .collect();

    let mut results = Vec::with_capacity(handles.len());
    for handle in handles {
        results.push(handle.await.unwrap_or_else(|e| panic!("spawned task panicked: {e}")));
    }
    results
}
```

## Unsafe 代码

### Unsafe 可接受的情况

```rust
// 可接受：FFI 边界，带有记录的不变量（Rust 2024+）
/// # Safety
/// `ptr` 必须是指向初始化 `Widget` 的有效对齐指针。
unsafe fn widget_from_raw<'a>(ptr: *const Widget) -> &'a Widget {
    // SAFETY：调用者保证 ptr 有效且对齐
    unsafe { &*ptr }
}

// 可接受：性能关键路径，带正确性证明
// SAFETY：由于循环边界，索引始终 < len
unsafe { slice.get_unchecked(index) }
```

### Unsafe 不可接受的情况

```rust
// 差：使用 unsafe 绕过借用检查器
// 差：使用 unsafe 图方便
// 差：使用 unsafe 但没有 Safety 注释
// 差：在不相关的类型之间进行 transmute
```

## 模块系统和 Crate 结构

### 按领域组织，而非按类型

```text
my_app/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── auth/          # 领域模块
│   │   ├── mod.rs
│   │   ├── token.rs
│   │   └── middleware.rs
│   ├── orders/        # 领域模块
│   │   ├── mod.rs
│   │   ├── model.rs
│   │   └── service.rs
│   └── db/            # 基础设施
│       ├── mod.rs
│       └── pool.rs
├── tests/             # 集成测试
├── benches/           # 基准测试
└── Cargo.toml
```

### 可见性——最小暴露

```rust
// 好：pub(crate) 用于内部共享
pub(crate) fn validate_input(input: &str) -> bool {
    !input.is_empty()
}

// 好：从 lib.rs 重新导出公共 API
pub mod auth;
pub use auth::AuthMiddleware;

// 差：让一切都 pub
pub fn internal_helper() {} // 应该是 pub(crate) 或私有
```

## 工具集成

### 基本命令

```bash
# 构建和检查
cargo build
cargo check              # 快速类型检查，无代码生成
cargo clippy             # Lint 和建议
cargo fmt                # 格式化代码

# 测试
cargo test
cargo test -- --nocapture    # 显示 println 输出
cargo test --lib             # 仅单元测试
cargo test --test integration # 仅集成测试

# 依赖
cargo audit              # 安全审计
cargo tree               # 依赖树
cargo update             # 更新依赖

# 性能
cargo bench              # 运行基准测试
```

## 快速参考：Rust 惯用语

| 惯用语 | 描述 |
|-------|-------------|
| 借用而非克隆 | 除非需要所有权，否则传递 `&T` |
| 使非法状态不可表示 | 使用枚举仅对有效状态建模 |
| `?` 优于 `unwrap()` | 传播错误，永不在库/生产代码中 panic |
| 解析而非验证 | 在边界处将非结构化数据转换为类型化结构体 |
| Newtype 用于类型安全 | 将原语包装在 newtypes 中以防止参数交换 |
| 优先使用迭代器而非循环 | 声明式链更清晰，往往更快 |
| `#[must_use]` 用于 Results | 确保调用者处理返回值 |
| `Cow` 实现灵活所有权 | 借用足够时避免分配 |
| 穷尽匹配 | 业务关键枚举不使用通配符 `_` |
| 最小 `pub` 表面 | 对内部 API 使用 `pub(crate)` |

## 应避免的反模式

```rust
// 差：生产代码中使用 .unwrap()
let value = map.get("key").unwrap();

// 差：不理解为什么而克隆以满足借用检查器
let data = expensive_data.clone();
process(&original, &data);

// 差：当 &str 足够时使用 String
fn greet(name: String) { /* 应该是 &str */ }

// 差：库中使用 Box<dyn Error>（使用 thiserror）
fn parse(input: &str) -> Result<Data, Box<dyn std::error::Error>> { todo!() }

// 差：忽略 must_use 警告
let _ = validate(input); // 静默丢弃 Result

// 差：在 async 上下文中阻塞
async fn bad_async() {
    std::thread::sleep(Duration::from_secs(1)); // 阻塞执行器！
    // 使用：tokio::time::sleep(Duration::from_secs(1)).await;
}
```

**记住**：如果它能编译通过，它可能是正确的——但只有在你避免 `unwrap()`、
最小化 `unsafe`，并让类型系统为你工作时。
