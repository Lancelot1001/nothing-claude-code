'use strict';

/**
 * Registry for all install target adapters.
 */

const path = require('path');

let _adapters = null;

function _loadAdapters() {
  if (_adapters) return _adapters;

  _adapters = [
    // Project-local targets
    require('./antigravity-project'),
    require('./cursor-project'),

    // Home-directory targets
    require('./claude-home'),
    require('./codex-home'),
    require('./opencode-home'),
  ];

  return _adapters;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the adapter for `targetName`, or null if not found.
 *
 * @param {string} targetName
 * @returns {object | null}
 */
function getInstallTargetAdapter(targetName) {
  const adapters = _loadAdapters();
  return adapters.find(a => a.targetName === targetName) || null;
}

/**
 * Return all registered install target adapters.
 *
 * @returns {Array<object>}
 */
function listInstallTargetAdapters() {
  return _loadAdapters();
}

/**
 * Return the set of targets that are already installed (have a valid state file).
 *
 * @returns {Array<string>}
 */
function listInstalledTargets() {
  const { readInstallState } = require('../install-state');
  return _loadAdapters()
    .filter(a => {
      const sp = a.getStatePath ? a.getStatePath() : null;
      if (!sp) return false;
      try {
        readInstallState(sp);
        return true;
      } catch {
        return false;
      }
    })
    .map(a => a.targetName);
}

/**
 * Plan the scaffold (directory structure) for a target.
 *
 * @param {string} targetName
 * @returns {Array<string>} — list of directories to create
 */
function planInstallTargetScaffold(targetName) {
  const adapter = getInstallTargetAdapter(targetName);
  if (!adapter) return [];

  const dirs = new Set();
  for (const rule of adapter.getCopyRules()) {
    if (rule.type === 'directory') {
      dirs.add(rule.dest);
    }
    dirs.add(path.dirname(rule.dest));
  }

  return [...dirs];
}

module.exports = {
  getInstallTargetAdapter,
  listInstallTargetAdapters,
  listInstalledTargets,
  planInstallTargetScaffold,
};
