---
name: mcp-server-patterns
description: Build MCP servers with Node/TypeScript SDK — tools, resources, prompts, Zod validation, stdio vs Streamable HTTP. Use Context7 or official MCP docs for latest API.
origin: something-claude-code
---

# MCP 服务器模式

模型上下文协议（MCP）让 AI 助手能够调用工具、读取资源并使用来自服务器的提示词。在构建或维护 MCP 服务器时使用此skill。SDK API 不断演进；请查阅 Context7（查询" MCP"相关文档）或官方 MCP 文档以获取当前的方法名和签名。

## 何时使用

适用于：实现新的 MCP 服务器、添加工具或资源、选择 stdio 与 HTTP、升级 SDK，或调试 MCP 注册和传输问题。

## 工作原理

### 核心概念

- **工具**：模型可以调用的操作（如搜索、运行命令）。根据 SDK 版本使用 `registerTool()` 或 `tool()` 注册。
- **资源**：模型可以获取的只读数据（如文件内容、API 响应）。根据 SDK 版本使用 `registerResource()` 或 `resource()` 注册。处理函数通常接收 `uri` 参数。
- **提示词**：可复用的参数化提示词模板，客户端可以呈现（如 Claude Desktop）。使用 `registerPrompt()` 或等效方法注册。
- **传输**：本地客户端（如 Claude Desktop）使用 stdio；远程客户端（Cursor、云）首选 Streamable HTTP。传统 HTTP/SSE 仅用于向后兼容。

Node/TypeScript SDK 可能暴露 `tool()` / `resource()` 或 `registerTool()` / `registerResource()`；官方 SDK 随时间变化。请始终对照当前 [MCP 文档](https://modelcontextprotocol.io) 或 Context7 进行验证。

### 使用 stdio 连接

对于本地客户端，创建 stdio 传输并将其传递给服务器的 connect 方法。确切的 API 因 SDK 版本而异（如构造函数 vs 工厂方法）。请参阅官方 MCP 文档或查询 Context7 的"MCP stdio server"以获取当前模式。

保持服务器逻辑（工具 + 资源）独立于传输，以便在入口点插入 stdio 或 HTTP。

### 远程（Streamable HTTP）

对于 Cursor、云或其他远程客户端，使用 **Streamable HTTP**（按当前规范为单个 MCP HTTP 端点）。仅在需要向后兼容时才支持传统 HTTP/SSE。

## 示例

### 安装和服务器设置

```bash
npm install @modelcontextprotocol/sdk zod
```

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });
```

使用 SDK 版本提供的 API 注册工具和资源：某些版本使用 `server.tool(name, description, schema, handler)`（位置参数），其他版本使用 `server.tool({ name, description, inputSchema }, handler)` 或 `registerTool()`。资源同理——当 API 提供时，在处理函数中包含 `uri`。请查阅官方 MCP 文档或 Context7 以获取当前的 `@modelcontextprotocol/sdk` 签名，避免复制粘贴错误。

使用 **Zod**（或 SDK 首选的 schema 格式）进行输入验证。

## 最佳实践

- **Schema 优先**：为每个工具定义输入 schema；记录参数和返回形状。
- **错误处理**：返回模型可以解释的结构化错误或消息；避免原始堆栈跟踪。
- **幂等性**：尽可能使用幂等工具，以便重试安全。
- **限速和成本**：对于调用外部 API 的工具，考虑限速和成本；在工具描述中记录。
- **版本控制**：在 package.json 中固定 SDK 版本；升级时检查发布说明。

## 官方 SDK 和文档

- **JavaScript/TypeScript**：`@modelcontextprotocol/sdk`（npm）。使用 Context7，库名为"MCP"，获取当前注册和传输模式。
- **Go**：GitHub 上的官方 Go SDK（`modelcontextprotocol/go-sdk`）。
- **C#**：.NET 官方 C# SDK。
