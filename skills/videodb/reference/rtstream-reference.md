# RTStream 参考指南

RTStream 操作的代码级细节。关于workflow process指南，请参阅 [rtstream.md](rtstream.md)。关于使用指南和workflow process选择，请参阅 [../SKILL.md](../SKILL.md)。

基于 [docs.videodb.io](https://docs.videodb.io/pages/ingest/live-streams/realtime-apis.md)。

---

## Collection RTStream 方法

`Collection` 上用于管理 RTStream 的方法：

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `coll.connect_rtstream(url, name, ...)` | `RTStream` | 从 RTSP/RTMP URL 创建新 RTStream |
| `coll.get_rtstream(id)` | `RTStream` | 通过 ID 获取现有 RTStream |
| `coll.list_rtstreams(limit, offset, status, name, ordering)` | `List[RTStream]` | 列出集合中的所有 RTStream |
| `coll.search(query, namespace="rtstream")` | `RTStreamSearchResult` | 跨所有 RTStream 搜索 |

### 连接 RTStream

```python
import videodb

conn = videodb.connect()
coll = conn.get_collection()

rtstream = coll.connect_rtstream(
    url="rtmp://your-stream-server/live/stream-key",
    name="My Live Stream",
    media_types=["video"],  # 或 ["audio", "video"]
    sample_rate=30,         # 可选
    store=True,             # 启用录制存储以便导出
    enable_transcript=True, # 可选
    ws_connection_id=ws_id, # 可选，用于实时事件
)
```

### 获取现有 RTStream

```python
rtstream = coll.get_rtstream("rts-xxx")
```

### 列出 RTStream

```python
rtstreams = coll.list_rtstreams(
    limit=10,
    offset=0,
    status="connected",  # 可选过滤器
    name="meeting",      # 可选过滤器
    ordering="-created_at",
)

for rts in rtstreams:
    print(f"{rts.id}: {rts.name} - {rts.status}")
```

### 从捕获会话获取

捕获会话激活后，检索 RTStream 对象：

```python
session = conn.get_capture_session(session_id)

mics = session.get_rtstream("mic")
displays = session.get_rtstream("screen")
system_audios = session.get_rtstream("system_audio")
```

或使用 `capture_session.active` WebSocket 事件中的 `rtstreams` 数据：

```python
for rts in rtstreams:
    rtstream = coll.get_rtstream(rts["rtstream_id"])
```

---

## RTStream 方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `rtstream.start()` | `None` | 开始摄入 |
| `rtstream.stop()` | `None` | 停止摄入 |
| `rtstream.generate_stream(start, end)` | `str` | 流式传输录制片段（Unix 时间戳） |
| `rtstream.export(name=None)` | `RTStreamExportResult` | 导出为永久视频 |
| `rtstream.index_visuals(prompt, ...)` | `RTStreamSceneIndex` | 使用 AI 分析创建视觉索引 |
| `rtstream.index_audio(prompt, ...)` | `RTStreamSceneIndex` | 使用 LLM 摘要创建音频索引 |
| `rtstream.list_scene_indexes()` | `List[RTStreamSceneIndex]` | 列出流上的所有场景索引 |
| `rtstream.get_scene_index(index_id)` | `RTStreamSceneIndex` | 获取特定场景索引 |
| `rtstream.search(query, ...)` | `RTStreamSearchResult` | 搜索索引内容 |
| `rtstream.start_transcript(ws_connection_id, engine)` | `dict` | 开始实时转录 |
| `rtstream.get_transcript(page, page_size, start, end, since)` | `dict` | 获取转录稿页面 |
| `rtstream.stop_transcript(engine)` | `dict` | 停止转录 |

---

## 启动和停止

```python
# 开始摄入
rtstream.start()

# ... 正在录制流 ...

# 停止摄入
rtstream.stop()
```

---

## 生成流

使用 Unix 时间戳（而非秒偏移）从录制内容生成播放流：

```python
import time

start_ts = time.time()
rtstream.start()

# 让它录制一会儿...
time.sleep(60)

end_ts = time.time()
rtstream.stop()

# 为录制的片段生成流 URL
stream_url = rtstream.generate_stream(start=start_ts, end=end_ts)
print(f"Recorded stream: {stream_url}")
```

---

## 导出为视频

将录制的流导出为集合中的永久视频：

```python
export_result = rtstream.export(name="Meeting Recording 2024-01-15")

print(f"Video ID: {export_result.video_id}")
print(f"Stream URL: {export_result.stream_url}")
print(f"Player URL: {export_result.player_url}")
print(f"Duration: {export_result.duration}s")
```

### RTStreamExportResult 属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `video_id` | `str` | 导出视频的 ID |
| `stream_url` | `str` | HLS 流 URL |
| `player_url` | `str` | Web 播放器 URL |
| `name` | `str` | 视频名称 |
| `duration` | `float` | 时长（秒） |

---

## AI 管道

AI 管道处理实时流并通过 WebSocket 发送结果。

### RTStream AI 管道方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `rtstream.index_audio(prompt, batch_config, ...)` | `RTStreamSceneIndex` | 使用 LLM 摘要开始音频索引 |
| `rtstream.index_visuals(prompt, batch_config, ...)` | `RTStreamSceneIndex` | 开始屏幕内容的视觉索引 |

### 音频索引

按间隔生成音频内容的 LLM 摘要：

```python
audio_index = rtstream.index_audio(
    prompt="Summarize what is being discussed",
    batch_config={"type": "word", "value": 50},
    model_name=None,       # 可选
    name="meeting_audio",  # 可选
    ws_connection_id=ws_id,
)
```

**音频 batch_config 选项：**

| 类型 | 值 | 描述 |
|------|-------|-------------|
| `"word"` | count | 每 N 个词分段 |
| `"sentence"` | count | 每 N 个句子分段 |
| `"time"` | seconds | 每 N 秒分段 |

示例：
```python
{"type": "word", "value": 50}      # 每 50 个词
{"type": "sentence", "value": 5}   # 每 5 个句子
{"type": "time", "value": 30}      # 每 30 秒
```

结果到达 `audio_index` WebSocket 通道。

### 视觉索引

生成视觉内容的 AI 描述：

```python
scene_index = rtstream.index_visuals(
    prompt="Describe what is happening on screen",
    batch_config={"type": "time", "value": 2, "frame_count": 5},
    model_name="basic",
    name="screen_monitor",  # 可选
    ws_connection_id=ws_id,
)
```

**参数：**

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `prompt` | `str` | 给 AI 模型的指令（支持结构化 JSON 输出） |
| `batch_config` | `dict` | 控制帧采样（见下文） |
| `model_name` | `str` | 模型层级：`"mini"`、`"basic"`、`"pro"`、`"ultra"` |
| `name` | `str` | 索引名称（可选） |
| `ws_connection_id` | `str` | 用于接收结果的 WebSocket 连接 ID |

**视觉 batch_config：**

| 键 | 类型 | 描述 |
|-----|------|-------------|
| `type` | `str` | 视觉仅支持 `"time"` |
| `value` | `int` | 窗口大小（秒） |
| `frame_count` | `int` | 每个窗口提取的帧数 |

示例：`{"type": "time", "value": 2, "frame_count": 5}` 每 2 秒采样 5 帧并发送给模型。

**结构化 JSON 输出：**

使用请求 JSON 格式的提示以获得结构化响应：

```python
scene_index = rtstream.index_visuals(
    prompt="""Analyze the screen and return a JSON object with:
{
  "app_name": "name of the active application",
  "activity": "what the user is doing",
  "ui_elements": ["list of visible UI elements"],
  "contains_text": true/false,
  "dominant_colors": ["list of main colors"]
}
Return only valid JSON.""",
    batch_config={"type": "time", "value": 3, "frame_count": 3},
    model_name="pro",
    ws_connection_id=ws_id,
)
```

结果到达 `scene_index` WebSocket 通道。

---

## 批处理配置摘要

| 索引类型 | `type` 选项 | `value` | 额外键 |
|---------------|----------------|---------|------------|
| **音频** | `"word"`、`"sentence"`、`"time"` | 词/句/秒 | - |
| **视觉** | 仅 `"time"` | 秒 | `frame_count` |

示例：
```python
# 音频：每 50 个词
{"type": "word", "value": 50}

# 音频：每 30 秒
{"type": "time", "value": 30}

# 视觉：每 2 秒 5 帧
{"type": "time", "value": 2, "frame_count": 5}
```

---

## 转录

通过 WebSocket 进行实时转录：

```python
# 开始实时转录
rtstream.start_transcript(
    ws_connection_id=ws_id,
    engine=None,  # 可选，默认为 "assemblyai"
)

# 获取转录稿页面（带可选过滤器）
transcript = rtstream.get_transcript(
    page=1,
    page_size=100,
    start=None,   # 可选：开始时间戳过滤器
    end=None,     # 可选：结束时间戳过滤器
    since=None,   # 可选：用于轮询，获取此时间戳之后的转录稿
    engine=None,
)

# 停止转录
rtstream.stop_transcript(engine=None)
```

转录结果到达 `transcript` WebSocket 通道。

---

## RTStreamSceneIndex

当您调用 `index_audio()` 或 `index_visuals()` 时，该方法返回一个 `RTStreamSceneIndex` 对象。此对象代表正在运行的索引，并提供管理场景和警报的方法。

```python
# index_visuals 返回 RTStreamSceneIndex
scene_index = rtstream.index_visuals(
    prompt="Describe what is on screen",
    ws_connection_id=ws_id,
)

# index_audio 也返回 RTStreamSceneIndex
audio_index = rtstream.index_audio(
    prompt="Summarize the discussion",
    ws_connection_id=ws_id,
)
```

### RTStreamSceneIndex 属性

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `rtstream_index_id` | `str` | 索引的唯一 ID |
| `rtstream_id` | `str` | 父 RTStream 的 ID |
| `extraction_type` | `str` | 提取类型（`time` 或 `transcript`） |
| `extraction_config` | `dict` | 提取配置 |
| `prompt` | `str` | 用于分析的提示 |
| `name` | `str` | 索引名称 |
| `status` | `str` | 状态（`connected`、`stopped`） |

### RTStreamSceneIndex 方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `index.get_scenes(start, end, page, page_size)` | `dict` | 获取索引场景 |
| `index.start()` | `None` | 开始/恢复索引 |
| `index.stop()` | `None` | 停止索引 |
| `index.create_alert(event_id, callback_url, ws_connection_id)` | `str` | 创建事件检测警报 |
| `index.list_alerts()` | `list` | 列出此索引上的所有警报 |
| `index.enable_alert(alert_id)` | `None` | 启用警报 |
| `index.disable_alert(alert_id)` | `None` | 禁用警报 |

### 获取场景

从索引轮询索引场景：

```python
result = scene_index.get_scenes(
    start=None,      # 可选：开始时间戳
    end=None,        # 可选：结束时间戳
    page=1,
    page_size=100,
)

for scene in result["scenes"]:
    print(f"[{scene['start']}-{scene['end']}] {scene['text']}")

if result["next_page"]:
    # 获取下一页
    pass
```

### 管理场景索引

```python
# 列出流上的所有索引
indexes = rtstream.list_scene_indexes()

# 通过 ID 获取特定索引
scene_index = rtstream.get_scene_index(index_id)

# 停止索引
scene_index.stop()

# 重启索引
scene_index.start()
```

---

## 事件

事件是可重用的检测规则。创建一次，通过警报附加到任何索引。

### 连接事件方法

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `conn.create_event(event_prompt, label)` | `str`（event_id） | 创建检测事件 |
| `conn.list_events()` | `list` | 列出所有事件 |

### 创建事件

```python
event_id = conn.create_event(
    event_prompt="User opened Slack application",
    label="slack_opened",
)
```

### 列出事件

```python
events = conn.list_events()
for event in events:
    print(f"{event['event_id']}: {event['label']}")
```

---

## 警报

警报将事件连接到索引以进行实时通知。当 AI 检测到与事件描述匹配的内容时，会发送警报。

### 创建警报

```python
# 从 index_visuals 获取 RTStreamSceneIndex
scene_index = rtstream.index_visuals(
    prompt="Describe what application is open on screen",
    ws_connection_id=ws_id,
)

# 在索引上创建警报
alert_id = scene_index.create_alert(
    event_id=event_id,
    callback_url="https://your-backend.com/alerts",  # 用于 webhook 传递
    ws_connection_id=ws_id,  # 用于 WebSocket 传递（可选）
)
```

**注意：** `callback_url` 是必需的。如果仅使用 WebSocket 传递，请传递空字符串 `""`。

### 管理警报

```python
# 列出索引上的所有警报
alerts = scene_index.list_alerts()

# 启用/禁用警报
scene_index.disable_alert(alert_id)
scene_index.enable_alert(alert_id)
```

### 警报传递

| 方法 | 延迟 | 使用场景 |
|--------|---------|----------|
| WebSocket | 实时 | 仪表板、实时 UI |
| Webhook | < 1 秒 | 服务器到服务器、自动化 |

### WebSocket 警报事件

```json
{
  "channel": "alert",
  "rtstream_id": "rts-xxx",
  "data": {
    "event_label": "slack_opened",
    "timestamp": 1710000012340,
    "text": "User opened Slack application"
  }
}
```

### Webhook 载荷

```json
{
  "event_id": "event-xxx",
  "label": "slack_opened",
  "confidence": 0.95,
  "explanation": "User opened the Slack application",
  "timestamp": "2024-01-15T10:30:45Z",
  "start_time": 1234.5,
  "end_time": 1238.0,
  "stream_url": "https://stream.videodb.io/v3/...",
  "player_url": "https://console.videodb.io/player?url=..."
}
```

---

## WebSocket 集成

所有实时 AI 结果通过 WebSocket 传递。将 `ws_connection_id` 传递给：
- `rtstream.start_transcript()`
- `rtstream.index_audio()`
- `rtstream.index_visuals()`
- `scene_index.create_alert()`

### WebSocket 通道

| 通道 | 来源 | 内容 |
|---------|--------|---------|
| `transcript` | `start_transcript()` | 实时语音转文字 |
| `scene_index` | `index_visuals()` | 视觉分析结果 |
| `audio_index` | `index_audio()` | 音频分析结果 |
| `alert` | `create_alert()` | 警报通知 |

关于 WebSocket 事件结构和 ws_listener 用法，请参阅 [capture-reference.md](capture-reference.md)。

---

## 完整workflow process

```python
import time
import videodb
from videodb.exceptions import InvalidRequestError

conn = videodb.connect()
coll = conn.get_collection()

# 1. 连接并开始录制
rtstream = coll.connect_rtstream(
    url="rtmp://your-stream-server/live/stream-key",
    name="Weekly Standup",
    store=True,
)
rtstream.start()

# 2. 录制整个会议时长
start_ts = time.time()
time.sleep(1800)  # 30 分钟
end_ts = time.time()
rtstream.stop()

# 为捕获的窗口生成即时播放 URL
stream_url = rtstream.generate_stream(start=start_ts, end=end_ts)
print(f"Recorded stream: {stream_url}")

# 3. 导出为永久视频
export_result = rtstream.export(name="Weekly Standup Recording")
print(f"Exported video: {export_result.video_id}")

# 4. 为搜索索引导出的视频
video = coll.get_video(export_result.video_id)
video.index_spoken_words(force=True)

# 5. 搜索待办事项
try:
    results = video.search("action items and next steps")
    stream_url = results.compile()
    print(f"Action items clip: {stream_url}")
except InvalidRequestError as exc:
    if "No results found" in str(exc):
        print("No action items were detected in the recording.")
    else:
        raise
```
