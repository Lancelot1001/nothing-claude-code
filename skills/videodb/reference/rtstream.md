# RTStream 指南

## 概述

RTStream 支持实时摄入直播视频流（RTSP/RTMP）和桌面捕获会话。连接后，您可以从直播源录制、建立索引、搜索和导出内容。

关于代码级详情（SDK 方法、参数、示例），请参阅 [rtstream-reference.md](rtstream-reference.md)。

## 使用场景

- **安全和监控**：连接 RTSP 摄像头，检测事件，触发警报
- **直播广播**：摄入 RTMP 流，实时建立索引，启用即时搜索
- **会议录制**：捕获桌面屏幕和音频，实时转录，导出录制
- **事件处理**：监控直播馈送，运行 AI 分析，响应检测到的内容

## 快速开始

1. **连接到直播流**（RTSP/RTMP URL）或从捕获会话获取 RTStream

2. **开始摄入**以开始录制直播内容

3. **启动 AI 管道**进行实时索引（音频、视觉、转录）

4. **通过 WebSocket 监控事件**获取实时 AI 结果和警报

5. **完成时停止摄入**

6. **导出为视频**以便永久存储和进一步处理

7. **搜索录制内容**以找到特定时刻

## RTStream 来源

### 从 RTSP/RTMP 流

直接连接到直播视频源：

```python
rtstream = coll.connect_rtstream(
    url="rtmp://your-stream-server/live/stream-key",
    name="My Live Stream",
)
```

### 从捕获会话

从桌面捕获获取 RTStream（麦克风、屏幕、系统音频）：

```python
session = conn.get_capture_session(session_id)

mics = session.get_rtstream("mic")
displays = session.get_rtstream("screen")
system_audios = session.get_rtstream("system_audio")
```

关于捕获会话workflow process，请参阅 [capture.md](capture.md)。

---

## 脚本

| 脚本 | 描述 |
|--------|-------------|
| `scripts/ws_listener.py` | 用于实时 AI 结果的 WebSocket 事件监听器 |
