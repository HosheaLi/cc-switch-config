import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectColorSupport, colorSupport } from './detection.js';

describe('detectColorSupport', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    // 每个测试用干净的 env，防止宿主环境影响检测结果
    vi.stubGlobal('process', { env: {}, platform: originalPlatform });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('NO_COLOR disables all colors (per D-08, D-09)', () => {
    process.env = { NO_COLOR: '1' };
    const result = detectColorSupport();
    expect(result.enabled).toBe(false);
    expect(result.truecolor).toBe(false);
    expect(result.reason).toBe('NO_COLOR set');
  });

  it('FORCE_COLOR overrides NO_COLOR', () => {
    process.env = { FORCE_COLOR: '1' };
    const result = detectColorSupport();
    expect(result.enabled).toBe(true);
  });

  it('Windows Terminal supports truecolor (per D-10)', () => {
    process.env = { WT_SESSION: 'test' };
    const result = detectColorSupport();
    expect(result.enabled).toBe(true);
    expect(result.truecolor).toBe(true);
    expect(result.reason).toBe('Windows Terminal');
  });

  it('COLORTERM=truecolor indicates truecolor support', () => {
    process.env = { COLORTERM: 'truecolor' };
    const result = detectColorSupport();
    expect(result.truecolor).toBe(true);
  });

  it('iTerm2 supports truecolor', () => {
    process.env = { TERM_PROGRAM: 'iTerm.app' };
    const result = detectColorSupport();
    expect(result.truecolor).toBe(true);
  });

  it('macOS Terminal does not support truecolor', () => {
    process.env = { TERM_PROGRAM: 'Apple_Terminal' };
    const result = detectColorSupport();
    expect(result.truecolor).toBe(false);
  });

  it('Windows CMD has ANSI but no truecolor (per D-11)', () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    process.env = {};
    const result = detectColorSupport();
    expect(result.enabled).toBe(true);
    expect(result.truecolor).toBe(false);
  });
});

describe('colorSupport export', () => {
  it('exports singleton detection result', () => {
    expect(colorSupport).toBeDefined();
    expect(colorSupport.enabled).toBeDefined();
    expect(colorSupport.truecolor).toBeDefined();
  });
});
