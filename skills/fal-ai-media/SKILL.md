---
name: fal-ai-media
description: 通过 fal.ai MCP 进行统一媒体生成——图像、视频和音频。涵盖文生图（Nano Banana）、图文生视频（Seedance、Kling、Veo 3）、文生语音（CSM-1B）以及视频生音频（ThinkSound）。当用户想要生成图像、视频或音频时使用。
origin: nothing-claude-code
---

# fal.ai 媒体生成

通过 MCP 使用 fal.ai 模型生成图像、视频和音频。

## 何时激活

- 用户想要根据文本提示生成图像
- 根据文本或图像创建视频
- 生成语音、音乐或音效
- 任何媒体生成任务
- 用户说"生成图像"、"创建视频"、"文本转语音"、"制作缩略图"或类似的话

## MCP 依赖

必须配置 fal.ai MCP server。在 `~/.claude.json` 中添加：

```json
"fal-ai": {
  "command": "npx",
  "args": ["-y", "fal-ai-mcp-server"],
  "env": { "FAL_KEY": "YOUR_FAL_KEY_HERE" }
}
```

在 [fal.ai](https://fal.ai) 获取 API 密钥。

## MCP 工具

fal.ai MCP 提供以下工具：
- `search` — 按关键词搜索可用模型
- `find` — 获取模型详情和参数
- `generate` — 使用参数运行模型
- `result` — 检查异步生成状态
- `status` — 检查作业状态
- `cancel` — 取消正在运行的作业
- `estimate_cost` — 估算生成成本
- `models` — 列出热门模型
- `upload` — 上传文件作为输入

---

## 图像生成

### Nano Banana 2（快速）
适用场景：快速迭代、草稿、文生图、图像编辑。

```
generate(
  app_id: "fal-ai/nano-banana-2",
  input_data: {
    "prompt": "a futuristic cityscape at sunset, cyberpunk style",
    "image_size": "landscape_16_9",
    "num_images": 1,
    "seed": 42
  }
)
```

### Nano Banana Pro（高保真）
适用场景：生产级图像、写实风格、Typography、详细提示词。

```
generate(
  app_id: "fal-ai/nano-banana-pro",
  input_data: {
    "prompt": "professional product photo of wireless headphones on marble surface, studio lighting",
    "image_size": "square",
    "num_images": 1,
    "guidance_scale": 7.5
  }
)
```

### 常用图像参数

| 参数 | 类型 | 选项 | 说明 |
|------|------|------|------|
| `prompt` | string | 必填 | 描述你想要的内容 |
| `image_size` | string | `square`、`portrait_4_3`、`landscape_16_9`、`portrait_16_9`、`landscape_4_3` | 宽高比 |
| `num_images` | number | 1-4 | 生成数量 |
| `seed` | number | 任意整数 | 可复现性 |
| `guidance_scale` | number | 1-20 | 对提示词的遵循程度（越高越严格） |

### 图像编辑
将 Nano Banana 2 与输入图像结合使用，进行修复、扩展或风格迁移：

```
# 首先上传源图像
upload(file_path: "/path/to/image.png")

# 然后使用图像输入生成
generate(
  app_id: "fal-ai/nano-banana-2",
  input_data: {
    "prompt": "same scene but in watercolor style",
    "image_url": "<uploaded_url>",
    "image_size": "landscape_16_9"
  }
)
```

---

## 视频生成

### Seedance 1.0 Pro（字节跳动）
适用场景：文生视频、高运动质量的图生视频。

```
generate(
  app_id: "fal-ai/seedance-1-0-pro",
  input_data: {
    "prompt": "a drone flyover of a mountain lake at golden hour, cinematic",
    "duration": "5s",
    "aspect_ratio": "16:9",
    "seed": 42
  }
)
```

### Kling Video v3 Pro
适用场景：原生音频生成的图文生视频。

```
generate(
  app_id: "fal-ai/kling-video/v3/pro",
  input_data: {
    "prompt": "ocean waves crashing on a rocky coast, dramatic clouds",
    "duration": "5s",
    "aspect_ratio": "16:9"
  }
)
```

### Veo 3（Google DeepMind）
适用场景：带生成音效的视频、高视觉质量。

```
generate(
  app_id: "fal-ai/veo-3",
  input_data: {
    "prompt": "a bustling Tokyo street market at night, neon signs, crowd noise",
    "aspect_ratio": "16:9"
  }
)
```

### 图生视频
从现有图像开始：

```
generate(
  app_id: "fal-ai/seedance-1-0-pro",
  input_data: {
    "prompt": "camera slowly zooms out, gentle wind moves the trees",
    "image_url": "<uploaded_image_url>",
    "duration": "5s"
  }
)
```

### 视频参数

| 参数 | 类型 | 选项 | 说明 |
|------|------|------|------|
| `prompt` | string | 必填 | 描述视频内容 |
| `duration` | string | `"5s"`、`"10s"` | 视频长度 |
| `aspect_ratio` | string | `"16:9"`、`"9:16"`、`"1:1"` | 画面比例 |
| `seed` | number | 任意整数 | 可复现性 |
| `image_url` | string | URL | 图生视频的源图像 |

---

## 音频生成

### CSM-1B（对话语音）
具有自然对话质量的文本转语音。

```
generate(
  app_id: "fal-ai/csm-1b",
  input_data: {
    "text": "Hello, welcome to the demo. Let me show you how this works.",
    "speaker_id": 0
  }
)
```

### ThinkSound（视频生音频）
根据视频内容生成匹配音频。

```
generate(
  app_id: "fal-ai/thinksound",
  input_data: {
    "video_url": "<video_url>",
    "prompt": "ambient forest sounds with birds chirping"
  }
)
```

### ElevenLabs（通过 API，无 MCP）
如需专业语音合成，直接使用 ElevenLabs：

```python
import os
import requests

resp = requests.post(
    "https://api.elevenlabs.io/v1/text-to-speech/<voice_id>",
    headers={
        "xi-api-key": os.environ["ELEVENLABS_API_KEY"],
        "Content-Type": "application/json"
    },
    json={
        "text": "Your text here",
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
)
with open("output.mp3", "wb") as f:
    f.write(resp.content)
```

### VideoDB 生成式音频
如已配置 VideoDB，使用其生成式音频功能：

```python
# 语音生成
audio = coll.generate_voice(text="Your narration here", voice="alloy")

# 音乐生成
music = coll.generate_music(prompt="upbeat electronic background music", duration=30)

# 音效
sfx = coll.generate_sound_effect(prompt="thunder crack followed by rain")
```

---

## 成本估算

生成前检查预估成本：

```
estimate_cost(
  estimate_type: "unit_price",
  endpoints: {
    "fal-ai/nano-banana-pro": {
      "unit_quantity": 1
    }
  }
)
```

## 模型发现

查找特定任务的模型：

```
search(query: "text to video")
find(endpoint_ids: ["fal-ai/seedance-1-0-pro"])
models()
```

## 技巧

- 使用 `seed` 以在迭代提示词时获得可复现的结果
- 先使用低成本模型（Nano Banana 2）进行提示词迭代，确定后再切换到 Pro 版本
- 对于视频，保持提示词描述性强但简洁——专注于动作和场景
- 图生视频比纯文生视频能产生更可控的结果
- 在运行昂贵的视频生成前，先检查 `estimate_cost`

## 相关skill

- `videodb` — 视频处理、编辑和流媒体
- `video-editing` — AI 驱动的视频编辑workflow
- `content-engine` — 社交平台内容创作
