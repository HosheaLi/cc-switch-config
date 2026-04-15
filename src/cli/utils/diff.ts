/**
 * Diff Generation Utilities
 *
 * Generates unified diff representation for Claude Code settings comparison.
 * Per D-01: Git-style unified diff format for config changes.
 * Per D-02: Only show changed fields, not entire config.
 *
 * Uses deep-object-diff for object comparison and converts to DiffLine format.
 */

import { diff as deepDiff, addedDiff, deletedDiff, updatedDiff } from 'deep-object-diff';
import type { ClaudeSettings } from '../../lib/types/config.js';

/**
 * Diff line representation for unified diff display.
 *
 * Per UI-SPEC.md:
 * - 'removed': Field deleted from config (value shows old value)
 * - 'added': New field added to config (value shows new value)
 * - 'modified': Field value changed (before/after show old/new values)
 */
export interface DiffLine {
  type: 'added' | 'removed' | 'modified';
  path: string;
  value?: unknown; // for added/removed
  before?: unknown; // for modified
  after?: unknown; // for modified
}

/**
 * Generate unified diff lines comparing before/after configs.
 *
 * Per D-01: Produces git-style unified diff representation.
 * Per D-02: Only includes fields that actually changed.
 *
 * Arrays are treated as atomic values (entire array comparison, not element-by-element).
 * Per D-04 research: Arrays REPLACE, not merge element-by-element.
 *
 * @param before - Original config
 * @param after - Modified config
 * @returns Array of DiffLine sorted by path
 */
export function generateUnifiedDiff(
  before: ClaudeSettings,
  after: ClaudeSettings
): DiffLine[] {
  const lines: DiffLine[] = [];

  // Compare all top-level keys
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeValue = before[key as keyof ClaudeSettings];
    const afterValue = after[key as keyof ClaudeSettings];

    // Handle arrays specially - compare as atomic values
    if (Array.isArray(beforeValue) || Array.isArray(afterValue)) {
      if (!Array.isArray(beforeValue) && Array.isArray(afterValue)) {
        // Array added
        lines.push({
          type: 'added',
          path: key,
          value: afterValue,
        });
      } else if (Array.isArray(beforeValue) && !Array.isArray(afterValue)) {
        // Array removed
        lines.push({
          type: 'removed',
          path: key,
          value: beforeValue,
        });
      } else if (
        Array.isArray(beforeValue) &&
        Array.isArray(afterValue) &&
        JSON.stringify(beforeValue) !== JSON.stringify(afterValue)
      ) {
        // Array modified - show as single atomic change
        lines.push({
          type: 'modified',
          path: key,
          before: beforeValue,
          after: afterValue,
        });
      }
      continue; // Skip deep-object-diff for arrays
    }

    // For non-array fields, use deep-object-diff
    if (beforeValue === undefined && afterValue !== undefined) {
      // Field added
      if (typeof afterValue === 'object' && afterValue !== null) {
        // Added object - expand to show nested fields
        collectDiffLines(
          afterValue as Record<string, unknown>,
          'added',
          key,
          lines
        );
      } else {
        // Added primitive
        lines.push({
          type: 'added',
          path: key,
          value: afterValue,
        });
      }
    } else if (beforeValue !== undefined && afterValue === undefined) {
      // Field removed
      if (typeof beforeValue === 'object' && beforeValue !== null) {
        // Removed object - expand to show nested fields
        collectDiffLines(
          beforeValue as Record<string, unknown>,
          'removed',
          key,
          lines
        );
      } else {
        // Removed primitive
        lines.push({
          type: 'removed',
          path: key,
          value: beforeValue,
        });
      }
    } else if (beforeValue !== undefined && afterValue !== undefined) {
      // Both exist - check for modification
      if (
        typeof beforeValue === 'object' &&
        typeof afterValue === 'object' &&
        beforeValue !== null &&
        afterValue !== null
      ) {
        // Both are objects - use deep-object-diff
        const updated = updatedDiff(
          { [key]: beforeValue },
          { [key]: afterValue }
        )[key] as Record<string, unknown>;
        if (updated && Object.keys(updated).length > 0) {
          collectModifiedLines(
            beforeValue as Record<string, unknown>,
            afterValue as Record<string, unknown>,
            updated,
            key,
            lines
          );
        }
      } else if (beforeValue !== afterValue) {
        // Primitives changed
        lines.push({
          type: 'modified',
          path: key,
          before: beforeValue,
          after: afterValue,
        });
      }
    }
  }

  // Sort by path for consistent ordering
  lines.sort((a, b) => a.path.localeCompare(b.path));

  return lines;
}

