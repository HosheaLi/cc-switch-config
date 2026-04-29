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
import { createInterface } from 'readline';
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

  // template create - interactive CLI form
  template
    .command('create <name>')
    .alias('c')  // D-07: subcommand alias
    .description('Create a new provider template interactively')
    .action(async (name: string) => {
      try {
        const templateStore = new TemplateStore();
        const service = new TemplateService(templateStore, readConfig, writeConfig);

        // Check if template already exists
        const existing = await service.getTemplate(name);
        if (existing) {
          console.error(chalk.red(`Template "${name}" already exists.`));
          console.error(chalk.gray('Use a different name or delete the existing template first.'));
          process.exit(1);
        }

        // Interactive prompts via readline
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const ask = (q: string): Promise<string> =>
          new Promise(resolve => rl.question(q, resolve));

        console.log(chalk.cyan.bold(`Creating template: ${name}`));
        console.log(chalk.gray('Press Enter to use defaults. Env vars can be added later by editing templates.json.\n'));

        const providerName = await ask(chalk.white('Provider name (e.g. openrouter): ')) || 'custom';
        const baseUrl = await ask(chalk.white('Base URL (e.g. https://openrouter.ai/api/v1): ')) || '';
        const authType = await ask(chalk.white('Auth type (bearer/api-key/none): ')) || 'none';

        // Optional env vars
        const env: Record<string, string> = {};
        const envInput = await ask(chalk.white('Env vars as KEY=VALUE (comma-separated, optional): '));
        if (envInput.trim()) {
          for (const pair of envInput.split(',')) {
            const [k, ...v] = pair.trim().split('=');
            if (k) env[k.trim()] = v.join('=').trim();
          }
        }

        rl.close();

        const config = {
          name,
          description: `${providerName} template`,
          provider: {
            name: providerName,
            baseUrl: baseUrl || undefined,
            authType: authType as 'bearer' | 'api-key' | 'none',
            env: Object.keys(env).length > 0 ? env : undefined,
          },
        };

        await service.createTemplate(name, config);
        console.log(chalk.green(`\n✓ Template "${name}" created.`));
        console.log(chalk.gray(`Provider: ${providerName}`));
        if (baseUrl) console.log(chalk.gray(`URL: ${baseUrl}`));
        if (Object.keys(env).length > 0) {
          console.log(chalk.gray('Env vars:'));
          for (const [k, v] of Object.entries(env)) {
            console.log(chalk.gray(`  ${k}: ${k.includes('TOKEN') || k.includes('KEY') ? '(masked)' : v}`));
          }
        }
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