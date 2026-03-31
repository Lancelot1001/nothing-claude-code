---
description: 全面审查 Python 代码的 PEP 8 合规性、类型提示、安全性和 Python 惯用 idiom。调用 python-reviewer agent。
---

# Python 代码审查

此命令调用 **python-reviewer** agent进行全面的 Python 特定代码审查。

## 此命令做什么

1. **识别 Python 变更**：通过 `git diff` 找到修改的 `.py` 文件
2. **运行静态分析**：执行 `ruff`、`mypy`、`pylint`、`black --check`
3. **安全扫描**：检查 SQL 注入、命令注入、不安全反序列化
4. **类型安全审查**：分析类型提示和 mypy 错误
5. **Pythonic 代码检查**：验证代码遵循 PEP 8 和 Python 最佳实践
6. **生成报告**：按严重性分类问题

## 使用场景

在以下情况使用 `/python-review`：
- 编写或修改 Python 代码后
- 提交 Python 更改前
- 审查包含 Python 代码的拉取请求
- 加入新的 Python 代码库
- 学习 Pythonic 模式和惯用 idiom

## 审查类别

### 严重（必须修复）
- SQL/命令注入漏洞
- 不安全的 eval/exec 使用
- Pickle 不安全反序列化
- 硬编码凭证
- YAML 不安全加载
- 隐藏错误的裸 except 子句

### 高（应该修复）
- 公共函数缺少类型提示
- 可变默认参数
- 静默吞掉异常
- 资源未使用上下文管理器
- C 风格循环而非推导式
- 使用 type() 而非 isinstance()
- 无锁的竞态条件

### 中等（考虑）
- PEP 8 格式违规
- 公共函数缺少文档字符串
- 使用 print 而非 logging
- 低效的字符串操作
- 魔法数字没有命名常量
- 未使用 f-strings 格式化
- 不必要的列表创建

## 运行的自动检查

```bash
# 类型检查
mypy .

# Linting 和格式化
ruff check .
black --check .
isort --check-only .

# 安全扫描
bandit -r .

# 依赖审计
pip-audit
safety check

# 测试
pytest --cov=app --cov-report=term-missing
```

## 示例用法

```text
用户：/python-review

agent：
# Python 代码审查报告

## 审查的文件
- app/routes/user.py（已修改）
- app/services/auth.py（已修改）

## 静态分析结果
✓ ruff：无问题
✓ mypy：无错误
警告：black：2 个文件需要重新格式化
✓ bandit：无安全问题

## 发现的问题

[严重] SQL 注入漏洞
文件：app/routes/user.py:42
问题：用户输入直接插入 SQL 查询
```python
query = f"SELECT * FROM users WHERE id = {user_id}"  # 不好
```
修复：使用参数化查询
```python
query = "SELECT * FROM users WHERE id = %s"  # 好
cursor.execute(query, (user_id,))
```

[高] 可变默认参数
文件：app/services/auth.py:18
问题：可变默认参数导致共享状态
```python
def process_items(items=[]):  # 不好
    items.append("new")
    return items
```
修复：使用 None 作为默认值
```python
def process_items(items=None):  # 好
    if items is None:
        items = []
    items.append("new")
    return items
```

[中等] 缺少类型提示
文件：app/services/auth.py:25
问题：公共函数没有类型注解
```python
def get_user(user_id):  # 不好
    return db.find(user_id)
```
修复：添加类型提示
```python
def get_user(user_id: str) -> Optional[User]:  # 好
    return db.find(user_id)
```

[中等] 未使用上下文管理器
文件：app/routes/user.py:55
问题：异常时文件未关闭
```python
f = open("config.json")  # 不好
data = f.read()
f.close()
```
修复：使用上下文管理器
```python
with open("config.json") as f:  # 好
    data = f.read()
```

## 摘要
- 严重：1
- 高：1
- 中等：2

建议：失败：阻止合并，直到严重问题修复

## 格式化要求
运行：`black app/routes/user.py app/services/auth.py`
```

## 批准标准

| 状态 | 条件 |
|--------|-----------|
| 通过：批准 | 无严重或高问题 |
| 警告：警告 | 只有中等问题（谨慎合并） |
| 失败：阻止 | 发现严重或高问题 |

## 与其他命令的集成

- 先使用 `/tdd` 确保测试通过
- 使用 `/code-review` 处理非 Python 特定问题
- 提交前使用 `/python-review`
- 如果静态分析工具失败使用 `/build-fix`

## 框架特定审查

### Django 项目
审查者检查：
- N+1 查询问题（使用 `select_related` 和 `prefetch_related`）
- 模型更改缺少迁移
- ORM 可用时使用原始 SQL
- 多步骤操作缺少 `transaction.atomic()`

### FastAPI 项目
审查者检查：
- CORS 配置错误
- Pydantic 模型用于请求验证
- 响应模型正确性
- 正确的 async/await 使用
- 依赖注入模式

### Flask 项目
审查者检查：
- 上下文管理（app context、request context）
- 正确的错误处理
- Blueprint 组织
- 配置管理

## 相关

- agent：`agents/python-reviewer.md`
- skill：`skills/python-patterns/`、`skills/python-testing/`

## 常见修复

### 添加类型提示
```python
# 之前
def calculate(x, y):
    return x + y

# 之后
from typing import Union

def calculate(x: Union[int, float], y: Union[int, float]) -> Union[int, float]:
    return x + y
```

### 使用上下文管理器
```python
# 之前
f = open("file.txt")
data = f.read()
f.close()

# 之后
with open("file.txt") as f:
    data = f.read()
```

### 使用列表推导式
```python
# 之前
result = []
for item in items:
    if item.active:
        result.append(item.name)

# 之后
result = [item.name for item in items if item.active]
```

### 修复可变默认
```python
# 之前
def append(value, items=[]):
    items.append(value)
    return items

# 之后
def append(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items
```

### 使用 f-strings（Python 3.6+）
```python
# 之前
name = "Alice"
greeting = "Hello, " + name + "!"
greeting2 = "Hello, {}".format(name)

# 之后
greeting = f"Hello, {name}!"
```

### 修复循环中的字符串连接
```python
# 之前
result = ""
for item in items:
    result += str(item)

# 之后
result = "".join(str(item) for item in items)
```

## Python 版本兼容性

审查者注意代码使用更新 Python 版本的特性：

| 特性 | 最低 Python |
|---------|----------------|
| 类型提示 | 3.5+ |
| f-strings | 3.6+ |
| Walrus 操作符 (`:=`) | 3.8+ |
| 仅位置参数 | 3.8+ |
| Match 语句 | 3.10+ |
| 类型联合（`x | None`） | 3.10+ |

确保项目的 `pyproject.toml` 或 `setup.py` 指定了正确的最低 Python 版本。
