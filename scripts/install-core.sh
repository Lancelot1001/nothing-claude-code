#!/bin/bash
#
# something-claude-code 配置安装脚本
# 安装 rules、agents、commands 到用户级 ~/.claude/ 目录
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --core          安装核心配置（默认）"
    echo "  --chinese       安装中文规则 (rules/zh/)"
    echo "  --all           安装所有内容"
    echo "  --lang LANG     安装指定语言规则 (python, go, typescript, rust, etc.)"
    echo "  --agents        安装所有 Agents"
    echo "  --commands      安装所有 Commands"
    echo "  --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --core                 # 安装核心"
    echo "  $0 --chinese              # 安装中文规则"
    echo "  $0 --all                  # 安装全部"
    echo "  $0 --lang python          # 安装 Python 规则"
}

# 默认安装核心
INSTALL_CORE=false
INSTALL_CHINESE=false
INSTALL_ALL=false
INSTALL_LANG=""
INSTALL_ALL_AGENTS=false
INSTALL_ALL_COMMANDS=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --core)
            INSTALL_CORE=true
            shift
            ;;
        --chinese)
            INSTALL_CHINESE=true
            shift
            ;;
        --all)
            INSTALL_ALL=true
            shift
            ;;
        --lang)
            INSTALL_LANG="$2"
            shift 2
            ;;
        --agents)
            INSTALL_ALL_AGENTS=true
            shift
            ;;
        --commands)
            INSTALL_ALL_COMMANDS=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# 如果没有指定任何选项，默认安装核心
if [ "$INSTALL_CORE" = false ] && [ "$INSTALL_CHINESE" = false ] && [ "$INSTALL_ALL" = false ] && [ -z "$INSTALL_LANG" ] && [ "$INSTALL_ALL_AGENTS" = false ] && [ "$INSTALL_ALL_COMMANDS" = false ]; then
    INSTALL_CORE=true
fi

echo "========================================"
echo "something-claude-code 配置安装"
echo "========================================"
echo ""

# 创建用户级配置目录
mkdir -p ~/.claude/rules/common
mkdir -p ~/.claude/rules/zh
mkdir -p ~/.claude/agents
mkdir -p ~/.claude/commands

echo -e "${GREEN}✅ 用户配置目录已创建${NC}"
echo ""

# ========================================
# 1. 安装核心 Rules
# ========================================
if [ "$INSTALL_CORE" = true ] || [ "$INSTALL_ALL" = true ]; then
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
fi

# ========================================
# 2. 安装中文规则
# ========================================
if [ "$INSTALL_CHINESE" = true ] || [ "$INSTALL_ALL" = true ]; then
    echo "📋 安装中文规则 (rules/zh/)..."

    ZH_RULES=(
        "README"
        "coding-style"
        "security"
        "testing"
        "git-workflow"
        "hooks"
        "agents"
        "patterns"
        "performance"
        "development-workflow"
    )

    for rule in "${ZH_RULES[@]}"; do
        src="$PROJECT_DIR/rules/zh/$rule.md"
        if [ -f "$src" ]; then
            cp "$src" ~/.claude/rules/zh/
            echo "  ✅ $rule.md"
        else
            echo "  ⚠️  $rule.md 未找到，跳过"
        fi
    done
    echo ""
fi

# ========================================
# 3. 安装指定语言规则
# ========================================
if [ -n "$INSTALL_LANG" ]; then
    echo "📋 安装 $INSTALL_LANG 规则..."

    LANG_RULES=(
        "coding-style"
        "security"
        "testing"
        "hooks"
        "patterns"
    )

    for rule in "${LANG_RULES[@]}"; do
        src="$PROJECT_DIR/rules/$INSTALL_LANG/$rule.md"
        if [ -f "$src" ]; then
            mkdir -p ~/.claude/rules/$INSTALL_LANG
            cp "$src" ~/.claude/rules/$INSTALL_LANG/
            echo "  ✅ $rule.md"
        else
            echo "  ⚠️  $rule.md 未找到，跳过"
        fi
    done
    echo ""
fi

# ========================================
# 4. 安装核心 Agents
# ========================================
if [ "$INSTALL_CORE" = true ] || [ "$INSTALL_ALL" = true ]; then
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
fi

# ========================================
# 5. 安装所有 Agents
# ========================================
if [ "$INSTALL_ALL_AGENTS" = true ] || [ "$INSTALL_ALL" = true ]; then
    echo "🤖 安装所有 Agents..."

    for agent_file in "$PROJECT_DIR"/agents/*.md; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file" .md)
            cp "$agent_file" ~/.claude/agents/
            echo "  ✅ $agent_name"
        fi
    done
    echo ""
fi

# ========================================
# 6. 安装核心 Commands
# ========================================
if [ "$INSTALL_CORE" = true ] || [ "$INSTALL_ALL" = true ]; then
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

    # 官方工作流 Commands
    echo ""
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
fi

# ========================================
# 7. 安装所有 Commands
# ========================================
if [ "$INSTALL_ALL_COMMANDS" = true ] || [ "$INSTALL_ALL" = true ]; then
    echo "⚡ 安装所有 Commands..."

    for cmd_file in "$PROJECT_DIR"/commands/*.md; do
        if [ -f "$cmd_file" ]; then
            cmd_name=$(basename "$cmd_file" .md)
            cp "$cmd_file" ~/.claude/commands/
            echo "  ✅ /$cmd_name"
        fi
    done

    # .claude/commands
    for cmd_file in "$PROJECT_DIR"/.claude/commands/*.md; do
        if [ -f "$cmd_file" ]; then
            cmd_name=$(basename "$cmd_file" .md)
            cp "$cmd_file" ~/.claude/commands/
            echo "  ✅ /$cmd_name"
        fi
    done
    echo ""
fi

echo "========================================"
echo -e "${GREEN}✅ 配置安装完成！${NC}"
echo "========================================"
echo ""
echo "安装摘要："
[ "$INSTALL_CORE" = true ] || [ "$INSTALL_ALL" = true ] && echo "  • 核心 Rules"
[ "$INSTALL_CHINESE" = true ] || [ "$INSTALL_ALL" = true ] && echo "  • 中文规则 (rules/zh/)"
[ -n "$INSTALL_LANG" ] && echo "  • $INSTALL_LANG 规则"
[ "$INSTALL_ALL_AGENTS" = true ] || [ "$INSTALL_ALL" = true ] && echo "  • 所有 Agents"
[ "$INSTALL_ALL_COMMANDS" = true ] || [ "$INSTALL_ALL" = true ] && echo "  • 所有 Commands"
echo ""
echo "重启 Claude Code 或输入 /reload 使配置生效"
echo ""
