---
name: healthcare-cdss-patterns
description: 临床决策支持系统（CDSS）开发模式。药物相互作用检查、剂量验证、临床评分（NEWS2、qSOFA）、警报严重性分类以及 EMR workflow集成。
origin: Health1 Super Speciality Hospitals — contributed by Dr. Keyur Patel
version: "1.0.0"
---

# 医疗 CDSS 开发模式

用于构建集成到 EMR workflow的临床决策支持系统的模式。CDSS 模块是患者安全关键——对假阴性零容忍。

## 何时使用

- 实现药物相互作用检查
- 构建剂量验证引擎
- 实现临床评分系统（NEWS2、qSOFA、APACHE、GCS）
- 为异常临床值设计警报系统
- 构建带安全检查的药物医嘱录入
- 将实验室结果解释与临床上下文集成

## 工作原理

CDSS 引擎是一个**无副作用的纯函数库**。输入临床数据，输出警报。这使其完全可测试。

三个主要模块：

1. **`checkInteractions(newDrug, currentMeds, allergies)`** — 检查新药与当前用药和已知过敏的相互作用。返回按严重性排序的 `InteractionAlert[]`。使用 `DrugInteractionPair` 数据模型。
2. **`validateDose(drug, dose, route, weight, age, renalFunction)`** — 根据体重、年龄和肾功能调整规则验证处方剂量。返回 `DoseValidationResult`。
3. **`calculateNEWS2(vitals)`** — 从 `NEWS2Input` 计算国家早期预警评分 2。返回包含总分、风险级别和升级指导的 `NEWS2Result`。

```
EMR UI
  ↓（用户输入数据）
CDSS 引擎（纯函数，无副作用）
  ├── 药物相互作用检查器
  ├── 剂量验证器
  ├── 临床评分（NEWS2、qSOFA 等）
  └── 警报分类器
  ↓（返回警报）
EMR UI（内联显示警报，危重则阻止）
```

### 药物相互作用检查

```typescript
interface DrugInteractionPair {
  drugA: string;           // 通用名
  drugB: string;           // 通用名
  severity: 'critical' | 'major' | 'minor';
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

function checkInteractions(
  newDrug: string,
  currentMedications: string[],
  allergyList: string[]
): InteractionAlert[] {
  if (!newDrug) return [];
  const alerts: InteractionAlert[] = [];
  for (const current of currentMedications) {
    const interaction = findInteraction(newDrug, current);
    if (interaction) {
      alerts.push({ severity: interaction.severity, pair: [newDrug, current],
        message: interaction.clinicalEffect, recommendation: interaction.recommendation });
    }
  }
  for (const allergy of allergyList) {
    if (isCrossReactive(newDrug, allergy)) {
      alerts.push({ severity: 'critical', pair: [newDrug, allergy],
        message: `Cross-reactivity with documented allergy: ${allergy}`,
        recommendation: 'Do not prescribe without allergy consultation' });
    }
  }
  return alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
}
```

相互作用对必须是**双向的**：如果药物 A 与药物 B 相互作用，则药物 B 也与药物 A 相互作用。

### 剂量验证

```typescript
interface DoseValidationResult {
  valid: boolean;
  message: string;
  suggestedRange: { min: number; max: number; unit: string } | null;
  factors: string[];
}

function validateDose(
  drug: string,
  dose: number,
  route: 'oral' | 'iv' | 'im' | 'sc' | 'topical',
  patientWeight?: number,
  patientAge?: number,
  renalFunction?: number
): DoseValidationResult {
  const rules = getDoseRules(drug, route);
  if (!rules) return { valid: true, message: 'No validation rules available', suggestedRange: null, factors: [] };
  const factors: string[] = [];

  // 安全：如果规则需要体重但缺少体重，则阻止（而非通过）
  if (rules.weightBased) {
    if (!patientWeight || patientWeight <= 0) {
      return { valid: false, message: `Weight required for ${drug} (mg/kg drug)`,
        suggestedRange: null, factors: ['weight_missing'] };
    }
    factors.push('weight');
    const maxDose = rules.maxPerKg * patientWeight;
    if (dose > maxDose) {
      return { valid: false, message: `Dose exceeds max for ${patientWeight}kg`,
        suggestedRange: { min: rules.minPerKg * patientWeight, max: maxDose, unit: rules.unit }, factors };
    }
  }

  // 年龄调整（当规则定义年龄 bracket 且提供年龄时）
  if (rules.ageAdjusted && patientAge !== undefined) {
    factors.push('age');
    const ageMax = rules.getAgeAdjustedMax(patientAge);
    if (dose > ageMax) {
      return { valid: false, message: `Exceeds age-adjusted max for ${patientAge}yr`,
        suggestedRange: { min: rules.typicalMin, max: ageMax, unit: rules.unit }, factors };
    }
  }

  // 肾功能调整（当规则定义 eGFR bracket 且提供 eGFR 时）
  if (rules.renalAdjusted && renalFunction !== undefined) {
    factors.push('renal');
    const renalMax = rules.getRenalAdjustedMax(renalFunction);
    if (dose > renalMax) {
      return { valid: false, message: `Exceeds renal-adjusted max for eGFR ${renalFunction}`,
        suggestedRange: { min: rules.typicalMin, max: renalMax, unit: rules.unit }, factors };
    }
  }

  // 绝对最大值
  if (dose > rules.absoluteMax) {
    return { valid: false, message: `Exceeds absolute max ${rules.absoluteMax}${rules.unit}`,
      suggestedRange: { min: rules.typicalMin, max: rules.absoluteMax, unit: rules.unit },
      factors: [...factors, 'absolute_max'] };
  }
  return { valid: true, message: 'Within range',
    suggestedRange: { min: rules.typicalMin, max: rules.typicalMax, unit: rules.unit }, factors };
}
```

