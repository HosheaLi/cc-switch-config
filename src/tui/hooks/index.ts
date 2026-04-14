/**
 * Barrel export for TUI hooks
 * Per D-12: screens/components separation
 * Per M4: Barrel export for each module
 */

// Navigation hooks
export { useKeyInput } from './useKeyInput.js';
export { useNavigation } from './useNavigation.js';
export type { Screen } from './useNavigation.js';

// Search hooks
export { useFuzzySearch } from './useFuzzySearch.js';
export type { SearchableItem } from './useFuzzySearch.js';