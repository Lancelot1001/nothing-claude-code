# 搜索和索引指南

搜索允许您使用自然语言查询、精确关键词或视觉场景描述在视频中找到特定时刻。

## 前置条件

视频**必须被索引**后才能搜索。每个视频每种索引类型只需执行一次索引操作。

## 索引

### 口语词索引

为视频的转录语音内容建立索引，以支持语义搜索和关键词搜索：

```python
video = coll.get_video(video_id)

# force=True 使索引成为幂等操作——如果已索引则跳过
video.index_spoken_words(force=True)
```

这会转录音轨并基于口语内容构建可搜索索引。是语义搜索和关键词搜索所必需的。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `language_code` | `str\|None` | `None` | 视频的语言代码 |
| `segmentation_type` | `SegmentationType` | `SegmentationType.sentence` | 分段类型（`sentence` 或 `llm`） |
| `force` | `bool` | `False` | 设置为 `True` 以跳过已索引的内容（避免「已存在」错误） |
| `callback_url` | `str\|None` | `None` | 异步通知的 Webhook URL |

### 场景索引

通过生成场景的 AI 描述来索引视觉内容。与口语词索引一样，如果场景索引已存在则抛出错误。从错误消息中提取现有的 `scene_index_id`。

```python
import re
from videodb import SceneExtractionType

try:
    scene_index_id = video.index_scenes(
        extraction_type=SceneExtractionType.shot_based,
        prompt="Describe the visual content, objects, actions, and setting in this scene.",
    )
except Exception as e:
    match = re.search(r"id\s+([a-f0-9]+)", str(e))
    if match:
        scene_index_id = match.group(1)
    else:
        raise
```

**提取类型：**

| 类型 | 描述 | 适用于 |
|------|-------------|----------|
| `SceneExtractionType.shot_based` | 在视觉镜头边界分割 | 通用、动作内容 |
| `SceneExtractionType.time_based` | 在固定间隔分割 | 均匀采样、长静态内容 |
| `SceneExtractionType.transcript` | 基于转录稿段落分割 | 语音驱动的场景边界 |

**`time_based` 的参数：**

```python
video.index_scenes(
    extraction_type=SceneExtractionType.time_based,
    extraction_config={"time": 5, "select_frames": ["first", "last"]},
    prompt="Describe what is happening in this scene.",
)
```

## 搜索类型

### 语义搜索

与口语内容匹配的自然语言查询：

```python
from videodb import SearchType

results = video.search(
    query="explaining the benefits of machine learning",
    search_type=SearchType.semantic,
)
```

返回口语内容在语义上与查询匹配的排名片段。

### 关键词搜索

转录语音中的精确术语匹配：

```python
results = video.search(
    query="artificial intelligence",
    search_type=SearchType.keyword,
)
```

返回包含精确关键词或短语的片段。

### 场景搜索

与索引场景描述匹配的视觉内容查询。需要先调用 `index_scenes()`。

`index_scenes()` 返回 `scene_index_id`。将其传递给 `video.search()` 以针对特定场景索引（当视频有多个场景索引时尤为重要）：

```python
from videodb import SearchType, IndexType
from videodb.exceptions import InvalidRequestError

# 使用语义搜索针对场景索引。
# 使用 score_threshold 过滤低相关性噪音（推荐：0.3+）。
try:
    results = video.search(
        query="person writing on a whiteboard",
        search_type=SearchType.semantic,
        index_type=IndexType.scene,
        scene_index_id=scene_index_id,
        score_threshold=0.3,
    )
    shots = results.get_shots()
except InvalidRequestError as e:
    if "No results found" in str(e):
        shots = []
    else:
        raise
```

**重要说明：**

- 将 `SearchType.semantic` 与 `index_type=IndexType.scene` 一起使用——这是最可靠的组合，适用于所有计划。
- `SearchType.scene` 存在，但并非在所有计划上都可用（例如免费层）。优先使用 `SearchType.semantic` 配合 `IndexType.scene`。
- `scene_index_id` 参数是可选的。如果省略，搜索将针对视频上的所有场景索引运行。传递它以针对特定索引。
- 您可以为同一视频创建多个场景索引（使用不同提示或提取类型），并使用 `scene_index_id` 独立搜索它们。

### 带元数据过滤的场景搜索

使用自定义元数据索引场景时，可以将语义搜索与元数据过滤器结合：

```python
from videodb import SearchType, IndexType

results = video.search(
    query="a skillful chasing scene",
    search_type=SearchType.semantic,
    index_type=IndexType.scene,
    scene_index_id=scene_index_id,
    filter=[{"camera_view": "road_ahead"}, {"action_type": "chasing"}],
)
```

有关自定义元数据索引和过滤搜索的完整示例，请参阅 [scene_level_metadata_indexing cookbook](https://github.com/video-db/videodb-cookbook/blob/main/quickstart/scene_level_metadata_indexing.ipynb)。

## 处理结果

### 获取片段

访问各个结果片段：

```python
results = video.search("your query")

for shot in results.get_shots():
    print(f"Video: {shot.video_id}")
    print(f"Start: {shot.start:.2f}s")
    print(f"End: {shot.end:.2f}s")
    print(f"Text: {shot.text}")
    print("---")
```

### 播放编译结果

将所有匹配片段作为单个编译视频流式传输：

```python
results = video.search("your query")
stream_url = results.compile()
results.play()  # 在浏览器中打开编译流
```

### 提取片段

下载或流式传输特定结果片段：

```python
for shot in results.get_shots():
    stream_url = shot.generate_stream()
    print(f"Clip: {stream_url}")
```

## 跨集合搜索

在集合中的所有视频中搜索：

```python
coll = conn.get_collection()

# 在集合中的所有视频中搜索
results = coll.search(
    query="product demo",
    search_type=SearchType.semantic,
)

for shot in results.get_shots():
    print(f"Video: {shot.video_id} [{shot.start:.1f}s - {shot.end:.1f}s]")
```

> **注意：** 集合级搜索仅支持 `SearchType.semantic`。将 `SearchType.keyword` 或 `SearchType.scene` 与 `coll.search()` 一起使用会抛出 `NotImplementedError`。对于关键词或场景搜索，请改用单个视频上的 `video.search()`。

## 搜索 + 编译

索引、搜索并将匹配片段编译成单个可播放流：

```python
video.index_spoken_words(force=True)
results = video.search(query="your query", search_type=SearchType.semantic)
stream_url = results.compile()
print(stream_url)
```

## 提示

- **一次索引，多次搜索**：索引是昂贵的操作。一旦索引，搜索很快。
- **组合索引类型**：同时为口语和场景建立索引，以在同一视频上启用所有搜索类型。
- **优化查询**：语义搜索在使用描述性自然语言短语而非单个关键词时效果最佳。
- **使用关键词搜索以获得精确性**：当需要精确术语匹配时，关键词搜索避免语义漂移。
- **处理「未找到结果」**：当没有匹配结果时，`video.search()` 会抛出 `InvalidRequestError`。始终将搜索调用包装在 try/except 中，并将「未找到结果」视为空结果集。
- **过滤场景搜索噪音**：语义场景搜索可能对模糊查询返回低相关性结果。使用 `score_threshold=0.3`（或更高）来过滤噪音。
- **幂等索引**：使用 `index_spoken_words(force=True)` 安全地重新索引。`index_scenes()` 没有 `force` 参数——将其包装在 try/except 中，并使用 `re.search(r"id\s+([a-f0-9]+)", str(e))` 从错误消息中提取现有的 `scene_index_id`。
