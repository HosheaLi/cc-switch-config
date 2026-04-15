/**
 * UnifiedDiff Component Tests
 *
 * Tests for rendering unified diff lines with proper colors.
 * Per D-01: Red for removed, green for added.
 * Per UI-SPEC.md: Git-style unified diff format.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UnifiedDiff } from './UnifiedDiff.js';
import type { DiffLine } from '../../cli/utils/diff.js';

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
  Text: ({ children, color, dimColor }: {
    children: React.ReactNode;
    color?: string;
    dimColor?: boolean;
  }) => React.createElement('span', {
    'data-color': color,
    'data-dim-color': dimColor,
    style: color ? { color } : undefined,
  }, children),
}));

describe('UnifiedDiff', () => {
  it('renders removed lines with red color', () => {
    const lines: DiffLine[] = [
      {
        type: 'removed',
        path: 'env.MODEL',
        value: 'claude-3-opus',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    // Find red-colored text
    const redText = screen.getByText((content, element) => {
      return element?.getAttribute('data-color') === 'red';
    });
    expect(redText).toBeDefined();
    expect(redText.textContent).toContain('- env.MODEL');
  });

  it('renders added lines with green color', () => {
    const lines: DiffLine[] = [
      {
        type: 'added',
        path: 'env.BASE_URL',
        value: 'https://api.example.com',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    // Find green-colored text
    const greenText = screen.getByText((content, element) => {
      return element?.getAttribute('data-color') === 'green';
    });
    expect(greenText).toBeDefined();
    expect(greenText.textContent).toContain('+ env.BASE_URL');
  });

  it('renders modified lines as two lines (red before, green after)', () => {
    const lines: DiffLine[] = [
      {
        type: 'modified',
        path: 'model',
        before: 'claude-3-opus',
        after: 'claude-3-sonnet',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    // Should have both red and green text
    const redText = screen.getByText((content, element) => {
      return element?.getAttribute('data-color') === 'red';
    });
    expect(redText).toBeDefined();
    expect(redText.textContent).toContain('- model');

    const greenText = screen.getByText((content, element) => {
      return element?.getAttribute('data-color') === 'green';
    });
    expect(greenText).toBeDefined();
    expect(greenText.textContent).toContain('+ model');
  });

  it('renders path: value format correctly', () => {
    const lines: DiffLine[] = [
      {
        type: 'added',
        path: 'env.MODEL',
        value: 'claude-3-sonnet',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    expect(screen.getByText(/env\.MODEL/)).toBeDefined();
    expect(screen.getByText(/claude-3-sonnet/)).toBeDefined();
  });

  it('renders "No changes detected" message for empty diffLines', () => {
    render(<UnifiedDiff lines={[]} />);

    expect(screen.getByText(/No changes detected/)).toBeDefined();
  });

  it('renders all lines when given multiple DiffLines', () => {
    const lines: DiffLine[] = [
      {
        type: 'removed',
        path: 'env.MODEL',
        value: 'claude-3-opus',
      },
      {
        type: 'added',
        path: 'env.BASE_URL',
        value: 'https://api.example.com',
      },
      {
        type: 'modified',
        path: 'model',
        before: 'opus',
        after: 'sonnet',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    expect(screen.getByText(/env\.MODEL/)).toBeDefined();
    expect(screen.getByText(/env\.BASE_URL/)).toBeDefined();
    expect(screen.getAllByText(/model/).length).toBe(2); // Modified shows two lines
  });

  it('displays header labels (before/after)', () => {
    const lines: DiffLine[] = [
      {
        type: 'modified',
        path: 'model',
        before: 'opus',
        after: 'sonnet',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    expect(screen.getByText(/---/)).toBeDefined();
    expect(screen.getByText(/\+\+\+/)).toBeDefined();
  });

  it('accepts custom beforeLabel and afterLabel', () => {
    const lines: DiffLine[] = [
      {
        type: 'modified',
        path: 'model',
        before: 'opus',
        after: 'sonnet',
      },
    ];

    render(
      <UnifiedDiff
        lines={lines}
        beforeLabel="--- current settings"
        afterLabel="+++ new settings"
      />
    );

    expect(screen.getByText(/current settings/)).toBeDefined();
    expect(screen.getByText(/new settings/)).toBeDefined();
  });

  it('formats object values with JSON.stringify', () => {
    const lines: DiffLine[] = [
      {
        type: 'added',
        path: 'permissions',
        value: [{ allow: 'Read(**)' }],
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    expect(screen.getByText(/\[/)).toBeDefined();
    expect(screen.getByText(/allow/)).toBeDefined();
  });

  it('displays string values without quotes for readability', () => {
    const lines: DiffLine[] = [
      {
        type: 'added',
        path: 'env.MODEL',
        value: 'claude-3-sonnet',
      },
    ];

    render(<UnifiedDiff lines={lines} />);

    // Should contain the value
    expect(screen.getByText(/claude-3-sonnet/)).toBeDefined();
  });
});