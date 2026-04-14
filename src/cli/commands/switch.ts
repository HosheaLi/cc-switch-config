/**
 * Switch Command Stub
 *
 * Placeholder for Wave 2 implementation.
 * Per D-04: One of 4 core commands.
 */

import type { Command } from 'commander';

/**
 * Register switch command with Commander program.
 * Stub for Wave 2 implementation.
 *
 * @param program - Commander program instance
 */
export function registerSwitchCommand(program: Command): void {
  program
    .command('switch')
    .alias('sw')
    .description('Switch active config for a project')
    .argument('[project]', 'Project path or name')
    .argument('[template]', 'Template name to apply')
    .action(async (project, template) => {
      console.log('switch command stub - Wave 2 implementation pending');
    });
}