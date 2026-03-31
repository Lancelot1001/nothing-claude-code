---
name: api-design
description: REST API 设计模式，包括资源命名、状态码、分页、过滤、错误响应、版本控制和速率限制，适用于生产环境 API。
origin: something-claude-code
---

# API 设计模式

用于设计一致、对开发者友好的 REST API 的约定和最佳实践。

## 何时激活

- 设计新的 API 端点
- 审查现有的 API 契约
- 添加分页、过滤或排序功能
- 为 API 实现错误处理
- 规划 API 版本控制策略
- 构建面向公众或合作伙伴的 API

## 资源设计

### URL 结构

```
# 资源使用名词、复数形式、小写、kebab-case
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

# 子资源用于表达关联关系
GET    /api/v1/users/:id/orders
POST   /api/v1/users/:id/orders

# 不符合 CRUD 的操作（尽量少用动词）
POST   /api/v1/orders/:id/cancel
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
```

### 命名规则

```
# 正确
/api/v1/team-members          # 多词资源使用 kebab-case
/api/v1/orders?status=active  # 使用查询参数进行过滤
/api/v1/users/123/orders      # 使用嵌套资源表达所有权

# 错误
/api/v1/getUsers              # URL 中使用动词
/api/v1/user                  # 使用单数（应该用复数）
/api/v1/team_members          # URL 中使用 snake_case
/api/v1/users/123/getOrders   # 嵌套资源中使用动词
```

## HTTP 方法和状态码

### 方法语义

| 方法 | 幂等 | 安全 | 用途 |
|--------|-----------|------|---------|
| GET | 是 | 是 | 获取资源 |
| POST | 否 | 否 | 创建资源、触发操作 |
| PUT | 是 | 否 | 完全替换资源 |
| PATCH | 否* | 否 | 部分更新资源 |
| DELETE | 是 | 否 | 删除资源 |

*PATCH 通过正确的实现可以变得幂等

### 状态码参考

```
# 成功
200 OK                    — GET, PUT, PATCH（带响应体）
201 Created               — POST（包含 Location 头）
204 No Content            — DELETE, PUT（无响应体）

# 客户端错误
400 Bad Request           — 验证失败、格式错误的 JSON
401 Unauthorized          — 缺少或无效的认证
403 Forbidden             — 已认证但未授权
404 Not Found             — 资源不存在
409 Conflict              — 重复条目、状态冲突
422 Unprocessable Entity  — 语义无效（有效的 JSON，但数据有误）
429 Too Many Requests     — 超过速率限制

# 服务器错误
500 Internal Server Error — 意外故障（切勿暴露细节）
502 Bad Gateway           — 上游服务失败
503 Service Unavailable   — 临时过载，包含 Retry-After
```

### 常见错误

```
# 错误：对所有情况都使用 200
{ "status": 200, "success": false, "error": "Not found" }

# 正确：语义化地使用 HTTP 状态码
HTTP/1.1 404 Not Found
{ "error": { "code": "not_found", "message": "User not found" } }

# 错误：用 500 处理验证错误
# 正确：用 400 或 422 并提供字段级详情

# 错误：用 200 表示创建的资源
# 正确：用 201 并包含 Location 头
HTTP/1.1 201 Created
Location: /api/v1/users/abc-123
```

## 响应格式

### 成功响应

```json
{
  "data": {
    "id": "abc-123",
    "email": "alice@example.com",
    "name": "Alice",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### 集合响应（带分页）

```json
{
  "data": [
    { "id": "abc-123", "name": "Alice" },
    { "id": "def-456", "name": "Bob" }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1&per_page=20",
    "next": "/api/v1/users?page=2&per_page=20",
    "last": "/api/v1/users?page=8&per_page=20"
  }
}
```

### 错误响应

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_format"
      },
      {
        "field": "age",
        "message": "Must be between 0 and 150",
        "code": "out_of_range"
      }
    ]
  }
}
```

### 响应包装器变体

```typescript
// 选项 A：带 data 包装器的信封（推荐用于公共 API）
interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

// 选项 B：扁平响应（更简单，常见于内部 API）
// 成功：直接返回资源
// 错误：返回错误对象
// 通过 HTTP 状态码区分
```

## 分页

### 基于偏移量的分页（简单）

```
GET /api/v1/users?page=2&per_page=20

# 实现
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;
```

**优点：** 易于实现，支持「跳转到第 N 页」
**缺点：** 大偏移量时性能差（OFFSET 100000），与并发插入不一致

### 基于游标的分页（可扩展）

```
GET /api/v1/users?cursor=eyJpZCI6MTIzfQ&limit=20

# 实现
SELECT * FROM users
WHERE id > :cursor_id
ORDER BY id ASC
LIMIT 21;  -- 多获取一条以判断是否有下一页
```

```json
{
  "data": [...],
  "meta": {
    "has_next": true,
    "next_cursor": "eyJpZCI6MTQzfQ"
  }
}
```

**优点：** 无论位置如何性能一致，与并发插入稳定
**缺点：** 无法跳转到任意页面，游标不透明

### 何时使用哪种

| 使用场景 | 分页类型 |
|----------|----------------|
| 管理后台、小数据集（<10K） | 偏移量 |
| 无限滚动、信息流、大数据集 | 游标 |
| 公共 API | 游标（默认）+ 偏移量（可选） |
| 搜索结果 | 偏移量（用户期望页码） |

## 过滤、排序和搜索

### 过滤

