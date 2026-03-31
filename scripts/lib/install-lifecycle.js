'use strict';

/**
 * Full install lifecycle.
 *
 * Exposes:
 * - `buildDoctorReport()`  — audit installed files vs. expected state
 * - `repairInstalledStates()` — fix drift in already-installed targets
 * - `uninstallInstalledStates()` — remove installed files
 * - `discoverInstalledStates()` — find which targets are installed and where
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Doctor report
// ---------------------------------------------------------------------------

/**
 * Audit every registered install target and report discrepancies.
 *
 * @param {string} repoRoot
 * @returns {Array<object>} — array of `DoctorIssue` objects
 */
function buildDoctorReport(repoRoot) {
  const { listInstallTargetAdapters } = _require('./install-targets/registry');
  const { readInstallState } = _require('./install-state');

  /** @type {Array<object>} */
  const issues = [];

  for (const adapter of listInstallTargetAdapters()) {
    const targetName = adapter.targetName;
    const statePath = adapter.getStatePath
      ? adapter.getStatePath()
      : path.join(adapter.installBase, '.ecc-install-state.json');

    if (!fs.existsSync(statePath)) {
      issues.push({
        target: targetName,
        severity: 'missing',
        message: `No install state found at ${statePath}`,
      });
      continue;
    }

    let state;
    try {
      state = readInstallState(statePath);
    } catch (err) {
      issues.push({
        target: targetName,
        severity: 'error',
        message: `Could not read install state: ${err.message}`,
      });
      continue;
    }

    // Check each tracked path
    for (const [relPath, expected] of Object.entries(state.tracked || {})) {
      const absPath = path.join(adapter.installBase, relPath);
      if (!fs.existsSync(absPath)) {
        issues.push({
          target: targetName,
          severity: 'missing',
          path: relPath,
          message: `Tracked file is missing: ${relPath}`,
        });
      } else {
        let stat;
        try {
          stat = fs.statSync(absPath);
        } catch {
          continue;
        }
        if (expected.mtime && Math.abs(stat.mtimeMs - expected.mtime) > 1000) {
          issues.push({
            target: targetName,
            severity: 'drift',
            path: relPath,
            message: `File has been modified: ${relPath}`,
          });
        }
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Repair
// ---------------------------------------------------------------------------

/**
 * Re-apply the install plan for every target that has an install state file.
 * Files that are missing or drifted are re-copied; existing correct files
 * are left untouched.
 *
 * @param {string} repoRoot
 * @returns {Array<object>} — summary of repair actions taken
 */
function repairInstalledStates(repoRoot) {
  const { listInstallTargetAdapters } = _require('./install-targets/registry');
  const { createInstallPlanFromRequest } = _require('./install/runtime');
  const { applyInstallPlan } = _require('./install/apply');

  const summaries = [];

  for (const adapter of listInstallTargetAdapters()) {
    const statePath = adapter.getStatePath
      ? adapter.getStatePath()
      : path.join(adapter.installBase, '.ecc-install-state.json');

    if (!fs.existsSync(statePath)) continue;

    let state;
    try {
      state = readInstallState(statePath);
    } catch {
      continue;
    }

    const request = { target: adapter.targetName, mode: state.mode || 'legacy' };
    const plan = createInstallPlanFromRequest(request, repoRoot);

    const result = applyInstallPlan(plan, { dryRun: false, force: false });
    summaries.push({ target: adapter.targetName, actions: result });
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

/**
 * Remove files installed by a given target.
 *
 * @param {string} targetName
 * @param {string} repoRoot
 * @returns {Array<string>} — list of removed file paths (relative)
 */
function uninstallInstalledStates(targetName, repoRoot) {
  const { getInstallTargetAdapter } = _require('./install-targets/registry');
  const { readInstallState } = _require('./install-state');

  const adapter = getInstallTargetAdapter(targetName);
  if (!adapter) throw new Error(`Unknown target: ${targetName}`);

  const statePath = adapter.getStatePath
    ? adapter.getStatePath()
    : path.join(adapter.installBase, '.ecc-install-state.json');

  if (!fs.existsSync(statePath)) return [];

  const state = readInstallState(statePath);
  const removed = [];

  for (const relPath of Object.keys(state.tracked || {})) {
    const absPath = path.join(adapter.installBase, relPath);
    if (fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
        removed.push(relPath);
      } catch {
        // skip files that can't be deleted
      }
    }
  }

  try {
    fs.unlinkSync(statePath);
  } catch {
    // skip
  }

  return removed;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

/**
 * Find all targets that have an install state file on this system.
 *
 * @param {string} repoRoot
 * @returns {Array<object>} — `{ targetName, installBase, mode, trackedCount }`
 */
function discoverInstalledStates(repoRoot) {
  const { listInstallTargetAdapters } = _require('./install-targets/registry');

  const discovered = [];

  for (const adapter of listInstallTargetAdapters()) {
    const statePath = adapter.getStatePath
      ? adapter.getStatePath()
      : path.join(adapter.installBase, '.ecc-install-state.json');

    if (!fs.existsSync(statePath)) continue;

    let state;
    try {
      state = readInstallState(statePath);
    } catch {
      continue;
    }

    discovered.push({
      targetName: adapter.targetName,
      installBase: adapter.installBase,
      mode: state.mode || 'unknown',
      trackedCount: Object.keys(state.tracked || {}).length,
    });
  }

  return discovered;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _require(modulePath) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(modulePath);
}

function readInstallState(statePath) {
  const { readInstallState: _read } = _require('./install-state');
  return _read(statePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  buildDoctorReport,
  repairInstalledStates,
  uninstallInstalledStates,
  discoverInstalledStates,
};
