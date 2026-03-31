'use strict';

/**
 * Detect and select package manager (npm / pnpm / yarn / bun).
 *
 * Priority order (first wins):
 *  1. `pnpm-lock.yaml`
 *  2. `bun.lockb`
 *  3. `yarn.lock`  (classic Yarn 1.x detected by --version call)
 *  4. `package-lock.json`
 *
 * Override with `ECC_PREFERRED_PM=npm|pnpm|yarn|bun`.
 *
 * ## Usage
 *
 * ```js
 * const { getPackageManager } = require('./package-manager');
 * const { name, config } = getPackageManager();
 * // config.name        — "npm" | "pnpm" | "yarn" | "bun"
 * // config.execCmd     — "npx" | "pnpm" | "yarn" | "bunx"
 * // config.lockFile    — "package-lock.json" | "pnpm-lock.yaml" | ...
 * ```
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LOCK_FILES = {
  'pnpm-lock.yaml': { name: 'pnpm', execCmd: 'pnpm' },
  'bun.lockb':      { name: 'bun',    execCmd: 'bun' },
  'yarn.lock':      { name: 'yarn',   execCmd: 'yarn' },
  'package-lock.json': { name: 'npm', execCmd: 'npm' },
};

const PM_NAMES = new Set(['npm', 'pnpm', 'yarn', 'bun']);

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function detectLockFile(cwd) {
  for (const [lockFile, pm] of Object.entries(LOCK_FILES)) {
    if (fs.existsSync(path.join(cwd, lockFile))) {
      return { lockFile, ...pm };
    }
  }
  return { lockFile: 'package-lock.json', name: 'npm', execCmd: 'npm' };
}

/**
 * Detect whether yarn is classic (1.x) or modern (berry).
 * Classic yarn does NOT support `yarn dlx` — we must fall back to `npx`.
 *
 * @param {string} cwd
 * @returns {string} 'yarn1' | 'yarn2+' | 'unknown'
 */
function detectYarnVersion(cwd) {
  try {
    const out = execFileSync('yarn', ['--version'], { cwd, encoding: 'utf8', timeout: 5000 });
    const version = out.trim();
    if (version.startsWith('1.')) return 'yarn1';
    if (version.startsWith('2.') || version.startsWith('3.') || version.startsWith('4.')) return 'yarn2+';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _cached = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the detected package manager for `cwd` (defaults to process.cwd()).
 *
 * @param {string} [cwd]
 * @returns {{ name: string, execCmd: string, lockFile: string, version: string }}
 */
function getPackageManager(cwd) {
  if (_cached) return _cached;

  const root = cwd || process.cwd();

  // Honour explicit override
  const override = process.env['ECC_PREFERRED_PM'];
  if (override && PM_NAMES.has(override)) {
    const lockFile = Object.keys(LOCK_FILES).find(
      f => LOCK_FILES[f].name === override
    ) || 'package-lock.json';
    const execCmd = override === 'bun' ? 'bun' : override;
    _cached = { name: override, execCmd, lockFile, version: 'env-override' };
    return _cached;
  }

  const detected = detectLockFile(root);

  // Special case: yarn 1.x does not support `yarn dlx`
  let resolvedExecCmd = detected.execCmd;
  if (detected.name === 'yarn') {
    const yarnVersion = detectYarnVersion(root);
    if (yarnVersion === 'yarn1') {
      resolvedExecCmd = 'npx'; // fall back to npx for yarn 1.x
    }
  }

  _cached = { ...detected, execCmd: resolvedExecCmd };
  return _cached;
}

/**
 * Override the preferred package manager for subsequent calls.
 *
 * @param {'npm'|'pnpm'|'yarn'|'bun'} name
 */
function setPreferredPackageManager(name) {
  if (!PM_NAMES.has(name)) {
    throw new Error(`Unknown package manager: "${name}"`);
  }
  const lockFile = Object.keys(LOCK_FILES).find(
    f => LOCK_FILES[f].name === name
  ) || 'package-lock.json';
  _cached = { name, execCmd: name === 'bun' ? 'bun' : name, lockFile, version: 'user-override' };
}

/**
 * Return the CLI runner command for the detected package manager.
 * - npm:  `npm run <script>`
 * - pnpm: `pnpm run <script>`
 * - yarn: `yarn run <script>`  (or `npx` for yarn 1.x scripts that need dlx)
 * - bun:  `bun run <script>`
 *
 * @param {string} [cwd]
 * @returns {string}
 */
function getRunCommand(cwd) {
  const pm = getPackageManager(cwd);
  if (pm.name === 'bun') return 'bun run';
  if (pm.name === 'yarn') return 'yarn run';
  return `${pm.name} run`;
}

/**
 * Return the direct executor command (no `run` subcommand needed).
 * - npm:  `npx`
 * - pnpm: `pnpm exec` (or `pnpx` for older pnpm)
 * - yarn: `npx`        (yarn 1.x always uses npx for direct exec)
 * - bun:  `bunx`
 *
 * @param {string} [cwd]
 * @returns {string}
 */
function getExecCommand(cwd) {
  const pm = getPackageManager(cwd);
  if (pm.name === 'bun') return 'bunx';
  if (pm.name === 'npm') return 'npx';
  if (pm.name === 'pnpm') {
    // pnpm >= 7 prefers `pnpm exec`; older versions used `pnpx`
    try {
      const out = execFileSync('pnpm', ['--version'], { encoding: 'utf8', timeout: 3000 }).trim();
      const [major] = out.split('.').map(Number);
      return major >= 7 ? 'pnpm exec' : 'pnpx';
    } catch {
      return 'pnpm exec';
    }
  }
  // yarn 1.x
  return 'npx';
}

module.exports = {
  getPackageManager,
  setPreferredPackageManager,
  getRunCommand,
  getExecCommand,
};
