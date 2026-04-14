/**
 * ImportConflictScreen - Conflict Resolution UI
 *
 * Per D-07: Interactive conflict handling with merge/overwrite/skip options.
 * Per UI-SPEC: Header "Import Conflicts Detected", options [1] Merge, [2] Overwrite, [3] Skip.
 *
 * Displays detected conflicts between imported and existing config,
 * and allows user to choose resolution strategy.
 *
 * Usage:
 * ```tsx
 * <ImportConflictScreen
 *   conflicts={conflicts}
 *   onResolve={(strategy) => handleResolve(strategy)}
 *   onCancel={() => handleCancel()}
 * />
 * ```
 */
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ConflictField } from '../../lib/types/export-schema.js';

/**
 * Import strategy types.
 * Per D-07: merge, overwrite, or skip.
 */
export type ImportStrategy = 'merge' | 'overwrite' | 'skip';

/**
 * Props for ImportConflictScreen component.
 */
export interface ImportConflictScreenProps {
  /** Array of conflicting fields from detectConflicts() */
  conflicts: ConflictField[];
  /** Callback when user selects a resolution strategy */
  onResolve: (strategy: ImportStrategy) => void;
  /** Callback when user cancels the import */
  onCancel: () => void;
}

/**
 * ImportConflictScreen - Conflict resolution UI component.
 *
 * Features:
 * - Header with cyan color (UI-SPEC)
 * - Yellow-bordered conflict list box (UI-SPEC)
 * - Number key selection (1/2/3) (D-07)
 * - Escape to cancel (U4)
 * - Active option highlighted with bold green
 *
 * @param props - Component props
 * @returns ImportConflictScreen component
 */
export const ImportConflictScreen: React.FC<ImportConflictScreenProps> = ({
  conflicts,
  onResolve,
  onCancel,
}) => {
  // Track which option is highlighted (for visual feedback before selection)
  const [highlightedOption, setHighlightedOption] = useState<number>(1);

  // Keyboard handling for number keys and escape
  useInput((input, key) => {
    // Number keys select strategy directly
    if (input === '1') {
      onResolve('merge');
      return;
    }

    if (input === '2') {
      onResolve('overwrite');
      return;
    }

    if (input === '3') {
      onResolve('skip');
      return;
    }

    // Arrow keys change highlight (optional visual feedback)
    if (key.upArrow) {
      setHighlightedOption(prev => Math.max(1, prev - 1));
      return;
    }

    if (key.downArrow) {
      setHighlightedOption(prev => Math.min(3, prev + 1));
      return;
    }

    // Enter selects highlighted option
    if (key.return) {
      const strategies: ImportStrategy[] = ['merge', 'overwrite', 'skip'];
      onResolve(strategies[highlightedOption - 1]);
      return;
    }

    // Escape cancels import (U4)
    if (key.escape) {
      onCancel();
      return;
    }
  });

  // Format conflict value for display
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Resolution options
  const options = [
    { key: '1', name: 'Merge all', description: 'preserve existing values, add new fields' },
    { key: '2', name: 'Overwrite all', description: 'replace with imported values' },
    { key: '3', name: 'Skip all', description: 'keep existing, discard imported' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header (UI-SPEC: cyan bold) */}
      <Text bold color="cyan">
        Import Conflicts Detected
      </Text>

      {/* Conflict count */}
      <Box marginTop={1}>
        <Text dimColor>
          {conflicts.length} conflicting fields found
        </Text>
      </Box>

      {/* Conflict list box (UI-SPEC: yellow border) */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="yellow"
        padding={1}
        marginTop={1}
      >
        {conflicts.map((conflict, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            {/* Field key (bold) */}
            <Text bold>
              {conflict.key}
            </Text>

            {/* Imported value (cyan) */}
            <Text color="cyan">
              Imported: {formatValue(conflict.imported)}
            </Text>

            {/* Existing value (yellow) */}
            <Text color="yellow">
              Existing: {formatValue(conflict.existing)}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Resolution options (UI-SPEC) */}
      <Box flexDirection="column" marginTop={1}>
        {options.map((option, index) => (
          <Box key={option.key}>
            <Text
              bold={highlightedOption === index + 1}
              color={highlightedOption === index + 1 ? 'green' : 'white'}
            >
              [{option.key}] {option.name} - {option.description}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Help text (UI-SPEC: dimColor) */}
      <Box marginTop={1}>
        <Text dimColor>
          1: merge | 2: overwrite | 3: skip | Esc: cancel import
        </Text>
      </Box>
    </Box>
  );
};