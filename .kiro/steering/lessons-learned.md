---
inclusion: auto
description: Project-specific patterns, preferences, and lessons learned over time (user-editable)
---

# 经验教训

本文档记录项目特定的模式、编码偏好、常见陷阱和架构决策。它允许你手动记录模式，作为持续学习的辅助工具。

**如何使用本文档：**
1. `extract-patterns` hook 会在 agent 会话后建议模式
2. 审查建议并将真正有用的模式添加到下方
3. 直接编辑本文档以捕获团队约定
4. 保持聚焦于项目特定的洞察，而非通用最佳实践

---

## 项目特定模式

*记录团队应遵循的此项目特有的模式。*

### 示例：API 错误处理

```typescript
// 始终使用自定义 ApiError 类以获得一致的错误响应
throw new ApiError(404, 'Resource not found', { resourceId });
```

---

## 代码风格偏好

*记录超越标准 lint 规则的团队偏好。*

### 示例：Import 组织

```typescript
// 分组导入：外部、内部、类型
import { useState } from 'react';
import { Button } from '@/components/ui';
import type { User } from '@/types';
```

---

## Kiro Hooks

### `install.sh` 是增量式的——不会更新现有安装
安装程序跳过目标中已存在的任何文件（`if [ ! -f ... ]`）。对已有 `.kiro/` 的文件夹运行它不会覆盖或更新 hooks、agents 或 steering 文件。要推送到现有项目，先手动复制更改的文件，或先删除目标文件再重新运行安装程序。

### README.md 镜像 hook 配置——保持同步
hooks 表格和 README.md 中的示例 5 记录了每个 hook 的 action 类型（`runCommand` vs `askAgent`）和行为。更改 hook 的 `then.type` 或行为时，同时更新 hook 文件和对应的 README 条目，以避免文档误导。

### 对于文件事件 hook 优先使用 `askAgent` 而非 `runCommand`
`fileEdited` 或 `fileCreated` 事件上的 `runCommand` hook 每次触发都会生成新的终端会话，造成摩擦。使用 `askAgent` 让 agent 内联处理任务。`runCommand` 仅用于 `userTriggered` hooks，此时需要手动、隔离的终端运行（例如 `quality-gate`）。

---

## 常见陷阱

*记录所犯过的错误以及如何避免。*

### 示例：数据库事务
- 始终将多个数据库操作包装在事务中
- 记得在错误时处理回滚
- 不要忘记在 finally 块中关闭连接

---

## 架构决策

*记录关键架构决策及其理由。*

### 示例：状态管理
- **决策**：全局状态使用 Zustand，组件树使用 React Context
- **理由**：Zustand 提供比 Redux 更好的性能和更简单的 API
- **权衡**：生态工具比 Redux 少，但对我们来说足够

---

## 注意事项

- 保持条目简洁且可操作
- 删除不再相关的模式
- 随着项目发展更新模式
- 聚焦于此项目特有的内容
