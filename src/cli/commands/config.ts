/**
 * Config Subcommand - API Configuration CRUD Operations
 *
 * Per CFG-03: User can manage API configs via CLI (add/list/remove).
 * Per SEC-02: Validation errors displayed grouped by field type.
 * Per SEC-04: Password type input for API key.
 * Per D-01/D-04: registerConfigCommand pattern matching template.ts.
 *
 * Usage:
 * - cc-config config add       (create new config via prompts)
 * - cc-config config list      (show all configs with masked API keys)
 * - cc-config config l         (alias)
 * - cc-config cfg add          (alias)
 * - cc-config config remove <name>  (delete config with confirmation)
 * - cc-config config rm <name>      (alias)
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { ApiService } from '../../lib/services/api-service.js';
import { ApiConfigStore } from '../../lib/store/api-config.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { inputFullApiConfig } from '../prompts/components/input-api-key.js';
import { handleCLIError, ExitCodes } from '../output/error.js';
import { maskApiKey } from '../../lib/security/api-key.js';
import type { ApiConfig } from '../../lib/types/api-config.js';
import { ValidationError } from '../../lib/types/validation.js';

/**
 * Display validation errors grouped by field type.
 * Per SEC-02/D-11: Grouped display for user-friendly error feedback.
 * Per D-12: chalk.red for titles, chalk.gray for messages.
 * Per D-13: stderr output keeps stdout clean.
 *
 * @param error - ValidationError with issues array
 */
function displayValidationErrors(error: ValidationError): void {
  // D-11: Group by field type
  const groups: Record<string, string[]> = {
    '配置名错误': [],
    'API Key 错误': [],
    'URL 错误': [],
    '模型错误': [],
    '其他错误': [],
  };

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const message = issue.message;

    // T-11-07: Sanitize apiKey values in messages
    const sanitizedMessage = path.includes('apiKey')
      ? message.replace(/sk-[a-zA-Z0-9-]+/g, '***')
      : message;

    // Route to appropriate group (D-11)
    if (path.includes('name')) {
      groups['配置名错误'].push(sanitizedMessage);
    } else if (path.includes('apiKey')) {
      groups['API Key 错误'].push(sanitizedMessage);
    } else if (path.includes('baseUrl')) {
      groups['URL 错误'].push(sanitizedMessage);
    } else if (path.includes('modelName')) {
      groups['模型错误'].push(sanitizedMessage);
    } else {
      groups['其他错误'].push(`${path}: ${sanitizedMessage}`);
    }
  }

  // D-12/D-13: Output to stderr with colors
  for (const [groupTitle, messages] of Object.entries(groups)) {
    if (messages.length > 0) {
      console.error(chalk.red(`✖ ${groupTitle}`));
      for (const msg of messages) {
        console.error(chalk.gray(`  ${msg}`));
      }
      console.error(); // Blank line between groups
    }
  }
}

/**
 * Register config subcommand with Commander program.
 * Per D-01/D-04: Nested subcommands with aliases.
 *
 * @param program - Commander program instance
 */
export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .alias('cfg')  // D-04: main command alias
    .description('Manage API configurations');

  // config add - create new API configuration
  config
    .command('add')
    .description('Add a new API configuration')
    .action(async () => {
      try {
        const apiConfigStore = new ApiConfigStore();
        const service = new ApiService(apiConfigStore, readConfig, writeConfig);

        // D-14: Reuse inputFullApiConfig (SEC-04 password input)
        const result = await inputFullApiConfig();
        if (!result) return; // User cancelled

        // Create ApiConfig with unified mode (D-16)
        const apiConfig: ApiConfig = {
          name: result.name,
          apiKey: result.apiKey,
          baseUrl: result.baseUrl,
          mode: 'unified',
          modelName: result.modelName,
        };

        await service.createConfig(result.name, apiConfig);
        console.log(chalk.green(`✓ 配置 "${result.name}" 已创建`));

      } catch (error) {
        handleCLIError(error);
      }
    });

  // Placeholder for list and remove - will be added in Task 2 and Task 3
}