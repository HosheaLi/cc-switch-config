/**
 * ConfigService Tests
 *
 * Tests for configuration management service.
 * Per D-01: Services as classes + constructor injection.
 * Per D-02: Services throw Error, caller handles.
 *
 * Per F1: ConfigService handles config read/write, validation, and application.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ConfigService } from './config-service.js';
import { readConfig, writeConfig } from '../store/config.js';
import { ServiceError } from './types.js';
import type { ClaudeSettings } from '../types/config.js';

describe('ConfigService', () => {
  let tempDir: string;
  let configPath: string;
  let service: ConfigService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-service-test-'));
    configPath = path.join(tempDir, '.claude', 'settings.json');
    await fs.ensureDir(path.dirname(configPath));

    // Per D-01: Constructor injection with actual readConfig/writeConfig
    service = new ConfigService(readConfig, writeConfig);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('readProjectConfig', () => {
    it('should return config from valid path', async () => {
      const config: ClaudeSettings = {
        version: 1,
        model: 'claude-3-5-sonnet-20241022',
        env: {
          ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
        },
      };
      await writeConfig(configPath, config);

      const result = await service.readProjectConfig(tempDir);

      expect(result).not.toBeNull();
      expect(result?.model).toBe('claude-3-5-sonnet-20241022');
      expect(result?.version).toBe(1);
    });

    it('should return null for non-existent config', async () => {
      const result = await service.readProjectConfig(tempDir);

      expect(result).toBeNull();
    });

    it('should throw ServiceError on read failure', async () => {
      // Create a mock readConfig that throws
      const mockReadConfig = async () => {
        throw new Error('Permission denied');
      };
      const mockService = new ConfigService(mockReadConfig, writeConfig);

      try {
        await mockService.readProjectConfig(tempDir);
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_READ_FAILED');
      }
    });
  });

  describe('writeProjectConfig', () => {
    it('should save validated config', async () => {
      const config: ClaudeSettings = {
        version: 1,
        model: 'claude-3-5-sonnet-20241022',
      };

      await service.writeProjectConfig(tempDir, config);

      // Verify config was written
      const result = await readConfig(configPath);
      expect(result).not.toBeNull();
      expect(result?.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should throw ValidationError on invalid config', async () => {
      const invalidConfig = {
        modle: 'claude-3', // typo - should be 'model'
      } as unknown as ClaudeSettings;

      try {
        await service.writeProjectConfig(tempDir, invalidConfig);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('ValidationError');
      }
    });

    it('should throw ServiceError on write failure', async () => {
      // Create a mock writeConfig that throws
      const mockWriteConfig = async () => {
        throw new Error('Disk full');
      };
      const mockService = new ConfigService(readConfig, mockWriteConfig);

      const config: ClaudeSettings = { version: 1 };

      try {
        await mockService.writeProjectConfig(tempDir, config);
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_WRITE_FAILED');
      }
    });

    it('should create backup before overwrite', async () => {
      // Create initial config
      const initialConfig: ClaudeSettings = { version: 1, model: 'claude-3' };
      await writeConfig(configPath, initialConfig);

      // Write new config
      const newConfig: ClaudeSettings = { version: 2, model: 'claude-4' };
      await service.writeProjectConfig(tempDir, newConfig);

      // Check backup was created in .claude/.backups (same directory as config)
      const backupDir = path.join(tempDir, '.claude', '.backups');
      const backupExists = await fs.pathExists(backupDir);
      expect(backupExists).toBe(true);

      // List backup files
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('constructor injection', () => {
    it('should accept readConfig and writeConfig functions (D-01)', async () => {
      // Create service with mock functions
      const mockRead = async () => null;
      const mockWrite = async () => {};
      const mockService = new ConfigService(mockRead, mockWrite);

      // Service should be instantiated successfully
      expect(mockService).toBeDefined();
      expect(mockService.readProjectConfig).toBeDefined();
      expect(mockService.writeProjectConfig).toBeDefined();
    });

    it('should work with real readConfig/writeConfig', async () => {
      const config: ClaudeSettings = { version: 1, model: 'claude-3' };
      await service.writeProjectConfig(tempDir, config);

      const result = await service.readProjectConfig(tempDir);
      expect(result?.model).toBe('claude-3');
    });
  });

  describe('applyApiConfig', () => {
    it('should replace env/model fields, preserving permissions/hooks/mcpServers (CFG-02)', async () => {
      // Create existing config with preserved fields
      const existingConfig: ClaudeSettings = {
        version: 1,
        model: 'claude-3-old',
        env: {
          ANTHROPIC_MODEL: 'claude-3-old',
          OLD_VAR: 'preserve-me',
        },
        permissions: [{ allow: 'Bash' }, { deny: 'Read' }],
        hooks: [{ match: 'PreToolUse', run: 'some-hook' }],
        mcpServers: { myServer: { command: 'node', args: ['server.js'] } },
      };
      await writeConfig(configPath, existingConfig);

      // ApiConfig to apply (unified mode)
      const apiConfig = {
        name: 'test-config',
        apiKey: 'sk-secret-key-123',
        baseUrl: 'https://api.anthropic.com',
        mode: 'unified' as const,
        modelName: 'claude-4-new',
      };

      await service.applyApiConfig(tempDir, apiConfig);

      // Verify: env/model replaced, other fields preserved
      const result = await readConfig(configPath);
      expect(result).not.toBeNull();
      // Model replaced
      expect(result?.model).toBe('claude-4-new');
      // Env replaced (old env gone, new unified env present)
      expect(result?.env?.ANTHROPIC_MODEL).toBe('claude-4-new');
      expect(result?.env?.ANTHROPIC_AUTH_TOKEN).toBe('sk-secret-key-123');
      expect(result?.env?.ANTHROPIC_BASE_URL).toBe('https://api.anthropic.com');
      // OLD_VAR should NOT exist (complete replacement per D-13)
      expect(result?.env?.OLD_VAR).toBeUndefined();
      // Preserved fields unchanged (CFG-02)
      expect(result?.permissions?.length).toBe(2);
      expect(result?.hooks?.length).toBe(1);
      expect(result?.mcpServers?.myServer).toBeDefined();
    });

    it('should handle empty existing config (create new with env/model)', async () => {
      // No existing config (file doesn't exist)
      const apiConfig = {
        name: 'test-config',
        apiKey: 'sk-new-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified' as const,
        modelName: 'claude-3-sonnet',
      };

      await service.applyApiConfig(tempDir, apiConfig);

      const result = await readConfig(configPath);
      expect(result).not.toBeNull();
      expect(result?.env?.ANTHROPIC_MODEL).toBe('claude-3-sonnet');
      expect(result?.env?.ANTHROPIC_AUTH_TOKEN).toBe('sk-new-key');
      expect(result?.model).toBe('claude-3-sonnet');
    });

    it('should create backup before applying api config', async () => {
      // Create initial config
      const initialConfig: ClaudeSettings = { version: 1, model: 'claude-3' };
      await writeConfig(configPath, initialConfig);

      const apiConfig = {
        name: 'test-config',
        apiKey: 'sk-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified' as const,
        modelName: 'claude-4',
      };

      await service.applyApiConfig(tempDir, apiConfig);

      // Check backup was created in .claude/.backups
      const backupDir = path.join(tempDir, '.claude', '.backups');
      const backupExists = await fs.pathExists(backupDir);
      expect(backupExists).toBe(true);
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should throw ServiceError on write failure', async () => {
      const mockReadConfig = async () => null;
      const mockWriteConfig = async () => {
        throw new Error('Disk full');
      };
      const mockService = new ConfigService(mockReadConfig, mockWriteConfig);

      const apiConfig = {
        name: 'test-config',
        apiKey: 'sk-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified' as const,
        modelName: 'claude-4',
      };

      try {
        await mockService.applyApiConfig(tempDir, apiConfig);
        expect.fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CONFIG_WRITE_FAILED');
      }
    });
  });
});