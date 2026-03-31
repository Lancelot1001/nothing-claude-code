'use strict';

/**
 * Detect recurring failure patterns from skill runs.
 *
 * ## What it does
 *
 * - Reads all `skill-run-*.jsonl` files under `~/.claude/skills/`
 * - Filters for runs with `outcome: failure` or `outcome: partial`
 * - Detects co-occurrence patterns across runs (same skill + same error class)
 * - Emits ranked `InspectionReport` objects so the caller can decide what
 *   to fix first
 *
 * ## Output shape
 *
 * ```js
 * {
 *   skill,           // string
 *   errorClass,      // string  (deduced class, not raw message)
 *   recentCount,    // number  (last 30 days)
 *   oldestRecent,   // ISO date string
 *   totalCount,     // number  (all time)
 *   runIds,         // string[] (most recent 5)
 *   indicators,    // string[]
 *   recommendation, // string
 * }
 * ```
 *
 * ## Usage
 *
 * ```js
 * const { detectPatterns, generateReport, inspect } = require('./inspection');
 *
 * // Standalone report
 * const report = generateReport();
 * console.log(JSON.stringify(report, null, 2));
 *
 * // Programmatic use
 * const patterns = detectPatterns();
 * for (const p of patterns) {
 *   if (p.recentCount >= 3) console.warn(p);
 * }
 * ```
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SKILLS_BASE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude/skills');

// Files older than this (from mtime) are not considered "recent"
const RECENT_CUTOFF_DAYS = 30;

// Maximum run IDs to keep in a report entry
const MAX_RUN_IDS = 5;

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Map a raw error message to a short semantic class.
 *
 * Exposed for unit-testing; not part of the stable API.
 * @param {string} raw
 * @returns {string}
 */
function classifyError(raw) {
  if (!raw) return 'unknown';

  const msg = raw.toLowerCase();

  if (/enoent|not found|no such file|missing/i.test(msg)) return 'file-missing';
  if (/econnrefused|etimedout|network|socket/i.test(msg)) return 'network';
  if (/permission denied|eacces|access.*denied/i.test(msg)) return 'permission';
  if (/syntaxerror|parseerror|unexpected/i.test(msg)) return 'syntax';
  if (/timeout|timed?out/i.test(msg)) return 'timeout';
  if (/enoexec|format.*executable|not.*executable/i.test(msg)) return 'bad-executable';
  if (/empty|blank|undefined|null.*value/i.test(msg)) return 'empty-input';
  if (/already exists|duplicate|eexist/i.test(msg)) return 'already-exists';
  if (/invalid.*argument|expected.*got|type.*error|instanceof/i.test(msg)) return 'type-error';

  return 'misc';
}

// ---------------------------------------------------------------------------
// Run record ingestion
// ---------------------------------------------------------------------------

/**
 * Read all `skill-run-*.jsonl` files under `SKILLS_BASE`.
 *
 * Each line must be a JSON object with at least:
 * - `runId`  (string)
 * - `skill`  (string)
 * - `outcome` (string: `"success"` | `"failure"` | `"partial"`)
 * - `endedAt` (string: ISO-8601 date)
 *
 * Returns raw objects as-is (no schema validation here).
 *
 * @returns {Array<object>}
 */
