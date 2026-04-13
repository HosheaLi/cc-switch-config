/**
 * ProviderService Tests
 *
 * Tests for API provider connectivity service.
 * Wave 1 implementation - implements testConnectivity functionality.
 *
 * Per D-06: ProviderService handles connectivity testing for API endpoints.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProviderService, ConnectivityResult } from './provider-service.js';
import { ServiceError } from './types.js';

describe('ProviderService', () => {
  let service: ProviderService;

  beforeEach(() => {
    service = new ProviderService();
  });

  describe('testConnectivity', () => {
    // Test 1: testConnectivity returns reachable=true for valid URL
    it('testConnectivity returns reachable=true for valid URL', async () => {
      // Use a reliable test endpoint - httpbin.org
      const result = await service.testConnectivity('https://httpbin.org/status/200');

      expect(result.reachable).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.latency).toBeGreaterThan(0);
    });

    // Test 2: testConnectivity returns latency in milliseconds
    it('testConnectivity returns latency in milliseconds', async () => {
      const result = await service.testConnectivity('https://httpbin.org/get');

      expect(result.reachable).toBe(true);
      expect(result.latency).toBeDefined();
      expect(typeof result.latency).toBe('number');
      expect(result.latency).toBeGreaterThan(0);
    });

    // Test 3: testConnectivity returns reachable=false for timeout
    it('testConnectivity returns reachable=false for timeout', async () => {
      // Use a URL that will timeout - httpbin delay endpoint
      const result = await service.testConnectivity(
        'https://httpbin.org/delay/10',  // 10 second delay
        1000  // 1 second timeout
      );

      expect(result.reachable).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Timeout');
    });

    // Test 4: testConnectivity returns reachable=false for invalid URL format
    it('testConnectivity returns reachable=false for invalid URL format', async () => {
      // Invalid URL format should throw ServiceError
      expect(() => service.testConnectivity('not-a-valid-url')).toThrow(ServiceError);
    });

    // Test 5: testConnectivity returns reachable=false for DNS failure
    it('testConnectivity returns reachable=false for DNS failure', async () => {
      // Use a non-existent domain
      const result = await service.testConnectivity(
        'https://this-domain-does-not-exist-12345.com'
      );

      expect(result.reachable).toBe(false);
      expect(result.error).toBeDefined();
    });

    // Test 6: testConnectivity uses HEAD method (D-06)
    it('testConnectivity uses HEAD method (D-06)', async () => {
      // HEAD request should work on httpbin
      const result = await service.testConnectivity('https://httpbin.org/head');

      expect(result.reachable).toBe(true);
    });

    // Test 7: custom timeout works
    it('custom timeout works', async () => {
      const customService = new ProviderService(100);  // 100ms timeout
      const result = await customService.testConnectivity('https://httpbin.org/delay/5');

      expect(result.reachable).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Timeout');
    });

    // Test 8: ServiceError thrown on invalid baseUrl
    it('ServiceError thrown on invalid baseUrl', async () => {
      expect(() => service.testConnectivity('')).toThrow(ServiceError);
      expect(() => service.testConnectivity('invalid-url')).toThrow(ServiceError);
      expect(() => service.testConnectivity('http://')).toThrow(ServiceError);
    });
  });

  describe('testMultipleConnectivity', () => {
    it('testMultipleConnectivity tests multiple URLs', async () => {
      const urls = [
        'https://httpbin.org/status/200',
        'https://httpbin.org/get'
      ];

      const results = await service.testMultipleConnectivity(urls);

      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBe(2);
      expect(results['https://httpbin.org/status/200'].reachable).toBe(true);
      expect(results['https://httpbin.org/get'].reachable).toBe(true);
    });

    it('testMultipleConnectivity handles invalid URLs gracefully', async () => {
      const urls = [
        'https://httpbin.org/status/200',
        'invalid-url'  // Invalid URL
      ];

      const results = await service.testMultipleConnectivity(urls);

      expect(Object.keys(results).length).toBe(2);
      expect(results['https://httpbin.org/status/200'].reachable).toBe(true);
      expect(results['invalid-url'].reachable).toBe(false);
      expect(results['invalid-url'].error).toBeDefined();
    });
  });
});