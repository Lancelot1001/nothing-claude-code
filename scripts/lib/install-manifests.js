'use strict';

/**
 * Load and resolve install modules/profiles/components.
 *
 * ## Manifest files
 *
 * | File                                | What it defines                    |
 * |-------------------------------------|------------------------------------|
 * | `manifests/install-modules.json`   | Named modules with file-path lists |
 * | `manifests/install-profiles.json`  | Named profiles referencing modules |
 * | `manifests/install-components.json` | Feature-components referencing modules |
 *
 * ## Key functions
 *
 * - `resolveInstallPlan(profile)` — return the full module list + component IDs for a profile
 * - `loadInstallManifests()`      — load all three manifest files (validation happens elsewhere)
 * - `resolveLegacyCompatibilitySelection(copyRules)` — map a legacy target's file list to module IDs
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const { resolveEccRoot } = _require('./resolve-ecc-root');

function getManifestsRoot() {
  return path.join(resolveEccRoot(), 'manifests');
}

// ---------------------------------------------------------------------------
// Load helpers
// ---------------------------------------------------------------------------

/** @returns {{ modules: Array, version: string }} */
function _loadModules() {
  const p = path.join(getManifestsRoot(), 'install-modules.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** @returns {{ profiles: Record<string, {modules: string[], description: string}>, version: string }} */
function _loadProfiles() {
  const p = path.join(getManifestsRoot(), 'install-profiles.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** @returns {{ components: Array, version: string } | null} */
function _loadComponents() {
  const p = path.join(getManifestsRoot(), 'install-components.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

/**
 * Return the resolved install plan for `profileName`.
 *
 * @param {string} profileName - e.g. "core", "developer", "full"
 * @returns {{ modules: Array<object>, componentIds: Array<string> } | null}
 */
function resolveInstallPlan(profileName) {
  const profiles = _loadProfiles();
  const profile = profiles.profiles && profiles.profiles[profileName];

  if (!profile) {
    // Unknown profile
    return null;
  }

  const modulesData = _loadModules();
  const modulesById = new Map(modulesData.modules.map(m => [m.id, m]));

  /** @type {Array<object>} */
  const resolvedModules = [];

  for (const moduleId of profile.modules) {
    const mod = modulesById.get(moduleId);
    if (mod) resolvedModules.push(mod);
  }

  const componentsData = _loadComponents();
  const componentIds = componentsData
    ? componentsData.components
        .filter(c => profile.modules.includes(c.id))
        .map(c => c.id)
    : [];

  return { modules: resolvedModules, componentIds };
}

/**
 * Load all three manifest files.
 * Throws if any are missing or malformed.
 *
 * @returns {{ modules: object, profiles: object, components: object | null }}
 */
function loadInstallManifests() {
  return {
    modules: _loadModules(),
    profiles: _loadProfiles(),
    components: _loadComponents(),
  };
}

/**
 * Map a legacy target's `copyRules` (array of `{src, dest}`) to the set of
 * module IDs whose `paths` overlap with any of the copy-rule destinations.
 *
 * This lets a manifest-mode install cover the same files as a legacy target
 * without requiring the user to name a profile.
 *
 * @param {Array<{src: string, dest: string}>} copyRules
 * @returns {string[]} — module IDs
 */
function resolveLegacyCompatibilitySelection(copyRules) {
  const modulesData = _loadModules();
  const selected = new Set();

  for (const rule of copyRules) {
    const destNorm = rule.dest.replace(/\\/g, '/').replace(/\/$/, '');

    for (const mod of modulesData.modules) {
      for (const modPath of mod.paths) {
        const modNorm = modPath.replace(/\\/g, '/').replace(/\/$/, '');
        if (destNorm === modNorm || destNorm.startsWith(modNorm + '/')) {
          selected.add(mod.id);
        }
      }
    }
  }

  return [...selected];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _require(modulePath) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(modulePath);
}

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  resolveInstallPlan,
  loadInstallManifests,
  resolveLegacyCompatibilitySelection,
};
