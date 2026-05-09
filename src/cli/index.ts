/**
 * CLI Entry Point - Commander Setup
 *
 * Per UI-05: NO_COLOR handling centralized in theme module (not manual here).
 * v0.2: 新增仪表盘和快速切换路由。
 */
import { Command } from 'commander';
import { launchTUI } from './utils/cli-launch.js';
import { runOnboardingWizard } from './prompts/wizards/onboarding-wizard.js';
import { runQuickSwitch } from './dashboard/quick-switch.js';
import { createServices } from './utils/service-factory.js';
import { registerListCommand } from './commands/list.js';
import { registerSwitchCommand } from './commands/switch.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerAutoCheckCommand } from './commands/auto-check.js';
import { registerScanCommand } from './commands/scan.js';
import { registerExportCommand } from './commands/export.js';
import { registerImportCommand } from './commands/import.js';
import { registerUndoCommand } from './commands/undo.js';
import { registerRegisterCommand } from './commands/register.js';
import { registerUnregisterCommand } from './commands/unregister.js';
import { registerConfigCommand } from './commands/config.js';

import { VERSION } from '../version.js';

/** Commander 已知子命令名称集合 */
const KNOWN_COMMANDS = new Set([
  'switch', 'sw', 'list', 'ls', 'current', 'cur',
  'scan', 'export', 'import', 'undo', 'config', 'cfg',
  'register', 'unregister', 'auto-check', 'help',
]);

export async function runCLI(argv: string[] = process.argv): Promise<void> {
  const program = new Command();
  program.name('cc-config').description('CLI tool for managing Claude Code API provider configurations')
    .version(VERSION, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command').exitOverride();

  registerListCommand(program);
  registerSwitchCommand(program);
  registerCurrentCommand(program);
  registerConfigCommand(program);
  registerAutoCheckCommand(program);
  registerScanCommand(program);
  registerRegisterCommand(program);
  registerUnregisterCommand(program);
  registerExportCommand(program);
  registerImportCommand(program);
  registerUndoCommand(program);

  const args = argv.slice(2);

  if (args.length === 0) {
    const { appState, apiConfigStore, projectIndex } = createServices();

    const firstRunCompleted = appState.get('firstRunCompleted');
    const hasConfigs = (await apiConfigStore.list()).length > 0;
    const hasProjects = (await projectIndex.getAll()).length > 0;

    if (!firstRunCompleted && !hasConfigs && !hasProjects) {
      await runOnboardingWizard();
      appState.set('firstRunCompleted', true);
    } else {
      await launchTUI();
    }
  } else if (args.length === 1 && !args[0].startsWith('-') && !KNOWN_COMMANDS.has(args[0])) {
    // 快速切换: cc-config <config-name>
    await runQuickSwitch(args[0]);
  } else {
    await program.parseAsync(argv);
  }
}
