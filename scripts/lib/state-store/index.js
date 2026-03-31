'use strict';

/**
 * SQLite state store factory using sql.js.
 *
 * Provides a persistent key-value + relational store for ECC session data,
 * skill runs, install state, and governance events.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Resolve path
// ---------------------------------------------------------------------------

/**
 * @param {string} [baseDir]
 * @returns {string}
 */
function resolveStateStorePath(baseDir) {
  const dir = baseDir || path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'ecc-state.db');
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Open (or create) a state store database.
 *
 * @param {string} [dbPath]
 * @returns {{ db: object, queryApi: object, close: Function }}
 */
function createStateStore(dbPath) {
  const SQL = require('sql.js');

  const resolvedPath = dbPath || resolveStateStorePath();

  let db;
  if (fs.existsSync(resolvedPath)) {
    const fileBuffer = fs.readFileSync(resolvedPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Run migrations
  const { runMigrations } = require('./migrations');
  runMigrations(db);

  // Load query API
  const { createQueryApi } = require('./queries');
  const queryApi = createQueryApi(db);

  return {
    db,
    queryApi,

    /**
     * Persist any pending changes and close the database handle.
     */
    close() {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(resolvedPath, buffer);
      db.close();
    },
  };
}

module.exports = {
  createStateStore,
  resolveStateStorePath,
};
