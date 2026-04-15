/**
 * Diff Utilities Tests
 *
 * Tests for generateUnifiedDiff and filterChangedFields functions.
 * Per D-01: Unified diff format for config changes.
 * Per D-02: Only show changed fields, not entire config.
 */

import { describe, it, expect } from 'vitest';
import type { ClaudeSettings } from '../../lib/types/config.js';
import { generateUnifiedDiff, filterChangedFields, type DiffLine } from './diff.js';

describe('generateUnifiedDiff', () => {
  it('returns DiffLine[] with "removed" type for deleted fields', () => {
    const before: ClaudeSettings = {
      env: { MODEL: 'claude-3-opus' },
      model: 'claude-3-opus',
    };
    const after: ClaudeSettings = {
      model: 'claude-3-opus',
    };

    const result = generateUnifiedDiff(before, after);

    expect(result.length).toBeGreaterThan(0);
    const removedLine = result.find((line) => line.type === 'removed');
    expect(removedLine).toBeDefined();
    expect(removedLine?.path).toBe('env.MODEL');
  });

  it('returns DiffLine[] with "added" type for new fields', () => {
    const before: ClaudeSettings = {
      model: 'claude-3-opus',
    };
    const after: ClaudeSettings = {
      env: { MODEL: 'claude-3-sonnet' },
      model: 'claude-3-opus',
    };

    const result = generateUnifiedDiff(before, after);

    expect(result.length).toBeGreaterThan(0);
    const addedLine = result.find((line) => line.type === 'added');
    expect(addedLine).toBeDefined();
    expect(addedLine?.path).toBe('env.MODEL');
  });

  it('returns DiffLine[] with "modified" type for changed values', () => {
    const before: ClaudeSettings = {
      model: 'claude-3-opus',
    };
    const after: ClaudeSettings = {
      model: 'claude-3-sonnet',
    };

    const result = generateUnifiedDiff(before, after);

    expect(result.length).toBeGreaterThan(0);
    // Modified field shows as one entry with before/after
    const modifiedLine = result.find((line) => line.type === 'modified');
    expect(modifiedLine).toBeDefined();
    expect(modifiedLine?.path).toBe('model');
    expect(modifiedLine?.before).toBe('claude-3-opus');
    expect(modifiedLine?.after).toBe('claude-3-sonnet');
  });

  it('returns empty array when before and after are identical', () => {
    const config: ClaudeSettings = {
      env: { MODEL: 'claude-3-opus' },
      model: 'claude-3-opus',
    };

    const result = generateUnifiedDiff(config, config);

    expect(result).toEqual([]);
  });

  it('uses dot notation for nested field paths', () => {
    const before: ClaudeSettings = {
      env: { MODEL: 'claude-3-opus', BASE_URL: 'https://api.anthropic.com' },
    };
    const after: ClaudeSettings = {
      env: { MODEL: 'claude-3-sonnet', BASE_URL: 'https://api.anthropic.com' },
    };

    const result = generateUnifiedDiff(before, after);

    const modelChange = result.find((line) => line.path.includes('MODEL'));
    expect(modelChange).toBeDefined();
    expect(modelChange?.path).toBe('env.MODEL');
  });

  it('detects array changes (permissions)', () => {
    const before: ClaudeSettings = {
      permissions: [{ allow: 'Read(**)' }],
    };
    const after: ClaudeSettings = {
      permissions: [{ allow: 'Read(**)' }, { deny: 'Write(**)' }],
    };

    const result = generateUnifiedDiff(before, after);

    expect(result.length).toBeGreaterThan(0);
    // Arrays are treated as atomic values, so permissions is modified
    const permChange = result.find((line) => line.path === 'permissions');
    expect(permChange).toBeDefined();
  });

  it('detects nested object changes (mcpServers)', () => {
    const before: ClaudeSettings = {
      mcpServers: {
        'my-server': {
          command: 'node',
          args: ['server.js'],
        },
      },
    };
    const after: ClaudeSettings = {
      mcpServers: {
        'my-server': {
          command: 'python',
          args: ['server.py'],
        },
      },
    };

    const result = generateUnifiedDiff(before, after);

    expect(result.length).toBeGreaterThan(0);
    // Should detect changes in nested fields
    const serverChanges = result.filter((line) => line.path.startsWith('mcpServers'));
    expect(serverChanges.length).toBeGreaterThan(0);
  });
});

describe('filterChangedFields', () => {
  it('returns only paths that differ between before/after', () => {
    const before: ClaudeSettings = {
      env: { MODEL: 'claude-3-opus' },
      model: 'claude-3-opus',
    };
    const after: ClaudeSettings = {
      env: { MODEL: 'claude-3-sonnet' },
      model: 'claude-3-opus',
    };

    const result = filterChangedFields(before, after);

    expect(result).toContain('env.MODEL');
    expect(result).not.toContain('model');
  });

  it('returns empty array when no differences', () => {
    const config: ClaudeSettings = {
      env: { MODEL: 'claude-3-opus' },
      model: 'claude-3-opus',
    };

    const result = filterChangedFields(config, config);

    expect(result).toEqual([]);
  });

  it('detects multiple field changes', () => {
    const before: ClaudeSettings = {
      env: { MODEL: 'claude-3-opus' },
      model: 'claude-3-opus',
    };
    const after: ClaudeSettings = {
      env: { MODEL: 'claude-3-sonnet', BASE_URL: 'https://api.example.com' },
      model: 'claude-3-sonnet',
    };

    const result = filterChangedFields(before, after);

    expect(result).toContain('env.MODEL');
    expect(result).toContain('env.BASE_URL');
    expect(result).toContain('model');
  });

  it('handles undefined fields correctly', () => {
    const before: ClaudeSettings = {
      model: 'claude-3-opus',
    };
    const after: ClaudeSettings = {};

    const result = filterChangedFields(before, after);

    expect(result).toContain('model');
  });

  it('handles nested objects', () => {
    const before: ClaudeSettings = {
      mcpServers: {
        server1: { command: 'node', args: ['a.js'] },
      },
    };
    const after: ClaudeSettings = {
      mcpServers: {
        server1: { command: 'node', args: ['b.js'] },
      },
    };

    const result = filterChangedFields(before, after);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((path) => path.startsWith('mcpServers'))).toBe(true);
  });
});

describe('DiffLine type', () => {
  it('accepts valid DiffLine structures', () => {
    const removed: DiffLine = {
      type: 'removed',
      path: 'env.MODEL',
      value: 'claude-3-opus',
    };
    expect(removed.type).toBe('removed');

    const added: DiffLine = {
      type: 'added',
      path: 'env.BASE_URL',
      value: 'https://api.example.com',
    };
    expect(added.type).toBe('added');

    const modified: DiffLine = {
      type: 'modified',
      path: 'model',
      before: 'claude-3-opus',
      after: 'claude-3-sonnet',
    };
    expect(modified.type).toBe('modified');
  });
});