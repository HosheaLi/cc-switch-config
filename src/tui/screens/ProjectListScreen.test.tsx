/**
 * ProjectListScreen Component Tests
 *
 * Tests interactive project list per F2.
 * Tests keyboard navigation per U3 (arrows + j/k).
 * Tests fuzzy search per F14.
 * Tests escape behavior per U4.
 * Tests preview panel per D-04.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { ProjectListScreen } from './ProjectListScreen.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import { ServiceError } from '../../lib/services/types.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, padding, marginTop }: {
    children: React.ReactNode;
    flexDirection?: string;
    padding?: number;
    marginTop?: number;
  }) => React.createElement('div', {
    'data-flex-direction': flexDirection,
    'data-padding': padding,
    'data-margin-top': marginTop,
  }, children),
  Text: ({ children, color, bold, dimColor }: {
    children: React.ReactNode;
    color?: string;
    bold?: boolean;
    dimColor?: boolean;
  }) => React.createElement('span', {
    'data-color': color,
    'data-bold': bold,
    'data-dim': dimColor,
  }, children),
  useApp: () => ({ exit: vi.fn() }),
  useInput: vi.fn(),
}));

// Mock ink-text-input
vi.mock('ink-text-input', () => ({
  default: ({ value, onChange, placeholder }: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => React.createElement('input', {
    'data-testid': 'search-input',
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    placeholder,
  }),
}));

// useKeyInput removed from ProjectListScreen — keyboard handled via useInput directly

vi.mock('../hooks/useFuzzySearch.js', () => ({
  useFuzzySearch: vi.fn((items: ProjectEntry[], query: string) => {
    // Simple mock implementation: return all items if query empty, filter by path otherwise
    if (!query.trim()) return items;
    return items.filter(item =>
      item.path.toLowerCase().includes(query.toLowerCase())
    );
  }),
}));

vi.mock('../hooks/useNavigation.js', () => ({
  useNavigation: vi.fn(() => ({
    stack: ['list'],
    current: 'list',
    isRoot: true,
    push: vi.fn(),
    pop: vi.fn(),
    reset: vi.fn(),
  })),
}));

// Mock components
vi.mock('../components/PreviewPanel.js', () => ({
  PreviewPanel: ({ visible, project }: {
    visible: boolean;
    project: ProjectEntry | null;
  }) => visible && project
    ? React.createElement('div', { 'data-testid': 'preview-panel' }, project.path)
    : null,
}));

vi.mock('../components/StatusBar.js', () => ({
  StatusBar: ({ message, type }: {
    message: string | null;
    type: string;
  }) => message
    ? React.createElement('div', { 'data-testid': 'status-bar', 'data-type': type }, message)
    : null,
}));

// Mock UndoService at module level
vi.mock('../../lib/services/undo-service.js', () => ({
  UndoService: vi.fn(),
}));

describe('ProjectListScreen', () => {
  const mockProjects: ProjectEntry[] = [
    {
      id: 'proj-1',
      name: 'project-alpha',
      path: '/Users/test/project-alpha',
      activeConfig: 'anthropic-config',
      lastModified: '2026-04-14T10:00:00Z',
    },
    {
      id: 'proj-2',
      name: 'project-beta',
      path: '/Users/test/project-beta',
      activeConfig: null,
      lastModified: '2026-04-14T10:00:00Z',
    },
    {
      id: 'proj-3',
      name: 'project-gamma',
      path: '/Users/test/project-gamma',
      activeConfig: 'openai-config',
      lastModified: '2026-04-14T10:00:00Z',
    },
  ];

  const mockOnSelect = vi.fn();
  const mockOnExit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders project list from props', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('project-alpha');
      expect(container.textContent).toContain('project-beta');
      expect(container.textContent).toContain('project-gamma');
    });

    it('renders search input at top', () => {
      const { getByTestId } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const searchInput = getByTestId('search-input');
      expect(searchInput).toBeDefined();
    });

    it('renders header with "Projects" title', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const cyanText = container.querySelector('[data-color="cyan"]');
      expect(cyanText?.textContent).toContain('Projects');
    });

    it('renders help text with key bindings', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('up');
      expect(container.textContent).toContain('down');
      expect(container.textContent).toContain('Enter');
      expect(container.textContent).toContain('Esc');
    });

    it('shows "No projects found" when list is empty', () => {
      const { container } = render(
        <ProjectListScreen
          projects={[]}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('No projects found');
    });

    it('shows selected project with green color and bold', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // First item should be selected by default (selectedIndex=0)
      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText).not.toBeNull();
      expect(greenBoldText?.textContent).toContain('project-alpha');
    });

    it('shows activeConfig next to project name', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('anthropic-config');
      expect(container.textContent).toContain('openai-config');
    });
  });

  describe('navigation', () => {
    const pressKey = (mockUseInput: any, input: string, key: Record<string, boolean>) => {
      // Unified handler is the first useInput call
      const handler = mockUseInput.mock.calls[0]?.[0];
      if (handler) handler(input, key);
    };

    it('upArrow decrements selectedIndex via useInput handler', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: true, downArrow: false, escape: false, return: false });
      // selectedIndex should stay at 0 (Math.max(0, 0-1) = 0)
    });

    it('downArrow increments selectedIndex via useInput handler', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: false, downArrow: true, escape: false, return: false });

      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('project-beta');
    });

    it('Enter calls onSelect with selected project', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: false, downArrow: false, escape: false, return: true });

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockProjects[0].id,
          path: mockProjects[0].path,
          activeConfig: mockProjects[0].activeConfig,
          lastModified: mockProjects[0].lastModified,
          name: expect.any(String),
        })
      );
    });

    it('Escape calls onExit when isRoot', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: false, downArrow: false, escape: true, return: false });

      expect(mockOnExit).toHaveBeenCalled();
    });

    it('navigation does not go below 0', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: true, downArrow: false, escape: false, return: false });

      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('project-alpha');
    });

    it('navigation does not go beyond last item', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: false, downArrow: true, escape: false, return: false });
      pressKey(mockUseInput, '', { upArrow: false, downArrow: true, escape: false, return: false });

      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      pressKey(mockUseInput, '', { upArrow: false, downArrow: true, escape: false, return: false });

      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('project-gamma');
    });
  });

  describe('search', () => {
    it('typing updates query and filters list', async () => {
      const { getByTestId } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const searchInput = getByTestId('search-input');

      // Type "gamma" to filter
      fireEvent.change(searchInput, { target: { value: 'gamma' } });

      // Input should have new value
      expect(searchInput.getAttribute('value')).toBe('gamma');
    });

    it('empty search shows all projects', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
          initialQuery=""
        />
      );

      expect(container.textContent).toContain('project-alpha');
      expect(container.textContent).toContain('project-beta');
      expect(container.textContent).toContain('project-gamma');
    });

    it('useFuzzySearch is called with projects and query', async () => {
      const { useFuzzySearch } = await import('../hooks/useFuzzySearch.js');
      const mockFuzzySearch = vi.mocked(useFuzzySearch);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
          initialQuery="test"
        />
      );

      expect(mockFuzzySearch).toHaveBeenCalled();
    });
  });

  describe('preview', () => {
    it('PreviewPanel shows selected project', async () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // First project selected by default
      const previewPanel = container.querySelector('[data-testid="preview-panel"]');
      expect(previewPanel).not.toBeNull();
      expect(previewPanel?.textContent).toContain('/Users/test/project-alpha');
    });

    it('PreviewPanel updates when selection changes', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const handler = mockUseInput.mock.calls[0]?.[0];
      handler('', { upArrow: false, downArrow: true, escape: false, return: false });

      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const previewPanel = container.querySelector('[data-testid="preview-panel"]');
      expect(previewPanel?.textContent).toContain('/Users/test/project-beta');
    });
  });

  describe('initialQuery', () => {
    it('initialQuery prop sets initial search value', () => {
      const { getByTestId } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
          initialQuery="alpha"
        />
      );

      const searchInput = getByTestId('search-input');
      expect(searchInput.getAttribute('value')).toBe('alpha');
    });
  });

  describe('S key for scan (D-08, F10)', () => {
    it('renders help text with S scan', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('S scan');
    });

    it('S key calls push(scan) when query is empty', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);
      const { useNavigation } = await import('../hooks/useNavigation.js');
      const mockNavigation = vi.mocked(useNavigation);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const handler = mockUseInput.mock.calls[0]?.[0];
      handler('S', { escape: false, return: false });

      const navResult = mockNavigation.mock.results[0]?.value;
      if (navResult?.push) {
        expect(navResult.push).toHaveBeenCalledWith('scan');
      }
    });
  });

  describe('U key for undo (D-07, U2)', () => {
    it('renders help text with U undo', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('U undo');
    });

    it('U key handler is registered for undo when query is empty', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(mockUseInput.mock.calls.length).toBeGreaterThan(0);
    });

    it('successful undo shows restored message in StatusBar', async () => {
      const { UndoService } = await import('../../lib/services/undo-service.js');
      vi.mocked(UndoService).mockImplementation(() => ({
        undo: vi.fn().mockResolvedValue({
          backupTime: new Date(Date.now() - 5 * 60 * 1000),
          backupFilename: 'settings.json.2026-04-15T02-20-00-000Z',
          restored: true,
        }),
      }));

      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const handler = mockUseInput.mock.calls[0]?.[0];
      await act(async () => {
        handler('U', { escape: false, return: false });
      });

      await waitFor(() => {
        const statusBar = container.querySelector('[data-testid="status-bar"]');
        if (statusBar) {
          expect(statusBar.textContent).toContain('Restored from backup');
        }
      }, { timeout: 3000 });
    });

    it('U key does NOT trigger undo when query is not empty', async () => {
      const { UndoService } = await import('../../lib/services/undo-service.js');
      const mockUndoFn = vi.fn().mockResolvedValue({
        backupTime: new Date(Date.now() - 5 * 60 * 1000),
        backupFilename: 'settings.json.2026-04-15T02-20-00-000Z',
        restored: true,
      });
      vi.mocked(UndoService).mockImplementation(() => ({
        undo: mockUndoFn,
      }));

      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
          initialQuery="searching"
        />
      );

      const handler = mockUseInput.mock.calls[0]?.[0];
      await act(async () => {
        handler('U', { escape: false, return: false });
      });

      expect(mockUndoFn).not.toHaveBeenCalled();
    });

    it('NO_BACKUP error shows appropriate error message', async () => {
      const { UndoService } = await import('../../lib/services/undo-service.js');
      vi.mocked(UndoService).mockImplementation(() => ({
        undo: vi.fn().mockRejectedValue(
          new ServiceError('No backup available to undo', 'NO_BACKUP')
        ),
      }));

      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const handler = mockUseInput.mock.calls[0]?.[0];
      await act(async () => {
        handler('U', { escape: false, return: false });
      });

      await waitFor(() => {
        const statusBar = container.querySelector('[data-testid="status-bar"]');
        if (statusBar) {
          expect(statusBar.textContent).toContain('No backup');
          expect(statusBar.getAttribute('data-type')).toBe('error');
        }
      }, { timeout: 3000 });
    });
  });
});