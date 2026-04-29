import { describe, it, expect } from 'vitest';
import type { ProjectEntry } from '../../lib/store/project.js';
import { formatProjectTable, truncatePath } from './table.js';

describe('table formatter', () => {
  const mockProject: ProjectEntry = {
    id: 'test-uuid', name: 'my-project', path: '/Users/test/my-project', activeConfig: 'anthropic-template', lastModified: '2026-04-14T00:00:00Z',
  };
  const mockProjectNoConfig: ProjectEntry = {
    id: 'test-uuid-2', name: 'another-project', path: '/Users/test/another-project', activeConfig: null, lastModified: '2026-04-14T00:00:00Z',
  };

  describe('formatProjectTable', () => {
    it('returns message for empty list', () => { expect(formatProjectTable([])).toContain('No projects registered'); });
    it('returns table string for single project', () => {
      const result = formatProjectTable([mockProject]);
      expect(result).toContain('Project'); expect(result).toContain('Path'); expect(result).toContain('Config'); expect(result).toContain('Status');
    });
    it('displays project name extracted from path', () => { expect(formatProjectTable([mockProject])).toContain('my-project'); });
    it('displays active config name (truncated)', () => { expect(formatProjectTable([mockProject])).toContain('anthropic-te'); });
    it('displays none for projects without config', () => { expect(formatProjectTable([mockProjectNoConfig])).toContain('none'); });
    it('includes status icon for active projects', () => { expect(formatProjectTable([mockProject])).toContain('✓'); });
    it('includes status icon for inactive projects', () => { expect(formatProjectTable([mockProjectNoConfig])).toContain('○'); });
  });

  describe('truncatePath', () => {
    it('returns original path if short', () => { expect(truncatePath('/short/path', 40)).toBe('/short/path'); });
    it('truncates long path with ellipsis', () => {
      const result = truncatePath('/Users/test/very/long/path/to/project/directory', 20);
      expect(result.length).toBe(20); expect(result.startsWith('...')).toBe(true);
    });
  });
});
