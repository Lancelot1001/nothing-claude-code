'use strict';

/**
 * PreBash hook: remind to use tmux when running long commands.
 */

const LONG_COMMAND_THRESHOLD = 30; // seconds (heuristic)

function handle({ command }) {
  if (!command) return;

  const trimmed = command.trim();

  // Heuristic: long-running commands usually contain test, build, compile, etc.
  const isLongRunning = /(\btest\b|\bbuild\b|\bcompile\b|\btrain\b|\bmigrate\b|\bdeploy\b|\brender\b|\bpublish\b)/i.test(trimmed);

  if (!isLongRunning) return;

  const hasTmux = process.env.TERM && process.env.TERM.includes('tmux');
  if (hasTmux) return;

  process.stderr.write(
    '[pre-bash-tmux-reminder] Long-running command detected. Consider using tmux:\n' +
    '[pre-bash-tmux-reminder]   tmux new -s long-running\n' +
    '[pre-bash-tmux-reminder]   <your command>\n' +
    '[pre-bash-tmux-reminder]   tmux detach\n'
  );
}

module.exports = { handle };
