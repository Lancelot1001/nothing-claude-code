---
paths:
  - "**/*.php"
---
# PHP 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 PHP 特定内容。

## 标准

- **PSR-12**：PHP 编码标准
- 启用 `declare(strict_types=1)`
- **PHP-CS-Fixer**：自动格式化

## 类型声明

在所有函数/方法上使用标量和返回类型：

```php
declare(strict_types=1);

function processUser(User $user): array {
    return ['id' => $user->id, 'name' => $user->name];
}
```

## 命名

- 类/接口：`PascalCase`
- 方法/变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`

## 参考

参见 skill: `php-modern` 获取更多 PHP 惯用模式。
