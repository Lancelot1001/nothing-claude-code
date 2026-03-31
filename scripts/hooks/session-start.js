'use strict';

/**
 * SessionStart hook: record session startup metadata.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSION_DATA_DIR = path.join(os.homedir(), '.claude/session-data');

function handle({ session_id, model, project_name }) {
  if (!session_id) return;

  const meta = {
    sessionId: session_id,
    startedAt: new Date().toISOString(),
    hostname: os.hostname(),
    model: model || null,
    projectName: project_name || null,
    platform: os.platform(),
    eccVersion: process.env['ECC_VERSION'] || null,
  };

  const metaPath = path.join(SESSION_DATA_DIR, `${session_id}.meta.json`);
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

module.exports = { handle };
