'use strict';

/**
 * Split shell commands by `&&`, `||`, `;`, `&` operators, respecting quotes.
 *
 * Intended for use in session compaction / replay so that compound commands
 * can be split into individual steps that can each be individually replayed
 * or skipped.
 *
 * ```js
 * const { splitShellSegments } = require('./shell-split');
 *
 * splitShellSegments('npm run build && npm run test')
 * // => ['npm run build', 'npm run test']
 *
 * splitShellSegments('echo "hello && world"')
 * // => ['echo "hello && world"']
 * ```
 */

const OPERATORS = ['&&', '||', ';', '&'];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * @param {string} line
 * @returns {string[]}
 */
function splitShellSegments(line) {
  const segments = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    // Handle quote toggles
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      i++;
      continue;
    }
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      i++;
      continue;
    }

    // Skip escaped characters inside quotes
    if ((inSingleQuote || inDoubleQuote) && char === '\\') {
      current += line[i] + (line[i + 1] || '');
      i += 2;
      continue;
    }

    // If we're not inside quotes, check for operators
    if (!inSingleQuote && !inDoubleQuote) {
      let foundOperator = null;
      let operatorLen = 0;

      for (const op of OPERATORS) {
        if (line.slice(i, i + op.length) === op) {
          foundOperator = op;
          operatorLen = op.length;
          break;
        }
      }

      if (foundOperator) {
        const trimmed = current.trim();
        if (trimmed) segments.push(trimmed);
        current = '';
        i += operatorLen;

        // If operator is `&` (background), also consume any trailing whitespace
        // so that `cmd &` and `cmd &  ` are treated the same
        while (line[i] === ' ') i++;

        continue;
      }
    }

    current += char;
    i++;
  }

  const trimmed = current.trim();
  if (trimmed) segments.push(trimmed);

  return segments;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = { splitShellSegments };
