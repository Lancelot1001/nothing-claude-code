#!/bin/bash
#
# something-claude-code 核心配置安装脚本
# 安装核心必装的 rules、agents、commands 到用户级 ~/.claude/ 目录
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "something-claude-code 核心配置安装"
echo "========================================"
echo ""

# 创建用户级配置目录
mkdir -p ~/.claude/rules/common
mkdir -p ~/.claude/agents
mkdir -p ~/.claude/commands

echo "✅ 用户配置目录已创建"
echo ""

# ========================================
# 1. 安装核心 Rules (rules/common/)
# ========================================
echo "📋 安装核心 Rules..."

CORE_RULES=(
    "coding-style"
    "security"
    "testing"
    "git-workflow"
    "hooks"
    "agents"
    "patterns"
)

for rule in "${CORE_RULES[@]}"; do
    src="$PROJECT_DIR/rules/common/$rule.md"
    if [ -f "$src" ]; then
        cp "$src" ~/.claude/rules/common/
        echo "  ✅ $rule.md"
    else
        echo "  ⚠️  $rule.md 未找到，跳过"
    fi
done

echo ""

# ========================================
# 2. 安装核心 Agents
# ========================================
echo "🤖 安装核心 Agents..."

CORE_AGENTS=(
    "planner"
    "code-reviewer"
    "tdd-guide"
    "security-reviewer"
    "build-error-resolver"
)

for agent in "${CORE_AGENTS[@]}"; do
    src="$PROJECT_DIR/agents/$agent.md"
    if [ -f "$src" ]; then
        cp "$src" ~/.claude/agents/
        echo "  ✅ $agent"
    else
        echo "  ⚠️  $agent.md 未找到，跳过"
    fi
done

echo ""

# ========================================
# 3. 安装核心 Commands
# ========================================
echo "⚡ 安装核心 Commands..."

CORE_COMMANDS=(
    "plan"
    "tdd"
    "code-review"
    "build-fix"
    "save-session"
    "resume-session"
    "checkpoint"
    "learn-eval"
)

for cmd in "${CORE_COMMANDS[@]}"; do
    src="$PROJECT_DIR/commands/$cmd.md"
    if [ -f "$src" ]; then
        cp "$src" ~/.claude/commands/
        echo "  ✅ /$cmd"
    else
        echo "  ⚠️  $cmd.md 未找到，跳过"
    fi
done

echo ""

# ========================================
# 4. 安装 .claude/commands (官方工作流)
# ========================================
echo "🔧 安装官方工作流 Commands..."

WORKFLOW_COMMANDS=(
    "feature-development"
    "database-migration"
    "add-language-rules"
)

for cmd in "${WORKFLOW_COMMANDS[@]}"; do
    src="$PROJECT_DIR/.claude/commands/$cmd.md"
    if [ -f "$src" ]; then
        cp "$src" ~/.claude/commands/
        echo "  ✅ /$cmd"
    else
        echo "  ⚠️  $cmd.md 未找到，跳过"
    fi
done

echo ""
echo "========================================"
echo "✅ 核心配置安装完成！"
echo "========================================"
echo ""
echo "已安装："
echo "  • ${#CORE_RULES[@]} 个核心 Rules"
echo "  • ${#CORE_AGENTS[@]} 个核心 Agents"
echo "  • $((${#CORE_COMMANDS[@]} + ${#WORKFLOW_COMMANDS[@]})) 个 Commands"
echo ""
echo "重启 Claude Code 或输入 /reload 使配置生效"
echo ""
