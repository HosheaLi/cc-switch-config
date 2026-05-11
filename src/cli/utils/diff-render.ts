/**
 * Diff Render Utility
 *
 * Per D-05, D-06: ANSI color diff rendering for terminal output.
 *
 * Renders unified diff representation with ANSI colors:
 * - Header: muted (--- a/ and +++ b/)
 * - Removed: danger with - prefix
 * - Added: success with + prefix
 * - Modified: warning with ~ prefix (before -> after)
 *
 * Value truncation:
 * - Strings > TRUNCATE_LENGTH chars are truncated with ellipsis
 *
 * Per T-14-07: 用户输入 (config values) 在显示前需去除 ANSI 转义码。
 */

import { colors } from '../theme/index.js';
import { stripAnsi } from './string-utils.js';
import type { DiffLine } from './diff.js';

/** Maximum length before truncation */
export const TRUNCATE_LENGTH = 50;

/**
 * Format a value for display in diff output.
 *
 * Handles various types and truncates long strings.
 *
 * @param value - Value to format
 * @returns Formatted string representation
 */
export function formatValue(value: unknown): string {
  // Handle null and undefined
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }

  // Handle primitives
  if (typeof value === 'string') {
    return truncateString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Handle arrays and objects - stringify then truncate
  const jsonStr = JSON.stringify(value);
  return truncateString(jsonStr);
}

/**
 * Truncate a string to TRUNCATE_LENGTH chars with ellipsis.
 *
 * @param str - String to truncate
 * @returns Truncated string or original if short
 */
function truncateString(str: string): string {
  if (str.length <= TRUNCATE_LENGTH) {
    return str;
  }
  return str.slice(0, TRUNCATE_LENGTH) + '...';
}

/**
 * Render unified diff output to console.
 *
 * Per D-05: Shows headers --- a/ and +++ b/
 * Per D-06: Uses ANSI colors for diff lines
 *
 * @param diffLines - Array of DiffLine to render
 * @param filePath - Optional custom file path for headers
 */
export function renderDiff(
  diffLines: DiffLine[],
  filePath: string = '.claude/settings.local.json'
): void {
  // Header (D-05)
  console.log(colors.muted(`--- a/${filePath}`));
  console.log(colors.muted(`+++ b/${filePath}`));

  // Empty diff handling
  if (diffLines.length === 0) {
    console.log('');
    console.log(colors.muted('配置无变化。'));
    return;
  }

  // Separator line after headers
  console.log('');

  // Sort lines by path alphabetically
  const sortedLines = [...diffLines].sort((a, b) => a.path.localeCompare(b.path));

  // Render each diff line
  for (const line of sortedLines) {
    switch (line.type) {
      case 'removed':
        console.log(colors.danger(`- ${stripAnsi(line.path)}: ${stripAnsi(formatValue(line.value))}`));
        break;

      case 'added':
        console.log(colors.success(`+ ${stripAnsi(line.path)}: ${stripAnsi(formatValue(line.value))}`));
        break;

      case 'modified':
        console.log(
          colors.warning(`~ ${stripAnsi(line.path)}: ${stripAnsi(formatValue(line.before))} -> ${stripAnsi(formatValue(line.after))}`)
        );
        break;

      default: {
        const _exhaustive: never = line;
        console.log(colors.muted(`? ${line.path}: [unknown type]`));
        break;
      }
    }
  }
}