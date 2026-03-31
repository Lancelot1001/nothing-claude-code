# 完整 API 参考

VideoDB skill参考文档。关于使用指南和workflow process选择，请参阅 [../SKILL.md](../SKILL.md)。

## 连接

```python
import videodb

conn = videodb.connect(
    api_key="your-api-key",      # 或设置 VIDEO_DB_API_KEY 环境变量
    base_url=None,                # 自定义 API 端点（可选）
)
```

**返回：** `Connection` 对象

### 连接方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `conn.get_collection(collection_id="default")` | `Collection` | 获取集合（不指定 ID 则获取默认集合） |
| `conn.get_collections()` | `list[Collection]` | 列出所有集合 |
| `conn.create_collection(name, description, is_public=False)` | `Collection` | 创建新集合 |
| `conn.update_collection(id, name, description)` | `Collection` | 更新集合 |
| `conn.check_usage()` | `dict` | 获取账户使用统计 |
| `conn.upload(source, media_type, name, ...)` | `Video\|Audio\|Image` | 上传到默认集合 |
| `conn.record_meeting(meeting_url, bot_name, ...)` | `Meeting` | 录制会议 |
| `conn.create_capture_session(...)` | `CaptureSession` | 创建捕获会话（参见 [capture-reference.md](capture-reference.md)） |
| `conn.youtube_search(query, result_threshold, duration)` | `list[dict]` | 搜索 YouTube |
| `conn.transcode(source, callback_url, mode, ...)` | `str` | 转码视频（返回任务 ID） |
| `conn.get_transcode_details(job_id)` | `dict` | 获取转码任务状态和详情 |
| `conn.connect_websocket(collection_id)` | `WebSocketConnection` | 连接 WebSocket（参见 [capture-reference.md](capture-reference.md)） |

### 转码

从 URL 转码视频，支持自定义分辨率、质量和音频设置。处理在服务器端完成，无需本地 ffmpeg。

```python
from videodb import TranscodeMode, VideoConfig, AudioConfig

job_id = conn.transcode(
    source="https://example.com/video.mp4",
    callback_url="https://example.com/webhook",
    mode=TranscodeMode.economy,
    video_config=VideoConfig(resolution=720, quality=23),
    audio_config=AudioConfig(mute=False),
)
```

#### transcode 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `source` | `str` | 必需 | 要转码的视频 URL（最好是可下载的 URL） |
| `callback_url` | `str` | 必需 | 转码完成时接收回调的 URL |
| `mode` | `TranscodeMode` | `TranscodeMode.economy` | 转码速度：`economy` 或 `lightning` |
| `video_config` | `VideoConfig` | `VideoConfig()` | 视频编码设置 |
| `audio_config` | `AudioConfig` | `AudioConfig()` | 音频编码设置 |

返回任务 ID（`str`）。使用 `conn.get_transcode_details(job_id)` 检查任务状态。

```python
details = conn.get_transcode_details(job_id)
```

#### VideoConfig

```python
from videodb import VideoConfig, ResizeMode

config = VideoConfig(
    resolution=720,              # 目标分辨率高度（例如 480、720、1080）
    quality=23,                  # 编码质量（越低质量越好，默认 23）
    framerate=30,                # 目标帧率
    aspect_ratio="16:9",         # 目标宽高比
    resize_mode=ResizeMode.crop, # 适配方式：crop、fit 或 pad
)
```

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `resolution` | `int\|None` | `None` | 目标分辨率高度（像素） |
| `quality` | `int` | `23` | 编码质量（越低质量越好） |
| `framerate` | `int\|None` | `None` | 目标帧率 |
| `aspect_ratio` | `str\|None` | `None` | 目标宽高比（例如 `"16:9"`、`"9:16"`） |
| `resize_mode` | `str` | `ResizeMode.crop` | 调整策略：`crop`、`fit` 或 `pad` |

#### AudioConfig

```python
from videodb import AudioConfig

config = AudioConfig(mute=False)
```

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `mute` | `bool` | `False` | 静音音轨 |

## 集合

```python
coll = conn.get_collection()
```

