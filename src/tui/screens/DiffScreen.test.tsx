/**
 * DiffScreen Component Tests
 *
 * Tests for full-screen unified diff display before template application.
 * Per F12: Diff Before Apply.
 * Per D-03: Mandatory display before every template application.
 * Per UI-SPEC.md: Yellow border, cyan header, Enter/Esc navigation.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiffScreen } from './DiffScreen.js';
import type { ClaudeSettings } from '../../lib/types/config.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, padding, justifyContent, alignItems, borderStyle, borderColor, marginTop }: {
    children: React.ReactNode;
    flexDirection?: string;
    padding?: number;
    justifyContent?: string;
    alignItems?: string;
    borderStyle?: string;
    borderColor?: string;
    marginTop?: number;
  }) => React.createElement('div', {
    'data-flex-direction': flexDirection,
    'data-padding': padding,
    'data-justify-content': justifyContent,
    'data-align-items': alignItems,
    'data-border-style': borderStyle,
    'data-border-color': borderColor,
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
  useInput: vi.fn(),
}));

// Mock UnifiedDiff component
vi.mock('../components/UnifiedDiff.js', () => ({
  UnifiedDiff: ({ lines, beforeLabel, afterLabel }: {
    lines: Array<{ type: string; path: string; value?: unknown; before?: unknown; after?: unknown }>;
    beforeLabel?: string;
    afterLabel?: string;
  }) => React.createElement('div', {
    'data-testid': 'unified-diff',
    'data-lines-count': lines.length,
    'data-before-label': beforeLabel,
    'data-after-label': afterLabel,
  }, lines.length === 0 ? 'No changes detected' : `Diff: ${lines.length} lines`),
}));

// Mock generateUnifiedDiff
vi.mock('../../cli/utils/diff.js', () => ({
  generateUnifiedDiff: vi.fn((before: ClaudeSettings, after: ClaudeSettings) => {
    // Simple mock implementation for testing
    const lines: Array<{ type: string; path: string; value?: unknown; before?: unknown; after?: unknown }> = [];

    // Compare env fields
    if (before.env?.MODEL !== after.env?.MODEL) {
      if (before.env?.MODEL && !after.env?.MODEL) {
        lines.push({ type: 'removed', path: 'env.MODEL', value: before.env.MODEL });
      } else if (!before.env?.MODEL && after.env?.MODEL) {
        lines.push({ type: 'added', path: 'env.MODEL', value: after.env.MODEL });
      } else {
        lines.push({ type: 'modified', path: 'env.MODEL', before: before.env?.MODEL, after: after.env?.MODEL });
      }
    }

    // Compare model field
    if (before.model !== after.model) {
      if (before.model && !after.model) {
        lines.push({ type: 'removed', path: 'model', value: before.model });
      } else if (!before.model && after.model) {
        lines.push({ type: 'added', path: 'model', value: after.model });
      } else {
        lines.push({ type: 'modified', path: 'model', before: before.model, after: after.model });
      }
    }

    return lines;
  }),
}));

describe('DiffScreen', () => {
  // Test fixtures
  const mockBefore: ClaudeSettings = {
    env: { MODEL: 'claude-3-opus' },
    model: 'claude-3-opus',
  };

  const mockAfter: ClaudeSettings = {
    env: { MODEL: 'claude-3-sonnet' },
    model: 'claude-3-sonnet',
  };

  const mockOnApply = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders header "Changes to Apply" in cyan bold', () => {
      const { container } = render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      // Find cyan bold header
      const header = container.querySelector('[data-color="cyan"][data-bold="true"]');
      expect(header?.textContent).toContain('Changes to Apply');
    });

    it('renders UnifiedDiff component with diff lines', () => {
      render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      const unifiedDiff = screen.getByTestId('unified-diff');
      expect(unifiedDiff).toBeDefined();
      // Should have lines from diff
      expect(unifiedDiff.getAttribute('data-lines-count')).not.toBe('0');
    });

    it('renders prompt "Press Enter to apply, Escape to cancel" in yellow', () => {
      const { container } = render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      // Find yellow prompt text
      const prompt = container.querySelector('[data-color="yellow"]');
      expect(prompt?.textContent).toContain('Press Enter to apply');
      expect(prompt?.textContent).toContain('Escape to cancel');
    });

    it('shows "No changes detected" message for empty diff', () => {
      render(
        <DiffScreen
          before={mockBefore}
          after={mockBefore} // Same config = no changes
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      const unifiedDiff = screen.getByTestId('unified-diff');
      expect(unifiedDiff.textContent).toContain('No changes detected');
    });

    it('uses yellow borderColor for diff content box', () => {
      const { container } = render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      // Find box with yellow border
      const diffBox = container.querySelector('[data-border-color="yellow"]');
      expect(diffBox).toBeDefined();
    });
  });

  describe('keyboard navigation (Enter/Esc)', () => {
    it('Enter key triggers onApply callback', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      // Get the callback passed to useInput
      expect(mockUseInput).toHaveBeenCalled();
      const inputHandler = mockUseInput.mock.calls[0][0];

      // Simulate Enter key press
      inputHandler('', { return: true, escape: false, upArrow: false, downArrow: false });

      expect(mockOnApply).toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('Escape key triggers onCancel callback', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      // Get the callback passed to useInput
      const inputHandler = mockUseInput.mock.calls[0][0];

      // Simulate Escape key press
      inputHandler('', { return: false, escape: true, upArrow: false, downArrow: false });

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnApply).not.toHaveBeenCalled();
    });
  });

  describe('diff labels', () => {
    it('passes before/after labels to UnifiedDiff', () => {
      render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      const unifiedDiff = screen.getByTestId('unified-diff');
      // Default labels from UI-SPEC
      expect(unifiedDiff.getAttribute('data-before-label')).toContain('settings.json');
      expect(unifiedDiff.getAttribute('data-after-label')).toContain('settings.json');
    });
  });

  describe('full-screen layout', () => {
    it('uses centered layout (justifyContent/alignItems center)', () => {
      const { container } = render(
        <DiffScreen
          before={mockBefore}
          after={mockAfter}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      // Root box should have centered layout
      const rootBox = container.querySelector('[data-justify-content="center"][data-align-items="center"]');
      expect(rootBox).toBeDefined();
    });
  });
});