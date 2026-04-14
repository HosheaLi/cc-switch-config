/**
 * useDelayedLoading Hook Tests
 *
 * Tests threshold-triggered loading behavior per D-08.
 * Spinner shows only after 500ms to avoid visual distraction on fast operations.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDelayedLoading } from './useDelayedLoading.js';

describe('useDelayedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isLoading=false returns showSpinner=false immediately', () => {
    const { result } = renderHook(() => useDelayedLoading(false));
    expect(result.current).toBe(false);
  });

  it('isLoading=true for <500ms returns showSpinner=false', () => {
    const { result } = renderHook(() => useDelayedLoading(true));

    // Advance time by 400ms (less than threshold)
    vi.advanceTimersByTime(400);

    expect(result.current).toBe(false);
  });

  it('isLoading=true for >500ms returns showSpinner=true', async () => {
    const { result } = renderHook(() => useDelayedLoading(true));

    // Initially false
    expect(result.current).toBe(false);

    // Advance time past threshold and wrap in act for state update
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(true);
  });

  it('threshold parameter can be customized', async () => {
    const customThreshold = 200;
    const { result } = renderHook(() => useDelayedLoading(true, customThreshold));

    // Advance time past custom threshold and wrap in act
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  it('cleanup clears timeout when isLoading changes to false', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDelayedLoading(isLoading),
      { initialProps: { isLoading: true } }
    );

    // Start loading
    expect(result.current).toBe(false);

    // Advance to almost threshold
    vi.advanceTimersByTime(400);
    expect(result.current).toBe(false);

    // Change to not loading
    rerender({ isLoading: false });

    // Should immediately be false
    expect(result.current).toBe(false);

    // Advance past original threshold
    vi.advanceTimersByTime(100);

    // Should still be false (timeout was cleared)
    expect(result.current).toBe(false);
  });
});