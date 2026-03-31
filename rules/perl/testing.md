---
paths:
  - "**/*.pl"
  - "**/*.pm"
  - "**/*.t"
---
# Perl 测试

> 本文件继承 [common/testing.md](../common/testing.md)，包含 Perl 特定内容。

## 框架

- **Test2::V0**：现代测试框架
- **prove**：运行测试

## 测试组织

```perl
use Test2::V0;
use My::Module;

subtest 'User validation' => sub {
    ok(validate_email('test@example.com'), 'valid email');
    ok(!validate_email('invalid'), 'invalid email');
};

done_testing;
```

## 覆盖率

```bash
perl -MDevel::Cover=rotate,text ./tests/run.pl
```

## 测试命令

```bash
prove -l t/
prove -l --state=save t/
```

## 参考

参见 skill: `perl` 获取更多 Perl 测试模式。
