/**
 * useDelayedLoading Hook
 *
 * Per D-08: Threshold-triggered loading.
 * Spinner shows only after 500ms to avoid visual distraction on fast operations.
 *
 * Usage:
 * ```typescript
 * const showSpinner = useDelayedLoading(isLoading, 500);
 * if (showSpinner) return <Spinner />;
 * ```
 */
import { useState, useEffect } from 'react';

/**
 * Hook that delays showing loading indicator until threshold is reached.
 *
 * @param isLoading - Whether the operation is currently loading
 * @param threshold - Delay threshold in milliseconds (default: 500)
 * @returns Whether to show the spinner (true only after threshold)
 */
export function useDelayedLoading(
  isLoading: boolean,
  threshold: number = 500
): boolean {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSpinner(false);
      return;
    }

    const timer = setTimeout(() => setShowSpinner(true), threshold);
    return () => clearTimeout(timer);
  }, [isLoading, threshold]);

  return showSpinner;
}