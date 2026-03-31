---
name: video-editing
description: 用于剪辑、构建和增强真实素材的 AI 辅助视频编辑workflow。涵盖从原始捕获到 FFmpeg、Remotion、ElevenLabs、fal.ai，再到 Descript 或 CapCut 最终精修的完整管道。当用户想要编辑视频、剪辑素材、创建视频博客或构建视频内容时使用
origin: nothing-claude-code
---

# 视频编辑

对真实素材的 AI 辅助编辑。不是从提示生成。是快速编辑现有视频。

## 何时激活

- 用户想要编辑、剪辑或构建视频素材
- 将长录制转换为短视频内容
- 从原始捕获构建视频博客、教程或演示视频
- 为现有视频添加叠加层、字幕、音乐或配音
- 为不同平台重新构图视频（YouTube、TikTok、Instagram）
- 用户说"编辑视频"、"剪辑这个素材"、"制作视频博客"或"视频workflow"

## 核心论点

当你停止要求 AI 创建整个视频而开始用它来压缩、构建和增强真实素材时，AI 视频编辑才有用。价值不在于生成。价值在于压缩。

## 管道

```
Screen Studio / raw footage
  → Claude / Codex
  → FFmpeg
  → Remotion
  → ElevenLabs / fal.ai
  → Descript or CapCut
```

每层都有特定的工作。不要跳过层。不要试图让一个工具做所有事情。

## 第 1 层：捕获（Screen Studio / 原始素材）

Collect the source material:
- **Screen Studio**: polished screen recordings for app demos, coding sessions, browser workflows
- **Raw camera footage**: vlog footage, interviews, event recordings
- **Desktop capture via VideoDB**: session recording with real-time context (see `videodb` skill)

Output: raw files ready for organization.

## 第 2 层：组织（Claude / Codex）

Use Claude Code or Codex to:
- **Transcribe and label**: generate transcript, identify topics and themes
- **Plan structure**: decide what stays, what gets cut, what order works
- **Identify dead sections**: find pauses, tangents, repeated takes
- **Generate edit decision list**: timestamps for cuts, segments to keep
- **Scaffold FFmpeg and Remotion code**: generate the commands and compositions

```
Example prompt:
"Here's the transcript of a 4-hour recording. Identify the 8 strongest segments
for a 24-minute vlog. Give me FFmpeg cut commands for each segment."
```

这一层是关于结构的，不是最终的艺术品味。

## 第 3 层：确定性剪辑（FFmpeg）

FFmpeg handles the boring but critical work: splitting, trimming, concatenating, and preprocessing.

### 按时间戳提取片段

```bash
ffmpeg -i raw.mp4 -ss 00:12:30 -to 00:15:45 -c copy segment_01.mp4
```

### 从编辑决策列表批量剪辑

```bash
#!/bin/bash
# cuts.txt: start,end,label
while IFS=, read -r start end label; do
  ffmpeg -i raw.mp4 -ss "$start" -to "$end" -c copy "segments/${label}.mp4"
done < cuts.txt
```

### 连接片段

```bash
# Create file list
for f in segments/*.mp4; do echo "file '$f'"; done > concat.txt
ffmpeg -f concat -safe 0 -i concat.txt -c copy assembled.mp4
```

### 创建代理以加快编辑

```bash
ffmpeg -i raw.mp4 -vf "scale=960:-2" -c:v libx264 -preset ultrafast -crf 28 proxy.mp4
```

### 提取音频用于转录

```bash
ffmpeg -i raw.mp4 -vn -acodec pcm_s16le -ar 16000 audio.wav
```

### 标准化音频电平

```bash
ffmpeg -i segment.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v copy normalized.mp4
```

## 第 4 层：可编程合成（Remotion）

Remotion 将编辑问题转化为可组合的代码。用于传统编辑器难以处理的事情：

### 何时使用 Remotion

- Overlays: text, images, branding, lower thirds
- Data visualizations: charts, stats, animated numbers
- Motion graphics: transitions, explainer animations
- Composable scenes: reusable templates across videos
- Product demos: annotated screenshots, UI highlights

### 基本的 Remotion 合成

```tsx
import { AbsoluteFill, Sequence, Video, useCurrentFrame } from "remotion";

export const VlogComposition: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Main footage */}
      <Sequence from={0} durationInFrames={300}>
        <Video src="/segments/intro.mp4" />
      </Sequence>

      {/* Title overlay */}
      <Sequence from={30} durationInFrames={90}>
        <AbsoluteFill style={{
          justifyContent: "center",
          alignItems: "center",
        }}>
          <h1 style={{
            fontSize: 72,
            color: "white",
            textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
          }}>
            The AI Editing Stack
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Next segment */}
      <Sequence from={300} durationInFrames={450}>
        <Video src="/segments/demo.mp4" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 渲染输出

```bash
npx remotion render src/index.ts VlogComposition output.mp4
```

See the [Remotion docs](https://www.remotion.dev/docs) for detailed patterns and API reference.

## 第 5 层：生成的素材（ElevenLabs / fal.ai）

只生成你需要的。不要生成整个视频。

### 使用 ElevenLabs 进行配音

```python
import os
import requests

