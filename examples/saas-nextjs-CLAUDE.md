# SaaS 应用 — 项目 CLAUDE.md

> Next.js + Supabase + Stripe SaaS 应用的真实示例。
> 复制到项目根目录并为你的技术栈定制。

## 项目概述

**技术栈：** Next.js 15 (App Router)、TypeScript、Supabase（auth + DB）、Stripe（计费）、Tailwind CSS、Playwright（E2E）

**架构：** 默认使用 Server Components。Client Components 仅用于交互。API routes 用于 webhooks，server actions 用于变更。

## 关键规则

### 数据库

- 所有查询使用启用了 RLS 的 Supabase 客户端——绝不绕过 RLS
- 迁移在 `supabase/migrations/` 中——绝不直接修改数据库
- 使用 `select()` 配合显式列列表，而非 `select('*')`
- 所有面向用户的查询必须包含 `.limit()` 以防止无界结果

### 认证

- 在 Server Components 中使用 `createServerClient()` 来自 `@supabase/ssr`
- 在 Client Components 中使用 `createBrowserClient()` 来自 `@supabase/ssr`
- 保护路由检查 `getUser()`——绝不单独信任 `getSession()` 进行认证
- 中间件在 `middleware.ts` 中在每个请求上刷新 auth token

### 计费

- Stripe webhook handler 在 `app/api/webhooks/stripe/route.ts`
- 绝不信任客户端价格数据——始终在服务端从 Stripe 获取
- 通过 `subscription_status` 列检查订阅状态，由 webhook 同步
- 免费套餐用户：3 个项目，每天 100 次 API 调用

### 代码风格

- 代码或注释中不用 emoji
- 仅使用不可变模式——spread 操作符，绝不修改
- Server Components：无 `'use client'` 指令，无 `useState`/`useEffect`
- Client Components：`'use client'` 在顶部，尽量少——将逻辑提取到 hooks
- 所有输入验证偏好 Zod schemas（API routes、表单、环境变量）

## 文件结构

```
src/
  app/
    (auth)/          # 认证页面（登录、注册、忘记密码）
    (dashboard)/     # 受保护的仪表板页面
    api/
      webhooks/      # Stripe、Supabase webhooks
    layout.tsx       # 带 providers 的根布局
  components/
    ui/              # Shadcn/ui 组件
    forms/           # 带验证的表单组件
    dashboard/       # 仪表板特定组件
  hooks/             # 自定义 React hooks
  lib/
    supabase/        # Supabase 客户端工厂
    stripe/          # Stripe 客户端和辅助函数
    utils.ts         # 通用工具
  types/             # 共享 TypeScript 类型
supabase/
  migrations/        # 数据库迁移
  seed.sql           # 开发种子数据
```

## 关键模式

### API 响应格式

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

### Server Action 模式

```typescript
'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  name: z.string().min(1).max(100),
})

export async function createProject(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name: parsed.data.name, user_id: user.id })
    .select('id, name, created_at')
    .single()

  if (error) return { success: false, error: 'Failed to create project' }
  return { success: true, data }
}
```

## 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # 仅服务端，绝不暴露给客户端

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 测试策略

```bash
/tdd                    # 新功能的单元 + 集成测试
/e2e                    # 认证流程、计费、仪表板的 Playwright 测试
/test-coverage          # 验证 80%+ 覆盖率
```

### 关键 E2E 流程

1. 注册 → 邮箱验证 → 第一个项目创建
2. 登录 → 仪表板 → CRUD 操作
3. 升级套餐 → Stripe checkout → 订阅激活
4. Webhook：订阅取消 → 降级到免费套餐

## ECC 工作流

```bash
# 规划功能
/plan "Add team invitations with email notifications"

# 使用 TDD 开发
/tdd

# 提交前
/code-review
/security-scan

# 发布前
/e2e
/test-coverage
```

## Git 工作流

- `feat:` 新功能，`fix:` bug 修复，`refactor:` 代码更改
- 从 `main` 创建功能分支，需要 PR
- CI 运行：lint、类型检查、单元测试、E2E 测试
- 部署：PR 上 Vercel 预览，合并到 `main` 时生产部署
