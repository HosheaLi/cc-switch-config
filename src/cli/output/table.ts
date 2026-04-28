/**
 * Table Output Formatter
 */
import Table from 'cli-table3';
import chalk from 'chalk';
import type { ProjectEntry } from '../../lib/store/project.js';

export function formatProjectTable(projects: ProjectEntry[]): string {
  if (projects.length === 0) {
    return chalk.yellow('No projects registered.');
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Project'),
      chalk.cyan.bold('Path'),
      chalk.cyan.bold('Config'),
      chalk.cyan.bold('Status'),
    ],
    colWidths: [20, 40, 15, 10],
    style: { head: [], border: ['gray'] },
  });

  for (const project of projects) {
    // Use name with fallback to path basename for legacy data safety
    const projectName = project.name ?? project.path.split('/').pop() ?? project.path;
    const configName = project.activeConfig ? chalk.green(project.activeConfig) : chalk.gray('none');
    const statusIcon = project.activeConfig ? chalk.green('✓') : chalk.yellow('○');

    table.push([chalk.white(projectName), chalk.gray(project.path), configName, statusIcon]);
  }

  return table.toString();
}

export function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path;
  return '...' + path.slice(-maxLength + 3);
}
