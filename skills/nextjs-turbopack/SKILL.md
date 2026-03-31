---
name: nextjs-turbopack
description: Next.js 16+ and Turbopack — incremental bundling, FS caching, dev speed, and when to use Turbopack vs webpack.
origin: nothing-claude-code
---

# Next.js 与 Turbopack

Next.js 16+ 默认使用 Turbopack 进行本地开发：一个用 Rust 编写的增量打包工具，显著加快开发启动和热更新速度。

## 何时使用

- **Turbopack（默认开发模式）**：用于日常开发。更快的冷启动和 HMR，尤其在大型应用中。
- **Webpack（传统开发模式）**：仅在你遇到 Turbopack 错误或依赖 webpack 专用插件时使用。使用 `--webpack` 禁用（或 `--no-turbopack`，取决于你的 Next.js 版本；请查看你所用版本的文档）。
- **生产环境**：生产构建行为（`next build`）可能使用 Turbopack 或 webpack，取决于 Next.js 版本；请查看你所用版本的官方 Next.js 文档。

适用于：开发或调试 Next.js 16+ 应用、诊断开发启动缓慢或 HMR 问题，或优化生产包。

## 工作原理

- **Turbopack**：Next.js 开发的增量打包工具。使用文件系统缓存，重启速度快得多（如大型项目提升 5–14 倍）。
- **开发默认启用**：从 Next.js 16 起，`next dev` 默认使用 Turbopack 运行，除非被禁用。
- **文件系统缓存**：重启重用之前的工作；缓存通常在 `.next` 下；基本使用无需额外配置。
- **Bundle Analyzer（Next.js 16.1+）**：实验性 Bundle Analyzer 用于检查输出和发现重型依赖；通过配置或实验性标志启用（请参阅你所用版本的 Next.js 文档）。

## 示例

### 命令

```bash
next dev
next build
next start
```

### 使用方法

运行 `next dev` 进行使用 Turbopack 的本地开发。使用 Bundle Analyzer（请参阅 Next.js 文档）优化代码分割和精简大型依赖。尽可能优先使用 App Router 和服务器组件。

## 最佳实践

- 保持在最新的 Next.js 16.x 版本以获得稳定的 Turbopack 和缓存行为。
- 如果开发缓慢，确保使用的是 Turbopack（默认），且缓存没有被不必要地清除。
- 对于生产包大小问题，使用你所用版本的官方 Next.js bundle 分析工具。
