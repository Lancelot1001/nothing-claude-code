'use strict';

/**
 * Record skill execution outcomes to JSONL.
 *
 * Each skill run is appended to `{skillDir}/.evolution/run-records.jsonl`.
 * Records are never removed — they form the basis for health trending.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Record
// ---------------------------------------------------------------------------

/**
 * Append a skill execution record.
 *
 * @param {object} params
 * @param {string} params.skillId
 * @param {string} params.skillDir
 * @param {string} params.outcome - "success" | "failure" | "partial"
 * @param {number} [params.durationMs]
 * @param {string} [params.errorClass]
 * @param {string} [params.errorMessage]
 * @param {string} [params.runId]
 */
function recordSkillExecution({
  skillId,
  skillDir,
  outcome,
  durationMs,
  errorClass,
  errorMessage,
  runId,
}) {
  const evolutionDir = path.join(skillDir, '.evolution');
  fs.mkdirSync(evolutionDir, { recursive: true });

  const record = {
    runId: runId || _generateRunId(),
    skillId,
    outcome,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: durationMs || 0,
    errorClass: errorClass || null,
    errorMessage: errorMessage || null,
    hostname: os.hostname(),
    platform: os.platform(),
  };

  const recordFile = path.join(evolutionDir, 'run-records.jsonl');
  fs.appendFileSync(recordFile, JSON.stringify(record) + '\n', 'utf8');
}

/**
 * Read all execution records for a skill.
 *
 * @param {string} skillDir
 * @returns {Array<object>}
 */
function readSkillExecutionRecords(skillDir) {
  const recordFile = path.join(skillDir, '.evolution', 'run-records.jsonl');
  if (!fs.existsSync(recordFile)) return [];

  const records = [];
  for (const line of fs.readFileSync(recordFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch { /* ignore */ }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _generateRunId() {
  const { randomUUID } = require('crypto');
  return `run-${randomUUID()}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  recordSkillExecution,
  readSkillExecutionRecords,
};
