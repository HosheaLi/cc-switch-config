/**
 * ProviderService
 *
 * Service for testing API provider connectivity.
 * Per D-06: Basic connectivity test via HEAD request.
 *
 * Key features:
 * - testConnectivity: Quick verification via HEAD request
 * - Returns reachable status and latency measurement
 * - Handles timeout via AbortSignal.timeout
 * - Handles network errors gracefully
 */

import { ServiceError } from './types.js';

/**
 * Result of connectivity test.
 */
export interface ConnectivityResult {
  /** Whether the endpoint is reachable */
  reachable: boolean;
  /** Latency in milliseconds (if reachable) */
  latency?: number;
  /** Error message if not reachable */
  error?: string;
}

/**
 * Service for testing API provider connectivity.
 * Per D-06: Uses HEAD request for basic connectivity test.
 *
 * Usage:
 * ```typescript
 * const service = new ProviderService();
 * const result = await service.testConnectivity('https://api.example.com');
 * if (result.reachable) {
 *   console.log(`Latency: ${result.latency}ms`);
 * }
 * ```
 */
export class ProviderService {
  /** Default timeout in milliseconds (5 seconds per D-06) */
  private readonly defaultTimeoutMs: number = 5000;

  /**
   * Create a ProviderService.
   *
   * @param customTimeoutMs - Optional custom default timeout in milliseconds
   */
  constructor(customTimeoutMs?: number) {
    if (customTimeoutMs !== undefined) {
      this.defaultTimeoutMs = customTimeoutMs;
    }
  }

  /**
   * Test connectivity to an API endpoint.
   * Per D-06: Basic connectivity test via HEAD request.
   *
   * @param baseUrl - The base URL to test
   * @param timeoutMs - Optional timeout override in milliseconds
   * @returns ConnectivityResult with reachable status and latency
   * @throws ServiceError if URL format is invalid
   */
  async testConnectivity(baseUrl: string, timeoutMs?: number): Promise<ConnectivityResult> {
    // Validate URL format
    if (!this.isValidUrl(baseUrl)) {
      throw new ServiceError(
        `Invalid URL format: ${baseUrl}`,
        'INVALID_URL'
      );
    }

    const timeout = timeoutMs ?? this.defaultTimeoutMs;
    const start = Date.now();

    try {
      const response = await fetch(baseUrl, {
        method: 'HEAD',  // Per D-06: HEAD request for quick verification
        signal: AbortSignal.timeout(timeout)
      });

      const latency = Date.now() - start;

      // Any response (even 404, 500) means endpoint is reachable
      // Per D-06: Quick verification, no auth needed
      return {
        reachable: true,
        latency
      };
    } catch (error) {
      const latency = Date.now() - start;

      if (error instanceof Error) {
        // TimeoutError from AbortSignal.timeout
        if (error.name === 'TimeoutError') {
          return {
            reachable: false,
            latency: timeout,
            error: `Timeout after ${timeout}ms`
          };
        }

        // Network errors (DNS failure, connection refused, etc.)
        return {
          reachable: false,
          latency,
          error: error.message
        };
      }

      return {
        reachable: false,
        latency,
        error: 'Unknown error'
      };
    }
  }

  /**
   * Test connectivity for multiple URLs.
   * Useful for batch testing providers.
   *
   * @param baseUrls - Array of URLs to test
   * @param timeoutMs - Optional timeout override for all tests
   * @returns Record mapping URL to ConnectivityResult
   */
  async testMultipleConnectivity(
    baseUrls: string[],
    timeoutMs?: number
  ): Promise<Record<string, ConnectivityResult>> {
    const results: Record<string, ConnectivityResult> = {};

    for (const url of baseUrls) {
      try {
        results[url] = await this.testConnectivity(url, timeoutMs);
      } catch (error) {
        results[url] = {
          reachable: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  /**
   * Validate URL format.
   *
   * @param url - URL string to validate
   * @returns true if URL is valid, false otherwise
   */
  private isValidUrl(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}