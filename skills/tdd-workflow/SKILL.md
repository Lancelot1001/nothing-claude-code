---
name: tdd-workflow
description: 在编写新功能、修复错误或重构代码时使用此skill。强制执行测试驱动开发，覆盖率 80%+，包括单元、集成和 E2E 测试。
origin: nothing-claude-code
---

# 测试驱动开发workflow

此skill确保所有代码开发遵循 TDD 原则并具有全面的测试覆盖率。

## 何时激活

- 编写新功能或功能
- 修复错误或问题
- 重构现有代码
- 添加 API 端点
- 创建新组件

## 核心原则

### 1. 测试先于代码
始终先写测试，然后实现代码使测试通过。

### 2. 覆盖率要求
- 最低 80% 覆盖率（单元 + 集成 + E2E）
- 所有边缘情况都已覆盖
- 已测试错误场景
- 已验证边界条件

### 3. 测试类型

#### 单元测试
- 单独函数和工具函数
- 组件逻辑
- 纯函数
- 辅助函数和工具函数

#### 集成测试
- API 端点
- 数据库操作
- 服务交互
- 外部 API 调用

#### E2E 测试（Playwright）
- 关键用户流程
- 完整workflow
- 浏览器自动化
- UI 交互

### 4. Git 检查点
- 如果仓库在 Git 下，在每个 TDD 阶段后创建检查点提交
- 在workflow完成前不要压缩或重写这些检查点提交
- 每个检查点提交消息必须描述阶段和捕获的确切证据
- 仅计算当前活动分支上为当前任务创建的提交
- 不要将来自其他分支、早期不相关工作或遥远分支历史的提交视为有效的检查点证据
- 在将检查点视为满足之前，验证该提交可从活动分支的当前 `HEAD` 到达，并且属于当前任务序列
- 首选的紧凑workflow是：
  - 一个提交用于添加失败测试并验证 RED
  - 一个提交用于应用最小修复并验证 GREEN
  - 一个可选提交用于完成重构
- 如果测试提交明确对应 RED 且修复提交明确对应 GREEN，则不需要单独的仅证据提交

## TDD workflow步骤

### 步骤 1：编写用户旅程
```
作为 [角色]，我想要 [操作]，以便 [收益]

示例：
作为用户，我想要语义搜索市场，
以便即使没有精确关键词也能找到相关市场。
```

### 步骤 2：生成测试用例
为每个用户旅程创建全面的测试用例：

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // Test implementation
  })

  it('handles empty query gracefully', async () => {
    // Test edge case
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // Test fallback behavior
  })

  it('sorts results by similarity score', async () => {
    // Test sorting logic
  })
})
```

### 步骤 3：运行测试（应该失败）
```bash
npm test
# Tests should fail - we haven't implemented yet
```

此步骤是强制性的，是所有生产变更的 RED 门槛。

在修改业务逻辑或其他生产代码之前，您必须通过以下途径之一验证有效的 RED 状态：
- 运行时 RED：
  - 相关测试目标编译成功
  - 新或更改的测试实际被执行
  - 结果为 RED
- 编译时 RED：
  - 新测试新实例化、引用或执行有 bug 的代码路径
  - 编译失败本身就是预期的 RED 信号
- 在任一情况下，失败是由预期的业务逻辑 bug、未定义行为或缺失实现引起的
- 失败不是仅由无关的语法错误、破坏的测试设置、缺失依赖或无关回归引起的

仅编写但未编译和执行的测试不算 RED。

在确认 RED 状态之前，不要编辑生产代码。

如果仓库在 Git 下，在此阶段验证后立即创建检查点提交。
推荐的提交消息格式：
- `test: add reproducer for <feature or bug>`
- 如果复现器被编译和执行并因预期原因失败，此提交也可以作为 RED 验证检查点
- 在继续之前验证此检查点提交在当前活动分支上

### 步骤 4：实现代码
编写最少的代码使测试通过：

```typescript
// Implementation guided by tests
export async function searchMarkets(query: string) {
  // Implementation here
}
```

如果仓库在 Git 下，现在暂存最小修复，但将检查点提交推迟到步骤 5 中验证 GREEN 之后。

### 步骤 5：再次运行测试
```bash
npm test
# Tests should now pass
```

修复后重新运行相同的相关测试目标，并确认之前失败的测试现在是 GREEN。

只有在获得有效的 GREEN 结果后才能进行重构。

如果仓库在 Git 下，在 GREEN 验证后立即创建检查点提交。
推荐的提交消息格式：
- `fix: <feature or bug>`
- 如果重新运行并通过了相同的相关测试目标，修复提交也可以作为 GREEN 验证检查点
- 在继续之前验证此检查点提交在当前活动分支上

### 步骤 6：重构
在保持测试通过的同时提高代码质量：
- 消除重复
- 改进命名
- 优化性能
- 增强可读性

如果仓库在 Git 下，在重构完成且测试保持绿色后立即创建检查点提交。
推荐的提交消息格式：
- `refactor: clean up after <feature or bug> implementation`
- 在认为 TDD 循环完成之前，验证此检查点提交在当前活动分支上

### 步骤 7：验证覆盖率
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## 测试模式

### 单元测试模式（Jest/Vitest）
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API 集成测试模式
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    // Mock database failure
    const request = new NextRequest('http://localhost/api/markets')
    // Test error handling
  })
})
```

