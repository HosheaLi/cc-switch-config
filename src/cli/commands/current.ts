/**
 * Current Command - Display Active Configuration
 *
 * Per F6: Current status display - show active config.
 * Per D-04: One of 4 core commands.
 *
 * Usage:
 * - cc-config current  (show active project and template)
 * - cc-config cur      (alias)
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { AppState } from '../../lib/store/state.js';
import { ProjectService } from '../../lib/services/index.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { handleCLIError } from '../output/error.js';

/**
 * Execute the current command logic.
 * Extracted for testability.
 *
 * @param appState - AppState instance
 * @param projectService - ProjectService instance
 */
export async function executeCurrentCommand(
  appState: AppState,
  projectService: ProjectService
): Promise<void> {
  // Get active project from AppState
  const activeProjectId = appState.getActiveProject();

  if (!activeProjectId) {
    console.log(chalk.yellow('No active project set.'));
    console.log(chalk.gray('Use cc-config switch to select a project.'));
    process.exit(0);
  }

  // Get project details
  const project = await projectService.getProjectById(activeProjectId);

  if (!project) {
    console.log(chalk.yellow(`Active project ID ${activeProjectId} not found in index.`));
    console.log(chalk.gray('The project may have been removed.'));
    process.exit(0);
  }

  // Display current status
  console.log(chalk.bold('Current Project:'));
  console.log(chalk.white(`  Path: ${project.path}`));

  if (project.activeConfig) {
    console.log(chalk.green(`  Template: ${project.activeConfig}`));
  } else {
    console.log(chalk.gray(`  Template: none`));
  }

  // Show last modified timestamp
  console.log(chalk.gray(`  Last Modified: ${project.lastModified}`));
}

/**
 * Register current command with Commander program.
 * Per D-01: 'current' command with 'cur' alias.
 *
 * @param program - Commander program instance
 */
export function registerCurrentCommand(program: Command): void {
  program
    .command('current')
    .alias('cur')
    .description('Display the currently active project and configuration')
    .action(async () => {
      try {
        const appState = new AppState();
        const projectIndex = new ProjectIndex();
        const projectService = new ProjectService(projectIndex, appState);
        await executeCurrentCommand(appState, projectService);
      } catch (error) {
        handleCLIError(error);
      }
    });
}