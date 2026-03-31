---
name: perl-security
description: Comprehensive Perl security covering taint mode, input validation, safe process execution, DBI parameterized queries, web security (XSS/SQLi/CSRF), and perlcritic security policies.
origin: something-claude-code
---

# Perl 安全模式

Perl 应用程序综合安全指南，涵盖输入验证、注入防范和安全编码实践。

## 何时激活

- 在 Perl 应用程序中处理用户输入
- 构建 Perl Web 应用程序（CGI、Mojolicious、Dancer2、Catalyst）
- 审查 Perl 代码的安全漏洞
- 使用用户提供路径执行文件操作
- 从 Perl 执行系统命令
- 编写 DBI 数据库查询

## 工作原理

从感知污染的输入边界开始，然后向外扩展：验证和去污染输入、限制文件系统和进程执行、处处使用参数化 DBI 查询。下面的示例展示此skill期望你在发布接触用户输入、shell 或网络的 Perl 代码之前应用的安全默认值。

## 污染模式

Perl 的污染模式（`-T`）跟踪来自外部源的数据，防止其在未经显式验证的情况下用于不安全操作。

### 启用污染模式

```perl
#!/usr/bin/perl -T
use v5.36;

# 污染的：来自程序外部的任何东西
my $input    = $ARGV[0];        # 污染的
my $env_path = $ENV{PATH};      # 污染的
my $form     = <STDIN>;         # 污染的
my $query    = $ENV{QUERY_STRING}; # 污染的

# 尽早清理 PATH（污染模式必需）
$ENV{PATH} = '/usr/local/bin:/usr/bin:/bin';
delete @ENV{qw(IFS CDPATH ENV BASH_ENV)};
```

### 去污染模式

```perl
use v5.36;

# 好：使用特定正则验证和去污染
sub untaint_username($input) {
    if ($input =~ /^([a-zA-Z0-9_]{3,30})$/) {
        return $1;  # $1 是干净的
    }
    die "Invalid username: must be 3-30 alphanumeric characters\n";
}

# 好：验证和去污染文件路径
sub untaint_filename($input) {
    if ($input =~ m{^([a-zA-Z0-9._-]+)$}) {
        return $1;
    }
    die "Invalid filename: contains unsafe characters\n";
}

# 坏：过度宽松的去污染（违背目的）
sub bad_untaint($input) {
    $input =~ /^(.*)$/s;
    return $1;  # 接受任何东西——毫无意义
}
```

## 输入验证

### 白名单优于黑名单

```perl
use v5.36;

# 好：白名单——精确界定允许的内容
sub validate_sort_field($field) {
    my %allowed = map { $_ => 1 } qw(name email created_at updated_at);
    die "Invalid sort field: $field\n" unless $allowed{$field};
    return $field;
}

# 好：使用特定模式验证
sub validate_email($email) {
    if ($email =~ /^([a-zA-Z0-9._%+-]+\@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/) {
        return $1;
    }
    die "Invalid email address\n";
}

sub validate_integer($input) {
    if ($input =~ /^(-?\d{1,10})$/) {
        return $1 + 0;  # 强制转换为数字
    }
    die "Invalid integer\n";
}

# 坏：黑名单——总是不完整
sub bad_validate($input) {
    die "Invalid" if $input =~ /[<>"';&|]/;  # 遗漏编码攻击
    return $input;
}
```

### 长度约束

```perl
use v5.36;

sub validate_comment($text) {
    die "Comment is required\n"        unless length($text) > 0;
    die "Comment exceeds 10000 chars\n" if length($text) > 10_000;
    return $text;
}
```

## 安全正则表达式

### ReDoS 防范

灾难性回溯发生在重叠模式上的嵌套量词。

```perl
use v5.36;

# 坏：易受 ReDoS 攻击（指数回溯）
my $bad_re = qr/^(a+)+$/;           # 嵌套量词
my $bad_re2 = qr/^([a-zA-Z]+)*$/;   # 类上的嵌套量词
my $bad_re3 = qr/^(.*?,){10,}$/;    # 重复的贪婪/惰性组合

# 好：重写为无嵌套
my $good_re = qr/^a+$/;             # 单数量词
my $good_re2 = qr/^[a-zA-Z]+$/;     # 类上的单数量词

# 好：使用占有量词或原子组防止回溯
my $safe_re = qr/^[a-zA-Z]++$/;             # 占有式（5.10+）
my $safe_re2 = qr/^(?>a+)$/;                # 原子组

# 好：对不信任的模式强制超时
use POSIX qw(alarm);
sub safe_match($string, $pattern, $timeout = 2) {
    my $matched;
    eval {
        local $SIG{ALRM} = sub { die "Regex timeout\n" };
        alarm($timeout);
        $matched = $string =~ $pattern;
        alarm(0);
    };
    alarm(0);
    die $@ if $@;
    return $matched;
}
```

## 安全文件操作

### 三参数 open

