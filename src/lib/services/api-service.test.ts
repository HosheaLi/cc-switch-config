/**
 * ApiService Tests
 *
 * Tests for API configuration management service.
 * Per CFG-01: ApiService provides CRUD and apply operations.
 * Per D-01: Services as classes + constructor injection.
 * Per D-02: Services throw ServiceError, caller handles.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ApiService } from './api-service.js';
import { ApiConfigStore } from '../store/api-config.js';
import { ServiceError } from './types.js';
import type { ApiConfig } from '../types/api-config.js';
import type { ClaudeSettings } from '../types/config.js';

describe('ApiService', () => {
  let tempDir: string;
  let configFile: string;
  let projectDir: string;
  let projectConfigPath: string;
  let apiConfigStore: ApiConfigStore;
  let service: ApiService;

  // Mock readConfig and writeConfig for testing
  let mockConfigs: Record<string, ClaudeSettings>;
  const mockReadConfig = async (filepath: string): Promise<ClaudeSettings | null> => {
    return mockConfigs[filepath] ?? null;
  };
  const mockWriteConfig = async (filepath: string, config: ClaudeSettings): Promise<void> => {
    mockConfigs[filepath] = config;
  };

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
    // Create temp directories for test isolation
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-service-test-'));
    configFile = path.join(tempDir, 'api-configs.json');
    projectDir = path.join(tempDir, 'project');
    projectConfigPath = path.join(projectDir, '.claude', 'settings.json');
    await fs.ensureDir(path.dirname(projectConfigPath));

    // Initialize mock config storage
    mockConfigs = {};

    // Create ApiConfigStore instance
    apiConfigStore = new ApiConfigStore(configFile);

    // Create ApiService instance with constructor injection (D-01)
    service = new ApiService(apiConfigStore, mockReadConfig, mockWriteConfig);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  describe('createConfig', () => {
    it('Test 1: should save config via ApiConfigStore', async () => {
      const config = createUnifiedConfig('test-config');

      await service.createConfig('test-config', config);

      // Verify config was saved in store
      const saved = await apiConfigStore.get('test-config');
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('test-config');
    });

    it('Test 2: should throw CONFIG_ALREADY_EXISTS for duplicate', async () => {
      const config = createUnifiedConfig('duplicate-test');
      await service.createConfig('duplicate-test', config);

      // Try to create again with same name
      try {
        await service.createConfig('duplicate-test', config);
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_ALREADY_EXISTS');
      }
    });
  });

  describe('getConfig', () => {
    it('Test 3: should return config by name', async () => {
      const config = createUnifiedConfig('get-test');
      await apiConfigStore.set('get-test', config);

      const result = await service.getConfig('get-test');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('get-test');
    });

    it('Test 4: should return null for non-existent', async () => {
      const result = await service.getConfig('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('should update existing config', async () => {
      const config = createUnifiedConfig('update-test');
      await apiConfigStore.set('update-test', config);

      const updatedConfig = { ...config, modelName: 'claude-3-opus-20240229' };
      await service.updateConfig('update-test', updatedConfig);

      const saved = await apiConfigStore.get('update-test');
      expect(saved?.modelName).toBe('claude-3-opus-20240229');
    });

    it('Test 5: should throw CONFIG_NOT_FOUND if missing', async () => {
      const config = createUnifiedConfig('missing-update');

      try {
        await service.updateConfig('missing-update', config);
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_NOT_FOUND');
      }
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config', async () => {
      const config = createUnifiedConfig('delete-test');
      await apiConfigStore.set('delete-test', config);

      const result = await service.deleteConfig('delete-test');

      expect(result).toBe(true);
      const deleted = await apiConfigStore.get('delete-test');
      expect(deleted).toBeNull();
    });

    it('Test 6: should throw CONFIG_NOT_FOUND if missing', async () => {
      try {
        await service.deleteConfig('non-existent');
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_NOT_FOUND');
      }
    });
  });

  describe('listConfigs', () => {
    it('Test 7: should return array of config names', async () => {
      await apiConfigStore.set('alpha', createUnifiedConfig('alpha'));
      await apiConfigStore.set('beta', createGranularConfig('beta'));

      const names = await service.listConfigs();

      expect(names).toHaveLength(2);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
    });

    it('should return empty array for empty store', async () => {
      const names = await service.listConfigs();

      expect(names).toEqual([]);
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs as record', async () => {
      await apiConfigStore.set('config1', createUnifiedConfig('config1'));
      await apiConfigStore.set('config2', createGranularConfig('config2'));

      const configs = await service.getAllConfigs();

      expect(Object.keys(configs)).toHaveLength(2);
      expect(configs.config1).toBeDefined();
      expect(configs.config2).toBeDefined();
    });
  });

  describe('applyConfig', () => {
    it('Test 8: should apply config to project using replaceEnvModel', async () => {
      // Create API config
      const config = createUnifiedConfig('apply-test');
      await apiConfigStore.set('apply-test', config);

      // Create existing project config with permissions
      mockConfigs[projectConfigPath] = {
        version: 1,
        model: 'claude-3',
        permissions: [{ allow: 'Bash' }],
      };

      await service.applyConfig(projectDir, 'apply-test');

      // Verify merged config was written
      const written = mockConfigs[projectConfigPath];
      expect(written).toBeDefined();
      // Per D-14: unified mode sets model and env
      expect(written?.model).toBe('claude-3-5-sonnet-20241022');
      expect(written?.env?.ANTHROPIC_MODEL).toBe('claude-3-5-sonnet-20241022');
      expect(written?.env?.ANTHROPIC_AUTH_TOKEN).toBe('test-api-key-12345');
      expect(written?.env?.ANTHROPIC_BASE_URL).toBe('https://api.example.com');
      // Per CFG-02: permissions preserved
      expect(written?.permissions?.length).toBe(1);
    });

    it('should apply granular config correctly', async () => {
      // Create granular API config
      const config = createGranularConfig('granular-apply');
      await apiConfigStore.set('granular-apply', config);

      // Create existing project config
      mockConfigs[projectConfigPath] = {
        version: 1,
        permissions: [{ allow: 'Read' }],
      };

      await service.applyConfig(projectDir, 'granular-apply');

      const written = mockConfigs[projectConfigPath];
      expect(written).toBeDefined();
      // Granular mode: env from config, model undefined
      expect(written?.model).toBeUndefined();
      expect(written?.env?.ANTHROPIC_MODEL).toBe('claude-3-5-sonnet-20241022');
      expect(written?.env?.ANTHROPIC_AUTH_TOKEN).toBe('test-key');
      // Per CFG-02: permissions preserved
      expect(written?.permissions?.length).toBe(1);
    });

    it('should work with empty existing config', async () => {
      const config = createUnifiedConfig('empty-apply');
      await apiConfigStore.set('empty-apply', config);

      // No existing config
      await service.applyConfig(projectDir, 'empty-apply');

      const written = mockConfigs[projectConfigPath];
      expect(written).toBeDefined();
      expect(written?.env?.ANTHROPIC_MODEL).toBe('claude-3-5-sonnet-20241022');
    });

    it('Test 9: should throw CONFIG_NOT_FOUND for missing config', async () => {
      mockConfigs[projectConfigPath] = { version: 1 };

      try {
        await service.applyConfig(projectDir, 'missing-config');
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_NOT_FOUND');
      }
    });

    it('should throw CONFIG_APPLY_FAILED on write error', async () => {
      const config = createUnifiedConfig('apply-fail');
      await apiConfigStore.set('apply-fail', config);

      // Mock writeConfig that throws
      const failWriteConfig = async (): Promise<void> => {
        throw new Error('Disk full');
      };
      const failService = new ApiService(apiConfigStore, mockReadConfig, failWriteConfig);

      try {
        await failService.applyConfig(projectDir, 'apply-fail');
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_APPLY_FAILED');
      }
    });

    it('should preserve hooks and mcpServers (CFG-02)', async () => {
      const config = createUnifiedConfig('preserve-test');
      await apiConfigStore.set('preserve-test', config);

      // Create existing config with hooks and mcpServers
      mockConfigs[projectConfigPath] = {
        version: 1,
        permissions: [{ allow: 'Bash' }],
        hooks: { PreToolUse: ['hook1'] },
        mcpServers: { server1: { command: 'test' } },
      };

      await service.applyConfig(projectDir, 'preserve-test');

      const written = mockConfigs[projectConfigPath];
      // Per CFG-02: hooks and mcpServers preserved
      expect(written?.hooks).toBeDefined();
      expect(written?.mcpServers).toBeDefined();
    });
  });

  describe('constructor injection (D-01)', () => {
    it('should accept apiConfigStore and read/write functions', async () => {
      const mockRead = async () => null;
      const mockWrite = async () => {};
      const mockService = new ApiService(apiConfigStore, mockRead, mockWrite);

      expect(mockService).toBeDefined();
      expect(mockService.createConfig).toBeDefined();
      expect(mockService.applyConfig).toBeDefined();
    });
  });
});