/**
 * LoadingIndicator Component
 *
 * Per D-08: Threshold-triggered loading indicator.
 * Shows spinner only after 500ms to avoid visual distraction on fast operations.
 *
 * Usage:
 * ```tsx
 * <LoadingIndicator isLoading={isSaving} />
 * <LoadingIndicator isLoading={isLoading} spinnerType="line" message="Fetching..." />
 * ```
 */
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';

interface LoadingIndicatorProps {
  /** Whether the operation is currently loading */
  isLoading: boolean;
  /** Delay threshold in milliseconds (default: 500) */
  threshold?: number;
  /** Spinner animation type (default: 'dots') */
  spinnerType?: 'dots' | 'line' | 'arrow' | 'bouncingBar';
  /** Message to display alongside spinner (default: 'Loading...') */
  message?: string;
}

/**
 * Loading indicator that shows spinner only after threshold delay.
 *
 * @param props - Component props
 * @returns Spinner component or null
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  threshold = 500,
  spinnerType = 'dots',
  message = 'Loading...',
}) => {
  const showSpinner = useDelayedLoading(isLoading, threshold);

  if (!showSpinner) return null;

  return (
    <Box>
      <Text color="cyan">
        <Spinner type={spinnerType} />
      </Text>
      <Text> {message}</Text>
    </Box>
  );
};