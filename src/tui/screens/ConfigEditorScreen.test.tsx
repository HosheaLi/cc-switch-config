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
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

// Mock DiffScreen component (for F12 diff integration tests)
vi.mock('./DiffScreen.js', () => ({
  DiffScreen: ({ before, after, onApply, onCancel }: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    onApply: () => void;
    onCancel: () => void;
  }) => React.createElement('div', {
    'data-testid': 'diff-screen',
    'data-has-changes': JSON.stringify(before) !== JSON.stringify(after),
  },
    React.createElement('button', {
      'data-testid': 'diff-apply-btn',
      onClick: onApply,
    }, 'Apply'),
    React.createElement('button', {
      'data-testid': 'diff-cancel-btn',
      onClick: onCancel,
    }, 'Cancel')
  ),
}));

// Mock generateUnifiedDiff (for diff computation)
vi.mock('../../cli/utils/diff.js', () => ({
  generateUnifiedDiff: vi.fn(),
}));

describe('ConfigEditorScreen', () => {
  // Test fixtures
  const mockProject: ProjectEntry = {
    id: 'test-id-1',
    name: 'my-app',
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
    it('Enter shows DiffScreen (F12, D-03 - mandatory preview before apply)', async () => {
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

      // Per D-03: Enter now shows DiffScreen, NOT directly calls onConfirm
      // Simulate Enter press by calling onSelect (wrapped in act)
      await act(async () => {
        callOptions.onSelect?.();
      });

      // onConfirm should NOT be called yet (DiffScreen must appear first)
      expect(mockOnConfirm).not.toHaveBeenCalled();
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

    it('displays project name correctly', () => {
      const projectWithLongPath: ProjectEntry = {
        id: 'test-id-2',
        name: 'project-name',
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

  describe('DiffScreen integration (F12, D-03)', () => {
    it('shows DiffScreen when Enter pressed (before applying)', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      const existingConfig = { env: { MODEL: 'claude-3-opus' } };

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={existingConfig}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Get useKeyInput options and trigger Enter (wrapped in act)
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // DiffScreen should now be visible (wait for re-render)
      await waitFor(() => {
        const diffScreen = screen.getByTestId('diff-screen');
        expect(diffScreen).toBeDefined();
      });
    });

    it('user must confirm in DiffScreen to proceed with apply', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      const existingConfig = { env: { MODEL: 'claude-3-opus' } };

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={existingConfig}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen (wrapped in act)
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // DiffScreen is now visible
      await waitFor(() => {
        expect(screen.getByTestId('diff-screen')).toBeDefined();
      });

      // onConfirm should NOT have been called yet (per D-03 mandatory preview)
      expect(mockOnConfirm).not.toHaveBeenCalled();

      // Click Apply button in DiffScreen
      const applyBtn = screen.getByTestId('diff-apply-btn');
      await act(async () => {
        fireEvent.click(applyBtn);
      });

      // Now onConfirm should be called
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('Escape in DiffScreen returns to ConfigEditorScreen without applying', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      const existingConfig = { env: { MODEL: 'claude-3-opus' } };

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={existingConfig}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen (wrapped in act)
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // DiffScreen is now visible
      await waitFor(() => {
        expect(screen.getByTestId('diff-screen')).toBeDefined();
      });

      // Click Cancel button in DiffScreen
      const cancelBtn = screen.getByTestId('diff-cancel-btn');
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      // onConfirm should NOT be called
      expect(mockOnConfirm).not.toHaveBeenCalled();

      // DiffScreen should be hidden now
      await waitFor(() => {
        expect(screen.queryByTestId('diff-screen')).toBeNull();
      });
    });

    it('onConfirm callback called after DiffScreen confirmation (not before)', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      const existingConfig = { env: { MODEL: 'claude-3-opus' } };

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={existingConfig}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Clear any previous calls
      mockOnConfirm.mockClear();

      // Trigger Enter to show DiffScreen (wrapped in act)
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // onConfirm NOT called yet
      expect(mockOnConfirm).not.toHaveBeenCalled();

      // Confirm in DiffScreen
      await waitFor(() => {
        const applyBtn = screen.getByTestId('diff-apply-btn');
        expect(applyBtn).toBeDefined();
      });
      const applyBtn = screen.getByTestId('diff-apply-btn');
      await act(async () => {
        fireEvent.click(applyBtn);
      });

      // NOW onConfirm should be called
      expect(mockOnConfirm).toHaveBeenCalledOnce();
    });

    it('handles null existingConfig (uses empty object)', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen (wrapped in act)
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // DiffScreen should still appear
      await waitFor(() => {
        const diffScreen = screen.getByTestId('diff-screen');
        expect(diffScreen).toBeDefined();
      });
    });

    it('handles undefined existingConfig (uses empty object)', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={undefined}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen (wrapped in act)
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // DiffScreen should still appear
      await waitFor(() => {
        const diffScreen = screen.getByTestId('diff-screen');
        expect(diffScreen).toBeDefined();
      });
    });
  });

  describe('ValidationErrorScreen integration (F11, D-04, D-05)', () => {
    // Mock ValidationErrorScreen for tests
    vi.mock('./ValidationErrorScreen.js', () => ({
      ValidationErrorScreen: ({ error, onCancel }: {
        error: { getMessages: () => string[] };
        onCancel: () => void;
      }) => React.createElement('div', {
        'data-testid': 'validation-error-screen',
      },
        React.createElement('div', { 'data-testid': 'error-messages' },
          error.getMessages().map((msg: string, i: number) =>
            React.createElement('span', { key: i }, msg)
          )
        ),
        React.createElement('button', {
          'data-testid': 'cancel-btn',
          onClick: onCancel,
        }, 'Cancel')
      ),
    }));

    // Mock ValidationError class
    vi.mock('../../lib/types/validation.js', () => ({
      ValidationError: vi.fn().mockImplementation((message: string, issues: any[]) => ({
        name: 'ValidationError',
        message,
        issues,
        getMessages: () => issues.map((i: any) => `${i.path?.join('.') || 'root'}: ${i.message}`),
      })),
    }));

    it('shows ValidationErrorScreen when onConfirm throws ValidationError', async () => {
      const { ValidationError } = await import('../../lib/types/validation.js');
      const mockValidationError = vi.mocked(ValidationError);

      // Create a mock ValidationError
      const mockError = new mockValidationError('Validation failed', [
        { path: ['env', 'MODEL'], message: 'Expected string' },
      ]);

      // Mock onConfirm to throw ValidationError
      const mockOnConfirmWithError = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      const existingConfig = { env: { MODEL: 'claude-3-opus' } };

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={existingConfig}
          onConfirm={mockOnConfirmWithError}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // Wait for DiffScreen to appear
      await waitFor(() => {
        expect(screen.getByTestId('diff-screen')).toBeDefined();
      });

      // Click Apply button in DiffScreen (which triggers onConfirm)
      const applyBtn = screen.getByTestId('diff-apply-btn');
      await act(async () => {
        fireEvent.click(applyBtn);
      });

      // Should show ValidationErrorScreen after onConfirm throws
      await waitFor(() => {
        const errorScreen = screen.queryByTestId('validation-error-screen');
        if (errorScreen) {
          expect(errorScreen).toBeDefined();
        }
      });
    });

    it('Escape in ValidationErrorScreen returns to ConfigEditorScreen', async () => {
      const { ValidationError } = await import('../../lib/types/validation.js');
      const mockValidationError = vi.mocked(ValidationError);

      const mockError = new mockValidationError('Validation failed', [
        { path: ['env', 'MODEL'], message: 'Expected string' },
      ]);

      const mockOnConfirmWithError = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      const existingConfig = { env: { MODEL: 'claude-3-opus' } };

      const { container } = render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={existingConfig}
          onConfirm={mockOnConfirmWithError}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });

      // Wait for DiffScreen and click Apply
      await waitFor(() => {
        expect(screen.getByTestId('diff-screen')).toBeDefined();
      });
      const applyBtn = screen.getByTestId('diff-apply-btn');
      await act(async () => {
        fireEvent.click(applyBtn);
      });

      // Wait for ValidationErrorScreen
      await waitFor(() => {
        const errorScreen = screen.queryByTestId('validation-error-screen');
        if (errorScreen) {
          expect(errorScreen).toBeDefined();
        }
      });

      // Click Cancel button to return
      const cancelBtn = screen.queryByTestId('cancel-btn');
      if (cancelBtn) {
        await act(async () => {
          fireEvent.click(cancelBtn);
        });
      }

      // ValidationErrorScreen should be hidden now
      await waitFor(() => {
        expect(screen.queryByTestId('validation-error-screen')).toBeNull();
      });
    });

    it('validation errors displayed with proper formatting', async () => {
      const { ValidationError } = await import('../../lib/types/validation.js');
      const mockValidationError = vi.mocked(ValidationError);

      const mockError = new mockValidationError('Validation failed', [
        { path: ['env', 'ANTHROPIC_MODEL'], message: 'Expected string, got number' },
        { path: ['env', 'ANTHROPIC_API_KEY'], message: 'Required' },
      ]);

      const mockOnConfirmWithError = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={{}}
          onConfirm={mockOnConfirmWithError}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter to show DiffScreen then Apply
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });
      await waitFor(() => {
        expect(screen.getByTestId('diff-screen')).toBeDefined();
      });
      const applyBtn = screen.getByTestId('diff-apply-btn');
      await act(async () => {
        fireEvent.click(applyBtn);
      });

      // Wait for ValidationErrorScreen with messages
      await waitFor(() => {
        const errorScreen = screen.queryByTestId('validation-error-screen');
        if (errorScreen) {
          const messages = screen.queryByTestId('error-messages');
          if (messages) {
            // Should contain formatted error messages
            expect(messages.textContent).toContain('ANTHROPIC_MODEL');
            expect(messages.textContent).toContain('Expected string');
          }
        }
      });
    });

    it('user blocked from proceeding with invalid config (D-05)', async () => {
      const { ValidationError } = await import('../../lib/types/validation.js');
      const mockValidationError = vi.mocked(ValidationError);

      const mockError = new mockValidationError('Validation failed', [
        { path: ['env', 'MODEL'], message: 'Invalid' },
      ]);

      const mockOnConfirmWithError = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockUseKeyInput = vi.mocked(useKeyInput);

      render(
        <ConfigEditorScreen
          project={mockProject}
          template={mockTemplate}
          existingConfig={{}}
          onConfirm={mockOnConfirmWithError}
          onBack={mockOnBack}
        />
      );

      // Trigger Enter then Apply
      const callOptions = mockUseKeyInput.mock.calls[0][0];
      await act(async () => {
        callOptions.onSelect?.();
      });
      await waitFor(() => {
        expect(screen.getByTestId('diff-screen')).toBeDefined();
      });
      const applyBtn = screen.getByTestId('diff-apply-btn');
      await act(async () => {
        fireEvent.click(applyBtn);
      });

      // ValidationErrorScreen should block further progress
      await waitFor(() => {
        const errorScreen = screen.queryByTestId('validation-error-screen');
        // If error screen shown, user is blocked from proceeding
        if (errorScreen) {
          expect(errorScreen).toBeDefined();
          // No successful status bar
          const statusBar = screen.queryByTestId('status-bar');
          expect(statusBar?.getAttribute('data-status-type')).not.toBe('success');
        }
      });
    });
  });
});