```perl
use v5.36;

# 好：三参数 open、词法文件句柄、检查返回值
sub read_file($path) {
    open my $fh, '<:encoding(UTF-8)', $path
        or die "Cannot open '$path': $!\n";
    local $/;
    my $content = <$fh>;
    close $fh;
    return $content;
}

# 坏：使用用户数据的双参数 open（命令注入）
sub bad_read($path) {
    open my $fh, $path;        # 如果 $path = "|rm -rf /"，执行命令！
    open my $fh, "< $path";   # Shell 元字符注入
}
```

### TOCTOU 防范和路径遍历

```perl
use v5.36;
use Fcntl qw(:DEFAULT :flock);
use File::Spec;
use Cwd qw(realpath);

# 原子文件创建
sub create_file_safe($path) {
    sysopen(my $fh, $path, O_WRONLY | O_CREAT | O_EXCL, 0600)
        or die "Cannot create '$path': $!\n";
    return $fh;
}

# 验证路径保持在允许的目录内
sub safe_path($base_dir, $user_path) {
    my $real = realpath(File::Spec->catfile($base_dir, $user_path))
        // die "Path does not exist\n";
    my $base_real = realpath($base_dir)
        // die "Base dir does not exist\n";
    die "Path traversal blocked\n" unless $real =~ /^\Q$base_real\E(?:\/|\z)/;
    return $real;
}
```

对临时文件使用 `File::Temp`（`tempfile(UNLINK => 1)`）和对竞争条件使用 `flock(LOCK_EX)`。

## 安全进程执行

### 列表形式的 system 和 exec

```perl
use v5.36;

# 好：列表形式——无 shell 插值
sub run_command(@cmd) {
    system(@cmd) == 0
        or die "Command failed: @cmd\n";
}

run_command('grep', '-r', $user_pattern, '/var/log/app/');

# 好：使用 IPC::Run3 安全捕获输出
use IPC::Run3;
sub capture_output(@cmd) {
    my ($stdout, $stderr);
    run3(\@cmd, \undef, \$stdout, \$stderr);
    if ($?) {
        die "Command failed (exit $?): $stderr\n";
    }
    return $stdout;
}

# 坏：字符串形式——shell 注入！
sub bad_search($pattern) {
    system("grep -r '$pattern' /var/log/app/");  # 如果 $pattern = "'; rm -rf / #"
}

# 坏：带插值的反引号
my $output = `ls $user_dir`;   # Shell 注入风险
```

也使用 `Capture::Tiny` 安全捕获外部命令的 stdout/stderr。

## SQL 注入防范

### DBI 占位符

```perl
use v5.36;
use DBI;

my $dbh = DBI->connect($dsn, $user, $pass, {
    RaiseError => 1,
    PrintError => 0,
    AutoCommit => 1,
});

# 好：参数化查询——始终使用占位符
sub find_user($dbh, $email) {
    my $sth = $dbh->prepare('SELECT * FROM users WHERE email = ?');
    $sth->execute($email);
    return $sth->fetchrow_hashref;
}

sub search_users($dbh, $name, $status) {
    my $sth = $dbh->prepare(
        'SELECT * FROM users WHERE name LIKE ? AND status = ? ORDER BY name'
    );
    $sth->execute("%$name%", $status);
    return $sth->fetchall_arrayref({});
}

# 坏：SQL 中的字符串插值（SQLi 漏洞！）
sub bad_find($dbh, $email) {
    my $sth = $dbh->prepare("SELECT * FROM users WHERE email = '$email'");
    # 如果 $email = "' OR 1=1 --"，返回所有用户
    $sth->execute;
    return $sth->fetchrow_hashref;
}
```

### 动态列白名单

```perl
use v5.36;

# 好：根据白名单验证列名
sub order_by($dbh, $column, $direction) {
    my %allowed_cols = map { $_ => 1 } qw(name email created_at);
    my %allowed_dirs = map { $_ => 1 } qw(ASC DESC);

    die "Invalid column: $column\n"    unless $allowed_cols{$column};
    die "Invalid direction: $direction\n" unless $allowed_dirs{uc $direction};

    my $sth = $dbh->prepare("SELECT * FROM users ORDER BY $column $direction");
    $sth->execute;
    return $sth->fetchall_arrayref({});
}

# 坏：直接插值用户选择的列
sub bad_order($dbh, $column) {
    $dbh->prepare("SELECT * FROM users ORDER BY $column");  # SQLi！
}
```

### DBIx::Class（ORM 安全）

```perl
use v5.36;

# DBIx::Class 生成安全的参数化查询
my @users = $schema->resultset('User')->search({
    status => 'active',
    email  => { -like => '%@example.com' },
}, {
    order_by => { -asc => 'name' },
    rows     => 50,
});
```

## Web 安全

### XSS 防范

```perl
use v5.36;
use HTML::Entities qw(encode_entities);
use URI::Escape qw(uri_escape_utf8);

# 好：为 HTML 上下文编码输出
sub safe_html($user_input) {
    return encode_entities($user_input);
}

# 好：为 URL 上下文编码
sub safe_url_param($value) {
    return uri_escape_utf8($value);
}

# 好：为 JSON 上下文编码
use JSON::MaybeXS qw(encode_json);
sub safe_json($data) {
    return encode_json($data);  # 处理转义
}

# 模板自动转义（Mojolicious）
# <%= $user_input %>   — 自动转义（安全）
# <%== $raw_html %>    — 原始输出（危险，仅用于可信内容）

# 模板自动转义（Template Toolkit）
# [% user_input | html %]  — 显式 HTML 编码

# 坏：HTML 中的原始输出
sub bad_html($input) {
    print "<div>$input</div>";  # XSS 如果 $input 包含 <script>
}
```

