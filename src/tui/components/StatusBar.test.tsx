/**
 * StatusBar Component Tests
 *
 * Tests status bar error display per D-11.
 * Tests visual feedback with colors per D-07.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBar, StatusType } from './StatusBar.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, borderStyle, borderColor, marginTop }: {
    children: React.ReactNode;
    borderStyle?: string;
    borderColor?: string;
    marginTop?: number;
  }) => React.createElement('div', {
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
}));

describe('StatusBar', () => {
  describe('rendering', () => {
    it('no message renders nothing', () => {
      const { container } = render(<StatusBar message={null} type="none" />);
      expect(container.innerHTML).toBe('');
    });

    it('type="none" renders nothing even with message', () => {
      const { container } = render(<StatusBar message="Some message" type="none" />);
      expect(container.innerHTML).toBe('');
    });

    it('error message renders with color="red"', () => {
      const { container } = render(<StatusBar message="Error occurred" type="error" />);
      const textElement = container.querySelector('[data-color="red"]');
      expect(textElement).not.toBeNull();
      expect(textElement?.textContent).toContain('Error occurred');
    });

    it('success message renders with color="green"', () => {
      const { container } = render(<StatusBar message="Operation successful" type="success" />);
      const textElement = container.querySelector('[data-color="green"]');
      expect(textElement).not.toBeNull();
      expect(textElement?.textContent).toContain('Operation successful');
    });

    it('info message renders with color="cyan"', () => {
      const { container } = render(<StatusBar message="Information" type="info" />);
      const textElement = container.querySelector('[data-color="cyan"]');
      expect(textElement).not.toBeNull();
      expect(textElement?.textContent).toContain('Information');
    });

    it('warning message renders with color="yellow"', () => {
      const { container } = render(<StatusBar message="Warning message" type="warning" />);
      const textElement = container.querySelector('[data-color="yellow"]');
      expect(textElement).not.toBeNull();
      expect(textElement?.textContent).toContain('Warning message');
    });
  });

  describe('visual indicators', () => {
    it('error message has bold styling', () => {
      const { container } = render(<StatusBar message="Error" type="error" />);
      const textElement = container.querySelector('[data-bold="true"]');
      expect(textElement).not.toBeNull();
    });

    it('error message shows warning icon', () => {
      const { container } = render(<StatusBar message="Error" type="error" />);
      expect(container.textContent).toContain('⚠');
    });

    it('success message shows checkmark icon', () => {
      const { container } = render(<StatusBar message="Success" type="success" />);
      expect(container.textContent).toContain('✓');
    });

    it('info and warning messages have no icon prefix', () => {
      const { container: container1 } = render(<StatusBar message="Info" type="info" />);
      const { container: container2 } = render(<StatusBar message="Warning" type="warning" />);

      // Should not contain warning or checkmark icons
      expect(container1.textContent).not.toContain('⚠');
      expect(container1.textContent).not.toContain('✓');
      expect(container2.textContent).not.toContain('⚠');
      expect(container2.textContent).not.toContain('✓');
    });
  });

  describe('container styling', () => {
    it('has borderStyle="single"', () => {
      const { container } = render(<StatusBar message="Test" type="info" />);
      const boxElement = container.querySelector('[data-border-style="single"]');
      expect(boxElement).not.toBeNull();
    });

    it('has borderColor="gray"', () => {
      const { container } = render(<StatusBar message="Test" type="info" />);
      const boxElement = container.querySelector('[data-border-color="gray"]');
      expect(boxElement).not.toBeNull();
    });

    it('has marginTop={1}', () => {
      const { container } = render(<StatusBar message="Test" type="info" />);
      const boxElement = container.querySelector('[data-margin-top="1"]');
      expect(boxElement).not.toBeNull();
    });
  });

  describe('StatusType export', () => {
    it('exports StatusType type', () => {
      // Type is exported, runtime check just verifies module exports
      const types: StatusType[] = ['error', 'success', 'info', 'warning', 'none'];
      expect(types.length).toBe(5);
    });
  });
});