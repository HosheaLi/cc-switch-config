/**
 * CLI Output Utilities - Barrel Export
 *
 * Per D-08: Clean import path for CLI output utilities.
 *
 * Usage:
 * ```typescript
 * import { ExitCodes, handleCLIError, formatProjectTable } from '../output/index.js';
 * ```
 */

// Error handling utilities
export { ExitCodes, handleCLIError } from './error.js';

// Table formatting utilities
export { formatProjectTable, truncatePath } from './table.js';