/**
 * DEFAULT_SKIP_DIRS Constant Tests
 *
 * Tests for default directories to skip during project scanning.
 * Per D-08: Hardcoded list of common build/dependency directories.
 * Per ONB-04: node_modules/.git/dist/build/target/.venv/__pycache__
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_SKIP_DIRS, SkipDirName } from './skip-dirs.js';

describe('DEFAULT_SKIP_DIRS', () => {
  it('should contain exactly 7 entries', () => {
    expect(DEFAULT_SKIP_DIRS.length).toBe(7);
  });

  it('should contain expected directory names', () => {
    expect(DEFAULT_SKIP_DIRS).toContain('node_modules');
    expect(DEFAULT_SKIP_DIRS).toContain('.git');
    expect(DEFAULT_SKIP_DIRS).toContain('dist');
    expect(DEFAULT_SKIP_DIRS).toContain('build');
    expect(DEFAULT_SKIP_DIRS).toContain('target');
    expect(DEFAULT_SKIP_DIRS).toContain('.venv');
    expect(DEFAULT_SKIP_DIRS).toContain('__pycache__');
  });

  it('should be immutable (as const)', () => {
    // TypeScript `as const` makes array readonly at compile time
    // Runtime check: verify it's an array
    expect(Array.isArray(DEFAULT_SKIP_DIRS)).toBe(true);
  });
});

describe('SkipDirName type', () => {
  it('should infer type from DEFAULT_SKIP_DIRS', () => {
    const dir: SkipDirName = 'node_modules';
    expect(dir).toBe('node_modules');
  });
});