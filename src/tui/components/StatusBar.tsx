/**
 * StatusBar Component
 *
 * Per D-11: Status bar error display — bottom fixed, red for errors.
 * Per D-07: Rich visual feedback with chalk colors.
 *
 * Displays status messages with appropriate colors and icons.
 *
 * Usage:
 * ```tsx
 * <StatusBar message="Error saving config" type="error" />
 * <StatusBar message="Config applied successfully" type="success" />
 * <StatusBar message="Loading..." type="info" />
 * ```
 */
import React from 'react';
import { Box, Text } from 'ink';

export type StatusType = 'error' | 'success' | 'info' | 'warning' | 'none';

interface StatusBarProps {
  /** Status message to display */
  message: string | null;
  /** Type of status message (determines color and icon) */
  type: StatusType;
}

/**
 * Status bar component for displaying colored status messages.
 *
 * @param props - Component props
 * @returns Status bar or null if no message
 */
const COLOR_MAP: Record<StatusType, string> = {
  error: 'red',
  success: 'green',
  info: 'cyan',
  warning: 'yellow',
  none: 'white',
};

const ICON_MAP: Record<StatusType, string> = {
  error: '⚠ ',
  success: '✓ ',
  info: '',
  warning: '',
  none: '',
};

export const StatusBar: React.FC<StatusBarProps> = ({ message, type }) => {
  if (!message || type === 'none') return null;

  return (
    <Box borderStyle="single" borderColor="gray" marginTop={1}>
      <Text color={COLOR_MAP[type]} bold={type === 'error'}>
        {ICON_MAP[type]}
        {message}
      </Text>
    </Box>
  );
};