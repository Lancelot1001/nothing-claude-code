---
inclusion: auto
description: Security best practices including mandatory checks, secret management, and security response protocol.
---

# 安全指南

## 强制安全检查

**任何提交前：**
- [ ] 无硬编码 secret（API key、密码、token）
- [ ] 所有用户输入已验证
- [ ] SQL 注入防护（参数化查询）
- [ ] XSS 防护（净化 HTML）
- [ ] CSRF 保护已启用
- [ ] 认证/授权已验证
- [ ] 所有端点有速率限制
- [ ] 错误消息不泄露敏感数据

## Secret Management

- 绝不将 secret 硬编码到源代码
- 始终使用环境变量或 secret manager
- 启动时验证必需的 secret 存在
- 轮换任何可能已暴露的 secret

## 安全响应协议

发现安全问题时的步骤：
1. 立即停止
2. 使用 **security-reviewer** agent
3. 修复 CRITICAL 问题后再继续
4. 轮换任何已暴露的 secret
5. 审查整个代码库是否有类似问题
