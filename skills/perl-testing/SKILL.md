---
name: perl-testing
description: Perl testing patterns using Test2::V0, Test::More, prove runner, mocking, coverage with Devel::Cover, and TDD methodology.
origin: nothing-claude-code
---

# Perl 测试模式

使用 Test2::V0、Test::More、prove 和 TDD 方法论进行 Perl 应用程序的综合测试策略。

## 何时激活

- 编写新的 Perl 代码（遵循 TDD：红、绿、重构）
- 为 Perl 模块或应用程序设计测试套件
- 审查 Perl 测试覆盖率
- 建立 Perl 测试基础设施
- 将测试从 Test::More 迁移到 Test2::V0
- 调试失败的 Perl 测试

## TDD workflow process

始终遵循红-绿-重构循环。

```perl
# 步骤 1：红——写一个失败的测试
# t/unit/calculator.t
use v5.36;
use Test2::V0;

use lib 'lib';
use Calculator;

subtest 'addition' => sub {
    my $calc = Calculator->new;
    is($calc->add(2, 3), 5, 'adds two numbers');
    is($calc->add(-1, 1), 0, 'handles negatives');
};

done_testing;

# 步骤 2：绿——写最小实现
# lib/Calculator.pm
package Calculator;
use v5.36;
use Moo;

sub add($self, $a, $b) {
    return $a + $b;
}

1;

# 步骤 3：重构——在测试保持绿色时改进
# 运行：prove -lv t/unit/calculator.t
```

## Test::More 基础

标准 Perl 测试模块——广泛使用，随核心一起发布。

### 基本断言

```perl
use v5.36;
use Test::More;

# 提前计划或使用 done_testing
# plan tests => 5;  # 固定计划（可选）

# 相等性
is($result, 42, 'returns correct value');
isnt($result, 0, 'not zero');

# 布尔值
ok($user->is_active, 'user is active');
ok(!$user->is_banned, 'user is not banned');

# 深度比较
is_deeply(
    $got,
    { name => 'Alice', roles => ['admin'] },
    'returns expected structure'
);

# 模式匹配
like($error, qr/not found/i, 'error mentions not found');
unlike($output, qr/password/, 'output hides password');

# 类型检查
isa_ok($obj, 'MyApp::User');
can_ok($obj, 'save', 'delete');

done_testing;
```

### SKIP 和 TODO

```perl
use v5.36;
use Test::More;

# 条件跳过测试
SKIP: {
    skip 'No database configured', 2 unless $ENV{TEST_DB};

    my $db = connect_db();
    ok($db->ping, 'database is reachable');
    is($db->version, '15', 'correct PostgreSQL version');
}

# 标记预期失败
TODO: {
    local $TODO = 'Caching not yet implemented';
    is($cache->get('key'), 'value', 'cache returns value');
}

done_testing;
```

## Test2::V0 现代框架

Test2::V0 是 Test::More 的现代替代品——更丰富的断言、更好的诊断和可扩展性。

### 为什么选择 Test2？

- 使用哈希/数组构建器进行更优秀的深度比较
- 失败时更好的诊断输出
- 子测试具有更清晰的作用域
- 通过 Test2::Tools::* 插件可扩展
- 与 Test::More 测试向后兼容

### 使用构建器的深度比较

```perl
use v5.36;
use Test2::V0;

# 哈希构建器——检查部分结构
is(
    $user->to_hash,
    hash {
        field name  => 'Alice';
        field email => match(qr/\@example\.com$/);
        field age   => validator(sub { $_ >= 18 });
        # 忽略其他字段
        etc();
    },
    'user has expected fields'
);

# 数组构建器
is(
    $result,
    array {
        item 'first';
        item match(qr/^second/);
        item DNE();  # Does Not Exist — 验证没有额外项目
    },
    'result matches expected list'
);

# Bag——顺序无关比较
is(
    $tags,
    bag {
        item 'perl';
        item 'testing';
        item 'tdd';
    },
    'has all required tags regardless of order'
);
```

### 子测试

