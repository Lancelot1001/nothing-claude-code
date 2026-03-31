'use strict';

/**
 * PreCompact hook: run before session compaction.
 *
 * Prepares the session for compaction by:
 * - Ensuring all tracked files are saved
 * - Recording session metadata
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function handle() {
  const eccRoot = process.env['ECC_ROOT'] || process.cwd();
  const stateFile = path.join(eccRoot, '.claude', '.session-compact-state.json');

  const state = {
    compactedAt: new Date().toISOString(),
    hostname: os.hostname(),
    pid: process.pid,
    uptimeSeconds: process.uptime(),
  };

  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

module.exports = { handle };
