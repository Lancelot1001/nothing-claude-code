---
paths:
  - "**/*.pl"
  - "**/*.pm"
  - "**/*.t"
---
# Perl 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Perl 特定内容。

## Taint 模式

使用 `use Taint` 检测污染数据（从外部输入的数据）：

```perl
#!/usr/bin/perl -T
use strict;
use warnings;
```

## Untainting

清理污染数据时指定允许的模式：

```perl
if ($input =~ /^([\w\s]+)$/) {
    $input = $1;  # 现在是 untainted
}
```

## 路径遍历

验证和规范化文件路径：

```perl
use File::Spec;
my $safe_path = File::Spec->canonpath($user_input);
die "Invalid path" if $safe_path =~ /\.\./;
```

## SQL 注入防护

- 始终使用参数绑定
- 绝不使用字符串插值构建 SQL

## 输入验证

- 验证所有外部输入
- 使用正则表达式限制允许的字符
- 检查文件类型和大小

## 参考

参见 skill: `perl` 获取更多 Perl 安全实践。
