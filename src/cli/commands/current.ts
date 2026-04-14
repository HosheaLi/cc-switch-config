import type { Command } from 'commander';
export function registerCurrentCommand(program: Command): void {
  program.command('current').alias('cur').description('Display current project and active template')
    .action(async () => { console.log('current command stub - Wave 3 implementation pending'); });
}
