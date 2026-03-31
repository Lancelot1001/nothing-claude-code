'use strict';

/**
 * Node.js wrapper that spawns the Python security monitor script.
 *
 * This is the hook that Claude Code actually invokes. It reads the hook
 * protocol input, forwards it to the Python script over stdin, and
 * maps the exit code back to Claude Code's hook protocol.
 */

const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, 'insaits-security-monitor.py');

function handle(params) {
  // Read from fd 3 if available (Claude Code hook protocol)
  // Otherwise read from stdin
  let rawInput = '';

  try {
    const fd = fs.openSync('/dev/stdin', 'rs');
    const stat = fs.fstatSync(fd);
    if (!stat.isCharacterDevice() && !stat.isFIFO()) {
      const buf = Buffer.alloc(64 * 1024);
      const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
      rawInput = buf.toString('utf8', 0, bytes);
    }
    fs.closeSync(fd);
  } catch {
    // Fallback
    rawInput = '';
  }

  const python = spawn('python3', [PYTHON_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  python.stdin.write(rawInput);
  python.stdin.end();

  let stderr = '';
  python.stderr.on('data', d => { stderr += d.toString(); });

  return new Promise((resolve, reject) => {
    python.on('close', code => {
      if (code === 2) {
        // Blocked by security monitor
        process.stderr.write(stderr);
        process.exit(2);
      }
      // Allowed (0) or monitoring disabled (0)
      resolve({ allowed: true });
    });
    python.on('error', err => {
      process.stderr.write(`[insaits-wrapper] error: ${err.message}\n`);
      resolve({ allowed: true }); // fail open
    });
  });
}

const fs = require('fs');

module.exports = { handle };
