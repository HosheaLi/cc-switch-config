import { describe, it, expect } from 'vitest';
import type { ProjectEntry } from '../../lib/store/project.js';
import { formatProjectTable, truncatePath } from './table.js';

describe('table formatter', () => {
  const mockProject: ProjectEntry = {
    id: 'test-uuid',
    path: '/Users/test/my-project',
    activeConfig: 'anthropic-template',
    lastModified: '2026-04-14T00:00:00Z',
  };

  const mockProjectNoConfig: ProjectEntry = {
    id: 'test-uuid-2',
    path: '/Users/test/another-project',
    activeConfig: null,
    lastModified: '2026-04-14T00:00:00Z',
  };

  describe('formatProjectTable', () => {
    it('returns message for empty list', () => {
      const result = formatProjectTable([]);
      expect(result).toContain('No projects registered');
    });

    it('returns table string for single project', () => {
      const result = formatProjectTable([mockProject]);
      expect(result).toContain('Project');
      expect(result).toContain('Path');
      expect(result).toContain('Config');
      expect(result).toContain('Status');
    });

    it('displays project name extracted from path', () => {
      const result = formatProjectTable([mockProject]);
      expect(result).toContain('my-project');
    });

    it('displays active config name (truncated)', () => {
      const result = formatProjectTable([mockProject]);
      // Config name is truncated to column width (15 chars)
      expect(result).toContain('anthropic-te');
    });

    it('displays none for projects without config', () => {
      const result = formatProjectTable([mockProjectNoConfig]);
      expect(result).toContain('none');
    });

    it('includes status icon for active projects', () => {
      const result = formatProjectTable([mockProject]);
      expect(result).toContain('✓');
    });

    it('includes status icon for inactive projects', () => {
      const result = formatProjectTable([mockProjectNoConfig]);
      expect(result).toContain('○');
    });
  });

  describe('truncatePath', () => {
    it('returns original path if short', () => {
      const path = '/short/path';
      expect(truncatePath(path, 40)).toBe(path);
    });

    it('truncates long path with ellipsis', () => {
      const longPath = '/Users/test/very/long/path/to/project/directory';
      const result = truncatePath(longPath, 20);
      expect(result.length).toBe(20);
      expect(result.startsWith('...')).toBe(true);
    });
  });
});