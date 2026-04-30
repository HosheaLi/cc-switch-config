/**
 * Ctrl+C Cancel Handling - TUI-05
 *
 * Per D-05: Ctrl+C triggers onCancel callback for graceful exit.
 */

import prompts from 'prompts';

/**
 * Result from a prompt with cancellation detection.
 */
export interface PromptResult<T> {
  /** The selected value, or null if cancelled */
  value: T | null;
  /** Whether the prompt was cancelled (Ctrl+C) */
  cancelled: boolean;
}

/**
 * Default onCancel handler - graceful exit message.
 * Per TUI-05: Display cancellation message and exit.
 */
export function defaultOnCancel(): void {
  console.log('\n操作已取消。');
  process.exit(0);
}

/**
 * Run a prompt with cancellation detection.
 *
 * @param promptConfig - prompts configuration object
 * @param onCancel - Optional custom cancel handler
 * @returns PromptResult with value and cancelled status
 */
export async function promptWithCancel<T>(
  promptConfig: prompts.PromptObject,
  onCancel?: () => void
): Promise<PromptResult<T>> {
  const key = promptConfig.name as string;

  const result = await prompts(promptConfig, {
    onCancel: onCancel ?? defaultOnCancel,
  });

  const value = result[key];

  return {
    value: value ?? null,
    cancelled: value === undefined,
  };
}

/**
 * Check if a prompts response was cancelled.
 *
 * @param response - prompts response object
 * @param key - The key to check
 * @returns true if the value is undefined (cancelled)
 */
export function isCancelled<T>(response: Record<string, T>, key: string): boolean {
  return response[key] === undefined;
}

/**
 * Create a custom onCancel handler that returns instead of exiting.
 * Useful for wizards where we want to return to previous step.
 *
 * @returns onCancel function that returns false instead of exiting
 */
export function createReturnOnCancel(): () => boolean {
  return () => {
    console.log('\n操作已取消。');
    return false; // Return false to stop the prompts chain
  };
}