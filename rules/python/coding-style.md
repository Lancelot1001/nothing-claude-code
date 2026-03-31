---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python 编码风格

> 本文件继承 [common/coding-style.md](../common/coding-style.md)，包含 Python 特定内容。

## 标准

- 遵循 **PEP 8** 约定
- 所有函数签名使用 **type annotations**

## 不可变性

优先使用不可变数据结构：

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class User:
    name: str
    email: str

from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
```

## 格式化

- **black**：代码格式化
- **isort**：导入排序
- **ruff**：lint 检查

## 参考

参见 skill: `python-patterns` 获取全面的 Python 惯用模式和最佳实践。
