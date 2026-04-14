/**
 * ScanScreen Component Tests
 *
 * Tests multi-select interface for project registration per D-09.
 * Tests checkbox toggle via Space per UI-SPEC.
 * Tests navigation per U3 (arrows + j/k).
 * Tests escape cancellation per U4.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScanScreen } from './ScanScreen.js';
import type { ScanResult } from '../../lib/services/project-service.js';

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
  useInput: vi.fn(),
}));

// Mock hooks
vi.mock('../hooks/useKeyInput.js', () => ({
  useKeyInput: vi.fn(),
}));

vi.mock('../hooks/useNavigation.js', () => ({
  useNavigation: vi.fn(() => ({
    stack: ['scan'],
    current: 'scan',
    isRoot: false,
    push: vi.fn(),
    pop: vi.fn(),
    reset: vi.fn(),
  })),
}));

describe('ScanScreen', () => {
  const mockResults: ScanResult[] = [
    { path: '/test/new-project-alpha', isNew: true },
    { path: '/test/new-project-beta', isNew: true },
    { path: '/test/registered-project', isNew: false },
  ];

  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders header "Scan Results"', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cyanText = container.querySelector('[data-color="cyan"]');
      expect(cyanText?.textContent).toContain('Scan Results');
    });

    it('renders new projects with checkbox indicators', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.textContent).toContain('[ ]');
      expect(container.textContent).toContain('new-project-alpha');
      expect(container.textContent).toContain('new-project-beta');
    });

    it('renders registered projects as dim gray', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Registered project should have dim styling
      const dimElements = container.querySelectorAll('[data-dim="true"]');
      const hasRegisteredText = Array.from(dimElements).some(el =>
        el.textContent?.includes('registered-project')
      );
      expect(hasRegisteredText).toBe(true);
    });

    it('renders count summary', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.textContent).toContain('2 new project(s)');
      expect(container.textContent).toContain('1 already registered');
    });

    it('renders selection count', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.textContent).toContain('0 selected');
    });

    it('renders help text with key bindings', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.textContent).toContain('Space: toggle');
      expect(container.textContent).toContain('Enter: confirm');
      expect(container.textContent).toContain('Esc: cancel');
    });

    it('shows empty state when no new projects', () => {
      const emptyResults: ScanResult[] = [
        { path: '/test/registered-1', isNew: false },
        { path: '/test/registered-2', isNew: false },
      ];

      const { container } = render(
        <ScanScreen
          results={emptyResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.textContent).toContain('No new projects found');
      expect(container.textContent).toContain('already registered');
    });

    it('shows selected project with green color and bold', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // First new project should be selected by default (selectedIndex=0)
      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText).not.toBeNull();
      expect(greenBoldText?.textContent).toContain('new-project-alpha');
    });

    it('checkbox indicator shows checkmark when selected', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Get the useInput handler for Space toggle
      const inputHandler = mockUseInput.mock.calls[0][0];

      // Simulate Space to toggle first project
      inputHandler(' ', { escape: false, return: false });

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Now checkmark should appear
      expect(container.textContent).toContain('[\u2713]');
    });
  });

  describe('navigation', () => {
    it('useKeyInput is called with navigation callbacks', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(mockKeyInput).toHaveBeenCalled();
      const options = mockKeyInput.mock.calls[0][0];
      expect(options.onUp).toBeDefined();
      expect(options.onDown).toBeDefined();
      expect(options.onSelect).toBeDefined();
      expect(options.onEscape).toBeDefined();
    });

    it('onDown callback increments selectedIndex', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];
      options.onDown();

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('new-project-beta');
    });

    it('onUp callback decrements selectedIndex', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];

      // Move down first to index 1
      options.onDown();

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Now move up back to index 0
      options.onUp();

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('new-project-alpha');
    });

    it('navigation does not go below 0', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];

      // Already at 0, pressing up should stay at 0
      options.onUp();

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('new-project-alpha');
    });

    it('navigation does not go beyond last new project', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const options = mockKeyInput.mock.calls[0][0];

      // Go to last new project (index 1)
      options.onDown();
      options.onDown(); // Should stay at 1

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const greenBoldText = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBoldText?.textContent).toContain('new-project-beta');
    });
  });

  describe('selection', () => {
    it('Space toggles selection on focused item', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const inputHandler = mockUseInput.mock.calls[0][0];

      // Toggle first project
      inputHandler(' ', { escape: false, return: false });

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Selection count should show 1 selected
      expect(container.textContent).toContain('1 selected');
    });

    it('Space toggles selection off', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);

      const { container, rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const inputHandler = mockUseInput.mock.calls[0][0];

      // Toggle on
      inputHandler(' ', { escape: false, return: false });

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Toggle off
      inputHandler(' ', { escape: false, return: false });

      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.textContent).toContain('0 selected');
    });

    it('Enter calls onConfirm with selected paths', async () => {
      const { useInput } = await import('ink');
      const mockUseInput = vi.mocked(useInput);
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      const { rerender } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Toggle first project via Space
      const inputHandler = mockUseInput.mock.calls[0][0];
      inputHandler(' ', { escape: false, return: false });

      // Rerender to apply state update
      rerender(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Get the latest useKeyInput callback (after rerender)
      // Note: useKeyInput is called again on rerender, capturing the current state
      const latestKeyOptions = mockKeyInput.mock.calls[mockKeyInput.mock.calls.length - 1][0];
      latestKeyOptions.onSelect();

      expect(mockOnConfirm).toHaveBeenCalledWith(['/test/new-project-alpha']);
    });

    it('Enter does nothing when no selection', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);

      render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const keyOptions = mockKeyInput.mock.calls[0][0];
      keyOptions.onSelect(); // No selection

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('Escape calls onCancel and pop', async () => {
      const { useKeyInput } = await import('../hooks/useKeyInput.js');
      const mockKeyInput = vi.mocked(useKeyInput);
      const { useNavigation } = await import('../hooks/useNavigation.js');
      const mockNavigation = vi.mocked(useNavigation);

      render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const keyOptions = mockKeyInput.mock.calls[0][0];
      keyOptions.onEscape();

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockNavigation.mock.results[0].value.pop).toHaveBeenCalled();
    });
  });

  describe('visual styling', () => {
    it('selected item has green color and bold', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const greenBold = container.querySelector('[data-color="green"][data-bold="true"]');
      expect(greenBold).not.toBeNull();
    });

    it('unselected new items have white color', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const whiteText = container.querySelectorAll('[data-color="white"]');
      expect(whiteText.length).toBeGreaterThan(0);
    });

    it('registered items have dim styling', () => {
      const { container } = render(
        <ScanScreen
          results={mockResults}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dimElements = container.querySelectorAll('[data-dim="true"]');
      const hasRegistered = Array.from(dimElements).some(el =>
        el.textContent?.includes('registered')
      );
      expect(hasRegistered).toBe(true);
    });
  });
});