function readSkillRunRecords() {
  const records = [];

  if (!fs.existsSync(SKILLS_BASE)) return records;

  const entries = fs.readdirSync(SKILLS_BASE, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(SKILLS_BASE, entry.name);

    let files;
    try {
      files = fs.readdirSync(skillDir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.startsWith('skill-run-') || !file.endsWith('.jsonl')) continue;
      const filePath = path.join(skillDir, file);

      let content;
      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }

      for (const line of content.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          records.push(JSON.parse(line));
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Pattern detection
// ---------------------------------------------------------------------------

/**
 * Detect recurring failure/partial patterns from ingested run records.
 *
 * @param {Array<object>} records - from `readSkillRunRecords()`
 * @returns {Array<object>}
 */
function detectPatterns(records) {
  const cutoffMs = Date.now() - RECENT_CUTOFF_DAYS * 24 * 60 * 60 * 1000;

  /** @type {Map<string, {recent: Array<object>, all: Array<object>}>} */
  const buckets = new Map();

  for (const rec of records) {
    if (rec.outcome !== 'failure' && rec.outcome !== 'partial') continue;

    const key = `${rec.skill}::${classifyError(rec.errorMessage)}`;
    if (!buckets.has(key)) {
      buckets.set(key, { recent: [], all: [] });
    }
    const bucket = buckets.get(key);
    bucket.all.push(rec);
    if (new Date(rec.endedAt).getTime() >= cutoffMs) {
      bucket.recent.push(rec);
    }
  }

  return Array.from(buckets.entries())
    .filter(([, bucket]) => bucket.recent.length >= 2)
    .map(([key, bucket]) => {
      const [skill, errorClass] = key.split('::');
      const sortedRecent = bucket.recent.sort(
        (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
      );
      return {
        skill,
        errorClass,
        recentCount: bucket.recent.length,
        oldestRecent: sortedRecent[sortedRecent.length - 1].endedAt,
        totalCount: bucket.all.length,
        runIds: sortedRecent.slice(0, MAX_RUN_IDS).map(r => r.runId),
      };
    })
    .sort((a, b) => b.recentCount - a.recentCount);
}

// ---------------------------------------------------------------------------
// Indicator extraction
// ---------------------------------------------------------------------------

/**
 * Enrich a pattern with actionable `indicators` and a `recommendation`.
 *
 * @param {object} pattern - from `detectPatterns()`
 * @returns {object} - pattern with added `indicators` and `recommendation`
 */
function _addRecommendations(pattern) {
  const { skill, errorClass, recentCount } = pattern;

  /** @type {string[]} */
  const indicators = [];

  if (errorClass === 'file-missing') {
    indicators.push('skill references a path that does not exist on disk');
    indicators.push('run the skill in a project that satisfies its file assumptions');
  }
  if (errorClass === 'network') {
    indicators.push('skill depends on a remote API or service that is unreachable');
    indicators.push('check VPN status, proxy settings, or firewall rules');
  }
  if (errorClass === 'permission') {
    indicators.push('skill attempts to write to a directory without write permission');
    indicators.push('run the parent Claude Code session with appropriate ACLs');
  }
  if (errorClass === 'syntax') {
    indicators.push('skill emits JavaScript/TypeScript that fails to parse');
    indicators.push('run `node --check` on the generated code before applying');
  }
  if (errorClass === 'timeout') {
    indicators.push('skill is slow to produce output or hangs during generation');
    indicators.push('consider increasing the `timeout` in the hook configuration');
  }
  if (errorClass === 'already-exists') {
    indicators.push('skill does idempotency checks incorrectly or not at all');
    indicators.push('add a pre-execution guard that detects the existing state');
  }
  if (errorClass === 'type-error') {
    indicators.push('skill generates code with wrong types for the target runtime');
    indicators.push('verify the skill template matches the project\'s language version');
  }

  // Catch-all
  if (indicators.length === 0) {
    indicators.push(`skill "${skill}" failed with class "${errorClass}" in ${recentCount} recent runs`);
  }

  const recommendation =
    recentCount >= 5
      ? `High frequency: fix or disable skill "${skill}" until the root cause is resolved`
      : `Monitor: ${skill} has ${recentCount} failures of class "${errorClass}" in the last ${RECENT_CUTOFF_DAYS} days`;

  return { ...pattern, indicators, recommendation };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a full inspection report.
 *
 * @returns {Array<object>}
 */
function generateReport() {
  const records = readSkillRunRecords();
  const patterns = detectPatterns(records);
  return patterns.map(_addRecommendations);
}

/**
 * Programmatic inspection entry point.
 *
 * Convenience wrapper that builds a report and then lets the caller filter
 * and act on it.
 *
 * @param {(p: object) => boolean} [filterFn] - optional predicate to select patterns
 * @returns {Array<object>} filtered patterns with indicators and recommendations
 */
function inspect(filterFn) {
  const report = generateReport();
  if (filterFn) {
    return report.filter(filterFn);
  }
  return report;
}

module.exports = {
  detectPatterns,
  generateReport,
  inspect,
  classifyError,
  readSkillRunRecords,
};