```
# 简单相等
GET /api/v1/orders?status=active&customer_id=abc-123

# 比较运算符（使用方括号表示法）
GET /api/v1/products?price[gte]=10&price[lte]=100
GET /api/v1/orders?created_at[after]=2025-01-01

# 多个值（逗号分隔）
GET /api/v1/products?category=electronics,clothing

# 嵌套字段（点号表示法）
GET /api/v1/orders?customer.country=US
```

### 排序

```
# 单字段（前缀 - 表示降序）
GET /api/v1/products?sort=-created_at

# 多字段（逗号分隔）
GET /api/v1/products?sort=-featured,price,-created_at
```

### 全文搜索

```
# 搜索查询参数
GET /api/v1/products?q=wireless+headphones

# 特定字段搜索
GET /api/v1/users?email=alice
```

### 稀疏字段集

```
# 只返回指定字段（减少 payload）
GET /api/v1/users?fields=id,name,email
GET /api/v1/orders?fields=id,total,status&include=customer.name
```

## 认证与授权

### 基于令牌的身份验证

```
# 在 Authorization 头中使用 Bearer 令牌
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# API 密钥（用于服务端到服务端）
GET /api/v1/data
X-API-Key: sk_live_abc123
```

### 授权模式

```typescript
// 资源级别：检查所有权
app.get("/api/v1/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: { code: "not_found" } });
  if (order.userId !== req.user.id) return res.status(403).json({ error: { code: "forbidden" } });
  return res.json({ data: order });
});

// 基于角色：检查权限
app.delete("/api/v1/users/:id", requireRole("admin"), async (req, res) => {
  await User.delete(req.params.id);
  return res.status(204).send();
});
```

## 速率限制

### 响应头

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000

# 超过限制时
HTTP/1.1 429 Too Many Requests
Retry-After: 60
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

### 速率限制层级

| 层级 | 限制 | 时间窗口 | 使用场景 |
|------|-------|--------|----------|
| 匿名 | 30/分钟 | 按 IP | 公共端点 |
| 已认证 | 100/分钟 | 按用户 | 标准 API 访问 |
| 高级 | 1000/分钟 | 按 API 密钥 | 付费 API 计划 |
| 内部 | 10000/分钟 | 按服务 | 服务间调用 |

## 版本控制

### URL 路径版本控制（推荐）

```
/api/v1/users
/api/v2/users
```

**优点：** 明确、易于路由、可缓存
**缺点：** 版本间 URL 发生变化

### 请求头版本控制

```
GET /api/users
Accept: application/vnd.myapp.v2+json
```

**优点：** URL 简洁
**缺点：** 难以测试，容易遗忘

### 版本控制策略

```
1. 从 /api/v1/ 开始 — 不到必要时候不要版本化
2. 最多维护 2 个活跃版本（当前版 + 上一个版本）
3. 弃用时间线：
   - 宣布弃用（公共 API 提前 6 个月通知）
   - 添加 Sunset 头：Sunset: Sat, 01 Jan 2026 00:00:00 GMT
   - 弃用日期后返回 410 Gone
4. 非破坏性变更不需要新版本：
   - 向响应添加新字段
   - 添加新的可选查询参数
   - 添加新的端点
5. 破坏性变更需要新版本：
   - 删除或重命名字段
   - 更改字段类型
   - 更改 URL 结构
   - 更改认证方式
```

## 实现模式

### TypeScript（Next.js API 路由）

```typescript
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: parsed.error.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      },
    }, { status: 422 });
  }

  const user = await createUser(parsed.data);

  return NextResponse.json(
    { data: user },
    {
      status: 201,
      headers: { Location: `/api/v1/users/${user.id}` },
    },
  );
}
```

### Python（Django REST Framework）

```python
from rest_framework import serializers, viewsets, status
from rest_framework.response import Response

class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "created_at"]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return UserSerializer

    def create(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.create(**serializer.validated_data)
        return Response(
            {"data": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
            headers={"Location": f"/api/v1/users/{user.id}"},
        )
```

### Go（net/http）

```go
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_json", "Invalid request body")
        return
    }

    if err := req.Validate(); err != nil {
        writeError(w, http.StatusUnprocessableEntity, "validation_error", err.Error())
        return
    }

    user, err := h.service.Create(r.Context(), req)
    if err != nil {
        switch {
        case errors.Is(err, domain.ErrEmailTaken):
            writeError(w, http.StatusConflict, "email_taken", "Email already registered")
        default:
            writeError(w, http.StatusInternalServerError, "internal_error", "Internal error")
        }
        return
    }

    w.Header().Set("Location", fmt.Sprintf("/api/v1/users/%s", user.ID))
    writeJSON(w, http.StatusCreated, map[string]any{"data": user})
}
```

## API 设计检查清单

发布新端点前：

- [ ] 资源 URL 遵循命名约定（复数、kebab-case、无动词）
- [ ] 使用正确的 HTTP 方法（GET 用于读取，POST 用于创建等）
- [ ] 返回适当的状态码（不是所有情况都返回 200）
- [ ] 使用 schema 验证输入（Zod、Pydantic、Bean Validation）
- [ ] 错误响应遵循标准格式，包含代码和消息
- [ ] 列表端点实现分页（游标或偏移量）
- [ ] 需要认证（或明确标记为公开）
- [ ] 检查授权（用户只能访问自己的资源）
- [ ] 配置速率限制
- [ ] 响应不泄露内部细节（堆栈跟踪、SQL 错误）
- [ ] 与现有端点命名一致（camelCase vs snake_case）
- [ ] 已有文档（更新 OpenAPI/Swagger 规范）
