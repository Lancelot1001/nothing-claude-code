---
name: crosspost
description: 跨 X、LinkedIn、Threads 和 Bluesky 的多平台内容分发。使用 content-engine 模式为每个平台适配内容。绝不跨平台发布相同内容。当用户想要在社交平台上分发内容时使用。
origin: nothing-claude-code
---

# 跨平台发布

通过平台原生适配在多个社交平台上分发内容。

## 何时激活

- 用户想要在多个平台发布内容
- 在社交媒体上发布公告、发布或更新
- 将一个平台上的帖子重新用于其他平台
- 用户说"crosspost"、"post everywhere"、"share on all platforms"或"distribute this"

## 核心规则

1. **永远不要跨平台发布相同内容。** 每个平台获得原生适配。
2. **首先发布到主要平台。** 先发布到主要平台，然后为其他平台适配。
3. **尊重平台惯例。** 长度限制、格式、链接处理都不同。
4. **每个帖子一个想法。** 如果源内容有多个想法，请拆分到多个帖子。
5. **归属很重要。** 如果转发了别人的内容，请注明来源。

## 平台规格

| 平台 | 最大长度 | 链接处理 | 话题标签 | 媒体 |
|----------|-----------|---------------|----------|-------|
| X | 280 字符（Premium 为 4000） |计入长度 | 尽量少（最多 1-2 个） | 图片、视频、GIF |
| LinkedIn | 3000 字符 |不计入长度 | 3-5 个相关 | 图片、视频、文档、轮播 |
| Threads | 500 字符 | 单独链接附件 | 通常无 | 图片、视频 |
| Bluesky | 300 字符 | 通过 facets（富文本） | 无（使用 feeds） | 图片 |

## workflow process

### 步骤 1：创建源内容

从核心想法开始。使用 `content-engine` skill获取高质量草稿：
- 确定单一核心信息
- 确定主要平台（受众最大的平台）
- 首先起草主要平台版本

### 步骤 2：确定目标平台

询问用户或从上下文确定：
- 目标哪些平台
- 优先级顺序（主要平台获得最佳版本）
- 任何平台特定要求（例如 LinkedIn 需要专业语气）

### 步骤 3：为每个平台适配

对于每个目标平台，转换内容：

**X 适配：**
- 用钩子开头，而不是摘要
- 快速切入核心见解
- 尽可能将链接放在正文之外
- 对较长内容使用主题帖格式

**LinkedIn 适配：**
- 强有力的第一行（"查看更多"之前可见）
- 短段落，带换行
- 围绕经验、成果或专业收获进行框架构建
- 比 X 更需要明确的上下文（LinkedIn 受众需要框架）

**Threads 适配：**
- 对话式、随意语气
- 比 LinkedIn 短，比 X 压缩少
- 尽可能视觉优先

**Bluesky 适配：**
- 直接且简洁（300 字符限制）
- 社区导向语气
- 使用 feeds/lists 进行主题定位而不是话题标签

### 步骤 4：在主要平台发布

首先在主要平台发布：
- 使用 `x-api` skill发布 X
- 使用平台特定 API 或工具发布其他平台
- 捕获帖子 URL 以便交叉引用

### 步骤 5：在次要平台发布

在剩余平台发布适配版本：
- 分开时间（不要一次全部——30-60 分钟间隔）
- 在适当的地方包含跨平台引用（"在 X 上的更长主题帖"等）

## 内容适配示例

### 源：产品发布

**X 版本：**
```
我们刚刚发布了 [功能]。

[它做的一件令人印象深刻的事]

[链接]
```

**LinkedIn 版本：**
```
很高兴分享：我们在 [公司] 刚刚发布了 [功能]。

这就是为什么它重要：

[2-3 个带上下文的短段落]

[对受众的收获]

[链接]
```

**Threads 版本：**
```
刚刚发布了一个很酷的东西——[功能]

[对它做什么的随意解释]

链接在简介里
```

### 源：技术见解

**X 版本：**
```
今天学到：[具体技术见解]

[为什么它重要，一句话]
```

**LinkedIn 版本：**
```
我一直使用的一个模式产生了真正的不同：

[带专业框架的技术见解]

[它如何适用于团队/组织]

#相关话题标签
```

## API 集成

### 批量跨平台发布服务（示例模式）
如果使用跨平台发布服务（例如 Postbridge、Buffer 或自定义 API），模式如下：

```python
import os
import requests

resp = requests.post(
    "https://your-crosspost-service.example/api/posts",
    headers={"Authorization": f"Bearer {os.environ['POSTBRIDGE_API_KEY']}"},
    json={
        "platforms": ["twitter", "linkedin", "threads"],
        "content": {
            "twitter": {"text": x_version},
            "linkedin": {"text": linkedin_version},
            "threads": {"text": threads_version}
        }
    },
    timeout=30,
)
resp.raise_for_status()
```

### 手动发布
如果没有 Postbridge，使用其原生 API 发布到每个平台：
- X：使用 `x-api` skill模式
- LinkedIn：LinkedIn API v2 配合 OAuth 2.0
- Threads：Threads API（Meta）
- Bluesky：AT Protocol API

## 质量门槛

发布前：
- [ ] 每个平台版本对该平台来说阅读自然
- [ ] 平台间没有相同内容
- [ ] 遵守长度限制
- [ ] 链接有效且放置得当
- [ ] 语气符合平台惯例
- [ ] 媒体大小对每个平台都正确

## 相关skill

- `content-engine` — 生成平台原生内容
- `x-api` — X/Twitter API 集成
