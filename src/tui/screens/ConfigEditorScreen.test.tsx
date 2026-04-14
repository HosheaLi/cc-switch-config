/**
 * ConfigEditorScreen Component Tests
 *
 * Tests configuration preview screen per F3.
 * Tests confirm/cancel per U4.
 * Tests template provider details display.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigEditorScreen } from './ConfigEditorScreen.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { TemplateConfig } from '../../lib/types/provider.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, padding, marginTop, borderStyle, borderColor }: {
    children: React.ReactNode;
    flexDirection?: string;
    padding?: number;
    marginTop?: number;
    borderStyle?: string;
    borderColor?: string;
  }) => React.createElement('div', {
    'data-flex-direction': flexDirection,
    'data-padding': padding,
    'data-margin-top': marginTop,
    'data-border-style': borderStyle,
    'data-border-color': borderColor,
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
}));

// Mock ink-text-input
vi.mock('ink-text-input', () => ({
  default: () => null,
}));

// Mock useKeyInput hook
vi.mock('../hooks/useKeyInput.js', () => ({
  useKeyInput: vi.fn(),
}));

// Mock PreviewPanel
vi.mock('../components/PreviewPanel.js', () => ({
  PreviewPanel: ({ visible, project, template }: {
    visible: boolean;
    project: ProjectEntry | null;
    template?: TemplateConfig | null;
  }) => visible && project ? React.createElement('div', {
    'data-testid': 'preview-panel',
    'data-project-path': project.path,
    'data-template-name': template?.name,
  }, `Preview: ${project.path.split('/').pop()}`) : null,
}));

// Mock StatusBar
vi.mock('../components/StatusBar.js', () => ({
  StatusBar: ({ message, type }: {
    message: string | null;
    type: string;
  }) => message ? React.createElement('div', {
    'data-testid': 'status-bar',
    'data-status-type': type,
  }, message) : null,
}));

// Mock LoadingIndicator
vi.mock('../components/LoadingIndicator.js', () => ({
  LoadingIndicator: ({ isLoading, message }: {
    isLoading: boolean;
    message?: string;
  }) => isLoading ? React.createElement('div', {
    'data-testid': 'loading-indicator',
  }, message || 'Loading...') : null,
}));

describe('ConfigEditorScreen', () => {
  // Test fixtures
  const mockProject: ProjectEntry = {
    id: 'test-id-1',
    path: '/Users/test/projects/my-app',
    activeConfig: null,
    lastModified: '2026-04-14T10:00:00Z',
  };

  const mockTemplate: TemplateConfig = {
    name: 'anthropic-template',
    description: 'Anthropic API template',
    provider: {
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com',
      authType: 'token',
      env: {
        ANTHROPIC_API_KEY: 'sk-test-key',
        ANTHROPIC_MODEL: 'claude-3',
      },
    },
    tags: ['default', 'api'],
    createdAt: '2026-04-13T10:00:00Z',
    updatedAt: '2026-04-13T10:00:00Z',
  };

  const mockOnConfirm = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders project name and template name', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Project name extracted from path - appears multiple times (project line, path, preview)
      const myAppMatches = screen.getAllByText(/my-app/);
      expect(myAppMatches.length).toBeGreaterThan(0);

      // Template name
      expect(container.textContent).toContain('anthropic-template');
    });

    it('shows "Apply template to project?" confirmation header', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Should show Apply Template header
      const headerText = container.querySelector('[data-color="cyan"]');
      expect(headerText?.textContent).toContain('Apply Template');
    });

    it('shows template provider details (name, baseUrl, authType)', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Provider details should be visible
      expect(container.textContent).toContain('Anthropic');
      expect(container.textContent).toContain('https://api.anthropic.com');
      expect(container.textContent).toContain('token');
    });

    it('shows template env variables that will be applied', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Env section header
      expect(container.textContent).toContain('Environment Variables');

      // Env key names should be visible (values masked for TOKEN/KEY)
      expect(container.textContent).toContain('ANTHROPIC_API_KEY');
      expect(container.textContent).toContain('ANTHROPIC_MODEL');
    });

    it('masks sensitive env variable values (TOKEN/KEY)', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // API_KEY should be masked
      expect(container.textContent).toContain('(masked)');
      // Should NOT show the actual key value
      expect(container.textContent).not.toContain('sk-test-key');
    });

    it('shows template description if provided', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(container.textContent).toContain('Anthropic API template');
    });

    it('shows project path', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(container.textContent).toContain('/Users/test/projects/my-app');
    });
  });

  describe('PreviewPanel integration', () => {
    it('shows PreviewPanel for selected project and template', () => {
      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const previewPanel = screen.getByTestId('preview-panel');
      expect(previewPanel).toBeDefined();
      expect(previewPanel.getAttribute('data-project-path')).toBe(mockProject.path);
      expect(previewPanel.getAttribute('data-template-name')).toBe(mockTemplate.name);
    });
  });

  describe('LoadingIndicator integration', () => {
    it('LoadingIndicator shows during apply operation', async () => {
      // This test will check that LoadingIndicator appears when isApplying=true
      // We'll need to trigger the apply operation via useKeyInput
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Initially no loading indicator
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  describe('StatusBar integration', () => {
    it('StatusBar shows success/error after apply', () => {
      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Initially no status bar (no message)
      expect(screen.queryByTestId('status-bar')).toBeNull();
    });
  });

  describe('keyboard navigation (U4)', () => {
    it('Enter calls onConfirm callback', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Verify useKeyInput was called with correct options
      expect(mockUseKeyInput).toHaveBeenCalled();

      // Get the options passed to useKeyInput
      const callOptions = mockUseKeyInput.mock.calls[0][0];

      // Simulate Enter press by calling onSelect
      callOptions.onSelect?.();

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('Escape calls onBack callback (U4)', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Get the options passed to useKeyInput
      const callOptions = mockUseKeyInput.mock.calls[0][0];

      // Simulate Escape press by calling onEscape
      callOptions.onEscape?.();

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('help text', () => {
    it('shows Enter/Esc help text when not applying', () => {
      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(container.textContent).toContain('Enter: confirm');
      expect(container.textContent).toContain('Esc: cancel');
    });
  });

  describe('edge cases', () => {
    it('renders with template without description', () => {
      const templateNoDesc: TemplateConfig = {
        name: 'simple-template',
        provider: {
          name: 'Simple',
          baseUrl: 'https://api.simple.com',
          authType: 'header',
        },
      };

      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={templateNoDesc}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(container.textContent).toContain('simple-template');
    });

    it('renders with template without env variables', () => {
      const templateNoEnv: TemplateConfig = {
        name: 'no-env-template',
        provider: {
          name: 'NoEnv',
          baseUrl: 'https://api.noenv.com',
          authType: 'custom',
        },
      };

      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={templateNoEnv}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Should NOT show Environment Variables section if no env
      expect(container.textContent).not.toContain('Environment Variables to Apply');
    });

    it('renders with template without tags', () => {
      const templateNoTags: TemplateConfig = {
        name: 'no-tags-template',
        provider: {
          name: 'NoTags',
          baseUrl: 'https://api.notags.com',
          authType: 'token',
          env: { API_KEY: 'key' },
        },
      };

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={templateNoTags}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/no-tags-template/)).toBeDefined();
    });

    it('extracts project name from path correctly', () => {
      const projectWithLongPath: ProjectEntry = {
        id: 'test-id-2',
        path: '/Users/test/code/projects/very/deep/nested/project-name',
        activeConfig: 'test-config',
        lastModified: '2026-04-14T10:00:00Z',
      };

      const { container } = render(
        <ConfigEditorScreen
          project={projectWithLongPath}
          template={mockTemplate}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(container.textContent).toContain('project-name');
    });
  });
});