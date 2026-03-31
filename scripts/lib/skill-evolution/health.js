'use strict';

/**
 * Collect and report skill health (success rates, trends, pending amendments).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SKILLS_BASE = path.join(os.homedir(), '.claude/skills');

// ---------------------------------------------------------------------------
// Collect
// ---------------------------------------------------------------------------

/**
 * @returns {Array<object>}
 */
function collectSkillHealth() {
  if (!fs.existsSync(SKILLS_BASE)) {
    return { skills: [], collectedAt: new Date().toISOString() };
  }

  const skillEntries = fs.readdirSync(SKILLS_BASE, { withFileTypes: true })
    .filter(e => e.isDirectory());

  /** @type {Array<object>} */
  const skills = [];

  for (const entry of skillEntries) {
    const skillId = entry.name;

    // Skip non-curated roots
    if (skillId === 'learned' || skillId === 'imported') continue;

    const evolutionDir = path.join(SKILLS_BASE, skillId, '.evolution');
    const skillHealth = _loadSkillHealth(skillId, evolutionDir);

    skills.push(skillHealth);
  }

  return {
    skills,
    collectedAt: new Date().toISOString(),
  };
}

function _loadSkillHealth(skillId, evolutionDir) {
  const runRecords = [];
  const amendmentFile = path.join(evolutionDir, 'amendments.pending.jsonl');

  let pendingAmendments = 0;
  if (fs.existsSync(amendmentFile)) {
    pendingAmendments = fs.readFileSync(amendmentFile, 'utf8')
      .split('\n')
      .filter(l => l.trim()).length;
  }

  // Load run records
  const recordsFile = path.join(evolutionDir, 'run-records.jsonl');
  if (fs.existsSync(recordsFile)) {
    for (const line of fs.readFileSync(recordsFile, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        runRecords.push(JSON.parse(line));
      } catch { /* ignore */ }
    }
  }

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRecords = runRecords.filter(r => new Date(r.endedAt).getTime() >= cutoff);
  const successCount = recentRecords.filter(r => r.outcome === 'success').length;
  const successRate = recentRecords.length > 0
    ? Math.round((successCount / recentRecords.length) * 100)
    : 100;

  let status = 'healthy';
  if (successRate < 50) status = 'dead';
  else if (successRate < 80) status = 'degraded';

  const lastRun = runRecords.length > 0
    ? runRecords[runRecords.length - 1]
    : null;

  return {
    skillId,
    status,
    successRate,
    totalRuns: runRecords.length,
    recentRuns: recentRecords.length,
    pendingAmendments,
    lastRunAt: lastRun ? lastRun.endedAt : null,
  };
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

/**
 * Format a health report as a human-readable string.
 *
 * @param {Array<object>} health
 * @returns {string}
 */
function formatHealthReport(health) {
  const lines = [];
  lines.push(`Skill Health Report — ${new Date().toISOString()}`);
  lines.push('');

  for (const skill of health.skills) {
    const icon = skill.status === 'healthy' ? '✓' : skill.status === 'degraded' ? '⚠' : '✗';
    lines.push(`${icon} ${skill.skillId}: ${skill.successRate}% success rate (${skill.recentRuns} recent runs)`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  collectSkillHealth,
  formatHealthReport,
};
