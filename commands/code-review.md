# 代码审查

对未提交变更的全面安全和质量审查：

1. 获取变更文件：`git diff --name-only HEAD`

2. 对每个变更文件，检查：

**安全问题（CRITICAL）：**
- 硬编码凭证、API 密钥、Token
- SQL 注入漏洞
- XSS 漏洞
- 缺失输入验证
- 不安全依赖
- 路径遍历风险

**代码质量（HIGH）：**
- 函数 > 50 行
- 文件 > 800 行
- 嵌套深度 > 4 层
- 缺失错误处理
- console.log 语句
- TODO/FIXME 注释
- 公共 API 缺失 JSDoc

**最佳实践（MEDIUM）：**
- 变更模式（使用不可变替代）
- 代码/注释中使用 Emoji
- 新代码缺失测试
- 可访问性问题（a11y）

3. 生成报告，包含：
   - 严重程度：CRITICAL、HIGH、MEDIUM、LOW
   - 文件位置和行号
   - 问题描述
   - 建议修复

4. 如发现 CRITICAL 或 HIGH 问题，阻止提交

绝不批准有安全漏洞的代码！
