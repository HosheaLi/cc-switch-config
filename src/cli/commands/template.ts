/**
 * Template Subcommand - Template CRUD Operations
 *
 * Per F7: Custom provider templates - user-defined template CRUD.
 * Per D-07: Mixed style - tpl list/create/delete + -l/-c/-d aliases.
 * Per D-04: One of 4 core commands (template subcommand).
 *
 * Usage:
 * - cc-config template list     (show all templates)
 * - cc-config template l        (alias)
 * - cc-config tpl list          (alias)
 * - cc-config template create <name>  (create template - Phase 06 form)
 * - cc-config template delete <name>  (delete template with confirmation)
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { TemplateService } from '../../lib/services/template-service.js';
import { handleCLIError } from '../output/error.js';
import { TemplateStore } from '../../lib/store/template.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';

/**
 * Register template subcommand with Commander program.
 * Per D-07: Nested subcommands with aliases.
 *
 * @param program - Commander program instance
 */
export function registerTemplateCommand(program: Command): void {
  const template = program
    .command('template')
    .alias('tpl')  // D-07: main command alias
    .description('Manage custom provider templates');

  // template list - show all templates
  template
    .command('list')
    .alias('l')  // D-07: subcommand alias
    .description('List all templates')
    .action(async () => {
      try {
        const templateStore = new TemplateStore();
        const service = new TemplateService(templateStore, readConfig, writeConfig);
        const names = await service.listTemplates();

        if (names.length === 0) {
          console.log(chalk.yellow('No templates saved.'));
          console.log(chalk.gray('Use cc-config template create to add a template.'));
          process.exit(0);
        }

        console.log(chalk.bold('Saved Templates:'));
        for (const name of names) {
          console.log(chalk.white(`  ${name}`));
        }
        console.log(chalk.gray(`\n${names.length} template(s).`));

      } catch (error) {
        handleCLIError(error);
      }
    });

  // template create - create new template (Phase 06 will add interactive form)
  template
    .command('create <name>')
    .alias('c')  // D-07: subcommand alias
    .description('Create a new template')
    .action(async (name: string) => {
      try {
        // Phase 06: Will launch TUI form for template creation
        // Current: Placeholder message
        console.log(chalk.yellow('Interactive template creation coming in Phase 06.'));
        console.log(chalk.gray(`Template name: ${name}`));
        console.log(chalk.gray('For now, create templates manually in templates.json.'));
        process.exit(0);

      } catch (error) {
        handleCLIError(error);
      }
    });

  // template delete - delete template with confirmation (U5)
  template
    .command('delete <name>')
    .alias('d')  // D-07: subcommand alias
    .description('Delete a template')
    .option('-f, --force', 'skip confirmation prompt')
    .action(async (name: string, options: { force?: boolean }) => {
      try {
        // U5: Confirmation prompt for destructive action
        if (!options.force) {
          console.log(chalk.yellow(`Are you sure you want to delete template "${name}"?`));
          console.log(chalk.gray('Use --force to skip confirmation.'));
          console.log(chalk.gray('This action cannot be undone.'));
          process.exit(0);
        }

        const templateStore = new TemplateStore();
        const service = new TemplateService(templateStore, readConfig, writeConfig);

        await service.deleteTemplate(name);

        console.log(chalk.green(`✓ Template "${name}" deleted.`));

      } catch (error) {
        handleCLIError(error);
      }
    });
}