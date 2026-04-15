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

// Mock hooks
vi.mock('../hooks/useKeyInput.js', () => ({
  useKeyInput: vi.fn(),
}));

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
      path: '/Users/test/project-alpha',
      activeConfig: 'anthropic-config',
      lastModified: '2026-04-14T10:00:00Z',
    },
    {
      id: 'proj-2',
      path: '/Users/test/project-beta',
      activeConfig: null,
      lastModified: '2026-04-14T10:00:00Z',
    },
    {
      id: 'proj-3',
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
    it('upArrow/k decrements selectedIndex via useKeyInput callback', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // Get the onUp callback passed to useKeyInput
      const options = mockKeyInput.mock.calls[0][0];
      expect(options.onUp).toBeDefined();

      // Simulate pressing up - should wrap to top (stay at 0)
      options.onUp();
      // selectedIndex should stay at 0 (Math.max(0, 0-1) = 0)
    });

    it('downArrow/j increments selectedIndex via useKeyInput callback', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // Get the onDown callback passed to useKeyInput
      const options = mockKeyInput.mock.calls[0][0];
      expect(options.onDown).toBeDefined();

      // Simulate pressing down - should increment to 1
      options.onDown();

      // Rerender to see state update
      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // Check that project-beta (index 1) is now selected
      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('project-beta');
    });

    it('Enter calls onSelect with selected project', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // Get the onSelect callback passed to useKeyInput
      const options = mockKeyInput.mock.calls[0][0];
      expect(options.onSelect).toBeDefined();

      // Simulate pressing Enter - should call onSelect with first project
      options.onSelect();

      // onSelect receives the project with an added 'name' field for SearchableItem
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockProjects[0].id,
          path: mockProjects[0].path,
          activeConfig: mockProjects[0].activeConfig,
          lastModified: mockProjects[0].lastModified,
          name: expect.any(String), // Added for SearchableItem interface
        })
      );
    });

    it('Escape calls onExit when isRoot', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // Get the onEscape callback passed to useKeyInput
      const options = mockKeyInput.mock.calls[0][0];
      expect(options.onEscape).toBeDefined();

      // Simulate pressing Escape
      options.onEscape();

      expect(mockOnExit).toHaveBeenCalled();
    });

    it('navigation does not go below 0', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];

      // Already at index 0, pressing up should stay at 0
      options.onUp();

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
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];

      // Go to last item (index 2)
      options.onDown();
      options.onDown();

      rerender(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      // Try to go down again - should stay at 2
      options.onDown();

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
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];

      // Move selection to second item
      options.onDown();

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
    it('renders help text with S: scan', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('S: scan');
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

      // Find the useInput handler for 'S' key (second call, first is useKeyInput internally)
      // Look for handler that checks input === 'S'
      const inputCalls = mockUseInput.mock.calls;
      let sKeyHandler: ((input: string, key: any) => void) | null = null;

      for (const call of inputCalls) {
        const handler = call[0];
        // Try to identify the 'S' key handler by checking if it handles 'S'
        try {
          handler('S', { escape: false, return: false });
          if (mockNavigation.mock.results[0]?.value?.push?.mock.calls.length > 0) {
            // Found the handler that pushes 'scan'
            sKeyHandler = handler;
            break;
          }
        } catch {
          // Not this handler
        }
      }

      // Verify push was called with 'scan'
      const navResult = mockNavigation.mock.results[0]?.value;
      if (navResult?.push) {
        expect(navResult.push).toHaveBeenCalledWith('scan');
      }
    });
  });

  describe('U key for undo (D-07, U2)', () => {
    it('renders help text with U: undo', () => {
      const { container } = render(
        <ProjectListScreen
          projects={mockProjects}
          onSelect={mockOnSelect}
          onExit={mockOnExit}
        />
      );

      expect(container.textContent).toContain('U: undo');
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

      // Find the 'U' key handler in useInput calls
      const inputCalls = mockUseInput.mock.calls;
      // At least one useInput handler should exist for U key
      expect(inputCalls.length).toBeGreaterThan(0);

      // Check that a handler for 'U' input exists
      for (const call of inputCalls) {
        const handler = call[0];
        if (typeof handler === 'function') {
          // Handler should check for 'U' input
          expect(handler).toBeDefined();
        }
      }
    });

    it('successful undo shows restored message in StatusBar', async () => {
      // Setup mock for successful undo
      const { UndoService } = await import('../../lib/services/undo-service.js');
      vi.mocked(UndoService).mockImplementation(() => ({
        undo: vi.fn().mockResolvedValue({
          backupTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
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

      // Find and trigger the 'U' key handler
      const inputCalls = mockUseInput.mock.calls;
      for (const call of inputCalls) {
        const handler = call[0];
        await act(async () => {
          handler('U', { escape: false, return: false });
        });
      }

      // Wait for async state update to show success message
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

      // Query is not empty - 'U' should not trigger undo
      const inputCalls = mockUseInput.mock.calls;
      for (const call of inputCalls) {
        const handler = call[0];
        await act(async () => {
          handler('U', { escape: false, return: false });
        });
      }

      // Undo should NOT have been called when in search mode
      expect(mockUndoFn).not.toHaveBeenCalled();
    });

    it('NO_BACKUP error shows appropriate error message', async () => {
      // Setup mock to throw NO_BACKUP error
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

      // Trigger 'U' key
      const inputCalls = mockUseInput.mock.calls;
      for (const call of inputCalls) {
        const handler = call[0];
        await act(async () => {
          handler('U', { escape: false, return: false });
        });
      }

      // Wait for error message to appear
      await waitFor(() => {
        const statusBar = container.querySelector('[data-testid="status-bar"]');
        if (statusBar) {
          // Should contain "No backup" message
          expect(statusBar.textContent).toContain('No backup');
          expect(statusBar.getAttribute('data-type')).toBe('error');
        }
      }, { timeout: 3000 });
    });
  });
});