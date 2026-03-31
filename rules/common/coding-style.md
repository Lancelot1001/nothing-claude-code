# 编码风格规则

## 不可变性（关键！）

**始终创建新对象，绝不修改现有对象。**

### JavaScript/TypeScript

```javascript
// 错误 ❌
user.name = '新名字';
user.age = 25;
return user;

// 正确 ✓
return { ...user, name: '新名字', age: 25 };

// 错误 ❌
items.push(newItem);

// 正确 ✓
return [...items, newItem];

// 错误 ❌
delete obj.property;

// 正确 ✓
const { property, ...rest } = obj;
return rest;
```

### Python

```python
# 错误 ❌
user['name'] = '新名字'
return user

# 正确 ✓
return {**user, 'name': '新名字'}

# 错误 ❌
items.append(new_item)

# 正确 ✓
return [*items, new_item]
```

### Go

```go
// 错误 ❌
user.Name = "新名字"
return user

// 正确 ✓
return User{
    Name:    "新名字",
    Age:     user.Age,
    Email:   user.Email,
}
```

## 文件组织

### 大小规则

- 单文件典型行数：200-400 行
- 单文件最大行数：800 行
- 函数最大行数：50 行

### 目录结构

按功能/领域组织，而非按类型：

```
# 错误 ❌
/src
  /controllers
  /models
  /views

# 正确 ✓
/src
  /user
    user.controller.ts
    user.model.ts
    user.routes.ts
  /order
    order.controller.ts
    order.model.ts
    order.routes.ts
```

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | 小写中划线 | `user-service.ts`, `order_controller.go` |
| 类 | 大驼峰 | `UserService`, `OrderController` |
| 函数/方法 | 小驼峰或蛇形 | `getUser()`, `get_user()` |
| 常量 | 全大写下划线 | `MAX_RETRY_COUNT`, `API_KEY` |
| 接口 | 大驼峰，可加 I 前缀 | `User` 或 `IUser` |
| 私有成员 | 下划线前缀 | `_privateMethod()`, `_cache` |

## 错误处理

### 原则

- 每层都处理错误
- 提供用户友好的错误消息
- 记录详细上下文
- **绝不**静默吞掉错误

### 示例

```typescript
// 错误 ❌
try {
  await saveUser(user);
} catch (e) {
  // 吞掉错误
}

// 错误 ❌
try {
  await saveUser(user);
} catch (e) {
  console.error(e); // 只打印不处理
}

// 正确 ✓
try {
  await saveUser(user);
} catch (error) {
  throw new UserSaveError('保存用户失败', { cause: error });
}
```

## 输入验证

### 原则

- 在系统边界验证所有输入
- 快速失败并给出明确消息
- **绝不**信任外部数据

### 验证模式

```typescript
// 1. 模式验证
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});
const result = schema.safeParse(input);

// 2. 函数入口验证
function processOrder(orderId: string, items: Item[]) {
  if (!orderId || typeof orderId !== 'string') {
    throw new ValidationError('无效的订单ID');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('订单必须包含至少一个商品');
  }
  // 处理逻辑
}
```

## 代码质量清单

- [ ] 函数小（<50 行）
- [ ] 文件专注（<800 行）
- [ ] 无深度嵌套（最多 4 层）
- [ ] 适当的错误处理
- [ ] 无硬编码值（使用常量）
- [ ] 可读的、良好命名的标识符
- [ ] 必要的注释（解释"为什么"，而非"是什么"）
