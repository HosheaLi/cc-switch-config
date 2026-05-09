/**
 * List Command - Display All Projects
 *
 * Per F4: List all projects with config status.
 * Per D-01: Mixed style - short alias + explicit command.
 * Per D-04: One of 4 core commands.
 */

import type { Command } from 'commander';
import { colors } from '../theme/index.js';
import { formatProjectTable } from '../output/table.js';
import { handleCLIError } from '../output/error.js';
import { createServices } from '../utils/service-factory.js';

/**
 * Register list command with Commander program.
 * Per D-01: 'list' command with 'ls' alias.
 */
export function registerListCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('Display all registered projects and their config status')
    .option('-j, --json', 'output as JSON format')
    .action(async (options) => {
      try {
        const { projectService } = createServices();

        const projects = await projectService.listProjects();

        if (options.json) {
          console.log(JSON.stringify(projects, null, 2));
        } else {
          const table = formatProjectTable(projects);
          console.log(table);

          if (projects.length > 0) {
            console.log(colors.muted(`\n${projects.length} project(s) registered.`));
          }
        }
      } catch (error) {
        handleCLIError(error);
      }
    });
}
