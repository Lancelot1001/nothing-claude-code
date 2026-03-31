'use strict';

/**
 * Apply install plans: copy files, merge hooks.json, write install-state.
 */

const fs = require('fs');
const path = require('path');

const { createInstallState, writeInstallState } = require('../install-state');
const { createFlatRuleOperations } = require('../install-targets/helpers');

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

/**
 * @param {object} plan - from createLegacyInstallPlan or createManifestInstallPlan
 * @param {{ dryRun?: boolean, force?: boolean }} [options]
 * @returns {{ copiedFiles: string[], mergedHooks: boolean, stateWritten: boolean }}
 */
function applyInstallPlan(plan, options = {}) {
  const { dryRun = false, force = false } = options;

  const copiedFiles = [];
  const skipFiles = new Set();

  if (!dryRun) {
    // Pre-install checks: bail if install base already has files we would overwrite
    // (only in non-force mode)
    if (!force) {
      _checkOverwrites(plan, skipFiles);
    }
  }

  // Collect copy rules
  let copyRules = [];
  if (plan.mode === 'legacy' || plan.mode === 'legacy-compat') {
    copyRules = plan.targetAdapter ? plan.targetAdapter.getCopyRules() : [];
  } else if (plan.mode === 'manifest') {
    copyRules = _manifestToCopyRules(plan);
  }

  // Copy files
  for (const rule of copyRules) {
    if (skipFiles.has(rule.dest)) continue;

    if (dryRun) {
      copiedFiles.push(rule.dest);
    } else {
      try {
        _copyRecursive(rule.src, rule.dest);
        copiedFiles.push(rule.dest);
      } catch (err) {
        // Log and continue
        process.stderr.write(`[apply] Could not copy ${rule.src}: ${err.message}\n`);
      }
    }
  }

  // Merge hooks.json
  let mergedHooks = false;
  if (plan.mode === 'legacy') {
    const merged = _mergeHooksJson(plan.targetAdapter, dryRun);
    mergedHooks = merged;
  }

  // Write install state
  let stateWritten = false;
  if (!dryRun) {
    try {
      const statePath = plan.targetAdapter && plan.targetAdapter.getStatePath
        ? plan.targetAdapter.getStatePath()
        : path.join(plan.targetAdapter.installBase, '.ecc-install-state.json');

      const state = createInstallState({ mode: plan.mode });

      // Track all copied files
      for (const f of copiedFiles) {
        const stat = fs.statSync(f);
        state.tracked[f] = { mtime: stat.mtimeMs, size: stat.size };
      }

      writeInstallState(statePath, state);
      stateWritten = true;
    } catch (err) {
      process.stderr.write(`[apply] Could not write install state: ${err.message}\n`);
    }
  }

  return { copiedFiles, mergedHooks, stateWritten };
}

// ---------------------------------------------------------------------------
// Hooks merge
// ---------------------------------------------------------------------------

/**
 * Merge the repo's hooks.json with the target's existing hooks.json.
 * Returns `true` if a merge was performed.
 *
 * @param {object} targetAdapter
 * @param {boolean} dryRun
 * @returns {boolean}
 */
function _mergeHooksJson(targetAdapter, dryRun) {
  const repoHooks = path.join(__dirname, '../../../hooks/hooks.json');
  const destHooks = path.join(targetAdapter.installBase, 'hooks.json');

  if (!fs.existsSync(repoHooks)) return false;

  let repoHooksData;
  try {
    repoHooksData = JSON.parse(fs.readFileSync(repoHooks, 'utf8'));
  } catch {
    return false;
  }

  let destHooksData = { hooks: {} };
  if (fs.existsSync(destHooks)) {
    try {
      destHooksData = JSON.parse(fs.readFileSync(destHooks, 'utf8'));
    } catch { /* ignore */ }
  }

  // Merge: repo hooks win for duplicate keys
  const merged = {
    hooks: {
      ...destHooksData.hooks,
      ...repoHooksData.hooks,
    },
  };

  if (!dryRun) {
    fs.mkdirSync(targetAdapter.installBase, { recursive: true });
    fs.writeFileSync(destHooks, JSON.stringify(merged, null, 2), 'utf8');
  }

  return true;
}

// ---------------------------------------------------------------------------
// Manifest to copy rules
// ---------------------------------------------------------------------------

function _manifestToCopyRules(plan) {
  const eccRoot = require('../resolve-ecc-root').resolveEccRoot() || path.join(__dirname, '../../../..');
  const rules = [];

  for (const mod of plan.modules) {
    for (const modPath of mod.paths) {
      const src = path.join(eccRoot, modPath);
      const dest = path.join(eccRoot, modPath); // in-repo install — same path
      rules.push({ src, dest, type: 'file-or-dir' });
    }
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _copyRecursive(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.statSync(src).isDirectory()) {
    _copyDirRecursive(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function _copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      _copyDirRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function _checkOverwrites(plan, skipFiles) {
  // Lightweight pre-check: if any copy-rule dest already exists with different content,
  // mark it to be skipped (will be handled by overwrite logic if not force)
  // For now, just collect the set of existing files
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = { applyInstallPlan };
