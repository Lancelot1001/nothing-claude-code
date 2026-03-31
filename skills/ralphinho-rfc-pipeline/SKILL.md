---
name: ralphinho-rfc-pipeline
description: RFC 驱动的多agent DAG 执行模式，带质量门控、合并队列和工作单元编排。
origin: something-claude-code
---

# Ralphinho RFC 管道

灵感来自 [humanplane](https://github.com/humanplane) 风格的 RFC 分解模式和多单元编排workflow process。

当一个功能太大而无法在单次agent传递中完成，必须拆分为独立可验证的工作单元时，使用此skill。

## 管道阶段

1. RFC 接收
2. DAG 分解
3. 单元分配
4. 单元实施
5. 单元验证
6. 合并队列和集成
7. 最终系统验证

## 单元规格模板

每个工作单元应包括：
- `id`
- `depends_on`
- `scope`
- `acceptance_tests`
- `risk_level`
- `rollback_plan`

## 复杂度层级

- 层级 1：隔离的文件编辑、确定性测试
- 层级 2：多文件行为变更、中等集成风险
- 层级 3：模式/认证/性能/安全变更

## 每个单元的质量管道

1. 研究
2. 实施计划
3. 实施
4. 测试
5. 审查
6. 合并就绪报告

## 合并队列规则

- 永远不要合并有未解决依赖失败的单元。
- 始终在最新的集成分支上 rebase 单元分支。
- 每次排队合并后重新运行集成测试。

## 恢复

如果一个单元停滞：
- 从活动队列中驱逐
- 快照发现
- 重新生成缩小的单元范围
- 使用更新的约束重试

## 输出

- RFC 执行日志
- 单元记分卡
- 依赖图快照
- 集成风险摘要
