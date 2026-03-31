---
paths:
  - "**/*.php"
---
# PHP 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 PHP 特定内容。

## 输入验证

- 验证所有用户输入
- 使用 type declarations 和内置过滤器
- Laravel：使用 Form Request 验证

```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'email' => 'required|email',
        'name' => 'required|string|max:100',
    ]);

    return new JsonResponse(['data' => $validated], 201);
}
```

## CSRF 保护

- Laravel：自动开启 CSRF 保护
- 验证 `_token` 或 `X-CSRF-TOKEN` header

## SQL 注入防护

- 使用 prepared statements
- 绝不使用字符串拼接构建 SQL

```php
// GOOD
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

// BAD
$query = "SELECT * FROM users WHERE email = '$email'";
```

## 参考

参见 skill: `php-modern` 获取更多 PHP 安全实践。
