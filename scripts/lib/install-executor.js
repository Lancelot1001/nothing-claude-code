'use strict';

/**
 * Creates install plans for legacy and manifest modes.
 *
 * ## Two install modes
 *
 * | Mode       | Input      | How it works                               |
 * |------------|------------|--------------------------------------------|
 * | legacy     | target arg | Flat file-copy list per target             |
 * | manifest   | profile arg| Named profiles that reference modules      |
 *
 * Both modes produce a normalised `InstallPlan` object consumed by `apply.js`.
 */

const path = require('path');

// ---------------------------------------------------------------------------
// Legacy install plan
// ---------------------------------------------------------------------------

/**
 * @param {string} target - e.g. "claude-home", "cursor-project"
 * @param {string} repoRoot
 * @returns {{ mode: "legacy", target: string, targetAdapter: object, copyRules: Array }}
 */
function createLegacyInstallPlan(target, repoRoot) {
  const { createInstallTargetAdapter } = _require('./install-targets/registry');

  const targetAdapter = createInstallTargetAdapter(target);
  if (!targetAdapter) {
    throw new Error(`Unknown install target: "${target}"`);
  }

  const copyRules = targetAdapter.getCopyRules();

  return {
    mode: 'legacy',
    target,
    targetAdapter,
    copyRules,
  };
}

// ---------------------------------------------------------------------------
// Manifest install plan
// ---------------------------------------------------------------------------

/**
 * @param {string} profile - e.g. "core", "developer", "full"
 * @param {string} repoRoot
 * @returns {{ mode: "manifest", profile: string, modules: Array, componentIds: Array }}
 */
function createManifestInstallPlan(profile, repoRoot) {
  const {
    resolveInstallPlan,
  } = _require('./install-manifests');

  const resolved = resolveInstallPlan(profile);
  if (!resolved) {
    throw new Error(`Unknown install profile: "${profile}"`);
  }

  return {
    mode: 'manifest',
    profile,
    modules: resolved.modules,
    componentIds: resolved.componentIds || [],
  };
}

// ---------------------------------------------------------------------------
// Legacy compat install plan
// ---------------------------------------------------------------------------

/**
 * Build a legacy-compat install plan that selects every module whose paths
 * overlap with the given legacy target's copy-rules.
 *
 * This lets a manifest-mode install cover the same files as a legacy target
 * without requiring the user to name a profile.
 *
 * @param {string} legacyTarget - e.g. "claude-home"
 * @param {string} repoRoot
 * @returns {{ mode: "legacy-compat", target: string, profile: string, modules: Array }}
 */
function createLegacyCompatInstallPlan(legacyTarget, repoRoot) {
  const { createInstallTargetAdapter } = _require('./install-targets/registry');
  const { resolveLegacyCompatibilitySelection } = _require('./install-manifests');

  const targetAdapter = createInstallTargetAdapter(legacyTarget);
  if (!targetAdapter) {
    throw new Error(`Unknown legacy target: "${legacyTarget}"`);
  }

  const copyRules = targetAdapter.getCopyRules();
  const moduleIds = resolveLegacyCompatibilitySelection(copyRules);

  return {
    mode: 'legacy-compat',
    target: legacyTarget,
    profile: 'legacy-compat',
    modules: moduleIds,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Require with cache so hot-repeated calls don't re-evaluate modules.
 * @param {string} modulePath
 */
function _require(modulePath) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(modulePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  createLegacyInstallPlan,
  createManifestInstallPlan,
  createLegacyCompatInstallPlan,
};
