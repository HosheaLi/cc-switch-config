import { useState } from 'react';

/**
 * Screen types for navigation
 * Per D-02: Layer-level navigation with stack management
 * Per D-08: 'scan' screen type added for ScanScreen integration
 */
export type Screen = 'list' | 'editor' | 'confirm' | 'template-select' | 'scan';

/**
 * Navigation state interface
 */
export interface NavigationState {
  /** Stack of screens (current screen is last element) */
  stack: Screen[];
  /** Current screen (top of stack) */
  current: Screen;
  /** True when stack has only one screen (root screen) */
  isRoot: boolean;
}

/**
 * Navigation actions interface
 */
export interface NavigationActions {
  /** Push a new screen onto the stack */
  push: (screen: Screen) => void;
  /** Pop the last screen from stack (no-op if single element) */
  pop: () => void;
  /** Reset stack to initial screen */
  reset: () => void;
}

/**
 * Hook for managing screen navigation stack
 *
 * Per D-02: Layer-level navigation with stack management
 * Per D-09: Escape behavior — pop or exit based on isRoot
 *
 * @param initialScreen - Initial screen (default: 'list')
 * @returns Navigation state and actions
 */
export function useNavigation(
  initialScreen: Screen = 'list'
): NavigationState & NavigationActions {
  const [stack, setStack] = useState<Screen[]>([initialScreen]);

  /**
   * Push a new screen onto the stack
   */
  const push = (screen: Screen) => {
    setStack(prev => [...prev, screen]);
  };

  /**
   * Pop the last screen from stack
   * No-op if stack has single element (preserves root screen)
   */
  const pop = () => {
    setStack(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      // Return unchanged stack if single element
      return prev;
    });
  };

  /**
   * Reset stack to initial screen
   */
  const reset = () => {
    setStack([initialScreen]);
  };

  return {
    stack,
    current: stack[stack.length - 1],
    isRoot: stack.length === 1,
    push,
    pop,
    reset,
  };
}