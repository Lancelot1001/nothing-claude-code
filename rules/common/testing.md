# 测试规则

## 核心要求

**最低覆盖率：80%**

所有生产代码必须有 80% 以上的测试覆盖率。

---

## 测试类型

### 1. 单元测试

测试独立的函数、工具、组件。

```typescript
// 测试独立的 utility 函数
describe('formatCurrency', () => {
  it('正确格式化美元', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
  });

  it('处理零值', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('处理负数', () => {
    expect(formatCurrency(-500, 'USD')).toBe('-$500.00');
  });
});
```

### 2. 集成测试

测试 API 端点、数据库操作等。

```typescript
// 测试 API 端点
describe('POST /api/users', () => {
  it('创建新用户', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: '张三', email: 'zhangsan@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('张三');
  });

  it('验证邮箱格式', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: '张三', email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('无效的邮箱格式');
  });
});
```

### 3. E2E 测试

测试关键用户流程。

```typescript
// Playwright E2E 测试
import { test, expect } from '@playwright/test';

test('用户登录流程', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'correct-password');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.user-name')).toContainText('张三');
});
```

---

## TDD workflow

### 红-绿-重构

```
1. RED — 写一个失败测试
2. GREEN — 写最小实现使测试通过
3. REFACTOR — 重构改进代码
4. 重复
```

### 示例

```typescript
// 第一步：RED — 写失败测试
describe('calculateDiscount', () => {
  it('对VIP客户打9折', () => {
    const result = calculateDiscount(100, 'VIP');
    expect(result).toBe(90);
  });

  it('对普通客户不打折', () => {
    const result = calculateDiscount(100, 'NORMAL');
    expect(result).toBe(100);
  });
});

// 实现
function calculateDiscount(price: number, tier: string): number {
  if (tier === 'VIP') {
    return price * 0.9;
  }
  return price;
}

// 重构（可选）
function calculateDiscount(price: number, tier: string): number {
  const discountRates = { VIP: 0.9, GOLD: 0.8, PLATINUM: 0.7 };
  const rate = discountRates[tier] ?? 1;
  return price * rate;
}
```

---

## 测试覆盖率

### 检查覆盖率

```bash
# 运行测试并生成覆盖率报告
npm test -- --coverage

# 查看 HTML 报告
open coverage/lcov-report/index.html
```

### 覆盖率要求

| 类型 | 要求 |
|------|------|
| 语句覆盖率 | 80%+ |
| 分支覆盖率 | 75%+ |
| 函数覆盖率 | 80%+ |
| 行覆盖率 | 80%+ |

### 提高覆盖率

识别缺口：
1. 运行覆盖率报告
2. 找出未覆盖的分支/语句
3. 添加边界情况测试
4. 添加错误处理测试

---

## 测试最佳实践

### 命名

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('创建用户时返回用户对象', () => {});
    it('邮箱格式无效时抛出 ValidationError', () => {});
    it('数据库错误时抛出 DatabaseError', () => {});
  });
});
```

### AAA 模式

```typescript
it('正确计算订单总价', () => {
  // Arrange — 准备
  const items = [
    { name: '商品A', price: 100, quantity: 2 },
    { name: '商品B', price: 50, quantity: 1 },
  ];

  // Act — 执行
  const total = calculateOrderTotal(items);

  // Assert — 断言
  expect(total).toBe(250);
});
```

### 测试隔离

- 每个测试独立运行
- 不依赖测试执行顺序
- 清理测试数据

```typescript
beforeEach(async () => {
  await db.clear(); // 清理
  await seedTestData(); // 填充测试数据
});

afterEach(async () => {
  await db.clear(); // 清理
});
```

### Mock 和 Stub

```typescript
it('发送验证邮件', async () => {
  // Mock 邮件服务
  const mockMailer = { send: jest.fn().mockResolvedValue(true) };

  await userService.createUser('zhangsan@example.com', mockMailer);

  expect(mockMailer.send).toHaveBeenCalledWith(
    'zhangsan@example.com',
    expect.stringContaining('验证')
  );
});
```

---

## 常见问题

### 测试失败排查

1. 检查测试隔离 — 测试间是否相互影响？
2. 验证 Mock — Mock 是否正确？
3. 修复实现 — **不要修改测试**，除非测试本身有错

### 覆盖率不足

1. 添加边界情况测试
2. 添加错误处理分支测试
3. 添加替代路径测试

---

## 持续集成

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test -- --coverage

- name: Check coverage
  run: |
    npx jest-coverage-check \
      --coverageThreshold 80
```
