'use strict';

/**
 * Install target adapter for antigravity project mode.
 *
 * In this mode, ECC is installed into a project's subdirectory
 * (e.g. `.claude/`) and activated by environment variables / wrapper scripts.
 */

const path = require('path');
const fs = require('fs');

const TARGET_NAME = 'antigravity-project';

function getInstallBase() {
  const { findProjectRoot } = require('../resolve-formatter');
  // For antigravity, installBase is always process.cwd()
  return process.cwd();
}

function getCopyRules() {
  const root = getInstallBase();
  const eccRoot = require('../resolve-ecc-root').resolveEccRoot() || path.join(__dirname, '../..');

  return [
    { src: path.join(eccRoot, 'hooks'), dest: path.join(root, '.claude', 'hooks'), type: 'directory' },
    { src: path.join(eccRoot, 'schemas'), dest: path.join(root, '.claude', 'schemas'), type: 'directory' },
  ];
}

function getStatePath() {
  return path.join(getInstallBase(), '.claude', '.ecc-install-state.json');
}

module.exports = {
  targetName: TARGET_NAME,
  installBase: getInstallBase(),
  getCopyRules,
  getStatePath,
};
