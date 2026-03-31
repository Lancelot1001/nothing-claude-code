---
inclusion: fileMatch
fileMatchPattern: "*.ts,*.tsx,*.js,*.jsx"
description: TypeScript/JavaScript security best practices extending common security rules with language-specific concerns
---

# TypeScript/JavaScript 安全

> 本文件继承通用安全规则，包含 TypeScript/JavaScript 特定内容。

## Secret Management

```typescript
// 错误：硬编码 secret
const apiKey = "sk-proj-xxxxx"
const dbPassword = "mypassword123"

// 正确：环境变量
const apiKey = process.env.OPENAI_API_KEY
const dbPassword = process.env.DATABASE_PASSWORD

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## XSS 防护

```typescript
// 错误：直接 HTML 注入
element.innerHTML = userInput

// 正确：净化或使用 textContent
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userInput)
// 或者
element.textContent = userInput
```

## Prototype Pollution

```typescript
// 错误：不安全的对象合并
function merge(target: any, source: any) {
  for (const key in source) {
    target[key] = source[key]  // 危险！
  }
}

// 正确：验证 keys
function merge(target: any, source: any) {
  for (const key in source) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    target[key] = source[key]
  }
}
```

## SQL 注入（Node.js）

```typescript
// 错误：字符串拼接
const query = `SELECT * FROM users WHERE id = ${userId}`

// 正确：参数化查询
const query = 'SELECT * FROM users WHERE id = ?'
db.query(query, [userId])
```

## 路径遍历

```typescript
// 错误：直接构建路径
const filePath = `./uploads/${req.params.filename}`

// 正确：验证和净化
import path from 'path'
const filename = path.basename(req.params.filename)
const filePath = path.join('./uploads', filename)
```

## 依赖安全

```bash
# 定期安全审计
npm audit
npm audit fix

# 使用 lock files
npm ci  # CI/CD 中使用 npm ci 而非 npm install
```

## Agent 支持

- 使用 **security-reviewer** agent 进行全面安全审计
- 通过 `/agent swap security-reviewer` 或 security-review skill 调用
