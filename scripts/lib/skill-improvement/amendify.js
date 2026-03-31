'use strict';

/**
 * Propose skill amendments from failure patterns.
 *
 * Given a set of failure `InspectionReport` entries from `inspection.js`,
 * generate concrete SKILL.md amendment suggestions.
 */

const path = require('path');

// ---------------------------------------------------------------------------
// Propose
// ---------------------------------------------------------------------------

/**
 * @param {object} inspectionEntry - from inspection.generateReport()
 * @param {string} skillDir
 * @returns {object} amendment proposal
 */
function proposeSkillAmendment(inspectionEntry, skillDir) {
  const { skill, errorClass, recentCount, indicators, recommendation } = inspectionEntry;

  const amendment = {
    skillId: skill,
    errorClass,
    triggeredBy: {
      recentFailures: recentCount,
      indicators,
    },
    recommendation,
    proposedAt: new Date().toISOString(),
    proposedFix: _generateFix(errorClass, skillDir),
  };

  // Write to pending amendments file
  const { appendSkillObservation } = require('./observations');
  appendSkillObservation(skillDir, {
    type: 'amendment-proposed',
    ...amendment,
  });

  return amendment;
}

// ---------------------------------------------------------------------------
// Fix generation (rule-based)
// ---------------------------------------------------------------------------

function _generateFix(errorClass, skillDir) {
  switch (errorClass) {
    case 'file-missing':
      return [
        '// FIX: Validate all file paths referenced by this skill before use.',
        '// Add a pre-execution check that asserts referenced paths exist.',
        '// Example: `if (!fs.existsSync(refPath)) throw new Error(\`Missing required file: ${refPath}\`)`',
      ].join('\n');

    case 'network':
      return [
        '// FIX: Add retry logic with exponential backoff for network requests.',
        '// Example: `await fetchWithRetry(url, { retries: 3, backoff: 500 })`',
        '// Consider adding a network-availability guard at the start of the skill.',
      ].join('\n');

    case 'syntax':
      return [
        '// FIX: Validate generated code syntax before returning.',
        '// Example: `new Function(code)` or `tsc --noEmit` for TypeScript',
        '// Alternatively, constrain the LLM prompt to known-good code patterns.',
      ].join('\n');

    case 'timeout':
      return [
        '// FIX: Add an explicit timeout to long-running operations.',
        '// Example: `await withTimeout(somePromise, 30000, \'Skill timed out\')`',
      ].join('\n');

    default:
      return [
        `// FIX: Address failure class "${errorClass}" — see skill evolution log for details.`,
        '// Review the skill implementation and add appropriate guards or error handling.',
      ].join('\n');
  }
}

module.exports = { proposeSkillAmendment };
