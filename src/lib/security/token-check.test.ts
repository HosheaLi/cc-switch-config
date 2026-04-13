/**
 * Token Security Tests
 *
 * Tests for token and git tracking security checks.
 * Ensures API tokens never leak to git repositories.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import {
  isTokenFile,
  maskToken,
  checkGitTracking,
  validateTokenSecurity,
} from './token-check.js';

describe('token-check', () => {
  describe('isTokenFile', () => {
    it('identifies settings.local.json as token file', () => {
      expect(isTokenFile('settings.local.json')).toBe(true);
    });

    it('identifies full path to settings.local.json as token file', () => {
      expect(isTokenFile('/home/user/.claude/settings.local.json')).toBe(true);
    });

    it('returns false for settings.json', () => {
      expect(isTokenFile('settings.json')).toBe(false);
    });

    it('returns false for other config files', () => {
      expect(isTokenFile('config.json')).toBe(false);
      expect(isTokenFile('.env')).toBe(false);
      expect(isTokenFile('other.local.json')).toBe(false);
    });
  });

  describe('maskToken', () => {
    it('shows only last 4 characters for normal tokens', () => {
      expect(maskToken('sk-ant-api03-abc123xyz')).toBe('...3xyz');
    });

    it('handles short tokens (< 4 chars)', () => {
      expect(maskToken('abc')).toBe('****');
      expect(maskToken('ab')).toBe('****');
      expect(maskToken('a')).toBe('****');
    });

    it('handles exactly 4 character tokens', () => {
      expect(maskToken('abcd')).toBe('...abcd');
    });

    it('handles empty token', () => {
      expect(maskToken('')).toBe('****');
    });

    it('masks long API tokens correctly', () => {
      const longToken = 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      expect(maskToken(longToken)).toBe('...xxxx');
      expect(maskToken(longToken).length).toBe(7); // '...' + 4 chars
    });
  });

  describe('checkGitTracking', () => {
    it('returns true if file is in .gitignore', async () => {
      // Create temporary test directory with .gitignore
      const testDir = path.join(process.cwd(), 'test-gitignore-temp');
      await fs.ensureDir(testDir);
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        'settings.local.json\n*.local.json\n'
      );

      const result = await checkGitTracking(testDir, 'settings.local.json');
      expect(result).toBe(true);

      // Cleanup
      await fs.remove(testDir);
    });

    it('returns true if wildcard pattern matches', async () => {
      const testDir = path.join(process.cwd(), 'test-gitignore-wildcard-temp');
      await fs.ensureDir(testDir);
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        '*.local.json\n'
      );

      const result = await checkGitTracking(testDir, 'settings.local.json');
      expect(result).toBe(true);

      await fs.remove(testDir);
    });

    it('returns false if file is not in .gitignore', async () => {
      const testDir = path.join(process.cwd(), 'test-gitignore-not-temp');
      await fs.ensureDir(testDir);
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        'node_modules\n.env\n'
      );

      const result = await checkGitTracking(testDir, 'settings.local.json');
      expect(result).toBe(false);

      await fs.remove(testDir);
    });

    it('returns false if .gitignore does not exist', async () => {
      const testDir = path.join(process.cwd(), 'test-no-gitignore-temp');
      await fs.ensureDir(testDir);

      const result = await checkGitTracking(testDir, 'settings.local.json');
      expect(result).toBe(false);

      await fs.remove(testDir);
    });
  });

  describe('validateTokenSecurity', () => {
    it('returns safe for non-token files', async () => {
      const testDir = path.join(process.cwd(), 'test-validate-non-token-temp');
      await fs.ensureDir(testDir);

      const result = await validateTokenSecurity(testDir, 'settings.json');
      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);

      await fs.remove(testDir);
    });

    it('warns on tracked token files', async () => {
      const testDir = path.join(process.cwd(), 'test-validate-tracked-temp');
      await fs.ensureDir(testDir);
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        'node_modules\n'
      );

      const result = await validateTokenSecurity(testDir, 'settings.local.json');
      expect(result.safe).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('tracked');

      await fs.remove(testDir);
    });

    it('returns safe for ignored token files', async () => {
      const testDir = path.join(process.cwd(), 'test-validate-ignored-temp');
      await fs.ensureDir(testDir);
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        'settings.local.json\n'
      );

      const result = await validateTokenSecurity(testDir, 'settings.local.json');
      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);

      await fs.remove(testDir);
    });

    it('warns on insecure file permissions', async () => {
      const testDir = path.join(process.cwd(), 'test-validate-perms-temp');
      const tokenFile = path.join(testDir, 'settings.local.json');
      await fs.ensureDir(testDir);
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        'settings.local.json\n'
      );
      await fs.writeFile(tokenFile, '{"apiToken": "test"}');
      // Set world-readable permissions (644)
      await fs.chmod(tokenFile, 0o644);

      const result = await validateTokenSecurity(testDir, 'settings.local.json');
      expect(result.safe).toBe(true); // Safe from git tracking
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('permission') || w.includes('600'))).toBe(true);

      await fs.remove(testDir);
    });
  });
});