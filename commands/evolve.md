---
name: evolve
description: 分析 instinct 并建议或生成进化后的结构
command: true
---

# Evolve 命令

## 实现

使用插件根路径运行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未设置（手动安装）：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

分析 instinct 并将相关的 instinct 聚类为更高级别的结构：
- **命令**：当 instinct 描述用户调用的操作时
- **skill**：当 instinct 描述自动触发的行为时
- **agent**：当 instinct 描述复杂的、多步骤的过程时

## 使用方法

```
/evolve                    # 分析所有 instinct 并建议进化
/evolve --generate         # 也在 evolved/{skills,commands,agents} 下生成文件
```

## 进化规则

### → 命令（用户调用）

当 instinct 描述用户会明确请求的操作时：
- 多个关于"当用户要求..."的 instinct
- 触发条件如"当创建新 X 时"的 instinct
- 遵循可重复序列的 instinct

例如：
- `new-table-step1`："当添加数据库表时，创建迁移"
- `new-table-step2`："当添加数据库表时，更新模式"
- `new-table-step3`："当添加数据库表时，重新生成类型"

→ 创建：**new-table** 命令

### → skill（自动触发）

当 instinct 描述应该自动发生的行为时：
- 模式匹配触发器
- 错误处理响应
- 代码风格强制

例如：
- `prefer-functional`："当编写函数时，首选函数式风格"
- `use-immutable`："当修改状态时，使用不可变模式"
- `avoid-classes`："当设计模块时，避免基于类的设计"

→ 创建：`functional-patterns` skill

### → agent（需要深度/隔离）

当 instinct 描述复杂的、多步骤的过程且受益于隔离时：
- 调试workflow process
- 重构序列
- 研究任务

例如：
- `debug-step1`："当调试时，首先检查日志"
- `debug-step2`："当调试时，隔离失败的组件"
- `debug-step3`："当调试时，创建最小复现"
- `debug-step4`："当调试时，用测试验证修复"

→ 创建：**debugger** agent

## 执行步骤

1. 检测当前项目上下文
2. 读取项目 + 全局 instinct（ID 冲突时项目优先）
3. 按触发器/域模式对 instinct 进行分组
4. 识别：
   - skill候选（2+ instinct 的触发器聚类）
   - 命令候选（高置信度workflow instinct）
   - agent候选（更大、高置信度聚类）
5. 显示晋升候选（项目 → 全局）当适用时
6. 如果传递了 `--generate`，将文件写入：
   - 项目范围：`~/.claude/homunculus/projects/<project-id>/evolved/`
   - 全局后备：`~/.claude/homunculus/evolved/`

## 输出格式

```
============================================================
  进化分析 - 12 个 instinct
  项目：my-app (a1b2c3d4e5f6)
  项目范围：8 | 全局：4
============================================================

高置信度 instinct (>=80%)：5

## skill候选
1. 聚类："添加测试"
   Instinct：3
   平均置信度：82%
   领域：测试
   范围：项目

## 命令候选 (2)
  /adding-tests
    来源：test-first-workflow [项目]
    置信度：84%

## agent候选 (1)
  adding-tests-agent
    覆盖 3 个 instinct
    平均置信度：82%
```

## 标志

- `--generate`：除了分析输出外，还生成进化后的文件

## 生成的文件格式

### 命令
```markdown
---
name: new-table
description: 创建新数据库表，包含迁移、模式更新和类型生成
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# New Table 命令

[基于聚类 instinct 的生成内容]

## 步骤
1. ...
2. ...
```

### skill
```markdown
---
name: functional-patterns
description: 强制执行函数式编程模式
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Functional Patterns skill

[基于聚类 instinct 的生成内容]
```

### agent
```markdown
---
name: debugger
description: 系统化调试agent
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Debugger agent

[基于聚类 instinct 的生成内容]
```
