/**
 * Autocomplete Threshold Logic - TUI-04
 *
 * Per D-04: Large lists (>20 items) use prompts autocomplete mode.
 * Small lists use standard select for better UX.
 */

import Fuse from 'fuse.js';
import type { Choice } from 'prompts';

/** Threshold for switching to autocomplete mode */
export const AUTOCOMPLETE_THRESHOLD = 20;

/**
 * Determine prompt type based on item count.
 *
 * @param itemCount - Number of items in the list
 * @returns 'autocomplete' for large lists, 'select' for small lists
 */
export function getPromptType(itemCount: number): 'select' | 'autocomplete' {
  return itemCount > AUTOCOMPLETE_THRESHOLD ? 'autocomplete' : 'select';
}

/**
 * Create fuzzy search suggest function for autocomplete.
 * Uses Fuse.js for better fuzzy matching.
 *
 * @param choices - List of prompt choices
 * @returns Suggest function compatible with prompts autocomplete
 */
export function createFuzzySuggest(choices: Choice[]): (input: string, allChoices: Choice[]) => Promise<Choice[]> {
  const fuse = new Fuse(choices, {
    keys: ['title', 'value'],
    threshold: 0.3, // Lower = stricter matching
    includeScore: true,
  });

  return async (input: string, allChoices: Choice[]): Promise<Choice[]> => {
    if (!input) return allChoices;

    const results = fuse.search(input);
    return results.map(result => result.item);
  };
}

/**
 * Format choice with optional description for better UX.
 *
 * @param title - Display title
 * @param value - Choice value
 * @param description - Optional description shown below
 * @returns Formatted Choice object
 */
export function formatChoice(
  title: string,
  value: string,
  description?: string
): Choice {
  const choice: Choice = { title, value };
  if (description) {
    choice.description = description;
  }
  return choice;
}