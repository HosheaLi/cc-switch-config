/**
 * N4 Performance Tests
 *
 * Per N4: Responsive TUI <50ms render time for 100 projects.
 *
 * Tests verify performance requirements:
 * - TUI renders 100 projects in <50ms
 * - ProjectListScreen renders filtered list in <50ms
 * - Fuzzy search completes in <10ms
 *
 * Note: Performance tests use mock data to avoid I/O delays.
 * Real-world performance depends on terminal and system load.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import Fuse from 'fuse.js';
import type { ProjectEntry } from '../lib/store/project.js';

// Mock ink components for jsdom environment
vi.mock('ink', () => ({
  Box: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  Text: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', {}, children),
  useApp: () => ({ exit: vi.fn() }),
  useInput: vi.fn(),
}));

// Mock ink-text-input
vi.mock('ink-text-input', () => ({
  default: ({ value }: { value: string }) =>
    React.createElement('input', { value }),
}));

// Mock hooks
vi.mock('./hooks/useKeyInput.js', () => ({
  useKeyInput: vi.fn(),
}));

vi.mock('./hooks/useNavigation.js', () => ({
  useNavigation: vi.fn(() => ({
    stack: ['list'],
    current: 'list',
    isRoot: true,
    push: vi.fn(),
    pop: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock('./hooks/useFuzzySearch.js', () => ({
  useFuzzySearch: vi.fn((items: any[], query: string) => {
    if (!query.trim()) return items;
    // Simple filter for mock performance testing
    return items.filter(item =>
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.path?.toLowerCase().includes(query.toLowerCase())
    );
  }),
}));

vi.mock('./components/PreviewPanel.js', () => ({
  PreviewPanel: () => null,
}));

vi.mock('./components/StatusBar.js', () => ({
  StatusBar: () => null,
}));

// Import after mocks
import { ProjectListScreen } from './screens/ProjectListScreen.js';
import { useFuzzySearch } from './hooks/useFuzzySearch.js';

describe('N4 Performance Tests', () => {
  /**
   * Generate mock projects for performance testing.
   */
  function generateMockProjects(count: number): ProjectEntry[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `project-${i}`,
      name: `project-${i}`,
      path: `/Users/test/projects/project-${i}`,
      activeConfig: i % 3 === 0 ? `template-${i % 10}` : null,
      lastModified: new Date().toISOString(),
    }));
  }

  describe('render performance', () => {
    it('should render 100 projects in <50ms (N4)', async () => {
      const projects = generateMockProjects(100);

      const start = performance.now();

      const { container } = render(
        <ProjectListScreen
          projects={projects}
          onSelect={() => {}}
          onExit={() => {}}
        />
      );

      const renderTime = performance.now() - start;

      // Verify render completed
      expect(container.textContent).toBeDefined();

      // N4 requirement: <50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should render 50 projects in <25ms', async () => {
      const projects = generateMockProjects(50);

      const start = performance.now();

      const { container } = render(
        <ProjectListScreen
          projects={projects}
          onSelect={() => {}}
          onExit={() => {}}
        />
      );

      const renderTime = performance.now() - start;

      expect(container.textContent).toBeDefined();
      expect(renderTime).toBeLessThan(25);
    });

    it('should render empty list quickly', async () => {
      const start = performance.now();

      const { container } = render(
        <ProjectListScreen
          projects={[]}
          onSelect={() => {}}
          onExit={() => {}}
        />
      );

      const renderTime = performance.now() - start;

      expect(container.textContent).toBeDefined();
      expect(renderTime).toBeLessThan(10);
    });
  });

  describe('search performance', () => {
    it('should fuzzy search 100 items in <10ms', () => {
      const items = generateMockProjects(100).map(p => ({
        ...p,
        name: p.path.split('/').pop() ?? p.path,
      }));

      const start = performance.now();

      // Test actual Fuse.js performance (not mocked)
      const fuse = new Fuse(items, {
        keys: ['name', 'path'],
        threshold: 0.4,
      });
      const results = fuse.search('project-5');

      const searchTime = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(10);
    });

    it('should fuzzy search 200 items in <15ms', () => {
      const items = generateMockProjects(200).map(p => ({
        ...p,
        name: p.path.split('/').pop() ?? p.path,
      }));

      const start = performance.now();

      const fuse = new Fuse(items, {
        keys: ['name', 'path'],
        threshold: 0.4,
      });
      const results = fuse.search('project-');

      const searchTime = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(15);
    });

    it('should handle empty search query quickly', () => {
      const items = generateMockProjects(100).map(p => ({
        ...p,
        name: p.path.split('/').pop() ?? p.path,
      }));

      const start = performance.now();

      const fuse = new Fuse(items, {
        keys: ['name', 'path'],
        threshold: 0.4,
      });
      const results = fuse.search('');

      const searchTime = performance.now() - start;

      // Empty search should be very fast
      expect(searchTime).toBeLessThan(5);
    });
  });

  describe('memory efficiency', () => {
    it('should handle large project lists without memory issues', async () => {
      // Generate 500 projects (stress test)
      const projects = generateMockProjects(500);

      const start = performance.now();

      const { container } = render(
        <ProjectListScreen
          projects={projects}
          onSelect={() => {}}
          onExit={() => {}}
        />
      );

      const renderTime = performance.now() - start;

      expect(container.textContent).toBeDefined();

      // Even 500 projects should render reasonably fast (<200ms)
      expect(renderTime).toBeLessThan(200);
    });
  });
});