### 集合方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `coll.get_videos()` | `list[Video]` | 列出所有视频 |
| `coll.get_video(video_id)` | `Video` | 获取指定视频 |
| `coll.get_audios()` | `list[Audio]` | 列出所有音频 |
| `coll.get_audio(audio_id)` | `Audio` | 获取指定音频 |
| `coll.get_images()` | `list[Image]` | 列出所有图片 |
| `coll.get_image(image_id)` | `Image` | 获取指定图片 |
| `coll.upload(url=None, file_path=None, media_type=None, name=None)` | `Video\|Audio\|Image` | 上传媒体 |
| `coll.search(query, search_type, index_type, score_threshold, namespace, scene_index_id, ...)` | `SearchResult` | 在集合中搜索（仅支持语义搜索；关键词和场景搜索会抛出 `NotImplementedError`） |
| `coll.generate_image(prompt, aspect_ratio="1:1")` | `Image` | 使用 AI 生成图片 |
| `coll.generate_video(prompt, duration=5)` | `Video` | 使用 AI 生成视频 |
| `coll.generate_music(prompt, duration=5)` | `Audio` | 使用 AI 生成音乐 |
| `coll.generate_sound_effect(prompt, duration=2)` | `Audio` | 生成音效 |
| `coll.generate_voice(text, voice_name="Default")` | `Audio` | 文字转语音 |
| `coll.generate_text(prompt, model_name="basic", response_type="text")` | `dict` | LLM 文本生成 — 通过 `["output"]` 访问结果 |
| `coll.dub_video(video_id, language_code)` | `Video` | 将视频配音为另一种语言 |
| `coll.record_meeting(meeting_url, bot_name, ...)` | `Meeting` | 录制直播会议 |
| `coll.create_capture_session(...)` | `CaptureSession` | 创建捕获会话（参见 [capture-reference.md](capture-reference.md)） |
| `coll.get_capture_session(...)` | `CaptureSession` | 获取捕获会话（参见 [capture-reference.md](capture-reference.md)） |
| `coll.connect_rtstream(url, name, ...)` | `RTStream` | 连接到直播流（参见 [rtstream-reference.md](rtstream-reference.md)） |
| `coll.make_public()` | `None` | 将集合设为公开 |
| `coll.make_private()` | `None` | 将集合设为私有 |
| `coll.delete_video(video_id)` | `None` | 删除视频 |
| `coll.delete_audio(audio_id)` | `None` | 删除音频 |
| `coll.delete_image(image_id)` | `None` | 删除图片 |
| `coll.delete()` | `None` | 删除集合 |

### 上传参数

```python
video = coll.upload(
    url=None,            # 远程 URL（HTTP、YouTube）
    file_path=None,      # 本地文件路径
    media_type=None,     # "video"、"audio" 或 "image"（省略则自动检测）
    name=None,           # 媒体自定义名称
    description=None,    # 描述
    callback_url=None,   # 异步通知的 Webhook URL
)
```

## 视频对象

```python
video = coll.get_video(video_id)
```

### 视频属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `video.id` | `str` | 唯一视频 ID |
| `video.collection_id` | `str` | 父集合 ID |
| `video.name` | `str` | 视频名称 |
| `video.description` | `str` | 视频描述 |
| `video.length` | `float` | 时长（秒） |
| `video.stream_url` | `str` | 默认流 URL |
| `video.player_url` | `str` | 播放器嵌入 URL |
| `video.thumbnail_url` | `str` | 缩略图 URL |

