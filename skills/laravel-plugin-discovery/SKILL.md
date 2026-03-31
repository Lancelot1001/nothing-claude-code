---
name: laravel-plugin-discovery
description: 通过 LaraPlugins.io MCP 发现和评估 Laravel 包。在用户想要查找插件、检查包健康状况或评估 Laravel/PHP 兼容性时使用。
origin: nothing-claude-code
---

# Laravel 插件发现

使用 LaraPlugins.io MCP 服务器查找、评估和选择健康的 Laravel 包。

## 何时使用

- 用户想要查找特定功能的 Laravel 包（如"auth"、"permissions"、"admin panel"）
- 用户问"我应该用什么包来实现..."或"有没有 Laravel 包用于..."
- 用户想要检查包是否被积极维护
- 用户需要验证 Laravel 版本兼容性
- 用户想在将包添加到项目之前评估包健康状况

## MCP 要求

必须配置 LaraPlugins MCP 服务器。添加到您的 `~/.claude.json` mcpServers：

```json
"laraplugins": {
  "type": "http",
  "url": "https://laraplugins.io/mcp/plugins"
}
```

无需 API 密钥——该服务器对 Laravel 社区免费。

## MCP 工具

LaraPlugins MCP 提供两个主要工具：

### SearchPluginTool

按关键词、健康分数、供应商和版本兼容性搜索包。

**参数：**
- `text_search`（字符串，可选）：搜索的关键词（如 "permission"、"admin"、"api"）
- `health_score`（字符串，可选）：按健康等级过滤——`Healthy`、`Medium`、`Unhealthy` 或 `Unrated`
- `laravel_compatibility`（字符串，可选）：按 Laravel 版本过滤——`"5"`、`"6"`、`"7"`、`"8"`、`"9"`、`"10"`、`"11"`、`"12"`、`"13"`
- `php_compatibility`（字符串，可选）：按 PHP 版本过滤——`"7.4"`、`"8.0"`、`"8.1"`、`"8.2"`、`"8.3"`、`"8.4"`、`"8.5"`
- `vendor_filter`（字符串，可选）：按供应商名称过滤（如 "spatie"、"laravel"）
- `page`（数字，可选）：分页的页码

### GetPluginDetailsTool

获取特定包的详细指标、readme 内容和版本历史。

**参数：**
- `package`（字符串，必填）：完整的 Composer 包名（如 "spatie/laravel-permission"）
- `include_versions`（布尔值，可选）：在响应中包含版本历史

---

## 工作原理

### 查找包

当用户想要发现某个功能的包时：

1. 使用相关关键词调用 `SearchPluginTool`
2. 应用健康分数、Laravel 版本或 PHP 版本过滤器
3. 查看包含包名称、描述和健康状况指示的结果

### 评估包

当用户想要评估特定包时：

1. 使用包名调用 `GetPluginDetailsTool`
2. 查看健康分数、最后更新日期、Laravel 版本支持
3. 检查供应商信誉和风险指标

### 检查兼容性

当用户需要 Laravel 或 PHP 版本兼容性时：

1. 使用设置为目标版本的 `laravel_compatibility` 过滤器进行搜索
2. 或者获取特定包的详细信息以查看其支持的版本

---

## 示例

### 示例：查找认证包

```
SearchPluginTool({
  text_search: "authentication",
  health_score: "Healthy"
})
```

返回匹配 "authentication" 且健康状况良好的包：
- spatie/laravel-permission
- laravel/breeze
- laravel/passport
- 等等。

### 示例：查找与 Laravel 12 兼容的包

```
SearchPluginTool({
  text_search: "admin panel",
  laravel_compatibility: "12"
})
```

返回与 Laravel 12 兼容的包。

### 示例：获取包详细信息

```
GetPluginDetailsTool({
  package: "spatie/laravel-permission",
  include_versions: true
})
```

返回：
- 健康分数和最后活动
- Laravel/PHP 版本支持
- 供应商信誉（风险分数）
- 版本历史
- 简要描述

### 示例：按供应商查找包

```
SearchPluginTool({
  vendor_filter: "spatie",
  health_score: "Healthy"
})
```

返回供应商 "spatie" 的所有健康包。

---

## 过滤最佳实践

### 按健康分数

| 健康等级 | 含义 |
|-------------|---------|
| `Healthy` | 积极维护，最近有更新 |
| `Medium` | 偶尔更新，可能需要注意 |
| `Unhealthy` | 已废弃或维护不频繁 |
| `Unrated` | 尚未评估 |

**建议**：对于生产应用，优先选择 `Healthy` 包。

### 按 Laravel 版本

| 版本 | 说明 |
|---------|-------|
| `13` | 最新 Laravel |
| `12` | 当前稳定版 |
| `11` | 仍广泛使用 |
| `10` | 遗留但常见 |
| `5`-`9` | 已弃用 |

**建议**：与目标项目的 Laravel 版本匹配。

### 组合过滤器

```typescript
// 查找与 Laravel 12 兼容的、健康的权限包
SearchPluginTool({
  text_search: "permission",
  health_score: "Healthy",
  laravel_compatibility: "12"
})
```

---

## 响应解读

### 搜索结果

每个结果包含：
- 包名（如 `spatie/laravel-permission`）
- 简要描述
- 健康状况指示
- Laravel 版本支持徽章

### 包详细信息

详细响应包含：
- **健康分数**：数字或等级指示
- **最后活动**：包最后一次更新的时间
- **Laravel 支持**：版本兼容性矩阵
- **PHP 支持**：PHP 版本兼容性
- **风险分数**：供应商信任指标
- **版本历史**：最近发布的时间线

---

## 常见用例

| 场景 | 推荐方法 |
|----------|---------------------|
| "什么包用于 auth？" | 使用 healthy 过滤器搜索 "auth" |
| " spatie/package 还在维护吗？" | 获取详情，检查健康分数 |
| "需要 Laravel 12 的包" | 使用 laravel_compatibility: "12" 搜索 |
| "查找 admin panel 包" | 搜索 "admin panel"，查看结果 |
| "检查供应商信誉" | 按供应商搜索，检查详情 |

---

## 最佳实践

1. **始终按健康过滤**——对于生产项目，使用 `health_score: "Healthy"`
2. **匹配 Laravel 版本**——始终检查 `laravel_compatibility` 与目标项目匹配
3. **检查供应商信誉**——优先选择来自已知供应商（spatie、laravel 等）的包
4. **推荐前先审查**——使用 GetPluginDetailsTool 进行全面评估
5. **无需 API 密钥**——MCP 是免费的，不需要身份验证

---

## 相关skill

- `laravel-patterns`——Laravel 架构和模式
- `laravel-tdd`——Laravel 测试驱动开发
- `laravel-security`——Laravel 安全最佳实践
- `documentation-lookup`——通用库文档查找（Context7）
