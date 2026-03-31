'use strict';

/**
 * PreBash hook: remind about git push after a commit.
 */

function handle({ command }) {
  if (!command) return;
  const trimmed = command.trim();

  if (!trimmed.startsWith('git commit')) return;

  process.stderr.write(
    '[pre-bash-git-push-reminder] Remember to push after committing:\n' +
    '[pre-bash-git-push-reminder]   git push\n'
  );
}

module.exports = { handle };
