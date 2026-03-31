# 安全规则

## 核心原则

**安全第一。绝不在安全问题上妥协。**

---

## 提交前必查清单

在提交任何代码前，必须确认：

- [ ] **无硬编码秘密** — 无 API 密钥、密码、Token、私钥文件路径
- [ ] **输入验证** — 所有用户输入已验证
- [ ] **SQL注入防护** — 使用参数化查询
- [ ] **XSS防护** — 净化 HTML 输出
- [ ] **CSRF保护** — 启用 CSRF 保护
- [ ] **认证/授权** — 已验证
- [ ] **速率限制** — 所有端点有速率限制
- [ ] **错误消息** — 不泄露敏感数据

---

## 秘密管理

### 绝对禁止

- 禁止在代码中硬编码密钥
- 禁止在注释中留密钥
- 禁止在错误消息中暴露密钥
- 禁止将密钥提交到 Git

### 正确做法

```bash
# 使用环境变量
export API_KEY="your-secret-key"

# 或使用 .env 文件（必须加入 .gitignore）
API_KEY=your-secret-key

# 在代码中读取
const apiKey = process.env.API_KEY;
```

### 配置示例

```typescript
// 错误 ❌
const config = {
  apiKey: 'sk-abc123...',  // 硬编码密钥
  password: 'hunter2'       // 硬编码密码
};

// 正确 ✓
const config = {
  apiKey: process.env.API_KEY,
  password: process.env.DB_PASSWORD,
};
```

### 密钥轮换

如果密钥暴露：
1. **立即轮换**所有相关密钥
2. 检查代码库中是否有类似泄露
3. 评估是否需要审计或通知用户

---

## 输入验证

### 原则

- 验证所有来自外部的数据
- 在系统边界验证
- 快速失败并给出明确消息

### SQL 注入防护

```typescript
// 错误 ❌ — SQL 注入漏洞
const query = `SELECT * FROM users WHERE id = ${userId}`;

// 正确 ✓ — 参数化查询
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);
```

### XSS 防护

```typescript
// 错误 ❌ — XSS 漏洞
element.innerHTML = userInput;

// 正确 ✓ — 净化 HTML
element.textContent = userInput;

// 或使用专门的净化库
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 命令注入防护

```typescript
// 错误 ❌ — 命令注入漏洞
const command = `ls ${userPath}`;

// 正确 ✓ — 验证路径或使用 API
import { validatePath } from './utils';
const safePath = validatePath(userPath);
if (!safePath) throw new Error('无效的路径');
```

---

## 认证和授权

### 原则

- 默认拒绝
- 验证每个请求的身份
- 最小权限原则

### 实现

```typescript
// 每个路由都需要认证检查
router.post('/admin/delete', requireAuth(), requireRole('admin'), handler);

// 中间件示例
function requireAuth() {
  return (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: '需要认证' });
    }
    try {
      req.user = verifyToken(token);
      next();
    } catch {
      return res.status(401).json({ error: '无效的令牌' });
    }
  };
}
```

---

## 速率限制

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每次 IP 最多 100 请求
  message: '请求过于频繁，请稍后再试',
});

app.use('/api', limiter);
```

---

## 错误处理

### 原则

- 错误消息**不泄露**敏感信息
- 日志记录详细信息（服务器端）
- 对用户显示通用消息

```typescript
// 错误 ❌ — 泄露实现细节
res.status(500).json({ error: '数据库连接失败: ' + error.message });

// 正确 ✓ — 对用户隐藏细节
console.error('数据库错误:', error); // 记录详细信息
res.status(500).json({ error: '服务器内部错误' });
```

---

## 安全问题处理流程

发现安全问题时的处理步骤：

```
1. STOP — 停止当前操作
2. security-reviewer — 使用安全审查agent
3. FIX — 修复严重问题
4. ROTATE — 轮换暴露的秘密
5. SCAN — 检查代码库中是否有类似问题
```

---

## 依赖安全

```bash
# 定期检查漏洞
npm audit

# 更新有漏洞的包
npm audit fix

# 使用锁文件确保一致的依赖
npm ci  # 而非 npm install
```
