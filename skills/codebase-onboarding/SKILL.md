---
name: codebase-onboarding
description: 分析不熟悉的代码库并生成结构化的入职指南，包括架构图、关键入口点、约定和起始 CLAUDE.md。当加入新项目或首次在仓库中设置 Claude Code 时使用。
origin: something-claude-code
---

# 代码库入职

系统性地分析不熟悉的代码库并生成结构化的入职指南。为加入新项目的开发者或首次在现有仓库中设置 Claude Code 而设计。

## 何时使用

- 首次使用 Claude Code 打开项目
- 加入新团队或仓库
- 用户问「帮我理解这个代码库」
- 用户要求为项目生成 CLAUDE.md
- 用户说「让我入职」或「带我了解这个仓库」

## 工作原理

### 阶段 1：侦察

不阅读每个文件，收集关于项目的原始信号。并行运行这些检查：

```
1. 包清单检测
   → package.json、go.mod、Cargo.toml、pyproject.toml、pom.xml、build.gradle、
     Gemfile、composer.json、mix.exs、pubspec.yaml

2. 框架指纹识别
   → next.config.*、nuxt.config.*、angular.json、vite.config.*、
     django settings、flask app factory、fastapi main、rails config

3. 入口点识别
   → main.*、index.*、app.*、server.*、cmd/、src/main/

4. 目录结构快照
   → 目录树的前 2 层，忽略 node_modules、vendor、
     .git、dist、build、__pycache__、.next

5. 配置和工具检测
   → .eslintrc*、.prettierrc*、tsconfig.json、Makefile、Dockerfile、
     docker-compose*、.github/workflows/、.env.example、CI 配置

6. 测试结构检测
   → tests/、test/、__tests__/、*_test.go、*.spec.ts、*.test.js、
     pytest.ini、jest.config.*、vitest.config.*
```

### 阶段 2：架构映射

从侦察数据中识别：

**技术栈**
- 语言及版本约束
- 框架及主要库
- 数据库及 ORM
- 构建工具和打包器
- CI/CD 平台

**架构模式**
- 单体、单体仓库、微服务或无服务器
- 前端/后端分离或全栈
- API 风格：REST、GraphQL、gRPC、tRPC

**关键目录**
将顶级目录映射到其用途：

<!-- React 项目的示例 — 替换为检测到的目录 -->
```
src/components/  → React UI 组件
src/api/         → API 路由处理器
src/lib/         → 共享工具
src/db/          → 数据库模型和迁移
tests/           → 测试套件
scripts/         → 构建和部署脚本
```

**数据流**
追踪一个请求从入口到响应的过程：
- 请求从哪里进入？（路由器、处理器、控制器）
- 它如何被验证？（中间件、schema、守卫）
- 业务逻辑在哪里？（服务、模型、用例）
- 它如何到达数据库？（ORM、原始查询、仓库）

### 阶段 3：约定检测

识别代码库已经遵循的模式：

**命名约定**
- 文件命名：kebab-case、camelCase、PascalCase、snake_case
- 组件/类命名模式
- 测试文件命名：`*.test.ts`、`*.spec.ts`、`*_test.go`

**代码模式**
- 错误处理风格：try/catch、Result 类型、错误码
- 依赖注入或直接导入
- 状态管理方法
- 异步模式：callbacks、promises、async/await、channels

**Git 约定**
- 从最近的分支看分支命名
- 从最近的提交看提交消息风格
- PR workflow process（压缩、合并、重基）
- 如果仓库还没有提交或只有浅层历史（例如 `git clone --depth 1`），跳过此部分并注明「Git 历史不可用或太浅，无法检测约定」

### 阶段 4：生成入职产物

生成两个输出：

#### 输出 1：入职指南

