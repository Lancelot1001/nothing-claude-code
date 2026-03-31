---
name: nuxt4-patterns
description: Nuxt 4 app patterns for hydration safety, performance, route rules, lazy loading, and SSR-safe data fetching with useFetch and useAsyncData.
origin: nothing-claude-code
---

# Nuxt 4 模式

在构建或调试具有 SSR、混合渲染、路由规则或页面级数据获取的 Nuxt 4 应用时使用。

## 何时激活

- 服务器 HTML 与客户端状态之间的水合不匹配
- 路由级渲染决策，如 prerender、SWR、ISR 或 client-only 部分
- 围绕懒加载、懒水合或 payload 大小的性能工作
- 使用 `useFetch`、`useAsyncData` 或 `$fetch` 进行页面或组件数据获取
- 与路由参数、中间件或 SSR/客户端差异相关的 Nuxt 路由问题

## 水合安全

- 保持首次渲染确定性。不要将 `Date.now()`、`Math.random()`、仅浏览器 API 或存储读取直接放入 SSR 渲染的模板状态。
- 当服务器无法生成相同标记时，将仅浏览器逻辑移到 `onMounted()`、`import.meta.client`、`ClientOnly` 或 `.client.vue` 组件后面。
- 使用 Nuxt 的 `useRoute()` 组合式函数，而不是 `vue-router` 中的。
- 不要使用 `route.fullPath` 驱动 SSR 渲染的标记。URL 片段仅限客户端，可能导致水合不匹配。
- 将 `ssr: false` 视为真正仅浏览器区域的逃生通道，而不是不匹配的默认修复方案。

## 数据获取

- 在页面和组件中进行 SSR 安全的 API 读取时，优先使用 `await useFetch()`。它将服务器获取的数据转发到 Nuxt payload 中，避免在水合时进行第二次获取。
- 当 fetcher 不是简单的 `$fetch()` 调用、需要自定义 key 或组合多个异步源时，使用 `useAsyncData()`。
- 为 `useAsyncData()` 提供稳定的 key 以便缓存重用和可预测的刷新行为。
- 保持 `useAsyncData()` 处理函数无副作用。它们可以在 SSR 和水合期间运行。
- 对用户触发的写入或仅客户端操作使用 `$fetch()`，而不是应该从 SSR 水合的顶级页面数据。
- 对不应阻塞导航的非关键数据使用 `lazy: true`、`useLazyFetch()` 或 `useLazyAsyncData()`。在 UI 中处理 `status === 'pending'`。
- 仅对不需要 SEO 或首次绘制的数据使用 `server: false`。
- 使用 `pick` 精简 payload 大小，在不需要深层响应性时首选较浅的 payload。

```ts
const route = useRoute()

const { data: article, status, error, refresh } = await useAsyncData(
  () => `article:${route.params.slug}`,
  () => $fetch(`/api/articles/${route.params.slug}`),
)

const { data: comments } = await useFetch(`/api/articles/${route.params.slug}/comments`, {
  lazy: true,
  server: false,
})
```

## 路由规则

在 `nuxt.config.ts` 中使用 `routeRules` 进行渲染和缓存策略：

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/products/**': { swr: 3600 },
    '/blog/**': { isr: true },
    '/admin/**': { ssr: false },
    '/api/**': { cache: { maxAge: 60 * 60 } },
  },
})
```

- `prerender`：构建时静态 HTML
- `swr`：提供缓存内容并在后台重新验证
- `isr`：在支持的平台上进行增量静态再生成
- `ssr: false`：客户端渲染路由
- `cache` 或 `redirect`：Nitro 级响应行为

按路由组选择路由规则，而非全局选择。营销页面、目录、仪表板和 API 通常需要不同的策略。

## 懒加载和性能

- Nuxt 已按路由对页面进行代码分割。在进行微优化组件分割之前，保持路由边界有意义。
- 使用 `Lazy` 前缀动态导入非关键组件。
- 使用 `v-if` 条件渲染懒组件，以便 chunk 仅在 UI 实际需要时才加载。
- 对折叠下方或非关键交互式 UI 使用懒水合。

```vue
<template>
  <LazyRecommendations v-if="showRecommendations" />
  <LazyProductGallery hydrate-on-visible />
</template>
```

- 对于自定义策略，结合可见性或空闲策略使用 `defineLazyHydrationComponent()`。
- Nuxt 懒水合适用于单文件组件。将新 props 传递给懒水合组件会立即触发水合。
- 对内部导航使用 `NuxtLink`，以便 Nuxt 可以预取路由组件和生成的 payload。

## 审查清单

- 首次 SSR 渲染和水合客户端渲染产生相同标记
- 页面数据使用 `useFetch` 或 `useAsyncData`，而非顶级 `$fetch`
- 非关键数据为懒加载且有明确的加载 UI
- 路由规则与页面的 SEO 和新鲜度要求匹配
- 重型交互孤岛为懒加载或懒水合
