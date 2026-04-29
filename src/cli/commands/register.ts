/**
 * Register Command - Project Registration
 *
 * Registers a project directory in the project index.
 * Creates a ProjectEntry with UUID, path, and timestamps.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { ProjectService } from '../../lib/services/index.js';
import { ProjectIndex, AppState } from '../../lib/store/index.js';
import { handleCLIError } from '../output/error.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Options for register command.
 */
export interface RegisterOptions {
  /** Optional template to assign after registration */
  template?: string;
}

/**
 * Register register command with Commander program.
 */
export function registerRegisterCommand(program: Command): void {
  program
    .command('register <path>')
    .description('Register a project directory')
    .option('-t, --template <name>', 'assign a template after registration')
    .action(async (projectPath: string, options: RegisterOptions) => {
      try {
        await executeRegister(projectPath, options);
      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Execute register operation.
 *
 * @param projectPath - Path to project directory
 * @param options - Register options
 */
export async function executeRegister(
  projectPath: string,
  options: RegisterOptions
): Promise<void> {
  const projectIndex = new ProjectIndex();
  const appState = new AppState();
  const service = new ProjectService(projectIndex, appState);

  // Expand ~ to home directory
  const expandedPath = projectPath.startsWith('~')
    ? path.join(process.env.HOME ?? '', projectPath.slice(1))
    : path.resolve(projectPath);

  // Check if path exists
  if (!await fs.pathExists(expandedPath)) {
    console.error(chalk.red(`Path does not exist: ${expandedPath}`));
    throw new Error(`Path does not exist: ${expandedPath}`);
  }

  // Check for .claude directory
  const claudeDir = path.join(expandedPath, '.claude');
  const hasSettings = await fs.pathExists(path.join(claudeDir, 'settings.json')) ||
    await fs.pathExists(path.join(claudeDir, 'settings.local.json'));

  if (!hasSettings) {
    console.log(chalk.yellow(`Warning: No .claude/settings.json or settings.local.json found at ${expandedPath}`));
    console.log(chalk.gray('Project will be registered, but may need Claude Code config initialization.'));
  }

  // Register the project
  const entry = await service.registerProject(expandedPath);

  console.log(chalk.green(`Project registered successfully!`));
  console.log(chalk.white(`  Name: ${entry.name}`));
  console.log(chalk.white(`  ID: ${entry.id}`));
  console.log(chalk.white(`  Path: ${entry.path}`));

  // Assign template if specified
  if (options.template) {
    console.log(chalk.gray(`Assigning template: ${options.template}`));
    // Template assignment would require TemplateService integration
    // For now, just update the activeConfig field
    await projectIndex.update(entry.id, { activeConfig: options.template });
    console.log(chalk.green(`Template "${options.template}" assigned.`));
  }
}