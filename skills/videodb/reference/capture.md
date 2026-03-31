# 捕获指南

## 概述

VideoDB Capture 支持带 AI 处理功能的实时屏幕和音频录制。桌面捕获目前仅支持 **macOS**。

关于代码级详情（SDK 方法、事件结构、AI 管道），请参阅 [capture-reference.md](capture-reference.md)。

## 快速开始

1. **启动 WebSocket 监听器**：`python scripts/ws_listener.py --clear &`
2. **运行捕获代码**（参见下面的完整捕获workflow process）
3. **事件写入到**：`/tmp/videodb_events.jsonl`

---

## 完整捕获workflow process

无需 webhook 或轮询。WebSocket 传递所有事件，包括会话生命周期。

> **重要提示：** `CaptureClient` 必须在整个捕获期间保持运行。它运行本地录制器二进制文件，将屏幕/音频数据流式传输到 VideoDB。如果创建 `CaptureClient` 的 Python 进程退出，录制器二进制文件将被终止，捕获将静默停止。始终将捕获代码作为**长寿后台进程」运行（例如 `nohup python capture_script.py &`），并使用信号处理（`asyncio.Event` + `SIGINT`/`SIGTERM`）保持其运行，直到显式停止。

1. **在后台启动 WebSocket 监听器**，使用 `--clear` 标志清除旧事件。等待它创建 WebSocket ID 文件。

2. **读取 WebSocket ID**。此 ID 是捕获会话和 AI 管道所必需的。

3. **创建捕获会话**并为桌面客户端生成客户端令牌。

4. **使用令牌初始化 CaptureClient**。请求麦克风和屏幕捕获权限。

5. **列出并选择通道**（mic、display、system_audio）。在要持久化为视频的通道上设置 `store = True`。

6. **使用选定的通道启动会话**。

7. **等待会话激活**，读取事件直到看到 `capture_session.active`。此事件包含 `rtstreams` 数组。将会话信息（会话 ID、RTStream ID）保存到文件（例如 `/tmp/videodb_capture_info.json`），以便其他脚本可以读取。

8. **保持进程运行。** 使用 `asyncio.Event` 和 `SIGINT`/`SIGTERM` 的信号处理器阻塞，直到显式停止。写入 PID 文件（例如 `/tmp/videodb_capture_pid`），以便稍后可以使用 `kill $(cat /tmp/videodb_capture_pid)` 停止进程。PID 文件应在每次运行时覆盖，以便重新运行始终具有正确的 PID。

9. **启动 AI 管道**（在单独的命令/脚本中），对每个 RTStream 进行音频索引和视觉索引。从保存的会话信息文件中读取 RTStream ID。

10. **编写自定义事件处理逻辑**（在单独的命令/脚本中），根据您的用例读取实时事件。例如：
    - 当 `visual_index` 提到 "Slack" 时记录 Slack 活动
    - 当 `audio_index` 事件到达时总结讨论
    - 当转录中出现特定关键词时触发警报
    - 从屏幕描述中跟踪应用程序使用情况

11. **完成时停止捕获** — 向捕获进程发送 SIGTERM。它应在信号处理器中调用 `client.stop_capture()` 和 `client.shutdown()`。

12. **等待导出**，读取事件直到看到 `capture_session.exported`。此事件包含 `exported_video_id`、`stream_url` 和 `player_url`。在停止捕获后可能需要几秒钟。

13. **在收到导出事件后停止 WebSocket 监听器**。使用 `kill $(cat /tmp/videodb_ws_pid)` 干净地终止它。

---

## 关闭顺序

正确的关闭顺序对于确保捕获所有事件很重要：

1. **停止捕获会话** — `client.stop_capture()` 然后 `client.shutdown()`
2. **等待导出事件** — 轮询 `/tmp/videodb_events.jsonl` 获取 `capture_session.exported`
3. **停止 WebSocket 监听器** — `kill $(cat /tmp/videodb_ws_pid)`

在收到导出事件之前，不要终止 WebSocket 监听器，否则您将丢失最终的视频 URL。

---

## 脚本

| 脚本 | 描述 |
|--------|-------------|
| `scripts/ws_listener.py` | WebSocket 事件监听器（转储到 JSONL） |

### ws_listener.py 使用方法

```bash
# 在后台启动监听器（追加到现有事件）
python scripts/ws_listener.py &

# 清除启动监听器（新会话，清除旧事件）
python scripts/ws_listener.py --clear &

# 自定义输出目录
python scripts/ws_listener.py --clear /path/to/events &

# 停止监听器
kill $(cat /tmp/videodb_ws_pid)
```

**选项：**
- `--clear`：启动前清除事件文件。在开始新的捕获会话时使用。

**输出文件：**
- `videodb_events.jsonl` - 所有 WebSocket 事件
- `videodb_ws_id` - WebSocket 连接 ID（用于 `ws_connection_id` 参数）
- `videodb_ws_pid` - 进程 ID（用于停止监听器）

**功能：**
- 连接断开时自动重试（指数退避）
- SIGINT/SIGTERM 时优雅关闭
- 用于轻松进程管理的 PID 文件
- 连接状态日志记录
