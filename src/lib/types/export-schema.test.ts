/**
 * Export Schema Tests
 *
 * Tests for export/import Zod schemas.
 * Validates schema structure, field requirements, and strict mode behavior.
 */

import { describe, it, expect } from 'vitest';
import {
  ExportMetadataSchema,
  ProjectRefSchema,
  ExportPayloadSchema,
  type ExportMetadata,
  type ProjectRef,
  type ExportPayload,
  type ConflictField,
} from './export-schema.js';

describe('ExportMetadataSchema', () => {
  it('should validate valid metadata with all fields', () => {
    const validMetadata = {
      version: '1.0',
      exportedAt: '2026-04-14T12:00:00.000Z',
      toolVersion: '0.1.0',
    };
    const result = ExportMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe('1.0');
      expect(result.data.exportedAt).toBe('2026-04-14T12:00:00.000Z');
      expect(result.data.toolVersion).toBe('0.1.0');
    }
  });

  it('should validate metadata without optional toolVersion', () => {
    const validMetadata = {
      version: '1.0',
      exportedAt: '2026-04-14T12:00:00.000Z',
    };
    const result = ExportMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should reject invalid version (not literal 1.0)', () => {
    const invalidMetadata = {
      version: '2.0',
      exportedAt: '2026-04-14T12:00:00.000Z',
    };
    const result = ExportMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const invalidMetadata = {
      version: '1.0',
      exportedAt: 'not-a-datetime',
    };
    const result = ExportMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject unknown fields (strict mode)', () => {
    const invalidMetadata = {
      version: '1.0',
      exportedAt: '2026-04-14T12:00:00.000Z',
      unknownField: 'value',
    };
    const result = ExportMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });
});

describe('ProjectRefSchema', () => {
  it('should validate valid project ref with all fields', () => {
    const validRef = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      path: '/Users/test/project',
      name: 'My Project',
    };
    const result = ProjectRefSchema.safeParse(validRef);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data.path).toBe('/Users/test/project');
      expect(result.data.name).toBe('My Project');
    }
  });

  it('should validate project ref without optional name', () => {
    const validRef = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      path: '/Users/test/project',
    };
    const result = ProjectRefSchema.safeParse(validRef);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID format', () => {
    const invalidRef = {
      id: 'not-a-uuid',
      path: '/Users/test/project',
    };
    const result = ProjectRefSchema.safeParse(invalidRef);
    expect(result.success).toBe(false);
  });

  it('should reject missing required path', () => {
    const invalidRef = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };
    const result = ProjectRefSchema.safeParse(invalidRef);
    expect(result.success).toBe(false);
  });

  it('should reject unknown fields (strict mode)', () => {
    const invalidRef = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      path: '/Users/test/project',
      unknownField: 'value',
    };
    const result = ProjectRefSchema.safeParse(invalidRef);
    expect(result.success).toBe(false);
  });
});

describe('ExportPayloadSchema', () => {
  it('should validate valid payload with config', () => {
    const validPayload = {
      metadata: {
        version: '1.0',
        exportedAt: '2026-04-14T12:00:00.000Z',
        toolVersion: '0.1.0',
      },
      project: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        path: '/Users/test/project',
        name: 'Test Project',
      },
      settings: {
        model: 'claude-3-opus',
        env: {
          ANTHROPIC_MODEL: 'claude-3-opus',
        },
      },
      config: {
        name: 'custom-provider',
        apiKey: 'sk-test-api-key',
        baseUrl: 'https://api.custom.com',
        mode: 'unified',
        modelName: 'claude-3-opus',
      },
    };
    const result = ExportPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should validate valid payload without config (nullable)', () => {
    const validPayload = {
      metadata: {
        version: '1.0',
        exportedAt: '2026-04-14T12:00:00.000Z',
      },
      project: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        path: '/Users/test/project',
      },
      settings: {
        model: 'claude-3-opus',
      },
      config: null,
    };
    const result = ExportPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject missing required settings', () => {
    const invalidPayload = {
      metadata: {
        version: '1.0',
        exportedAt: '2026-04-14T12:00:00.000Z',
      },
      project: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        path: '/Users/test/project',
      },
      // Missing 'settings' field
      config: null,
    };
    const result = ExportPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject unknown fields in settings (strict ClaudeSettingsSchema)', () => {
    const invalidPayload = {
      metadata: {
        version: '1.0',
        exportedAt: '2026-04-14T12:00:00.000Z',
      },
      project: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        path: '/Users/test/project',
      },
      settings: {},
      config: null,
      unknownPayloadField: 'value', // Unknown field at payload level
    };
    const result = ExportPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject unknown fields in payload (strict mode)', () => {
    const invalidPayload = {
      metadata: {
        version: '1.0',
        exportedAt: '2026-04-14T12:00:00.000Z',
      },
      project: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        path: '/Users/test/project',
      },
      settings: {},
      config: null,
      unknownPayloadField: 'value', // Unknown field
    };
    const result = ExportPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should validate complex settings with mcpServers', () => {
    const validPayload = {
      metadata: {
        version: '1.0',
        exportedAt: '2026-04-14T12:00:00.000Z',
      },
      project: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        path: '/Users/test/project',
      },
      settings: {
        version: 1,
        model: 'claude-3-opus',
        env: {
          ANTHROPIC_MODEL: 'claude-3-opus',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        },
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@anthropic/mcp-server-filesystem'],
          },
        },
        permissions: [
          { allow: 'Bash(ls)' },
        ],
        hooks: [
          { match: 'PreToolUse', run: 'echo "before"' },
        ],
      },
      config: null,
    };
    const result = ExportPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});

describe('ConflictField interface', () => {
  it('should allow valid ConflictField objects', () => {
    const conflict: ConflictField = {
      key: 'env.ANTHROPIC_MODEL',
      imported: 'claude-3-opus',
      existing: 'claude-2-opus',
    };
    expect(conflict.key).toBe('env.ANTHROPIC_MODEL');
    expect(conflict.imported).toBe('claude-3-opus');
    expect(conflict.existing).toBe('claude-2-opus');
  });

  it('should allow ConflictField with null values', () => {
    const conflict: ConflictField = {
      key: 'model',
      imported: 'claude-3-opus',
      existing: null,
    };
    expect(conflict.key).toBe('model');
    expect(conflict.existing).toBeNull();
  });

  it('should allow ConflictField with object values', () => {
    const conflict: ConflictField = {
      key: 'mcpServers.filesystem',
      imported: { command: 'npx', args: ['server'] },
      existing: { command: 'node', args: ['old-server'] },
    };
    expect(conflict.key).toBe('mcpServers.filesystem');
    expect(typeof conflict.imported).toBe('object');
  });
});

describe('Type exports', () => {
  it('should export ExportMetadata type', () => {
    const metadata: ExportMetadata = {
      version: '1.0',
      exportedAt: '2026-04-14T12:00:00.000Z',
    };
    expect(metadata.version).toBe('1.0');
  });

  it('should export ProjectRef type', () => {
    const ref: ProjectRef = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      path: '/path/to/project',
    };
    expect(ref.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should export ExportPayload type', () => {
    const payload: ExportPayload = {
      metadata: { version: '1.0', exportedAt: '2026-04-14T12:00:00.000Z' },
      project: { id: '550e8400-e29b-41d4-a716-446655440000', path: '/path' },
      settings: {},
      config: null,
    };
    expect(payload.metadata.version).toBe('1.0');
  });
});