import type { Command } from 'commander';
export function registerSwitchCommand(program: Command): void {
  program.command('switch').alias('sw').description('Switch active config for a project')
    .argument('[project]', 'Project path or name').argument('[template]', 'Template name to apply')
    .action(async () => { console.log('switch command stub - Wave 2 implementation pending'); });
}
