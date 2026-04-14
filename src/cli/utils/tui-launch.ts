/**
 * TUI Launch Utility - Stub for Phase 06
 *
 * Per D-02: No args launches TUI.
 * Per D-06: switch without argument calls TUI selection.
 *
 * This is a placeholder implementation for Phase 06 (Core TUI).
 * Phase 06 will replace these stubs with actual Ink-based TUI screens.
 *
 * Current behavior:
 * - launchTUI: Logs placeholder message
 * - selectTemplateInTUI: Returns null (no selection)
 */

import chalk from 'chalk';

/**
 * Launch the main TUI application.
 * Per D-02: Called when no CLI arguments provided.
 *
 * Phase 06 Implementation:
 * - Will render Ink-based TUI with project list
 * - Will handle navigation and selection
 *
 * Current: Placeholder that prints message and exits.
 */
export async function launchTUI(): Promise<void> {
  console.log(chalk.yellow('TUI not implemented yet (Phase 06).'));
  console.log(chalk.gray('Use CLI commands for now:'));
  console.log(chalk.gray('  cc-config list        - Show all projects'));
  console.log(chalk.gray('  cc-config switch <name> - Switch template'));
  console.log(chalk.gray('  cc-config current     - Show active config'));
  console.log(chalk.gray('  cc-config template list - List templates'));
  process.exit(0);
}

/**
 * Launch TUI for template selection.
 * Per D-06: Called when switch command has no argument.
 *
 * Phase 06 Implementation:
 * - Will render template selection list with ink-select
 * - Will handle arrow key navigation
 * - Will return selected template name
 *
 * Current: Placeholder that returns null (no selection).
 *
 * @returns Selected template name or null if cancelled
 */
export async function selectTemplateInTUI(): Promise<string | null> {
  console.log(chalk.yellow('TUI template selection not implemented yet (Phase 06).'));
  console.log(chalk.gray('Please specify a template name: cc-config switch <template-name>'));
  return null;
}