/**
 * API Key Security Utilities
 *
 * Per CFG-04: API key masked in all display contexts.
 * Per SEC-01: CLI args containing apiKey patterns are rejected.
 * Per D-09: validateNoCliApiKey blocks '--api-key' args.
 * Per D-10: maskApiKey reuses existing maskToken function.
 *
 * Key security guarantees:
 * - API keys never appear in shell history (validateNoCliApiKey)
 * - API keys never appear in process listings (validateNoCliApiKey)
 * - API keys masked in logs/previews/diffs (maskApiKey, applyMaskedApiKey)
 */

import { maskToken } from './token-check.js';
import { ServiceError } from '../services/types.js';
import type { ApiConfig, MaskedApiConfig } from '../types/api-config.js';

/**
 * Mask an API key for safe display.
 *
 * Per D-10: Reuses maskToken to show only last 4 characters.
 * Used for display in preview, diff, logs, and error messages.
 *
 * @param apiKey - API key string to mask
 * @returns Masked API key string (e.g., "...xyz" or "****" for short keys)
 *
 * @example
 * maskApiKey('sk-ant-api03-abc123xyz') // returns '...3xyz'
 * maskApiKey('abc') // returns '****'
 */
export function maskApiKey(apiKey: string): string {
  return maskToken(apiKey);
}

/**
 * Apply masked API key to a config object.
 *
 * Creates a MaskedApiConfig with the apiKey field masked.
 * Per CFG-04: Used for display contexts (preview, diff, logs).
 *
 * @param config - Full API configuration with unmasked apiKey
 * @returns Configuration with masked apiKey (other fields preserved)
 *
 * @example
 * const config = { name: 'my-config', apiKey: 'sk-secret123', ... };
 * const masked = applyMaskedApiKey(config);
 * console.log(masked.apiKey); // '...t123' (safe for display)
 */
export function applyMaskedApiKey(config: ApiConfig): MaskedApiConfig {
  return {
    ...config,
    apiKey: maskApiKey(config.apiKey),
  };
}

/**
 * Validate that CLI arguments do not contain API key patterns.
 *
 * Per D-09 and SEC-01: Prevents API key exposure via shell history
 * or process listings. Throws SecurityError if any argument matches
 * known API key patterns.
 *
 * Patterns detected:
 * - '--api-key' (long form)
 * - '--apiKey' (camelCase variant)
 * - '-k' (short form)
 * - 'apiKey=' (assignment form)
 *
 * @param args - Command-line arguments to validate
 * @throws ServiceError with code 'SECURITY_VIOLATION' if API key pattern detected
 *
 * @example
 * // Safe - no API key patterns
 * validateNoCliApiKey(['--config', 'my-config']); // OK
 *
 * // Unsafe - throws SecurityError
 * validateNoCliApiKey(['--api-key', 'secret']); // throws
 */
export function validateNoCliApiKey(args: string[]): void {
  const dangerousPatterns = [
    '--api-key',
    '--apiKey',
    '-k',
  ];

  for (const arg of args) {
    // Check exact matches for flag patterns
    if (dangerousPatterns.includes(arg)) {
      throw new ServiceError(
        'API key cannot be passed via command-line arguments. Use config file or stdin.',
        'SECURITY_VIOLATION'
      );
    }

    // Check for assignment patterns (e.g., 'apiKey=secret', '--api-key=secret')
    if (arg.includes('apiKey=') || arg.includes('api-key=')) {
      throw new ServiceError(
        'API key cannot be passed via command-line arguments. Use config file or stdin.',
        'SECURITY_VIOLATION'
      );
    }

    // Check for -k=short form
    if (arg.startsWith('-k=')) {
      throw new ServiceError(
        'API key cannot be passed via command-line arguments. Use config file or stdin.',
        'SECURITY_VIOLATION'
      );
    }
  }
}