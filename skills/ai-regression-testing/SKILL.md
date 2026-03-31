---
name: ai-regression-testing
description: AI 辅助开发的回归测试策略。无需数据库依赖的沙箱模式 API 测试、自动化的 bug 检查workflow，以及捕捉 AI 盲点的模式——同一个模型编写和审查代码时会产生的盲点
origin: something-claude-code
---

# AI 回归测试

专为 AI 辅助开发设计的测试模式，同一个模型编写代码并审查它——造成只有自动化测试才能捕捉的系统性盲点。

## 何时激活

- AI 智能体（Claude Code、Cursor、Codex）修改了 API 路由或后端逻辑
- 发现了 bug 并修复——需要防止再次引入
- 项目有可利用的沙箱/模拟模式进行无数据库测试
- 在代码更改后运行 `/bug-check` 或类似的审查命令
- 存在多条代码路径（沙箱 vs 生产环境、功能开关等）

## 核心问题

当 AI 编写代码然后审查自己的工作时，它将相同的假设带入两个步骤。这造成了一种可预测的失败模式：

```
AI 编写修复 → AI 审查修复 → AI 说"看起来正确" → Bug 仍然存在
```

**真实案例**（在生产环境中观察到）：

```
修复 1：在 API 响应中添加了 notification_settings
  → 忘记添加到 SELECT 查询中
  → AI 审查并错过了（相同的盲点）

修复 2：添加到 SELECT 查询中
  → TypeScript 构建错误（列不在生成的类型中）
  → AI 审查了修复 1 但没有发现 SELECT 问题

修复 3：改为 SELECT *
  → 修复了生产路径，忘记了沙箱路径
  → AI 审查并再次错过（第四次发生）

修复 4：测试在第一次运行时立即捕获
通过：
```

该模式：**沙箱/生产路径不一致** 是 AI 引入的头号回归。

## 沙箱模式 API 测试

大多数 AI 友好架构的项目都有沙箱/模拟模式。这是快速、无数据库 API 测试的关键。

### 设置（Vitest + Next.js App Router）

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

```typescript
// __tests__/setup.ts
// Force sandbox mode — no database needed
process.env.SANDBOX_MODE = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
```

### Next.js API 路由的测试辅助函数

```typescript
// __tests__/helpers.ts
import { NextRequest } from "next/server";

export function createTestRequest(
  url: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    sandboxUserId?: string;
  },
): NextRequest {
  const { method = "GET", body, headers = {}, sandboxUserId } = options || {};
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;
  const reqHeaders: Record<string, string> = { ...headers };

  if (sandboxUserId) {
    reqHeaders["x-sandbox-user-id"] = sandboxUserId;
  }

  const init: { method: string; headers: Record<string, string>; body?: string } = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    init.body = JSON.stringify(body);
    reqHeaders["content-type"] = "application/json";
  }

  return new NextRequest(fullUrl, init);
}

export async function parseResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, json };
}
```

### 编写回归测试

关键原则：**为发现的 bug 编写测试，而非为正常工作的代码编写测试**。

```typescript
// __tests__/api/user/profile.test.ts
import { describe, it, expect } from "vitest";
import { createTestRequest, parseResponse } from "../../helpers";
import { GET, PATCH } from "@/app/api/user/profile/route";

// Define the contract — what fields MUST be in the response
const REQUIRED_FIELDS = [
  "id",
  "email",
  "full_name",
  "phone",
  "role",
  "created_at",
  "avatar_url",
  "notification_settings",  // ← Added after bug found it missing
];

describe("GET /api/user/profile", () => {
  it("returns all required fields", async () => {
    const req = createTestRequest("/api/user/profile");
    const res = await GET(req);
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    for (const field of REQUIRED_FIELDS) {
      expect(json.data).toHaveProperty(field);
    }
  });

  // Regression test — this exact bug was introduced by AI 4 times
  it("notification_settings is not undefined (BUG-R1 regression)", async () => {
    const req = createTestRequest("/api/user/profile");
    const res = await GET(req);
    const { json } = await parseResponse(res);

    expect("notification_settings" in json.data).toBe(true);
    const ns = json.data.notification_settings;
    expect(ns === null || typeof ns === "object").toBe(true);
  });
});
```

### 测试沙箱/生产 parity

最常见的 AI 回归：修复生产路径但忘记沙箱路径（反之亦然）。

```typescript
// Test that sandbox responses match the expected contract
describe("GET /api/user/messages (conversation list)", () => {
  it("includes partner_name in sandbox mode", async () => {
    const req = createTestRequest("/api/user/messages", {
      sandboxUserId: "user-001",
    });
    const res = await GET(req);
    const { json } = await parseResponse(res);

    // This caught a bug where partner_name was added
    // to production path but not sandbox path
    if (json.data.length > 0) {
      for (const conv of json.data) {
        expect("partner_name" in conv).toBe(true);
      }
    }
  });
});
```

## 将测试集成到 Bug 检查workflow

### 自定义命令定义

