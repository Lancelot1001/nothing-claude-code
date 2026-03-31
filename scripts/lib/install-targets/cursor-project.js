'use strict';

/**
 * Install target adapter for cursor-project mode.
 *
 * Installs ECC hooks into a Cursor project-specific config directory.
 */

const path = require('path');

const TARGET_NAME = 'cursor-project';

function getInstallBase() {
  return path.join(process.cwd(), '.cursor');
}

function getCopyRules() {
  const eccRoot = require('../resolve-ecc-root').resolveEccRoot() || path.join(__dirname, '../..');

  return [
    { src: path.join(eccRoot, 'hooks'), dest: path.join(getInstallBase(), 'hooks'), type: 'directory' },
  ];
}

function getStatePath() {
  return path.join(getInstallBase(), '.ecc-install-state.json');
}

module.exports = {
  targetName: TARGET_NAME,
  installBase: getInstallBase(),
  getCopyRules,
  getStatePath,
};
