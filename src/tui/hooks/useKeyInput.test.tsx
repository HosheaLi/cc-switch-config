import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { useInput, Key } from 'ink';

// Mock useInput to capture handler calls
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    useInput: vi.fn(),
  };
});

describe('useKeyInput', () => {
  let mockUseInput: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInput = vi.mocked(useInput);
  });

  it('should call onUp when upArrow key is pressed', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onUp = vi.fn();

    // Create a test component that uses the hook
    const TestComponent = () => {
      useKeyInput({ onUp });
      return null;
    };

    render(<TestComponent />);

    // Simulate upArrow key press
    const handler = mockUseInput.mock.calls[0][0];
    const key: Key = { upArrow: true, downArrow: false, return: false, escape: false } as Key;
    handler('', key);

    expect(onUp).toHaveBeenCalled();
  });

  it('should call onDown when downArrow key is pressed', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onDown = vi.fn();

    const TestComponent = () => {
      useKeyInput({ onDown });
      return null;
    };

    render(<TestComponent />);

    const handler = mockUseInput.mock.calls[0][0];
    const key: Key = { upArrow: false, downArrow: true, return: false, escape: false } as Key;
    handler('', key);

    expect(onDown).toHaveBeenCalled();
  });

  it('should call onUp when "k" input is pressed (vim-style)', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onUp = vi.fn();

    const TestComponent = () => {
      useKeyInput({ onUp });
      return null;
    };

    render(<TestComponent />);

    const handler = mockUseInput.mock.calls[0][0];
    const key: Key = { upArrow: false, downArrow: false, return: false, escape: false } as Key;
    handler('k', key);

    expect(onUp).toHaveBeenCalled();
  });

  it('should call onDown when "j" input is pressed (vim-style)', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onDown = vi.fn();

    const TestComponent = () => {
      useKeyInput({ onDown });
      return null;
    };

    render(<TestComponent />);

    const handler = mockUseInput.mock.calls[0][0];
    const key: Key = { upArrow: false, downArrow: false, return: false, escape: false } as Key;
    handler('j', key);

    expect(onDown).toHaveBeenCalled();
  });

  it('should call onEscape when escape key is pressed', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onEscape = vi.fn();

    const TestComponent = () => {
      useKeyInput({ onEscape });
      return null;
    };

    render(<TestComponent />);

    const handler = mockUseInput.mock.calls[0][0];
    const key: Key = { upArrow: false, downArrow: false, return: false, escape: true } as Key;
    handler('', key);

    expect(onEscape).toHaveBeenCalled();
  });

  it('should call onSelect when return key is pressed', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onSelect = vi.fn();

    const TestComponent = () => {
      useKeyInput({ onSelect });
      return null;
    };

    render(<TestComponent />);

    const handler = mockUseInput.mock.calls[0][0];
    const key: Key = { upArrow: false, downArrow: false, return: true, escape: false } as Key;
    handler('', key);

    expect(onSelect).toHaveBeenCalled();
  });

  it('should not call any callback when isActive=false', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');
    const onUp = vi.fn();
    const onDown = vi.fn();
    const onSelect = vi.fn();
    const onEscape = vi.fn();

    const TestComponent = () => {
      useKeyInput({ onUp, onDown, onSelect, onEscape, isActive: false });
      return null;
    };

    render(<TestComponent />);

    const handler = mockUseInput.mock.calls[0][0];

    // Try all key presses
    const keyUp: Key = { upArrow: true, downArrow: false, return: false, escape: false } as Key;
    handler('', keyUp);

    const keyDown: Key = { upArrow: false, downArrow: true, return: false, escape: false } as Key;
    handler('', keyDown);

    const keyK: Key = { upArrow: false, downArrow: false, return: false, escape: false } as Key;
    handler('k', keyK);

    const keyJ: Key = { upArrow: false, downArrow: false, return: false, escape: false } as Key;
    handler('j', keyJ);

    const keyReturn: Key = { upArrow: false, downArrow: false, return: true, escape: false } as Key;
    handler('', keyReturn);

    const keyEscape: Key = { upArrow: false, downArrow: false, return: false, escape: true } as Key;
    handler('', keyEscape);

    expect(onUp).not.toHaveBeenCalled();
    expect(onDown).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('should pass isActive option to useInput', async () => {
    const { useKeyInput } = await import('./useKeyInput.js');

    const TestComponent = () => {
      useKeyInput({ isActive: false });
      return null;
    };

    render(<TestComponent />);

    // Check that useInput was called with isActive option
    expect(mockUseInput).toHaveBeenCalledWith(expect.any(Function), { isActive: false });
  });
});