# Laravel API — 项目 CLAUDE.md

> Laravel API + PostgreSQL + Redis + queues 的真实示例。
> 复制到项目根目录并为你的服务定制。

## 项目概述

**技术栈：** PHP 8.2+、Laravel 11.x、PostgreSQL、Redis、Horizon、PHPUnit/Pest、Docker Compose

**架构：** 模块化 Laravel 应用，controllers -> services -> actions，Eloquent ORM，队列用于异步工作，Form Requests 用于验证，API Resources 用于一致的 JSON 响应。

## 关键规则

### PHP 约定

- 所有 PHP 文件中使用 `declare(strict_types=1)`
- 处处使用类型化属性和返回类型
- Services 和 actions 偏好 `final` 类
- 提交代码中无 `dd()` 或 `dump()`
- 通过 Laravel Pint 格式化（PSR-12）

### API 响应包装

所有 API 响应使用一致的包装：

```json
{
  "success": true,
  "data": {"...": "..."},
  "error": null,
  "meta": {"page": 1, "per_page": 25, "total": 120}
}
```

### 数据库

- 迁移提交到 git
- 使用 Eloquent 或查询构建器（无原始 SQL，除非是参数化的）
- 在 `where` 或 `orderBy` 中使用的任何列上建立索引
- 避免在 services 中修改模型实例；偏好通过 repositories 或查询构建器创建/更新

### 认证

- 通过 Sanctum 的 API 认证
- 使用 policies 进行模型级授权
- 在 controllers 和 services 中强制认证

### 验证

- 使用 Form Requests 进行验证
- 将输入转换为 DTOs 用于业务逻辑
- 绝不信任请求 payload 的派生字段

### 错误处理

- 在 services 中抛出领域异常
- 通过 `bootstrap/app.php` 中的 `withExceptions` 将异常映射到 HTTP 响应
- 绝不向客户端暴露内部错误

### 代码风格

- 代码或注释中不用 emoji
- 最大行长度：120 字符
- Controllers 薄；services 和 actions 持有业务逻辑

## 文件结构

```
app/
  Actions/
  Console/
  Events/
  Exceptions/
  Http/
    Controllers/
    Middleware/
    Requests/
    Resources/
  Jobs/
  Models/
  Policies/
  Providers/
  Services/
  Support/
config/
database/
  factories/
  migrations/
  seeders/
routes/
  api.php
  web.php
```

## 关键模式

### 服务层

```php
<?php

declare(strict_types=1);

final class CreateOrderAction
{
    public function __construct(private OrderRepository $orders) {}

    public function handle(CreateOrderData $data): Order
    {
        return $this->orders->create($data);
    }
}

final class OrderService
{
    public function __construct(private CreateOrderAction $createOrder) {}

    public function placeOrder(CreateOrderData $data): Order
    {
        return $this->createOrder->handle($data);
    }
}
```

### 控制器模式

```php
<?php

declare(strict_types=1);

final class OrdersController extends Controller
{
    public function __construct(private OrderService $service) {}

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->service->placeOrder($request->toDto());

        return response()->json([
            'success' => true,
            'data' => OrderResource::make($order),
            'error' => null,
            'meta' => null,
        ], 201);
    }
}
```

### Policy 模式

```php
<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\User;

final class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $order->user_id === $user->id;
    }
}
```

### Form Request + DTO

```php
<?php

declare(strict_types=1);

final class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.sku' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function toDto(): CreateOrderData
    {
        return new CreateOrderData(
            userId: (int) $this->user()->id,
            items: $this->validated('items'),
        );
    }
}
```

### API Resource

```php
<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'total' => $this->total,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

### 队列 Job

```php
<?php

declare(strict_types=1);

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Repositories\OrderRepository;
use App\Services\OrderMailer;

final class SendOrderConfirmation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $orderId) {}

    public function handle(OrderRepository $orders, OrderMailer $mailer): void
    {
        $order = $orders->findOrFail($this->orderId);
        $mailer->sendOrderConfirmation($order);
    }
}
```

### 测试模式（Pest）

```php
<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('user can place order', function () {
    $user = User::factory()->create();

    actingAs($user);

    $response = postJson('/api/orders', [
        'items' => [['sku' => 'sku-1', 'quantity' => 2]],
    ]);

    $response->assertCreated();
    assertDatabaseHas('orders', ['user_id' => $user->id]);
});
```

### 测试模式（PHPUnit）

```php
<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class OrdersControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_place_order(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'items' => [['sku' => 'sku-1', 'quantity' => 2]],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('orders', ['user_id' => $user->id]);
    }
}
```

## 环境变量

```bash
# 必需
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=myapp
DB_USERNAME=root
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
```

## 测试策略

```bash
# 运行所有测试
php artisan test

# 带覆盖率运行
php artisan test --coverage

# 运行特定测试文件
php artisan test --filter=OrdersControllerTest

# 并行运行
php artisan test --parallel
```

## ECC 工作流

```bash
# 规划
/plan "Add order refund system with Stripe integration"

# 使用 TDD 开发
/tdd                    # PHPUnit/Pest-based TDD workflow

# 审查
/code-review            # General quality check
/security-scan          # Security audit

# 验证
/verify                 # Build, test, security scan
```

## Git 工作流

- `feat:` 新功能，`fix:` bug 修复，`refactor:` 代码更改
- 从 `main` 创建功能分支，需要 PR
- CI：Pint（lint）、Pest（测试）
- 部署：Laravel Forge 或 Vapor
