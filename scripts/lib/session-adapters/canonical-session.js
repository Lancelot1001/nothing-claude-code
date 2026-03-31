'use strict';

/**
 * Canonical session schema normaliser.
 *
 * Sessions from different sources (Claude History, dmux-tmux) are normalised
 * into a canonical format that the rest of the system can consume uniformly.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

/**
 * Canonical session shape:
 * ```js
 * {
 *   sessionId: string,          // UUID
 *   startedAt: string,          // ISO-8601
 *   endedAt: string | null,     // ISO-8601
 *   hostname: string,
 *   terminal: string,           // "tmux" | "kitty" | "unknown"
 *   outcome: string | null,     // "success" | "error" | "interrupted"
 *   agentId: string | null,
 *   workingDirectory: string | null,
 *   commandCount: number,
 *   toolUseCount: number,
 *   source: string,             // "claude-history" | "dmux-tmux" | "canonical"
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Normalise Claude history
// ---------------------------------------------------------------------------

/**
 * @param {object} raw - from Claude local session history
 * @returns {object} canonical session
 */
function normalizeClaudeHistorySession(raw) {
  return {
    sessionId: raw.id || raw.sessionId || _uuid(),
    startedAt: raw.startedAt || raw.started_at || null,
    endedAt: raw.endedAt || raw.ended_at || null,
    hostname: raw.hostname || require('os').hostname(),
    terminal: _detectTerminal(raw),
    outcome: raw.outcome || null,
    agentId: null,
    workingDirectory: raw.workingDirectory || raw.cwd || null,
    commandCount: raw.commandCount || 0,
    toolUseCount: raw.toolUseCount || 0,
    source: 'claude-history',
  };
}

// ---------------------------------------------------------------------------
// Normalise dmux snapshot
// ---------------------------------------------------------------------------

/**
 * @param {object} raw - from dmux-tmux adapter
 * @returns {object} canonical session
 */
function normalizeDmuxSnapshot(raw) {
  return {
    sessionId: raw.sessionId || raw.id || _uuid(),
    startedAt: raw.startedAt || raw.started_at || null,
    endedAt: raw.endedAt || null,
    hostname: raw.hostname || require('os').hostname(),
    terminal: 'tmux',
    outcome: raw.outcome || null,
    agentId: raw.agentId || null,
    workingDirectory: raw.workingDirectory || raw.cwd || null,
    commandCount: raw.commandCount || 0,
    toolUseCount: raw.toolUseCount || 0,
    source: 'dmux-tmux',
  };
}

// ---------------------------------------------------------------------------
// Persist canonical snapshot
// ---------------------------------------------------------------------------

/**
 * Write a canonical session to the canonical store.
 *
 * @param {object} session
 * @param {string} storePath
 */
function persistCanonicalSnapshot(session, storePath) {
  const dir = path.dirname(storePath);
  fs.mkdirSync(dir, { recursive: true });

  const line = JSON.stringify(session) + '\n';
  fs.appendFileSync(storePath, line, 'utf8');
}

// ---------------------------------------------------------------------------
// Validate canonical snapshot
// ---------------------------------------------------------------------------

/**
 * @param {object} session
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCanonicalSnapshot(session) {
  const errors = [];

  if (!session.sessionId) errors.push('missing sessionId');
  if (!session.startedAt) errors.push('missing startedAt');
  if (!session.hostname) errors.push('missing hostname');
  if (!session.source) errors.push('missing source');
  if (session.terminal && !['tmux', 'kitty', 'unknown'].includes(session.terminal)) {
    errors.push(`invalid terminal: ${session.terminal}`);
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _detectTerminal(raw) {
  if (raw.terminal === 'tmux' || raw.tmux) return 'tmux';
  if (raw.terminal === 'kitty') return 'kitty';
  return 'unknown';
}

let _nodeCrypto;
try {
  _nodeCrypto = require('crypto');
} catch {
  _nodeCrypto = null;
}

function _uuid() {
  if (_nodeCrypto) {
    return _nodeCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  normalizeClaudeHistorySession,
  normalizeDmuxSnapshot,
  persistCanonicalSnapshot,
  validateCanonicalSnapshot,
};
