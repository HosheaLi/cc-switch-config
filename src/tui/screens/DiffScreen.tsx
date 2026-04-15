/**
 * DiffScreen - Full-screen unified diff display before template application
 *
 * Per F12: Diff Before Apply - display diff before every template application.
 * Per D-03: Mandatory display before every apply - user cannot skip preview.
 * Per UI-SPEC.md: Yellow border for diff content, cyan header, Enter/Esc navigation.
 *
 * Shows unified diff of before/after configs with Enter to apply, Escape to cancel.
 *
 * Usage:
 * ```tsx
 * <DiffScreen
 *   before={currentConfig}
 *   after={mergedConfig}
 *   onApply={() => applyTemplate()}
 *   onCancel={() => returnToEditor()}
 * />
 * ```
 */
import React from 'react';
import { Box, Text, useInput } from 'ink';
import { generateUnifiedDiff } from '../../cli/utils/diff.js';
import { UnifiedDiff } from '../components/UnifiedDiff.js';
import type { ClaudeSettings } from '../../lib/types/config.js';

/**
 * Props for DiffScreen component.
 */
export interface DiffScreenProps {
  /** Current configuration before template application */
  before: ClaudeSettings;
  /** Merged configuration after template application */
  after: ClaudeSettings;
  /** Callback when user confirms to apply changes (Enter key) */
  onApply: () => void;
  /** Callback when user cancels and returns to editor (Escape key) */
  onCancel: () => void;
}

/**
 * DiffScreen - Full-screen unified diff display component.
 *
 * Features:
 * - Header "Changes to Apply" in cyan bold (UI-SPEC)
 * - Yellow-bordered diff content box (UI-SPEC)
 * - UnifiedDiff component for rendering diff lines
 * - Enter key to apply changes
 * - Escape key to cancel and return (U4)
 * - Empty diff shows "No changes detected" message
 *
 * Per D-03: This screen is mandatory before every template application.
 * User must explicitly confirm to proceed.
 *
 * @param props - Component props
 * @returns DiffScreen component
 */
export const DiffScreen: React.FC<DiffScreenProps> = ({
  before,
  after,
  onApply,
  onCancel,
}) => {
  // Generate diff lines
  const diffLines = generateUnifiedDiff(before, after);

  // Keyboard handling (Enter/Esc)
  useInput((input, key) => {
    // Enter key applies changes
    if (key.return) {
      onApply();
      return;
    }

    // Escape key cancels (U4)
    if (key.escape) {
      onCancel();
      return;
    }
  });

  return (
    <Box
      flexDirection="column"
      padding={2}
      justifyContent="center"
      alignItems="center"
    >
      {/* Header (UI-SPEC: cyan bold) */}
      <Text bold color="cyan">
        Changes to Apply
      </Text>

      {/* Diff content box (UI-SPEC: yellow border) */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="yellow"
        padding={1}
        marginTop={1}
      >
        {/* UnifiedDiff component */}
        <UnifiedDiff
          lines={diffLines}
          beforeLabel="--- settings.json (before)"
          afterLabel="+++ settings.json (after)"
        />
      </Box>

      {/* Prompt (UI-SPEC: yellow bold) */}
      <Box marginTop={2}>
        <Text bold color="yellow">
          Press Enter to apply, Escape to cancel
        </Text>
      </Box>
    </Box>
  );
};