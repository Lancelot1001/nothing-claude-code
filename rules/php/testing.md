---
paths:
  - "**/*.php"
---
# PHP 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 PHP 特定内容。

## 框架

- **PHPUnit** 或 **Pest**：主测试框架
- **phpcov**：覆盖率

## PHPUnit

```php
use PHPUnit\Framework\TestCase;

class UserServiceTest extends TestCase
{
    public function test_creates_user_with_valid_email(): void
    {
        $service = new UserService(new InMemoryUserRepository());
        $user = $service->create('test@example.com', 'Alice');

        $this->assertEquals('Alice', $user->name);
        $this->assertEquals('test@example.com', $user->email);
    }

    public function test_rejects_invalid_email(): void
    {
        $service = new UserService(new InMemoryUserRepository());

        $this->expectException(InvalidArgumentException::class);
        $service->create('invalid', 'Bob');
    }
}
```

## 覆盖率

```bash
./vendor/bin/phpunit --coverage-text
```

## 参考

参见 skill: `php-modern` 获取更多 PHP 测试模式。
