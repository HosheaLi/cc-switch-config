/**
 * Validation Utilities
 *
 * Provides validation utilities for Claude Code configuration with comprehensive
 * error collection and user-friendly formatting.
 *
 * Key features:
 * - ValidationError class stores ALL validation issues (per D-03)
 * - validateConfig collects all errors, not just first (per D-05)
 * - formatValidationErrors produces readable multi-line output
 */

import { z } from 'zod';
import { ClaudeSettingsSchema } from './config.js';
import type { ClaudeSettings } from './config.js';

/**
 * Custom error class for validation failures.
 * Stores all validation issues for comprehensive error reporting.
 *
 * Key properties:
 * - name: 'ValidationError' for identification
 * - issues: Array of all Zod validation issues
 * - getMessages(): Returns formatted messages for each issue
 */
export class ValidationError extends Error {
  public readonly issues: z.core.$ZodIssue[];

  constructor(message: string, issues: z.core.$ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  /**
   * Get error messages for each issue with field paths.
   *
   * @returns Array of formatted messages like "env.MODEL: Expected string"
   */
  getMessages(): string[] {
    return this.issues.map(issue => {
      const path = issue.path?.join('.') || 'root';
      return `${path}: ${issue.message}`;
    });
  }
}

/**
 * Validation result type using discriminated union.
 *
 * Provides type-safe result handling:
 * - success: true → result.data is valid ClaudeSettings
 * - success: false → result.error is ValidationError
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

/**
 * Validate config against ClaudeSettingsSchema.
 * Collects ALL validation errors (per D-05), not just the first.
 *
 * @param config - Unknown config object to validate
 * @returns ValidationResult with either valid data or ValidationError
 */
export function validateConfig(config: unknown): ValidationResult<ClaudeSettings> {
  const result = ClaudeSettingsSchema.safeParse(config);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Collect all issues (D-05: collect all errors)
  const issues = result.error.issues;
  const message = formatValidationErrors(issues);
  const error = new ValidationError(message, issues);

  return { success: false, error };
}

/**
 * Format Zod issues into user-friendly multi-line message.
 *
 * Uses visual indicators to distinguish error types:
 * - WARNING SIGN (⚠) for invalid_type errors
 * - Question mark (?) for unrecognized_keys
 * - Cross mark (✖) for other errors
 *
 * @param issues - Array of Zod validation issues
 * @returns Multi-line formatted message
 */
export function formatValidationErrors(issues: z.core.$ZodIssue[]): string {
  const lines: string[] = [];

  for (const issue of issues) {
    const path = issue.path?.join('.') || 'root';
    const symbol = getErrorSymbol(issue.code ?? '');
    lines.push(`${symbol} ${path}: ${issue.message}`);
  }

  return lines.join('\n');
}

/**
 * Get visual symbol for error type.
 *
 * @param code - Zod issue code
 * @returns Unicode symbol for display
 */
function getErrorSymbol(code: string): string {
  switch (code) {
    case 'invalid_type':
      return '\u26A0'; // WARNING SIGN (⚠)
    case 'unrecognized_keys':
      return '?';
    default:
      return '\u2716'; // HEAVY MULTIPLICATION X (✖)
  }
}