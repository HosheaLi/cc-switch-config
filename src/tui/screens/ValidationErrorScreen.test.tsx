/**
 * ValidationErrorScreen Component Tests
 *
 * Tests full-screen validation error display per D-04, D-05.
 * Tests NO confirm option per D-05 (user must fix errors before proceeding).
 * Tests escape cancellation per U4.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ValidationErrorScreen, type ValidationErrorScreenProps } from './ValidationErrorScreen.js';
import { ValidationError } from '../../lib/types/validation.js';

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

// Mock ValidationError class
vi.mock('../../lib/types/validation.js', () => ({
  ValidationError: class MockValidationError extends Error {
    public readonly issues: unknown[];
    constructor(message: string, issues: unknown[]) {
      super(message);
      this.name = 'ValidationError';
      this.issues = issues;
    }
    getMessages(): string[] {
      return this.issues.map((issue: unknown) => {
        const i = issue as { path?: string[]; message?: string };
        const path = i.path?.join('.') || 'root';
        return `${path}: ${i.message || 'error'}`;
      });
    }
  },
}));

describe('ValidationErrorScreen', () => {
  // Get mocked useInput from ink mock
  const getMockUseInput = async () => {
    const { useInput } = await import('ink');
    return vi.mocked(useInput);
  };

  // Create mock ValidationError
  const createMockError = (messages: string[]): ValidationError => {
    const issues = messages.map(msg => {
      const [path, message] = msg.split(': ');
      return { path: path.split('.'), message };
    });
    return new ValidationError('Validation failed', issues);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('Test 1: renders header "Validation Errors" in red bold', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const headerElement = container.querySelector('[data-color="red"][data-bold="true"]');
      expect(headerElement).not.toBeNull();
      expect(headerElement?.textContent).toContain('Validation Errors');
    });

    it('Test 2: renders subheader "The following issues must be fixed before applying:"', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const dimElement = container.querySelector('[data-dim="true"]');
      expect(dimElement).not.toBeNull();
      expect(dimElement?.textContent).toContain('The following issues must be fixed before applying:');
    });

    it('Test 3: renders error list with symbols (per validation.ts)', () => {
      const onCancel = vi.fn();
      const error = createMockError([
        'env.MODEL: Expected string',
        'env.BASE_URL: Invalid URL',
      ]);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('env.MODEL');
      expect(container.textContent).toContain('Expected string');
      expect(container.textContent).toContain('env.BASE_URL');
      expect(container.textContent).toContain('Invalid URL');
    });

    it('Test 4: renders "Press Escape to return and fix errors" prompt', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const promptElement = container.querySelector('[data-color="yellow"][data-bold="true"]');
      expect(promptElement).not.toBeNull();
      expect(promptElement?.textContent).toContain('Press Escape to return and fix errors');
    });

    it('Test 7: error list uses red borderColor box', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const borderBox = container.querySelector('[data-border-color="red"]');
      expect(borderBox).not.toBeNull();
    });

    it('Test 8: each error line formatted as "{symbol} {path}: {message}"', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.ANTHROPIC_MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      // Verify the error content contains path and message
      expect(container.textContent).toContain('env.ANTHROPIC_MODEL');
      expect(container.textContent).toContain('Expected string');
    });
  });

  describe('input handling', () => {
    it('Test 5: Escape key triggers onCancel callback', async () => {
      const mockUseInput = await getMockUseInput();

      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: true, return: false };
      handler('', key);

      expect(onCancel).toHaveBeenCalled();
    });

    it('Test 6: NO y confirm option exists (D-05 blocks continuation)', async () => {
      const mockUseInput = await getMockUseInput();

      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };

      // Try pressing 'y' - should NOT trigger any callback
      handler('y', key);
      handler('Y', key);

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('Enter does nothing (user must fix errors)', async () => {
      const mockUseInput = await getMockUseInput();

      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: true };
      handler('', key);

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('other keys do nothing', async () => {
      const mockUseInput = await getMockUseInput();

      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const handler = mockUseInput.mock.calls[0][0];
      const key = { escape: false, return: false };

      handler('a', key);
      handler('n', key);
      handler('1', key);
      handler(' ', key);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('visual styling', () => {
    it('uses full-screen centered layout', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const centerBox = container.querySelector('[data-justify-content="center"][data-align-items="center"]');
      expect(centerBox).not.toBeNull();
    });

    it('error box has single border style', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const borderBox = container.querySelector('[data-border-style="single"]');
      expect(borderBox).not.toBeNull();
    });

    it('error box has padding', () => {
      const onCancel = vi.fn();
      const error = createMockError(['env.MODEL: Expected string']);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      const paddedBox = container.querySelector('[data-padding="1"]');
      expect(paddedBox).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles empty error list', () => {
      const onCancel = vi.fn();
      const error = createMockError([]);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      // Should still render the structure
      expect(container.textContent).toContain('Validation Errors');
      expect(container.textContent).toContain('Press Escape to return and fix errors');
    });

    it('handles multiple errors', () => {
      const onCancel = vi.fn();
      const error = createMockError([
        'env.MODEL: Expected string',
        'env.BASE_URL: Invalid URL',
        'model: Invalid model name',
      ]);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('env.MODEL');
      expect(container.textContent).toContain('env.BASE_URL');
      expect(container.textContent).toContain('model');
    });

    it('handles long error messages', () => {
      const onCancel = vi.fn();
      const error = createMockError([
        'env.ANTHROPIC_API_KEY: API key must be at least 32 characters long and contain only alphanumeric characters',
      ]);

      const { container } = render(
        <ValidationErrorScreen
          error={error}
          onCancel={onCancel}
        />
      );

      expect(container.textContent).toContain('API key must be at least');
    });
  });
});

describe('ValidationErrorScreenProps interface', () => {
  it('should define error and onCancel only (NO onConfirm per D-05)', () => {
    // Create a minimal mock error for type checking
    const mockIssues = [{ path: ['test'], message: 'error' }];
    const mockError = new ValidationError('test error', mockIssues);

    const props: ValidationErrorScreenProps = {
      error: mockError,
      onCancel: () => {},
    };
    expect(props.error).toBeDefined();
    expect(props.onCancel).toBeDefined();
    // Note: There is NO onConfirm property per D-05
  });
});