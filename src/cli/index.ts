/**
 * CLI Entry Point - Commander Setup
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { handleCLIError } from './output/error.js';
import { launchTUI } from './utils/tui-launch.js';
import { registerListCommand } from './commands/list.js';
import { registerSwitchCommand } from './commands/switch.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerTemplateCommand } from './commands/template.js';
import { registerAutoCheckCommand } from './commands/auto-check.js';

const VERSION = '0.1.0';

export async function runCLI(argv: string[] = process.argv): Promise<void> {
  if (process.env.NO_COLOR) chalk.level = 0;
  
  const program = new Command();
  program.name('cc-config').description('CLI tool for managing Claude Code API provider configurations')
    .version(VERSION, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command').exitOverride();

  registerListCommand(program);
  registerSwitchCommand(program);
  registerCurrentCommand(program);
  registerTemplateCommand(program);
  registerAutoCheckCommand(program);

  const args = argv.slice(2);
  if (args.length === 0) {
    await launchTUI();
  } else {
    await program.parseAsync(argv);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch(handleCLIError);
}
