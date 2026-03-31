'use strict';

/**
 * Snapshot and version skill files.
 *
 * Before any skill is modified, a snapshot is stored in
 * `{skillDir}/.evolution/snapshots/` so changes can be audited and rolled back.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

/**
 * Create a named snapshot of a skill directory.
 *
 * @param {string} skillDir
 * @param {string} label - human-readable label (e.g. "before-refactor-tdd")
 * @returns {string} snapshotId
 */
function createVersion(skillDir, label) {
  const snapshotId = `${Date.now()}-${_sanitizeLabel(label)}`;
  const snapshotsDir = path.join(skillDir, '.evolution', 'snapshots', snapshotId);
  fs.mkdirSync(snapshotsDir, { recursive: true });

  const entries = fs.readdirSync(skillDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip hidden dirs like .evolution
    const src = path.join(skillDir, entry.name);
    const dest = path.join(snapshotsDir, entry.name);
    if (entry.isDirectory()) {
      _copyDirRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  // Write metadata
  fs.writeFileSync(
    path.join(snapshotsDir, '.snapshot-meta.json'),
    JSON.stringify({
      snapshotId,
      label,
      skillDir,
      createdAt: new Date().toISOString(),
      hostname: require('os').hostname(),
    }, null, 2),
    'utf8'
  );

  return snapshotId;
}

/**
 * Roll back a skill to a named snapshot.
 *
 * @param {string} skillDir
 * @param {string} snapshotId
 * @returns {{ rolledBack: boolean, error?: string }}
 */
function rollbackTo(skillDir, snapshotId) {
  const snapshotDir = path.join(skillDir, '.evolution', 'snapshots', snapshotId);

  if (!fs.existsSync(snapshotDir)) {
    return { rolledBack: false, error: `Snapshot not found: ${snapshotId}` };
  }

  // Backup current state first
  const backupId = createVersion(skillDir, 'pre-rollback-backup');

  // Copy snapshot files over current skill files
  const entries = fs.readdirSync(snapshotDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const src = path.join(snapshotDir, entry.name);
    const dest = path.join(skillDir, entry.name);

    if (entry.isDirectory()) {
      _copyDirRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  return { rolledBack: true, backupSnapshotId: backupId };
}

/**
 * Return the evolution log for a skill.
 *
 * @param {string} skillDir
 * @returns {Array<object>}
 */
function getEvolutionLog(skillDir) {
  const logFile = path.join(skillDir, '.evolution', 'evolution-log.jsonl');
  if (!fs.existsSync(logFile)) return [];

  const entries = [];
  for (const line of fs.readFileSync(logFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch { /* ignore */ }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _sanitizeLabel(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function _copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      _copyDirRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  createVersion,
  rollbackTo,
  getEvolutionLog,
};
