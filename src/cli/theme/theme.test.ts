import { describe, it, expect } from 'vitest';
import { message, hint, error, success, warning, separator } from './formatters.js';
import { colors } from './colors.js';
import { colorSupport } from './detection.js';

describe('formatters', () => {
  it('message() uses accent color (blue)', () => {
    const result = message('Test message');
    expect(result).toContain('Test message');
    if (colorSupport.enabled) {
      expect(result).toContain('\x1b'); // Has ANSI code
    }
  });

  it('hint() uses muted color (gray)', () => {
    const result = hint('Test hint');
    expect(result).toContain('Test hint');
  });

  it('error() uses danger color with ✗ symbol', () => {
    const result = error('Test error');
    expect(result).toContain('✗');
    expect(result).toContain('Test error');
  });

  it('success() uses success color with ✓ symbol', () => {
    const result = success('Test success');
    expect(result).toContain('✓');
    expect(result).toContain('Test success');
  });

  it('warning() uses warning color with ⚠ symbol', () => {
    const result = warning('Test warning');
    expect(result).toContain('⚠');
    expect(result).toContain('Test warning');
  });

  it('separator() returns horizontal line', () => {
    const result = separator(40);
    expect(result.length).toBe(40);
    expect(result).toMatch(/[─-]/); // Unicode or ASCII
  });

  it('separator() uses default width of 40', () => {
    const result = separator();
    expect(result.length).toBe(40);
  });
});

describe('NO_COLOR handling', () => {
  it('formatters return plain strings when colors disabled', () => {
    if (!colorSupport.enabled) {
      expect(error('test')).toBe('✗ test');
      expect(success('test')).toBe('✓ test');
      expect(warning('test')).toBe('⚠ test');
      expect(message('test')).toBe('test');
      expect(hint('test')).toBe('test');
    } else {
      // Colors enabled, should have ANSI codes
      expect(error('test')).toContain('\x1b');
    }
  });
});
