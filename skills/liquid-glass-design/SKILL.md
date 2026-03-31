---
name: liquid-glass-design
description: iOS 26 Liquid Glass 设计系统——为 SwiftUI、UIKit 和 WidgetKit 提供带有模糊、反射和交互变形的动态玻璃材质。
---

# Liquid Glass 设计系统（iOS 26）

实现 Apple Liquid Glass 的模式——一种动态材质，可模糊背后的内容，从周围内容反射颜色和光线，并对触摸和指针交互做出反应。涵盖 SwiftUI、UIKit 和 WidgetKit 集成。

## 何时激活

- 使用新设计语言构建或更新 iOS 26+ 应用
- 实现玻璃风格按钮、卡片、工具栏或容器
- 在玻璃元素之间创建变形转换
- 将 Liquid Glass 效果应用于 widgets
- 将现有模糊/材质效果迁移到新的 Liquid Glass API

## 核心模式——SwiftUI

### 基本玻璃效果

向任何视图添加 Liquid Glass 的最简单方法：

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect()  // 默认：常规变体，胶囊形状
```

### 自定义形状和色调

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect(.regular.tint(.orange).interactive(), in: .rect(cornerRadius: 16.0))
```

关键自定义选项：
- `.regular`——标准玻璃效果
- `.tint(Color)`——添加颜色色调以突出显示
- `.interactive()`——对触摸和指针交互做出反应
- 形状：`.capsule`（默认）、`.rect(cornerRadius:)`、`.circle`

### 玻璃按钮样式

```swift
Button("Click Me") { /* action */ }
    .buttonStyle(.glass)

Button("Important") { /* action */ }
    .buttonStyle(.glassProminent)
```

### 用于多个元素的 GlassEffectContainer

为性能和变形包装多个玻璃视图：

```swift
GlassEffectContainer(spacing: 40.0) {
    HStack(spacing: 40.0) {
        Image(systemName: "scribble.variable")
            .frame(width: 80.0, height: 80.0)
            .font(.system(size: 36))
            .glassEffect()

        Image(systemName: "eraser.fill")
            .frame(width: 80.0, height: 80.0)
            .font(.system(size: 36))
            .glassEffect()
    }
}
```

`spacing` 参数控制合并距离——更近的元素会将其玻璃形状融合在一起。

### 联合玻璃效果

使用 `glassEffectUnion` 将多个视图组合成单个玻璃形状：

```swift
@Namespace private var namespace

GlassEffectContainer(spacing: 20.0) {
    HStack(spacing: 20.0) {
        ForEach(symbolSet.indices, id: \.self) { item in
            Image(systemName: symbolSet[item])
                .frame(width: 80.0, height: 80.0)
                .glassEffect()
                .glassEffectUnion(id: item < 2 ? "group1" : "group2", namespace: namespace)
        }
    }
}
```

### 变形转换

在玻璃元素出现/消失时创建平滑变形：

```swift
@State private var isExpanded = false
@Namespace private var namespace

GlassEffectContainer(spacing: 40.0) {
    HStack(spacing: 40.0) {
        Image(systemName: "scribble.variable")
            .frame(width: 80.0, height: 80.0)
            .glassEffect()
            .glassEffectID("pencil", in: namespace)

        if isExpanded {
            Image(systemName: "eraser.fill")
                .frame(width: 80.0, height: 80.0)
                .glassEffect()
                .glassEffectID("eraser", in: namespace)
        }
    }
}

Button("Toggle") {
    withAnimation { isExpanded.toggle() }
}
.buttonStyle(.glass)
```

### 在侧边栏下方扩展水平滚动

要允许水平滚动内容在侧边栏或检查器下方扩展，请确保 `ScrollView` 内容到达容器的 leading/trailing 边缘。当布局扩展到边缘时，系统自动处理侧边栏下的滚动行为——无需额外的修饰符。

## 核心模式——UIKit

### 基本 UIGlassEffect

```swift
let glassEffect = UIGlassEffect()
glassEffect.tintColor = UIColor.systemBlue.withAlphaComponent(0.3)
glassEffect.isInteractive = true

let visualEffectView = UIVisualEffectView(effect: glassEffect)
visualEffectView.translatesAutoresizingMaskIntoConstraints = false
visualEffectView.layer.cornerRadius = 20
visualEffectView.clipsToBounds = true

view.addSubview(visualEffectView)
NSLayoutConstraint.activate([
    visualEffectView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    visualEffectView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    visualEffectView.widthAnchor.constraint(equalToConstant: 200),
    visualEffectView.heightAnchor.constraint(equalToConstant: 120)
])

// Add content to contentView
let label = UILabel()
label.text = "Liquid Glass"
label.translatesAutoresizingMaskIntoConstraints = false
visualEffectView.contentView.addSubview(label)
NSLayoutConstraint.activate([
    label.centerXAnchor.constraint(equalTo: visualEffectView.contentView.centerXAnchor),
    label.centerYAnchor.constraint(equalTo: visualEffectView.contentView.centerYAnchor)
])
```

