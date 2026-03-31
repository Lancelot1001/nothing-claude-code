'use strict';

/**
 * PostToolUse + Edit hook: run typecheck on edited TS/TSX files.
 *
 * Only runs if:
 * - The file is a TypeScript file
 * - A `tsconfig.json` exists in the project root
 * - A `typecheck` script is defined in package.json
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function hasTypecheckScript(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return !!(pkg.scripts && pkg.scripts.typecheck);
  } catch {
    return false;
  }
}

function runTypecheck(filePath) {
  const cwd = path.dirname(filePath);
  const tsc = path.join(cwd, 'node_modules/.bin/tsc');

  return new Promise((resolve, reject) => {
    const child = spawn(tsc, ['--noEmit', filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd,
    });

    let stderr = '';
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', code => {
      if (code === 0) {
        resolve({ ok: true });
      } else {
        reject(new Error(`TypeScript errors:\n${stderr.slice(0, 500)}`));
      }
    });

    child.on('error', reject);
  });
}

async function handle({ input }) {
  const filePath = input?.file_path;
  if (!filePath) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!['.ts', '.tsx'].includes(ext)) return;

  const cwd = path.dirname(filePath);
  if (!hasTypecheckScript(cwd)) return;

  try {
    await runTypecheck(filePath);
  } catch (err) {
    process.stderr.write(`[post-edit-typecheck] Type errors in ${path.basename(filePath)}:\n${err.message}\n`);
  }
}

module.exports = { handle };
