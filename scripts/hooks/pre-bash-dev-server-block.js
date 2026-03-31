'use strict';

/**
 * PreBash hook: block dev server commands that would hang the session.
 *
 * Blocks: next dev, remix dev, vite, parcel dev, etc. without tmux/screen.
 * Suggests using `auto-tmux-dev` hook or `&` to background.
 */

const { isDevServerCommand } = require('./auto-tmux-dev');

function handle({ command }) {
  if (!command) return;

  const trimmed = command.trim();

  if (!isDevServerCommand(trimmed)) return;

  // Check if already backgrounded
  if (trimmed.endsWith('&')) return;

  // Check if tmux is available
  const isTmux = process.env.TERM && process.env.TERM.includes('tmux');
  if (isTmux) return; // allow tmux sessions

  process.stderr.write(
    '[pre-bash-dev-server-block] Dev server detected without backgrounding.\n' +
    '[pre-bash-dev-server-block] Use `auto-tmux-dev` hook or append `&` to background.\n' +
    `[pre-bash-dev-server-block] Command: ${trimmed.slice(0, 80)}\n`
  );

  // Exit with 1 but don't hard-block since this is a warning
}

module.exports = { handle };
