---
name: x-api
description: X/Twitter API 集成，用于发布推文、线程、读取时间线、搜索和分析。涵盖 OAuth 认证模式、速率限制和平台原生内容发布。当用户想要以编程方式与 X 交互时使用
origin: something-claude-code
---

# X API

以编程方式与 X（Twitter）交互，用于发布、读取、搜索和分析。

## 何时激活

- 用户想要以编程方式发布推文或线程
- 从 X 读取时间线、提及或用户数据
- 在 X 上搜索内容、趋势或对话
- 构建 X 集成或机器人
- 分析和参与度追踪
- 用户说"发布到 X"、"发推文"、"X API"或"Twitter API"

## 认证

### OAuth 2.0 Bearer Token（仅应用）

Best for: read-heavy operations, search, public data.

```bash
# Environment setup
export X_BEARER_TOKEN="your-bearer-token"
```

```python
import os
import requests

bearer = os.environ["X_BEARER_TOKEN"]
headers = {"Authorization": f"Bearer {bearer}"}

# Search recent tweets
resp = requests.get(
    "https://api.x.com/2/tweets/search/recent",
    headers=headers,
    params={"query": "claude code", "max_results": 10}
)
tweets = resp.json()
```

### OAuth 1.0a（用户上下文）

Required for: posting tweets, managing account, DMs.

```bash
# Environment setup — source before use
export X_API_KEY="your-api-key"
export X_API_SECRET="your-api-secret"
export X_ACCESS_TOKEN="your-access-token"
export X_ACCESS_SECRET="your-access-secret"
```

```python
import os
from requests_oauthlib import OAuth1Session

oauth = OAuth1Session(
    os.environ["X_API_KEY"],
    client_secret=os.environ["X_API_SECRET"],
    resource_owner_key=os.environ["X_ACCESS_TOKEN"],
    resource_owner_secret=os.environ["X_ACCESS_SECRET"],
)
```

## 核心操作

### 发布推文

```python
resp = oauth.post(
    "https://api.x.com/2/tweets",
    json={"text": "Hello from Claude Code"}
)
resp.raise_for_status()
tweet_id = resp.json()["data"]["id"]
```

### 发布线程

```python
def post_thread(oauth, tweets: list[str]) -> list[str]:
    ids = []
    reply_to = None
    for text in tweets:
        payload = {"text": text}
        if reply_to:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to}
        resp = oauth.post("https://api.x.com/2/tweets", json=payload)
        tweet_id = resp.json()["data"]["id"]
        ids.append(tweet_id)
        reply_to = tweet_id
    return ids
```

### 读取用户时间线

```python
resp = requests.get(
    f"https://api.x.com/2/users/{user_id}/tweets",
    headers=headers,
    params={
        "max_results": 10,
        "tweet.fields": "created_at,public_metrics",
    }
)
```

### 搜索推文

```python
resp = requests.get(
    "https://api.x.com/2/tweets/search/recent",
    headers=headers,
    params={
        "query": "from:affaanmustafa -is:retweet",
        "max_results": 10,
        "tweet.fields": "public_metrics,created_at",
    }
)
```

### 通过用户名获取用户

```python
resp = requests.get(
    "https://api.x.com/2/users/by/username/affaanmustafa",
    headers=headers,
    params={"user.fields": "public_metrics,description,created_at"}
)
```

### 上传媒体并发布

```python
# Media upload uses v1.1 endpoint

# Step 1: Upload media
media_resp = oauth.post(
    "https://upload.twitter.com/1.1/media/upload.json",
    files={"media": open("image.png", "rb")}
)
media_id = media_resp.json()["media_id_string"]

# Step 2: Post with media
resp = oauth.post(
    "https://api.x.com/2/tweets",
    json={"text": "Check this out", "media": {"media_ids": [media_id]}}
)
```

## 速率限制

X API rate limits vary by endpoint, auth method, and account tier, and they change over time. Always:
- Check the current X developer docs before hardcoding assumptions
- Read `x-rate-limit-remaining` and `x-rate-limit-reset` headers at runtime
- Back off automatically instead of relying on static tables in code

```python
import time

remaining = int(resp.headers.get("x-rate-limit-remaining", 0))
if remaining < 5:
    reset = int(resp.headers.get("x-rate-limit-reset", 0))
    wait = max(0, reset - int(time.time()))
    print(f"Rate limit approaching. Resets in {wait}s")
```

## 错误处理

```python
resp = oauth.post("https://api.x.com/2/tweets", json={"text": content})
if resp.status_code == 201:
    return resp.json()["data"]["id"]
elif resp.status_code == 429:
    reset = int(resp.headers["x-rate-limit-reset"])
    raise Exception(f"Rate limited. Resets at {reset}")
elif resp.status_code == 403:
    raise Exception(f"Forbidden: {resp.json().get('detail', 'check permissions')}")
else:
    raise Exception(f"X API error {resp.status_code}: {resp.text}")
```

## 安全

- **Never hardcode tokens.** Use environment variables or `.env` files.
- **Never commit `.env` files.** Add to `.gitignore`.
- **Rotate tokens** if exposed. Regenerate at developer.x.com.
- **Use read-only tokens** when write access is not needed.
- **Store OAuth secrets securely** — not in source code or logs.

## 与内容引擎的集成

Use `content-engine` skill to generate platform-native content, then post via X API:
1. Generate content with content-engine (X platform format)
2. Validate length (280 chars for single tweet)
3. Post via X API using patterns above
4. Track engagement via public_metrics

## 相关skill

- `content-engine` — Generate platform-native content for X
- `crosspost` — Distribute content across X, LinkedIn, and other platforms
