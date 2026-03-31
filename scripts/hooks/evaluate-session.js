'use strict';

/**
 * Stop hook: extract patterns from a Claude Code session for continuous learning.
 *
 * Reads session input history from the hook payload and writes a session
 * summary to the long-term session archive for later analysis.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ARCHIVE_DIR = path.join(os.homedir(), '.claude/session-archive');

/**
 * @param {object} params
 * @param {string} [params.session_id]
 * @param {Array} [params.messages]
 * @param {object} [params.session_stats]
 */
function handle(params) {
  const archiveDir = ARCHIVE_DIR;
  fs.mkdirSync(archiveDir, { recursive: true });

  const sessionId = params.session_id || `anon-${Date.now()}`;
  const summary = {
    sessionId,
    archivedAt: new Date().toISOString(),
    hostname: os.hostname(),
    messageCount: params.messages ? params.messages.length : 0,
    stats: params.session_stats || {},
  };

  const summaryPath = path.join(archiveDir, `${sessionId}.summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
}

module.exports = { handle };
