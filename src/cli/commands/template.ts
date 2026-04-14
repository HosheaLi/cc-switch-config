/**
 * Template Command Stub
 *
 * Placeholder for Wave 3 implementation.
 * Per D-04: One of 4 core commands.
 * Per D-07: Nested CRUD with tpl alias.
 */

import type { Command } from 'commander';

/**
 * Register template command with Commander program.
 * Stub for Wave 3 implementation.
 *
 * @param program - Commander program instance
 */
export function registerTemplateCommand(program: Command): void {
  program
    .command('template')
    .alias('tpl')
    .description('Manage custom provider templates')
    .action(async () => {
      console.log('template command stub - Wave 3 implementation pending');
    });
}