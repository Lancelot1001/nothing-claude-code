'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '../..');

// ---------------------------------------------------------------------------
// Snapshot collection
// ---------------------------------------------------------------------------

/**
 * Collect a point-in-time snapshot of every active tmux session that looks
 * like an ECC worktree orchestration worker.
 *
 * A session is considered an ECC worker if:
 * - it starts with `ecc-`
 * - it has a running Claude Code process
 *
 * @returns {Promise<Array<object>>}
 */
async function collectSessionSnapshot() {
  const { listTmuxPanes } = await import('./tmux-worktree-orchestrator.js').catch(() => {
    // Try CommonJS fallback
    try {
      const m = require('./tmux-worktree-orchestrator.js');
      return { listTmuxPanes: m.listTmuxPanes };
    } catch {
      return { listTmuxPanes: () => [] };
    }
  });

  const panes = await listTmuxPanes();

  const workers = [];
  for (const pane of panes) {
    if (!pane.sessionName || !pane.sessionName.startsWith('ecc-')) continue;

    workers.push({
      sessionName: pane.sessionName,
      windowName: pane.windowName || 'main',
      pid: pane.pid,
      startedAt: pane.startedAt || null,
      workingDirectory: pane.workingDirectory || null,
      status: pane.status || 'unknown',
    });
  }

  return workers;
}

/**
 * Build a human-readable session summary from raw tmux data.
 *
 * @param {Array<object>} workers
 * @returns {object}
 */
function buildSessionSnapshot(workers) {
  const bySession = new Map();

  for (const w of workers) {
    if (!bySession.has(w.sessionName)) {
      bySession.set(w.sessionName, []);
    }
    bySession.get(w.sessionName).push(w);
  }

  return {
    capturedAt: new Date().toISOString(),
    sessionCount: bySession.size,
    sessions: Array.from(bySession.entries()).map(([name, panes]) => ({
      name,
      paneCount: panes.length,
      panes,
    })),
  };
}

/**
 * List all tmux panes (thin wrapper so the caller doesn't need to know
 * the module structure).
 *
 * @returns {Promise<Array<object>>}
 */
async function listTmuxPanes() {
  const mod = await import('./tmux-worktree-orchestrator.js').catch(() => {
    try {
      return require('./tmux-worktree-orchestrator.js');
    } catch {
      return { listTmuxPanes: () => [] };
    }
  });
  return mod.listTmuxPanes ? mod.listTmuxPanes() : [];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  collectSessionSnapshot,
  buildSessionSnapshot,
  listTmuxPanes,
};
