/**
 * ConfirmScreen - Full-screen confirmation dialog for destructive actions
 *
 * Per D-10: Full-screen confirmation for destructive actions.
 * Per U5: Confirmation Prompts for destructive actions.
 * Per U4: Escape to Cancel.
 *
 * Note: Uses direct useInput for y/n handling, not useKeyInput,
 * since we need specific letter input.
 */
import React from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * Props for ConfirmScreen component
 */
export interface ConfirmScreenProps {
  /** The main confirmation message */
  message: string;
  /** Detailed description of what will happen */
  actionDescription: string;
  /** Callback when user confirms (presses 'y') */
  onConfirm: () => void;
  /** Callback when user cancels (presses 'n' or Escape) */
  onCancel: () => void;
}

/**
 * Full-screen confirmation dialog component
 *
 * Requires explicit y/n confirmation for dangerous operations.
 * Enter key is deliberately ignored to force explicit confirmation (U5).
 */
export const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  message,
  actionDescription,
  onConfirm,
  onCancel,
}) => {
  // Custom useInput for y/n handling
  useInput((input, key) => {
    // 'y' confirms (case-insensitive)
    if (input.toLowerCase() === 'y') {
      onConfirm();
      return;
    }

    // 'n' cancels (case-insensitive) or Escape key (U4)
    if (input.toLowerCase() === 'n' || key.escape) {
      onCancel();
      return;
    }

    // Enter is deliberately ignored - user must explicitly type y/n (U5)
    // Other keys are ignored as well
  });

  return (
    <Box
      flexDirection="column"
      padding={2}
      justifyContent="center"
      alignItems="center"
    >
      {/* Warning Icon */}
      <Text bold color="red">
        WARNING
      </Text>

      {/* Confirmation Message */}
      <Box marginTop={1}>
        <Text bold>{message}</Text>
      </Box>

      {/* Action Description */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="red"
        padding={1}
      >
        <Text dimColor>{actionDescription}</Text>
      </Box>

      {/* Prompt */}
      <Box marginTop={2}>
        <Text bold color="yellow">
          Type 'y' to confirm, 'n' to cancel (or Esc)
        </Text>
      </Box>
    </Box>
  );
};