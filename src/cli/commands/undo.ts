/**
 * Undo Command - Undo Last Configuration Modification
 *
 * Per D-07: CLI undo command (TUI U key in next plan).
 * Per D-06: Single undo - restore most recent backup.
 * Per U2: Undo support for config modifications.
 *
 * Usage:
 * - cc-config undo  (restore most recent backup for active project)
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { AppState } from '../../lib/store/state.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { UndoService } from '../../lib/services/undo-service.js';
import { ServiceError } from '../../lib/services/types.js';
import { handleCLIError } from '../output/error.js';

/**
 * Execute the undo command logic.
 * Extracted for testability.
 *
 * @param appState - AppState instance (optional, defaults to new)
 * @param projectIndex - ProjectIndex instance (optional, defaults to new)
 * @param undoService - UndoService instance (optional, defaults to new)
 */
export async function executeUndoCommand(
  appState?: AppState,
  projectIndex?: ProjectIndex,
  undoService?: UndoService
): Promise<void> {
  // Create instances if not provided
  const state = appState ?? new AppState();
  const index = projectIndex ?? new ProjectIndex();

  // Create UndoService with default config path resolver
  const service = undoService ?? new UndoService((projectPath) =>
    `${projectPath}/.claude/settings.json`
  );

  // Get active project from AppState
  const activeProjectId = state.getActiveProject();

  if (!activeProjectId) {
    console.log(chalk.yellow('No active project set.'));
    console.log(chalk.gray('Use cc-config switch to select a project.'));
    process.exit(0);
    return;
  }

  // Get project details
  const project = await index.getById(activeProjectId);

  if (!project) {
    console.log(chalk.yellow(`Active project ID ${activeProjectId} not found in index.`));
    console.log(chalk.gray('The project may have been removed.'));
    process.exit(0);
    return;
  }

  try {
    // Execute undo
    const result = await service.undo(project.path);

    // Calculate time difference for "N minutes ago" format
    const now = new Date();
    const diffMs = now.getTime() - result.backupTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo: string;
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'just now';
    }

    // Output success message per UI-SPEC.md
    console.log(chalk.green('Restored settings.json from backup:'));
    console.log(chalk.white(`  Backup: ${result.backupFilename}`));
    console.log(chalk.white(`  Time: ${timeAgo}`));
    console.log();
    console.log(chalk.gray('Previous configuration has been restored.'));

  } catch (error) {
    if (error instanceof ServiceError && error.code === 'NO_BACKUP') {
      console.log(chalk.yellow('No backup available to undo.'));
      console.log(chalk.gray('No previous configuration backup exists for this project.'));
      return;
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Register undo command with Commander program.
 * Per D-07: CLI undo command (no alias).
 *
 * @param program - Commander program instance
 */
export function registerUndoCommand(program: Command): void {
  program
    .command('undo')
    .description('Undo the last configuration modification')
    .action(async () => {
      try {
        await executeUndoCommand();
      } catch (error) {
        handleCLIError(error);
      }
    });
}