### 临床评分：NEWS2

```typescript
interface NEWS2Input {
  respiratoryRate: number; oxygenSaturation: number; supplementalOxygen: boolean;
  temperature: number; systolicBP: number; heartRate: number;
  consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive';
}
interface NEWS2Result {
  total: number;           // 0-20
  risk: 'low' | 'low-medium' | 'medium' | 'high';
  components: Record<string, number>;
  escalation: string;
}
```

评分表必须完全匹配皇家医师学会的规范。

### 警报严重性和 UI 行为

| 严重性 | UI 行为 | 需要临床医生操作 |
|--------|---------|------------------|
| 危重 | 阻止操作。不可关闭模态框。红色。 | 必须记录覆盖原因才能继续 |
| 主要 | 内联警告横幅。橙色。 | 继续前必须确认 |
| 次要 | 内联信息备注。黄色。 | 仅需知晓，无需操作 |

危重警报绝对不能自动关闭或实现为 toast 通知。覆盖原因必须存储在审计跟踪中。

### 测试 CDSS（对假阴性零容忍）

```typescript
describe('CDSS — Patient Safety', () => {
  INTERACTION_PAIRS.forEach(({ drugA, drugB, severity }) => {
    it(`detects ${drugA} + ${drugB} (${severity})`, () => {
      const alerts = checkInteractions(drugA, [drugB], []);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe(severity);
    });
    it(`detects ${drugB} + ${drugA} (reverse)`, () => {
      const alerts = checkInteractions(drugB, [drugA], []);
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
  it('blocks mg/kg drug when weight is missing', () => {
    const result = validateDose('gentamicin', 300, 'iv');
    expect(result.valid).toBe(false);
    expect(result.factors).toContain('weight_missing');
  });
  it('handles malformed drug data gracefully', () => {
    expect(() => checkInteractions('', [], [])).not.toThrow();
  });
});
```

通过标准：100%。一次遗漏的相互作用即患者安全事件。

### 反模式

- 使 CDSS 检查可选或可跳过而无需记录原因
- 将相互作用检查实现为 toast 通知
- 对药物或临床数据使用 `any` 类型
- 硬编码相互作用对而非使用可维护的数据结构
- 在 CDSS 引擎中静默捕获错误（必须大声暴露失败）
- 当体重不可用时跳过基于体重的验证（必须阻止，而非通过）

## 示例

### 示例 1：药物相互作用检查

```typescript
const alerts = checkInteractions('warfarin', ['aspirin', 'metformin'], ['penicillin']);
// [{ severity: 'critical', pair: ['warfarin', 'aspirin'],
//    message: 'Increased bleeding risk', recommendation: 'Avoid combination' }]
```

### 示例 2：剂量验证

```typescript
const ok = validateDose('paracetamol', 1000, 'oral', 70, 45);
// { valid: true, suggestedRange: { min: 500, max: 4000, unit: 'mg' } }

const bad = validateDose('paracetamol', 5000, 'oral', 70, 45);
// { valid: false, message: 'Exceeds absolute max 4000mg' }

const noWeight = validateDose('gentamicin', 300, 'iv');
// { valid: false, factors: ['weight_missing'] }
```

### 示例 3：NEWS2 评分

```typescript
const result = calculateNEWS2({
  respiratoryRate: 24, oxygenSaturation: 93, supplementalOxygen: true,
  temperature: 38.5, systolicBP: 100, heartRate: 110, consciousness: 'voice'
});
// { total: 13, risk: 'high', escalation: 'Urgent clinical review. Consider ICU.' }
```
