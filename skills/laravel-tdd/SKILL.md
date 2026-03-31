---
name: laravel-tdd
description: 使用 PHPUnit 和 Pest、Pest factories、数据库测试、fakes 和覆盖率目标的 Laravel 测试驱动开发。
origin: nothing-claude-code
---

# Laravel TDD workflow

使用 PHPUnit 和 Pest 进行 Laravel 应用的测试驱动开发，要求 80%+ 覆盖率（单元 + 功能）。

## 何时使用

- Laravel 中的新功能或端点
- Bug 修复或重构
- 测试 Eloquent 模型、策略、作业和通知
- 对于新测试，除非项目已标准化使用 PHPUnit，否则优先使用 Pest

## 工作原理

### 红-绿-重构循环

1. 编写一个会失败的测试
2. 实现最小的更改以通过
3. 在保持测试通过的同时重构

### 测试层级

- **单元**：纯 PHP 类、值对象、服务
- **功能**：HTTP 端点、认证、验证、策略
- **集成**：数据库 + 队列 + 外部边界

根据范围选择层级：

- 对纯业务逻辑和服务使用**单元**测试。
- 对 HTTP、认证、验证和响应结构使用**功能**测试。
- 在需要一起验证 DB/队列/外部服务时使用**集成**测试。

### 数据库策略

- 对大多数功能/集成测试使用 `RefreshDatabase`（在每个测试运行一次迁移，然后在支持时将每个测试包装在事务中；内存数据库可能每个测试重新迁移）
- 当架构已迁移且只需要每个测试回滚时使用 `DatabaseTransactions`
- 当每个测试需要完整的 migrate/fresh 且可以承受成本时使用 `DatabaseMigrations`

将 `RefreshDatabase` 作为接触数据库的测试的默认值：对于支持事务的数据库，它每个测试运行迁移一次（通过静态标志），并将每个测试包装在事务中；对于 `:memory:` SQLite 或不支持事务的连接，它在每个测试前迁移。当架构已迁移且只需要每个测试回滚时使用 `DatabaseTransactions`。

### 测试框架选择

- 有可用时，默认对新测试使用 **Pest**。
- 仅在项目已标准化使用 PHPUnit 或需要特定于 PHPUnit 的工具时才使用 **PHPUnit**。

## 示例

### PHPUnit 示例

```php
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_project(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/projects', [
            'name' => 'New Project',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('projects', ['name' => 'New Project']);
    }
}
```

### 功能测试示例（HTTP 层）

```php
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ProjectIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_projects_index_returns_paginated_results(): void
    {
        $user = User::factory()->create();
        Project::factory()->count(3)->for($user)->create();

        $response = $this->actingAs($user)->getJson('/api/projects');

        $response->assertOk();
        $response->assertJsonStructure(['success', 'data', 'error', 'meta']);
    }
}
```

### Pest 示例

```php
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

uses(RefreshDatabase::class);

test('owner can create project', function () {
    $user = User::factory()->create();

    $response = actingAs($user)->postJson('/api/projects', [
        'name' => 'New Project',
    ]);

    $response->assertCreated();
    assertDatabaseHas('projects', ['name' => 'New Project']);
});
```

### 功能测试 Pest 示例（HTTP 层）

```php
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

test('projects index returns paginated results', function () {
    $user = User::factory()->create();
    Project::factory()->count(3)->for($user)->create();

    $response = actingAs($user)->getJson('/api/projects');

    $response->assertOk();
    $response->assertJsonStructure(['success', 'data', 'error', 'meta']);
});
```

### Factories 和状态

- 使用 factories 生成测试数据
- 为边缘情况（已归档、管理员、试用）定义状态

```php
$user = User::factory()->state(['role' => 'admin'])->create();
```

### 数据库测试

- 使用 `RefreshDatabase` 获取干净状态
- 保持测试隔离和确定性
- 优先使用 `assertDatabaseHas` 而不是手动查询

### 持久化测试示例

```php
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ProjectRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_can_be_retrieved_by_slug(): void
    {
        $project = Project::factory()->create(['slug' => 'alpha']);

        $found = Project::query()->where('slug', 'alpha')->firstOrFail();

        $this->assertSame($project->id, $found->id);
    }
}
```

### 用于副作用的 Fakes

- 对作业使用 `Bus::fake()`
- 对排队工作使用 `Queue::fake()`
- 对通知使用 `Mail::fake()` 和 `Notification::fake()`
- 对领域事件使用 `Event::fake()`

```php
use Illuminate\Support\Facades\Queue;

Queue::fake();

dispatch(new SendOrderConfirmation($order->id));

Queue::assertPushed(SendOrderConfirmation::class);
```

```php
use Illuminate\Support\Facades\Notification;

Notification::fake();

$user->notify(new InvoiceReady($invoice));

Notification::assertSentTo($user, InvoiceReady::class);
```

### 认证测试（Sanctum）

```php
use Laravel\Sanctum\Sanctum;

Sanctum::actingAs($user);

$response = $this->getJson('/api/projects');
$response->assertOk();
```

### HTTP 和外部服务

- 使用 `Http::fake()` 隔离外部 API
- 使用 `Http::assertSent()` 断言出站 payload

### 覆盖率目标

- 强制单元 + 功能测试 80%+ 覆盖率
- 在 CI 中使用 `pcov` 或 `XDEBUG_MODE=coverage`

### 测试命令

- `php artisan test`
- `vendor/bin/phpunit`
- `vendor/bin/pest`

### 测试配置

- 使用 `phpunit.xml` 设置 `DB_CONNECTION=sqlite` 和 `DB_DATABASE=:memory:` 以加快测试
- 使用单独的测试环境以避免接触开发/生产数据

### 授权测试

```php
use Illuminate\Support\Facades\Gate;

$this->assertTrue(Gate::forUser($user)->allows('update', $project));
$this->assertFalse(Gate::forUser($otherUser)->allows('update', $project));
```

### Inertia 功能测试

使用 Inertia.js 时，使用 Inertia 测试助手对组件名称和 props 进行断言。

```php
use App\Models\User;
use Inertia\Testing\AssertableInertia;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class DashboardInertiaTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_inertia_props(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboard')
            ->where('user.id', $user->id)
            ->has('projects')
        );
    }
}
```

优先使用 `assertInertia` 而不是原始 JSON 断言，以保持测试与 Inertia 响应一致。
