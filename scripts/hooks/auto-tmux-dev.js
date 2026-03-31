'use strict';

/**
 * PreToolUse hook: transform dev server commands to run in detached tmux
 * sessions (or Windows cmd windows) so the Claude Code session stays responsive.
 *
 * Supported patterns (npm / pnpm / yarn / bun):
 *   npm run dev        pnpm dev       yarn dev        bun dev
 *   npm run start      pnpm start     yarn start      bun start
 *   npm run serve      pnpm serve     yarn serve      bun serve
 *   npm run preview    pnpm preview   yarn preview    bun preview
 *   npm run dev --     pnpm dev --    ...
 *   npm run dev -- --port 3001       ...
 *   next dev           vite           remix dev       ...
 *   python manage.py runserver
 *
 * Linux / macOS: spawns `tmux new-session -d -s ecc-dev -c "$PWD" "cmd"`
 * Windows (cmd.exe): spawns `start cmd /k "cmd"`
 */

const { spawn } = require('child_process');
const path = require('path');

const DEV_SERVER_PATTERNS = [
  // npm/pnpm/yarn/bun run dev|start|serve|preview
  /^(npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|preview)(?:\s+--?\s*.*)?$/,
  // next dev, remix dev, vite, parcel, ...
  /^(next|remix|vite|parcel)\s+dev(?:\s+--?\s*.*)?$/,
  // python manage.py runserver
  /^python\s+manage\.py\s+runserver(?:\s+.*)?$/,
  // deno run serve
  /^deno\s+run\s+(serve|--config)/,
];

const TMUX_SESSION_PREFIX = 'ecc-dev-';
const WINDOWS_SHELL = process.platform === 'win32' ? 'cmd.exe' : null;

function isDevServerCommand(command) {
  return DEV_SERVER_PATTERNS.some(p => p.test(command.trim()));
}

function startDetached(command, cwd) {
  if (WINDOWS_SHELL) {
    // Windows: use `start cmd /k` to open a new cmd window
    const child = spawn('cmd.exe', ['/c', 'start', 'cmd', '/k', `cd /d "${cwd}" && ${command}`], {
      detached: true,
      stdio: 'ignore',
      shell: false,
    });
    child.unref();
    return;
  }

  // Unix: use tmux new-session -d
  const sessionName = `${TMUX_SESSION_PREFIX}${Date.now()}`;
  const tmuxCmd = `tmux new-session -d -s "${sessionName}" -c "${cwd}" "${command}"`;

  spawn('sh', ['-c', tmuxCmd], {
    detached: true,
    stdio: 'ignore',
    cwd,
  }).unref();
}

function handle({ command }) {
  if (!isDevServerCommand(command)) return; // passthrough

  startDetached(command, process.cwd());

  // Return a placeholder so Claude Code doesn't wait for the server
  return {
    command: 'echo "dev server launched in background"',
  };
}

module.exports = { isDevServerCommand, startDetached, handle };
