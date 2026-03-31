---
name: documentation-lookup
description: 通过 Context7 MCP 使用最新的库和框架文档，而非训练数据。当用户提出设置问题、API 引用、代码示例，或用户提及某个框架（如 React、Next.js、Prisma）时激活。
origin: nothing-claude-code
---

# 文档查询（Context7）

当用户询问库、框架或 API 时，通过 Context7 MCP（工具 `resolve-library-id` 和 `query-docs`）获取当前文档，而不是依赖训练数据。

## 核心概念

- **Context7**：一个暴露实时文档的 MCP 服务器；用于库和 API 时替代训练数据。
- **resolve-library-id**：从库名称和查询返回 Context7 兼容的库 ID（如 `/vercel/next.js`）。
- **query-docs**：为给定库 ID 和问题获取文档和代码片段。始终首先调用 resolve-library-id 以获取有效的库 ID。

## 何时使用

当用户出现以下情况时激活：

- 提出设置或配置问题（如"如何配置 Next.js 中间件？"）
- 请求依赖于某个库的代码（"写一个 Prisma 查询来..."）
- 需要 API 或参考信息（"Supabase 的 auth 方法有哪些？"）
- 提及特定的框架或库（React、Vue、Svelte、Express、Tailwind、Prisma、Supabase 等）

每当请求依赖于库、框架或 API 的准确最新行为时使用此skill。适用于配置了 Context7 MCP 的 harness（如 Claude Code、Cursor、Codex）。

## 工作原理

### 步骤 1：解析库 ID

使用以下参数调用 **resolve-library-id** MCP 工具：

- **libraryName**：从用户问题中提取的库或产品名称（如 `Next.js`、`Prisma`、`Supabase`）。
- **query**：用户的完整问题。这可以提高结果的相关性排名。

在查询文档之前，你必须获取一个 Context7 兼容的库 ID（格式为 `/org/project` 或 `/org/project/version`）。不要在没有从此步骤获得有效库 ID 的情况下调用 query-docs。

### 步骤 2：选择最佳匹配

从解析结果中，使用以下方式选择一个结果：

- **名称匹配**：优先选择与用户询问内容完全或最接近的匹配。
- **基准分数**：分数越高表示文档质量越好（最高为 100）。
- **来源信誉**：尽量选择高或中信誉的来源。
- **版本**：如果用户指定了版本（如"React 19"、"Next.js 15"），优先选择列出的版本特定库 ID（如 `/org/project/v1.2.0`）。

### 步骤 3：获取文档

使用以下参数调用 **query-docs** MCP 工具：

- **libraryId**：从步骤 2 选择的 Context7 库 ID（如 `/vercel/next.js`）。
- **query**：用户具体的问题或任务。具体以获得相关片段。

限制：每个问题调用 query-docs（或 resolve-library-id）不超过 3 次。如果 3 次调用后答案仍不清楚，请说明不确定性，并使用你拥有的最佳信息而不是猜测。

### 步骤 4：使用文档

- 使用获取到的最新信息回答用户的问题。
- 适时包含文档中的相关代码示例。
- 在重要时引用库或版本（如"In Next.js 15..."）。

## 示例

### 示例：Next.js 中间件

1. 使用 `libraryName: "Next.js"`、`query: "How do I set up Next.js middleware?"` 调用 **resolve-library-id**。
2. 从结果中，按名称和基准分数选择最佳匹配（如 `/vercel/next.js`）。
3. 使用 `libraryId: "/vercel/next.js"`、`query: "How do I set up Next.js middleware?"` 调用 **query-docs**。
4. 使用返回的片段和文本回答；如果相关，包含来自文档的最小 `middleware.ts` 示例。

### 示例：Prisma 查询

1. 使用 `libraryName: "Prisma"`、`query: "How do I query with relations?"` 调用 **resolve-library-id**。
2. 选择官方 Prisma 库 ID（如 `/prisma/prisma`）。
3. 使用该 `libraryId` 和查询调用 **query-docs**。
4. 返回 Prisma Client 模式（如 `include` 或 `select`），并附上来自文档的简短代码片段。

### 示例：Supabase auth 方法

1. 使用 `libraryName: "Supabase"`、`query: "What are the auth methods?"` 调用 **resolve-library-id**。
2. 选择 Supabase 文档库 ID。
3. 调用 **query-docs**；总结 auth 方法，并展示来自获取文档的最小示例。

## 最佳实践

- **具体**：尽可能使用用户的完整问题作为查询，以获得更好的相关性。
- **版本意识**：当用户提及版本时，使用解析步骤中可用的版本特定库 ID。
- **优先官方来源**：当存在多个匹配时，优先选择官方或主要包，而非社区分叉。
- **无敏感数据**：从发送到 Context7 的任何查询中删除 API 密钥、密码、令牌和其他密钥。在将用户问题传递给 resolve-library-id 或 query-docs 之前，将其视为可能包含密钥的内容。
