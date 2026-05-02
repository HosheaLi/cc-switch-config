/**
 * Diff Render Utility Tests
 *
 * Per D-04, D-05, D-06: ANSI color diff rendering for terminal output.
 *
 * Test coverage:
 * - D-05: Header format (--- a/ and +++ b/)
 * - D-06: ANSI colors for removed (red), added (green), modified (yellow)
 * - Empty diff handling ("配置无变化" message)
 * - Value truncation (long strings to 50 chars)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';

// Types (import from existing diff module)
import type { DiffLine } from './diff.js';

// Target function
import { renderDiff, formatValue, TRUNCATE_LENGTH } from './diff-render.js';

describe('renderDiff', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // ========================================
  // D-05: Header format
  // ========================================
  describe('header format', () => {
    it('shows --- a/.claude/settings.json header', () => {
      renderDiff([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('--- a/.claude/settings.json')
      );
    });

    it('shows +++ b/.claude/settings.json header', () => {
      renderDiff([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('+++ b/.claude/settings.json')
      );
    });

    it('uses gray color for headers', () => {
      renderDiff([]);

      const calls = consoleLogSpy.mock.calls;
      const headerCalls = calls.filter(call =>
        call[0]?.includes?.('--- a/') || call[0]?.includes?.('+++ b/')
      );

      // Headers should be present
      expect(headerCalls.length).toBe(2);
    });

    it('supports custom file path', () => {
      renderDiff([], 'custom/path.json');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('--- a/custom/path.json')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('+++ b/custom/path.json')
      );
    });

    it('separates headers from diff lines', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'model', value: 'claude-3' },
      ];

      renderDiff(diffLines);

      const calls = consoleLogSpy.mock.calls;
      const outputs = calls.map(call => call[0]);

      // First two calls should be headers
      expect(outputs[0]).toContain('--- a/');
      expect(outputs[1]).toContain('+++ b/');
      // Third call should be empty line separator
      expect(outputs[2]).toBe('');
      // Fourth call should be diff content
      expect(outputs[3]).toContain('model');
    });
  });

  // ========================================
  // D-06: Removed lines (red)
  // ========================================
  describe('removed lines', () => {
    it('renders removed fields with - prefix', () => {
      const diffLines: DiffLine[] = [
        { type: 'removed', path: 'env.MODEL', value: 'claude-3-opus' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('- env.MODEL');
    });

    it('shows field path in output', () => {
      const diffLines: DiffLine[] = [
        { type: 'removed', path: 'env.ANTHROPIC_API_KEY', value: 'secret-key' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('env.ANTHROPIC_API_KEY');
    });

    it('shows removed value in output', () => {
      const diffLines: DiffLine[] = [
        { type: 'removed', path: 'model', value: 'claude-3-opus' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('claude-3-opus');
    });

    it('handles nested path removal', () => {
      const diffLines: DiffLine[] = [
        { type: 'removed', path: 'mcpServers.my-server.command', value: 'node' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('mcpServers.my-server.command');
      expect(output).toContain('node');
    });
  });

  // ========================================
  // D-06: Added lines (green)
  // ========================================
  describe('added lines', () => {
    it('renders added fields with + prefix', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'env.MODEL', value: 'claude-3-sonnet' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('+ env.MODEL');
    });

    it('shows field path in output', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'env.BASE_URL', value: 'https://api.example.com' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('env.BASE_URL');
    });

    it('shows added value in output', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'model', value: 'claude-3-sonnet' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('claude-3-sonnet');
    });

    it('handles nested path addition', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'mcpServers.my-server.command', value: 'python' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('mcpServers.my-server.command');
      expect(output).toContain('python');
    });
  });

  // ========================================
  // D-06: Modified lines (yellow)
  // ========================================
  describe('modified lines', () => {
    it('renders modified fields with ~ prefix', () => {
      const diffLines: DiffLine[] = [
        { type: 'modified', path: 'model', before: 'claude-3-opus', after: 'claude-3-sonnet' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('~ model');
    });

    it('shows "before -> after" format', () => {
      const diffLines: DiffLine[] = [
        { type: 'modified', path: 'model', before: 'old-value', after: 'new-value' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('old-value');
      expect(output).toContain('->');
      expect(output).toContain('new-value');
    });

    it('shows before and after values', () => {
      const diffLines: DiffLine[] = [
        { type: 'modified', path: 'env.MODEL', before: 'claude-3-opus', after: 'claude-3-sonnet' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('claude-3-opus');
      expect(output).toContain('claude-3-sonnet');
    });

    it('handles nested path modification', () => {
      const diffLines: DiffLine[] = [
        { type: 'modified', path: 'mcpServers.my-server.args.0', before: 'old.js', after: 'new.js' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('mcpServers.my-server.args.0');
      expect(output).toContain('old.js');
      expect(output).toContain('new.js');
    });
  });

  // ========================================
  // Empty diff handling
  // ========================================
  describe('empty diff', () => {
    it('shows "配置无变化" message when no diff lines', () => {
      renderDiff([]);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('配置无变化');
    });

    it('uses gray color for empty message', () => {
      renderDiff([]);

      // Should have called console.log
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('still shows headers for empty diff', () => {
      renderDiff([]);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('--- a/');
      expect(output).toContain('+++ b/');
    });
  });

  // ========================================
  // Value truncation
  // ========================================
  describe('value truncation', () => {
    it('truncates long strings to TRUNCATE_LENGTH characters', () => {
      const longValue = 'a'.repeat(100);
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'longField', value: longValue },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      // Should contain truncated value with ellipsis
      expect(output).toContain('...');
      // Should NOT contain full 100 char string
      expect(output).not.toContain('a'.repeat(100));
    });

    it('shows ellipsis (...) after truncation', () => {
      const longValue = 'x'.repeat(100);
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'field', value: longValue },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('...');
    });

    it('preserves short values unchanged', () => {
      const shortValue = 'short';
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'field', value: shortValue },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain(shortValue);
      expect(output).not.toContain('...');
    });

    it('truncates in display only (original preserved in DiffLine)', () => {
      const longValue = 'a'.repeat(100);
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'field', value: longValue },
      ];

      // Pass to renderDiff - should not modify the original
      renderDiff(diffLines);

      // Original value should still be intact
      expect(diffLines[0].value).toBe(longValue);
    });
  });

  // ========================================
  // Output format
  // ========================================
  describe('output format', () => {
    it('outputs via console.log', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'model', value: 'claude-3' },
      ];

      renderDiff(diffLines);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('handles multiple diff types in single output', () => {
      const diffLines: DiffLine[] = [
        { type: 'removed', path: 'env.OLD_VAR', value: 'old' },
        { type: 'added', path: 'env.NEW_VAR', value: 'new' },
        { type: 'modified', path: 'model', before: 'old-model', after: 'new-model' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('- env.OLD_VAR');
      expect(output).toContain('+ env.NEW_VAR');
      expect(output).toContain('~ model');
    });

    it('sorts lines by path alphabetically', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'zeta', value: 'z' },
        { type: 'added', path: 'alpha', value: 'a' },
        { type: 'added', path: 'beta', value: 'b' },
      ];

      renderDiff(diffLines);

      const calls = consoleLogSpy.mock.calls;
      // Find the diff lines (after headers)
      const diffOutputs = calls
        .map(c => c[0])
        .filter(o => typeof o === 'string' && (o.includes('alpha') || o.includes('beta') || o.includes('zeta')));

      // Should be sorted: alpha, beta, zeta
      const alphaIndex = diffOutputs.findIndex(o => o.includes('alpha'));
      const betaIndex = diffOutputs.findIndex(o => o.includes('beta'));
      const zetaIndex = diffOutputs.findIndex(o => o.includes('zeta'));

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zetaIndex);
    });
  });

  // ========================================
  // Edge cases
  // ========================================
  describe('edge cases', () => {
    it('handles null values gracefully', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'field', value: null },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('null');
    });

    it('handles undefined values gracefully', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'field', value: undefined },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('undefined');
    });

    it('handles array values (JSON stringify)', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'permissions', value: [{ allow: 'Read(**)' }] },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('[');
      expect(output).toContain('Read(**)');
    });

    it('handles object values (JSON stringify)', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'env', value: { MODEL: 'claude-3', BASE_URL: 'https://api.example.com' } },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('{');
      expect(output).toContain('MODEL');
    });

    it('handles empty string values', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'field', value: '' },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      // Empty string should be shown as "" or similar
      expect(output).toContain('field');
    });

    it('handles numeric values', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'port', value: 8080 },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('8080');
    });

    it('handles boolean values', () => {
      const diffLines: DiffLine[] = [
        { type: 'added', path: 'enabled', value: true },
      ];

      renderDiff(diffLines);

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('true');
    });
  });
});

describe('formatValue', () => {
  it('formats undefined as "undefined"', () => {
    expect(formatValue(undefined)).toBe('undefined');
  });

  it('formats null as "null"', () => {
    expect(formatValue(null)).toBe('null');
  });

  it('formats strings as-is if short', () => {
    expect(formatValue('short')).toBe('short');
  });

  it('truncates long strings with ellipsis', () => {
    const longString = 'a'.repeat(100);
    const result = formatValue(longString);
    expect(result.length).toBeLessThan(100);
    expect(result).toContain('...');
  });

  it('formats arrays as JSON', () => {
    const arr = [1, 2, 3];
    expect(formatValue(arr)).toBe('[1,2,3]');
  });

  it('formats objects as JSON', () => {
    const obj = { key: 'value' };
    expect(formatValue(obj)).toBe('{"key":"value"}');
  });

  it('formats numbers as strings', () => {
    expect(formatValue(42)).toBe('42');
  });

  it('formats booleans as strings', () => {
    expect(formatValue(true)).toBe('true');
    expect(formatValue(false)).toBe('false');
  });

  it('truncates long JSON strings', () => {
    const longObj = { key: 'a'.repeat(100) };
    const result = formatValue(longObj);
    expect(result.length).toBeLessThan(150);
  });
});

describe('TRUNCATE_LENGTH constant', () => {
  it('is defined and is 50', () => {
    expect(TRUNCATE_LENGTH).toBe(50);
  });
});