---
name: click-path-audit
description: "追踪每个面向用户的按钮/触点及其完整的状态变化序列，以发现以下 bug：函数单独工作但相互取消、产生错误的最终状态或使 UI 处于不一致状态。使用时机：系统性调试未发现 bug 但用户报告按钮坏了，或者在任何涉及共享状态存储的重大重构之后。"
origin: nothing-claude-code
---

# /click-path-audit — 行为流审计

发现静态代码阅读遗漏的 bug：状态交互副作用、顺序调用之间的竞态条件，以及静默相互撤销的处理函数。

## 此skill解决的问题

传统调试检查：
- 函数存在吗？（连线缺失）
- 它崩溃了吗？（运行时错误）
- 它返回正确的类型了吗？（数据流）

但它不检查：
- **最终 UI 状态与按钮标签承诺的一致吗？**
- **函数 B 是否静默撤销了函数 A 刚做的事？**
- **共享状态（Zustand/Redux/context）是否有取消预期操作的副作用？**

真实案例：一个「新邮件」按钮调用了 `setComposeMode(true)` 然后 `selectThread(null)`。两者单独都工作。但 `selectThread` 有一个副作用，即将 `composeMode: false` 重置。按钮什么也没做。系统性调试发现了 54 个 bug — 这个被遗漏了。

---

## 工作原理

对于目标区域中的每个交互式触点：

```
1. 识别处理函数（onClick、onSubmit、onChange 等）
2. 按顺序追踪处理函数中的每个函数调用
3. 对于每个函数调用：
   a. 它读取什么状态？
   b. 它写入什么状态？
   c. 它对共享状态有副作用吗？
   d. 它作为副作用重置/清除任何状态吗？
4. 检查：后面的调用是否撤销了早期调用的状态变化？
5. 检查：最终状态是用户从按钮标签期望的吗？
6. 检查：是否存在竞态条件（以错误顺序解析的异步调用）？
```

---

## 执行步骤

### 步骤 1：映射状态存储

在审计任何触点之前，为每个状态存储动作构建副作用映射：

```
对于范围内的每个 Zustand store / React context：
  对于每个 action/setter：
    - 它设置哪些字段？
    - 它作为副作用重置其他字段吗？
    - 记录：actionName → {sets: [...], resets: [...]}
```

这是关键的参考。如果没有知道 `selectThread` 重置 `composeMode`，「新邮件」bug 就不会被发现。

**输出格式：**
```
STORE: emailStore
  setComposeMode(bool) → sets: {composeMode}
  selectThread(thread|null) → sets: {selectedThread, selectedThreadId, messages, drafts, selectedDraft, summary} RESETS: {composeMode: false, composeData: null, redraftOpen: false}
  setDraftGenerating(bool) → sets: {draftGenerating}
  ...

危险的重置（清除它们不拥有的状态的动作）：
  selectThread → 重置 composeMode（由 setComposeMode 拥有）
  reset → 重置一切
```

### 步骤 2：审计每个触点

对于目标区域中的每个按钮/开关/表单提交：

```
TOUCHPOINT：[按钮标签] in [组件:行号]
  HANDLER: onClick → {
    调用 1: functionA() → sets {X: true}
    调用 2: functionB() → sets {Y: null} RESETS {X: false}  ← 冲突
  }
  预期：用户看到 [按钮标签承诺的内容描述]
  实际：X 为 false 因为 functionB 重置了它
  判断：BUG — [描述]
```

**检查以下每个 bug 模式：**

#### 模式 1：顺序撤销
```
handler() {
  setState_A(true)     // 设置 X = true
  setState_B(null)     // 副作用：重置 X = false
}
// 结果：X 为 false。第一次调用毫无意义。
```

#### 模式 2：异步竞态
```
handler() {
  fetchA().then(() => setState({ loading: false }))
  fetchB().then(() => setState({ loading: true }))
}
// 结果：最终的 loading 状态取决于哪个先解析
```

#### 模式 3：闭包过期
```
const [count, setCount] = useState(0)
const handler = useCallback(() => {
  setCount(count + 1)  // 捕获过期的 count
  setCount(count + 1)  // 同样的过期 count — 只增加了 1，而不是 2
}, [count])
```

