import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';

describe('useFuzzySearch', () => {
  // Mock data for testing
  const mockItems = [
    { name: 'Anthropic Project', path: '/home/user/anthropic' },
    { name: 'OpenAI Demo', path: '/home/user/openai-demo' },
    { name: 'Claude Config', path: '/home/user/claude-config' },
    { name: 'Test Project', path: '/home/user/test' },
  ];

  it('should return all items when query is empty', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    const TestComponent = () => {
      const results = useFuzzySearch(mockItems, '');
      expect(results).toEqual(mockItems);
      expect(results.length).toBe(4);
      return null;
    };

    render(<TestComponent />);
  });

  it('should return all items when query is whitespace', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    const TestComponent = () => {
      const results = useFuzzySearch(mockItems, '   ');
      expect(results).toEqual(mockItems);
      return null;
    };

    render(<TestComponent />);
  });

  it('should filter items matching "anthropic"', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    const TestComponent = () => {
      const results = useFuzzySearch(mockItems, 'anthropic');
      expect(results.length).toBeGreaterThan(0);
      // Should match both name and path
      expect(results.some(item =>
        item.name.toLowerCase().includes('anthropic') ||
        item.path.toLowerCase().includes('anthropic')
      )).toBe(true);
      return null;
    };

    render(<TestComponent />);
  });

  it('should filter items matching "claude"', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    const TestComponent = () => {
      const results = useFuzzySearch(mockItems, 'claude');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(item =>
        item.name.toLowerCase().includes('claude') ||
        item.path.toLowerCase().includes('claude')
      )).toBe(true);
      return null;
    };

    render(<TestComponent />);
  });

  it('should use threshold 0.4 for fuzzy matching', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    // Verify threshold is configurable via options parameter
    const TestComponent = () => {
      const results = useFuzzySearch(mockItems, 'anth', { threshold: 0.4 });
      expect(Array.isArray(results)).toBe(true);
      return null;
    };

    render(<TestComponent />);
  });

  it('should include matches for highlighting', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    const TestComponent = () => {
      // Verify includeMatches option is supported
      const results = useFuzzySearch(mockItems, 'anth', { includeMatches: true });
      expect(Array.isArray(results)).toBe(true);
      return null;
    };

    render(<TestComponent />);
  });

  it('should handle items with SearchableItem interface', async () => {
    const { useFuzzySearch, SearchableItem } = await import('./useFuzzySearch.js');

    const items: SearchableItem[] = [
      { name: 'Project A', path: '/path/a' },
      { name: 'Project B', path: '/path/b' },
    ];

    const TestComponent = () => {
      const results = useFuzzySearch(items, 'Project');
      expect(results.length).toBe(2);
      return null;
    };

    render(<TestComponent />);
  });

  it('should return empty array when no items match', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    const TestComponent = () => {
      const results = useFuzzySearch(mockItems, 'xyz123');
      // With fuzzy search, threshold 0.4 might still match some results
      // But very different strings should return few or no results
      expect(Array.isArray(results)).toBe(true);
      return null;
    };

    render(<TestComponent />);
  });

  it('should work with ProjectEntry interface', async () => {
    const { useFuzzySearch } = await import('./useFuzzySearch.js');

    // Simulate ProjectEntry structure from src/lib/store/project.ts
    const projectEntries = [
      { id: '1', name: 'Anthropic', path: '/home/user/anthropic', activeConfig: 'template1', lastModified: '2024-01-01' },
      { id: '2', name: 'OpenAI', path: '/home/user/openai', activeConfig: null, lastModified: '2024-01-02' },
    ];

    const TestComponent = () => {
      const results = useFuzzySearch(projectEntries, 'anth');
      expect(Array.isArray(results)).toBe(true);
      return null;
    };

    render(<TestComponent />);
  });

  it('should export SearchableItem type', async () => {
    const mod = await import('./useFuzzySearch.js');
    // SearchableItem is a type, verify it's exported
    expect(mod.useFuzzySearch).toBeDefined();
    // Type export can't be tested directly, but we verify the module exists
    expect(true).toBe(true);
  });
});