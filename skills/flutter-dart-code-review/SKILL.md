---
name: flutter-dart-code-review
description: 与库无关的 Flutter/Dart 代码审查清单，涵盖 Widget 最佳实践、状态管理模式（BLoC、Riverpod、Provider、GetX、MobX、Signals）、Dart 惯用法、性能、无障碍、安全和整洁架构。
origin: something-claude-code
---

# Flutter/Dart 代码审查最佳实践

用于审查 Flutter/Dart 应用程序的综合、与库无关的清单。这些原则适用于所使用的状态管理方案、路由库或依赖注入框架。

---

## 1. 项目整体健康状况

- [ ] 项目遵循一致的文件夹结构（按特性或按层级）
- [ ] 关注点分离正确：UI、业务逻辑、数据层
- [ ] Widget 中不包含业务逻辑；Widget 仅负责展示
- [ ] `pubspec.yaml` 整洁——无未使用的依赖，版本正确锁定
- [ ] `analysis_options.yaml` 包含严格的 lint 规则集并启用了严格的分析器设置
- [ ] 生产代码中无 `print()` 语句——使用 `dart:developer` `log()` 或日志包
- [ ] 生成的文件（`.g.dart`、`.freezed.dart`、`.gr.dart`）是最新的或在 `.gitignore` 中
- [ ] 平台特定代码通过抽象隔离

---

## 2. Dart 语言陷阱

- [ ] **隐式 dynamic**：缺少类型注解导致 `dynamic`——启用 `strict-casts`、`strict-inference`、`strict-raw-types`
- [ ] **空安全误用**：过度使用 `!`（Bang 操作符）而非正确的空检查或 Dart 3 模式匹配（`if (value case var v?)`）
- [ ] **类型提升失败**：在可以使用局部变量提升的地方使用 `this.field`
- [ ] **捕获范围过宽**：`catch (e)` 没有 `on` 子句；始终指定异常类型
- [ ] **捕获 `Error`**：`Error` 子类型表示程序错误，不应被捕获
- [ ] **未使用的 `async`**：标记为 `async` 但从未 `await` 的函数——不必要的开销
- [ ] **`late` 过度使用**：`late` 用在可空类型或构造函数初始化更安全的地方；将错误延迟到运行时
- [ ] **循环中的字符串拼接**：使用 `StringBuffer` 而不是 `+` 进行迭代字符串构建
- [ ] **`const` 上下文中的可变状态**：const 构造函数类中的字段不应是可变的
- [ ] **忽略 `Future` 返回值**：使用 `await` 或显式调用 `unawaited()` 表明意图
- [ ] **`var` 适用于 `final` 的场景**：局部变量优先使用 `final`，编译时常量使用 `const`
- [ ] **相对导入**：使用 `package:` 导入以保持一致性
- [ ] **暴露的可变集合**：公共 API 应返回不可修改的视图，而非原始的 `List`/`Map`
- [ ] **缺少 Dart 3 模式匹配**：优先使用 switch 表达式和 `if-case` 而非冗长的 `is` 检查和手动转换
- [ ] **用于多次返回的废弃类**：使用 Dart 3 记录 `(String, int)` 而非一次性 DTO
- [ ] **生产代码中的 `print()`**：使用 `dart:developer` `log()` 或项目日志包；`print()` 没有日志级别且无法过滤

---

## 3. Widget 最佳实践

### Widget 分解：
- [ ] 单个 Widget 的 `build()` 方法不超过约 80-100 行
- [ ] Widget 按封装性以及按其变化方式（重建边界）分解
- [ ] 返回 Widget 的私有 `_build*()` 辅助方法应提取为单独的 Widget 类（支持元素复用、const 传播和框架优化）
- [ ] 在不需要可变局部状态的地方优先使用无状态 Widget
- [ ] 可复用的提取 Widget 放在单独文件中

### Const 使用：
- [ ] 尽可能使用 `const` 构造函数——防止不必要的重建
- [ ] 对不变化的集合使用 `const` 字面量（`const []`、`const {}`）
- [ ] 当所有字段都是 final 时，构造函数声明为 `const`