```perl
use v5.36;
use Test2::V0;

subtest 'User creation' => sub {
    my $user = User->new(name => 'Alice', email => 'alice@example.com');
    ok($user, 'user object created');
    is($user->name, 'Alice', 'name is set');
    is($user->email, 'alice@example.com', 'email is set');
};

subtest 'User validation' => sub {
    my $warnings = warns {
        User->new(name => '', email => 'bad');
    };
    ok($warnings, 'warns on invalid data');
};

done_testing;
```

### 使用 Test2 进行异常测试

```perl
use v5.36;
use Test2::V0;

# 测试代码死亡
like(
    dies { divide(10, 0) },
    qr/Division by zero/,
    'dies on division by zero'
);

# 测试代码存活
ok(lives { divide(10, 2) }, 'division succeeds') or note($@);

# 组合模式
subtest 'error handling' => sub {
    ok(lives { parse_config('valid.json') }, 'valid config parses');
    like(
        dies { parse_config('missing.json') },
        qr/Cannot open/,
        'missing file dies with message'
    );
};

done_testing;
```

## 测试组织和 prove

### 目录结构

```text
t/
├── 00-load.t              # 验证模块编译
├── 01-basic.t             # 核心功能
├── unit/
│   ├── config.t           # 按模块的单元测试
│   ├── user.t
│   └── util.t
├── integration/
│   ├── database.t
│   └── api.t
├── lib/
│   └── TestHelper.pm      # 共享测试工具
└── fixtures/
    ├── config.json        # 测试数据文件
    └── users.csv
```

### prove 命令

```bash
# 运行所有测试
prove -l t/

# 详细输出
prove -lv t/

# 运行特定测试
prove -lv t/unit/user.t

# 递归搜索
prove -lr t/

# 并行执行（8 个作业）
prove -lr -j8 t/

# 仅运行上次运行的失败测试
prove -l --state=failed t/

# 带计时器的彩色输出
prove -l --color --timer t/

# CI 的 TAP 输出
prove -l --formatter TAP::Formatter::JUnit t/ > results.xml
```

### .proverc 配置

```text
-l
--color
--timer
-r
-j4
--state=save
```

## 夹具和设置/拆卸

### 子测试隔离

```perl
use v5.36;
use Test2::V0;
use File::Temp qw(tempdir);
use Path::Tiny;

subtest 'file processing' => sub {
    # 设置
    my $dir = tempdir(CLEANUP => 1);
    my $file = path($dir, 'input.txt');
    $file->spew_utf8("line1\nline2\nline3\n");

    # 测试
    my $result = process_file("$file");
    is($result->{line_count}, 3, 'counts lines');

    # 拆卸自动发生（CLEANUP => 1）
};
```

### 共享测试辅助函数

将可复用辅助函数放在 `t/lib/TestHelper.pm` 中，使用 `use lib 't/lib'` 加载。通过 `Exporter` 导出工厂函数如 `create_test_db()`、`create_temp_dir()` 和 `fixture_path()`。

## 模拟

### Test::MockModule

```perl
use v5.36;
use Test2::V0;
use Test::MockModule;

subtest 'mock external API' => sub {
    my $mock = Test::MockModule->new('MyApp::API');

    # 好：Mock 返回受控数据
    $mock->mock(fetch_user => sub ($self, $id) {
        return { id => $id, name => 'Mock User', email => 'mock@test.com' };
    });

    my $api = MyApp::API->new;
    my $user = $api->fetch_user(42);
    is($user->{name}, 'Mock User', 'returns mocked user');

    # 验证调用计数
    my $call_count = 0;
    $mock->mock(fetch_user => sub { $call_count++; return {} });
    $api->fetch_user(1);
    $api->fetch_user(2);
    is($call_count, 2, 'fetch_user called twice');

    # Mock 在 $mock 超出作用域时自动恢复
};

# 坏：猴子补丁而不恢复
# *MyApp::API::fetch_user = sub { ... };  # 绝对不要——跨测试泄漏
```

对于轻量级模拟对象，使用 `Test::MockObject` 创建可注入测试双精度，使用 `->mock()` 并用 `->called_ok()` 验证调用。

## 使用 Devel::Cover 进行覆盖率

### 运行覆盖率

