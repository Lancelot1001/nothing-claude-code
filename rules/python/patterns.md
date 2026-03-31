---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python 模式

> 本文件继承 [common/patterns.md](../common/patterns.md)，包含 Python 特定内容。

## Protocol（鸭子类型）

```python
from typing import Protocol

class Repository(Protocol):
    def find_by_id(self, id: str) -> dict | None: ...
    def save(self, entity: dict) -> dict: ...
```

## Dataclasses as DTOs

```python
from dataclasses import dataclass

@dataclass
class CreateUserRequest:
    name: str
    email: str
    age: int | None = None
```

## Context Managers & Generators

- 使用 context managers（`with` 语句）管理资源
- 使用 generators 实现惰性求值和内存高效迭代

## 参考

参见 skill: `python-patterns` 获取全面的模式，包括装饰器、并发和包组织。