```markdown
# 入职指南：[项目名称]

## 概述
[2-3 句话：这个项目做什么，它服务谁]

## 技术栈
<!-- Next.js 项目的示例 — 替换为检测到的技术栈 -->
| 层级 | 技术 | 版本 |
|-------|-----------|---------|
| 语言 | TypeScript | 5.x |
| 框架 | Next.js | 14.x |
| 数据库 | PostgreSQL | 16 |
| ORM | Prisma | 5.x |
| 测试 | Jest + Playwright | - |

## 架构
[组件如何连接的图表或描述]

## 关键入口点
<!-- Next.js 项目的示例 — 替换为检测到的路径 -->
- **API 路由**：`src/app/api/` — Next.js 路由处理器
- **UI 页面**：`src/app/(dashboard)/` — 认证页面
- **数据库**：`prisma/schema.prisma` — 数据模型的事实来源
- **配置**：`next.config.ts` — 构建和运行时配置

## 目录地图
[顶级目录 → 用途映射]

## 请求生命周期
[追踪一个 API 请求从入口到响应]

## 约定
- [文件命名模式]
- [错误处理方法]
- [测试模式]
- [Git workflow process]

## 常见任务
<!-- Node.js 项目的示例 — 替换为检测到的命令 -->
- **运行开发服务器**：`npm run dev`
- **运行测试**：`npm test`
- **运行 linter**：`npm run lint`
- **数据库迁移**：`npx prisma migrate dev`
- **构建生产版本**：`npm run build`

##去哪里找
<!-- Next.js 项目的示例 — 替换为检测到的路径 -->
| 我想... | 看这里... |
|--------------|-----------|
| 添加 API 端点 | `src/app/api/` |
| 添加 UI 页面 | `src/app/(dashboard)/` |
| 添加数据库表 | `prisma/schema.prisma` |
| 添加测试 | 与源路径对应的 `tests/` |
| 更改构建配置 | `next.config.ts` |
```

#### 输出 2：起始 CLAUDE.md

基于检测到的约定生成或更新项目特定的 CLAUDE.md。如果 `CLAUDE.md` 已存在，先阅读并增强它 — 保留现有的项目特定指令，并明确标注新增或更改的内容。

```markdown
# 项目指令

## 技术栈
[检测到的技术栈摘要]

## 代码风格
- [检测到的命名约定]
- [检测到要遵循的模式]

## 测试
- 运行测试：`[检测到的测试命令]`
- 测试模式：[检测到的测试文件约定]
- 覆盖率：[如果配置了，覆盖率命令]

## 构建与运行
- 开发：`[检测到的开发命令]`
- 构建：`[检测到的构建命令]`
- Lint：`[检测到的 lint 命令]`

## 项目结构
[关键目录 → 用途地图]

## 约定
- [可检测的提交风格]
- [可检测的 PR workflow process]
- [错误处理模式]
```

## 最佳实践

1. **不要阅读所有内容** — 侦察应使用 Glob 和 Grep，而不是 Read 每个文件。只对模糊的信号进行选择性阅读。
2. **验证，不要猜测** — 如果从配置检测到框架但实际代码使用了不同的东西，相信代码。
3. **尊重现有的 CLAUDE.md** — 如果已存在，增强它而不是替换它。标注什么是新的，什么是现有的。
4. **保持简洁** — 入职指南应该能在 2 分钟内扫描完。细节在代码中，不在指南中。
5. **标注未知** — 如果无法自信地检测到约定，就这样说明，而不是猜测。「无法确定测试运行器」比错误答案好。

## 应避免的反模式

- 生成超过 100 行的 CLAUDE.md — 保持专注
- 列出每个依赖 — 只突出影响你如何写代码的那些
- 描述显而易见的目录名 — `src/` 不需要解释
- 复制 README — 入职指南增加了 README 缺乏的结构性洞察

## 示例

### 示例 1：首次在新仓库中
**用户**：「让我入职这个代码库」
**行动**：运行完整的 4 阶段工作流 → 生成入职指南 + 起始 CLAUDE.md
**输出**：入职指南直接打印到对话中，加上写入项目根目录的 `CLAUDE.md`

### 示例 2：为现有项目生成 CLAUDE.md
**用户**：「为这个项目生成 CLAUDE.md」
**行动**：运行阶段 1-3，跳过入职指南，只生成 CLAUDE.md
**输出**：带有检测到的约定的项目特定 `CLAUDE.md`

### 示例 3：增强现有 CLAUDE.md
**用户**：「用当前项目约定更新 CLAUDE.md」
**行动**：阅读现有 CLAUDE.md，运行阶段 1-3，合并新发现
**输出**：更新后的 `CLAUDE.md`，新增内容明确标注
