import { useInput, Key } from 'ink';

/**
 * Options for useKeyInput hook
 */
export interface KeyInputOptions {
  /** Callback for up navigation (arrow or 'k') */
  onUp?: () => void;
  /** Callback for down navigation (arrow or 'j') */
  onDown?: () => void;
  /** Callback for select action (Enter key) */
  onSelect?: () => void;
  /** Callback for escape action (Esc key) */
  onEscape?: () => void;
  /** Whether the hook is active (default: true) */
  isActive?: boolean;
}

/**
 * Hook for handling dual-mode navigation input (arrows + vim-style j/k)
 *
 * Per D-05: Dual-mode navigation — arrows + j/k
 * Per U3: Keyboard Navigation (arrows + j/k)
 * Per D-09: Escape to Cancel
 *
 * @param options - KeyInput options with callbacks and active state
 */
export function useKeyInput(options: KeyInputOptions): void {
  const { onUp, onDown, onSelect, onEscape, isActive = true } = options;

  useInput((input: string, key: Key) => {
    // Early exit if not active
    if (isActive === false) return;

    // Arrow keys navigation
    if (key.upArrow) {
      onUp?.();
    }
    if (key.downArrow) {
      onDown?.();
    }

    // Vim-style j/k navigation (U3 requirement)
    if (input === 'k' || input === 'K') {
      onUp?.();
    }
    if (input === 'j' || input === 'J') {
      onDown?.();
    }

    // Escape key (U4 requirement)
    if (key.escape) {
      onEscape?.();
    }

    // Enter key for selection
    if (key.return) {
      onSelect?.();
    }
  }, { isActive });
}