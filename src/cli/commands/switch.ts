/**
 * Switch Command - Quick Template Switch
 *
 * Per F5: Quick switch command for one-command efficiency.
 * Per D-06: Optional argument + TUI fallback.
 * Per D-04: One of 4 core commands.
 *
 * Usage:
 * - cc-config switch <template-name>  (quick switch)
 * - cc-config sw <template-name>      (alias)
 * - cc-config switch                  (launch TUI selection)
 * - cc-config sw                      (alias, TUI)
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { TemplateService } from '../../lib/services/index.js';
import { handleCLIError } from '../output/error.js';
import { selectTemplateInTUI } from '../utils/tui-launch.js';
import { TemplateStore } from '../../lib/store/template.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';

/**
 * Register switch command with Commander program.
 * Per D-01: 'switch' command with 'sw' alias.
 * Per D-06: Optional [template-name] argument.
 *
 * @param program - Commander program instance
 */
export function registerSwitchCommand(program: Command): void {
  program
    .command('switch [template-name]')
    .alias('sw')  // D-01: short alias
    .description('Switch to a provider template')
    .option('--silent', 'suppress output messages', false)
    .action(async (templateName?: string, options?: { silent?: boolean }) => {
      try {
        // D-06: No template name -> TUI selection
        const targetTemplate = templateName ?? await selectTemplateInTUI();

        // TUI cancelled (returned null)
        if (!targetTemplate) {
          if (!options?.silent) {
            console.log(chalk.yellow('No template selected.'));
          }
          process.exit(0);
        }

        // Create TemplateService (factory pattern)
        const templateStore = new TemplateStore();
        const service = new TemplateService(
          templateStore,
          readConfig,
          writeConfig
        );

        // Apply template to current project directory
        const projectPath = process.cwd();
        await service.applyTemplate(projectPath, targetTemplate);

        // Success message (D-03: colored output)
        if (!options?.silent) {
          console.log(chalk.green(`✓ Switched to template: ${targetTemplate}`));
          console.log(chalk.gray(`Project: ${projectPath}`));
        }

      } catch (error) {
        handleCLIError(error);
      }
    });
}