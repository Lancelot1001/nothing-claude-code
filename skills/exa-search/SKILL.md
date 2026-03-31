---
name: exa-search
description: 通过 Exa MCP 进行网络、代码和公司研究的神经搜索。当用户需要网络搜索、代码示例、公司情报、人员查找或使用 Exa 神经搜索引擎进行 AI 驱动的深度研究时使用。
origin: nothing-claude-code
---

# Exa 搜索

通过 Exa MCP 服务器进行网络内容、代码、公司和人员的神经搜索。

## 何时激活

- 用户需要当前的网络信息或新闻
- 搜索代码示例、API 文档或技术参考
- 研究公司、竞争对手或市场参与者
- 寻找特定领域中的专业资料或人员
- 为任何开发任务运行背景研究
- 用户说"搜索"、"查找"、"寻找"或"最新动态是什么"

## MCP 要求

必须配置 Exa MCP 服务器。添加到 `~/.claude.json`：

```json
"exa-web-search": {
  "command": "npx",
  "args": ["-y", "exa-mcp-server"],
  "env": { "EXA_API_KEY": "YOUR_EXA_API_KEY_HERE" }
}
```

Get an API key at [exa.ai](https://exa.ai).
This repo's current Exa setup documents the tool surface exposed here: `web_search_exa` and `get_code_context_exa`.
If your Exa server exposes additional tools, verify their exact names before depending on them in docs or prompts.

## 核心工具

### web_search_exa
用于当前信息、新闻或事实的通用网络搜索。

```
web_search_exa(query: "latest AI developments 2026", numResults: 5)
```

**Parameters:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `query` | string | required | Search query |
| `numResults` | number | 8 | Number of results |
| `type` | string | `auto` | Search mode |
| `livecrawl` | string | `fallback` | Prefer live crawling when needed |
| `category` | string | none | Optional focus such as `company` or `research paper` |

### get_code_context_exa
从 GitHub、Stack Overflow 和文档站点查找代码示例和文档。

```
get_code_context_exa(query: "Python asyncio patterns", tokensNum: 3000)
```

**参数：**

| 参数 | 类型 | 默认值 | 备注 |
|-------|------|---------|-------|
| `query` | string | required | 代码或 API 搜索查询 |
| `tokensNum` | number | 5000 | 内容 token（1000-50000） |

## 使用模式

### 快速查找
```
web_search_exa(query: "Node.js 22 new features", numResults: 3)
```

### 代码研究
```
get_code_context_exa(query: "Rust error handling patterns Result type", tokensNum: 3000)
```

### 公司或人员研究
```
web_search_exa(query: "Vercel funding valuation 2026", numResults: 3, category: "company")
web_search_exa(query: "site:linkedin.com/in AI safety researchers Anthropic", numResults: 5)
```

### 技术深入研究
```
web_search_exa(query: "WebAssembly component model status and adoption", numResults: 5)
get_code_context_exa(query: "WebAssembly component model examples", tokensNum: 4000)
```

## 提示

- Use `web_search_exa` for current information, company lookups, and broad discovery
- Use search operators like `site:`, quoted phrases, and `intitle:` to narrow results
- Lower `tokensNum` (1000-2000) for focused code snippets, higher (5000+) for comprehensive context
- Use `get_code_context_exa` when you need API usage or code examples rather than general web pages

## 相关skill

- `deep-research` — 使用 firecrawl + exa 的完整研究workflow process
- `market-research` — 带决策框架的商业导向研究
