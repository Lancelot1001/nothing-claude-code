'use strict';

/**
 * Schema migrations for the ECC state store.
 *
 * Each migration is a SQL string that is executed in order.
 * Migrations are idempotent (CREATE TABLE IF NOT EXISTS etc.).
 */

const SCHEMA_VERSION = 1;

const MIGRATIONS = [
  // Sessions table
  `CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    session_id  TEXT UNIQUE NOT NULL,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    hostname    TEXT,
    terminal    TEXT,
    outcome     TEXT,
    agent_id    TEXT,
    cwd         TEXT,
    command_count INTEGER DEFAULT 0,
    tool_count  INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL
  )`,

  // Skill runs table
  `CREATE TABLE IF NOT EXISTS skill_runs (
    id          TEXT PRIMARY KEY,
    skill_id    TEXT NOT NULL,
    skill_dir   TEXT NOT NULL,
    run_id      TEXT UNIQUE NOT NULL,
    outcome     TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    duration_ms INTEGER,
    error_class TEXT,
    error_msg   TEXT,
    hostname    TEXT,
    created_at  TEXT NOT NULL
  )`,

  // Skill versions table
  `CREATE TABLE IF NOT EXISTS skill_versions (
    id             TEXT PRIMARY KEY,
    skill_id       TEXT NOT NULL,
    skill_dir      TEXT NOT NULL,
    version_id     TEXT NOT NULL,
    label          TEXT,
    snapshot_path  TEXT,
    created_at     TEXT NOT NULL,
    created_by     TEXT,
    hostname       TEXT
  )`,

  // Decisions table
  `CREATE TABLE IF NOT EXISTS decisions (
    id          TEXT PRIMARY KEY,
    session_id  TEXT,
    skill_run_id TEXT,
    decision_at TEXT NOT NULL,
    prompt      TEXT,
    choice      TEXT,
    rationale   TEXT,
    created_at  TEXT NOT NULL
  )`,

  // Install state table
  `CREATE TABLE IF NOT EXISTS install_state (
    id              TEXT PRIMARY KEY,
    target          TEXT NOT NULL,
    mode            TEXT NOT NULL,
    installed_at    TEXT NOT NULL,
    state_path      TEXT,
    tracked_count   INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL
  )`,

  // Governance events table
  `CREATE TABLE IF NOT EXISTS governance_events (
    id              TEXT PRIMARY KEY,
    session_id      TEXT,
    event_at        TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    severity        TEXT,
    description     TEXT,
    actor           TEXT,
    target          TEXT,
    decision_id     TEXT,
    metadata_json   TEXT,
    created_at      TEXT NOT NULL
  )`,

  // Schema version tracking
  `CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`,
];

// ---------------------------------------------------------------------------
// Run migrations
// ---------------------------------------------------------------------------

/**
 * @param {object} db - sql.js database handle
 */
function runMigrations(db) {
  // Create schema_version table first if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  // Get current version
  const result = db.exec('SELECT MAX(version) as v FROM schema_version');
  const currentVersion = (result.length > 0 && result[0].values[0][0]) ? Number(result[0].values[0][0]) : 0;

  // Apply pending migrations
  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    db.run(MIGRATIONS[i]);
    db.run('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)', [i + 1, new Date().toISOString()]);
  }
}

module.exports = {
  runMigrations,
  SCHEMA_VERSION,
};
