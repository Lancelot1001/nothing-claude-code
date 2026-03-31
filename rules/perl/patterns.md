---
paths:
  - "**/*.pl"
  - "**/*.pm"
  - "**/*.t"
---
# Perl 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 Perl 特定内容。

## DBI 数据库访问

使用参数绑定：

```perl
my $sth = $dbh->prepare("SELECT * FROM users WHERE email = ?");
$sth->execute($email);
my $user = $sth->fetchrow_hashref();
```

## DTO / Data Objects

```perl
package User;
use Moo;
use strict;
use warnings;

has name  => (is => 'ro', required => 1);
has email => (is => 'ro', required => 1);
has age   => (is => 'rw', predicate => 'has_age');
```

## Path::Tiny

文件操作：

```perl
use Path::Tiny qw(path);
my $content = path("data.json")->slurp_utf8;
path("output.txt")->spew_utf8($content);
```

## Exporter

公共 API：

```perl
package MyModule::Utils;
use Exporter qw(import);
our @EXPORT_OK = qw(format_date parse_config);
```

## 参考

参见 skill: `perl` 获取全面的 Perl 惯用模式。