### Key 使用：
- [ ] 在列表/网格中使用 `ValueKey` 以在重新排序时保留状态
- [ ] 谨慎使用 `GlobalKey`——仅在真正需要跨树访问状态时使用
- [ ] 避免在 `build()` 中使用 `UniqueKey`——它会导致每帧都重建
- [ ] 当身份基于数据对象而非单个值时使用 `ObjectKey`

### 主题与设计系统：
- [ ] 颜色来自 `Theme.of(context).colorScheme`——无硬编码的 `Colors.red` 或十六进制值
- [ ] 文本样式来自 `Theme.of(context).textTheme`——无内联带原始字体大小的 `TextStyle`
- [ ] 验证暗色模式兼容性——不假设浅色背景
- [ ] 间距和尺寸使用一致的设计标记或常量，而非魔法数字

### Build 方法复杂度：
- [ ] `build()` 中无网络调用、文件 I/O 或重计算
- [ ] `build()` 中无 `Future.then()` 或 `async` 工作
- [ ] `build()` 中无订阅创建（`.listen()`）
- [ ] `setState()` 局限于最小可能的子树

---

## 4. 状态管理（与库无关）

这些原则适用于所有 Flutter 状态管理方案（BLoC、Riverpod、Provider、GetX、MobX、Signals、ValueNotifier 等）。

### 架构：
- [ ] 业务逻辑位于 Widget 层之外——位于状态管理组件中（BLoC、Notifier、Controller、Store、ViewModel 等）
- [ ] 状态管理器通过注入接收依赖，而非内部构造
- [ ] 服务层或仓储层抽象数据源——Widget 和状态管理器不应直接调用 API 或数据库
- [ ] 状态管理器单一职责——无处理不相关问题的"上帝"管理器
- [ ] 跨组件依赖遵循方案的约定：
  - **Riverpod**：通过 `ref.watch` 依赖其他 provider 是预期的——仅标记循环或过度纠缠的链
  - **BLoC**：BLoC 不应直接依赖其他 BLoC——优先使用共享仓储或展示层协调
  - 其他方案：遵循文档化的组件间通信约定

### 不可变性与值相等（针对不可变状态方案：BLoC、Riverpod、Redux）：
- [ ] 状态对象不可变——通过 `copyWith()` 或构造函数创建新实例，绝不原地修改
- [ ] 状态类正确实现 `==` 和 `hashCode`（比较时包含所有字段）
- [ ] 机制在项目中保持一致——手动覆盖、`Equatable`、`freezed`、Dart 记录或其他
- [ ] 状态对象内部的集合不暴露为原始可变 `List`/`Map`

### 响应式纪律（针对响应式变更方案：MobX、GetX、Signals）：
- [ ] 状态仅通过方案的响应式 API 变更（ MobX 中的 `@action`、Signals 上的 `.value`、GetX 中的 `.obs`）——直接字段变更会绕过变更追踪
- [ ] 派生值使用方案的计算机制，而非冗余存储
- [ ] Reactions 和清理器正确清理（ MobX 中的 `ReactionDisposer`、Signals 中的 effect 清理）

### 状态形状设计：
- [ ] 互斥状态使用 sealed 类型、联合变体或方案的构建式异步状态类型（如 Riverpod 的 `AsyncValue`）——而非布尔标志（`isLoading`、`isError`、`hasData`）
- [ ] 每个异步操作将加载、成功和错误建模为不同状态
- [ ] UI 中穷举处理所有状态变体——无不声不响被忽略的情况
- [ ] 错误状态携带显示用的错误信息；加载状态不携带陈旧数据
- [ ] 可空数据不用作加载指示——状态是显式的

