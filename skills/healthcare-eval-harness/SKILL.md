---
name: healthcare-eval-harness
description: 医疗应用程序部署的患者安全评估工具。用于 CDSS 准确性、PHI 暴露、临床工作流完整性和集成合规性的自动化测试套件。在安全失败时阻止部署。
origin: Health1 Super Speciality Hospitals — contributed by Dr. Keyur Patel
version: "1.0.0"
---

# 医疗评估工具——患者安全验证

医疗应用程序部署的自动化验证系统。单个危重失败阻止部署。患者安全是不可妥协的。

> **注意**：示例使用 Jest 作为参考测试运行器。调整命令以适应你的框架（Vitest、pytest、PHPUnit 等）——测试类别和通过阈值是与框架无关的。

## 何时使用

- EMR/EHR 应用程序的任何部署前
- 修改 CDSS 逻辑后（药物相互作用、剂量验证、评分）
- 修改触及患者数据的数据库 schema 后
- 修改身份验证或访问控制后
- 在医疗应用 CI/CD 管道配置期间
- 在临床模块中解决合并冲突后

## 工作原理

评估工具按顺序运行五类测试。前三类（CDSS 准确性、PHI 暴露、数据完整性）是危重门控，要求 100% 通过率——单次失败阻止部署。剩余两类（临床工作流、集成）是高级门控，要求 95%+ 通过率。

每个类别映射到 Jest 测试路径模式。CI 管道使用 `--bail` 运行危重门控（首次失败停止）并用 `--coverage --coverageThreshold` 强制覆盖率阈值。

### 评估类别

**1. CDSS 准确性（危重——要求 100%）**

测试所有临床决策支持逻辑：药物相互作用对（双向）、剂量验证规则、临床评分与发布规范对比、无假阴性、无静默失败。

```bash
npx jest --testPathPattern='tests/cdss' --bail --ci --coverage
```

**2. PHI 暴露（危重——要求 100%）**

测试受保护健康信息泄漏：API 错误响应、控制台输出、URL 参数、浏览器存储、跨设施隔离、未认证访问、服务角色密钥缺失。

```bash
npx jest --testPathPattern='tests/security/phi' --bail --ci
```

**3. 数据完整性（危重——要求 100%）**

测试临床数据安全：锁定就诊、审计跟踪条目、级联删除保护、并发编辑处理、无孤立记录。

```bash
npx jest --testPathPattern='tests/data-integrity' --bail --ci
```

**4. 临床工作流（高级——要求 95%+）**

测试端到端流程：就诊生命周期、模板渲染、药物集、药物/诊断搜索、处方 PDF、红旗警报。

```bash
tmp_json=$(mktemp)
npx jest --testPathPattern='tests/clinical' --ci --json --outputFile="$tmp_json" || true
total=$(jq '.numTotalTests // 0' "$tmp_json")
passed=$(jq '.numPassedTests // 0' "$tmp_json")
if [ "$total" -eq 0 ]; then
  echo "No clinical tests found" >&2
  exit 1
fi
rate=$(echo "scale=2; $passed * 100 / $total" | bc)
echo "Clinical pass rate: ${rate}% ($passed/$total)"
```

**5. 集成合规性（高级——要求 95%+）**

测试外部系统：HL7 消息解析（v2.x）、FHIR 验证、实验室结果映射、畸形消息处理。

```bash
tmp_json=$(mktemp)
npx jest --testPathPattern='tests/integration' --ci --json --outputFile="$tmp_json" || true
total=$(jq '.numTotalTests // 0' "$tmp_json")
passed=$(jq '.numPassedTests // 0' "$tmp_json")
if [ "$total" -eq 0 ]; then
  echo "No integration tests found" >&2
  exit 1
fi
rate=$(echo "scale=2; $passed * 100 / $total" | bc)
echo "Integration pass rate: ${rate}% ($passed/$total)"
```

### 通过/失败矩阵

