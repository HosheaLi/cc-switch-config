/**
 * Unregister Command - Remove Project Registration
 *
 * Removes a project from the index without deleting any files.
 * Supports lookup by name, path, or ID.
 */

import type { Command } from 'commander';
import { handleCLIError, ExitCodes } from '../output/error.js';
import { createServices } from '../utils/service-factory.js';
import { colors } from '../theme/index.js';
import { confirmAction } from '../prompts/components/confirm-action.js';

/**
 * Register unregister command with Commander program.
 */
export function registerUnregisterCommand(program: Command): void {
  program
    .command('unregister <project>')
    .description('Remove a project from the index (by name, path, or ID)')
    .option('-f, --force', 'skip confirmation prompt')
    .action(async (identifier: string, options: { force?: boolean }) => {
      try {
        await executeUnregister(identifier, options);
      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Execute unregister operation.
 *
 * @param identifier - Project name, path, or ID
 * @param options - Unregister options
 */
export async function executeUnregister(
  identifier: string,
  options: { force?: boolean }
): Promise<void> {
  const { projectIndex, projectService } = createServices();

  // Resolve identifier to project (by ID, name, or path)
  const project = await projectIndex.resolve(identifier);

  if (!project) {
    console.error(colors.danger(`Project not found: ${identifier}`));
    process.exit(ExitCodes.NOT_FOUND);
    return; // Guard for tests where process.exit is mocked
  }

  // Confirmation
  if (!options.force) {
    const confirmed = await confirmAction(
      `确认取消注册项目 "${project.name}" (${project.path})？`
    );
    if (!confirmed) {
      console.log(colors.muted('已取消'));
      return;
    }
  }

  await projectService.removeProject(project.id);
  console.log(colors.success(`项目 "${project.name}" 已取消注册`));
}
