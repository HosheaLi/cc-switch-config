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
import { colors, formatters } from '../theme/index.js';
import { AppState } from '../../lib/store/state.js';
import { ProjectService } from '../../lib/services/index.js';
import { handleCLIError } from '../output/error.js';
import { createServices } from '../utils/service-factory.js';

/**
 * Execute the current command logic.
 * Extracted for testability.
 *
 * @param appState - AppState instance
 * @param projectService - ProjectService instance
 */
export async function executeCurrentCommand(
  appState: AppState,
  projectService: ProjectService,
  jsonOutput = false
): Promise<void> {
  // Get active project from AppState
  const activeProjectId = appState.getActiveProject();

  if (!activeProjectId) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'No active project set.' }));
    } else {
      console.log(colors.warning('No active project set.'));
      console.log(colors.muted('Use cc-config switch to select a project.'));
    }
    process.exit(0);
  }

  // Get project details
  const project = await projectService.getProjectById(activeProjectId);

  if (!project) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'Active project not found in index.', activeProjectId }));
    } else {
      console.log(colors.warning(`Active project ID ${activeProjectId} not found in index.`));
      console.log(colors.muted('The project may have been removed.'));
    }
    process.exit(0);
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      activeProjectId: project.id,
      name: project.name,
      path: project.path,
      activeConfig: project.activeConfig ?? null,
      lastModified: project.lastModified,
    }, null, 2));
    return;
  }

  // Display current status
  console.log(colors.bold('Current Project:'));
  console.log(colors.foreground(`  Path: ${project.path}`));

  if (project.activeConfig) {
    console.log(colors.success(`  Template: ${project.activeConfig}`));
  } else {
    console.log(colors.muted(`  Template: none`));
  }

  // Show last modified timestamp
  console.log(colors.muted(`  Last Modified: ${project.lastModified}`));
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
    .option('-j, --json', 'output as JSON format')
    .action(async (options) => {
      try {
        const { appState, projectService } = createServices();
        await executeCurrentCommand(appState, projectService, options.json);
      } catch (error) {
        handleCLIError(error);
      }
    });
}