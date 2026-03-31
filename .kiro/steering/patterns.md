---
inclusion: auto
description: Common design patterns including repository pattern, API response format, and skeleton project approach
---

# 通用模式

## Skeleton Projects

实现新功能时：
1. 搜索经过实战测试的 skeleton projects
2. 使用并行 agents 评估选项：
   - 安全评估
   - 可扩展性分析
   - 相关性评分
   - 实施规划
3. 克隆最佳匹配作为基础
4. 在经过验证的结构内迭代

## 设计模式

### Repository 模式

将数据访问封装在一致的接口后：
- 定义标准操作：findAll、findById、create、update、delete
- 具体实现处理存储细节（数据库、API、文件等）
- 业务逻辑依赖抽象接口，而非存储机制
- 使数据源易于切换，并通过 mock 简化测试

### API 响应格式

所有 API 响应使用一致的 envelope：
- 包含 success/status 指示器
- 包含数据 payload（错误时为 nullable）
- 包含错误消息字段（成功时为 nullable）
- 分页响应包含 metadata（total、page、limit）
