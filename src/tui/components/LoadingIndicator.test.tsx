/**
 * LoadingIndicator Component Tests
 *
 * Tests threshold-triggered spinner rendering per D-08.
 * Component wraps useDelayedLoading + ink-spinner.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LoadingIndicator } from './LoadingIndicator.js';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  Text: ({ children, color }: { children: React.ReactNode; color?: string }) =>
    React.createElement('span', { 'data-color': color }, children),
}));

// Mock ink-spinner since it has animation that doesn't work well in tests
vi.mock('ink-spinner', () => ({
  default: ({ type }: { type: string }) => React.createElement('span', { 'data-testid': 'spinner' }, `Spinner:${type}`),
}));

describe('LoadingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test the underlying hook behavior
  describe('useDelayedLoading hook integration', () => {
    it('isLoading=false returns showSpinner=false immediately', () => {
      const { result } = renderHook(() => useDelayedLoading(false));
      expect(result.current).toBe(false);
    });

    it('isLoading=true for <500ms returns showSpinner=false', () => {
      const { result } = renderHook(() => useDelayedLoading(true));
      vi.advanceTimersByTime(400);
      expect(result.current).toBe(false);
    });

    it('isLoading=true for >500ms returns showSpinner=true', async () => {
      const { result } = renderHook(() => useDelayedLoading(true));
      expect(result.current).toBe(false);
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe(true);
    });
  });

  // Test component rendering when showSpinner is true
  describe('component rendering', () => {
    it('isLoading=false renders nothing', () => {
      const { container } = render(<LoadingIndicator isLoading={false} />);
      expect(container.innerHTML).toBe('');
    });

    it('renders Spinner with type="dots" by default when showSpinner is true', async () => {
      const { container } = render(<LoadingIndicator isLoading={true} threshold={0} />);

      // Wait for the timer to trigger
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      // The spinner should be rendered
      expect(container.textContent).toContain('Spinner:dots');
    });

    it('custom spinnerType renders different spinner', async () => {
      const { container } = render(<LoadingIndicator isLoading={true} threshold={0} spinnerType="line" />);

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(container.textContent).toContain('Spinner:line');
    });

    it('custom message shows message', async () => {
      const { container } = render(<LoadingIndicator isLoading={true} threshold={0} message="Loading data..." />);

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(container.textContent).toContain('Loading data...');
    });
  });
});

// Helper to use renderHook from @testing-library/react
import { renderHook } from '@testing-library/react';