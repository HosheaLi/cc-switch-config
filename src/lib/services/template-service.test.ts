/**
 * TemplateService Tests
 *
 * Tests for template management service.
 * Per F7: TemplateService handles template CRUD and application to project config.
 * Per D-01: Constructor injection with TemplateStore.
 * Per D-02: ServiceError on failures.
 * Per D-03: Deep merge preserves non-template fields.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TemplateService } from './template-service.js';
import { TemplateStore } from '../store/template.js';
import { readConfig, writeConfig } from '../store/config.js';
import { ServiceError } from './types.js';
import type { TemplateConfig } from '../types/provider.js';
import type { ClaudeSettings } from '../types/config.js';

describe('TemplateService', () => {
  let tempDir: string;
  let templatesPath: string;
  let projectDir: string;
  let projectConfigPath: string;
  let templateStore: TemplateStore;
  let service: TemplateService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-service-test-'));
    templatesPath = path.join(tempDir, 'templates.json');
    projectDir = path.join(tempDir, 'project');
    projectConfigPath = path.join(projectDir, '.claude', 'settings.json');

    await fs.ensureDir(path.dirname(projectConfigPath));
    templateStore = new TemplateStore(templatesPath);
    service = new TemplateService(templateStore, readConfig, writeConfig);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('createTemplate', () => {
    it('createTemplate saves template config', async () => {
      const config: TemplateConfig = {
        name: 'test-template',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
        },
      };

      await service.createTemplate('test-template', config);
      const result = await service.getTemplate('test-template');

      expect(result).toBeDefined();
      expect(result?.provider.name).toBe('claude-3-opus');
      expect(result?.provider.baseUrl).toBe('https://api.anthropic.com');
    });

    it('createTemplate sets createdAt timestamp', async () => {
      const config: TemplateConfig = {
        name: 'timestamp-test',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
        },
      };

      await service.createTemplate('timestamp-test', config);
      const result = await service.getTemplate('timestamp-test');

      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe('getTemplate', () => {
    it('getTemplate retrieves by name', async () => {
      const config: TemplateConfig = {
        name: 'get-test',
        provider: {
          name: 'claude-3-sonnet',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
          env: { ANTHROPIC_MODEL: 'claude-3-sonnet' },
        },
      };

      await templateStore.set('get-test', config);
      const result = await service.getTemplate('get-test');

      expect(result).toBeDefined();
      expect(result?.provider.name).toBe('claude-3-sonnet');
      expect(result?.provider.env?.ANTHROPIC_MODEL).toBe('claude-3-sonnet');
    });

    it('getTemplate returns null for non-existent', async () => {
      const result = await service.getTemplate('non-existent');

      expect(result).toBeNull();
    });

    it('getTemplate returns complete template data', async () => {
      const config: TemplateConfig = {
        name: 'complete-test',
        description: 'Complete template with all fields',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
          headers: { 'X-Custom': 'value' },
          env: { ANTHROPIC_MODEL: 'claude-3-opus' },
        },
        tags: ['production', 'high-priority'],
      };

      await templateStore.set('complete-test', config);
      const result = await service.getTemplate('complete-test');

      expect(result).toBeDefined();
      expect(result?.description).toBe('Complete template with all fields');
      expect(result?.provider.headers?.['X-Custom']).toBe('value');
      expect(result?.tags).toEqual(['production', 'high-priority']);
    });
  });

  describe('listTemplates', () => {
    it('listTemplates returns all templates', async () => {
      const templates = [
        { name: 'template-a', provider: { name: 'a', baseUrl: 'https://a.com', authType: 'token' as const } },
        { name: 'template-b', provider: { name: 'b', baseUrl: 'https://b.com', authType: 'token' as const } },
        { name: 'template-c', provider: { name: 'c', baseUrl: 'https://c.com', authType: 'token' as const } },
      ];

      for (const t of templates) {
        await templateStore.set(t.name, t);
      }

      const result = await service.listTemplates();

      expect(result).toHaveLength(3);
      expect(result).toContain('template-a');
      expect(result).toContain('template-b');
      expect(result).toContain('template-c');
    });

    it('listTemplates returns empty array when no templates', async () => {
      const result = await service.listTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('updateTemplate', () => {
    it('updateTemplate modifies existing template', async () => {
      const original: TemplateConfig = {
        name: 'update-test',
        provider: {
          name: 'original-provider',
          baseUrl: 'https://original.com',
          authType: 'token',
        },
      };

      await templateStore.set('update-test', original);

      const updated: TemplateConfig = {
        name: 'update-test',
        provider: {
          name: 'updated-provider',
          baseUrl: 'https://updated.com',
          authType: 'header',
        },
      };

      await service.updateTemplate('update-test', updated);
      const result = await service.getTemplate('update-test');

      expect(result?.provider.name).toBe('updated-provider');
      expect(result?.provider.baseUrl).toBe('https://updated.com');
      expect(result?.provider.authType).toBe('header');
    });

    it('updateTemplate throws for non-existent template', async () => {
      const config: TemplateConfig = {
        name: 'non-existent',
        provider: {
          name: 'test',
          baseUrl: 'https://test.com',
          authType: 'token',
        },
      };

      await expect(service.updateTemplate('non-existent', config)).rejects.toThrow(ServiceError);
      await expect(service.updateTemplate('non-existent', config)).rejects.toMatchObject({
        code: 'TEMPLATE_NOT_FOUND',
      });
    });

    it('updateTemplate sets updatedAt timestamp', async () => {
      const original: TemplateConfig = {
        name: 'timestamp-update',
        provider: {
          name: 'original',
          baseUrl: 'https://original.com',
          authType: 'token',
        },
      };

      await templateStore.set('timestamp-update', original);
      const originalResult = await service.getTemplate('timestamp-update');
      const originalUpdatedAt = originalResult?.updatedAt;

      const updated: TemplateConfig = {
        name: 'timestamp-update',
        provider: {
          name: 'updated',
          baseUrl: 'https://updated.com',
          authType: 'token',
        },
      };

      await service.updateTemplate('timestamp-update', updated);
      const result = await service.getTemplate('timestamp-update');

      expect(result?.updatedAt).toBeDefined();
      // updatedAt should be newer
      expect(new Date(result?.updatedAt ?? '').getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt ?? '').getTime()
      );
    });
  });

  describe('deleteTemplate', () => {
    it('deleteTemplate removes from store', async () => {
      const config: TemplateConfig = {
        name: 'delete-test',
        provider: {
          name: 'to-delete',
          baseUrl: 'https://delete.com',
          authType: 'token',
        },
      };

      await templateStore.set('delete-test', config);
      await service.deleteTemplate('delete-test');
      const result = await service.getTemplate('delete-test');

      expect(result).toBeNull();
    });

    it('deleteTemplate returns true on success', async () => {
      const config: TemplateConfig = {
        name: 'delete-success',
        provider: {
          name: 'test',
          baseUrl: 'https://test.com',
          authType: 'token',
        },
      };

      await templateStore.set('delete-success', config);
      const result = await service.deleteTemplate('delete-success');

      expect(result).toBe(true);
    });

    it('deleteTemplate throws for non-existent', async () => {
      await expect(service.deleteTemplate('non-existent')).rejects.toThrow(ServiceError);
      await expect(service.deleteTemplate('non-existent')).rejects.toMatchObject({
        code: 'TEMPLATE_NOT_FOUND',
      });
    });
  });

  describe('applyTemplate', () => {
    it('applyTemplate merges with project config (D-03)', async () => {
      const template: TemplateConfig = {
        name: 'merge-test',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
          env: { ANTHROPIC_MODEL: 'claude-3-opus' },
        },
      };

      await service.createTemplate('merge-test', template);

      const existing: ClaudeSettings = {
        model: 'claude-3-sonnet',
        mcpServers: {
          'my-custom-server': { command: 'node', args: ['server.js'] },
        },
      };

      await writeConfig(projectConfigPath, existing);
      await service.applyTemplate(projectDir, 'merge-test');

      const result = await readConfig(projectConfigPath);

      expect(result?.env?.ANTHROPIC_MODEL).toBe('claude-3-opus');
      // D-03: Deep merge preserves mcpServers
      expect(result?.mcpServers?.['my-custom-server']).toBeDefined();
      expect(result?.mcpServers?.['my-custom-server']?.command).toBe('node');
    });

    it('applyTemplate preserves project-specific fields (D-03)', async () => {
      const template: TemplateConfig = {
        name: 'preserve-test',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
          env: { ANTHROPIC_MODEL: 'claude-3-opus' },
        },
      };

      await service.createTemplate('preserve-test', template);

      const existing: ClaudeSettings = {
        version: 1,
        model: 'claude-3-sonnet',
        permissions: [{ allow: 'read(**)' }],
        hooks: [{ match: 'PreToolUse', run: 'echo test' }],
      };

      await writeConfig(projectConfigPath, existing);
      await service.applyTemplate(projectDir, 'preserve-test');

      const result = await readConfig(projectConfigPath);

      // Template env applied
      expect(result?.env?.ANTHROPIC_MODEL).toBe('claude-3-opus');
      // Preserved fields (D-03)
      expect(result?.version).toBe(1);
      expect(result?.permissions).toHaveLength(1);
      expect(result?.hooks).toHaveLength(1);
    });

    it('applyTemplate throws for missing template', async () => {
      await expect(service.applyTemplate(projectDir, 'non-existent')).rejects.toThrow(ServiceError);
      await expect(service.applyTemplate(projectDir, 'non-existent')).rejects.toMatchObject({
        code: 'TEMPLATE_NOT_FOUND',
      });
    });

    it('applyTemplate works for project without existing config', async () => {
      const template: TemplateConfig = {
        name: 'new-project',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
          env: { ANTHROPIC_MODEL: 'claude-3-opus' },
        },
      };

      await service.createTemplate('new-project', template);
      await service.applyTemplate(projectDir, 'new-project');

      const result = await readConfig(projectConfigPath);

      expect(result).toBeDefined();
      expect(result?.env?.ANTHROPIC_MODEL).toBe('claude-3-opus');
    });

    it('applyTemplate creates .claude directory if missing', async () => {
      const template: TemplateConfig = {
        name: 'create-dir',
        provider: {
          name: 'claude-3-opus',
          baseUrl: 'https://api.anthropic.com',
          authType: 'token',
          env: { ANTHROPIC_MODEL: 'claude-3-opus' },
        },
      };

      await service.createTemplate('create-dir', template);

      // Remove the .claude directory created in beforeEach
      await fs.remove(path.dirname(projectConfigPath));

      await service.applyTemplate(projectDir, 'create-dir');

      const claudeDirExists = await fs.pathExists(path.dirname(projectConfigPath));
      expect(claudeDirExists).toBe(true);

      const result = await readConfig(projectConfigPath);
      expect(result?.env?.ANTHROPIC_MODEL).toBe('claude-3-opus');
    });
  });

  describe('getAllTemplates', () => {
    it('getAllTemplates returns all templates as record', async () => {
      const templates = [
        { name: 'all-a', provider: { name: 'a', baseUrl: 'https://a.com', authType: 'token' as const } },
        { name: 'all-b', provider: { name: 'b', baseUrl: 'https://b.com', authType: 'token' as const } },
      ];

      for (const t of templates) {
        await templateStore.set(t.name, t);
      }

      const result = await service.getAllTemplates();

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['all-a']).toBeDefined();
      expect(result['all-b']).toBeDefined();
    });

    it('getAllTemplates returns empty record when no templates', async () => {
      const result = await service.getAllTemplates();

      expect(result).toEqual({});
    });
  });

  describe('constructor injection', () => {
    it('constructor accepts TemplateStore and config functions', async () => {
      // Service already created in beforeEach with constructor injection
      expect(service).toBeDefined();

      // Test that the injected dependencies work
      const config: TemplateConfig = {
        name: 'injection-test',
        provider: {
          name: 'test',
          baseUrl: 'https://test.com',
          authType: 'token',
        },
      };

      await service.createTemplate('injection-test', config);
      const result = await service.getTemplate('injection-test');

      expect(result).toBeDefined();
    });
  });

  describe('ServiceError handling', () => {
    it('ServiceError thrown with correct code for template not found', async () => {
      try {
        await service.getTemplate('non-existent');
        // getTemplate returns null, not throw
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
      }

      // updateTemplate throws for non-existent
      await expect(service.updateTemplate('non-existent', {
        name: 'non-existent',
        provider: { name: 'test', baseUrl: 'https://test.com', authType: 'token' },
      })).rejects.toMatchObject({ code: 'TEMPLATE_NOT_FOUND' });
    });

    it('ServiceError thrown with correct code for apply template not found', async () => {
      await expect(service.applyTemplate(projectDir, 'missing-template')).rejects.toMatchObject({
        code: 'TEMPLATE_NOT_FOUND',
      });
    });
  });
});