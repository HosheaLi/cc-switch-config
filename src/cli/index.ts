/**
 * CLI Entry Point - Commander Setup
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { AppState } from '../lib/store/state.js';
import { ApiConfigStore } from '../lib/store/api-config.js';
import { ProjectIndex } from '../lib/store/project.js';
import { launchTUI } from './utils/tui-launch.js';
import { launchPromptsTUI } from './prompts/wizards/main-wizard.js';
import { registerListCommand } from './commands/list.js';
import { registerSwitchCommand } from './commands/switch.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerTemplateCommand } from './commands/template.js';
import { registerAutoCheckCommand } from './commands/auto-check.js';
import { registerScanCommand } from './commands/scan.js';
import { registerExportCommand } from './commands/export.js';
import { registerImportCommand } from './commands/import.js';
import { registerUndoCommand } from './commands/undo.js';
import { registerRegisterCommand } from './commands/register.js';
import { registerConfigCommand } from './commands/config.js';

const VERSION = '0.1.0';

export async function runCLI(argv: string[] = process.argv): Promise<void> {
  if (process.env.NO_COLOR) chalk.level = 0;

  const program = new Command();
  program.name('cc-config').description('CLI tool for managing Claude Code API provider configurations')
    .version(VERSION, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command').exitOverride();

  // Phase 05 commands
  registerListCommand(program);
  registerSwitchCommand(program);
  registerCurrentCommand(program);
  registerTemplateCommand(program);

  // Phase 11 commands
  registerConfigCommand(program);

  // Phase 07 commands
  registerAutoCheckCommand(program);
  registerScanCommand(program);
  registerRegisterCommand(program);
  registerExportCommand(program);
  registerImportCommand(program);

  // Phase 08 commands
  registerUndoCommand(program);

  const args = argv.slice(2);

  if (args.length === 0) {
    // D-01: Trigger at no-args invocation
    // D-02: Triple condition check for first-run detection
    const appState = new AppState();
    const apiConfigStore = new ApiConfigStore();
    const projectIndex = new ProjectIndex();

    const firstRunCompleted = appState.get('firstRunCompleted');
    const hasConfigs = (await apiConfigStore.list()).length > 0;
    const hasProjects = (await projectIndex.getAll()).length > 0;

    if (!firstRunCompleted && !hasConfigs && !hasProjects) {
      // Launch first-run wizard
      await launchPromptsTUI();
      // D-04: Set flag after wizard completes
      appState.set('firstRunCompleted', true);
    } else {
      // Normal TUI launch
      await launchTUI();
    }
  } else {
    await program.parseAsync(argv);
  }
}
