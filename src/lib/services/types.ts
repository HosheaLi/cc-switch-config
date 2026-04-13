/**
 * Service Error Types
 *
 * Custom error class for services layer.
 * Per D-02: Services throw Error, caller handles.
 *
 * Key features:
 * - ServiceError extends Error for standard error handling
 * - code property for error categorization
 * - Optional context property for additional error data
 */

/**
 * Custom error class for service layer errors.
 * Provides error categorization via code and optional context data.
 *
 * Usage:
 * ```typescript
 * throw new ServiceError('Configuration failed', 'CONFIG_ERROR');
 * throw new ServiceError('Project not found', 'NOT_FOUND', { projectId: 'proj-123' });
 * ```
 */
export class ServiceError extends Error {
  /**
   * Error code for categorization.
   * Examples: 'CONFIG_ERROR', 'NOT_FOUND', 'VALIDATION_ERROR', 'NETWORK_ERROR'
   */
  public readonly code: string;

  /**
   * Optional context data for debugging.
   * Can include relevant IDs, values, or state that caused the error.
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Create a ServiceError.
   *
   * @param message - Human-readable error message
   * @param code - Error code for categorization
   * @param context - Optional additional error context
   */
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.context = context;
  }
}