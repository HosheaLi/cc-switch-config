/**
 * ExportService Tests
 *
 * Tests for export/import service.
 * Validates export, import, and conflict detection logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService, type ImportStrategy } from './export-service.js';
import { ServiceError } from './types.js';
import type { ProjectIndex, ProjectEntry } from '../store/index.js';
import type { ApiConfigStore } from '../store/index.js';
import type { ConfigService } from './config-service.js';
import type { ExportPayload, ConflictField } from '../types/export-schema.js';
import { migrateExportPayload } from '../types/export-schema.js';
import type { ClaudeSettings, ApiConfig } from '../types/index.js';
import { VERSION } from '../../version.js';

// Mock implementations
const createMockProjectIndex = (): ProjectIndex => ({
  getById: vi.fn(),
  getByPath: vi.fn(),
  register: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getAll: vi.fn(),
  clearCache: vi.fn(),
} as unknown as ProjectIndex);

const createMockApiConfigStore = (): ApiConfigStore => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  list: vi.fn(),
} as unknown as ApiConfigStore);

const createMockConfigService = (): ConfigService => ({
  readProjectConfig: vi.fn(),
  writeProjectConfig: vi.fn(),
  mergeTemplateWithConfig: vi.fn(),
  applyTemplate: vi.fn(),
} as unknown as ConfigService);

describe('ExportService', () => {
  let mockProjectIndex: ProjectIndex;
  let mockApiConfigStore: ApiConfigStore;
  let mockConfigService: ConfigService;
  let service: ExportService;

  beforeEach(() => {
    mockProjectIndex = createMockProjectIndex();
    mockApiConfigStore = createMockApiConfigStore();
    mockConfigService = createMockConfigService();
    service = new ExportService(mockProjectIndex, mockApiConfigStore, mockConfigService);
  });

  describe('exportProject', () => {
    it('should export project with config and no template', async () => {
      const project: ProjectEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'project',
        path: '/Users/test/project',
        activeConfig: null,
        lastModified: '2026-04-14T00:00:00.000Z',
      };
      const settings: ClaudeSettings = {
        model: 'claude-3-opus',
        env: { ANTHROPIC_MODEL: 'claude-3-opus' },
      };

      vi.mocked(mockProjectIndex.getById).mockResolvedValue(project);
      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue(settings);

      const payload = await service.exportProject(project.id);

      expect(payload.metadata.version).toBe('1.0');
      expect(payload.metadata.toolVersion).toBe(VERSION);
      expect(payload.project.id).toBe(project.id);
      expect(payload.project.path).toBe(project.path);
      expect(payload.project.name).toBe('project');
      expect(payload.settings).toEqual(settings);
      expect(payload.config).toBeNull();
    });

    it('should export project with config', async () => {
      const project: ProjectEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'project',
        path: '/Users/test/project',
        activeConfig: 'custom-provider',
        lastModified: '2026-04-14T00:00:00.000Z',
      };
      const settings: ClaudeSettings = { model: 'claude-3-opus' };
      const apiConfig: ApiConfig = {
        name: 'custom-provider',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.custom.com',
        mode: 'unified',
        modelName: 'Custom API',
      };

      vi.mocked(mockProjectIndex.getById).mockResolvedValue(project);
      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue(settings);
      vi.mocked(mockApiConfigStore.get).mockResolvedValue(apiConfig);

      const payload = await service.exportProject(project.id);

      expect(payload.config).toEqual(apiConfig);
    });

    it('should throw PROJECT_NOT_FOUND for missing project', async () => {
      vi.mocked(mockProjectIndex.getById).mockResolvedValue(null);

      await expect(service.exportProject('missing-id')).rejects.toThrow(ServiceError);

      try {
        await service.exportProject('missing-id');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('PROJECT_NOT_FOUND');
      }
    });

    it('should handle empty config (null returns empty object)', async () => {
      const project: ProjectEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'project',
        path: '/Users/test/project',
        activeConfig: null,
        lastModified: '2026-04-14T00:00:00.000Z',
      };

      vi.mocked(mockProjectIndex.getById).mockResolvedValue(project);
      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue(null);

      const payload = await service.exportProject(project.id);

      expect(payload.settings).toEqual({});
    });

    it('should use project name from entry', async () => {
      const project: ProjectEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'my-awesome-project',
        path: '/Users/test/my-awesome-project',
        activeConfig: null,
        lastModified: '2026-04-14T00:00:00.000Z',
      };

      vi.mocked(mockProjectIndex.getById).mockResolvedValue(project);
      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue(null);

      const payload = await service.exportProject(project.id);

      expect(payload.project.name).toBe('my-awesome-project');
    });
  });

  describe('detectConflicts', () => {
    it('should return empty array when no conflicts', () => {
      const imported: ClaudeSettings = { model: 'claude-3-opus' };
      const existing: ClaudeSettings = { model: 'claude-3-opus' };

      const conflicts = ExportService.detectConflicts(imported, existing);

      expect(conflicts).toEqual([]);
    });

    it('should detect env variable conflicts', () => {
      const imported: ClaudeSettings = {
        env: { ANTHROPIC_MODEL: 'claude-3-opus', ANTHROPIC_BASE_URL: 'https://new.api' },
      };
      const existing: ClaudeSettings = {
        env: { ANTHROPIC_MODEL: 'claude-2-opus', ANTHROPIC_BASE_URL: 'https://old.api' },
      };

      const conflicts = ExportService.detectConflicts(imported, existing);

      expect(conflicts.length).toBe(2);
      expect(conflicts.find(c => c.key === 'env.ANTHROPIC_MODEL')).toBeDefined();
      expect(conflicts.find(c => c.key === 'env.ANTHROPIC_BASE_URL')).toBeDefined();
    });

    it('should detect model conflict', () => {
      const imported: ClaudeSettings = { model: 'claude-3-opus' };
      const existing: ClaudeSettings = { model: 'claude-2-opus' };

      const conflicts = ExportService.detectConflicts(imported, existing);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].key).toBe('model');
      expect(conflicts[0].imported).toBe('claude-3-opus');
      expect(conflicts[0].existing).toBe('claude-2-opus');
    });

    it('should detect mcpServer conflicts', () => {
      const imported: ClaudeSettings = {
        mcpServers: {
          filesystem: { command: 'npx', args: ['-y', '@new/server'] },
        },
      };
      const existing: ClaudeSettings = {
        mcpServers: {
          filesystem: { command: 'npx', args: ['-y', '@old/server'] },
        },
      };

      const conflicts = ExportService.detectConflicts(imported, existing);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].key).toBe('mcpServers.filesystem');
    });

    it('should not detect conflict when imported key not in existing', () => {
      const imported: ClaudeSettings = {
        env: { NEW_VAR: 'new-value' },
      };
      const existing: ClaudeSettings = {
        env: { OLD_VAR: 'old-value' },
      };

      const conflicts = ExportService.detectConflicts(imported, existing);

      // NEW_VAR is not in existing, so no conflict (will be added on merge)
      expect(conflicts).toEqual([]);
    });

    it('should detect permissions length conflict', () => {
      const imported: ClaudeSettings = {
        permissions: [{ allow: 'Bash(ls)' }, { allow: 'Read(*)' }],
      };
      const existing: ClaudeSettings = {
        permissions: [{ allow: 'Bash(ls)' }],
      };

      const conflicts = ExportService.detectConflicts(imported, existing);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].key).toBe('permissions');
    });

    it('should detect hooks length conflict', () => {
      const imported: ClaudeSettings = {
        hooks: [{ match: 'PreToolUse', run: 'echo before' }],
      };
      const existing: ClaudeSettings = {
        hooks: [],
      };

      const conflicts = ExportService.detectConflicts(imported, existing);

      // Empty array vs non-empty is a conflict
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].key).toBe('hooks');
    });
  });

  describe('importProject', () => {
    it('should import with overwrite strategy', async () => {
      const payload: ExportPayload = {
        metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
        project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/old/path' },
        settings: { model: 'claude-3-opus' },
        config: null,
      };
      const targetPath = '/Users/test/project';

      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue({ model: 'old' });

      await service.importProject(payload, targetPath, 'overwrite');

      // Should write imported settings directly (not merged)
      expect(mockConfigService.writeProjectConfig).toHaveBeenCalledWith(
        targetPath,
        payload.settings
      );
    });

    it('should import with merge strategy', async () => {
      const payload: ExportPayload = {
        metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
        project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/old/path' },
        settings: { model: 'claude-3-opus', env: { NEW_VAR: 'value' } },
        config: null,
      };
      const targetPath = '/Users/test/project';
      const existing: ClaudeSettings = { model: 'old', env: { OLD_VAR: 'old-value' } };

      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue(existing);

      await service.importProject(payload, targetPath, 'merge');

      // Should merge imported with existing
      expect(mockConfigService.writeProjectConfig).toHaveBeenCalledWith(
        targetPath,
        expect.objectContaining({
          model: 'claude-3-opus', // Overwritten
          env: expect.objectContaining({
            OLD_VAR: 'old-value', // Preserved
            NEW_VAR: 'value', // Added
          }),
        })
      );
    });

    it('should skip import with skip strategy', async () => {
      const payload: ExportPayload = {
        metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
        project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/old/path' },
        settings: { model: 'claude-3-opus' },
        config: null,
      };

      await service.importProject(payload, '/path', 'skip');

      // Should not write anything
      expect(mockConfigService.writeProjectConfig).not.toHaveBeenCalled();
    });

    it('should throw IMPORT_INVALID for invalid payload', async () => {
      const invalidPayload = {
        metadata: { version: '2.0' }, // Invalid version
        project: { id: 'invalid' }, // Invalid UUID
      };

      await expect(service.importProject(invalidPayload, '/path', 'merge')).rejects.toThrow(ServiceError);

      try {
        await service.importProject(invalidPayload, '/path', 'merge');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('IMPORT_INVALID');
      }
    });

    it('should handle null existing config in merge', async () => {
      const payload: ExportPayload = {
        metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
        project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/old/path' },
        settings: { model: 'claude-3-opus' },
        config: null,
      };

      vi.mocked(mockConfigService.readProjectConfig).mockResolvedValue(null);

      await service.importProject(payload, '/path', 'merge');

      expect(mockConfigService.writeProjectConfig).toHaveBeenCalledWith(
        '/path',
        payload.settings
      );
    });
  });
});

describe('detectConflicts standalone function', () => {
  it('should work without ExportService instance', () => {
    const imported: ClaudeSettings = { model: 'claude-3-opus' };
    const existing: ClaudeSettings = { model: 'claude-2-opus' };

    const conflicts = ExportService.detectConflicts(imported, existing);

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].key).toBe('model');
  });

  it('should return empty array for identical settings', () => {
    const settings: ClaudeSettings = { model: 'claude-3-opus', env: { KEY: 'value' } };

    const conflicts = ExportService.detectConflicts(settings, settings);

    expect(conflicts).toEqual([]);
  });
});

describe('ImportStrategy type', () => {
  it('should accept valid strategies', () => {
    const strategies: ImportStrategy[] = ['merge', 'overwrite', 'skip'];
    expect(strategies).toHaveLength(3);
  });
});

describe('migrateExportPayload', () => {
  it('should return payload unchanged if already new format (has config field)', () => {
    const newPayload: ExportPayload = {
      metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
      project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/test/project' },
      settings: { model: 'claude-3-opus' },
      config: {
        name: 'my-config',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3-opus',
      },
    };

    const result = migrateExportPayload(newPayload);

    expect(result.config).toEqual(newPayload.config);
    expect(result.metadata.version).toBe('1.0');
  });

  it('should migrate legacy payload with template to config', () => {
    const legacyPayload = {
      metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
      project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/test/project' },
      settings: { model: 'claude-3-opus' },
      template: {
        name: 'custom-provider',
        provider: {
          name: 'Custom API', // provider.name → modelName
          baseUrl: 'https://api.custom.com',
          authType: 'header',
          env: {
            ANTHROPIC_API_KEY: 'sk-test-key',
          },
        },
      },
    };

    const result = migrateExportPayload(legacyPayload);

    expect(result.config).toBeDefined();
    expect(result.config?.name).toBe('custom-provider');
    expect(result.config?.modelName).toBe('Custom API'); // provider.name → modelName
    expect(result.config?.apiKey).toBe('sk-test-key');
    expect(result.config?.baseUrl).toBe('https://api.custom.com');
    expect(result.config?.mode).toBe('unified');
  });

  it('should handle legacy payload with null template', () => {
    const legacyPayload = {
      metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
      project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/test/project' },
      settings: { model: 'claude-3-opus' },
      config: null,
    };

    const result = migrateExportPayload(legacyPayload);

    expect(result.config).toBeNull();
  });

  it('should throw error for invalid payload (neither template nor config)', () => {
    const invalidPayload = {
      metadata: { version: '1.0', exportedAt: '2026-04-14T00:00:00.000Z' },
      project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/test/project' },
      settings: { model: 'claude-3-opus' },
    };

    expect(() => migrateExportPayload(invalidPayload)).toThrow('Invalid export payload');
  });
});