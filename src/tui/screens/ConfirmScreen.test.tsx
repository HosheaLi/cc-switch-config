/**
 * ConfirmScreen Component Tests
 *
 * Tests full-screen confirmation dialog for destructive actions per D-10.
 * Tests explicit y/n confirmation per U5.
 * Tests escape cancellation per U4.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfirmScreen } from './ConfirmScreen.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, padding, justifyContent, alignItems, marginTop, borderStyle, borderColor }: {
    children: React.ReactNode;
    flexDirection?: string;
    padding?: number;
    justifyContent?: string;
    alignItems?: string;
    marginTop?: number;
    borderStyle?: string;
    borderColor?: string;
  }) => React.createElement('div', {
    'data-flex-direction': flexDirection,
    'data-padding': padding,
    'data-justify-content': justifyContent,
    'data-align-items': alignItems,
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
  useInput: vi.fn(),
}));

describe('ConfirmScreen', () => {
  // Get mocked useInput from ink mock
  const getMockUseInput = async () => {
    const { useInput } = await import('ink');
    return vi.mocked(useInput);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders confirmation message', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Delete template 'production'?"
          actionDescription="This will permanently remove the template configuration."
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('Delete template \'production\'?');
    });

    it('renders action description', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Delete template?"
          actionDescription="This action cannot be undone."
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('This action cannot be undone.');
    });

    it('shows warning icon', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Confirm action"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('WARNING');
    });

    it('shows y/n prompt', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('y');
      expect(container.textContent).toContain('n');
    });
  });

  describe('input handling', () => {
    it('y input calls onConfirm', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Simulate 'y' input
      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };
      handler('y', key);

      expect(onConfirm).toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('Y input (uppercase) calls onConfirm', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };
      handler('Y', key);

      expect(onConfirm).toHaveBeenCalled();
    });

    it('n input calls onCancel', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };
      handler('n', key);

      expect(onCancel).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('N input (uppercase) calls onCancel', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };
      handler('N', key);

      expect(onCancel).toHaveBeenCalled();
    });

    it('Escape calls onCancel (U4)', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: true, return: false };
      handler('', key);

      expect(onCancel).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('Enter does nothing (U5 - explicit confirmation)', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: true };
      handler('', key);

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('other keys do nothing', async () => {
      const mockUseInput = await getMockUseInput();

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };

      // Try various other inputs
      handler('a', key);
      handler('x', key);
      handler('1', key);
      handler(' ', key);

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('visual styling', () => {
    it('warning text is bold and red', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Find the warning text element
      const warningElement = container.querySelector('[data-color="red"][data-bold="true"]');
      expect(warningElement).not.toBeNull();
      expect(warningElement?.textContent).toContain('WARNING');
    });

    it('message text is bold', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Delete this item?"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Find the message text (should be bold)
      const boldElements = container.querySelectorAll('[data-bold="true"]');
      const hasMessageBold = Array.from(boldElements).some(el =>
        el.textContent?.includes('Delete this item?')
      );
      expect(hasMessageBold).toBe(true);
    });

    it('action description has dim styling', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="This is the action description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const dimElement = container.querySelector('[data-dim="true"]');
      expect(dimElement).not.toBeNull();
      expect(dimElement?.textContent).toContain('This is the action description');
    });

    it('y/n prompt is yellow and bold', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const promptElement = container.querySelector('[data-color="yellow"][data-bold="true"]');
      expect(promptElement).not.toBeNull();
      expect(promptElement?.textContent).toContain('y');
      expect(promptElement?.textContent).toContain('n');
    });

    it('action description box has red border', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <ConfirmScreen
          message="Confirm"
          actionDescription="Description"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const borderBox = container.querySelector('[data-border-color="red"]');
      expect(borderBox).not.toBeNull();
    });
  });
});