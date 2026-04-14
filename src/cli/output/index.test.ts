/**
 * CLI Output Barrel Export Tests
 *
 * Per D-08: Clean import path for CLI output utilities.
 * Tests verify barrel export aggregates all output modules.
 */
import { describe, it, expect } from 'vitest';

describe('CLI output barrel export', () => {
  it('exports ExitCodes', async () => {
    const module = await import('./index.js');
    expect(module.ExitCodes).toBeDefined();
    expect(module.ExitCodes.SUCCESS).toBe(0);
  });

  it('exports handleCLIError', async () => {
    const module = await import('./index.js');
    expect(module.handleCLIError).toBeDefined();
    expect(typeof module.handleCLIError).toBe('function');
  });

  it('exports formatProjectTable', async () => {
    const module = await import('./index.js');
    expect(module.formatProjectTable).toBeDefined();
    expect(typeof module.formatProjectTable).toBe('function');
  });

  it('exports truncatePath', async () => {
    const module = await import('./index.js');
    expect(module.truncatePath).toBeDefined();
    expect(typeof module.truncatePath).toBe('function');
  });
});