### 视频方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `video.generate_stream(timeline=None)` | `str` | 生成流 URL（可选的时间线为 `[(start, end)]` 元组列表） |
| `video.play()` | `str` | 在浏览器中打开流，返回播放器 URL |
| `video.index_spoken_words(language_code=None, force=False)` | `None` | 为搜索建立语音索引。使用 `force=True` 跳过已索引的内容。 |
| `video.index_scenes(extraction_type, prompt, extraction_config, metadata, model_name, name, scenes, callback_url)` | `str` | 建立视觉场景索引（返回 scene_index_id） |
| `video.index_visuals(prompt, batch_config, ...)` | `str` | 建立视觉索引（返回 scene_index_id） |
| `video.index_audio(prompt, model_name, ...)` | `str` | 使用 LLM 建立音频索引（返回 scene_index_id） |
| `video.get_transcript(start=None, end=None)` | `list[dict]` | 获取带时间戳的转录稿 |
| `video.get_transcript_text(start=None, end=None)` | `str` | 获取完整转录文本 |
| `video.generate_transcript(force=None)` | `dict` | 生成转录稿 |
| `video.translate_transcript(language, additional_notes)` | `list[dict]` | 翻译转录稿 |
| `video.search(query, search_type, index_type, filter, **kwargs)` | `SearchResult` | 在视频内搜索 |
| `video.add_subtitle(style=SubtitleStyle())` | `str` | 添加字幕（返回流 URL） |
| `video.generate_thumbnail(time=None)` | `str\|Image` | 生成缩略图 |
| `video.get_thumbnails()` | `list[Image]` | 获取所有缩略图 |
| `video.extract_scenes(extraction_type, extraction_config)` | `SceneCollection` | 提取场景 |
| `video.reframe(start, end, target, mode, callback_url)` | `Video\|None` | 重新调整视频宽高比 |
| `video.clip(prompt, content_type, model_name)` | `str` | 根据提示生成片段（返回流 URL） |
| `video.insert_video(video, timestamp)` | `str` | 在指定时间戳插入视频 |
| `video.download(name=None)` | `dict` | 下载视频 |
| `video.delete()` | `None` | 删除视频 |

### 重新调整尺寸

将视频转换为不同宽高比，支持可选的智能对象跟踪。处理在服务器端完成。

> **警告：** 重新调整尺寸是一项缓慢的服务器端操作。长视频可能需要几分钟，并可能超时。始终使用 `start`/`end` 限制片段，或传递 `callback_url` 进行异步处理。

```python
from videodb import ReframeMode

# 为避免超时，优先使用短片段：
reframed = video.reframe(start=0, end=60, target="vertical", mode=ReframeMode.smart)

# 完整视频的异步重新调整（返回 None，结果通过 webhook 接收）：
video.reframe(target="vertical", callback_url="https://example.com/webhook")

# 自定义尺寸
reframed = video.reframe(start=0, end=60, target={"width": 1080, "height": 1080})
```

#### reframe 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `start` | `float\|None` | `None` | 开始时间（秒，None = 开头） |
| `end` | `float\|None` | `None` | 结束时间（秒，None = 视频结尾） |
| `target` | `str\|dict` | `"vertical"` | 预设字符串（`"vertical"`、`"square"`、`"landscape"`）或 `{"width": int, "height": int}` |
| `mode` | `str` | `ReframeMode.smart` | `"simple"`（居中裁剪）或 `"smart"`（对象跟踪） |
| `callback_url` | `str\|None` | `None` | 异步通知的 Webhook URL |

未提供 `callback_url` 时返回 `Video` 对象，否则返回 `None`。

## 音频对象

```python
audio = coll.get_audio(audio_id)
```

### 音频属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `audio.id` | `str` | 唯一音频 ID |
| `audio.collection_id` | `str` | 父集合 ID |
| `audio.name` | `str` | 音频名称 |
| `audio.length` | `float` | 时长（秒） |

### 音频方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `audio.generate_url()` | `str` | 生成签名 URL 用于播放 |
| `audio.get_transcript(start=None, end=None)` | `list[dict]` | 获取带时间戳的转录稿 |
| `audio.get_transcript_text(start=None, end=None)` | `str` | 获取完整转录文本 |
| `audio.generate_transcript(force=None)` | `dict` | 生成转录稿 |
| `audio.delete()` | `None` | 删除音频 |

## 图片对象

```python
image = coll.get_image(image_id)
```

### 图片属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `image.id` | `str` | 唯一图片 ID |
| `image.collection_id` | `str` | 父集合 ID |
| `image.name` | `str` | 图片名称 |
| `image.url` | `str\|None` | 图片 URL（生成图片可能为 `None`，请改用 `generate_url()`） |

### 图片方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `image.generate_url()` | `str` | 生成签名 URL |
| `image.delete()` | `None` | 删除图片 |

## 时间线和编辑器

### 时间线

