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
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockError.mockRestore();
  });

  it('handles ServiceError with mapped exit code', () => {
    const error = new ServiceError('Template not found', 'TEMPLATE_NOT_FOUND');
    handleCLIError(error);

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(ExitCodes.NOT_FOUND);
  });

  it('handles generic Error with GENERAL_ERROR code', () => {
    const error = new Error('Something went wrong');
    handleCLIError(error);

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(ExitCodes.GENERAL_ERROR);
  });

  it('handles unknown error type', () => {
    handleCLIError('string error');

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(ExitCodes.GENERAL_ERROR);
  });

  it('allows override exit code', () => {
    const error = new ServiceError('Test error', 'TEMPLATE_NOT_FOUND');
    handleCLIError(error, ExitCodes.MISUSE);

    expect(mockExit).toHaveBeenCalledWith(ExitCodes.MISUSE);
  });
});