### E2E 测试模式（Playwright）
```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  // Navigate to markets page
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // Verify page loaded
  await expect(page.locator('h1')).toContainText('Markets')

  // Search for markets
  await page.fill('input[placeholder="Search markets"]', 'election')

  // Wait for debounce and results
  await page.waitForTimeout(600)

  // Verify search results displayed
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // Verify results contain search term
  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  // Filter by status
  await page.click('button:has-text("Active")')

  // Verify filtered results
  await expect(results).toHaveCount(3)
})

test('user can create a new market', async ({ page }) => {
  // Login first
  await page.goto('/creator-dashboard')

  // Fill market creation form
  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  // Submit form
  await page.click('button[type="submit"]')

  // Verify success message
  await expect(page.locator('text=Market created successfully')).toBeVisible()

  // Verify redirect to market page
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## 测试文件组织

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # 单元测试
│   │   └── Button.stories.tsx       # Storybook
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # 集成测试
└── e2e/
    ├── markets.spec.ts               # E2E 测试
    ├── trading.spec.ts
    └── auth.spec.ts
```

## Mock 外部服务

### Supabase Mock
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis Mock
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

### OpenAI Mock
```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // Mock 1536-dim embedding
  ))
}))
```

## 测试覆盖率验证

### 运行覆盖率报告
```bash
npm run test:coverage
```

### 覆盖率阈值
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 应避免的常见测试错误

### 错误：测试实现细节
```typescript
// 不要测试内部状态
expect(component.state.count).toBe(5)
```

### 正确：测试用户可见行为
```typescript
// 测试用户看到的内容
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### 错误：脆弱的选择器
```typescript
// 容易断裂
await page.click('.css-class-xyz')
```

### 正确：语义选择器
```typescript
// 抵抗变化
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### 错误：无测试隔离
```typescript
// 测试相互依赖
test('creates user', () => { /* ... */ })
test('updates same user', () => { /* depends on previous test */ })
```

### 正确：独立测试
```typescript
// 每个测试设置自己的数据
test('creates user', () => {
  const user = createTestUser()
  // Test logic
})

test('updates user', () => {
  const user = createTestUser()
  // Update logic
})
```

## 持续测试

### 开发期间的监视模式
```bash
npm test -- --watch
# Tests run automatically on file changes
```

### 预提交钩子
```bash
# Runs before every commit
npm test && npm run lint
```

### CI/CD 集成
```yaml
# GitHub Actions
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 最佳实践

1. **先写测试** - 始终 TDD
2. **每个测试一个断言** - 专注于单一行为
3. **描述性测试名称** - 解释测试内容
4. **准备-执行-断言** - 清晰的测试结构
5. **Mock 外部依赖** - 隔离单元测试
6. **测试边缘情况** - 空、未定义、极大
7. **测试错误路径** - 不仅测试愉快路径
8. **保持测试快速** - 单元测试每个 < 50ms
9. **测试后清理** - 无副作用
10. **审查覆盖率报告** - 识别缺口

## 成功指标

- 实现 80%+ 代码覆盖率
- 所有测试通过（绿色）
- 无跳过或禁用的测试
- 测试执行快速（单元测试 < 30 秒）
- E2E 测试覆盖关键用户流程
- 测试在生产前捕获错误

---

**记住**：测试不是可选项。它们是使有信心重构、快速开发和生产可靠性成为可能的安全网。
