'use strict';

/**
 * Evaluate skill amendment effectiveness.
 *
 * Tracks before/after health metrics when an amendment is applied to a skill
 * and reports whether the amendment improved, degraded, or left unchanged
 * the skill's success rate.
 */

const { collectSkillHealth } = require('../skill-evolution/health');
const { readSkillExecutionRecords } = require('../skill-evolution/tracker');

// ---------------------------------------------------------------------------
// Evaluate
// ---------------------------------------------------------------------------

/**
 * @param {object} params
 * @param {string} params.skillDir
 * @param {string} params.amendmentId
 * @param {number} params.baselineSuccessRate
 * @param {number} [params.windowMs] - lookback window in ms (default 7 days)
 * @returns {object}
 */
function buildSkillEvaluationScaffold({
  skillDir,
  amendmentId,
  baselineSuccessRate,
  windowMs = 7 * 24 * 60 * 60 * 1000,
}) {
  const records = readSkillExecutionRecords(skillDir);

  const cutoff = Date.now() - windowMs;
  const recentRecords = records.filter(r => new Date(r.endedAt).getTime() >= cutoff);

  const successCount = recentRecords.filter(r => r.outcome === 'success').length;
  const totalCount = recentRecords.length;

  const currentSuccessRate = totalCount > 0
    ? Math.round((successCount / totalCount) * 100)
    : baselineSuccessRate;

  const delta = currentSuccessRate - baselineSuccessRate;

  let verdict = 'neutral';
  if (delta > 10) verdict = 'improved';
  else if (delta < -10) verdict = 'degraded';

  return {
    skillDir,
    amendmentId,
    baselineSuccessRate,
    currentSuccessRate,
    delta,
    verdict,
    sampleSize: totalCount,
    evaluatedAt: new Date().toISOString(),
  };
}

module.exports = { buildSkillEvaluationScaffold };