### CSRF 保护

```perl
use v5.36;
use Crypt::URandom qw(urandom);
use MIME::Base64 qw(encode_base64url);

sub generate_csrf_token() {
    return encode_base64url(urandom(32));
}
```

验证令牌时使用常量时间比较。大多数 Web 框架（Mojolicious、Dancer2、Catalyst）提供内置 CSRF 保护——优先使用这些而非手写方案。

### 会话和响应头安全

```perl
use v5.36;

# Mojolicious 会话 + 响应头
$app->secrets(['long-random-secret-rotated-regularly']);
$app->sessions->secure(1);          # 仅 HTTPS
$app->sessions->samesite('Lax');

$app->hook(after_dispatch => sub ($c) {
    $c->res->headers->header('X-Content-Type-Options' => 'nosniff');
    $c->res->headers->header('X-Frame-Options'        => 'DENY');
    $c->res->headers->header('Content-Security-Policy' => "default-src 'self'");
    $c->res->headers->header('Strict-Transport-Security' => 'max-age=31536000; includeSubDomains');
});
```

## 输出编码

始终根据上下文为输出编码：HTML 用 `HTML::Entities::encode_entities()`、URL 用 `URI::Escape::uri_escape_utf8()`、JSON 用 `JSON::MaybeXS::encode_json()`。

## CPAN 模块安全

- **在 cpanfile 中固定版本**：`requires 'DBI', '== 1.643';`
- **优先选择维护中的模块**：检查 MetaCPAN 的最近发布
- **最小化依赖**：每个依赖都是攻击面

## 安全工具

### perlcritic 安全策略

```ini
# .perlcriticrc — 安全导向配置
severity = 3
theme = security + core

# 要求三参数 open
[InputOutput::RequireThreeArgOpen]
severity = 5

# 要求检查的系统调用
[InputOutput::RequireCheckedSyscalls]
functions = :builtins
severity = 4

# 禁止字符串 eval
[BuiltinFunctions::ProhibitStringyEval]
severity = 5

# 禁止反引号操作符
[InputOutput::ProhibitBacktickOperators]
severity = 4

# CGI 中要求污染检查
[Modules::RequireTaintChecking]
severity = 5

# 禁止双参数 open
[InputOutput::ProhibitTwoArgOpen]
severity = 5

# 禁止裸词文件句柄
[InputOutput::ProhibitBarewordFileHandles]
severity = 5
```

### 运行 perlcritic

```bash
# 检查单个文件
perlcritic --severity 3 --theme security lib/MyApp/Handler.pm

# 检查整个项目
perlcritic --severity 3 --theme security lib/

# CI 集成
perlcritic --severity 4 --theme security --quiet lib/ || exit 1
```

## 快速安全检查清单

| 检查项 | 验证内容 |
|---|---|
| 污染模式 | CGI/Web 脚本上的 `-T` 标志 |
| 输入验证 | 白名单模式、长度限制 |
| 文件操作 | 三参数 open、路径遍历检查 |
| 进程执行 | 列表形式 system、无 shell 插值 |
| SQL 查询 | DBI 占位符、从不插值 |
| HTML 输出 | `encode_entities()`、模板自动转义 |
| CSRF 令牌 | 生成、在状态更改请求时验证 |
| 会话配置 | 安全、HttpOnly、SameSite Cookie |
| HTTP 响应头 | CSP、X-Frame-Options、HSTS |
| 依赖 | 固定版本、审计模块 |
| 正则安全 | 无嵌套量词、锚定模式 |
| 错误消息 | 不向用户泄露堆栈跟踪或路径 |

## 反模式

```perl
# 1. 使用用户数据的双参数 open（命令注入）
open my $fh, $user_input;               # 严重漏洞

# 2. 字符串形式 system（shell 注入）
system("convert $user_file output.png"); # 严重漏洞

# 3. SQL 字符串插值
$dbh->do("DELETE FROM users WHERE id = $id");  # SQLi

# 4. eval 用户输入（代码注入）
eval $user_code;                         # 远程代码执行

# 5. 不清理地信任 $ENV
my $path = $ENV{UPLOAD_DIR};             # 可能被操纵
system("ls $path");                      # 双重漏洞

# 6. 无验证地禁用污染
($input) = $input =~ /(.*)/s;           # 惰性去污染——违背目的

# 7. HTML 中的原始用户数据
print "<div>Welcome, $username!</div>";  # XSS

# 8. 未验证的重定向
print $cgi->redirect($user_url);         # 开放重定向
```

**记住**：Perl 的灵活性很强大，但需要纪律。对面向 Web 的代码使用污染模式、用白名单验证所有输入、对每个查询使用 DBI 占位符、根据上下文为所有输出编码。深度防御——绝不依赖单一层。
