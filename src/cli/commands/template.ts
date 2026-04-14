import type { Command } from 'commander';
export function registerTemplateCommand(program: Command): void {
  program.command('template').alias('tpl').description('Manage custom provider templates')
    .action(async () => { console.log('template command stub - Wave 3 implementation pending'); });
}