/**
 * Filter and return only field paths that differ between before/after.
 *
 * Arrays are treated as atomic values (entire array comparison).
 *
 * @param before - Original config
 * @param after - Modified config
 * @returns Array of dot-notation paths that changed
 */
export function filterChangedFields(before: ClaudeSettings, after: ClaudeSettings): string[] {
  const paths: string[] = [];

  // Compare all top-level keys
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeValue = before[key as keyof ClaudeSettings];
    const afterValue = after[key as keyof ClaudeSettings];

    // Handle arrays specially - compare as atomic values
    if (Array.isArray(beforeValue) || Array.isArray(afterValue)) {
      if (!Array.isArray(beforeValue) && Array.isArray(afterValue)) {
        paths.push(key); // Array added
      } else if (Array.isArray(beforeValue) && !Array.isArray(afterValue)) {
        paths.push(key); // Array removed
      } else if (
        Array.isArray(beforeValue) &&
        Array.isArray(afterValue) &&
        JSON.stringify(beforeValue) !== JSON.stringify(afterValue)
      ) {
        paths.push(key); // Array modified
      }
      continue;
    }

    // For non-array fields, use deep-object-diff
    if (beforeValue === undefined && afterValue !== undefined) {
      // Field added
      if (typeof afterValue === 'object' && afterValue !== null) {
        paths.push(...collectPaths(afterValue as Record<string, unknown>, key));
      } else {
        paths.push(key);
      }
    } else if (beforeValue !== undefined && afterValue === undefined) {
      // Field removed
      if (typeof beforeValue === 'object' && beforeValue !== null) {
        paths.push(...collectPaths(beforeValue as Record<string, unknown>, key));
      } else {
        paths.push(key);
      }
    } else if (beforeValue !== undefined && afterValue !== undefined) {
      // Both exist - check for modification
      if (
        typeof beforeValue === 'object' &&
        typeof afterValue === 'object' &&
        beforeValue !== null &&
        afterValue !== null
      ) {
        // Both are objects - use deep-object-diff
        const changed = deepDiff(
          { [key]: beforeValue },
          { [key]: afterValue }
        )[key] as Record<string, unknown>;
        if (changed && Object.keys(changed).length > 0) {
          paths.push(...collectPaths(changed, key));
        }
      } else if (beforeValue !== afterValue) {
        // Primitives changed
        paths.push(key);
      }
    }
  }

  return paths;
}

/**
 * Collect diff lines for added/deleted fields.
 *
 * Recursively traverses diff object and creates DiffLine entries.
 * Uses dot notation for nested paths.
 */
function collectDiffLines(
  obj: Record<string, unknown>,
  type: 'added' | 'removed',
  prefix: string,
  lines: DiffLine[]
): void {
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    // Check if this is a nested object (not array, not null)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested object
      collectDiffLines(value as Record<string, unknown>, type, path, lines);
    } else {
      // Primitive value or array - create diff line
      lines.push({
        type,
        path,
        value,
      });
    }
  }
}

/**
 * Collect diff lines for modified fields.
 *
 * Modified fields show both before and after values.
 */
function collectModifiedLines(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  updated: Record<string, unknown>,
  prefix: string,
  lines: DiffLine[]
): void {
  for (const key in updated) {
    const path = prefix ? `${prefix}.${key}` : key;
    const beforeValue = (before as Record<string, unknown>)[key];
    const afterValue = (after as Record<string, unknown>)[key];

    // Check if this is a nested object
    if (
      beforeValue !== null &&
      afterValue !== null &&
      typeof beforeValue === 'object' &&
      typeof afterValue === 'object' &&
      !Array.isArray(beforeValue) &&
      !Array.isArray(afterValue)
    ) {
      // Recurse into nested object
      collectModifiedLines(
        beforeValue as Record<string, unknown>,
        afterValue as Record<string, unknown>,
        updated[key] as Record<string, unknown>,
        path,
        lines
      );
    } else {
      // Primitive value or array - create diff line with before/after
      lines.push({
        type: 'modified',
        path,
        before: beforeValue,
        after: afterValue,
      });
    }
  }
}

/**
 * Collect all paths from a diff object.
 *
 * Returns dot-notation paths for all changed fields.
 */
function collectPaths(obj: Record<string, unknown>, prefix: string): string[] {
  const paths: string[] = [];

  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    // Check if this is a nested object
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse and collect nested paths
      paths.push(...collectPaths(value as Record<string, unknown>, path));
    } else {
      // Primitive or array - add path
      paths.push(path);
    }
  }

  return paths;
}