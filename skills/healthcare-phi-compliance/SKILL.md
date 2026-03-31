---
name: healthcare-phi-compliance
description: 医疗应用程序的受保护健康信息（PHI）和个人身份信息（PII）合规模式。涵盖数据分类、访问控制、审计跟踪、加密和常见泄漏向量。
origin: Health1 Super Speciality Hospitals — contributed by Dr. Keyur Patel
version: "1.0.0"
---

# 医疗 PHI/PII 合规模式

医疗应用程序中保护患者数据、临床医生数据和财务数据的模式。适用于 HIPAA（美国）、DISHA（印度）、GDPR（欧盟）和一般医疗数据保护。

## 何时使用

- 构建触及患者记录的任何功能
- 为临床系统实现访问控制或身份验证
- 为医疗数据设计数据库 schema
- 构建返回患者或临床医生数据的 API
- 实现审计跟踪或日志记录
- 审查代码的数据暴露漏洞
- 为多租户医疗系统设置行级安全（RLS）

## 工作原理

医疗数据保护在三个层级运作：**分类**（什么是敏感的）、**访问控制**（谁能看见）和**审计**（谁看见了）。

### 数据分类

**PHI（受保护健康信息）**——可识别患者且与其健康相关的任何数据：患者姓名、出生日期、地址、电话、电子邮件、国家 ID 号码（SSN、Aadhaar、NHS 号码）、病历号码、诊断、用药、实验室结果、影像、保险单和索赔详情、预约和入院记录，或上述任何组合。

**PII（患者非敏感数据）**在医疗系统中：临床医生/员工个人详情、医生费用结构和支付金额、员工薪资和银行详情、供应商付款信息。

### 访问控制：行级安全

```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 按设施限制访问
CREATE POLICY "staff_read_own_facility"
  ON patients FOR SELECT TO authenticated
  USING (facility_id IN (
    SELECT facility_id FROM staff_assignments
    WHERE user_id = auth.uid() AND role IN ('doctor','nurse','lab_tech','admin')
  ));

-- 审计日志：仅插入（防篡改）
CREATE POLICY "audit_insert_only" ON audit_log FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "audit_no_modify" ON audit_log FOR UPDATE USING (false);
CREATE POLICY "audit_no_delete" ON audit_log FOR DELETE USING (false);
```

### 审计跟踪

每次 PHI 访问或修改必须记录：

```typescript
interface AuditEntry {
  timestamp: string;
  user_id: string;
  patient_id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'print' | 'export';
  resource_type: string;
  resource_id: string;
  changes?: { before: object; after: object };
  ip_address: string;
  session_id: string;
}
```

### 常见泄漏向量

**错误消息：** 绝不将患者识别数据包含在抛给客户端的错误消息中。仅在服务器端记录详情。

**控制台输出：** 绝不记录完整患者对象。使用不透明内部记录 ID（UUID）——而非病历号码、国家 ID 或姓名。

**URL 参数：** 绝不将患者识别数据放在可能出现在日志或浏览器历史记录中的查询字符串或路径段中。仅使用不透明 UUID。

**浏览器存储：** 绝不将 PHI 存储在 localStorage 或 sessionStorage 中。PHI 仅保留在内存中，按需获取。

**服务角色密钥：** 绝不在客户端代码中使用 service_role 密钥。始终使用 anon/publishable 密钥，让 RLS 强制执行访问。

**日志和监控：** 绝不记录完整患者记录。仅使用不透明记录 ID（而非病历号码）。在发送到错误跟踪服务前清理堆栈跟踪。

### 数据库 Schema 标记

在 schema 级别标记 PHI/PII 列：

```sql
COMMENT ON COLUMN patients.name IS 'PHI: patient_name';
COMMENT ON COLUMN patients.dob IS 'PHI: date_of_birth';
COMMENT ON COLUMN patients.aadhaar IS 'PHI: national_id';
COMMENT ON COLUMN doctor_payouts.amount IS 'PII: financial';
```

### 部署检查清单

每次部署前：
- 错误消息或堆栈跟踪中无 PHI
- console.log/console.error 中无 PHI
- URL 参数中无 PHI
- 浏览器存储中无 PHI
- 客户端代码中无 service_role 密钥
- 所有 PHI/PII 表启用 RLS
- 所有数据修改有审计跟踪
- 配置了会话超时
- 所有 PHI 端点有 API 身份验证
- 验证跨设施数据隔离

## 示例

### 示例 1：安全 vs 不安全错误处理

```typescript
// 差——在错误中泄漏 PHI
throw new Error(`Patient ${patient.name} not found in ${patient.facility}`);

// 好——通用错误，仅使用不透明 ID 在服务器端记录详情
logger.error('Patient lookup failed', { recordId: patient.id, facilityId });
throw new Error('Record not found');
```

### 示例 2：多设施隔离的 RLS 策略

```sql
-- 设施 A 的医生不能查看设施 B 的患者
CREATE POLICY "facility_isolation"
  ON patients FOR SELECT TO authenticated
  USING (facility_id IN (
    SELECT facility_id FROM staff_assignments WHERE user_id = auth.uid()
  ));

-- 测试：以医生身份登录设施 A，查询设施 B 患者
-- 预期：返回 0 行
```

### 示例 3：安全日志

```typescript
// 差——记录可识别患者数据
console.log('Processing patient:', patient);

// 好——仅记录不透明内部记录 ID
console.log('Processing record:', patient.id);
// 注意：即使 patient.id 也应该是透明 UUID，而非病历号码
```