```dart
// 差——布尔标志汤允许不可能的状态
class UserState {
  bool isLoading = false;
  bool hasError = false; // isLoading && hasError 是可表示的！
  User? user;
}

// 好（不可变方式）——sealed 类型使不可能的状态不可表示
sealed class UserState {}
class UserInitial extends UserState {}
class UserLoading extends UserState {}
class UserLoaded extends UserState {
  final User user;
  const UserLoaded(this.user);
}
class UserError extends UserState {
  final String message;
  const UserError(this.message);
}

// 好（响应式方式）——可观察枚举 + 数据，通过响应式 API 变更
// enum UserStatus { initial, loading, loaded, error }
// 使用方案的 observable/signal 单独包装状态和数据
```

### 重建优化：
- [ ] 状态消费者 Widget（Builder、Consumer、Observer、Obx、Watch 等）尽可能窄范围
- [ ] 使用选择器仅在特定字段变化时重建——而非每次状态发送都重建
- [ ] 使用 `const` Widget 停止重建在树中的传播
- [ ] 计算/派生状态响应式计算，而非冗余存储

### 订阅与清理：
- [ ] 所有手动订阅（`.listen()`）在 `dispose()`/`close()` 中取消
- [ ] 不再需要时关闭 Stream 控制器
- [ ] 在清理生命周期中取消定时器
- [ ] 优先使用框架管理的生命周期而非手动订阅（声明式构建器优于 `.listen()`）
- [ ] 异步回调中 `setState` 前检查 `mounted`
- [ ] Flutter 3.7+ 中 `await` 后使用 `BuildContext` 前检查 `context.mounted`——陈旧 context 导致崩溃
- [ ] 异步间隙后无导航、对话框或脚手架消息，除非验证 Widget 仍处于挂载状态
- [ ] `BuildContext` 永不存储在单例、状态管理器或静态字段中

### 本地状态 vs 全局状态：
- [ ] 临时 UI 状态（复选框、滑块、动画）使用本地状态（`setState`、`ValueNotifier`）
- [ ] 共享状态仅提升到需要的高度——不过度全局化
- [ ] 特性作用域状态在该特性不再活跃时正确清理

---

## 5. 性能

### 不必要的重建：
- [ ] `setState()` 不在根 Widget 级别调用——本地化状态变更
- [ ] 使用 `const` Widget 停止重建传播
- [ ] 在独立重绘的复杂子树上使用 `RepaintBoundary`
- [ ] 动画独立子树的 `AnimatedBuilder` 子参数

### build() 中的昂贵操作：
- [ ] `build()` 中无排序、过滤或映射大集合——在状态管理层计算
- [ ] `build()` 中无正则表达式编译
- [ ] `MediaQuery.of(context)` 使用特定（如 `MediaQuery.sizeOf(context)`）

### 图像优化：
- [ ] 网络图像使用缓存（项目适当的任何缓存方案）
- [ ] 目标设备使用适当的图像分辨率（不要为缩略图加载 4K 图像）
- [ ] 使用 `cacheWidth`/`cacheHeight` 的 `Image.asset` 以显示大小解码
- [ ] 为网络图像提供占位符和错误 Widget

### 延迟加载：
- [ ] 大型或动态列表使用 `ListView.builder`/`GridView.builder` 而非 `ListView(children: [...])`（小型静态列表可以使用具体构造函数）
- [ ] 大数据集实现分页
- [ ] Web 构建中使用延迟加载（`deferred as`）处理重型库

### 其他：
- [ ] 动画中避免使用 `Opacity` Widget——使用 `AnimatedOpacity` 或 `FadeTransition`
- [ ] 动画中避免裁剪——预裁剪图像
- [ ] 不在 Widget 上重写 `operator ==`——使用 `const` 构造函数代替
- [ ] 谨慎使用内在尺寸 Widget（`IntrinsicHeight`、`IntrinsicWidth`）（额外布局传递）

---

## 6. 测试

### 测试类型和期望：
- [ ] **单元测试**：覆盖所有业务逻辑（状态管理器、仓储、工具函数）
- [ ] **Widget 测试**：覆盖单个 Widget 行为、交互和视觉输出
- [ ] **集成测试**：覆盖关键用户流程端到端
- [ ] **黄金测试**：设计关键 UI 组件的像素完美比较

