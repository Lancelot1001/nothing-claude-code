'use strict';

/**
 * Adapter for tmux/worktree orchestration snapshots.
 *
 * Reads session data produced by the tmux-worktree-orchestrator and
 * exposes it via the canonical session adapter interface.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DMUX_SNAPSHOT_DIR = path.join(os.homedir(), '.dmux', 'snapshots');

function createDmuxTmuxAdapter() {
  return {
    name: 'dmux-tmux',
    snapshotDir: DMUX_SNAPSHOT_DIR,

    listSnapshots() {
      if (!fs.existsSync(DMUX_SNAPSHOT_DIR)) return [];
      return fs.readdirSync(DMUX_SNAPSHOT_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(DMUX_SNAPSHOT_DIR, f));
    },

    readSnapshot(filePath) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        return null;
      }
    },
  };
}

module.exports = { createDmuxTmuxAdapter };
