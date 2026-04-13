/**
 * Config Versioning and Migration Tests
 *
 * Tests for version field, migration framework, and schema evolution.
 */

import { describe, it, expect } from 'vitest';
import {
  CONFIG_VERSION,
  DEFAULT_CONFIG,
  hasVersionField,
  getConfigVersion,
} from './version.js';
import { migrateConfig, getMigrations } from './migration.js';

describe('config version', () => {
  describe('CONFIG_VERSION', () => {
    it('should be defined as a number', () => {
      expect(CONFIG_VERSION).toBeDefined();
      expect(typeof CONFIG_VERSION).toBe('number');
    });

    it('should start at 1', () => {
      // First version should be 1 (v0 is implicit for missing version)
      expect(CONFIG_VERSION).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should include version field', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('version');
    });

    it('should have version equal to CONFIG_VERSION', () => {
      expect(DEFAULT_CONFIG.version).toBe(CONFIG_VERSION);
    });
  });

  describe('hasVersionField', () => {
    it('should return true for object with version property', () => {
      expect(hasVersionField({ version: 1 })).toBe(true);
      expect(hasVersionField({ version: 0 })).toBe(true);
      expect(hasVersionField({ version: 2, other: 'data' })).toBe(true);
    });

    it('should return false for object without version property', () => {
      expect(hasVersionField({})).toBe(false);
      expect(hasVersionField({ other: 'data' })).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasVersionField(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasVersionField(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasVersionField('string')).toBe(false);
      expect(hasVersionField(123)).toBe(false);
      expect(hasVersionField([1, 2, 3])).toBe(false);
    });
  });

  describe('getConfigVersion', () => {
    it('should return version when present', () => {
      expect(getConfigVersion({ version: 1 })).toBe(1);
      expect(getConfigVersion({ version: 5, data: 'test' })).toBe(5);
    });

    it('should return 0 when version is missing', () => {
      // Missing version means oldest version (v0)
      expect(getConfigVersion({})).toBe(0);
      expect(getConfigVersion({ data: 'test' })).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(getConfigVersion(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(getConfigVersion(undefined)).toBe(0);
    });

    it('should return 0 for non-objects', () => {
      expect(getConfigVersion('string')).toBe(0);
      expect(getConfigVersion(123)).toBe(0);
      expect(getConfigVersion([1, 2, 3])).toBe(0);
    });
  });
});

describe('migration', () => {
  describe('getMigrations', () => {
    it('should return an array of migration functions', () => {
      const migrations = getMigrations();

      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBeGreaterThan(0);
      migrations.forEach((migration) => {
        expect(typeof migration).toBe('function');
      });
    });

    it('should have migrations indexed by version', () => {
      const migrations = getMigrations();

      // migrations[0] transforms v0 -> v1
      // migrations[1] transforms v1 -> v2
      // etc.
      expect(migrations.length).toBe(CONFIG_VERSION);
    });
  });

  describe('migrateConfig', () => {
    it('should add version field to config without version', () => {
      // v0 config (no version field)
      const oldConfig = { apiUrl: 'https://api.example.com' };

      const migrated = migrateConfig(oldConfig) as { version: number; apiUrl: string };

      expect(migrated.version).toBeDefined();
      expect(migrated.version).toBe(CONFIG_VERSION);
      expect(migrated.apiUrl).toBe('https://api.example.com');
    });

    it('should run all necessary migrations', () => {
      // Start with v0 config
      const oldConfig = { data: 'test' };

      const migrated = migrateConfig(oldConfig) as { version: number; data: string };

      // Should end up at current version
      expect(migrated.version).toBe(CONFIG_VERSION);
      expect(migrated.data).toBe('test');
    });

    it('should preserve all existing data', () => {
      const oldConfig = {
        apiUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 3,
        features: { feature1: true, feature2: false },
      };

      const migrated = migrateConfig(oldConfig) as typeof oldConfig & { version: number };

      expect(migrated.apiUrl).toBe('https://api.example.com');
      expect(migrated.timeout).toBe(5000);
      expect(migrated.retries).toBe(3);
      expect(migrated.features).toEqual({ feature1: true, feature2: false });
    });

    it('should handle missing version (treat as 0)', () => {
      const config = { foo: 'bar' };

      const migrated = migrateConfig(config) as { version: number; foo: string };

      expect(migrated.version).toBe(CONFIG_VERSION);
      expect(migrated.foo).toBe('bar');
    });

    it('should stop at CONFIG_VERSION', () => {
      // Create a config that's already at current version
      const currentConfig = { ...DEFAULT_CONFIG, extra: 'data' };

      const migrated = migrateConfig(currentConfig);

      // Should return unchanged (same version)
      expect(migrated).toEqual(currentConfig);
    });

    it('should handle null input gracefully', () => {
      // Should return default config for null
      const migrated = migrateConfig(null);

      expect(migrated).toEqual(DEFAULT_CONFIG);
    });

    it('should handle undefined input gracefully', () => {
      // Should return default config for undefined
      const migrated = migrateConfig(undefined);

      expect(migrated).toEqual(DEFAULT_CONFIG);
    });

    it('should handle non-object input gracefully', () => {
      // Should return default config for non-objects
      expect(migrateConfig('string')).toEqual(DEFAULT_CONFIG);
      expect(migrateConfig(123)).toEqual(DEFAULT_CONFIG);
      expect(migrateConfig([1, 2, 3])).toEqual(DEFAULT_CONFIG);
    });

    it('should migrate from v0 to v1', () => {
      const v0Config = { apiUrl: 'https://api.example.com' };

      const migrated = migrateConfig(v0Config) as { version: number; apiUrl: string };

      expect(migrated.version).toBe(1);
      expect(migrated.apiUrl).toBe('https://api.example.com');
    });

    it('should not modify the original config object', () => {
      const original = { apiUrl: 'https://test.com' };
      const originalCopy = JSON.parse(JSON.stringify(original));

      migrateConfig(original);

      // Original should be unchanged
      expect(original).toEqual(originalCopy);
    });
  });
});