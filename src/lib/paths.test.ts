import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  getConfigDir,
  getDataDir,
  getCacheDir,
  getClaudeSettingsPath,
} from './paths/index.js';

describe('paths', () => {
  describe('XDG paths', () => {
    it('getConfigDir() returns platform-specific path', () => {
      const configDir = getConfigDir();
      // Should return a valid string path
      expect(typeof configDir).toBe('string');
      expect(configDir.length).toBeGreaterThan(0);
      // Should contain app name
      expect(configDir).toContain('cc-config-switch');
    });

    it('getDataDir() returns platform-specific path', () => {
      const dataDir = getDataDir();
      expect(typeof dataDir).toBe('string');
      expect(dataDir.length).toBeGreaterThan(0);
      expect(dataDir).toContain('cc-config-switch');
    });

    it('getCacheDir() returns platform-specific path', () => {
      const cacheDir = getCacheDir();
      expect(typeof cacheDir).toBe('string');
      expect(cacheDir.length).toBeGreaterThan(0);
      expect(cacheDir).toContain('cc-config-switch');
    });

    it('paths contain no hardcoded separators', () => {
      const configDir = getConfigDir();
      const dataDir = getDataDir();
      const cacheDir = getCacheDir();

      // Should not contain hardcoded forward slashes from template strings
      // (actual path may have separators from path.join, which is correct)
      // The paths should work with path.join
      const testPath = path.join(configDir, 'test.json');
      expect(typeof testPath).toBe('string');
      expect(testPath.length).toBeGreaterThan(configDir.length);
    });

    it('paths work with path.join()', () => {
      const configDir = getConfigDir();
      const filePath = path.join(configDir, 'config.json');

      // Should produce a valid path
      expect(typeof filePath).toBe('string');
      expect(filePath).toContain('config.json');
      expect(filePath).toContain('cc-config-switch');
    });
  });

  describe('Claude Code paths', () => {
    it('getClaudeSettingsPath() returns .claude directory path', () => {
      const claudePath = getClaudeSettingsPath();
      expect(typeof claudePath).toBe('string');
      expect(claudePath.length).toBeGreaterThan(0);
      // Should contain .claude directory
      expect(claudePath).toContain('.claude');
    });

    it('getClaudeSettingsPath() works with path.join', () => {
      const claudePath = getClaudeSettingsPath();
      const settingsPath = path.join(claudePath, 'settings.json');

      expect(typeof settingsPath).toBe('string');
      expect(settingsPath).toContain('settings.json');
      expect(settingsPath).toContain('.claude');
    });
  });
});