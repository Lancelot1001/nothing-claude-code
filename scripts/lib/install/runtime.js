'use strict';

/**
 * Create install plans from normalised requests.
 */

const {
  createLegacyInstallPlan,
  createManifestInstallPlan,
  createLegacyCompatInstallPlan,
} = require('../install-executor');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @param {object} request - from normalizeInstallRequest
 * @param {string} repoRoot
 * @returns {object} InstallPlan
 */
function createInstallPlanFromRequest(request, repoRoot) {
  if (request.mode === 'manifest') {
    return createManifestInstallPlan(request.profile, repoRoot);
  }

  if (request.mode === 'legacy') {
    return createLegacyInstallPlan(request.target, repoRoot);
  }

  if (request.mode === 'legacy-compat') {
    return createLegacyCompatInstallPlan(request.target, repoRoot);
  }

  throw new Error(`Unknown install mode: "${request.mode}"`);
}

module.exports = {
  createInstallPlanFromRequest,
};
