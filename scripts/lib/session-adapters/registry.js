'use strict';

/**
 * Adapter registry / selector.
 */

const { createClaudeHistoryAdapter } = require('./claude-history');
const { createDmuxTmuxAdapter } = require('./dmux-tmux');

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _adapters = [
  createClaudeHistoryAdapter(),
  createDmuxTmuxAdapter(),
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function createAdapterRegistry() {
  return {
    adapters: _adapters,
    get(name) {
      return _adapters.find(a => a.name === name) || null;
    },
    listAll() {
      return [..._adapters];
    },
  };
}

/**
 * Given a session target path, inspect and return the most appropriate adapter.
 *
 * @param {string} sessionTarget - e.g. a file path or directory
 * @returns {object | null}
 */
function inspectSessionTarget(sessionTarget) {
  if (!sessionTarget) return null;

  for (const adapter of _adapters) {
    if (sessionTarget.startsWith(adapter.sessionDir || adapter.snapshotDir || '')) {
      return adapter;
    }
  }

  // Fall back: try each adapter's list method
  for (const adapter of _adapters) {
    const sessions = adapter.listSessions ? adapter.listSessions() : [];
    if (sessions.some(s => s === sessionTarget)) {
      return adapter;
    }
  }

  return null;
}

module.exports = {
  createAdapterRegistry,
  inspectSessionTarget,
};
