/**
 * Barrel export for TUI screens
 * Per D-12: screens/components separation
 * Per M4: Barrel export for each module
 */

// Project list screen (F2, F14, U3, U4)
export { ProjectListScreen } from './ProjectListScreen.js';

// Config editor screen (F3, U4)
export { ConfigEditorScreen } from './ConfigEditorScreen.js';

// Confirmation screen (U5, U4)
export { ConfirmScreen } from './ConfirmScreen.js';

// Scan screen (F10, D-09)
export { ScanScreen } from './ScanScreen.js';
export type { ScanScreenProps } from './ScanScreen.js';

// Import conflict screen (F13, D-07)
export { ImportConflictScreen } from './ImportConflictScreen.js';
export type { ImportConflictScreenProps } from './ImportConflictScreen.js';