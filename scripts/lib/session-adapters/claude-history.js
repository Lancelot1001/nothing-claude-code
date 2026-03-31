'use strict';

/**
 * Adapter for Claude local session history.
 *
 * Reads session data from the Claude local history directory and
 * exposes it via the canonical session adapter interface.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSION_HISTORY_DIR = path.join(os.homedir(), '.claude', 'session-history');

function createClaudeHistoryAdapter() {
  return {
    name: 'claude-history',
    sessionDir: SESSION_HISTORY_DIR,

    listSessions() {
      if (!fs.existsSync(SESSION_HISTORY_DIR)) return [];
      return fs.readdirSync(SESSION_HISTORY_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(SESSION_HISTORY_DIR, f));
    },

    readSession(filePath) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        return null;
      }
    },
  };
}

module.exports = { createClaudeHistoryAdapter };
