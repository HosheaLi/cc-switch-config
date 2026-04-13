/**
 * ServiceError Tests
 *
 * Tests for custom error class used across services layer.
 * Per D-02: Services throw Error, caller handles.
 */

import { describe, it, expect } from 'vitest';
import { ServiceError } from './types.js';

describe('ServiceError', () => {
  describe('constructor', () => {
    it('should extend Error', () => {
      const error = new ServiceError('Test error', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
    });

    it('should have code property', () => {
      const error = new ServiceError('Test error', 'TEST_CODE');

      expect(error.code).toBe('TEST_CODE');
    });

    it('should accept message and code as parameters', () => {
      const error = new ServiceError('Configuration failed', 'CONFIG_ERROR');

      expect(error.message).toBe('Configuration failed');
      expect(error.code).toBe('CONFIG_ERROR');
    });

    it('should have name set to ServiceError', () => {
      const error = new ServiceError('Test error', 'TEST_CODE');

      expect(error.name).toBe('ServiceError');
    });
  });

  describe('instanceof checks', () => {
    it('should be instanceof Error', () => {
      const error = new ServiceError('Test error', 'TEST_CODE');

      expect(error instanceof Error).toBe(true);
    });

    it('should be catchable as Error', () => {
      const throwError = () => {
        throw new ServiceError('Something went wrong', 'INTERNAL_ERROR');
      };

      try {
        throwError();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('Something went wrong');
      }
    });
  });

  describe('context property', () => {
    it('should optionally accept context for additional error data', () => {
      const context = { projectId: 'proj-123', attempted: 'config-read' };
      const error = new ServiceError('Failed to load config', 'CONFIG_LOAD_ERROR', context);

      expect(error.context).toEqual(context);
    });

    it('should have undefined context when not provided', () => {
      const error = new ServiceError('Test error', 'TEST_CODE');

      expect(error.context).toBeUndefined();
    });
  });
});