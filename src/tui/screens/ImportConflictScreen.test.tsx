/**
 * ImportConflictScreen Component Tests
 *
 * Tests conflict resolution UI per D-07.
 * Tests number key selection per UI-SPEC.
 * Tests escape cancellation per U4.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ImportConflictScreen, type ImportConflictScreenProps, type ImportStrategy } from './ImportConflictScreen.js';
import type { ConflictField } from '../../lib/types/export-schema.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, padding, marginTop, borderStyle, borderColor, marginBottom }: {
    children: React.ReactNode;
    flexDirection?: string;
    padding?: number;
    marginTop?: number;
    marginBottom?: number;
    borderStyle?: string;
    borderColor?: string;
  }) => React.createElement('div', {
    'data-flex-direction': flexDirection,
    'data-padding': padding,
    'data-margin-top': marginTop,
    'data-margin-bottom': marginBottom,
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
  useInput: vi.fn(),
}));

describe('ImportConflictScreen', () => {
  // Get mocked useInput from ink mock
  const getMockUseInput = async () => {
    const { useInput } = await import('ink');
    return vi.mocked(useInput);
  };

  const mockConflicts: ConflictField[] = [
    { key: 'env.ANTHROPIC_MODEL', imported: 'claude-3-opus', existing: 'claude-2-opus' },
    { key: 'model', imported: 'claude-3-opus', existing: 'claude-2-opus' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders header "Import Conflicts Detected"', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('Import Conflicts Detected');
    });

    it('displays conflict count', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('2 conflicting fields found');
    });

    it('displays resolution option [1] Merge all', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('[1]');
      expect(container.textContent).toContain('Merge all');
    });

    it('displays resolution option [2] Overwrite all', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('[2]');
      expect(container.textContent).toContain('Overwrite all');
    });

    it('displays resolution option [3] Skip all', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('[3]');
      expect(container.textContent).toContain('Skip all');
    });

    it('displays help text', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('1: merge');
      expect(container.textContent).toContain('2: overwrite');
      expect(container.textContent).toContain('3: skip');
      expect(container.textContent).toContain('Esc: cancel import');
    });

    it('displays conflict field keys', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('env.ANTHROPIC_MODEL');
      expect(container.textContent).toContain('model');
    });
  });

  describe('input handling', () => {
    it('1 key calls onResolve with merge', async () => {
      const mockUseInput = await getMockUseInput();

      const onResolve = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false, upArrow: false, downArrow: false };
      handler('1', key);

      expect(onResolve).toHaveBeenCalledWith('merge');
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('2 key calls onResolve with overwrite', async () => {
      const mockUseInput = await getMockUseInput();

      const onResolve = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false, upArrow: false, downArrow: false };
      handler('2', key);

      expect(onResolve).toHaveBeenCalledWith('overwrite');
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('3 key calls onResolve with skip', async () => {
      const mockUseInput = await getMockUseInput();

      const onResolve = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false, upArrow: false, downArrow: false };
      handler('3', key);

      expect(onResolve).toHaveBeenCalledWith('skip');
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('Escape calls onCancel (U4)', async () => {
      const mockUseInput = await getMockUseInput();

      const onResolve = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: true, return: false, upArrow: false, downArrow: false };
      handler('', key);

      expect(onCancel).toHaveBeenCalled();
      expect(onResolve).not.toHaveBeenCalled();
    });
  });

  describe('visual styling', () => {
    it('header is cyan and bold', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      const headerElement = container.querySelector('[data-color="cyan"][data-bold="true"]');
      expect(headerElement).not.toBeNull();
      expect(headerElement?.textContent).toContain('Import Conflicts Detected');
    });

    it('conflict list box has yellow border', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      const borderBox = container.querySelector('[data-border-color="yellow"]');
      expect(borderBox).not.toBeNull();
    });

    it('help text has dim styling', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={mockConflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      // Find all dim elements and check if one contains the help text
      const dimElements = container.querySelectorAll('[data-dim="true"]');
      const hasHelpDim = Array.from(dimElements).some(el =>
        el.textContent?.includes('1: merge') && el.textContent?.includes('Esc: cancel')
      );
      expect(hasHelpDim).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty conflicts array', () => {
      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={[]}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('0 conflicting fields found');
    });

    it('handles null values in conflicts', () => {
      const conflicts: ConflictField[] = [
        { key: 'model', imported: null, existing: 'claude-3' },
      ];

      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={conflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('null');
    });

    it('handles object values in conflicts', () => {
      const conflicts: ConflictField[] = [
        {
          key: 'mcpServers.filesystem',
          imported: { command: 'npx', args: ['server'] },
          existing: { command: 'node' },
        },
      ];

      const onResolve = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ImportConflictScreen
          conflicts={conflicts}
          onResolve={onResolve}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('command');
      expect(container.textContent).toContain('npx');
    });
  });
});

describe('ImportConflictScreenProps interface', () => {
  it('should define conflicts, onResolve, onCancel', () => {
    const props: ImportConflictScreenProps = {
      conflicts: [],
      onResolve: () => {},
      onCancel: () => {},
    };
    expect(props.conflicts).toEqual([]);
    expect(props.onResolve).toBeDefined();
    expect(props.onCancel).toBeDefined();
  });
});

describe('ImportStrategy type', () => {
  it('should accept valid strategies', () => {
    const strategies: ImportStrategy[] = ['merge', 'overwrite', 'skip'];
    expect(strategies).toHaveLength(3);
  });
});