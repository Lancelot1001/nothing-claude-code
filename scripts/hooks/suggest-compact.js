'use strict';

/**
 * SuggestCompact hook: propose session compaction when context is near full.
 */

const fs = require('fs');
const path = require('path');

function handle({ tokens_remaining, tokens_max }) {
  if (!tokens_max) return;

  const fillPct = (tokens_max - tokens_remaining) / tokens_max;

  if (fillPct < 0.8) return; // only suggest at 80%+ fill

  process.stderr.write(
    '[suggest-compact] Context window is > 80% full.\n' +
    '[suggest-compact] Consider running /compact to free up context space.\n'
  );
}

module.exports = { handle };
