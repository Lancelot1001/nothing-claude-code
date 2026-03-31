---
name: skill-health
description: 显示带有图表和分析的skill组合健康仪表板
command: true
---

# skill健康仪表板

显示所有skill组合的综合健康仪表板，包含成功率迷你图、失败模式聚类、待处理修正和版本历史。

## 实现

以仪表板模式运行skill健康 CLI：

```bash
ECC_ROOT="${CLAUDE_PLUGIN_ROOT:-$(node -e "var p=require('path'),f=require('fs'),h=require('os').homedir(),d=p.join(h,'.claude'),q=p.join('scripts','lib','utils.js');if(!f.existsSync(p.join(d,q))){try{var b=p.join(d,'plugins','cache','everything-claude-code');for(var o of f.readdirSync(b))for(var v of f.readdirSync(p.join(b,o))){var c=p.join(b,o,v);if(f.existsSync(p.join(c,q))){d=c;break}}}catch(x){}}console.log(d)")}"
node "$ECC_ROOT/scripts/skills-health.js" --dashboard
```

仅特定面板：

```bash
ECC_ROOT="${CLAUDE_PLUGIN_ROOT:-$(node -e "var p=require('path'),f=require('fs'),h=require('os').homedir(),d=p.join(h,'.claude'),q=p.join('scripts','lib','utils.js');if(!f.existsSync(p.join(d,q))){try{var b=p.join(d,'plugins','cache','everything-claude-code');for(var o of f.readdirSync(b))for(var v of f.readdirSync(p.join(b,o))){var c=p.join(b,o,v);if(f.existsSync(p.join(c,q))){d=c;break}}}catch(x){}}console.log(d)")}"
node "$ECC_ROOT/scripts/skills-health.js" --dashboard --panel failures
```

机器可读输出：

```bash
ECC_ROOT="${CLAUDE_PLUGIN_ROOT:-$(node -e "var p=require('path'),f=require('fs'),h=require('os').homedir(),d=p.join(h,'.claude'),q=p.join('scripts','lib','utils.js');if(!f.existsSync(p.join(d,q))){try{var b=p.join(d,'plugins','cache','everything-claude-code');for(var o of f.readdirSync(b))for(var v of f.readdirSync(p.join(b,o))){var c=p.join(b,o,v);if(f.existsSync(p.join(c,q))){d=c;break}}}catch(x){}}console.log(d)")}"
node "$ECC_ROOT/scripts/skills-health.js" --dashboard --json
```

## 使用方法

```
/skill-health                    # 完整仪表板视图
/skill-health --panel failures   # 仅失败聚类面板
/skill-health --json             # 机器可读 JSON 输出
```

## 执行步骤

1. 使用 --dashboard 标志运行 skills-health.js 脚本
2. 向用户显示输出
3. 如果有任何skill在衰退，标记它们并建议运行 /evolve
4. 如果有待处理修正，建议审查

## 面板

- **成功率 (30d)** — 显示每日成功率按skill的迷你图
- **失败模式** — 带有水平条形图的失败原因聚类
- **待处理修正** — 等待审查的修正提议
- **版本历史** — 每个skill版本快照的时间线
