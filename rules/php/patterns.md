---
paths:
  - "**/*.php"
---
# PHP 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 PHP 特定内容。

## Thin Controllers

控制器只负责请求/响应，逻辑委托给服务：

```php
class UserController
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());
        return new JsonResponse($user, 201);
    }
}
```

## DTO

使用 PHP 8.1+ 的 constructor property promotion：

```php
readonly class CreateUserRequest
{
    public function __construct(
        public string $name,
        public string $email
    ) {}
}
```

## 依赖注入

通过构造函数注入：

```php
class UserService
{
    public function __construct(
        private readonly UserRepository $repository
    ) {}
}
```

## 参考

参见 skill: `php-modern` 获取更多 PHP 模式。
