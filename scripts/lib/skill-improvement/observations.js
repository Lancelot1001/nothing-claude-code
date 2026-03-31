'use strict';

/**
 * Create and append skill observation records.
 *
 * Observations are appended to `{skillDir}/.evolution/observations.jsonl`.
 * They are never removed — they form the basis for skill health reports.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Create / Append
// ---------------------------------------------------------------------------

/**
 * @param {string} skillDir
 * @param {object} observation
 * @param {string} observation.type - e.g. "amendment-proposed", "health-check"
 */
function createSkillObservation(skillDir, observation) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    skillDir: path.basename(skillDir),
    observedAt: new Date().toISOString(),
    ...observation,
  };
}

/**
 * @param {string} skillDir
 * @param {object} observation
 */
function appendSkillObservation(skillDir, observation) {
  const obs = createSkillObservation(skillDir, observation);
  const line = JSON.stringify(obs) + '\n';

  const evolutionDir = path.join(skillDir, '.evolution');
  fs.mkdirSync(evolutionDir, { recursive: true });

  const obsFile = path.join(evolutionDir, 'observations.jsonl');
  fs.appendFileSync(obsFile, line, 'utf8');

  return obs;
}

/**
 * @param {string} skillDir
 * @returns {Array<object>}
 */
function readSkillObservations(skillDir) {
  const obsFile = path.join(skillDir, '.evolution', 'observations.jsonl');
  if (!fs.existsSync(obsFile)) return [];

  const observations = [];
  for (const line of fs.readFileSync(obsFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      observations.push(JSON.parse(line));
    } catch { /* ignore */ }
  }

  return observations;
}

module.exports = {
  createSkillObservation,
  appendSkillObservation,
  readSkillObservations,
};