### 覆盖率目标：
- [ ] 业务逻辑争取 80%+ 行覆盖率
- [ ] 所有状态转换都有对应测试（加载 → 成功、加载 → 错误、重试等）
- [ ] 测试边界情况：空状态、错误状态、加载状态、边界值

### 测试隔离：
- [ ] 外部依赖（API 客户端、数据库、服务）被 mock 或 fake
- [ ] 每个测试文件只测试一个类/单元
- [ ] 测试验证行为，而非实现细节
- [ ] Stubs 仅定义每个测试所需的行为（最小化 stubbing）
- [ ] 测试用例之间无共享可变状态

### Widget 测试质量：
- [ ] 正确使用 `pumpWidget` 和 `pump` 处理异步操作
- [ ] 适当使用 `find.byType`、`find.text`、`find.byKey`
- [ ] 无依赖于时序的不稳定测试——使用 `pumpAndSettle` 或显式 `pump(Duration)`
- [ ] 测试在 CI 中运行，失败阻止合并

---

## 7. 无障碍

### 语义 Widget：
- [ ] 在自动标签不足的地方使用 `Semantics` Widget 提供屏幕阅读器标签
- [ ] 对纯装饰性元素使用 `ExcludeSemantics`
- [ ] 使用 `MergeSemantics` 将相关 Widget 组合为单个可访问元素
- [ ] 图像设置 `semanticLabel` 属性

### 屏幕阅读器支持：
- [ ] 所有交互元素可聚焦并有有意义的描述
- [ ] 焦点顺序逻辑（遵循视觉阅读顺序）

### 视觉无障碍：
- [ ] 文本与背景对比度 >= 4.5:1
- [ ] 可点击目标至少 48x48 像素
- [ ] 颜色不是唯一的状态指示器（配合图标/文本使用）
- [ ] 文本随系统字体大小设置缩放

### 交互无障碍：
- [ ] 无空操作 `onPressed` 回调——每个按钮都有作用或被禁用
- [ ] 错误字段建议更正
- [ ] 用户输入数据时上下文不意外变更

---

## 8. 平台特定问题

### iOS/Android 差异：
- [ ] 适当使用平台自适应 Widget
- [ ] 正确处理返回导航（Android 返回按钮、iOS 滑动返回）
- [ ] 通过 `SafeArea` Widget 处理状态栏和安全区域
- [ ] 在 `AndroidManifest.xml` 和 `Info.plist` 中声明平台特定权限

### 响应式设计：
- [ ] 使用 `LayoutBuilder` 或 `MediaQuery` 实现响应式布局
- [ ] 一致定义断点（手机、平板、桌面）
- [ ] 小屏幕上文本不溢出——使用 `Flexible`、`Expanded`、`FittedBox`
- [ ] 测试或明确锁定横屏方向
- [ ] Web 特定：支持鼠标/键盘交互，存在悬停状态

---

## 9. 安全

### 安全存储：
- [ ] 敏感数据（令牌、凭证）使用平台安全存储（iOS Keychain、Android EncryptedSharedPreferences）
- [ ] 绝不将密钥以明文存储
- [ ] 考虑对敏感操作使用生物认证门控

### API 密钥处理：
- [ ] API 密钥不硬编码在 Dart 源码中——使用 `--dart-define`、`.env` 文件（排除在 VCS 外）或编译时配置
- [ ] 密钥不提交到 git——检查 `.gitignore`
- [ ] 真正密钥使用后端代理（客户端不应持有服务器密钥）

### 输入验证：
- [ ] 所有用户输入在发送到 API 前验证
- [ ] 表单验证使用正确的验证模式
- [ ] 无原始 SQL 或用户输入的字符串插值
- [ ] 导航前验证和清理深度链接 URL

### 网络安全：
- [ ] 所有 API 调用强制使用 HTTPS
- [ ] 高安全应用考虑证书固定
- [ ] 正确刷新和过期认证令牌
- [ ] 无敏感数据被记录或打印

---

## 10. 包/依赖审查