| 类别 | 阈值 | 失败时 |
|------|------|--------|
| CDSS 准确性 | 100% | **阻止部署** |
| PHI 暴露 | 100% | **阻止部署** |
| 数据完整性 | 100% | **阻止部署** |
| 临床工作流 | 95%+ | 警告，审查后允许 |
| 集成 | 95%+ | 警告，审查后允许 |

### CI/CD 集成

```yaml
name: Healthcare Safety Gate
on: [push, pull_request]

jobs:
  safety-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      # 危重门控——要求 100%，首次失败停止
      - name: CDSS Accuracy
        run: npx jest --testPathPattern='tests/cdss' --bail --ci --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'

      - name: PHI Exposure Check
        run: npx jest --testPathPattern='tests/security/phi' --bail --ci

      - name: Data Integrity
        run: npx jest --testPathPattern='tests/data-integrity' --bail --ci

      # 高级门控——要求 95%+
      - name: Clinical Workflows
        run: |
          TMP_JSON=$(mktemp)
          npx jest --testPathPattern='tests/clinical' --ci --json --outputFile="$TMP_JSON" || true
          TOTAL=$(jq '.numTotalTests // 0' "$TMP_JSON")
          PASSED=$(jq '.numPassedTests // 0' "$TMP_JSON")
          if [ "$TOTAL" -eq 0 ]; then
            echo "::error::No clinical tests found"; exit 1
          fi
          RATE=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
          echo "Pass rate: ${RATE}% ($PASSED/$TOTAL)"
          if (( $(echo "$RATE < 95" | bc -l) )); then
            echo "::warning::Clinical pass rate ${RATE}% below 95%"
          fi

      - name: Integration Compliance
        run: |
          TMP_JSON=$(mktemp)
          npx jest --testPathPattern='tests/integration' --ci --json --outputFile="$TMP_JSON" || true
          TOTAL=$(jq '.numTotalTests // 0' "$TMP_JSON")
          PASSED=$(jq '.numPassedTests // 0' "$TMP_JSON")
          if [ "$TOTAL" -eq 0 ]; then
            echo "::error::No integration tests found"; exit 1
          fi
          RATE=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
          echo "Pass rate: ${RATE}% ($PASSED/$TOTAL)"
          if (( $(echo "$RATE < 95" | bc -l) )); then
            echo "::warning::Integration pass rate ${RATE}% below 95%"
          fi
```

### 反模式

- "因为上次通过了"就跳过 CDSS 测试
- 将危重阈值设置低于 100%
- 在危重测试套件上使用 `--no-bail`
- 在集成测试中 mock CDSS 引擎（必须测试真实逻辑）
- 在安全门控为红时允许部署
- 运行测试时 CDSS 套件不使用 `--coverage`

## 示例

### 示例 1：本地运行所有危重门控

```bash
npx jest --testPathPattern='tests/cdss' --bail --ci --coverage && \
npx jest --testPathPattern='tests/security/phi' --bail --ci && \
npx jest --testPathPattern='tests/data-integrity' --bail --ci
```

### 示例 2：检查高级门控通过率

```bash
tmp_json=$(mktemp)
npx jest --testPathPattern='tests/clinical' --ci --json --outputFile="$tmp_json" || true
jq '{
  passed: (.numPassedTests // 0),
  total: (.numTotalTests // 0),
  rate: (if (.numTotalTests // 0) == 0 then 0 else ((.numPassedTests // 0) / (.numTotalTests // 1) * 100) end)
}' "$tmp_json"
# 预期：{ "passed": 21, "total": 22, "rate": 95.45 }
```

### 示例 3：评估报告

```
## Healthcare Eval: 2026-03-27 [commit abc1234]

### Patient Safety: PASS

| Category | Tests | Pass | Fail | Status |
|----------|-------|------|------|--------|
| CDSS Accuracy | 39 | 39 | 0 | PASS |
| PHI Exposure | 8 | 8 | 0 | PASS |
| Data Integrity | 12 | 12 | 0 | PASS |
| Clinical Workflow | 22 | 21 | 1 | 95.5% PASS |
| Integration | 6 | 6 | 0 | PASS |

### Coverage: 84% (target: 80%+)
### Verdict: SAFE TO DEPLOY
```
