'use strict';

/**
 * Analyse skill observation records for health status.
 */

const { readSkillObservations } = require('./observations');

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/**
 * @param {string} skillDir
 * @returns {object}
 */
function buildSkillHealthReport(skillDir) {
  const observations = readSkillObservations(skillDir);

  const amendmentProposed = observations.filter(o => o.type === 'amendment-proposed').length;
  const amendmentAccepted = observations.filter(o => o.type === 'amendment-accepted').length;
  const amendmentRejected = observations.filter(o => o.type === 'amendment-rejected').length;

  const recentObservations = observations.slice(-20);

  return {
    skillDir: path.basename(skillDir),
    amendmentProposed,
    amendmentAccepted,
    amendmentRejected,
    netAmendments: amendmentAccepted - amendmentRejected,
    recentObservations,
    generatedAt: new Date().toISOString(),
  };
}

const path = require('path');

module.exports = { buildSkillHealthReport };
