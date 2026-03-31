# 生成式媒体指南

VideoDB 提供 AI 驱动的图像、视频、音乐、音效、语音和文本内容生成。所有生成方法都在 **Collection** 对象上。

## 前置条件

在调用任何生成方法之前，您需要连接和集合引用：

```python
import videodb

conn = videodb.connect()
coll = conn.get_collection()
```

## 图像生成

从文本提示生成图像：

```python
image = coll.generate_image(
    prompt="a futuristic cityscape at sunset with flying cars",
    aspect_ratio="16:9",
)

# 访问生成的图像
print(image.id)
print(image.generate_url())  # 返回签名下载 URL
```

### generate_image 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `prompt` | `str` | 必需 | 要生成的图像的文本描述 |
| `aspect_ratio` | `str` | `"1:1"` | 宽高比：`"1:1"`、`"9:16"`、`"16:9"`、`"4:3"` 或 `"3:4"` |
| `callback_url` | `str\|None` | `None` | 接收异步回调的 URL |

返回具有 `.id`、`.name` 和 `.collection_id` 的 `Image` 对象。对于生成的图像，`.url` 属性可能为 `None`——始终使用 `image.generate_url()` 获取可靠的签名下载 URL。

> **注意：** 与使用 `.generate_stream()` 的 `Video` 对象不同，`Image` 对象使用 `.generate_url()` 检索图像 URL。`.url` 属性仅针对某些图像类型填充（例如缩略图）。

## 视频生成

从文本提示生成短视频片段：

```python
video = coll.generate_video(
    prompt="a timelapse of a flower blooming in a garden",
    duration=5,
)

stream_url = video.generate_stream()
video.play()
```

### generate_video 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `prompt` | `str` | 必需 | 要生成的视频的文本描述 |
| `duration` | `int` | `5` | 时长（秒）（必须是整数值，5-8） |
| `callback_url` | `str\|None` | `None` | 接收异步回调的 URL |

返回 `Video` 对象。生成的视频会自动添加到集合中，可以像任何上传的视频一样用于时间线、搜索和合成。

## 音频生成

VideoDB 为不同音频类型提供了三种独立方法。

### 音乐

从文本描述生成背景音乐：

```python
music = coll.generate_music(
    prompt="upbeat electronic music with a driving beat, suitable for a tech demo",
    duration=30,
)

print(music.id)
```

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `prompt` | `str` | 必需 | 音乐的文本描述 |
| `duration` | `int` | `5` | 时长（秒） |
| `callback_url` | `str\|None` | `None` | 接收异步回调的 URL |

### 音效

生成特定音效：

```python
sfx = coll.generate_sound_effect(
    prompt="thunderstorm with heavy rain and distant thunder",
    duration=10,
)
```

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `prompt` | `str` | 必需 | 音效的文本描述 |
| `duration` | `int` | `2` | 时长（秒） |
| `config` | `dict` | `{}` | 其他配置 |
| `callback_url` | `str\|None` | `None` | 接收异步回调的 URL |

### 语音（文字转语音）

从文本生成语音：

```python
voice = coll.generate_voice(
    text="Welcome to our product demo. Today we'll walk through the key features.",
    voice_name="Default",
)
```

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `text` | `str` | 必需 | 要转换为语音的文本 |
| `voice_name` | `str` | `"Default"` | 要使用的语音 |
| `config` | `dict` | `{}` | 其他配置 |
| `callback_url` | `str\|None` | `None` | 接收异步回调的 URL |

所有三种音频方法都返回具有 `.id`、`.name`、`.length` 和 `.collection_id` 的 `Audio` 对象。

## 文本生成（LLM 集成）

使用 `coll.generate_text()` 运行 LLM 分析。这是一个**集合级别**的方法——直接在提示字符串中传递任何上下文（转录稿、描述）。

```python
# 首先从视频获取转录稿
transcript_text = video.get_transcript_text()

# 使用集合 LLM 生成分析
result = coll.generate_text(
    prompt=f"Summarize the key points discussed in this video:\n{transcript_text}",
    model_name="pro",
)

print(result["output"])
```

### generate_text 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `prompt` | `str` | 必需 | 包含 LLM 上下文的提示 |
| `model_name` | `str` | `"basic"` | 模型层级：`"basic"`、`"pro"` 或 `"ultra"` |
| `response_type` | `str` | `"text"` | 响应格式：`"text"` 或 `"json"` |

返回一个带有 `output` 键的 `dict`。当 `response_type="text"` 时，`output` 是 `str`。当 `response_type="json"` 时，`output` 是 `dict`。

```python
result = coll.generate_text(prompt="Summarize this", model_name="pro")
print(result["output"])  # 访问实际的文本/dict
```

### 使用 LLM 分析场景

结合场景提取和文本生成：