```bash
# 基本覆盖率报告
cover -test

# 或分步进行
perl -MDevel::Cover -Ilib t/unit/user.t
cover

# HTML 报告
cover -report html
open cover_db/coverage.html

# 特定阈值
cover -test -report text | grep 'Total'

# CI 友好：低于阈值时失败
cover -test && cover -report text -select '^lib/' \
  | perl -ne 'if (/Total.*?(\d+\.\d+)/) { exit 1 if $1 < 80 }'
```

### 集成测试

对数据库测试使用内存 SQLite，对 API 测试模拟 HTTP::Tiny。

```perl
use v5.36;
use Test2::V0;
use DBI;

subtest 'database integration' => sub {
    my $dbh = DBI->connect('dbi:SQLite:dbname=:memory:', '', '', {
        RaiseError => 1,
    });
    $dbh->do('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');

    $dbh->prepare('INSERT INTO users (name) VALUES (?)')->execute('Alice');
    my $row = $dbh->selectrow_hashref('SELECT * FROM users WHERE name = ?', undef, 'Alice');
    is($row->{name}, 'Alice', 'inserted and retrieved user');
};

done_testing;
```

## 最佳实践

### 应该做

- **遵循 TDD**：在实现前写测试（红-绿-重构）
- **使用 Test2::V0**：现代断言、更好诊断
- **使用子测试**：分组相关断言、隔离状态
- **模拟外部依赖**：网络、数据库、文件系统
- **使用 `prove -l`**：始终在 `@INC` 中包含 lib/
- **清晰命名测试**：`'user login with invalid password fails'`
- **测试边界情况**：空字符串、undef、零、边界值
- **目标是 80%+ 覆盖率**：聚焦业务逻辑路径
- **保持测试快速**：模拟 I/O、使用内存数据库

### 不应该做

- **不测试实现**：测试行为和输出，而非内部
- **不在子测试间共享状态**：每个子测试应该是独立的
- **不跳过 `done_testing`**：确保所有计划的测试都运行了
- **不过度模拟**：仅模拟边界，而非被测代码
- **新项目不使用 `Test::More`**：优先使用 Test2::V0
- **不忽略测试失败**：合并前所有测试必须通过
- **不测试 CPAN 模块**：信任库正常工作
- **不写脆弱测试**：避免过度特定的字符串匹配

## 快速参考

| 任务 | 命令/模式 |
|---|---|
| 运行所有测试 | `prove -lr t/` |
| 运行单个测试详细 | `prove -lv t/unit/user.t` |
| 并行测试运行 | `prove -lr -j8 t/` |
| 覆盖率报告 | `cover -test && cover -report html` |
| 测试相等性 | `is($got, $expected, 'label')` |
| 深度比较 | `is($got, hash { field k => 'v'; etc() }, 'label')` |
| 测试异常 | `like(dies { ... }, qr/msg/, 'label')` |
| 测试无异常 | `ok(lives { ... }, 'label')` |
| 模拟方法 | `Test::MockModule->new('Pkg')->mock(m => sub { ... })` |
| 跳过测试 | `SKIP: { skip 'reason', $count unless $cond; ... }` |
| TODO 测试 | `TODO: { local $TODO = 'reason'; ... }` |

## 常见陷阱

### 忘记 `done_testing`

```perl
# 坏：测试文件运行但不验证所有测试都执行了
use Test2::V0;
is(1, 1, 'works');
# 缺少 done_testing——如果测试代码被跳过则静默 bug

# 好：始终以 done_testing 结束
use Test2::V0;
is(1, 1, 'works');
done_testing;
```

### 缺少 `-l` 标志

```bash
# 坏：lib/ 中的模块未找到
prove t/unit/user.t
# 无法在 @INC 中找到 MyApp/User.pm

# 好：在 @INC 中包含 lib/
prove -l t/unit/user.t
```

### 过度模拟

模拟*依赖*，而非被测代码。如果你的测试仅验证 mock 返回你告诉它的东西，那它什么都没测。

### 测试污染

在子测试内部使用 `my` 变量——绝不使用 `our`——以防止状态在测试间泄漏。

**记住**：测试是你的安全网。保持它们快速、专注和独立。新项目使用 Test2::V0，用 prove 运行，用 Devel::Cover 负责覆盖率。
