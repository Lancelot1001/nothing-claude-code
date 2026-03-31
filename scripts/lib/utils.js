'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

const REPO_ROOT = path.join(__dirname, '../..');

// ---------------------------------------------------------------------------
// File ops
// ---------------------------------------------------------------------------

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch { /* ignore */ }
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function readUtf8BomSafe(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function gitRoot(cwd) {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf8' }).trim();
  } catch {
    return cwd;
  }
}

function gitDiff(cwd, file) {
  try {
    return execSync('git diff --no-color', { cwd, encoding: 'utf8' });
  } catch {
    return '';
  }
}

function gitStatus(cwd) {
  try {
    return execSync('git status --porcelain', { cwd, encoding: 'utf8' });
  } catch {
    return '';
  }
}

function gitStagedFiles(cwd) {
  try {
    const out = execSync('git diff --cached --name-only', { cwd, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function isGitRepo(cwd) {
  try {
    execSync('git rev-parse --git-dir', { cwd, encoding: 'utf8', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session ID helpers
// ---------------------------------------------------------------------------

function sanitizeSessionId(id) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function generateSessionId() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

function ansiWidth(str) {
  return stripAnsi(str).length;
}

function truncateAnsi(str, maxWidth, suffix = '...') {
  const stripped = stripAnsi(str);
  if (stripped.length <= maxWidth) return str;
  const suffixWidth = ansiWidth(suffix);
  let currentWidth = 0;
  let result = '';
  let inEscape = false;
  let i = 0;
  while (i < str.length && currentWidth < maxWidth - suffixWidth) {
    const char = str[i];
    if (char === '\x1B') inEscape = true;
    if (!inEscape) currentWidth++;
    result += char;
    if (inEscape && char === 'm') inEscape = false;
    i++;
  }
  return result + suffix;
}

// ---------------------------------------------------------------------------
// Hook I/O helpers
// ---------------------------------------------------------------------------

/**
 * Read JSON from a hook fd 3 (used by Claude Code to pass structured data).
 * Falls back to reading from stdin if fd 3 is not available.
 *
 * @returns {object | null}
 */
function readHookInput() {
  try {
    // Try fd 3 first (Claude Code hook protocol)
    const fd = fs.openSync('/dev/stdin', 'rs');
    const stat = fs.fstatSync(fd);
    if (stat.isCharacterDevice() || stat.isFIFO()) {
      // fd is not seekable — read as buffer
      const buf = Buffer.alloc(64 * 1024);
      const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
      fs.closeSync(fd);
      if (bytes > 0) {
        return JSON.parse(buf.toString('utf8', 0, bytes));
      }
    }
    fs.closeSync(fd);
  } catch { /* ignore */ }

  // Fallback: parse from stdin
  try {
    return JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Write JSON to a hook response (write to fd 4 for Claude Code hook responses).
 *
 * @param {object} data
 */
function writeHookResponse(data) {
  const json = JSON.stringify(data);
  try {
    const fd = fs.openSync('/dev/stdout', 'rs+');
    fs.writeSync(fd, Buffer.from(json + '\n'), 0, json.length + 1);
    fs.closeSync(fd);
  } catch {
    process.stdout.write(json + '\n');
  }
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function normalizeSep(p) {
  return p.replace(/\\/g, '/');
}

function relativeTo(from, to) {
  return normalizeSep(path.relative(from, to));
}

function isDescendantOf(child, parent) {
  const rel = relativeTo(parent, child);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function log(...args) {
  process.stdout.write(args.join(' ') + '\n');
}

function error(...args) {
  process.stderr.write(args.join(' ') + '\n');
}

function debug(...args) {
  if (process.env['ECC_DEBUG']) {
    process.stderr.write('[DEBUG] ' + args.join(' ') + '\n');
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  copyFile,
  removeFile,
  mkdirp,
  fileExists,
  readJson,
  writeJson,
  readUtf8BomSafe,
  gitRoot,
  gitDiff,
  gitStatus,
  gitStagedFiles,
  isGitRepo,
  sanitizeSessionId,
  generateSessionId,
  stripAnsi,
  ansiWidth,
  truncateAnsi,
  readHookInput,
  writeHookResponse,
  normalizeSep,
  relativeTo,
  isDescendantOf,
  log,
  error,
  debug,
};