```python
from videodb import SceneExtractionType

# 首先索引场景
scenes = video.index_scenes(
    extraction_type=SceneExtractionType.time_based,
    extraction_config={"time": 10},
    prompt="Describe the visual content in this scene.",
)

# 获取口语上下文的转录稿
transcript_text = video.get_transcript_text()
scene_descriptions = []
for scene in scenes:
    if isinstance(scene, dict):
        description = scene.get("description") or scene.get("summary")
    else:
        description = getattr(scene, "description", None) or getattr(scene, "summary", None)
    scene_descriptions.append(description or str(scene))

scenes_text = "\n".join(scene_descriptions)

# 使用集合 LLM 分析
result = coll.generate_text(
    prompt=(
        f"Given this video transcript:\n{transcript_text}\n\n"
        f"And these visual scene descriptions:\n{scenes_text}\n\n"
        "Based on the spoken and visual content, describe the main topics covered."
    ),
    model_name="pro",
)
print(result["output"])
```

## 配音和翻译

### 为视频配音

使用集合方法将视频配音为另一种语言：

```python
dubbed_video = coll.dub_video(
    video_id=video.id,
    language_code="es",  # Spanish
)

dubbed_video.play()
```

### dub_video 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `video_id` | `str` | 必需 | 要配音的视频 ID |
| `language_code` | `str` | 必需 | 目标语言代码（例如 `"es"`、`"fr"`、`"de"`） |
| `callback_url` | `str\|None` | `None` | 接收异步回调的 URL |

返回带有配音内容的 `Video` 对象。

### 翻译转录稿

在不配音的情况下翻译视频的转录稿：

```python
translated = video.translate_transcript(
    language="Spanish",
    additional_notes="Use formal tone",
)

for entry in translated:
    print(entry)
```

**支持的语言**包括：`en`、`es`、`fr`、`de`、`it`、`pt`、`ja`、`ko`、`zh`、`hi`、`ar` 等。

## 完整workflow process示例

### 为视频生成旁白

```python
import videodb

conn = videodb.connect()
coll = conn.get_collection()
video = coll.get_video("your-video-id")

# 获取转录稿
transcript_text = video.get_transcript_text()

# 使用集合 LLM 生成旁白脚本
result = coll.generate_text(
    prompt=(
        f"Write a professional narration script for this video content:\n"
        f"{transcript_text[:2000]}"
    ),
    model_name="pro",
)
script = result["output"]

# 将脚本转换为语音
narration = coll.generate_voice(text=script)
print(f"Narration audio: {narration.id}")
```

### 从提示生成缩略图

```python
thumbnail = coll.generate_image(
    prompt="professional video thumbnail showing data analytics dashboard, modern design",
    aspect_ratio="16:9",
)
print(f"Thumbnail URL: {thumbnail.generate_url()}")
```

### 为视频添加生成的音乐

```python
import videodb
from videodb.timeline import Timeline
from videodb.asset import VideoAsset, AudioAsset

conn = videodb.connect()
coll = conn.get_collection()
video = coll.get_video("your-video-id")

# 生成背景音乐
music = coll.generate_music(
    prompt="calm ambient background music for a tutorial video",
    duration=60,
)

# 使用视频 + 音乐叠加构建时间线
timeline = Timeline(conn)
timeline.add_inline(VideoAsset(asset_id=video.id))
timeline.add_overlay(0, AudioAsset(asset_id=music.id, disable_other_tracks=False))

stream_url = timeline.generate_stream()
print(f"Video with music: {stream_url}")
```

### 结构化 JSON 输出

```python
transcript_text = video.get_transcript_text()

result = coll.generate_text(
    prompt=(
        f"Given this transcript:\n{transcript_text}\n\n"
        "Return a JSON object with keys: summary, topics (array), action_items (array)."
    ),
    model_name="pro",
    response_type="json",
)

# response_type="json" 时 result["output"] 是一个 dict
print(result["output"]["summary"])
print(result["output"]["topics"])
```

## 提示

- **生成的媒体是持久的**：所有生成的内容都存储在您的集合中，可以重复使用。
- **三种音频方法**：使用 `generate_music()` 生成背景音乐，`generate_sound_effect()` 生成音效，`generate_voice()` 文字转语音。没有统一的 `generate_audio()` 方法。
- **文本生成是集合级别的**：`coll.generate_text()` 无法自动访问视频内容。使用 `video.get_transcript_text()` 获取转录稿并在提示中传递。
- **模型层级**：`"basic"` 最快，`"pro"` 均衡，`"ultra"` 最高质量。大多数分析任务使用 `"pro"`。
- **组合生成类型**：生成用于叠加层的图像、用于背景的音乐和用于旁白的语音，然后使用时间线合成（参见 [editor.md](editor.md)）。
- **提示质量很重要**：描述性、具体的提示在所有生成类型中都会产生更好的结果。
- **图像宽高比**：选择 `"1:1"`、`"9:16"`、`"16:9"`、`"4:3"` 或 `"3:4"`。
