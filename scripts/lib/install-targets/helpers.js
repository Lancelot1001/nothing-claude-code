'use strict';

/**
 * Factory functions for install target adapters.
 */

const fs = require('fs');
const path = require('path');

/**
 * Create a simple install target adapter with a flat file copy list.
 *
 * @param {string} targetName
 * @param {string} installBase
 * @param {Array<{src: string, dest: string, type: string}>} copyRules
 * @param {string} [statePath]
 * @returns {object}
 */
function createInstallTargetAdapter(targetName, installBase, copyRules, statePath) {
  return {
    targetName,
    installBase,
    getCopyRules: () => copyRules,
    getStatePath: () => statePath || path.join(installBase, '.ecc-install-state.json'),
  };
}

/**
 * Create a managed-operation adapter that wraps a target adapter and
 * injects pre/post hooks around install/uninstall.
 *
 * @param {object} targetAdapter
 * @param {object} [hooks]
 * @param {Function} [hooks.preInstall]
 * @param {Function} [hooks.postInstall]
 * @param {Function} [hooks.preUninstall]
 * @param {Function} [hooks.postUninstall]
 * @returns {object}
 */
function createManagedOperation(targetAdapter, hooks = {}) {
  return {
    ...targetAdapter,
    preInstall: hooks.preInstall || (() => {}),
    postInstall: hooks.postInstall || (() => {}),
    preUninstall: hooks.preUninstall || (() => {}),
    postUninstall: hooks.postUninstall || (() => {}),
  };
}

/**
 * Create a flat-rule operations object for simple adapters.
 *
 * @param {Array<{src: string, dest: string, type: string}>} copyRules
 * @returns {object}
 */
function createFlatRuleOperations(copyRules) {
  return {
    copyRules,
    apply() {
      for (const rule of copyRules) {
        if (rule.type === 'directory') {
          fs.mkdirSync(rule.dest, { recursive: true });
          _copyDirRecursive(rule.src, rule.dest);
        } else {
          fs.mkdirSync(path.dirname(rule.dest), { recursive: true });
          fs.copyFileSync(rule.src, rule.dest);
        }
      }
    },
    revert() {
      for (const rule of copyRules) {
        try {
          if (rule.type === 'directory') {
            _rmDirRecursive(rule.dest);
          } else {
            fs.unlinkSync(rule.dest);
          }
        } catch { /* ignore */ }
      }
    },
  };
}

/**
 * Create a namespaced flat-rule operations object.
 *
 * @param {string} namespace - e.g. "claude-home", "cursor-project"
 * @param {Array<{src: string, dest: string, type: string}>} copyRules
 * @returns {object}
 */
function createNamespacedFlatRuleOperations(namespace, copyRules) {
  return {
    namespace,
    operations: createFlatRuleOperations(copyRules),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      _copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function _rmDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      _rmDirRecursive(p);
    } else {
      fs.unlinkSync(p);
    }
  }
  fs.rmdirSync(dir);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  createInstallTargetAdapter,
  createManagedOperation,
  createFlatRuleOperations,
  createNamespacedFlatRuleOperations,
};
