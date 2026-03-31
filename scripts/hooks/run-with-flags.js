'use strict';

/**
 * Wrapper that runs a command with ECC hook flags set.
 *
 * Usage:
 *   node run-with-flags.js <command> [args...]
 *   ECC_DISABLED_HOOKS=check-console-log node run-with-flags.js npm run build
 */

const { spawn } = require('child_process');
const path = require('path');

const execFile = process.argv[2];
const execArgs = process.argv.slice(3);

if (!execFile) {
  process.stderr.write('Usage: node run-with-flags.js <exec-file> [args...]\n');
  process.exit(1);
}

const child = spawn(execFile, execArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    // ECC hook flags are inherited from process.env but can be overridden
    // before spawning
  },
});

child.on('exit', code => {
  process.exit(code || 0);
});
