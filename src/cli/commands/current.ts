/**
 * Current Command Stub
 *
 * Placeholder for Wave 3 implementation.
 * Per D-04: One of 4 core commands.
 */

import type { Command } from 'commander';

/**
 * Register current command with Commander program.
 * Stub for Wave 3 implementation.
 *
 * @param program - Commander program instance
 */
export function registerCurrentCommand(program: Command): void {
  program
    .command('current')
    .alias('cur')
    .description('Display current project and active template')
    .action(async () => {
      console.log('current command stub - Wave 3 implementation pending');
    });
}