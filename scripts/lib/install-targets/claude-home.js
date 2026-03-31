'use strict';

/**
 * Install target adapter for claude-home mode.
 *
 * Installs ECC hooks and schemas into `~/.claude/` so they are active
 * for all Claude Code sessions on the machine.
 */

const path = require('path');
const os = require('os');

const TARGET_NAME = 'claude-home';

function getInstallBase() {
  return path.join(os.homedir(), '.claude');
}

function getCopyRules() {
  const eccRoot = require('../resolve-ecc-root').resolveEccRoot() || path.join(__dirname, '../..');

  return [
    { src: path.join(eccRoot, 'hooks'), dest: path.join(getInstallBase(), 'hooks'), type: 'directory' },
    { src: path.join(eccRoot, 'schemas'), dest: path.join(getInstallBase(), 'schemas'), type: 'directory' },
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
