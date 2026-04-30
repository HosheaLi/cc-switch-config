/**
 * Theme Styling - Optional Visual Customization
 *
 * Per UI-01~06: OpenCode Terminal Aesthetic colors and styles.
 */

import chalk from 'chalk';

/**
 * OpenCode color palette (per UI-01)
 */
export const colors = {
  /** Warm background - #201d1d */
  background: chalk.hex('#201d1d'),
  /** Light foreground - #fdfcfc */
  foreground: chalk.hex('#fdfcfc'),
  /** Muted text - #9a9898 */
  muted: chalk.hex('#9a9898'),

  /** Apple HIG semantic colors (per UI-04) */
  accent: chalk.blue,      // Blue - interactive elements
  danger: chalk.red,       // Red - destructive actions
  success: chalk.green,    // Green - success states
  warning: chalk.yellow,   // Orange - warnings (use yellow for terminal)

  /** Functional colors */
  info: chalk.cyan,
  primary: chalk.white,
};

/**
 * Style for prompt messages.
 */
export function styleMessage(message: string): string {
  return colors.accent(message);
}

/**
 * Style for prompt hints/descriptions.
 */
export function styleHint(hint: string): string {
  return colors.muted(hint);
}

/**
 * Style for selected item highlight.
 */
export function styleSelected(text: string): string {
  return colors.success(text);
}

/**
 * Style for cancel/error options.
 */
export function styleCancel(text: string): string {
  return colors.danger(text);
}

/**
 * Style for success messages.
 */
export function styleSuccess(message: string): string {
  return colors.success(`✓ ${message}`);
}

/**
 * Style for error messages.
 */
export function styleError(message: string): string {
  return colors.danger(`✗ ${message}`);
}

/**
 * Style for warning messages.
 */
export function styleWarning(message: string): string {
  return colors.warning(`⚠ ${message}`);
}

/**
 * Create a separator line for visual grouping.
 */
export function separator(width: number = 40): string {
  return colors.muted('─'.repeat(width));
}

/**
 * Respect NO_COLOR environment variable (per UI-05)
 */
export function respectNoColor(): void {
  if (process.env.NO_COLOR) {
    chalk.level = 0;
  }
}