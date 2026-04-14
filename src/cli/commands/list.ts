/**
 * List Command Stub
 *
 * Placeholder for Wave 1 implementation (Task 3).
 * Per F4: List all projects with config status.
 * Per D-01: Mixed style - short alias + explicit command.
 */

import type { Command } from 'commander';

/**
 * Register list command with Commander program.
 * Stub for Task 3 implementation.
 *
 * @param program - Commander program instance
 */
export function registerListCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('Display all registered projects and their config status')
    .option('-j, --json', 'output as JSON format')
    .action(async (options) => {
      console.log('list command stub - Task 3 implementation pending');
    });
}