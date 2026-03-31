'use strict';

/**
 * Core session CRUD for markdown session files in `~/.claude/session-data/`.
 *
 * ## Session file naming
 *
 * Files are named `{date}T{time}-{sanitized_hostname}-{session_id}.md`
 * e.g. `2025-06-01T14-30-00-My-Macbook-pro-abc123.md`
 *
 * ## Session metadata
 *
 * Frontmatter fields:
 * - `sessionId` — unique ID (uuid v4 style)
 * - `startedAt` — ISO-8601 start time
 * - `endedAt`   — ISO-8601 end time (null if running)
 * - `hostname`  — machine hostname
 * - `terminal`  — terminal type (e.g. "tmux", "kitty", "unknown")
 * - `outcome`   — "success" | "error" | "interrupted" | null
 */

const fs = require('fs');
const path = require('path');

const SESSION_DATA_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.claude/session-data'
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sanitize a string for use in a session filename.
 * Replaces path separators and non-filename-safe chars with dashes.
 *
 * @param {string} str
 * @returns {string}
 */
function _sanitize(str) {
  return str.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, '-');
}

/**
 * Parse frontmatter from a session file.
 *
 * @param {string} filePath
 * @returns {{ frontmatter: object | null, content: string }}
 */
function parseSessionMetadata(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  // Strip BOM if present
  const text = raw.replace(/^\uFEFF/, '');

  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: null, content: text };

  /** @type {Record<string, string>} */
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    fm[key] = value;
  }

  const content = text.slice(match[0].length).trim();
  return { frontmatter: fm, content };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Return every session file sorted newest-first.
 *
 * @returns {Array<{path: string, stat: fs.Stats}>}
 */
function getAllSessions() {
  if (!fs.existsSync(SESSION_DATA_DIR)) return [];

  return fs.readdirSync(SESSION_DATA_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const p = path.join(SESSION_DATA_DIR, f);
      const stat = fs.statSync(p);
      return { path: p, stat };
    })
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
}

/**
 * Return a session by its `sessionId` frontmatter field.
 *
 * @param {string} sessionId
 * @returns {{ path: string, stat: fs.Stats, frontmatter: object | null, content: string } | null}
 */
function getSessionById(sessionId) {
  if (!SESSION_ID_RE.test(sessionId)) return null;

  const sessions = getAllSessions();
  for (const { path: p, stat } of sessions) {
    const { frontmatter } = parseSessionMetadata(p);
    if (frontmatter && frontmatter.sessionId === sessionId) {
      const { content } = parseSessionMetadata(p);
      return { path: p, stat, frontmatter, content };
    }
  }

  return null;
}

/**
 * Return aggregate statistics across all sessions.
 *
 * @returns {{ totalCount: number, totalSizeBytes: number, oldestStart: string | null, newestStart: string | null }}
 */
function getSessionStats() {
  const sessions = getAllSessions();

  if (sessions.length === 0) {
    return { totalCount: 0, totalSizeBytes: 0, oldestStart: null, newestStart: null };
  }

  let totalSizeBytes = 0;
  let oldestStart = null;
  let newestStart = null;

  for (const { path: p, stat } of sessions) {
    totalSizeBytes += stat.size;
    const { frontmatter } = parseSessionMetadata(p);
    if (frontmatter && frontmatter.startedAt) {
      if (!oldestStart || frontmatter.startedAt < oldestStart) oldestStart = frontmatter.startedAt;
      if (!newestStart || frontmatter.startedAt > newestStart) newestStart = frontmatter.startedAt;
    }
  }

  return {
    totalCount: sessions.length,
    totalSizeBytes,
    oldestStart,
    newestStart,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  getAllSessions,
  getSessionById,
  parseSessionMetadata,
  getSessionStats,
};