```markdown
<!-- .claude/commands/bug-check.md -->
# Bug Check

## Step 1: Automated Tests (mandatory, cannot skip)

Run these commands FIRST before any code review:

    npm run test       # Vitest test suite
    npm run build      # TypeScript type check + build

- If tests fail → report as highest priority bug
- If build fails → report type errors as highest priority
- Only proceed to Step 2 if both pass

## Step 2: Code Review (AI review)

1. Sandbox / production path consistency
2. API response shape matches frontend expectations
3. SELECT clause completeness
4. Error handling with rollback
5. Optimistic update race conditions

## Step 3: For each bug fixed, propose a regression test
```

### The Workflow

```
User: "バグチェックして" (or "/bug-check")
  │
  ├─ Step 1: npm run test
  │   ├─ FAIL → Bug found mechanically (no AI judgment needed)
  │   └─ PASS → Continue
  │
  ├─ Step 2: npm run build
  │   ├─ FAIL → Type error found mechanically
  │   └─ PASS → Continue
  │
  ├─ Step 3: AI code review (with known blind spots in mind)
  │   └─ Findings reported
  │
  └─ Step 4: For each fix, write a regression test
      └─ Next bug-check catches if fix breaks
```

## 常见的 AI 回归模式

### 模式 1：沙箱/生产路径不匹配

**频率**：最常见（在 4 次回归中观察到 3 次）

```typescript
// FAIL: AI adds field to production path only
if (isSandboxMode()) {
  return { data: { id, email, name } };  // Missing new field
}
// Production path
return { data: { id, email, name, notification_settings } };

// PASS: Both paths must return the same shape
if (isSandboxMode()) {
  return { data: { id, email, name, notification_settings: null } };
}
return { data: { id, email, name, notification_settings } };
```

**捕获它的测试**：

```typescript
it("sandbox and production return same fields", async () => {
  // In test env, sandbox mode is forced ON
  const res = await GET(createTestRequest("/api/user/profile"));
  const { json } = await parseResponse(res);

  for (const field of REQUIRED_FIELDS) {
    expect(json.data).toHaveProperty(field);
  }
});
```

### 模式 2：SELECT 子句遗漏

**频率**：在使用 Supabase/Prisma 添加新列时常见

```typescript
// FAIL: New column added to response but not to SELECT
const { data } = await supabase
  .from("users")
  .select("id, email, name")  // notification_settings not here
  .single();

return { data: { ...data, notification_settings: data.notification_settings } };
// → notification_settings is always undefined

// PASS: Use SELECT * or explicitly include new columns
const { data } = await supabase
  .from("users")
  .select("*")
  .single();
```

### 模式 3：错误状态泄漏

**频率**：中等——在为现有组件添加错误处理时

```typescript
// FAIL: Error state set but old data not cleared
catch (err) {
  setError("Failed to load");
  // reservations still shows data from previous tab!
}

// PASS: Clear related state on error
catch (err) {
  setReservations([]);  // Clear stale data
  setError("Failed to load");
}
```

### 模式 4：没有适当回滚的乐观更新

```typescript
// FAIL: No rollback on failure
const handleRemove = async (id: string) => {
  setItems(prev => prev.filter(i => i.id !== id));
  await fetch(`/api/items/${id}`, { method: "DELETE" });
  // If API fails, item is gone from UI but still in DB
};

// PASS: Capture previous state and rollback on failure
const handleRemove = async (id: string) => {
  const prevItems = [...items];
  setItems(prev => prev.filter(i => i.id !== id));
  try {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("API error");
  } catch {
    setItems(prevItems);  // Rollback
    alert("削除に失敗しました");
  }
};
```

## 策略：在发现 bug 的地方测试

不要追求 100% 覆盖率。相反：

```
在 /api/user/profile 发现 bug     → 为 profile API 编写测试
在 /api/user/messages 发现 bug   → 为 messages API 编写测试
在 /api/user/favorites 发现 bug  → 为 favorites API 编写测试
在 /api/user/notifications 没有 bug → 暂时不编写测试（尚未）
```

**为什么这对 AI 开发有效：**

1. AI 倾向于重复犯**相同类别的错误**
2. Bug 聚集在复杂区域（认证、多路径逻辑、状态管理）
3. 一旦测试，该回归**就不能再次发生**
4. 测试数量随 bug 修复有机增长——没有浪费的工作

## 快速参考

| AI 回归模式 | 测试策略 | 优先级 |
|---|---|---|
| 沙箱/生产不匹配 | 在沙箱模式下断言相同响应结构 | 高 |
| SELECT 子句遗漏 | 断言响应中所有必需字段 | 高 |
| 错误状态泄漏 | 断言错误时的状态清理 | 中 |
| 缺少回滚 | 断言 API 失败时状态恢复 | 中 |
| 类型转换掩盖 null | 断言字段不是 undefined | 中 |

## 做/不做

**做：**
- 在发现 bug 后立即编写测试（如果可能，在修复之前）
- 测试 API 响应结构，而非实现
- 将测试作为每个 bug 检查的第一步运行
- 保持测试快速（沙箱模式下总共 < 1 秒）
- 用它们防止的 bug 命名测试（例如"BUG-R1 回归"）

**不做：**
- 为从未有过 bug 的代码编写测试
- 信任 AI 自我审查作为自动化测试的替代
- 因为"只是模拟数据"而跳过沙箱路径测试
- 当单元测试足够时编写集成测试
- 追求覆盖率百分比——追求回归预防
