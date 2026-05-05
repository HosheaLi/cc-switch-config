/**
 * CLI Error Handling Module
 *
 * Per U1: Clear errors with helpful messages.
 * Per D-03: stderr output + exit code + colored messages via theme module.
 *
 * Provides:
 * - ExitCodes: Standard exit code constants
 * - handleCLIError: Unified error output with theme coloring
 * - mapErrorToExitCode: ServiceError.code -> exit code mapping
 */

import { colors } from '../theme/index.js';
import { ServiceError } from '../../lib/services/types.js';

/**
 * Standard CLI exit codes.
 * Follows Unix conventions where 0 = success, non-zero = error.
 */
export const ExitCodes = {
  /** Successful completion */
  SUCCESS: 0,
  /** General/unspecified error */
  GENERAL_ERROR: 1,
  /** Misuse of command (invalid arguments) */
  MISUSE: 2,
  /** Resource not found (template/project/config) */
  NOT_FOUND: 3,
  /** Configuration validation error */
  CONFIG_ERROR: 4,
} as const;

/**
 * Handle CLI error with colored output and exit code.
 * Per D-03: Outputs to stderr, uses chalk for colors, exits with appropriate code.
 *
 * @param error - Error to handle (ServiceError or generic Error)
 * @param code - Optional override exit code (default: derived from error)
 */
export function handleCLIError(error: unknown, code?: number): void {
  if (error instanceof ServiceError) {
    // ServiceError: display code + message, map to exit code
    console.error(colors.danger(`[${error.code}] ${error.message}`));
    const exitCode = code ?? mapErrorToExitCode(error.code);
    process.exit(exitCode);
  } else if (error instanceof Error) {
    // Generic Error: display message only
    console.error(colors.danger(`Error: ${error.message}`));
    process.exit(code ?? ExitCodes.GENERAL_ERROR);
  } else {
    // Unknown error type
    console.error(colors.danger('Unknown error occurred'));
    process.exit(ExitCodes.GENERAL_ERROR);
  }
}

/**
 * Map ServiceError.code to CLI exit code.
 *
 * @param code - ServiceError code string
 * @returns Corresponding CLI exit code
 */
function mapErrorToExitCode(code: string): number {
  const codeMap: Record<string, number> = {
    // Template errors
    TEMPLATE_NOT_FOUND: ExitCodes.NOT_FOUND,
    TEMPLATE_CREATE_FAILED: ExitCodes.GENERAL_ERROR,
    TEMPLATE_UPDATE_FAILED: ExitCodes.GENERAL_ERROR,
    TEMPLATE_APPLY_FAILED: ExitCodes.CONFIG_ERROR,

    // Project errors
    PROJECT_NOT_FOUND: ExitCodes.NOT_FOUND,
    PROJECT_REGISTER_FAILED: ExitCodes.GENERAL_ERROR,

    // Config errors
    CONFIG_READ_FAILED: ExitCodes.CONFIG_ERROR,
    CONFIG_WRITE_FAILED: ExitCodes.CONFIG_ERROR,
    VALIDATION_ERROR: ExitCodes.CONFIG_ERROR,
  };

  return codeMap[code] ?? ExitCodes.GENERAL_ERROR;
}