---
name: laravel-verification
description: "Laravel 项目验证循环：环境检查、linting、静态分析、带覆盖率的测试、安全扫描和部署就绪检查。"
origin: nothing-claude-code
---

# Laravel 验证循环

在 PR 之前、重大更改之后以及预部署时运行。

## 何时使用

- 为 Laravel 项目打开 pull request 之前
- 重大重构或依赖升级之后
- 预部署验证（staging 或 production）
- 运行完整的 lint -> test -> security -> deploy 就绪管道

## 工作原理

- 按顺序运行各阶段，从环境检查到部署就绪，使每一层都建立在上一层的基础上。
- 环境和 Composer 检查是所有其他检查的前提；如果它们失败，立即停止。
- Linting/静态分析应该在运行完整测试和覆盖率之前通过。
- 安全和迁移审查在测试之后进行，以便在数据或发布步骤之前验证行为。
- 构建/部署就绪和队列/调度程序检查是最终关卡；任何失败都会阻止发布。

## 阶段 1：环境检查

```bash
php -v
composer --version
php artisan --version
```

- 验证 `.env` 存在且必需密钥存在
- 确认生产环境 `APP_DEBUG=false`
- 确认 `APP_ENV` 与目标部署匹配（`production`、`staging`）

如果本地使用 Laravel Sail：

```bash
./vendor/bin/sail php -v
./vendor/bin/sail artisan --version
```

## 阶段 1.5：Composer 和 Autoload

```bash
composer validate
composer dump-autoload -o
```

## 阶段 2：Linting 和静态分析

```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse
```

如果项目使用 Psalm 而不是 PHPStan：

```bash
vendor/bin/psalm
```

## 阶段 3：测试和覆盖率

```bash
php artisan test
```

覆盖率（CI）：

```bash
XDEBUG_MODE=coverage php artisan test --coverage
```

CI 示例（format -> 静态分析 -> 测试）：

```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse
XDEBUG_MODE=coverage php artisan test --coverage
```

## 阶段 4：安全和依赖检查

```bash
composer audit
```

## 阶段 5：数据库和迁移

```bash
php artisan migrate --pretend
php artisan migrate:status
```

- 仔细审查破坏性迁移
- 确保迁移文件名遵循 `Y_m_d_His_*`（如 `2025_03_14_154210_create_orders_table.php`）并清楚地描述更改
- 确保可以回滚
- 验证 `down()` 方法，避免在无明确备份的情况下进行不可逆数据丢失

## 阶段 6：构建和部署就绪

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

- 确保缓存在生产配置中预热成功
- 验证队列 workers 和调度程序已配置
- 确认目标环境中 `storage/` 和 `bootstrap/cache/` 可写

## 阶段 7：队列和调度程序检查

```bash
php artisan schedule:list
php artisan queue:failed
```

如果使用 Horizon：

```bash
php artisan horizon:status
```

如果 `queue:monitor` 可用，使用它检查积压而不处理作业：

```bash
php artisan queue:monitor default --max=100
```

主动验证（仅 staging）：将 no-op 作业分派到专用队列并运行单个 worker 来处理它（确保配置了非 `sync` 队列连接）。

```bash
php artisan tinker --execute="dispatch((new App\\Jobs\\QueueHealthcheck())->onQueue('healthcheck'))"
php artisan queue:work --once --queue=healthcheck
```

验证作业产生了预期的副作用（日志条目、healthcheck 表行或指标）。

仅在可以安全处理测试作业的非生产环境中运行此操作。

## 示例

最小流程：

```bash
php -v
composer --version
php artisan --version
composer validate
vendor/bin/pint --test
vendor/bin/phpstan analyse
php artisan test
composer audit
php artisan migrate --pretend
php artisan config:cache
php artisan queue:failed
```

CI 风格管道：

```bash
composer validate
composer dump-autoload -o
vendor/bin/pint --test
vendor/bin/phpstan analyse
XDEBUG_MODE=coverage php artisan test --coverage
composer audit
php artisan migrate --pretend
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan schedule:list
```
