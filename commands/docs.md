---
description: 通过 Context7 查找库或主题的当前文档。
---

# /docs

## 目的

查找库、框架或 API 的最新文档，并返回带有相关代码片段的摘要答案。使用 Context7 MCP（resolve-library-id 和 query-docs），因此答案反映当前文档，而非训练数据。

## 使用方法

```
/docs [库名] [问题]
```

多词参数使用引号，以便解析为单个标记。例如：`/docs "Next.js" "如何配置中间件？"`

如果省略库或问题，提示用户：
1. 库或产品名称（例如 Next.js、Prisma、Supabase）
2. 具体问题或任务（例如"如何设置中间件？"、"认证方法"）

## workflow process

1. **解析库 ID** — 使用库名称和用户问题调用 Context7 工具 `resolve-library-id`，获取 Context7 兼容的库 ID（例如 `/vercel/next.js`）
2. **查询文档** — 使用该库 ID 和用户问题调用 `query-docs`
3. **总结** — 返回简洁答案，并包含从获取文档中的相关代码示例。提及库（以及相关版本）

## 输出

用户收到基于最新文档的简短准确答案，以及有帮助的代码片段。如果 Context7 不可用，说明情况并从训练数据回答，同时注明文档可能已过时。
