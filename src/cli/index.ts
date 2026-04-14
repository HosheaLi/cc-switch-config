/**
 * CLI Entry Point - Commander Setup
 *
 * Per D-02: Smart mode - no args launches TUI, --help shows help.
 * Per D-08: src/cli/index.ts is CLI entry.
 *
 * Key features:
 * - Commander program setup with name, version, description
 * - Command registration via register functions
 * - NO_COLOR environment variable support
 * - D-02: no args -> launchTUI, args -> parseAsync
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { handleCLIError } from './output/error.js';
import { launchTUI } from './utils/tui-launch.js';
import { registerListCommand } from './commands/list.js';
import { registerSwitchCommand } from './commands/switch.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerTemplateCommand } from './commands/template.js';

// Package version - read from package.json at build time
const VERSION = '0.1.0';

/**
 * Run the CLI application.
 *
 * Per D-02: Smart mode behavior:
 * - No arguments -> launch TUI (Phase 06)
 * - Any arguments -> parse as CLI commands
 *
 * @param argv - Optional argv array (default: process.argv)
 */
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  // Respect NO_COLOR standard (per RESEARCH.md Pitfall 4)
  if (process.env.NO_COLOR) {
    chalk.level = 0;
  }

  const program = new Command();

  program
    .name('cc-config')
    .description('CLI tool for managing Claude Code API provider configurations')
    .version(VERSION, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command')
    .exitOverride(); // Per RESEARCH.md Pitfall 2: capture exit events

  // Register commands (will be implemented in subsequent tasks)
  registerListCommand(program);
  registerSwitchCommand(program); // Stub for Wave 2
  registerCurrentCommand(program); // Stub for Wave 3
  registerTemplateCommand(program); // Stub for Wave 3

  // D-02: Smart mode - no args launches TUI
  const args = argv.slice(2);
  if (args.length === 0) {
    // No arguments - launch TUI (Phase 06 implementation)
    await launchTUI();
  } else {
    // Arguments present - parse as CLI commands
    await program.parseAsync(argv);
  }
}

// Auto-run when executed directly (for shebang entry)
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch(handleCLIError);
}