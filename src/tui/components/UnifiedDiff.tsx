/**
 * UnifiedDiff Component
 *
 * Per D-01: Git-style unified diff format for config changes.
 * Per UI-SPEC.md: Red for removed, green for added.
 *
 * Renders diff lines with proper colors for visual clarity.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { DiffLine } from '../../cli/utils/diff.js';

/**
 * Props for UnifiedDiff component
 */
interface UnifiedDiffProps {
  /** Array of diff lines to render */
  lines: DiffLine[];
  /** Label for before state (default: '--- settings.json (before)') */
  beforeLabel?: string;
  /** Label for after state (default: '+++ settings.json (after)') */
  afterLabel?: string;
}

/**
 * Format a value for display.
 *
 * Objects/arrays: JSON.stringify
 * Strings: display directly (no quotes for readability)
 * null/undefined: show as 'null'/'undefined'
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value; // No quotes for readability
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * UnifiedDiff component for rendering git-style diff lines.
 *
 * @param props - Component props
 * @returns Diff display with colored lines
 */
export const UnifiedDiff: React.FC<UnifiedDiffProps> = ({
  lines,
  beforeLabel = '--- settings.json (before)',
  afterLabel = '+++ settings.json (after)',
}) => {
  // Empty state
  if (lines.length === 0) {
    return (
      <Box padding={1}>
        <Text dimColor>No changes detected — config unchanged</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header labels */}
      <Text dimColor>{beforeLabel}</Text>
      <Text dimColor>{afterLabel}</Text>
      <Box marginTop={1} flexDirection="column">
        {/* Diff lines */}
        {lines.map((line, index) => {
          if (line.type === 'removed') {
            return (
              <Text key={index} color="red">
                - {line.path}: {formatValue(line.value)}
              </Text>
            );
          }

          if (line.type === 'added') {
            return (
              <Text key={index} color="green">
                + {line.path}: {formatValue(line.value)}
              </Text>
            );
          }

          // Modified: show as two lines (before/after)
          if (line.type === 'modified') {
            return (
              <Box key={index} flexDirection="column">
                <Text color="red">
                  - {line.path}: {formatValue(line.before)}
                </Text>
                <Text color="green">
                  + {line.path}: {formatValue(line.after)}
                </Text>
              </Box>
            );
          }

          // Fallback (shouldn't happen)
          return null;
        })}
      </Box>
    </Box>
  );
};