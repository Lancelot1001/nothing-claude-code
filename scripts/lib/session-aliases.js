'use strict';

/**
 * Manage named aliases for session files in `~/.claude/session-aliases.json`.
 *
 * ## Alias file format
 *
 * ```json
 * {
 *   "aliases": {
 *     "my-session": "2025-04-01T12-00-00-abc123.md"
 *   }
 * }
 * ```
 *
 * ## Usage
 *
 * ```js
 * const { setAlias, deleteAlias, listAliases, renameAlias } = require('./session-aliases');
 *
 * setAlias('my-session', '2025-04-01T12-00-00-abc123.md');
 * const all = listAliases();
 * deleteAlias('my-session');
 * renameAlias('old-name', 'new-name');
 * ```
 */

const fs = require('fs');
const path = require('path');

const ALIAS_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.claude/session-aliases.json'
);

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function _load() {
  if (!fs.existsSync(ALIAS_FILE)) {
    return { version: 1, aliases: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf8'));
  } catch {
    return { version: 1, aliases: {} };
  }
}

function _save(data) {
  fs.mkdirSync(path.dirname(ALIAS_FILE), { recursive: true });
  fs.writeFileSync(ALIAS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Set a named alias for a session file.
 *
 * @param {string} alias
 * @param {string} sessionFile - the session filename (not full path)
 */
function setAlias(alias, sessionFile) {
  const data = _load();
  data.aliases[alias] = sessionFile;
  _save(data);
}

/**
 * Delete a named alias.
 *
 * @param {string} alias
 * @returns {boolean} — true if the alias existed
 */
function deleteAlias(alias) {
  const data = _load();
  if (alias in data.aliases) {
    delete data.aliases[alias];
    _save(data);
    return true;
  }
  return false;
}

/**
 * List all aliases.
 *
 * @returns {Record<string, string>}
 */
function listAliases() {
  const data = _load();
  return { ...data.aliases };
}

/**
 * Rename an existing alias (delete + set).
 *
 * @param {string} oldAlias
 * @param {string} newAlias
 * @returns {boolean} — true if the old alias existed
 */
function renameAlias(oldAlias, newAlias) {
  const data = _load();
  if (!(oldAlias in data.aliases)) return false;
  const sessionFile = data.aliases[oldAlias];
  delete data.aliases[oldAlias];
  data.aliases[newAlias] = sessionFile;
  _save(data);
  return true;
}

module.exports = {
  setAlias,
  deleteAlias,
  listAliases,
  renameAlias,
};
