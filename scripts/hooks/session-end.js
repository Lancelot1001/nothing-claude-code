'use strict';

/**
 * SessionEnd hook: perform end-of-session bookkeeping.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSION_DATA_DIR = path.join(os.homedir(), '.claude/session-data');

function handle({ session_id, messages, outcome }) {
  if (!session_id) return;

  const summary = {
    sessionId: session_id,
    endedAt: new Date().toISOString(),
    hostname: os.hostname(),
    messageCount: Array.isArray(messages) ? messages.length : 0,
    outcome: outcome || null,
  };

  const summaryPath = path.join(SESSION_DATA_DIR, `${session_id}.summary.json`);
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
}

module.exports = { handle };
