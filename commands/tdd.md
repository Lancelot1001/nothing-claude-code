---
description: 强制测试驱动开发workflow。先搭建接口，生成测试，然后实现最小代码通过。确保 80%+ 覆盖率。
---

# TDD 命令

此命令调用 **tdd-guide** agent来强制测试驱动开发方法论。

## 此命令做什么

1. **搭建接口** — 先定义类型/接口
2. **先写测试** — 写失败测试（RED）
3. **实现最小代码** — 写刚好够通过的代码（GREEN）
4. **重构** — 在保持测试绿色时改进代码（REFACTOR）
5. **验证覆盖率** — 确保 80%+ 测试覆盖率

## 何时使用

使用 `/tdd` 当：
- 实现新功能
- 添加新函数/组件
- 修复 Bug（先写测试复现 Bug）
- 重构现有代码
- 构建关键业务逻辑

## 工作原理

tdd-guide agent将：

1. **定义接口** 用于输入/输出
2. **写会失败的测试**（因为代码尚不存在）
3. **运行测试** 并验证它们因正确原因失败
4. **写最小实现** 使测试通过
5. **运行测试** 并验证它们通过
6. **重构** 代码同时保持测试绿色
7. **检查覆盖率** 如低于 80% 则添加更多测试

## TDD 循环

```
RED → GREEN → REFACTOR → REPEAT

RED:      写一个失败测试
GREEN:    写最小代码通过
REFACTOR: 改进代码，保持测试通过
REPEAT:   下一个功能/场景
```

## 使用示例

```
用户: /tdd 我需要一个函数来计算市场流动性分数

agent (tdd-guide):
# TDD 会话：市场流动性分数计算器

## 步骤 1：定义接口（SCAFFOLD）

```typescript
// lib/liquidity.ts
export interface MarketData {
  totalVolume: number
  bidAskSpread: number
  activeTraders: number
  lastTradeTime: Date
}

export function calculateLiquidityScore(market: MarketData): number {
  // TODO: 实现
  throw new Error('未实现')
}
```

## 步骤 2：写失败测试（RED）

```typescript
// lib/liquidity.test.ts
import { calculateLiquidityScore } from './liquidity'

describe('calculateLiquidityScore', () => {
  it('应该为流动性高的市场返回高分', () => {
    const market = {
      totalVolume: 100000,
      bidAskSpread: 0.01,
      activeTraders: 500,
      lastTradeTime: new Date()
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBeGreaterThan(80)
    expect(score).toBeLessThanOrEqual(100)
  })

  // ... 更多测试
})
```

## TDD 最佳实践

**做：**
- 通过：先写测试，再写任何实现
- 通过：实现后运行测试并验证它们失败
- 通过：写最小代码使测试通过
- 通过：仅在测试绿色后重构
- 通过：添加边缘情况和错误场景
- 通过：目标 80%+ 覆盖率（关键代码 100%）

**不做：**
- 失败：在测试前写实现
- 失败：每次变更后跳过运行测试
- 失败：一次写太多代码
- 失败：忽略失败的测试
- 失败：测试实现细节（测试行为）
- 失败：Mock 一切（优先集成测试）

## 覆盖率要求

- **所有代码最低 80%**
- **以下必须 100%：**
  - 财务计算
  - 认证逻辑
  - 安全关键代码
  - 核心业务逻辑

## 重要提示

**强制**：测试必须在实现前编写。TDD 循环：

1. **RED** - 写失败测试
2. **GREEN** - 实现通过
3. **REFACTOR** - 改进代码

绝不跳过 RED 阶段。绝不在测试前写代码。

## 与其他命令集成

- 先用 `/plan` 了解要构建什么
- 用 `/tdd` 通过测试实现
- 如有构建错误用 `/build-fix`
- 用 `/code-review` 审查实现
- 用 `/test-coverage` 验证覆盖率

## 相关agent

此命令调用 something-claude-code 提供的 `tdd-guide` agent。

相关 `tdd-workflow` skill也随 something-claude-code 打包。

手动安装时，源文件位于：
- `agents/tdd-guide.md`
- `skills/tdd-workflow/SKILL.md`
