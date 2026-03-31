'use strict';

/**
 * PostToolUse + Edit hook: auto-format JS/TS files with Biome or Prettier.
 *
 * Only runs if:
 * - The file is a JS/TS file (ext .js/.ts/.jsx/.tsx)
 * - A Biome or Prettier config exists in the project root
 * - The formatter binary is available in node_modules/.bin/
 */

const { spawn } = require('child_process');
const path = require('path');

function findFormatter(filePath) {
  const { detectFormatter, resolveFormatterBin } = require('../lib/resolve-formatter');

  const dir = path.dirname(filePath);
  const { formatter } = detectFormatter(dir);

  if (!formatter) return null;

  const bin = resolveFormatterBin(formatter, dir);
  return bin ? { formatter, bin } : null;
}

function formatFile(filePath, formatter) {
  return new Promise((resolve, reject) => {
    const child = spawn(formatter.bin, ['--write', filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', code => {
      if (code === 0) {
        resolve({ formatted: true });
      } else {
        reject(new Error(`Formatter exited ${code}: ${stderr.slice(0, 100)}`));
      }
    });

    child.on('error', reject);
  });
}

async function handle({ input, output }) {
  const filePath = input?.file_path;
  if (!filePath) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) return;

  const fmt = findFormatter(filePath);
  if (!fmt) return;

  try {
    await formatFile(filePath, fmt);
  } catch (err) {
    process.stderr.write(`[post-edit-format] Could not format ${filePath}: ${err.message}\n`);
  }
}

module.exports = { handle };