### 用于多个元素的 UIGlassContainerEffect

```swift
let containerEffect = UIGlassContainerEffect()
containerEffect.spacing = 40.0

let containerView = UIVisualEffectView(effect: containerEffect)

let firstGlass = UIVisualEffectView(effect: UIGlassEffect())
let secondGlass = UIVisualEffectView(effect: UIGlassEffect())

containerView.contentView.addSubview(firstGlass)
containerView.contentView.addSubview(secondGlass)
```

### 滚动边缘效果

```swift
scrollView.topEdgeEffect.style = .automatic
scrollView.bottomEdgeEffect.style = .hard
scrollView.leftEdgeEffect.isHidden = true
```

### 工具栏玻璃集成

```swift
let favoriteButton = UIBarButtonItem(image: UIImage(systemName: "heart"), style: .plain, target: self, action: #selector(favoriteAction))
favoriteButton.hidesSharedBackground = true  // 选择退出共享玻璃背景
```

## 核心模式——WidgetKit

### 渲染模式检测

```swift
struct MyWidgetView: View {
    @Environment(\.widgetRenderingMode) var renderingMode

    var body: some View {
        if renderingMode == .accented {
            // 色调模式：白色色调，主题玻璃背景
        } else {
            // 全色模式：标准外观
        }
    }
}
```

### 用于视觉层级的强调组

```swift
HStack {
    VStack(alignment: .leading) {
        Text("Title")
            .widgetAccentable()  // 强调组
        Text("Subtitle")
            // 主要组（默认）
    }
    Image(systemName: "star.fill")
        .widgetAccentable()  // 强调组
}
```

### 强调模式下的图像渲染

```swift
Image("myImage")
    .widgetAccentedRenderingMode(.monochrome)
```

### 容器背景

```swift
VStack { /* content */ }
    .containerBackground(for: .widget) {
        Color.blue.opacity(0.2)
    }
```

## 关键设计决策

| 决策 | 理由 |
|----------|-----------|
| GlassEffectContainer 包装 | 性能优化，实现玻璃元素之间的变形 |
| `spacing` 参数 | 控制合并距离——微调元素需要多近才能融合 |
| `@Namespace` + `glassEffectID` | 实现视图层级变化时的平滑变形转换 |
| `interactive()` 修饰符 | 对触摸/指针反应的明确选择加入——并非所有玻璃都应该响应 |
| UIKit 中的 UIGlassContainerEffect | 与 SwiftUI 相同的容器模式以保持一致性 |
| Widget 中的强调渲染模式 | 当用户选择色调主屏幕时系统应用色调玻璃 |

## 最佳实践

- **在为多个同级视图应用玻璃时始终使用 GlassEffectContainer**——它支持变形并提高渲染性能
- **在其他外观修饰符之后应用 `.glassEffect()`**（frame、font、padding）
- **仅对响应用户交互的元素使用 `.interactive()`**（按钮、可切换项目）
- **仔细选择容器中的间距**以控制玻璃效果何时合并
- **在更改视图层级时使用 `withAnimation`** 以实现平滑的变形转换
- **跨外观测试**——浅色模式、深色模式和强调/色调模式
- **确保可访问性对比度**——玻璃上的文字必须保持可读

## 应避免的反模式

- 在没有 GlassEffectContainer 的情况下使用多个独立 `.glassEffect()` 视图
- 嵌套太多玻璃效果——降低性能和视觉清晰度
- 将玻璃应用于每个视图——保留用于交互元素、工具栏和卡片
- 在 UIKit 中使用圆角半径时忘记 `clipsToBounds = true`
- 忽略 widgets 中的强调渲染模式——破坏色调主屏幕外观
- 在玻璃后面使用不透明背景——破坏半透明效果

## 何时使用

- 使用新的 iOS 26 设计的导航栏、工具栏和标签栏
- 浮动操作按钮和卡片式容器
- 需要视觉深度和触摸反馈的交互控件
- 应该与系统 Liquid Glass 外观集成的 widgets
- 相关 UI 状态之间的变形转换