#### 模式 4：缺失状态转换
```
// 按钮说「保存」但处理函数只验证，从不实际保存
// 按钮说「删除」但处理函数只设置标志而不调用 API
// 按钮说「发送」但 API 端点被移除/损坏了
```

#### 模式 5：条件死路径
```
handler() {
  if (someState) {        // someState 此时始终为 false
    doTheActualThing()    // 永远无法到达
  }
}
```

#### 模式 6：useEffect 干扰
```
// 按钮设置 stateX = true
// 一个 useEffect 监听 stateX 并将其重置为 false
// 用户看到什么都没发生
```

### 步骤 3：报告

对于发现的每个 bug：

```
CLICK-PATH-NNN：[严重性：CRITICAL/HIGH/MEDIUM/LOW]
  触点：[按钮标签] in [文件:行号]
  模式：[顺序撤销 / 异步竞态 / 闭包过期 / 缺失转换 / 死路径 / useEffect 干扰]
  处理函数：[函数名或内联]
  追踪：
    1. [调用] → sets {field: value}
    2. [调用] → RESETS {field: value}  ← 冲突
  预期：[用户期望的内容]
  实际：[实际发生的事情]
  修复：[具体修复]
```

---

## 范围控制

此审计成本高昂。适当限定范围：

- **全应用审计：** 在发布前或重大重构后使用。按页面启动并行agent。
- **单页审计：** 在构建新页面后或用户报告按钮损坏后使用。
- **存储聚焦审计：** 在修改 Zustand store 后使用 — 审计更改动作的所有消费者。

### 全应用审计的推荐agent分配：

```
agent 1：映射所有状态存储（步骤 1）— 这是所有其他agent的共享上下文
agent 2：仪表板（任务、笔记、日记、想法）
agent 3：聊天（DanteChatColumn、JustChatPage）
agent 4：邮件（ThreadList、DraftArea、EmailsPage）
agent 5：项目（ProjectsPage、ProjectOverviewTab、NewProjectWizard）
agent 6：CRM（所有子标签）
agent 7：个人资料、设置、保险库、通知
agent 8：管理套件（所有页面）
```

agent 1 必须首先完成。其输出是所有其他agent的输入。

---

## 何时使用

- 系统性调试发现「无 bug」但用户报告 UI 损坏后
- 修改任何 Zustand store 动作后（检查所有调用者）
- 任何涉及共享状态的重构后
- 发布前，在关键用户流程上
- 当按钮「什么都不做」时 — 这是专门处理此问题的工具

## 何时不使用

- 对于 API 级别的 bug（错误的响应形状、缺失的端点）— 使用 systematic-debugging
- 对于样式/布局问题 — 目视检查
- 对于性能问题 — 性能分析工具

---

## 与其他skill的集成

- 在 `/superpowers:systematic-debugging` 之后运行（发现其他 54 种 bug 类型）
- 在 `/superpowers:verification-before-completion` 之前运行（验证修复有效）
- 为 `/superpowers:test-driven-development` 提供输入 — 这里发现的每个 bug 都应该有一个测试

---

## 示例：启发此skill的 Bug

**ThreadList.tsx「新邮件」按钮：**
```
onClick={() => {
  useEmailStore.getState().setComposeMode(true)   // ✓ 设置 composeMode = true
  useEmailStore.getState().selectThread(null)      // ✗ 重置 composeMode = false
}}
```

Store 定义：
```
selectThread: (thread) => set({
  selectedThread: thread,
  selectedThreadId: thread?.id ?? null,
  messages: [],
  drafts: [],
  selectedDraft: null,
  summary: null,
  composeMode: false,     // ← 这个静默重置让按钮失效
  composeData: null,
  redraftOpen: false,
})
```

**系统性调试遗漏了它，因为：**
- 按钮有 onClick 处理函数（不是死的）
- 两个函数都存在（没有连线缺失）
- 两个函数都不崩溃（没有运行时错误）
- 数据类型是正确的（没有类型不匹配）

**click-path 审计捕获了它，因为：**
- 步骤 1 映射出 `selectThread` 重置 `composeMode`
- 步骤 2 追踪处理函数：调用 1 设置为 true，调用 2 重置为 false
- 判断：顺序撤销 — 最终状态与按钮意图矛盾
