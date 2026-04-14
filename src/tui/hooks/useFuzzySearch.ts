import Fuse, { IFuseOptions } from 'fuse.js';
import { useMemo } from 'react';

/**
 * Interface for items searchable by name and path
 * Per F14: Fuzzy Search for quick navigation
 */
export interface SearchableItem {
  /** Item name (displayed in list) */
  name: string;
  /** Item path (absolute or relative) */
  path: string;
}

/**
 * Hook for fuzzy searching items by name and path
 *
 * Per D-06: Instant fuzzy search
 * Per F14: Fuzzy Search for quick navigation
 *
 * Uses fuse.js with threshold 0.4 for balanced precision/recall
 *
 * @param items - Array of searchable items
 * @param query - Search query string
 * @param options - Optional fuse.js configuration overrides
 * @returns Filtered items matching the query
 */
export function useFuzzySearch<T extends SearchableItem>(
  items: T[],
  query: string,
  options?: Partial<IFuseOptions<T>>
): T[] {
  // Default fuse.js options (D-06, F14)
  const defaultOptions: IFuseOptions<T> = {
    keys: ['name', 'path'],         // Search both name and path
    threshold: 0.4,                 // Balance precision vs recall (D-06)
    includeMatches: true,           // Enable match highlighting
    ignoreLocation: true,           // Better for long strings (path names)
    ...options,                     // Allow overrides
  };

  // Create fuse instance (memoized for performance)
  const fuse = useMemo(
    () => new Fuse(items, defaultOptions),
    [items, defaultOptions]
  );

  // Filter items based on query (memoized)
  return useMemo(() => {
    // Return all items if query is empty or whitespace
    if (!query.trim()) {
      return items;
    }

    // Search and extract items from results
    return fuse.search(query).map(result => result.item);
  }, [fuse, query, items]);
}