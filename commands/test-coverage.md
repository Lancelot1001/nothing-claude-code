# 测试覆盖率

分析测试覆盖率，识别差距，并生成缺失测试以达到 80%+ 覆盖率。

## 步骤 1：检测测试框架

| 指标 | 覆盖率命令 |
|-----------|-----------------|
| `jest.config.*` 或 `package.json` jest | `npx jest --coverage --coverageReporters=json-summary` |
| `vitest.config.*` | `npx vitest run --coverage` |
| `pytest.ini` / `pyproject.toml` pytest | `pytest --cov=src --cov-report=json` |
| `Cargo.toml` | `cargo llvm-cov --json` |
| `pom.xml` 带 JaCoCo | `mvn test jacoco:report` |
| `go.mod` | `go test -coverprofile=coverage.out ./...` |

## 步骤 2：分析覆盖率报告

1. 运行覆盖率命令
2. 解析输出（JSON 摘要或终端输出）
3. 列出**低于 80% 覆盖率**的文件，按最差优先排序
4. 对于每个覆盖不足的文件，识别：
   - 未测试的函数或方法
   - 缺失的分支覆盖率（if/else、switch、错误路径）
   - 膨胀分母的死代码

## 步骤 3：生成缺失测试

对于每个覆盖不足的文件，按此优先级生成测试：

1. **快乐路径** — 有效输入的核心功能
2. **错误处理** — 无效输入、缺失数据、网络失败
3. **边缘情况** — 空数组、null/undefined、边界值（0、-1、MAX_INT）
4. **分支覆盖率** — 每个 if/else、switch case、三元运算

### 测试生成规则

- 将测试放置在源文件旁边：`foo.ts` → `foo.test.ts`（或项目约定）
- 使用项目现有测试模式（导入风格、断言库、mock 方法）
- Mock 外部依赖（数据库、API、文件系统）
- 每个测试应该独立 — 测试之间无共享可变状态
- 描述性命名测试：`test_create_user_with_duplicate_email_returns_409`

## 步骤 4：验证

1. 运行完整测试套件 — 所有测试必须通过
2. 重新运行覆盖率 — 验证改进
3. 如果仍低于 80%，重复步骤 3 填补剩余差距

## 步骤 5：报告

显示前后对比：

```
覆盖率报告
──────────────────────────────
文件                   之前  之后
src/services/auth.ts   45%     88%
src/utils/validation.ts 32%    82%
──────────────────────────────
总体：               67%     84%  通过：
```

## 重点领域

- 具有复杂分支的函数（高圈复杂度）
- 错误处理程序和 catch 块
- 跨代码库使用的工具函数
- API 端点处理程序（请求 → 响应流程）
- 边缘情况：null、undefined、空字符串、空数组、零、负数
