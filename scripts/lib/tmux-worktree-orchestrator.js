'use strict';

/**
 * Manage tmux worktree sessions for parallel agent tasks.
 *
 * ## Core concepts
 *
 * - A **worktree** is a git worktree attached to a feature branch
 * - A **plan** describes the desired set of worktrees and sessions
 * - The **orchestrator** reconciles the plan against reality and executes it
 *
 * ## Public API
 *
 * | Function          | What it does                                           |
 * |-------------------|-------------------------------------------------------|
 * | `buildOrchestrationPlan` | Analyse repo state and produce a desired plan |
 * | `executePlan`     | Create / destroy tmux sessions per plan                |
 * | `materializePlan` | Full pipeline: build then execute                      |
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Git worktree helpers
// ---------------------------------------------------------------------------

function listWorktrees(cwd) {
  try {
    const out = execSync('git worktree list --porcelain', { cwd, encoding: 'utf8' });
    return _parseWorktreeList(out);
  } catch {
    return [];
  }
}

function _parseWorktreeList(raw) {
  const worktrees = [];
  const entries = raw.split('\n\n').filter(Boolean);

  for (const entry of entries) {
    const lines = entry.split('\n');
    const attrs = {};
    for (const line of lines) {
      const idx = line.indexOf(' ');
      if (idx < 0) continue;
      const key = line.slice(0, idx);
      const value = line.slice(idx + 1);
      attrs[key] = value;
    }
    if (attrs.worktree) {
      worktrees.push({
        path: attrs.worktree,
        branch: attrs.branch || '(detached)',
        isCurrent: !!attrs.current,
      });
    }
  }

  return worktrees;
}

// ---------------------------------------------------------------------------
// Tmux helpers
// ---------------------------------------------------------------------------

function listTmuxPanes() {
  try {
    const out = execSync('tmux list-panes -a -F "#{session_name}|#{window_name}|#{pane_pid}|#{session_start_time}|#{pane_current_path}"', {
      encoding: 'utf8',
      timeout: 5000,
    });
    return out.trim().split('\n').map(line => {
      const [sessionName, windowName, pid, startedAt, cwd] = line.split('|');
      return { sessionName, windowName, pid: Number(pid), startedAt: Number(startedAt), workingDirectory: cwd };
    }).filter(p => p.sessionName);
  } catch {
    return [];
  }
}

function paneHasClaude(pane) {
  try {
    const out = execFileSync('ps', ['-p', String(pane.pid), '-o', 'comm='], { encoding: 'utf8', timeout: 3000 });
    return /claude|node|python/i.test(out);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Plan building
// ---------------------------------------------------------------------------

/**
 * Analyse the repo and produce an orchestration plan.
 *
 * @param {string} repoRoot
 * @returns {object}
 */
function buildOrchestrationPlan(repoRoot) {
  const worktrees = listWorktrees(repoRoot);

  // Find branches that already have worktrees
  const worktreeMap = new Map();
  for (const wt of worktrees) {
    worktreeMap.set(wt.branch, wt);
  }

  return {
    repoRoot,
    worktrees: worktreeMap,
    activeTmuxPanes: listTmuxPanes().filter(p => p.sessionName.startsWith('ecc-')),
  };
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

/**
 * Create a new tmux session for a worktree.
 *
 * @param {object} params
 * @param {string} params.sessionName
 * @param {string} params.worktreePath
 * @param {string} [params.windowName]
 */
function _createSession({ sessionName, worktreePath, windowName = 'main' }) {
  const paneCommands = [
    'tmux new-session -d -s', sessionName,
    '-c', worktreePath,
    '-n', windowName,
  ].join(' ');

  execSync(paneCommands, { encoding: 'utf8', stdio: 'pipe' });
}

/**
 * Execute a plan: create / destroy sessions to match the plan.
 *
 * @param {object} plan
 * @param {boolean} [dryRun]
 * @returns {{ created: string[], destroyed: string[] }}
 */
function executePlan(plan, dryRun = false) {
  const created = [];
  const destroyed = [];

  // Destroy stale ecc- sessions whose worktrees no longer exist
  for (const pane of plan.activeTmuxPanes) {
    const stillExists = plan.worktrees.has(pane.sessionName.replace(/^ecc-/, ''));
    if (!stillExists) {
      if (!dryRun) {
        try {
          execSync(`tmux kill-session -t ${pane.sessionName}`, { stdio: 'pipe' });
        } catch { /* ignore */ }
      }
      destroyed.push(pane.sessionName);
    }
  }

  // Create missing sessions for worktrees
  for (const [branch, wt] of plan.worktrees.entries()) {
    const sessionName = `ecc-${branch}`;
    const alreadyRunning = plan.activeTmuxPanes.some(p => p.sessionName === sessionName);
    if (!alreadyRunning) {
      if (!dryRun) {
        _createSession({ sessionName, worktreePath: wt.path });
      }
      created.push(sessionName);
    }
  }

  return { created, destroyed };
}

// ---------------------------------------------------------------------------
// Materialize
// ---------------------------------------------------------------------------

/**
 * Full pipeline: build plan and execute it.
 *
 * @param {string} repoRoot
 * @param {boolean} [dryRun]
 * @returns {{ plan: object, result: { created: string[], destroyed: string[] } }}
 */
function materializePlan(repoRoot, dryRun = false) {
  const plan = buildOrchestrationPlan(repoRoot);
  const result = executePlan(plan, dryRun);
  return { plan, result };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  buildOrchestrationPlan,
  executePlan,
  materializePlan,
  listTmuxPanes,
};