### 评估 pub.dev 包：
- [ ] 检查 **pub points 分数**（争取 130+/160）
- [ ] 检查 **点赞**和**流行度**作为社区信号
- [ ] 验证发布者在 pub.dev 上已**验证**
- [ ] 检查最后发布日期——陈旧包（>1 年）是风险
- [ ] 查看维护者的开放 issues 和响应时间
- [ ] 检查与项目的许可证兼容性
- [ ] 验证平台支持覆盖目标

### 版本约束：
- [ ] 使用脱字符号语法（`^1.2.3`）依赖——允许兼容更新
- [ ] 仅在绝对必要时锁定精确版本
- [ ] 定期运行 `flutter pub outdated` 追踪陈旧依赖
- [ ] 生产 `pubspec.yaml` 中无依赖覆盖——仅用于带注释/issue 链接的临时修复
- [ ] 最小化传递依赖数量——每个依赖都是攻击面

### Monorepo 特定（melos/workspace）：
- [ ] 内部包仅从公共 API 导入——无 `package:other/src/internal.dart`（破坏 Dart 包封装）
- [ ] 内部包依赖使用 workspace resolution，而非硬编码 `path: ../../` 相对字符串
- [ ] 所有子包共享或继承根 `analysis_options.yaml`

---

## 11. 导航和路由

### 通用原则（适用于任何路由方案）：
- [ ] 一致使用一种路由方案——不混用命令式 `Navigator.push` 和声明式路由
- [ ] 路由参数类型化——无 `Map<String, dynamic>` 或 `Object?` 转换
- [ ] 路由路径定义为常量、枚举或生成——代码中无散布的魔法字符串
- [ ] 认证守卫/重定向集中化——不在各个屏幕重复
- [ ] Android 和 iOS 都配置深度链接
- [ ] 导航前验证和清理深度链接 URL
- [ ] 导航状态可测试——路由变更可在测试中验证
- [ ] 所有平台上的返回行为正确

---

## 12. 错误处理

### 框架错误处理：
- [ ] 覆盖 `FlutterError.onError` 以捕获框架错误（构建、布局、绘制）
- [ ] 设置 `PlatformDispatcher.instance.onError` 以处理 Flutter 未捕获的异步错误
- [ ] 自定义 `ErrorWidget.builder` 用于发布模式（用户友好而非红屏）
- [ ] `runApp` 周围使用全局错误捕获包装（如 `runZonedGuarded`、Sentry/Crashlytics 包装）

### 错误报告：
- [ ] 集成错误报告服务（Firebase Crashlytics、Sentry 或等效服务）
- [ ] 报告非致命错误及堆栈跟踪
- [ ] 将状态管理错误观察器连接到错误报告（如 BlocObserver、ProviderObserver 或等效方案）
- [ ] 错误报告中附加用户可识别信息（用户 ID）以便调试

### 优雅降级：
- [ ] API 错误产生用户友好的错误 UI，而非崩溃
- [ ] 瞬态网络失败的重试机制
- [ ] 优雅处理离线状态
- [ ] 状态管理中的错误状态携带显示用错误信息
- [ ] 原始异常（网络、解析）在到达 UI 前映射为用户友好、本地化的消息——绝不向用户显示原始异常字符串

---

## 13. 国际化（l10n）

### 设置：
- [ ] 配置本地化方案（Flutter 内置 ARB/l10n、easy_localization 或等效）
- [ ] 在应用配置中声明支持的区域设置

### 内容：
- [ ] 所有用户可见字符串使用本地化系统——Widget 中无硬编码字符串
- [ ] 模板文件包含翻译者的描述/上下文
- [ ] 使用 ICU 消息语法处理复数、性别、选择
- [ ] 占位符定义类型
- [ ] 所有区域设置无缺失键

### 代码审查：
- [ ] 在整个项目中一致使用本地化访问器
- [ ] 日期、时间、数字和货币格式化尊重区域设置
- [ ] 如目标阿拉伯语、希伯来语等，支持文本方向（RTL）
- [ ] 本地化文本无字符串拼接——使用参数化消息