```python
from videodb.timeline import Timeline

timeline = Timeline(conn)
```

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `timeline.add_inline(asset)` | `None` | 按顺序在主轨道添加 `VideoAsset` |
| `timeline.add_overlay(start, asset)` | `None` | 在指定时间戳叠加 `AudioAsset`、`ImageAsset` 或 `TextAsset` |
| `timeline.generate_stream()` | `str` | 编译并获取流 URL |

### 资产类型

#### VideoAsset

```python
from videodb.asset import VideoAsset

asset = VideoAsset(
    asset_id=video.id,
    start=0,              # 裁剪开始（秒）
    end=None,             # 裁剪结束（秒，None = 完整）
)
```

#### AudioAsset

```python
from videodb.asset import AudioAsset

asset = AudioAsset(
    asset_id=audio.id,
    start=0,
    end=None,
    disable_other_tracks=True,   # 为 True 时静音原始音频
    fade_in_duration=0,          # 淡入秒数（最大 5）
    fade_out_duration=0,         # 淡出秒数（最大 5）
)
```

#### ImageAsset

```python
from videodb.asset import ImageAsset

asset = ImageAsset(
    asset_id=image.id,
    duration=None,        # 显示时长（秒）
    width=100,            # 显示宽度
    height=100,           # 显示高度
    x=80,                 # 水平位置（距离左侧像素）
    y=20,                 # 垂直位置（距离顶部像素）
)
```

#### TextAsset

```python
from videodb.asset import TextAsset, TextStyle

asset = TextAsset(
    text="Hello World",
    duration=5,
    style=TextStyle(
        fontsize=24,
        fontcolor="black",
        boxcolor="white",       # 背景框颜色
        alpha=1.0,
        font="Sans",
        text_align="T",         # 框内文本对齐方式
    ),
)
```

#### CaptionAsset（编辑器 API）

CaptionAsset 属于编辑器 API，它有独立的时间线、轨道和片段系统：

```python
from videodb.editor import CaptionAsset, FontStyling

asset = CaptionAsset(
    src="auto",                    # "auto" 或 base64 ASS 字符串
    font=FontStyling(name="Clear Sans", size=30),
    primary_color="&H00FFFFFF",
)
```

