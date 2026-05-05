import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBorders, BORDERS } from './borders.js';

describe('BORDERS constant', () => {
  it('has Unicode box-drawing characters', () => {
    expect(BORDERS.unicode.horizontal).toBe('─');
    expect(BORDERS.unicode.vertical).toBe('│');
    expect(BORDERS.unicode.topLeft).toBe('┌');
    expect(BORDERS.unicode.topRight).toBe('┐');
    expect(BORDERS.unicode.bottomLeft).toBe('└');
    expect(BORDERS.unicode.bottomRight).toBe('┘');
    expect(BORDERS.unicode.cross).toBe('┼');
  });

  it('has ASCII fallback characters (per D-11)', () => {
    expect(BORDERS.ascii.horizontal).toBe('-');
    expect(BORDERS.ascii.vertical).toBe('|');
    expect(BORDERS.ascii.topLeft).toBe('+');
    expect(BORDERS.ascii.topRight).toBe('+');
    expect(BORDERS.ascii.bottomLeft).toBe('+');
    expect(BORDERS.ascii.bottomRight).toBe('+');
    expect(BORDERS.ascii.cross).toBe('+');
  });

  it('all border characters are single characters', () => {
    for (const char of Object.values(BORDERS.unicode)) {
      expect(char.length).toBe(1);
    }
    for (const char of Object.values(BORDERS.ascii)) {
      expect(char.length).toBe(1);
    }
  });
});

describe('getBorders function', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.stubGlobal('process', { env: {}, platform: originalPlatform });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns Unicode borders for Windows Terminal (WT_SESSION)', () => {
    process.env = { WT_SESSION: 'test' };
    const borders = getBorders();
    expect(borders.horizontal).toBe('─');
  });

  it('returns Unicode borders for COLORTERM=truecolor', () => {
    process.env = { COLORTERM: 'truecolor' };
    const borders = getBorders();
    expect(borders.horizontal).toBe('─');
  });

  it('returns Unicode borders for iTerm2', () => {
    process.env = { TERM_PROGRAM: 'iTerm.app' };
    const borders = getBorders();
    expect(borders.horizontal).toBe('─');
  });

  it('returns ASCII borders for Windows CMD (per D-11)', () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    process.env = {};
    const borders = getBorders();
    expect(borders.horizontal).toBe('-');
    expect(borders.topLeft).toBe('+');
  });

  it('returns Unicode borders for macOS (default)', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    process.env = {};
    const borders = getBorders();
    expect(borders.horizontal).toBe('─');
  });
});