---

## 14. 依赖注入

### 原则（适用于任何 DI 方案）：
- [ ] 类依赖抽象（接口），而非层级边界处的具体实现
- [ ] 依赖通过构造函数、DI 框架或 provider 图从外部提供——不在内部创建
- [ ] 注册区分生命周期：单例 vs 工厂 vs 延迟单例
- [ ] 环境特定绑定（dev/staging/prod）使用配置，而非运行时 `if` 检查
- [ ] DI 图中无循环依赖
- [ ] 服务定位器调用（如果使用）不散布在业务逻辑中

---

## 15. 静态分析

### 配置：
- [ ] `analysis_options.yaml` 存在并启用了严格设置
- [ ] 严格分析器设置：`strict-casts: true`、`strict-inference: true`、`strict-raw-types: true`
- [ ] 包含全面的 lint 规则集（very_good_analysis、flutter_lints 或自定义严格规则）
- [ ] Monorepo 中的所有子包继承或共享根分析选项

### 执行：
- [ ] 提交代码中无不解决的分析器警告
- [ ] Lint 抑制（`// ignore:`）有注释说明原因
- [ ] `flutter analyze` 在 CI 中运行，失败阻止合并

### 无论使用哪个 lint 包都要验证的关键规则：
- [ ] `prefer_const_constructors` — Widget 树性能
- [ ] `avoid_print` — 使用正确的日志记录
- [ ] `unawaited_futures` — 防止 fire-and-forget 异步 bug
- [ ] `prefer_final_locals` — 变量级别的不可变性
- [ ] `always_declare_return_types` — 显式契约
- [ ] `avoid_catches_without_on_clauses` — 特定错误处理
- [ ] `always_use_package_imports` — 一致的导入风格

---

## 状态管理快速参考

下表将通用原则映射到流行方案中的实现。使用此表将审查规则适配到项目所使用的方案。

| 原则 | BLoC/Cubit | Riverpod | Provider | GetX | MobX | Signals | 内置 |
|------|-----------|----------|----------|------|------|---------|------|
| 状态容器 | `Bloc`/`Cubit` | `Notifier`/`AsyncNotifier` | `ChangeNotifier` | `GetxController` | `Store` | `signal()` | `StatefulWidget` |
| UI 消费者 | `BlocBuilder` | `ConsumerWidget` | `Consumer` | `Obx`/`GetBuilder` | `Observer` | `Watch` | `setState` |
| 选择器 | `BlocSelector`/`buildWhen` | `ref.watch(p.select(...))` | `Selector` | N/A | computed | `computed()` | N/A |
| 副作用 | `BlocListener` | `ref.listen` | `Consumer` 回调 | `ever()`/`once()` | `reaction` | `effect()` | 回调 |
| 清理 | 通过 `BlocProvider` 自动 | `.autoDispose` | 通过 `Provider` 自动 | `onClose()` | `ReactionDisposer` | 手动 | `dispose()` |
| 测试 | `blocTest()` | `ProviderContainer` | 直接使用 `ChangeNotifier` | 测试中 `Get.put` | 直接使用 store | 直接使用 signal | Widget 测试 |

---

## 参考资料

- [Effective Dart: Style](https://dart.dev/effective-dart/style)
- [Effective Dart: Usage](https://dart.dev/effective-dart/usage)
- [Effective Dart: Design](https://dart.dev/effective-dart/design)
- [Flutter Performance Best Practices](https://docs.flutter.dev/perf/best-practices)
- [Flutter Testing Overview](https://docs.flutter.dev/testing/overview)
- [Flutter Accessibility](https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility)
- [Flutter Internationalization](https://docs.flutter.dev/ui/accessibility-and-internationalization/internationalization)
- [Flutter Navigation and Routing](https://docs.flutter.dev/ui/navigation)
- [Flutter Error Handling](https://docs.flutter.dev/testing/errors)
- [Flutter State Management Options](https://docs.flutter.dev/data-and-backend/state-mgmt/options)
