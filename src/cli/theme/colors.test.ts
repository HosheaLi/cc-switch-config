import { describe, it, expect } from 'vitest';
import { colors, OPENCODE_PALETTE, createColors } from './colors.js';
import type { ColorSupport } from './detection.js';

describe('colors module', () => {
  describe('OPENCODE_PALETTE', () => {
    it('has correct ANSI codes for OpenCode warm palette (per D-02)', () => {
      expect(OPENCODE_PALETTE.darkBg).toBe('\x1b[48;2;32;29;29m');
      expect(OPENCODE_PALETTE.lightFg).toBe('\x1b[38;2;253;252;252m');
      expect(OPENCODE_PALETTE.muted).toBe('\x1b[38;2;154;152;152m');
      expect(OPENCODE_PALETTE.reset).toBe('\x1b[0m');
    });
  });

  describe('colors object', () => {
    it('has all semantic colors (per D-03)', () => {
      expect(colors.accent).toBeDefined();
      expect(colors.danger).toBeDefined();
      expect(colors.success).toBeDefined();
      expect(colors.warning).toBeDefined();
    });

    it('has OpenCode palette colors', () => {
      expect(colors.background).toBeDefined();
      expect(colors.foreground).toBeDefined();
      expect(colors.muted).toBeDefined();
    });

    it('has modifiers', () => {
      expect(colors.bold).toBeDefined();
      expect(colors.dim).toBeDefined();
      expect(colors.italic).toBeDefined();
    });

    it('semantic colors are functions that return strings', () => {
      expect(typeof colors.accent).toBe('function');
      expect(colors.accent('test')).toContain('test');
    });
  });

  describe('NO_COLOR handling', () => {
    it('returns plain strings when colorSupport.enabled=false', () => {
      const noColorSupport: ColorSupport = { enabled: false, truecolor: false, reason: 'test' };
      const noColorTheme = createColors(noColorSupport);

      expect(noColorTheme.accent('test')).toBe('test');
      expect(noColorTheme.danger('error')).toBe('error');
      expect(noColorTheme.muted('muted')).toBe('muted');
    });
  });

  describe('truecolor handling', () => {
    it('uses truecolor codes when truecolor=true', () => {
      const truecolorSupport: ColorSupport = { enabled: true, truecolor: true, reason: 'test' };
      const truecolorTheme = createColors(truecolorSupport);

      // OpenCode muted 应包含 truecolor ANSI 码
      const result = truecolorTheme.muted('text');
      expect(result).toContain('\x1b[38;2;154;152;152m');
    });

    it('falls back to gray when truecolor=false', () => {
      const basicSupport: ColorSupport = { enabled: true, truecolor: false, reason: 'test' };
      const basicTheme = createColors(basicSupport);

      // 无 truecolor 时仍能工作，只是没有 truecolor 码
      const result = basicTheme.muted('text');
      expect(result).toContain('text');
    });
  });
});