关于使用编辑器 API 的完整 CaptionAsset 用法，参见 [editor.md](editor.md#caption-overlays)。

## 视频搜索参数

```python
results = video.search(
    query="your query",
    search_type=SearchType.semantic,       # semantic、keyword 或 scene
    index_type=IndexType.spoken_word,      # spoken_word 或 scene
    result_threshold=None,                 # 最大结果数
    score_threshold=None,                  # 最小相关性得分
    dynamic_score_percentage=None,         # 动态得分百分比
    scene_index_id=None,                   # 目标特定场景索引（通过 **kwargs 传递）
    filter=[],                             # 场景搜索的元数据过滤器
)
```

> **注意：** `filter` 是 `video.search()` 中的显式命名参数。`scene_index_id` 通过 `**kwargs` 传递给 API。
>
> **重要提示：** 当没有匹配结果时，`video.search()` 会抛出包含 `"No results found"` 消息的 `InvalidRequestError`。务必将搜索调用包装在 try/except 中。对于场景搜索，使用 `score_threshold=0.3` 或更高来过滤低相关性噪音。

对于场景搜索，使用 `search_type=SearchType.semantic` 配合 `index_type=IndexType.scene`。在针对特定场景索引时传递 `scene_index_id`。详情参见 [search.md](search.md)。

## SearchResult 对象

```python
results = video.search("query", search_type=SearchType.semantic)
```

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `results.get_shots()` | `list[Shot]` | 获取匹配片段列表 |
| `results.compile()` | `str` | 将所有片段编译成流 URL |
| `results.play()` | `str` | 在浏览器中打开编译后的流 |

### Shot 属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `shot.video_id` | `str` | 源视频 ID |
| `shot.video_length` | `float` | 源视频时长 |
| `shot.video_title` | `str` | 源视频标题 |
| `shot.start` | `float` | 开始时间（秒） |
| `shot.end` | `float` | 结束时间（秒） |
| `shot.text` | `str` | 匹配的文本内容 |
| `shot.search_score` | `float` | 搜索相关性得分 |

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `shot.generate_stream()` | `str` | 流式播放此特定片段 |
| `shot.play()` | `str` | 在浏览器中打开片段流 |

## 会议对象

```python
meeting = coll.record_meeting(
    meeting_url="https://meet.google.com/...",
    bot_name="Bot",
    callback_url=None,          # 状态更新的 Webhook URL
    callback_data=None,         # 可选字典，会传递给回调
    time_zone="UTC",            # 会议时区
)
```

### 会议属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `meeting.id` | `str` | 唯一会议 ID |
| `meeting.collection_id` | `str` | 父集合 ID |
| `meeting.status` | `str` | 当前状态 |
| `meeting.video_id` | `str` | 录制视频 ID（完成后） |
| `meeting.bot_name` | `str` | 机器人名称 |
| `meeting.meeting_title` | `str` | 会议标题 |
| `meeting.meeting_url` | `str` | 会议 URL |
| `meeting.speaker_timeline` | `dict` | 发言人时间线数据 |
| `meeting.is_active` | `bool` | 初始化或处理中时为 True |
| `meeting.is_completed` | `bool` | 完成后为 True |

### 会议方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `meeting.refresh()` | `Meeting` | 从服务器刷新数据 |
| `meeting.wait_for_status(target_status, timeout=14400, interval=120)` | `bool` | 轮询直到达到目标状态 |

## RTStream 和捕获

关于 RTStream（实时摄入、索引、转录），参见 [rtstream-reference.md](rtstream-reference.md)。

关于捕获会话（桌面录制、CaptureClient、通道），参见 [capture-reference.md](capture-reference.md)。

## 枚举和常量

### SearchType

```python
from videodb import SearchType

SearchType.semantic    # 自然语言语义搜索
SearchType.keyword     # 精确关键词匹配
SearchType.scene       # 视觉场景搜索（可能需要付费计划）
SearchType.llm         # LLM 驱动的搜索
```

### SceneExtractionType

```python
from videodb import SceneExtractionType

SceneExtractionType.shot_based   # 自动镜头边界检测
SceneExtractionType.time_based   # 固定时间间隔提取
SceneExtractionType.transcript   # 基于转录稿的场景提取
```

### SubtitleStyle

```python
from videodb import SubtitleStyle

style = SubtitleStyle(
    font_name="Arial",
    font_size=18,
    primary_colour="&H00FFFFFF",
    bold=False,
    # ... 参见 SubtitleStyle 获取所有选项
)
video.add_subtitle(style=style)
```

### SubtitleAlignment 和 SubtitleBorderStyle

```python
from videodb import SubtitleAlignment, SubtitleBorderStyle
```

### TextStyle

```python
from videodb import TextStyle
# 或：from videodb.asset import TextStyle

style = TextStyle(
    fontsize=24,
    fontcolor="black",
    boxcolor="white",
    font="Sans",
    text_align="T",
    alpha=1.0,
)
```

### 其他常量

```python
from videodb import (
    IndexType,          # spoken_word、scene
    MediaType,          # video、audio、image
    Segmenter,          # word、sentence、time
    SegmentationType,   # sentence、llm
    TranscodeMode,      # economy、lightning
    ResizeMode,         # crop、fit、pad
    ReframeMode,        # simple、smart
    RTStreamChannelType,
)
```

## 异常

```python
from videodb.exceptions import (
    AuthenticationError,     # API 密钥无效或缺失
    InvalidRequestError,     # 参数错误或请求格式不正确
    RequestTimeoutError,     # 请求超时
    SearchError,             # 搜索操作失败（例如未建立索引）
    VideodbError,            # 所有 VideoDB 错误的基类异常
)
```

| 异常 | 常见原因 |
|-----------|-------------|
| `AuthenticationError` | 缺少或无效的 `VIDEO_DB_API_KEY` |
| `InvalidRequestError` | URL 无效、格式不支持、参数错误 |
| `RequestTimeoutError` | 服务器响应时间过长 |
| `SearchError` | 在建立索引前搜索、搜索类型无效 |
| `VideodbError` | 服务器错误、网络问题、通用故障 |
