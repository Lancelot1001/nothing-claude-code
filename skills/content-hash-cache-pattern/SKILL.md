---
name: content-hash-cache-pattern
description: 使用 SHA-256 内容哈希缓存昂贵的文件处理结果——路径无关、自动失效、服务层分离。
origin: nothing-claude-code
---

# 内容哈希文件缓存模式

使用 SHA-256 内容哈希作为缓存键来缓存昂贵的文件处理结果（PDF 解析、文本提取、图像分析）。与基于路径的缓存不同，这种方法在文件移动/重命名后仍然有效，并且在内容更改时自动失效。

## 何时激活

- 构建文件处理管道（PDF、图像、文本提取）
- 处理成本高且相同文件被重复处理
- 需要 `--cache/--no-cache` CLI 选项
- 想在不修改现有纯函数的情况下向其添加缓存

## 核心模式

### 1. 基于内容哈希的缓存键

使用文件内容（而不是路径）作为缓存键：

```python
import hashlib
from pathlib import Path

_HASH_CHUNK_SIZE = 65536  # 64KB 分块，用于大文件

def compute_file_hash(path: Path) -> str:
    """文件内容的 SHA-256（大文件分块处理）。"""
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    sha256 = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(_HASH_CHUNK_SIZE)
            if not chunk:
                break
            sha256.update(chunk)
    return sha256.hexdigest()
```

**为什么用内容哈希？** 文件重命名/移动 = 缓存命中。内容更改 = 自动失效。无需索引文件。

### 2. 用于缓存条目的 Frozen Dataclass

```python
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class CacheEntry:
    file_hash: str
    source_path: str
    document: ExtractedDocument  # 缓存的结果
```

### 3. 基于文件的缓存存储

每个缓存条目存储为 `{hash}.json`——通过哈希 O(1) 查找，无需索引文件。

```python
import json
from typing import Any

def write_cache(cache_dir: Path, entry: CacheEntry) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"{entry.file_hash}.json"
    data = serialize_entry(entry)
    cache_file.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

def read_cache(cache_dir: Path, file_hash: str) -> CacheEntry | None:
    cache_file = cache_dir / f"{file_hash}.json"
    if not cache_file.is_file():
        return None
    try:
        raw = cache_file.read_text(encoding="utf-8")
        data = json.loads(raw)
        return deserialize_entry(data)
    except (json.JSONDecodeError, ValueError, KeyError):
        return None  # 将损坏视为缓存未命中
```

### 4. 服务层包装器（SRP）

保持处理函数纯净。将缓存作为单独的服务层添加。

```python
def extract_with_cache(
    file_path: Path,
    *,
    cache_enabled: bool = True,
    cache_dir: Path = Path(".cache"),
) -> ExtractedDocument:
    """服务层：缓存检查 -> 提取 -> 缓存写入。"""
    if not cache_enabled:
        return extract_text(file_path)  # 纯函数，不了解缓存

    file_hash = compute_file_hash(file_path)

    # 检查缓存
    cached = read_cache(cache_dir, file_hash)
    if cached is not None:
        logger.info("Cache hit: %s (hash=%s)", file_path.name, file_hash[:12])
        return cached.document

    # 缓存未命中 -> 提取 -> 存储
    logger.info("Cache miss: %s (hash=%s)", file_path.name, file_hash[:12])
    doc = extract_text(file_path)
    entry = CacheEntry(file_hash=file_hash, source_path=str(file_path), document=doc)
    write_cache(cache_dir, entry)
    return doc
```

## 关键设计决策

| 决策 | 理由 |
|----------|-----------|
| SHA-256 内容哈希 | 路径无关，内容更改时自动失效 |
| `{hash}.json` 文件命名 | O(1) 查找，无需索引文件 |
| 服务层包装器 | SRP：提取保持纯净，缓存是独立关注点 |
| 手动 JSON 序列化 | 完全控制 frozen dataclass 序列化 |
| 损坏返回 `None` | 优雅降级，下次运行时重新处理 |
| `cache_dir.mkdir(parents=True)` | 首次写入时延迟创建目录 |

## 最佳实践

- **哈希内容，而不是路径**——路径会变，内容标识不会变
- **哈希大文件时分块**——避免将整个文件加载到内存中
- **保持处理函数纯净**——它们应该对缓存一无所知
- **记录缓存命中/未命中**并使用截断的哈希值以便调试
- **优雅处理损坏**——将无效缓存条目视为未命中，永远不要崩溃

## 应避免的反模式

```python
# 错误：基于路径的缓存（文件移动/重命名时会失效）
cache = {"/path/to/file.pdf": result}

# 错误：在处理函数内部添加缓存逻辑（违反 SRP）
def extract_text(path, *, cache_enabled=False, cache_dir=None):
    if cache_enabled:  # 现在这个函数有两个职责
        ...

# 错误：对嵌套 frozen dataclass 使用 dataclasses.asdict()
#（可能导致复杂嵌套类型的问题）
data = dataclasses.asdict(entry)  # 改用手动序列化
```

## 何时使用

- 文件处理管道（PDF 解析、OCR、文本提取、图像分析）
- 可从 `--cache/--no-cache` 选项中受益的 CLI 工具
- 跨运行批次处理相同文件
- 在不修改现有纯函数的情况下向其添加缓存

## 何时不使用

- 必须始终保持新鲜的数据（实时订阅）
- 可能非常大的缓存条目（考虑改用流式处理）
- 依赖于文件内容以外参数的结果（例如，不同的提取配置）
