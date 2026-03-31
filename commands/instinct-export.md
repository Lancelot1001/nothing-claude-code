---
name: instinct-export
description: 将 instinct 从项目/全局范围导出到文件
command: /instinct-export
---

# Instinct 导出命令

将 instinct 导出为可共享格式。适用于：
- 与团队成员分享
- 传输到新机器
- 为项目约定做贡献

## 使用方法

```
/instinct-export                           # 导出所有个人 instinct
/instinct-export --domain testing          # 仅导出 testing instinct
/instinct-export --min-confidence 0.7      # 仅导出高置信度 instinct
/instinct-export --output team-instincts.yaml
/instinct-export --scope project --output project-instincts.yaml
```

## 执行步骤

1. 检测当前项目上下文
2. 按选定范围加载 instinct：
   - `project`：仅当前项目
   - `global`：仅全局
   - `all`：项目 + 全局合并（默认）
3. 应用过滤器（`--domain`、`--min-confidence`）
4. 将 YAML 风格导出写入文件（如果没有提供输出路径则写入 stdout）

## 输出格式

创建 YAML 文件：

```yaml
# Instincts Export
# Generated: 2025-01-22
# Source: personal
# Count: 12 instincts

---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.8
domain: code-style
source: session-observation
scope: project
project_id: a1b2c3d4e5f6
project_name: my-app
---

# Prefer Functional Style

## Action
Use functional patterns over classes.
```

## 标志

- `--domain <名称>`：仅导出指定领域
- `--min-confidence <n>`：最低置信度阈值
- `--output <文件>`：输出文件路径（省略时打印到 stdout）
- `--scope <project|global|all>`：导出范围（默认：`all`）
