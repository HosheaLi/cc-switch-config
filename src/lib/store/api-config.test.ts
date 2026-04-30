/**
 * ApiConfigStore Tests
 *
 * Tests for API configuration CRUD operations with persistence.
 * Per CFG-01: ApiConfigStore manages global API configurations.
 * Per SEC-03: Atomic write and backup patterns maintained.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ApiConfigStore } from './api-config.js';
import type { ApiConfig } from '../types/api-config.js';
import { ValidationError } from '../types/validation.js';

describe('ApiConfigStore', () => {
  let tempDir: string;
  let configFile: string;
  let store: ApiConfigStore;

  // Helper to create valid unified ApiConfig
  const createUnifiedConfig = (name: string): ApiConfig => ({
    name,
    apiKey: 'test-api-key-12345',
    baseUrl: 'https://api.example.com',
    mode: 'unified',
    modelName: 'claude-3-5-sonnet-20241022',
  });

  // Helper to create valid granular ApiConfig
  const createGranularConfig = (name: string): ApiConfig => ({
    name,
    apiKey: 'test-api-key-12345',
    baseUrl: 'https://api.example.com',
    mode: 'granular',
    env: {
      ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
      ANTHROPIC_AUTH_TOKEN: 'test-key',
    },
  });

  beforeEach(async () => {
    // Create temp directory for test isolation
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-config-store-test-'));
    configFile = path.join(tempDir, 'api-configs.json');

    // Create store instance pointing to temp directory
    store = new ApiConfigStore(configFile);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  describe('getAll', () => {
    it('Test 1: should return empty object for new store', async () => {
      const configs = await store.getAll();

      expect(configs).toEqual({});
    });

    it('should return all configs after adding', async () => {
      const config1 = createUnifiedConfig('config1');
      const config2 = createGranularConfig('config2');

      await store.set('config1', config1);
      await store.set('config2', config2);

      const configs = await store.getAll();

      expect(Object.keys(configs)).toHaveLength(2);
      expect(configs.config1.name).toBe('config1');
      expect(configs.config2.name).toBe('config2');
    });
  });

  describe('set', () => {
    it('Test 2: should create config with timestamps', async () => {
      const config = createUnifiedConfig('test-config');

      await store.set('test-config', config);

      const saved = await store.get('test-config');
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('test-config');
      expect(saved?.createdAt).toBeDefined();
      expect(saved?.updatedAt).toBeDefined();
      expect(saved?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('Test 8: should validate against ApiConfigSchema (rejects invalid)', async () => {
      const invalidConfig = {
        name: '', // Invalid: empty name
        apiKey: '', // Invalid: empty apiKey
        baseUrl: 'not-a-url', // Invalid: not a URL
        mode: 'unified',
        // Missing modelName for unified mode
      };

      await expect(store.set('invalid', invalidConfig as ApiConfig)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing modelName in unified mode', async () => {
      const invalidConfig = {
        name: 'test',
        apiKey: 'key',
        baseUrl: 'https://api.example.com',
        mode: 'unified',
        // modelName is required for unified mode
      };

      await expect(store.set('test', invalidConfig as ApiConfig)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing env in granular mode', async () => {
      const invalidConfig = {
        name: 'test',
        apiKey: 'key',
        baseUrl: 'https://api.example.com',
        mode: 'granular',
        // env is required for granular mode
      };

      await expect(store.set('test', invalidConfig as ApiConfig)).rejects.toThrow(ValidationError);
    });

    it('should add createdAt timestamp on creation', async () => {
      const config = createUnifiedConfig('timestamp-test');

      await store.set('timestamp-test', config);

      const saved = await store.get('timestamp-test');
      expect(saved?.createdAt).toBeDefined();
      expect(saved?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should update updatedAt timestamp on modification', async () => {
      const config = createUnifiedConfig('update-test');
      await store.set('update-test', config);

      const initial = await store.get('update-test');
      const initialUpdatedAt = initial?.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the config
      const updatedConfig = { ...config, modelName: 'claude-3-opus-20240229' };
      await store.set('update-test', updatedConfig);

      const updated = await store.get('update-test');
      expect(updated?.updatedAt).toBeDefined();
      expect(updated?.updatedAt).not.toBe(initialUpdatedAt);
    });

    it('Test 9: should create backup before modification (if file exists)', async () => {
      // First, create initial config
      const config = createUnifiedConfig('backup-test');
      await store.set('backup-test', config);

      // Now update it - this should trigger backup
      const updatedConfig = { ...config, modelName: 'claude-3-opus-20240229' };
      await store.set('backup-test', updatedConfig);

      // Check for backup directory
      const backupDir = path.join(tempDir, '.backups');
      const backupExists = await fs.pathExists(backupDir);
      expect(backupExists).toBe(true);

      // Check for backup files
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });

    it('Test 10: Atomic write pattern maintained (writeJSON used)', async () => {
      const config = createUnifiedConfig('atomic-test');
      await store.set('atomic-test', config);

      // Verify file exists (atomic write completed)
      const fileExists = await fs.pathExists(configFile);
      expect(fileExists).toBe(true);

      // Verify content is valid JSON
      const content = await fs.readFile(configFile, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.configs).toBeDefined();
      expect(parsed.configs['atomic-test']).toBeDefined();
    });
  });

  describe('get', () => {
    it('Test 3: should return config by name', async () => {
      const config = createUnifiedConfig('get-test');
      await store.set('get-test', config);

      const result = await store.get('get-test');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('get-test');
      expect(result?.baseUrl).toBe('https://api.example.com');
    });

    it('Test 4: should return null for non-existent name', async () => {
      const result = await store.get('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('Test 5: should remove existing config and return true', async () => {
      const config = createUnifiedConfig('delete-test');
      await store.set('delete-test', config);

      const result = await store.delete('delete-test');

      expect(result).toBe(true);

      // Verify it's actually deleted
      const deleted = await store.get('delete-test');
      expect(deleted).toBeNull();
    });

    it('Test 6: should return false for non-existent config', async () => {
      const result = await store.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should create backup before deletion', async () => {
      const config = createUnifiedConfig('delete-backup-test');
      await store.set('delete-backup-test', config);

      await store.delete('delete-backup-test');

      // Check for backup
      const backupDir = path.join(tempDir, '.backups');
      const backupExists = await fs.pathExists(backupDir);
      expect(backupExists).toBe(true);
    });
  });

  describe('list', () => {
    it('Test 7: should return array of config names', async () => {
      await store.set('alpha', createUnifiedConfig('alpha'));
      await store.set('beta', createGranularConfig('beta'));
      await store.set('gamma', createUnifiedConfig('gamma'));

      const names = await store.list();

      expect(names).toHaveLength(3);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toContain('gamma');
    });

    it('should return empty array for new store', async () => {
      const names = await store.list();

      expect(names).toEqual([]);
    });
  });

  describe('persistence', () => {
    it('configs should persist after store reload', async () => {
      // Add configs with first store instance
      const config1 = createUnifiedConfig('persist1');
      const config2 = createGranularConfig('persist2');

      await store.set('persist1', config1);
      await store.set('persist2', config2);

      // Create a new store instance pointing to same file
      const newStore = new ApiConfigStore(configFile);

      // Verify configs persisted
      const configs = await newStore.getAll();
      expect(Object.keys(configs)).toHaveLength(2);
      expect(configs.persist1).toBeDefined();
      expect(configs.persist2).toBeDefined();
    });

    it('should store configs in valid JSON format', async () => {
      const config = createUnifiedConfig('json-test');
      await store.set('json-test', config);

      // Read the file directly
      const content = await fs.readFile(configFile, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBeDefined();
      expect(parsed.configs).toBeDefined();
      expect(parsed.configs['json-test']).toBeDefined();
    });
  });

  describe('schema validation', () => {
    it('should accept valid unified config', async () => {
      const config = createUnifiedConfig('valid-unified');
      await store.set('valid-unified', config);

      const saved = await store.get('valid-unified');
      expect(saved).not.toBeNull();
      expect(saved?.mode).toBe('unified');
      expect(saved?.modelName).toBe('claude-3-5-sonnet-20241022');
    });

    it('should accept valid granular config', async () => {
      const config = createGranularConfig('valid-granular');
      await store.set('valid-granular', config);

      const saved = await store.get('valid-granular');
      expect(saved).not.toBeNull();
      expect(saved?.mode).toBe('granular');
      expect(saved?.env).toBeDefined();
      expect(saved?.env?.ANTHROPIC_MODEL).toBe('claude-3-5-sonnet-20241022');
    });

    it('should reject unknown fields (strict mode)', async () => {
      const invalidConfig = {
        ...createUnifiedConfig('strict-test'),
        unknownField: 'should be rejected',
      };

      await expect(store.set('strict-test', invalidConfig as ApiConfig)).rejects.toThrow(ValidationError);
    });
  });
});