/**
 * ValidationErrorScreen - Full-screen validation error display
 *
 * Per D-04: Full-screen error list (like ConfirmScreen).
 * Per D-05: NO confirm option - user must fix errors before proceeding.
 * Per U4: Escape to return.
 *
 * Note: Uses direct useInput for Escape handling.
 * This screen deliberately blocks continuation until errors are fixed.
 */
import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { ValidationError } from '../../lib/types/validation.js';

/**
 * Props for ValidationErrorScreen component
 *
 * Note: NO onConfirm callback per D-05 - user cannot proceed with invalid config.
 */
export interface ValidationErrorScreenProps {
  /** The validation error containing all issues */
  error: ValidationError;
  /** Callback when user presses Escape to return and fix errors */
  onCancel: () => void;
}

/**
 * Full-screen validation error display component
 *
 * Displays all validation errors in a red-bordered box.
 * Only Escape key is registered - user must fix errors before proceeding.
 * Per D-05: NO 'y' confirm option exists.
 */
export const ValidationErrorScreen: React.FC<ValidationErrorScreenProps> = ({
  error,
  onCancel,
}) => {
  // Only Escape key handling (D-05: no confirm option)
  useInput((input, key) => {
    // Only Escape triggers onCancel
    if (key.escape) {
      onCancel();
      return;
    }

    // All other inputs are ignored (D-05: must fix errors)
    // 'y', 'n', Enter, etc. do nothing
  });

  // Get formatted error messages from ValidationError
  const errorMessages = error.getMessages();

  return (
    <Box
      flexDirection="column"
      padding={2}
      justifyContent="center"
      alignItems="center"
    >
      {/* Header: "Validation Errors" in red bold */}
      <Text bold color="red">
        Validation Errors
      </Text>

      {/* Subheader: dimmed explanation */}
      <Box marginTop={1}>
        <Text dimColor>
          The following issues must be fixed before applying:
        </Text>
      </Box>

      {/* Error list box: red border */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="red"
        padding={1}
        flexDirection="column"
      >
        {errorMessages.length === 0 ? (
          <Text dimColor>No validation errors</Text>
        ) : (
          errorMessages.map((message, index) => (
            <Text key={index}>{message}</Text>
          ))
        )}
      </Box>

      {/* Bottom prompt: yellow bold */}
      <Box marginTop={2}>
        <Text bold color="yellow">
          Press Escape to return and fix errors
        </Text>
      </Box>
    </Box>
  );
};