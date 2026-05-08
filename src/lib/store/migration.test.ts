/**
 * Migration Utility Tests
 *
 * Tests for templates.json → api-configs.json migration.
 * Validates field mapping, validation, backup, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { migrateTemplatesToApiConfigs, type MigrationResult } from './migration.js';

describe('migrateTemplatesToApiConfigs', () => {
  let tempDir: string;
  let templatesPath: string;
  let apiConfigsPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migration-test-'));
    templatesPath = path.join(tempDir, 'templates.json');
    apiConfigsPath = path.join(tempDir, 'api-configs.json');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should return migrated: 0 when templates.json does not exist', async () => {
    const result = await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    expect(result.migrated).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.backupPath).toBeNull();
  });

  it('should migrate 3 TemplateConfigs to 3 ApiConfigs', async () => {
    // Create templates.json with 3 configs
    const templatesFile = {
      version: 1,
      templates: {
        'anthropic-config': {
          name: 'anthropic-config',
          description: 'Anthropic API config',
          provider: {
            name: 'claude-3-opus',
            baseUrl: 'https://api.anthropic.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-ant-key1' },
          },
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-14T00:00:00.000Z',
        },
        'custom-api': {
          name: 'custom-api',
          description: 'Custom API provider',
          provider: {
            name: 'gpt-4',
            baseUrl: 'https://api.openai.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-openai-key2' },
          },
        },
        'local-proxy': {
          name: 'local-proxy',
          provider: {
            name: 'claude-3-sonnet',
            baseUrl: 'http://localhost:8080',
            authType: 'token',
            env: { ANTHROPIC_API_KEY: 'local-key3' },
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    const result = await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    expect(result.migrated).toBe(3);
    expect(result.errors).toEqual([]);
    expect(result.backupPath).not.toBeNull();
  });

  it('should map provider.name to modelName (not to config.name)', async () => {
    const templatesFile = {
      version: 1,
      templates: {
        'my-config': {
          name: 'my-config',
          provider: {
            name: 'claude-3-opus',  // This → modelName
            baseUrl: 'https://api.test.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-test-key' },
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    // Read the migrated api-configs.json
    const apiConfigsData = await fs.readJSON(apiConfigsPath);
    const config = apiConfigsData.configs['my-config'];

    // provider.name → modelName (NOT config.name!)
    expect(config.modelName).toBe('claude-3-opus');
    // template.name → config.name
    expect(config.name).toBe('my-config');
    expect(config.apiKey).toBe('sk-test-key');
    expect(config.baseUrl).toBe('https://api.test.com');
    expect(config.mode).toBe('unified');
  });

  it('should return errors for configs failing Zod validation (missing apiKey)', async () => {
    const templatesFile = {
      version: 1,
      templates: {
        'bad-config': {
          name: 'bad-config',
          provider: {
            name: 'claude-3-opus',
            baseUrl: 'https://api.test.com',
            authType: 'header',
            env: {}, // Missing ANTHROPIC_API_KEY → apiKey will be ''
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    const result = await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    // apiKey '' fails ApiConfigSchema (min(1))
    expect(result.migrated).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('bad-config');
    expect(result.errors[0]).toContain('apiKey');
  });

  it('should create backup of templates.json before migration', async () => {
    const templatesFile = {
      version: 1,
      templates: {
        'test-config': {
          name: 'test-config',
          provider: {
            name: 'claude-3',
            baseUrl: 'https://api.anthropic.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-key' },
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    const result = await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    expect(result.backupPath).not.toBeNull();
    // Backup file should exist
    const backupExists = await fs.pathExists(result.backupPath!);
    expect(backupExists).toBe(true);
  });

  it('should rename templates.json to templates.json.migrated after successful migration', async () => {
    const templatesFile = {
      version: 1,
      templates: {
        'test-config': {
          name: 'test-config',
          provider: {
            name: 'claude-3',
            baseUrl: 'https://api.anthropic.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-key' },
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    // templates.json should no longer exist
    const templatesExists = await fs.pathExists(templatesPath);
    expect(templatesExists).toBe(false);

    // templates.json.migrated should exist
    const migratedPath = `${templatesPath}.migrated`;
    const migratedExists = await fs.pathExists(migratedPath);
    expect(migratedExists).toBe(true);
  });

  it('should handle partially valid templates (migrate valid, report invalid)', async () => {
    const templatesFile = {
      version: 1,
      templates: {
        'valid-config': {
          name: 'valid-config',
          provider: {
            name: 'claude-3',
            baseUrl: 'https://api.anthropic.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-valid-key' },
          },
        },
        'invalid-config': {
          name: 'invalid-config',
          provider: {
            name: 'claude-3',
            baseUrl: 'not-a-url', // Invalid URL
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-key' },
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    const result = await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    // Only valid config should migrate
    expect(result.migrated).toBe(1);
    // Invalid config should produce error
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('invalid-config');
  });

  it('should set mode to unified for all migrated configs', async () => {
    const templatesFile = {
      version: 1,
      templates: {
        'config-1': {
          name: 'config-1',
          provider: {
            name: 'claude-3-opus',
            baseUrl: 'https://api.test.com',
            authType: 'header',
            env: { ANTHROPIC_API_KEY: 'sk-key' },
          },
        },
      },
    };

    await fs.writeJSON(templatesPath, templatesFile, { spaces: 2 });

    await migrateTemplatesToApiConfigs(templatesPath, apiConfigsPath);

    const apiConfigsData = await fs.readJSON(apiConfigsPath);
    const config = apiConfigsData.configs['config-1'];
    expect(config.mode).toBe('unified');
  });
});
