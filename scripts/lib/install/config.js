'use strict';

/**
 * Load and validate `ecc-install.json` config.
 */

const fs = require('fs');
const path = require('path');

/**
 * @param {string} [cwd] - defaults to process.cwd()
 * @returns {object | null}
 */
function loadInstallConfig(cwd) {
  const configPath = findDefaultInstallConfigPath(cwd);
  if (!configPath) return null;

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse ${configPath}: ${err.message}`);
  }
}

/**
 * Search upward from `cwd` for `ecc-install.json`.
 *
 * @param {string} [cwd]
 * @returns {string | null}
 */
function findDefaultInstallConfigPath(cwd) {
  let dir = path.resolve(cwd || process.cwd());
  const root = path.parse(dir).root;

  while (dir !== root) {
    const p = path.join(dir, 'ecc-install.json');
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

module.exports = {
  loadInstallConfig,
  findDefaultInstallConfigPath,
};
