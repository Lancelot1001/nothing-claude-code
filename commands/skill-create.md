---
name: skill-create
description: 分析本地 git 历史以提取编码模式并生成 SKILL.md 文件。Skill Creator GitHub App 的本地版本。
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /skill-create - 本地skill生成

分析仓库的 git 历史以提取编码模式，并生成教给 Claude 团队实践的 SKILL.md 文件。

## 使用方法

```bash
/skill-create                    # 分析当前仓库
/skill-create --commits 100      # 分析最近 100 次提交
/skill-create --output ./skills  # 自定义输出目录
/skill-create --instincts        # 也为 continuous-learning-v2 生成 instinct
```

## 作用

1. **解析 Git 历史** - 分析提交、文件更改和模式
2. **检测模式** - 识别反复出现的workflow process和约定
3. **生成 SKILL.md** - 创建有效的 Claude Code skill文件
4. **可选创建 Instinct** - 用于 continuous-learning-v2 系统

## 分析步骤

### 步骤 1：收集 Git 数据

```bash
# 获取带文件更改的最近提交
git log --oneline -n ${COMMITS:-200} --name-only --pretty=format:"%H|%s|%ad" --date=short

# 获取按文件的提交频率
git log --oneline -n 200 --name-only | grep -v "^$" | grep -v "^[a-f0-9]" | sort | uniq -c | sort -rn | head -20

# 获取提交消息模式
git log --oneline -n 200 | cut -d' ' -f2- | head -50
```

### 步骤 2：检测模式

寻找这些模式类型：

| 模式 | 检测方法 |
|---------|-----------------|
| **提交约定** | 提交消息上的正则表达式（feat:、fix:、chore:） |
| **文件共更改** | 总是一起更改的文件 |
| **workflow process序列** | 重复的文件更改模式 |
| **架构** | 文件夹结构和命名约定 |
| **测试模式** | 测试文件位置、命名、覆盖率 |

### 步骤 3：生成 SKILL.md

输出格式：

```markdown
---
name: {repo-name}-patterns
description: 从 {repo-name} 提取的编码模式
version: 1.0.0
source: local-git-analysis
analyzed_commits: {count}
---

# {Repo Name} 模式

## 提交约定
{检测到的提交消息模式}

## 代码架构
{检测到的文件夹结构和组织}

## workflow process
{检测到的重复文件更改模式}

## 测试模式
{检测到的测试约定}
```

### 步骤 4：生成 Instinct（如果 --instincts）

用于 continuous-learning-v2 集成：

```yaml
---
id: {repo}-commit-convention
trigger: "when writing a commit message"
confidence: 0.8
domain: git
source: local-repo-analysis
---

# 使用约定式提交

## 操作
使用前缀提交：feat:、fix:、chore:、docs:、test:、refactor:

## 证据
- 分析了 {n} 次提交
- {percentage}% 遵循约定式提交格式
```

## 示例输出

在 TypeScript 项目上运行 `/skill-create` 可能产生：

```markdown
---
name: my-app-patterns
description: 从 my-app 仓库提取的编码模式
version: 1.0.0
source: local-git-analysis
analyzed_commits: 150
---

# My App 模式

## 提交约定

此项目使用**约定式提交**：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `chore:` - 维护任务
- `docs:` - 文档更新

## 代码架构

```
src/
├── components/     # React 组件 (PascalCase.tsx)
├── hooks/          # 自定义 hooks (use*.ts)
├── utils/          # 工具函数
├── types/          # TypeScript 类型定义
└── services/       # API 和外部服务
```

## workflow process

### 添加新组件
1. 创建 `src/components/ComponentName.tsx`
2. 在 `src/components/__tests__/ComponentName.test.tsx` 添加测试
3. 从 `src/components/index.ts` 导出

### 数据库迁移
1. 修改 `src/db/schema.ts`
2. 运行 `pnpm db:generate`
3. 运行 `pnpm db:migrate`

## 测试模式

- 测试文件：`__tests__/` 目录或 `.test.ts` 后缀
- 覆盖率目标：80%+
- 框架：Vitest
```

## GitHub App 集成

对于高级功能（10k+ 提交、团队共享、自动 PR），使用 [Skill Creator GitHub App](https://github.com/apps/skill-creator)：

- 安装：[github.com/apps/skill-creator](https://github.com/apps/skill-creator)
- 在任何 issue 上评论 `/skill-creator analyze`
- 接收带有生成skill的 PR

## 相关命令

- `/instinct-import` - 导入生成的 instinct
- `/instinct-status` - 查看已学习的 instinct
- `/evolve` - 将 instinct 聚类为skill/agent

---

*部分来自 [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)*
