/**
 * ConfigRepository Tests
 *
 * Tests for configuration file read/write with validation and backup integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { readConfig, writeConfig, configExists } from './config.js';
import type { ClaudeSettings } from '../types/config.js';

describe('ConfigRepository', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));
    testFile = path.join(tempDir, 'settings.json');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('readConfig', () => {
    it('should return null for non-existent file (ENOENT handled)', async () => {
      const result = await readConfig(testFile);

      expect(result).toBeNull();
    });

    it('should return valid config for existing valid file', async () => {
      const validConfig: ClaudeSettings = {
        version: 1,
        model: 'claude-3-5-sonnet-20241022',
        env: {
          ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
        },
      };
      await fs.writeJson(testFile, validConfig);

      const result = await readConfig(testFile);

      expect(result).not.toBeNull();
      expect(result?.version).toBe(1);
      expect(result?.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should validate loaded config and throw ValidationError on invalid', async () => {
      // Create file with invalid config (unknown field 'modle')
      const invalidConfig = {
        modle: 'claude-3-5-sonnet', // typo - should be 'model'
      };
      await fs.writeJson(testFile, invalidConfig);

      try {
        await readConfig(testFile);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('ValidationError');
      }
    });

    it('should validate config with strict mode rejecting unknown keys', async () => {
      const configWithUnknown = {
        version: 1,
        unknownField: 'should be rejected',
      };
      await fs.writeJson(testFile, configWithUnknown);

      await expect(readConfig(testFile)).rejects.toThrow();
    });

    it('should return config with all optional fields missing', async () => {
      // Empty object is valid (all fields are optional)
      const minimalConfig = {};
      await fs.writeJson(testFile, minimalConfig);

      const result = await readConfig(testFile);

      expect(result).not.toBeNull();
      expect(result).toEqual({});
    });

    it('should validate MCP server config', async () => {
      const configWithMcp: ClaudeSettings = {
        mcpServers: {
          'my-server': {
            command: 'node',
            args: ['server.js'],
            env: { NODE_ENV: 'production' },
          },
        },
      };
      await fs.writeJson(testFile, configWithMcp);

      const result = await readConfig(testFile);

      expect(result).not.toBeNull();
      expect(result?.mcpServers?.['my-server']?.command).toBe('node');
    });

    it('should reject invalid MCP server config', async () => {
      const invalidMcpConfig = {
        mcpServers: {
          'bad-server': {
            // missing required 'command' field
            args: ['script.js'],
          },
        },
      };
      await fs.writeJson(testFile, invalidMcpConfig);

      await expect(readConfig(testFile)).rejects.toThrow();
    });

    it('should validate hooks config', async () => {
      const configWithHooks: ClaudeSettings = {
        hooks: [
          {
            match: 'PreToolUse',
            run: 'echo "before tool"',
            timeout: 5000,
          },
        ],
      };
      await fs.writeJson(testFile, configWithHooks);

      const result = await readConfig(testFile);

      expect(result).not.toBeNull();
      expect(result?.hooks?.[0]?.match).toBe('PreToolUse');
    });
  });

  describe('writeConfig', () => {
    it('should validate input before write and throw ValidationError on invalid', async () => {
      const invalidConfig = {
        modle: 'claude-3', // typo
      } as unknown as ClaudeSettings;

      try {
        await writeConfig(testFile, invalidConfig);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('ValidationError');
      }
    });

    it('should write valid config successfully', async () => {
      const validConfig: ClaudeSettings = {
        version: 1,
        model: 'claude-3-5-sonnet-20241022',
      };

      await writeConfig(testFile, validConfig);

      // Verify file exists and content is correct
      const content = await fs.readFile(testFile, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBe(1);
      expect(parsed.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should create backup before writing existing file', async () => {
      // Create initial config
      const initialConfig: ClaudeSettings = { version: 1 };
      await fs.writeJson(testFile, initialConfig);

      // Write new config
      const newConfig: ClaudeSettings = { version: 2, model: 'claude-3' };
      await writeConfig(testFile, newConfig);

      // Check backup was created in .backups directory
      const backupDir = path.join(tempDir, '.backups');
      const backupExists = await fs.pathExists(backupDir);

      expect(backupExists).toBe(true);

      // List backup files
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);

      // Backup should match pattern settings.json.{timestamp}
      expect(backups[0]).toMatch(/^settings\.json\.\d{4}-\d{2}-\d{2}T/);
    });

    it('should NOT create backup for non-existent file', async () => {
      // File does not exist yet
      const newConfig: ClaudeSettings = { version: 1 };

      await writeConfig(testFile, newConfig);

      // No backup should be created
      const backupDir = path.join(tempDir, '.backups');
      const backupExists = await fs.pathExists(backupDir);

      expect(backupExists).toBe(false);
    });

    it('should preserve backup content matching original', async () => {
      // Create initial config
      const initialConfig: ClaudeSettings = {
        version: 1,
        model: 'claude-3',
        env: { ANTHROPIC_MODEL: 'claude-3' },
      };
      await fs.writeJson(testFile, initialConfig);

      // Write new config
      const newConfig: ClaudeSettings = { version: 2 };
      await writeConfig(testFile, newConfig);

      // Check backup content matches original
      const backupDir = path.join(tempDir, '.backups');
      const backups = await fs.readdir(backupDir);
      const backupPath = path.join(backupDir, backups[0]);

      const backupContent = await fs.readJson(backupPath);
      expect(backupContent).toEqual(initialConfig);
    });

    it('should overwrite existing file atomically', async () => {
      // Create initial file
      await fs.writeJson(testFile, { version: 1 });

      // Overwrite
      const newConfig: ClaudeSettings = { version: 2, model: 'claude-4' };
      await writeConfig(testFile, newConfig);

      // Verify content
      const result = await readConfig(testFile);
      expect(result?.version).toBe(2);
      expect(result?.model).toBe('claude-4');
    });

    it('should validate permission rules', async () => {
      const configWithPermissions: ClaudeSettings = {
        permissions: [
          { allow: 'Bash' },
          { deny: 'Read(**/.env)' },
        ],
      };

      await writeConfig(testFile, configWithPermissions);

      const result = await readConfig(testFile);
      expect(result?.permissions?.length).toBe(2);
    });

    it('should reject permission rule without allow or deny', async () => {
      const invalidPermissions = {
        permissions: [
          { /* missing both allow and deny */ },
        ],
      } as unknown as ClaudeSettings;

      await expect(writeConfig(testFile, invalidPermissions)).rejects.toThrow();
    });
  });

  describe('configExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeJson(testFile, { version: 1 });

      const result = await configExists(testFile);

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await configExists(testFile);

      expect(result).toBe(false);
    });

    it('should return false for directory', async () => {
      const result = await configExists(tempDir);

      expect(result).toBe(false);
    });

    it('should return true for empty JSON file', async () => {
      // Empty file technically exists
      await fs.writeFile(testFile, '{}');

      const result = await configExists(testFile);

      expect(result).toBe(true);
    });
  });

  describe('integration', () => {
    it('should roundtrip config through read and write', async () => {
      const originalConfig: ClaudeSettings = {
        version: 1,
        model: 'claude-3-5-sonnet',
        env: {
          ANTHROPIC_MODEL: 'claude-3-5-sonnet',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        },
        mcpServers: {
          'fs-server': {
            command: 'mcp-server-fs',
            args: ['--root', '/home'],
          },
        },
        permissions: [{ allow: 'Bash' }],
        hooks: [{ match: 'PreToolUse', run: 'validator' }],
      };

      // Write
      await writeConfig(testFile, originalConfig);

      // Read back
      const result = await readConfig(testFile);

      expect(result).toEqual(originalConfig);
    });

    it('should handle multiple sequential writes with backups', async () => {
      const config1: ClaudeSettings = { version: 1 };
      const config2: ClaudeSettings = { version: 2 };
      const config3: ClaudeSettings = { version: 3 };

      await writeConfig(testFile, config1);
      // Small delay to ensure unique backup timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await writeConfig(testFile, config2);
      await new Promise(resolve => setTimeout(resolve, 10));
      await writeConfig(testFile, config3);

      // Should have 2 backups (for writes 2 and 3)
      const backupDir = path.join(tempDir, '.backups');
      const backups = await fs.readdir(backupDir);

      expect(backups.length).toBe(2);
    });
  });
});