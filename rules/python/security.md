---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python 安全

> 本文件继承 [common/security.md](../common/security.md)，包含 Python 特定内容。

## Secret Management

```python
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ["OPENAI_API_KEY"]  # 缺失时抛出 KeyError
```

## 安全扫描

- 使用 **bandit** 进行静态安全分析：
  ```bash
  bandit -r src/
  ```

## 参考

参见 skill: `django-security` 获取 Django 特定的安全指南（如适用）。
