'use strict';

/**
 * Quality gate: runs before Stop to enforce minimum quality standards.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function runLinter(filePattern) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['eslint', '--max-warnings=0', filePattern], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });

    let stderr = '';
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', code => {
      resolve({ ok: code === 0, stderr: stderr.slice(0, 200) });
    });

    child.on('error', () => resolve({ ok: false, stderr: 'eslint not found' }));
  });
}

function runTypecheck() {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsc', '--noEmit'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });

    let stderr = '';
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', code => {
      resolve({ ok: code === 0, stderr: stderr.slice(0, 200) });
    });

    child.on('error', () => resolve({ ok: false, stderr: 'tsc not found' }));
  });
}

async function handle() {
  const cwd = process.cwd();
  const hasEslint = fs.existsSync(path.join(cwd, '.eslintrc.js'))
    || fs.existsSync(path.join(cwd, 'eslint.config.mjs'));
  const hasTypeScript = fs.existsSync(path.join(cwd, 'tsconfig.json'));

  const results = [];

  if (hasEslint) {
    const eslintResult = await runLinter('.');
    results.push({ check: 'eslint', ...eslintResult });
  }

  if (hasTypeScript) {
    const tscResult = await runTypecheck();
    results.push({ check: 'tsc', ...tscResult });
  }

  const failures = results.filter(r => !r.ok);
  if (failures.length > 0) {
    process.stderr.write('[quality-gate] Quality gate FAILED:\n');
    for (const f of failures) {
      process.stderr.write(`  ${f.check}: ${f.stderr}\n`);
    }
  }
}

module.exports = { handle };
