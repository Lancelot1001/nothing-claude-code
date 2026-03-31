'use strict';

/**
 * SessionEnd hook: write the session end marker to the archive.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ARCHIVE_DIR = path.join(os.homedir(), '.claude/session-archive');

function handle({ session_id, ended_at }) {
  if (!session_id) return;

  const markerFile = path.join(ARCHIVE_DIR, `${session_id}.end.json`);
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const marker = {
    sessionId: session_id,
    endedAt: ended_at || new Date().toISOString(),
    hostname: os.hostname(),
  };

  fs.writeFileSync(markerFile, JSON.stringify(marker, null, 2), 'utf8');
}

module.exports = { handle };
