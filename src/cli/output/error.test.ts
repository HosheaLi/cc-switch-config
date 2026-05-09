import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceError } from '../../lib/services/types.js';
import { ExitCodes, handleCLIError } from './error.js';

describe('ExitCodes', () => {
  it('SUCCESS equals 0', () => {
    expect(ExitCodes.SUCCESS).toBe(0);
  });

  it('NOT_FOUND equals 3', () => {
    expect(ExitCodes.NOT_FOUND).toBe(3);
  });

  it('CONFIG_ERROR equals 4', () => {
    expect(ExitCodes.CONFIG_ERROR).toBe(4);
  });
});

describe('handleCLIError', () => {
  let mockError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockError.mockRestore();
  });

  it('handles ServiceError with mapped exit code', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    const error = new ServiceError('Config not found', 'CONFIG_NOT_FOUND');    try {
      handleCLIError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe(`process.exit:${ExitCodes.NOT_FOUND}`);
    }

    expect(mockError).toHaveBeenCalled();
    mockExit.mockRestore();
  });

  it('handles generic Error with GENERAL_ERROR code', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    const error = new Error('Something went wrong');
    try {
      handleCLIError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe(`process.exit:${ExitCodes.GENERAL_ERROR}`);
    }

    expect(mockError).toHaveBeenCalled();
    mockExit.mockRestore();
  });

  it('handles unknown error type', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    try {
      handleCLIError('string error');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe(`process.exit:${ExitCodes.GENERAL_ERROR}`);
    }

    expect(mockError).toHaveBeenCalled();
    mockExit.mockRestore();
  });

  it('allows override exit code', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    const error = new ServiceError('Test error', 'CONFIG_NOT_FOUND');
    try {
      handleCLIError(error, ExitCodes.MISUSE);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe(`process.exit:${ExitCodes.MISUSE}`);
    }

    mockExit.mockRestore();
  });
});