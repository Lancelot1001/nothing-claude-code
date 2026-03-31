---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 TypeScript/JavaScript 特定内容。

## 类型与接口

使用类型使公共 API、共享模型和组件 props 明确、可读、可复用。

### 公共 API

- 为导出的函数、共享工具和公共类方法添加参数和返回类型
- 让 TypeScript 推断明显的局部变量类型
- 将重复的内联对象形状提取为命名类型或 interface

### interface 与 type 别名

- 使用 `interface` 表示可能扩展或实现的对象形状
- 使用 `type` 表示联合、交叉、tuple、mapped types 和 utility types
- 除非 enum 用于互操作性，否则优先使用字符串字面联合而非 `enum`

### 避免 `any`

- 应用代码中避免 `any`
- 对外部或不可信输入使用 `unknown`，然后安全地收窄
- 当值的类型取决于调用者时使用泛型

### React Props

- 使用命名 `interface` 或 `type` 定义组件 props
- 显式类型化回调 props
- 除非有特定原因，否则不使用 `React.FC`

### JavaScript 文件

- 在 `.js` 和 `.jsx` 文件中，当类型能提高清晰度且 TypeScript 迁移不切实际时使用 JSDoc
- 保持 JSDoc 与运行时行为一致

## 不可变性

使用 spread 操作符进行不可变更新：

```typescript
interface User {
  id: string
  name: string
}

// 错误：Mutation
function updateUser(user: User, name: string): User {
  user.name = name // MUTATION!
  return user
}

// 正确：不可变性
function updateUser(user: Readonly<User>, name: string): User {
  return {
    ...user,
    name
  }
}
```

## 错误处理

使用 async/await 配合 try-catch，安全地收窄未知错误：

```typescript
interface User {
  id: string
  email: string
}

declare function riskyOperation(userId: string): Promise<User>

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}

const logger = {
  error: (message: string, error: unknown) => {
    // 替换为你使用的生产日志库（如 pino 或 winston）
  }
}

async function loadUser(userId: string): Promise<User> {
  try {
    const result = await riskyOperation(userId)
    return result
  } catch (error: unknown) {
    logger.error('Operation failed', error)
    throw new Error(getErrorMessage(error))
  }
}
```

## 输入验证

使用 Zod 进行基于 schema 的验证，并从 schema 推断类型：

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

type UserInput = z.infer<typeof userSchema>

const validated: UserInput = userSchema.parse(input)
```

## Console.log

- 生产代码中不使用 `console.log`
- 使用适当的日志库
- 参见 hooks 进行自动检测
