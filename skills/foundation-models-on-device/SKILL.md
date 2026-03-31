---
name: foundation-models-on-device
description: Apple FoundationModels 框架用于设备端 LLM——iOS 26+ 的文本生成、带 @Generable 的引导生成、工具调用和快照流式传输。
---

# FoundationModels：设备端 LLM（iOS 26）

使用 FoundationModels 框架将 Apple 设备端语言模型集成到应用程序中的模式。涵盖文本生成、带 `@Generable` 的结构化输出、自定义工具调用和快照流式传输——全部在设备上运行以保护隐私和支持离线。

## 何时激活

- 使用 Apple Intelligence 设备端 AI 功能构建
- 在不依赖云的情况下生成或总结文本
- 从自然语言输入中提取结构化数据
- 实现自定义工具调用以执行领域特定 AI 操作
- 流式传输结构化响应以进行实时 UI 更新
- 需要隐私保护的 AI（数据不离开设备）

## 核心模式——可用性检查

创建会话前始终检查模型可用性：

```swift
struct GenerativeView: View {
    private var model = SystemLanguageModel.default

    var body: some View {
        switch model.availability {
        case .available:
            ContentView()
        case .unavailable(.deviceNotEligible):
            Text("Device not eligible for Apple Intelligence")
        case .unavailable(.appleIntelligenceNotEnabled):
            Text("Please enable Apple Intelligence in Settings")
        case .unavailable(.modelNotReady):
            Text("Model is downloading or not ready")
        case .unavailable(let other):
            Text("Model unavailable: \(other)")
        }
    }
}
```

## 核心模式——基本会话

```swift
// 单轮：每次创建新会话
let session = LanguageModelSession()
let response = try await session.respond(to: "What's a good month to visit Paris?")
print(response.content)

// 多轮：复用会话以保持对话上下文
let session = LanguageModelSession(instructions: """
    You are a cooking assistant.
    Provide recipe suggestions based on ingredients.
    Keep suggestions brief and practical.
    """)

let first = try await session.respond(to: "I have chicken and rice")
let followUp = try await session.respond(to: "What about a vegetarian option?")
```

关于 instructions 的关键点：
- 定义模型角色（"You are a mentor"）
- 指定要做什么（"Help extract calendar events"）
- 设置样式偏好（"Respond as briefly as possible"）
- 添加安全措施（"Respond with 'I can't help with that' for dangerous requests"）

## 核心模式——使用 @Generable 的引导生成

生成结构化 Swift 类型而非原始字符串：

### 1. 定义 Generable 类型

```swift
@Generable(description: "Basic profile information about a cat")
struct CatProfile {
    var name: String

    @Guide(description: "The age of the cat", .range(0...20))
    var age: Int

    @Guide(description: "A one sentence profile about the cat's personality")
    var profile: String
}
```

### 2. 请求结构化输出

```swift
let response = try await session.respond(
    to: "Generate a cute rescue cat",
    generating: CatProfile.self
)

// 直接访问结构化字段
print("Name: \(response.content.name)")
print("Age: \(response.content.age)")
print("Profile: \(response.content.profile)")
```

### 支持的 @Guide 约束

- `.range(0...20)` — 数值范围
- `.count(3)` — 数组元素数量
- `description:` — 生成的语义指导

## 核心模式——工具调用

让模型调用自定义代码以执行领域特定任务：

### 1. 定义工具

```swift
struct RecipeSearchTool: Tool {
    let name = "recipe_search"
    let description = "Search for recipes matching a given term and return a list of results."

    @Generable
    struct Arguments {
        var searchTerm: String
        var numberOfResults: Int
    }

    func call(arguments: Arguments) async throws -> ToolOutput {
        let recipes = await searchRecipes(
            term: arguments.searchTerm,
            limit: arguments.numberOfResults
        )
        return .string(recipes.map { "- \($0.name): \($0.description)" }.joined(separator: "\n"))
    }
}
```

### 2. 使用工具创建会话

```swift
let session = LanguageModelSession(tools: [RecipeSearchTool()])
let response = try await session.respond(to: "Find me some pasta recipes")
```

### 3. 处理工具错误

```swift
do {
    let answer = try await session.respond(to: "Find a recipe for tomato soup.")
} catch let error as LanguageModelSession.ToolCallError {
    print(error.tool.name)
    if case .databaseIsEmpty = error.underlyingError as? RecipeSearchToolError {
        // 处理特定工具错误
    }
}
```

## 核心模式——快照流式传输

使用 `PartiallyGenerated` 类型流式传输结构化响应以进行实时 UI：

```swift
@Generable
struct TripIdeas {
    @Guide(description: "Ideas for upcoming trips")
    var ideas: [String]
}

let stream = session.streamResponse(
    to: "What are some exciting trip ideas?",
    generating: TripIdeas.self
)

for try await partial in stream {
    // partial: TripIdeas.PartiallyGenerated（所有属性都是可选的）
    print(partial)
}
```

### SwiftUI 集成

```swift
@State private var partialResult: TripIdeas.PartiallyGenerated?
@State private var errorMessage: String?

var body: some View {
    List {
        ForEach(partialResult?.ideas ?? [], id: \.self) { idea in
            Text(idea)
        }
    }
    .overlay {
        if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
    }
    .task {
        do {
            let stream = session.streamResponse(to: prompt, generating: TripIdeas.self)
            for try await partial in stream {
                partialResult = partial
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

## 关键设计决策

| 决策 | 理由 |
|------|------|
| 设备上执行 | 隐私——数据不离开设备；支持离线 |
| 4,096 token 限制 | 设备端模型限制；将大数据分块跨会话处理 |
| 快照流式传输（非增量） | 友好支持结构化输出；每个快照是完整的部分状态 |
| `@Generable` 宏 | 结构化生成的编译时安全；自动生成 `PartiallyGenerated` 类型 |
| 每次会话单个请求 | `isResponding` 防止并发请求；如需则创建多个会话 |
| `response.content`（非 `.output`） | 正确的 API——始终通过 `.content` 属性访问结果 |

## 最佳实践

- **始终检查 `model.availability`** 再创建会话——处理所有不可用情况
- **使用 `instructions`** 指导模型行为——它们优先于提示词
- **发送新请求前检查 `isResponding`** ——会话一次处理一个请求
- **访问 `response.content`** 获取结果——而非 `.output`
- **将大输入分块** ——4,096 token 限制适用于 instructions + prompt + output 的总和
- **使用 `@Generable`** 进行结构化输出——比解析原始字符串有更强保证
- **使用 `GenerationOptions(temperature:)`** 调整创造性（越高越有创造性）
- **使用 Instruments 监控** ——使用 Xcode Instruments 分析请求性能

## 应避免的反模式

- 在首先检查 `model.availability` 前创建会话
- 发送超过 4,096 token 上下文窗口的输入
- 尝试在单个会话上并发请求
- 使用 `.output` 而非 `.content` 访问响应数据
- 当 `@Generable` 结构化输出可行时解析原始字符串响应
- 在单个提示词中构建复杂的多步逻辑——分解为多个聚焦的提示词
- 假设模型始终可用——设备资格和设置各不相同

## 何时使用

- 隐私敏感应用的设备端文本生成
- 从用户输入中提取结构化数据（表单、自然语言命令）
- 必须离线工作的 AI 辅助功能
- 渐进显示生成内容的流式 UI
- 通过工具调用实现领域特定 AI 操作（搜索、计算、查询）
