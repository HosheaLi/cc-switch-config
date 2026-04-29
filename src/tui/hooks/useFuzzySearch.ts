import Fuse, { IFuseOptions } from 'fuse.js';
import { useMemo } from 'react';

/**
 * Interface for items searchable by name and path
 */
export interface SearchableItem {
  /** Item name (displayed in list) */
  name: string;
  /** Item path (absolute or relative) */
  path: string;
}

/** Default fuse.js options for fuzzy search */
const DEFAULT_FUSE_OPTIONS: IFuseOptions<SearchableItem> = {
  keys: ['name', 'path'],
  threshold: 0.4,
  includeMatches: true,
  ignoreLocation: true,
};

/**
 * Hook for fuzzy searching items by name and path.
 *
 * Uses fuse.js with threshold 0.4 for balanced precision/recall.
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
  // Build effective options (merge defaults with caller overrides)
  const effectiveOptions = useMemo<IFuseOptions<T>>(
    () => ({ ...DEFAULT_FUSE_OPTIONS, ...options } as IFuseOptions<T>),
    [options]
  );

  // Create fuse instance (memoized for performance)
  const fuse = useMemo(
    () => new Fuse(items, effectiveOptions),
    [items, effectiveOptions]
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