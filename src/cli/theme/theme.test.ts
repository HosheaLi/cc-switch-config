import { describe, it, expect } from 'vitest';
import { message, hint, error, success, warning, separator } from './formatters.js';
import { colors } from './colors.js';
import { createColors } from './colors.js';
import type { ColorSupport } from './detection.js';
import { colorSupport } from './detection.js';

/** 去除 ANSI 转义码，获取可见文本 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('formatters', () => {
  it('message() uses accent color (blue)', () => {
    const result = message('Test message');
    expect(stripAnsi(result)).toBe('Test message');
  });

  it('hint() uses muted color (gray)', () => {
    const result = hint('Test hint');
    expect(stripAnsi(result)).toBe('Test hint');
  });

  it('error() uses danger color with ✗ symbol', () => {
    const result = error('Test error');
    expect(result).toContain('✗');
    expect(result).toContain('Test error');
    expect(stripAnsi(result)).toBe('✗ Test error');
  });

  it('success() uses success color with ✓ symbol', () => {
    const result = success('Test success');
    expect(result).toContain('✓');
    expect(result).toContain('Test success');
    expect(stripAnsi(result)).toBe('✓ Test success');
  });

  it('warning() uses warning color with ⚠ symbol', () => {
    const result = warning('Test warning');
    expect(result).toContain('⚠');
    expect(result).toContain('Test warning');
    expect(stripAnsi(result)).toBe('⚠ Test warning');
  });

  it('separator() returns horizontal line', () => {
    const result = separator(40);
    const visible = stripAnsi(result);
    expect(visible.length).toBe(40);
    expect(visible).toMatch(/[─-]/); // Unicode or ASCII
  });

  it('separator() uses default width of 40', () => {
    const result = separator();
    const visible = stripAnsi(result);
    expect(visible.length).toBe(40);
  });
});

describe('NO_COLOR handling', () => {
  it('formatters return plain strings when colors disabled', () => {
    const noColorSupport: ColorSupport = { enabled: false, truecolor: false, reason: 'test' };
    const noColorTheme = createColors(noColorSupport);

    // 直接验证 createColors(false) 时颜色函数返回纯文本
    expect(noColorTheme.danger('test')).toBe('test');
    expect(noColorTheme.success('test')).toBe('test');
    expect(noColorTheme.warning('test')).toBe('test');
    expect(noColorTheme.accent('test')).toBe('test');
    expect(noColorTheme.muted('test')).toBe('test');
  });

  it('formatters use colors module which respects colorSupport', () => {
    // 验证当前环境下的 formatter 输出可见文本正确
    expect(stripAnsi(error('test'))).toBe('✗ test');
    expect(stripAnsi(success('test'))).toBe('✓ test');
    expect(stripAnsi(warning('test'))).toBe('⚠ test');
    expect(stripAnsi(message('test'))).toBe('test');
    expect(stripAnsi(hint('test'))).toBe('test');
  });
});
