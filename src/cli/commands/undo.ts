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
import { colors, formatters } from '../theme/index.js';
import { AppState } from '../../lib/store/state.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { UndoService } from '../../lib/services/undo-service.js';
import { ServiceError } from '../../lib/services/types.js';
import { handleCLIError } from '../output/error.js';
import { createServices } from '../utils/service-factory.js';
import { getProjectConfigPath } from '../../lib/paths/claude.js';

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
  // All three params must be provided together or not at all
  // Inconsistent state (e.g., projectIndex without appState) would produce wrong results
  const allProvided = appState !== undefined && projectIndex !== undefined;
  const noneProvided = appState === undefined && projectIndex === undefined;
  if (!allProvided && !noneProvided) {
    const defaultSvc = createServices();
    const state = defaultSvc.appState;
    const index = defaultSvc.projectIndex;
    const service = undoService ?? new UndoService(getProjectConfigPath);
    await executeUndoCommand(state, index, service);
    return;
  }
  const defaultSvc = noneProvided ? createServices() : null;
  const state = appState ?? defaultSvc!.appState;
  const index = projectIndex ?? defaultSvc!.projectIndex;

  // Create UndoService with shared path resolver (handles global vs project paths)
  const service = undoService ?? new UndoService(getProjectConfigPath);

  // Get active project from AppState
  const activeProjectId = state.getActiveProject();

  if (!activeProjectId) {
    console.log(colors.warning('No active project set.'));
    console.log(colors.muted('Use cc-config switch to select a project.'));
    process.exit(0);
  }

  // Get project details
  const project = await index.getById(activeProjectId);

  if (!project) {
    console.log(colors.warning(`Active project ID ${activeProjectId} not found in index.`));
    console.log(colors.muted('The project may have been removed.'));
    process.exit(0);
    // process.exit mocked in tests — guard against fallthrough
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
    console.log(formatters.success('Restored settings.json from backup:'));
    console.log(colors.foreground(`  Backup: ${result.backupFilename}`));
    console.log(colors.foreground(`  Time: ${timeAgo}`));
    console.log();
    console.log(colors.muted('Previous configuration has been restored.'));

  } catch (error) {
    if (error instanceof ServiceError && error.code === 'NO_BACKUP') {
      console.log(colors.warning('No backup available to undo.'));
      console.log(colors.muted('No previous configuration backup exists for this project.'));
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