resp = requests.post(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
    headers={
        "xi-api-key": os.environ["ELEVENLABS_API_KEY"],
        "Content-Type": "application/json"
    },
    json={
        "text": "Your narration text here",
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
)
with open("voiceover.mp3", "wb") as f:
    f.write(resp.content)
```

### 使用 fal.ai 制作音乐和音效

Use the `fal-ai-media` skill for:
- Background music generation
- Sound effects (ThinkSound model for video-to-audio)
- Transition sounds

### 使用 fal.ai 生成视觉效果

Use for insert shots, thumbnails, or b-roll that doesn't exist:
```
generate(app_id: "fal-ai/nano-banana-pro", input_data: {
  "prompt": "professional thumbnail for tech vlog, dark background, code on screen",
  "image_size": "landscape_16_9"
})
```

### VideoDB 生成音频

If VideoDB is configured:
```python
voiceover = coll.generate_voice(text="Narration here", voice="alloy")
music = coll.generate_music(prompt="lo-fi background for coding vlog", duration=120)
sfx = coll.generate_sound_effect(prompt="subtle whoosh transition")
```

## 第 6 层：最终精修（Descript / CapCut）

最后一层是人工的。使用传统编辑器进行：
- **Pacing**: adjust cuts that feel too fast or slow
- **Captions**: auto-generated, then manually cleaned
- **Color grading**: basic correction and mood
- **Final audio mix**: balance voice, music, and SFX levels
- **Export**: platform-specific formats and quality settings

这是品味所在的地方。AI 清除重复的工作。你做出最终决定。

## 社交媒体重新构图

Different platforms need different aspect ratios:

| Platform | Aspect Ratio | Resolution |
|----------|-------------|------------|
| YouTube | 16:9 | 1920x1080 |
| TikTok / Reels | 9:16 | 1080x1920 |
| Instagram Feed | 1:1 | 1080x1080 |
| X / Twitter | 16:9 or 1:1 | 1280x720 or 720x720 |

### 使用 FFmpeg 重新构图

```bash
# 16:9 to 9:16 (center crop)
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" vertical.mp4

# 16:9 to 1:1 (center crop)
ffmpeg -i input.mp4 -vf "crop=ih:ih,scale=1080:1080" square.mp4
```

### 使用 VideoDB 重新构图

```python
from videodb import ReframeMode

# Smart reframe (AI-guided subject tracking)
reframed = video.reframe(start=0, end=60, target="vertical", mode=ReframeMode.smart)
```

## 场景检测和自动剪辑

### FFmpeg 场景检测

```bash
# Detect scene changes (threshold 0.3 = moderate sensitivity)
ffmpeg -i input.mp4 -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep showinfo
```

### 用于自动剪辑的静音检测

```bash
# Find silent segments (useful for cutting dead air)
ffmpeg -i input.mp4 -af silencedetect=noise=-30dB:d=2 -f null - 2>&1 | grep silence
```

### 高光提取

Use Claude to analyze transcript + scene timestamps:
```
"Given this transcript with timestamps and these scene change points,
identify the 5 most engaging 30-second clips for social media."
```

## 每个工具的专长

| Tool | Strength | Weakness |
|------|----------|----------|
| Claude / Codex | Organization, planning, code generation | Not the creative taste layer |
| FFmpeg | Deterministic cuts, batch processing, format conversion | No visual editing UI |
| Remotion | Programmable overlays, composable scenes, reusable templates | Learning curve for non-devs |
| Screen Studio | Polished screen recordings immediately | Only screen capture |
| ElevenLabs | Voice, narration, music, SFX | Not the center of the workflow |
| Descript / CapCut | Final pacing, captions, polish | Manual, not automatable |

## 关键原则

1. **编辑，不要生成。** 此workflow用于剪辑真实素材，而非从提示创建。
2. **先结构后风格。** 在第 2 层把故事做对，再碰视觉的东西。
3. **FFmpeg 是骨干。** 枯燥但关键。长长的素材变得可管理。
4. **Remotion 用于可重复性。** 如果你要做多次，把它做成 Remotion 组件。
5. **有选择地生成。** 只对不存在的素材使用 AI 生成，而非所有东西。
6. **品味是最后一层。** AI 清除重复的工作。你做出最终的艺术决定。

## 相关skill

- `fal-ai-media` — AI image, video, and audio generation
- `videodb` — Server-side video processing, indexing, and streaming
- `content-engine` — Platform-native content distribution
