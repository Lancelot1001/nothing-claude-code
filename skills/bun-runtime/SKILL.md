---
name: bun-runtime
description: Bun 作为运行时、包管理器、构建器和测试运行器。何时选择 Bun vs Node、迁移注意事项以及 Vercel 支持。
origin: nothing-claude-code
---

# Bun 运行时

Bun 是一个快速的多功能 JavaScript 运行时和工具包：运行时、包管理器、构建器和测试运行器。

## 何时使用

- **选择 Bun**：新的 JS/TS 项目、注重安装/运行速度的脚本、使用 Bun 运行时的 Vercel 部署，以及当你想要单一工具链时（运行 + 安装 + 测试 + 构建）。
- **选择 Node**：最大生态系统兼容性、假设使用 Node 的遗留工具，或者当某个依赖有已知 Bun 问题 时。

使用场景：采用 Bun、从 Node 迁移、编写或调试 Bun 脚本/测试，或在 Vercel 或其他平台上配置 Bun。

## 工作原理

- **运行时**：即插即用的 Node 兼容运行时（基于 JavaScriptCore，使用 Zig 实现）。
- **包管理器**：`bun install` 比 npm/yarn 明显更快。锁文件在当前 Bun 版本默认为 `bun.lock`（文本）；旧版本使用 `bun.lockb`（二进制）。
- **构建器**：内置的应用和库构建器和转译器。
- **测试运行器**：内置的 `bun test`，具有类似 Jest 的 API。

**从 Node 迁移**：将 `node script.js` 替换为 `bun run script.js` 或 `bun script.js`。用 `bun install` 替代 `npm install`；大多数包都可以工作。用 `bun run` 执行 npm 脚本；用 `bun x` 执行 npx 风格的一次性运行。支持 Node 内置模块；在有 Bun API 的地方优先使用以获得更好性能。

**Vercel**：在项目设置中将运行时设置为 Bun。构建：`bun run build` 或 `bun build ./src/index.ts --outdir=dist`。安装：`bun install --frozen-lockfile` 以实现可重现的部署。

## 示例

### 运行和安装

```bash
# 安装依赖（创建/更新 bun.lock 或 bun.lockb）
bun install

# 运行脚本或文件
bun run dev
bun run src/index.ts
bun src/index.ts
```

### 脚本和环境变量

```bash
bun run --env-file=.env dev
FOO=bar bun run script.ts
```

### 测试

```bash
bun test
bun test --watch
```

```typescript
// test/example.test.ts
import { expect, test } from "bun:test";

test("add", () => {
  expect(1 + 2).toBe(3);
});
```

### 运行时 API

```typescript
const file = Bun.file("package.json");
const json = await file.json();

Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello");
  },
});
```

## 最佳实践

- 提交锁文件（`bun.lock` 或 `bun.lockb`）以实现可重现的安装。
- 对于脚本优先使用 `bun run`。对于 TypeScript，Bun 原生运行 `.ts`。
- 保持依赖更新；Bun 和生态系统发展很快。
