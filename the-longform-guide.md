# The Longform Guide to Everything Claude Code

---

> **Prerequisite**: This guide builds on [The Shorthand Guide to Everything Claude Code](./the-shortform-guide.md). Read that first if you haven't set up skills, hooks, subagents, MCPs, and plugins.

In the shorthand guide, I covered the foundational setup: skills and commands, hooks, subagents, MCPs, plugins, and the configuration patterns that form the backbone of an effective Claude Code workflow.

This longform guide goes into the techniques that separate productive sessions from wasteful ones. The themes here: token economics, memory persistence, verification patterns, parallelization strategies, and the compound effects of building reusable workflows.

---

## Tips and Tricks

### Some MCPs are Replaceable and Will Free Up Your Context Window

For MCPs such as version control (GitHub), databases (Supabase), deployment (Vercel, Railway) etc. - most of these platforms already have robust CLIs that the MCP is essentially just wrapping. The MCP is a nice wrapper but it comes at a cost.

To have the CLI function more like an MCP without actually using the MCP (and the decreased context window that comes with it), consider bundling the functionality into skills and commands.

Example: instead of having the GitHub MCP loaded at all times, create a `/gh-pr` command that wraps `gh pr create` with your preferred options.

---

## IMPORTANT STUFF

### Context and Memory Management

For sharing memory across sessions, a skill or command that summarizes and checks in on progress then saves to a `.tmp` file in your `.claude` folder and appends to it until the end of your session is the best bet. The next day it can use that as context and pick up where you left off.

**Clearing Context Strategically:**

Once you have your plan set and context cleared, you can work from the plan. This is useful when you've accumulated a lot of exploration context that's no longer relevant to execution.

**Advanced: Dynamic System Prompt Injection**

Instead of solely putting everything in CLAUDE.md or `.claude/rules/` which loads every session, use CLI flags to inject context dynamically.

```bash
claude --system-prompt "$(cat memory.md)"
```

**Practical setup:**

```bash
# Daily development
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR review mode
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# Research/exploration mode
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

---

### Continuous Learning / Memory

If you've had to repeat a prompt multiple times and Claude ran into the same problem or gave you a response you've heard before - those patterns must be appended to skills.

**The Problem:** Wasted tokens, wasted context, wasted time.

**The Solution:** When Claude Code discovers something that isn't trivial - a debugging technique, a workaround, some project-specific pattern - it saves that knowledge as a new skill.

---

### Token Optimization

**Primary Strategy: Subagent Architecture**

Optimize the tools you use and subagent architecture designed to delegate the cheapest possible model that is sufficient for the task.

**Model Selection Quick Reference:**

| Task Type                 | Model  | Why                                        |
| ------------------------- | ------ | ------------------------------------------ |
| Exploration/search        | Haiku  | Fast, cheap, good enough for finding files |
| Simple edits              | Haiku  | Single-file changes, clear instructions    |
| Multi-file implementation | Sonnet | Best balance for coding                     |
| Complex architecture      | Opus   | Deep reasoning needed                       |
| PR reviews                | Sonnet | Understands context, catches nuance         |
| Security analysis         | Opus   | Can't afford to miss vulnerabilities        |
| Writing docs              | Haiku  | Structure is simple                         |
| Debugging complex bugs    | Opus   | Needs to hold entire system in mind         |

Default to Sonnet for 90% of coding tasks. Upgrade to Opus when first attempt failed, task spans 5+ files, architectural decisions, or security-critical code.

---

## PARALLELIZATION

When forking conversations in a multi-Claude terminal setup, make sure the scope is well-defined for the actions in the fork and the original conversation. Aim for minimal overlap when it comes to code changes.

**My Preferred Pattern:**

Main chat for code changes, forks for questions about the codebase and its current state, or research on external services.

**Git Worktrees for Parallel Instances:**

```bash
# Create worktrees for parallel work
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b
git worktree add ../project-refactor refactor-branch

# Each worktree gets its own Claude instance
cd ../project-feature-a && claude
```

---

## GROUNDWORK

**The Two-Instance Kickoff Pattern:**

For my own workflow management, I like to start an empty repo with 2 open Claude instances.

**Instance 1: Scaffolding Agent**
- Lays down the scaffold and groundwork
- Creates project structure
- Sets up configs (CLAUDE.md, rules, agents)

**Instance 2: Deep Research Agent**
- Connects to all your services, web search
- Creates the detailed PRD
- Creates architecture mermaid diagrams

---

## Best Practices for Agents & Sub-Agents

**The Sub-Agent Context Problem:**

Sub-agents exist to save context by returning summaries instead of dumping everything. But the orchestrator has semantic context the sub-agent lacks. The sub-agent only knows the literal query, not the PURPOSE behind the request.

**Iterative Retrieval Pattern:**

1. Orchestrator evaluates every sub-agent return
2. Ask follow-up questions before accepting it
3. Sub-agent goes back to source, gets answers, returns
4. Loop until sufficient (max 3 cycles)

**Orchestrator with Sequential Phases:**

```markdown
Phase 1: RESEARCH (use Explore agent) → research-summary.md
Phase 2: PLAN (use planner agent) → plan.md
Phase 3: IMPLEMENT (use tdd-guide agent) → code changes
Phase 4: REVIEW (use code-reviewer agent) → review-comments.md
Phase 5: VERIFY (use build-error-resolver if needed) → done or loop back
```

---

## Milestone

25,000+ GitHub stars in under a week!

---

## Resources

**Agent Orchestration:**
- claude-flow — Community-built enterprise orchestration platform with 54+ specialized agents

**Official:**
- Anthropic Academy: anthropic.skilljar.com

---

*Everything covered in both guides is available on GitHub at [everything-claude-code](https://github.com/affaan-m/everything-claude-code)*
